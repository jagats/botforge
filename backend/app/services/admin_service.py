"""Superadmin business logic for brand provisioning, tenant lifecycles, and agency management."""

import logging
import uuid
from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.api_key import ApiKey
from app.models.chat_session import ChatSession
from app.models.document import Document
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.admin import (
    BrandCreateRequest,
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
    """List all onboarded client brands, excluding internal system tenant."""
    query = (
        db.query(Tenant)
        .filter(Tenant.slug != SYSTEM_TENANT_SLUG)
        .order_by(Tenant.created_at.desc())
    )
    total = query.count()
    tenants = query.offset(skip).limit(limit).all()

    brands = [_build_brand_response(db, t) for t in tenants]
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
