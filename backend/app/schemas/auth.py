"""Pydantic schemas for authentication and user profiles."""

import uuid
from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    company_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Company or organization name",
        examples=["Acme Corp"],
    )
    email: EmailStr = Field(
        ...,
        description="Owner email address",
        examples=["owner@acme.com"],
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="Password (minimum 8 characters)",
        examples=["superSecret123!"],
    )


class SignupResponse(BaseModel):
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    access_token: str
    token_type: str = "bearer"


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
    token_type: str = "bearer"


class UserMeResponse(BaseModel):
    user_id: uuid.UUID
    tenant_id: uuid.UUID
    email: str
    role: str
    company_name: str
