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
from app.services import semantic_cache
from app.services.embedding import generate_embeddings
from app.services.guardrails import screen_input, screen_output
from app.services.llm import (
    NO_CONTEXT_FALLBACK,
    contains_ungrounded_amount,
    generate_rag_answer,
)
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

    # 4. Input guardrail (Phase 2): block injection/jailbreak/transactional/advice/self-harm
    # BEFORE any retrieval or LLM call. Blocked messages get a canned, brand-neutral reply.
    guard = await screen_input(req.message)
    chunks = []
    cached_payload = None
    query_vec = None
    if guard.blocked:
        logger.info("Input guardrail blocked message for tenant=%s (category=%s)", tenant_id, guard.category)
        answer = guard.message
    else:
        # 5. Semantic cache (Phase 3): only for standalone questions (no prior turns in this
        # session) so context-dependent follow-ups are never served a cached, context-free answer.
        if not history and semantic_cache.is_enabled():
            cached_payload = semantic_cache.get_exact(tenant_id, req.message)
            if cached_payload is None:
                try:
                    vecs = await generate_embeddings([req.message])
                    query_vec = vecs[0] if vecs else None
                except RuntimeError:
                    query_vec = None
                if query_vec is not None:
                    cached_payload = semantic_cache.get_semantic(tenant_id, query_vec)

        if cached_payload is not None:
            logger.info("Semantic cache hit for tenant=%s", tenant_id)
            answer = cached_payload["answer"]
        else:
            # 6 + 7. Retrieve context and generate a grounded answer (reusing the query vector
            # if we already embedded it for the cache lookup). On AI outage, surface a 503.
            try:
                chunks = await retrieve_context_chunks(
                    tenant_id=tenant_id,
                    query_text=req.message,
                    top_k=5,
                    query_vector=query_vec,
                )
                if not chunks:
                    # Confidence gate: nothing relevant passed retrieval (incl. RETRIEVAL_MIN_SCORE).
                    answer = NO_CONTEXT_FALLBACK
                else:
                    answer = await generate_rag_answer(
                        query=req.message,
                        context_chunks=chunks,
                        history=history,
                    )
                    # Price/number guard: never surface a currency amount the context lacks.
                    if contains_ungrounded_amount(answer, [c.text for c in chunks]):
                        logger.warning(
                            "Ungrounded currency amount in answer for tenant=%s; using fallback.",
                            tenant_id,
                        )
                        answer = NO_CONTEXT_FALLBACK
            except RuntimeError as exc:
                logger.error("AI backend unavailable for tenant=%s: %s", tenant_id, exc)
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="The assistant is temporarily unavailable. Please try again shortly.",
                )

            # 8. Output guardrail: block action-promises / system-prompt leaks before saving.
            answer, flagged = screen_output(answer)
            if flagged:
                logger.warning("Output guardrail triggered for tenant=%s (%s)", tenant_id, flagged)
                chunks = []

    # 9. Build citations from the cache hit or from freshly retrieved chunks.
    if cached_payload is not None:
        chunk_ids = [uuid.UUID(s) for s in cached_payload.get("sources", [])]
        source_items = [
            ChatSourceItem(
                chunk_id=uuid.UUID(s["chunk_id"]),
                document_id=uuid.UUID(s["document_id"]),
                text=s["text"],
                score=s["score"],
            )
            for s in cached_payload.get("source_chunks", [])
        ]
    else:
        chunk_ids = [c.chunk_id for c in chunks]
        source_items = [
            ChatSourceItem(chunk_id=c.chunk_id, document_id=c.document_id, text=c.text, score=c.score)
            for c in chunks
        ]
        # Cache safe, grounded, standalone answers for reuse by similar questions.
        if (
            not history
            and chunks
            and semantic_cache.is_enabled()
            and semantic_cache.is_cacheable(req.message, answer, [NO_CONTEXT_FALLBACK])
        ):
            semantic_cache.store(
                tenant_id,
                req.message,
                query_vec,
                {
                    "answer": answer,
                    "sources": [str(cid) for cid in chunk_ids],
                    "source_chunks": [
                        {
                            "chunk_id": str(s.chunk_id),
                            "document_id": str(s.document_id),
                            "text": s.text,
                            "score": s.score,
                        }
                        for s in source_items
                    ],
                },
            )

    assistant_message = ChatMessage(
        tenant_id=tenant_id,
        session_id=session.id,
        role="assistant",
        content=answer,
        retrieved_chunk_ids=chunk_ids if chunk_ids else None,
    )
    db.add(assistant_message)
    db.commit()

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
    skip: int = 0,
    limit: int = 500,
) -> ChatSessionDetailResponse:
    """Retrieve a page of message history for a chat session scoped to tenant_id (finding P-07)."""
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
        .offset(skip)
        .limit(limit)
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
