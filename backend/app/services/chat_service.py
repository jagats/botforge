"""Service handling chat conversations, context retrieval, and history logging."""

import logging
import uuid
from typing import Dict, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.chat_message import ChatMessage
from app.models.chat_session import ChatSession
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ChatSourceItem,
    ChatMessageItem,
    ChatSessionDetailResponse,
)
from app.models.tenant import Tenant
from app.services.llm import generate_rag_answer
from app.services.quota import enforce_message_quota
from app.services.retrieval import retrieve_context_chunks

logger = logging.getLogger(__name__)


async def process_chat_message(
    db: Session,
    tenant_id: uuid.UUID,
    req: ChatRequest,
) -> ChatResponse:
    """
    Process an incoming user message:
    1. Resolve or create chat session strictly scoped to tenant_id.
    2. Save incoming user message.
    3. Retrieve relevant context chunks from Qdrant filtered by tenant_id.
    4. Call LLM for grounded answer generation.
    5. Save assistant response with retrieved source chunk references.
    """
    # 0. Enforce the tenant's monthly message quota (finding H-04).
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    enforce_message_quota(db, tenant_id, tenant.plan if tenant else "trial")

    # 1. Resolve or create session
    if req.session_id:
        session = (
            db.query(ChatSession)
            .filter(
                ChatSession.id == req.session_id,
                ChatSession.tenant_id == tenant_id,
            )
            .first()
        )
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found.",
            )
    else:
        session = ChatSession(
            tenant_id=tenant_id,
        )
        db.add(session)
        db.flush()

    # 2. Fetch past conversation history (last 6 messages) for multi-turn conversational context
    past_messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.session_id == session.id,
            ChatMessage.tenant_id == tenant_id,
        )
        .order_by(ChatMessage.created_at.desc())
        .limit(6)
        .all()
    )
    # Reverse to chronological order
    history: List[Dict[str, str]] = [
        {"role": m.role, "content": m.content}
        for m in reversed(past_messages)
    ]

    # 3. Save User message
    user_message = ChatMessage(
        tenant_id=tenant_id,
        session_id=session.id,
        role="user",
        content=req.message.strip(),
    )
    db.add(user_message)
    db.flush()

    # 4 + 5. Retrieve context and generate a grounded answer. If the AI backend is
    # unavailable, surface a 503 rather than persisting a fake answer (finding H-02).
    try:
        chunks = await retrieve_context_chunks(
            tenant_id=tenant_id,
            query_text=req.message,
            top_k=5,
        )
        answer = await generate_rag_answer(
            query=req.message,
            context_chunks=chunks,
            history=history,
        )
    except RuntimeError as exc:
        logger.error("AI backend unavailable for tenant=%s: %s", tenant_id, exc)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The assistant is temporarily unavailable. Please try again shortly.",
        )

    # 6. Save Assistant message with citation chunk IDs
    chunk_ids = [c.chunk_id for c in chunks]
    assistant_message = ChatMessage(
        tenant_id=tenant_id,
        session_id=session.id,
        role="assistant",
        content=answer,
        retrieved_chunk_ids=chunk_ids if chunk_ids else None,
    )
    db.add(assistant_message)
    db.commit()

    source_items = [
        ChatSourceItem(
            chunk_id=c.chunk_id,
            document_id=c.document_id,
            text=c.text,
            score=c.score,
        )
        for c in chunks
    ]

    return ChatResponse(
        session_id=session.id,
        answer=answer,
        sources=chunk_ids,
        source_chunks=source_items,
    )


def get_chat_session_history(
    db: Session,
    tenant_id: uuid.UUID,
    session_id: uuid.UUID,
) -> ChatSessionDetailResponse:
    """Retrieve message history for a given chat session scoped to tenant_id."""
    session = (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.tenant_id == tenant_id,
        )
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found.",
        )

    messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.session_id == session.id,
            ChatMessage.tenant_id == tenant_id,
        )
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    return ChatSessionDetailResponse(
        id=session.id,
        tenant_id=session.tenant_id,
        started_at=session.started_at,
        messages=[
            ChatMessageItem(
                id=m.id,
                role=m.role,
                content=m.content,
                retrieved_chunk_ids=m.retrieved_chunk_ids,
                created_at=m.created_at,
            )
            for m in messages
        ],
    )
