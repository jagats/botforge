"""Pydantic schemas for authentication and user profiles."""

import uuid
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr = Field(
        ...,
        description="User email address",
        examples=["owner@acme.com"],
    )
    password: str = Field(
        ...,
        min_length=1,
        description="User password",
    )


class LoginResponse(BaseModel):
    access_token: str
    tenant_id: uuid.UUID
    role: str = "owner"
    token_type: str = "bearer"


class UserMeResponse(BaseModel):
    user_id: uuid.UUID
    tenant_id: uuid.UUID
    email: str
    role: str
    is_active: bool = True
    company_name: str
