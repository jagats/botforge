"""Business logic for tenant settings and public API keys."""

import uuid
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.api_key import ApiKey
from app.models.tenant import Tenant
from app.schemas.tenant import ApiKeyResponse, TenantResponse, TenantUpdateRequest


def get_tenant(db: Session, tenant_id: uuid.UUID) -> TenantResponse:
    """Retrieve tenant profile by tenant_id."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )
    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        plan=tenant.plan,
        status=tenant.status,
        created_at=tenant.created_at,
    )


def update_tenant(
    db: Session,
    tenant_id: uuid.UUID,
    req: TenantUpdateRequest,
) -> TenantResponse:
    """Update tenant organization profile settings."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    if req.name is not None:
        tenant.name = req.name.strip()

    db.commit()
    db.refresh(tenant)

    return TenantResponse(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        plan=tenant.plan,
        status=tenant.status,
        created_at=tenant.created_at,
    )


def get_active_api_key(db: Session, tenant_id: uuid.UUID) -> ApiKeyResponse:
    """Retrieve the primary active public API key for widget integration."""
    api_key = (
        db.query(ApiKey)
        .filter(ApiKey.tenant_id == tenant_id, ApiKey.is_active.is_(True))
        .first()
    )
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active API key not found for tenant",
        )
    return ApiKeyResponse(
        public_key=api_key.public_key,
        is_active=api_key.is_active,
        created_at=api_key.created_at,
    )
