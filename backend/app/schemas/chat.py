"""Pydantic schemas for chat endpoints."""

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ChatSourceItem(BaseModel):
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    text: str
    score: float


class ChatRequest(BaseModel):
    session_id: Optional[uuid.UUID] = Field(
        default=None,
        description="Optional existing session UUID. If omitted, a new session is created.",
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="User question or query.",
    )


class ChatResponse(BaseModel):
    session_id: uuid.UUID
    answer: str
    sources: List[uuid.UUID] = Field(
        default_factory=list,
        description="List of retrieved chunk IDs used for grounding.",
    )
    source_chunks: List[ChatSourceItem] = Field(
        default_factory=list,
        description="Detailed metadata and excerpts of retrieved context chunks.",
    )


class ChatMessageItem(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    retrieved_chunk_ids: Optional[List[uuid.UUID]] = None
    created_at: datetime


class ChatSessionDetailResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    started_at: datetime
    messages: List[ChatMessageItem]
