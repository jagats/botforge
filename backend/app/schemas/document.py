"""Pydantic schemas for Document operations."""

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class DocumentUrlCreate(BaseModel):
    url: str = Field(..., description="Target web page URL to scrape")
    title: Optional[str] = Field(None, description="Optional custom title for the document")


class DocumentFaqCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Title for this FAQ entry")
    faq_text: str = Field(..., min_length=10, description="FAQ or knowledge text content")


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    source_type: str
    title: str
    original_url: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    chunk_count: int = 0
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    documents: List[DocumentResponse]
    total: int
