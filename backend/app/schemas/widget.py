"""Pydantic schemas for public embeddable widget API."""

import uuid
from typing import List, Optional
from pydantic import BaseModel, Field


class WidgetChatRequest(BaseModel):
    session_id: Optional[uuid.UUID] = Field(
        default=None,
        description="Optional existing session UUID. If omitted, a new session is created.",
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="Visitor message or question.",
    )
    visitor_id: Optional[str] = Field(
        default=None,
        description="Optional anonymous visitor identifier stored in client localStorage.",
    )


class WidgetChatResponse(BaseModel):
    session_id: uuid.UUID = Field(..., description="Active session UUID.")
    answer: str = Field(..., description="Grounded AI response.")
    sources: List[uuid.UUID] = Field(
        default_factory=list,
        description="List of document chunk UUIDs referenced for grounding.",
    )


class WidgetConfigResponse(BaseModel):
    tenant_id: uuid.UUID
    company_name: str
    bot_name: str = "Assistant"
    welcome_message: str = "Hello! How can I help you today?"
    status: str
