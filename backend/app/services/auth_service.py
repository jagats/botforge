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
    SignupRequest,
    SignupResponse,
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


def signup_tenant(db: Session, req: SignupRequest) -> SignupResponse:
    """Onboard a new tenant, owner user, and widget public API key in an atomic transaction."""
    email_clean = req.email.lower().strip()

    # 1. Enforce globally unique email
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists",
        )

    # 2. Generate slug and hash password
    slug = generate_unique_slug(db, req.company_name)
    hashed_pwd = hash_password(req.password)

    try:
        # 3. Create Tenant
        tenant = Tenant(
            name=req.company_name.strip(),
            slug=slug,
            plan="trial",
            status="active",
        )
        db.add(tenant)
        db.flush()

        # 4. Create Owner User
        user = User(
            tenant_id=tenant.id,
            email=email_clean,
            hashed_password=hashed_pwd,
            role="owner",
        )
        db.add(user)
        db.flush()

        # 5. Create Default Widget API Key
        api_key = ApiKey(
            tenant_id=tenant.id,
            public_key=generate_public_key(),
            is_active=True,
        )
        db.add(api_key)

        db.commit()
        db.refresh(tenant)
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete registration transaction",
        ) from e

    # 6. Issue JWT Token
    token = create_access_token(
        {
            "user_id": str(user.id),
            "tenant_id": str(tenant.id),
            "role": user.role,
        }
    )

    return SignupResponse(
        tenant_id=tenant.id,
        user_id=user.id,
        access_token=token,
        token_type="bearer",
    )


def login_user(db: Session, req: LoginRequest) -> LoginResponse:
    """Authenticate user with email and password and return a JWT access token."""
    email_clean = req.email.lower().strip()

    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify tenant status is active
    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    if not tenant or tenant.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your organization account is not active. Please contact support.",
        )

    token = create_access_token(
        {
            "user_id": str(user.id),
            "tenant_id": str(tenant.id),
            "role": user.role,
        }
    )

    return LoginResponse(
        access_token=token,
        tenant_id=tenant.id,
        token_type="bearer",
    )


def get_user_profile(user: User) -> UserMeResponse:
    """Transform user model to profile response schema."""
    return UserMeResponse(
        user_id=user.id,
        tenant_id=user.tenant_id,
        email=user.email,
        role=user.role,
        company_name=user.tenant.name if user.tenant else "",
    )
