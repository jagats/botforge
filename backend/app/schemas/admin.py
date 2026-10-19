"""Pydantic schemas for superadmin brand provisioning and agency management."""

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class BrandCreateRequest(BaseModel):
    company_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Company or client brand name",
        examples=["Apex Logistics"],
    )
    email: EmailStr = Field(
        ...,
        description="Brand primary owner email",
        examples=["admin@apexlogistics.com"],
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="Initial temporary password for brand owner",
        examples=["TemporaryPass2026!"],
    )
    plan: str = Field(
        default="trial",
        description="Subscription plan (trial, starter, pro)",
        examples=["starter"],
    )


class BrandStatusUpdateRequest(BaseModel):
    status: str = Field(
        ...,
        pattern=r"^(active|suspended)$",
        description="New account status for the brand: 'active' or 'suspended'",
        examples=["suspended"],
    )


class BrandResponse(BaseModel):
    tenant_id: uuid.UUID
    name: str
    slug: str
    plan: str
    status: str
    owner_email: str
    owner_user_id: uuid.UUID
    is_active: bool
    document_count: int = 0
    chat_session_count: int = 0
    public_api_key: Optional[str] = None
    created_at: datetime


class BrandListResponse(BaseModel):
    brands: List[BrandResponse]
    total: int


class BrandImpersonateResponse(BaseModel):
    access_token: str
    tenant_id: uuid.UUID
    role: str
    token_type: str = "bearer"
    brand_name: str
    is_impersonated: bool = True
    impersonated_by: str

