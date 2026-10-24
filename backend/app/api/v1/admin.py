"""Superadmin brand provisioning and management API endpoints."""

import uuid
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
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
from app.services.audit import record_audit

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
    result = onboard_brand(db, req)
    record_audit(
        db, admin.email, "brand.create", result.tenant_id, admin.id,
        detail=f"plan={req.plan}",
    )
    return result


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
    result = update_brand_status(db, tenant_id, req.status)
    record_audit(
        db, admin.email, "brand.status", tenant_id, admin.id,
        detail=f"status={req.status}",
    )
    return result


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
    record_audit(db, admin.email, "brand.delete", tenant_id, admin.id)


@router.post(
    "/{tenant_id}/impersonate",
    response_model=BrandImpersonateResponse,
    status_code=status.HTTP_200_OK,
    summary="Impersonate client brand dashboard as superadmin",
)
def impersonate_brand_session(
    tenant_id: uuid.UUID,
    response: Response,
    db: Session = Depends(get_db),
    admin: User = Depends(require_superadmin),
) -> BrandImpersonateResponse:
    """Generate an audit-logged tenant access token and set isolated HttpOnly impersonation cookie."""
    impersonate_res = impersonate_brand(db, tenant_id, admin)

    # Impersonation sessions are short-lived (finding M-02).
    max_age_secs = settings.IMPERSONATION_EXPIRE_MINUTES * 60
    is_prod = settings.ENVIRONMENT.lower() == "production"

    response.set_cookie(
        key="botforge_impersonation_token",
        value=impersonate_res.access_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=max_age_secs,
        path="/",
    )
    record_audit(
        db, admin.email, "brand.impersonate", tenant_id, admin.id,
        detail=f"brand={impersonate_res.brand_name}",
    )
    if not settings.EXPOSE_TOKEN_IN_BODY:
        impersonate_res.access_token = ""
    return impersonate_res


@router.post(
    "/exit-impersonation",
    status_code=status.HTTP_200_OK,
    summary="Exit impersonation mode and return cleanly to superadmin context",
)
def exit_impersonation_session(response: Response):
    """Clear the botforge_impersonation_token cookie."""
    response.delete_cookie(
        key="botforge_impersonation_token",
        path="/",
        httponly=True,
        samesite="lax",
    )
    return {"message": "Successfully exited impersonation session"}


