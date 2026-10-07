"""Security utilities: password hashing, JWT encoding/decoding, and auth dependencies."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import bcrypt
import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db

bearer_scheme = HTTPBearer(auto_error=True)


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_access_token(
    data: Dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed JWT access token containing arbitrary payload data."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token signature and expiration.

    Raises HTTPException 401 if invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_token_payload(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> Dict[str, Any]:
    """FastAPI dependency to extract and decode the JWT payload."""
    return decode_access_token(credentials.credentials)


def get_current_tenant_id(
    payload: Dict[str, Any] = Depends(get_current_token_payload),
) -> uuid.UUID:
    """FastAPI dependency that extracts and returns tenant_id as a UUID.

    Every protected endpoint uses this to ensure all queries are tenant-scoped.
    """
    tenant_id_raw = payload.get("tenant_id")
    if not tenant_id_raw:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing tenant_id claim",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return uuid.UUID(str(tenant_id_raw))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid tenant_id format in token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    db: Session = Depends(get_db),
    payload: Dict[str, Any] = Depends(get_current_token_payload),
):
    """FastAPI dependency that returns the authenticated User DB model.

    Ensures both user_id and tenant_id match the token.
    """
    from app.models.user import User

    user_id_raw = payload.get("user_id")
    tenant_id = get_current_tenant_id(payload)

    if not user_id_raw:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user_id claim",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_uuid = uuid.UUID(str(user_id_raw))
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user_id format in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = (
        db.query(User)
        .filter(User.id == user_uuid, User.tenant_id == tenant_id)
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or does not belong to tenant",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_tenant_by_api_key(
    x_public_key: Optional[str] = Header(None, alias="X-Public-Key"),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    """FastAPI dependency resolving Tenant from public API key for widget chat."""
    from app.models.api_key import ApiKey

    key = x_public_key
    if not key and authorization:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            key = parts[1]
        elif len(parts) == 1:
            key = parts[0]

    if not key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Public API key missing. Provide 'X-Public-Key' header or 'Authorization: Bearer <key>'.",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    api_key_record = (
        db.query(ApiKey)
        .filter(ApiKey.public_key == key)
        .first()
    )
    if not api_key_record or not api_key_record.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive public API key",
            headers={"WWW-Authenticate": "ApiKey"},
        )

    tenant = api_key_record.tenant
    if not tenant or tenant.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization account is suspended or inactive",
        )

    return tenant


def get_tenant_id_by_api_key(
    tenant=Depends(get_tenant_by_api_key),
) -> uuid.UUID:
    """FastAPI dependency extracting tenant_id UUID from validated public API key."""
    return tenant.id

