"""Database seed utilities for initializing master platform admin and system state."""

import logging
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.api_key import ApiKey
from app.models.tenant import Tenant
from app.models.user import User
from app.services.auth_service import generate_public_key

logger = logging.getLogger(__name__)

SYSTEM_TENANT_SLUG = "system-admin"
SYSTEM_TENANT_NAME = "BotForge System"


def seed_superadmin(db: Session) -> User:
    """Ensure the system tenant and master superadmin user exist in the database."""
    # 1. Find or create master system tenant
    system_tenant = db.query(Tenant).filter(Tenant.slug == SYSTEM_TENANT_SLUG).first()
    if not system_tenant:
        logger.info("Creating system tenant: %s", SYSTEM_TENANT_NAME)
        system_tenant = Tenant(
            name=SYSTEM_TENANT_NAME,
            slug=SYSTEM_TENANT_SLUG,
            plan="pro",
            status="active",
        )
        db.add(system_tenant)
        db.flush()

    # Ensure system tenant has a default active public API key
    system_api_key = (
        db.query(ApiKey)
        .filter(ApiKey.tenant_id == system_tenant.id, ApiKey.is_active.is_(True))
        .first()
    )
    if not system_api_key:
        system_api_key = ApiKey(
            tenant_id=system_tenant.id,
            public_key=generate_public_key(),
            is_active=True,
        )
        db.add(system_api_key)
        db.flush()

    # 2. Find or create superadmin user
    admin_email = settings.SUPERADMIN_EMAIL.lower().strip()
    admin_user = db.query(User).filter(User.email == admin_email).first()

    if not admin_user:
        logger.info("Creating master superadmin user: %s", admin_email)
        admin_user = User(
            tenant_id=system_tenant.id,
            email=admin_email,
            hashed_password=hash_password(settings.SUPERADMIN_PASSWORD),
            role="superadmin",
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        logger.info("Superadmin user successfully provisioned.")
    else:
        # Ensure role is superadmin and account is active
        updated = False
        if admin_user.role != "superadmin":
            admin_user.role = "superadmin"
            updated = True
        if not admin_user.is_active:
            admin_user.is_active = True
            updated = True
        if updated:
            db.commit()
            db.refresh(admin_user)
            logger.info("Superadmin user permissions synchronized.")

    return admin_user
