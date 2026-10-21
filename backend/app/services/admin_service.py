"""Superadmin business logic for brand provisioning, tenant lifecycles, and agency management."""

import logging
import uuid
from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.models.api_key import ApiKey
from app.models.chat_session import ChatSession
from app.models.document import Document
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.admin import (
    BrandCreateRequest,
    BrandImpersonateResponse,
    BrandListResponse,
    BrandResponse,
)
from app.services.auth_service import generate_public_key, generate_unique_slug
from app.services.embedding import delete_tenant_vectors

logger = logging.getLogger(__name__)

SYSTEM_TENANT_SLUG = "system-admin"


def _build_brand_response(db: Session, tenant: Tenant) -> BrandResponse:
    """Helper to convert a Tenant model to BrandResponse with aggregated stats."""
    # Find owner user
    owner_user = (
        db.query(User)
        .filter(User.tenant_id == tenant.id, User.role == "owner")
        .first()
    )
    if not owner_user:
        # Fallback to any user belonging to tenant
        owner_user = (
            db.query(User)
            .filter(User.tenant_id == tenant.id)
            .first()
        )

    # Document count
    doc_count = (
        db.query(Document)
        .filter(Document.tenant_id == tenant.id)
        .count()
    )

    # Chat session count
    chat_count = (
        db.query(ChatSession)
        .filter(ChatSession.tenant_id == tenant.id)
        .count()
    )

    # Public API Key
    api_key_rec = (
        db.query(ApiKey)
        .filter(ApiKey.tenant_id == tenant.id, ApiKey.is_active.is_(True))
        .first()
    )

    return BrandResponse(
        tenant_id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        plan=tenant.plan,
        status=tenant.status,
        owner_email=owner_user.email if owner_user else "",
        owner_user_id=owner_user.id if owner_user else tenant.id,
        is_active=(owner_user.is_active if owner_user else (tenant.status == "active")),
        document_count=doc_count,
        chat_session_count=chat_count,
        public_api_key=api_key_rec.public_key if api_key_rec else None,
        created_at=tenant.created_at,
    )


def onboard_brand(db: Session, req: BrandCreateRequest) -> BrandResponse:
    """Atomically create a new client brand tenant, owner user, and public widget API key."""
    email_clean = req.email.lower().strip()

    # 1. Enforce unique user email across platform
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A user with email '{email_clean}' already exists.",
        )

    # 2. Generate unique slug and hash initial password
    slug = generate_unique_slug(db, req.company_name)
    hashed_pwd = hash_password(req.password)

    try:
        # 3. Create Tenant
        tenant = Tenant(
            name=req.company_name.strip(),
            slug=slug,
            plan=req.plan.lower().strip() if req.plan else "trial",
            status="active",
        )
        db.add(tenant)
        db.flush()

        # 4. Create Owner User
        owner = User(
            tenant_id=tenant.id,
            email=email_clean,
            hashed_password=hashed_pwd,
            role="owner",
            is_active=True,
        )
        db.add(owner)
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
        db.refresh(owner)
        logger.info("Brand '%s' (tenant_id=%s) provisioned by superadmin.", tenant.name, tenant.id)
    except Exception as exc:
        db.rollback()
        logger.error("Failed to provision brand: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete brand provisioning transaction.",
        ) from exc

    return _build_brand_response(db, tenant)


def list_brands(db: Session, skip: int = 0, limit: int = 100) -> BrandListResponse:
    """List all onboarded client brands with batched aggregation queries (eliminating N+1 overhead)."""
    query = (
        db.query(Tenant)
        .filter(Tenant.slug != SYSTEM_TENANT_SLUG)
        .order_by(Tenant.created_at.desc())
    )
    total = query.count()
    tenants = query.offset(skip).limit(limit).all()

    if not tenants:
        return BrandListResponse(brands=[], total=total)

    tenant_ids = [t.id for t in tenants]

    # 1. Batch fetch owner/primary users for these tenants
    all_users = db.query(User).filter(User.tenant_id.in_(tenant_ids)).all()
    owner_map = {}
    for u in all_users:
        if u.tenant_id not in owner_map or u.role == "owner":
            owner_map[u.tenant_id] = u

    # 2. Batch fetch document counts
    doc_count_rows = (
        db.query(Document.tenant_id, func.count(Document.id))
        .filter(Document.tenant_id.in_(tenant_ids))
        .group_by(Document.tenant_id)
        .all()
    )
    doc_count_map = {t_id: count for t_id, count in doc_count_rows}

    # 3. Batch fetch chat session counts
    chat_count_rows = (
        db.query(ChatSession.tenant_id, func.count(ChatSession.id))
        .filter(ChatSession.tenant_id.in_(tenant_ids))
        .group_by(ChatSession.tenant_id)
        .all()
    )
    chat_count_map = {t_id: count for t_id, count in chat_count_rows}

    # 4. Batch fetch active API keys
    api_key_rows = (
        db.query(ApiKey)
        .filter(ApiKey.tenant_id.in_(tenant_ids), ApiKey.is_active.is_(True))
        .all()
    )
    api_key_map = {k.tenant_id: k.public_key for k in api_key_rows}

    # 5. Build responses in memory
    brands = []
    for t in tenants:
        owner = owner_map.get(t.id)
        brands.append(
            BrandResponse(
                tenant_id=t.id,
                name=t.name,
                slug=t.slug,
                plan=t.plan,
                status=t.status,
                owner_email=owner.email if owner else "",
                owner_user_id=owner.id if owner else t.id,
                is_active=(owner.is_active if owner else (t.status == "active")),
                document_count=doc_count_map.get(t.id, 0),
                chat_session_count=chat_count_map.get(t.id, 0),
                public_api_key=api_key_map.get(t.id),
                created_at=t.created_at,
            )
        )

    return BrandListResponse(brands=brands, total=total)


