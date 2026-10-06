"""Chat API routes for dashboard testing and conversation grounding."""

import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_tenant_id
from app.db.session import get_db
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatSessionDetailResponse,
)
from app.services.chat_service import (
    process_chat_message,
    get_chat_session_history,
)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat_message_endpoint(
    req: ChatRequest,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> ChatResponse:
    """
    Test chat endpoint for dashboard users:
    - Queries Qdrant vector database strictly filtered by tenant_id
    - Generates grounded response using retrieved context
    - Persists session and chat messages with citations
    """
    return await process_chat_message(db=db, tenant_id=tenant_id, req=req)


@router.get("/sessions/{session_id}", response_model=ChatSessionDetailResponse)
def get_chat_session_endpoint(
    session_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
) -> ChatSessionDetailResponse:
    """
    Get full message history for a specific chat session owned by the authenticated tenant.
    """
    return get_chat_session_history(db=db, tenant_id=tenant_id, session_id=session_id)
