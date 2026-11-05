"""Vector retrieval service for RAG queries scoped to tenants."""

import logging
import uuid
from dataclasses import dataclass
from typing import List, Optional
from qdrant_client.http import models
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.qdrant import get_qdrant_client
from app.services.embedding import generate_embeddings

logger = logging.getLogger(__name__)


@dataclass
class RetrievedChunk:
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    text: str
    score: float
    source_type: str = ""
    title: str = ""


async def retrieve_context_chunks(
    tenant_id: uuid.UUID,
    query_text: str,
    top_k: int = 5,
    query_vector: Optional[List[float]] = None,
) -> List[RetrievedChunk]:
    """
    Embed query text (unless a precomputed vector is passed) and retrieve top-k most
    relevant chunks from Qdrant, strictly filtered by tenant_id for multi-tenant isolation.
    """
    cleaned_query = query_text.strip()
    if not cleaned_query:
        return []

    # 1. Generate query embedding (reuse a precomputed vector when available)
    if query_vector is None:
        vectors = await generate_embeddings([cleaned_query])
        if not vectors:
            return []
        query_vector = vectors[0]

    # 2. Query Qdrant with tenant filter. The client is synchronous, so run it in a
    # threadpool to avoid blocking the event loop for other requests (finding P-01).
    client = get_qdrant_client()
    try:
        response = await run_in_threadpool(
            lambda: client.query_points(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                query=query_vector,
                query_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="tenant_id",
                            match=models.MatchValue(value=str(tenant_id)),
                        )
                    ]
                ),
                limit=top_k,
                with_payload=True,
            )
        )
    except Exception as exc:
        # Do not log the visitor's question text (finding M-04).
        logger.error("Error querying Qdrant for tenant=%s: %s", tenant_id, exc)
        return []

    retrieved_chunks: List[RetrievedChunk] = []
    for pt in response.points:
        payload = pt.payload or {}
        chunk_id_str = payload.get("chunk_id")
        doc_id_str = payload.get("document_id")
        text = payload.get("text", "")

        if not chunk_id_str or not doc_id_str:
            continue

        # Drop weak matches below the configured relevance floor (finding P-08).
        # Only applied when a positive threshold is set, so the 0.0 default keeps all
        # results (cosine scores can legitimately be negative).
        score = float(pt.score or 0.0)
        if settings.RETRIEVAL_MIN_SCORE > 0.0 and score < settings.RETRIEVAL_MIN_SCORE:
            continue

        try:
            retrieved_chunks.append(
                RetrievedChunk(
                    chunk_id=uuid.UUID(chunk_id_str),
                    document_id=uuid.UUID(doc_id_str),
                    text=text,
                    score=score,
                    source_type=payload.get("source_type", ""),
                    title=payload.get("title", ""),
                )
            )
        except ValueError:
            continue

    logger.info(
        "Retrieved %d context chunks for tenant=%s",
        len(retrieved_chunks),
        tenant_id,
    )
    return retrieved_chunks
