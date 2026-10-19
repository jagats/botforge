"""Superadmin brand provisioning and management API endpoints."""

import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.security import require_superadmin
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import (
    BrandCreateRequest,
    BrandImpersonateResponse,
    BrandListResponse,
    BrandResponse,
    BrandStatusUpdateRequest,
)
from app.services.admin_service import (
    delete_brand,
    get_brand,
    impersonate_brand,
    list_brands,
    onboard_brand,
    update_brand_status,
)

router = APIRouter(
    prefix="/admin/brands",
    tags=["Admin - Brands"],
    dependencies=[Depends(require_superadmin)],
)


@router.post(
    "",
    response_model=BrandResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Onboard and provision a new client brand",
)
def create_new_brand(
    req: BrandCreateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
) -> BrandResponse:
    """Create tenant, primary owner user, and widget public API key in a single atomic transaction."""
    return onboard_brand(db, req)


@router.get(
    "",
    response_model=BrandListResponse,
    status_code=status.HTTP_200_OK,
    summary="List all onboarded client brands",
)
def get_all_brands(
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Limit of records to return"),
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
) -> BrandListResponse:
    """Return all client brands with usage metrics, owner contact, and subscription status."""
    return list_brands(db, skip=skip, limit=limit)


@router.get(
    "/{tenant_id}",
    response_model=BrandResponse,
    status_code=status.HTTP_200_OK,
    summary="Get brand details by tenant ID",
)
def get_brand_by_id(
    tenant_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
) -> BrandResponse:
    """Return full brand metadata, document count, and public key for the requested tenant."""
    return get_brand(db, tenant_id)


@router.patch(
    "/{tenant_id}/status",
    response_model=BrandResponse,
    status_code=status.HTTP_200_OK,
    summary="Toggle brand status between active and suspended",
)
def set_brand_status(
    tenant_id: uuid.UUID,
    req: BrandStatusUpdateRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
) -> BrandResponse:
    """Update tenant status and lock/unlock associated user accounts immediately."""
    return update_brand_status(db, tenant_id, req.status)


@router.delete(
    "/{tenant_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Offboard and delete a client brand",
)
def remove_brand(
    tenant_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
) -> None:
    """Purge all database records (cascade) and associated Qdrant vectors for this brand."""
    delete_brand(db, tenant_id)


@router.post(
    "/{tenant_id}/impersonate",
    response_model=BrandImpersonateResponse,
    status_code=status.HTTP_200_OK,
    summary="Impersonate client brand dashboard as superadmin",
)
def impersonate_brand_session(
    tenant_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
) -> BrandImpersonateResponse:
    """Generate an audit-logged tenant access token for superadmin to view and manage client dashboard."""
    return impersonate_brand(db, tenant_id, admin)

