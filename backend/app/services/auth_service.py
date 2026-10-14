"""Business logic for authentication, tenant onboarding, and user sessions."""

import re
import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.api_key import ApiKey
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    UserMeResponse,
)


def slugify(text: str) -> str:
    """Convert text to URL-friendly lowercase kebab-case slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = text.strip("-")
    return text or "workspace"


def generate_unique_slug(db: Session, company_name: str) -> str:
    """Generate a unique slug from company name, appending random suffix if collision occurs."""
    base_slug = slugify(company_name)[:40]
    candidate = base_slug
    while db.query(Tenant).filter(Tenant.slug == candidate).first():
        suffix = uuid.uuid4().hex[:6]
        candidate = f"{base_slug}-{suffix}"
    return candidate


def generate_public_key() -> str:
    """Generate an API public key for widget embedding."""
    return f"bf_pub_{uuid.uuid4().hex}"


def login_user(db: Session, req: LoginRequest) -> LoginResponse:
    """Authenticate user with email and password and return a JWT access token."""
    email_clean = req.email.lower().strip()

    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify user account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your user account is deactivated. Please contact support.",
        )

    # Verify tenant status is active (superadmins bypass tenant suspension)
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if user.role != "superadmin" and (not tenant or tenant.status != "active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your organization account is not active. Please contact support.",
        )

    token = create_access_token(
        {
            "user_id": str(user.id),
            "tenant_id": str(tenant.id) if tenant else "",
            "role": user.role,
        }
    )

    return LoginResponse(
        access_token=token,
        tenant_id=tenant.id if tenant else user.tenant_id,
        role=user.role,
        token_type="bearer",
    )


def get_user_profile(user: User) -> UserMeResponse:
    """Transform user model to profile response schema."""
    return UserMeResponse(
        user_id=user.id,
        tenant_id=user.tenant_id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        company_name=user.tenant.name if user.tenant else "",
    )
