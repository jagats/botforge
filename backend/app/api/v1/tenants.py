"""Tenant management endpoints: profile and API key retrieval."""

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_tenant_id
from app.db.session import get_db
from app.schemas.tenant import ApiKeyResponse, TenantResponse, TenantUpdateRequest
from app.services.tenant_service import (
    get_active_api_key,
    get_tenant,
    update_tenant,
)

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.get(
    "/me",
    response_model=TenantResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current tenant profile",
)
def get_current_tenant_profile(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> TenantResponse:
    """Retrieve organization profile for the authenticated tenant."""
    return get_tenant(db, tenant_id)


@router.patch(
    "/me",
    response_model=TenantResponse,
    status_code=status.HTTP_200_OK,
    summary="Update current tenant profile",
)
def update_current_tenant_profile(
    payload: TenantUpdateRequest,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> TenantResponse:
    """Update settings (e.g. company name) for the authenticated tenant."""
    return update_tenant(db, tenant_id, payload)


@router.get(
    "/me/api-key",
    response_model=ApiKeyResponse,
    status_code=status.HTTP_200_OK,
    summary="Get widget public API key",
)
def get_tenant_api_key(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> ApiKeyResponse:
    """Retrieve the active public API key for embeddable chatbot widget integration."""
    return get_active_api_key(db, tenant_id)
