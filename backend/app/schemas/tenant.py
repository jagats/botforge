"""Pydantic schemas for tenant profile and API key management."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TenantResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    plan: str
    status: str
    created_at: datetime


class TenantUpdateRequest(BaseModel):
    name: Optional[str] = Field(
        None,
        min_length=2,
        max_length=100,
        description="Updated company name",
    )


class ApiKeyResponse(BaseModel):
    public_key: str
    is_active: bool
    created_at: datetime