def get_brand(db: Session, tenant_id: uuid.UUID) -> BrandResponse:
    """Retrieve brand details by tenant ID."""
    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == tenant_id, Tenant.slug != SYSTEM_TENANT_SLUG)
        .first()
    )
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand with ID '{tenant_id}' not found.",
        )
    return _build_brand_response(db, tenant)


def update_brand_status(db: Session, tenant_id: uuid.UUID, new_status: str) -> BrandResponse:
    """Toggle a client brand's active or suspended status, synchronizing user accounts."""
    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == tenant_id, Tenant.slug != SYSTEM_TENANT_SLUG)
        .first()
    )
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand with ID '{tenant_id}' not found.",
        )

    tenant.status = new_status
    # Synchronize is_active flag on all users of this tenant
    is_active_flag = (new_status == "active")
    db.query(User).filter(User.tenant_id == tenant_id).update({"is_active": is_active_flag})
    db.commit()
    db.refresh(tenant)
    logger.info("Brand '%s' status updated to '%s' (users active=%s)", tenant.name, new_status, is_active_flag)

    return _build_brand_response(db, tenant)


def delete_brand(db: Session, tenant_id: uuid.UUID) -> None:
    """Offboard a client brand and perform complete cascade cleanup in Postgres and Qdrant."""
    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == tenant_id, Tenant.slug != SYSTEM_TENANT_SLUG)
        .first()
    )
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand with ID '{tenant_id}' not found.",
        )

    # 1. Purge vectors from Qdrant
    delete_tenant_vectors(tenant_id)

    # 2. Delete Tenant from DB (cascades to users, api_keys, documents, chunks, chats)
    db.delete(tenant)
    db.commit()
    logger.info("Brand '%s' (tenant_id=%s) completely offboarded.", tenant.name, tenant_id)


def impersonate_brand(
    db: Session,
    tenant_id: uuid.UUID,
    admin_user: User,
) -> BrandImpersonateResponse:
    """Issue a tenant-scoped access token for a superadmin to view and manage a client brand dashboard.

    Includes full audit logging and impersonation claims.
    """
    tenant = (
        db.query(Tenant)
        .filter(Tenant.id == tenant_id, Tenant.slug != SYSTEM_TENANT_SLUG)
        .first()
    )
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand with ID '{tenant_id}' not found.",
        )

    # Find owner user (or any primary user of this tenant)
    owner = (
        db.query(User)
        .filter(User.tenant_id == tenant.id, User.role == "owner")
        .first()
    )
    if not owner:
        owner = db.query(User).filter(User.tenant_id == tenant.id).first()

    if not owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Brand '{tenant.name}' has no active user account to manage.",
        )

    # Issue access token with impersonation metadata
    token = create_access_token(
        {
            "user_id": str(owner.id),
            "tenant_id": str(tenant.id),
            "role": owner.role,
            "is_impersonated": True,
            "impersonated_by": admin_user.email,
            "original_admin_id": str(admin_user.id),
        }
    )

    logger.info(
        "AUDIT: Superadmin '%s' (id=%s) initiated dashboard impersonation for brand '%s' (tenant_id=%s, owner_id=%s)",
        admin_user.email,
        admin_user.id,
        tenant.name,
        tenant.id,
        owner.id,
    )

    return BrandImpersonateResponse(
        access_token=token,
        tenant_id=tenant.id,
        role=owner.role,
        token_type="bearer",
        brand_name=tenant.name,
        is_impersonated=True,
        impersonated_by=admin_user.email,
    )

