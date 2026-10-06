"""Vector retrieval service for RAG queries scoped to tenants."""

import logging
import uuid
from dataclasses import dataclass
from typing import List, Optional
from qdrant_client.http import models

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


async def retrieve_context_chunks(
    tenant_id: uuid.UUID,
    query_text: str,
    top_k: int = 5,
) -> List[RetrievedChunk]:
    """
    Embed query text and retrieve top-k most relevant chunks from Qdrant,
    strictly filtered by tenant_id to guarantee multi-tenant isolation.
    """
    cleaned_query = query_text.strip()
    if not cleaned_query:
        return []

    # 1. Generate query embedding
    vectors = await generate_embeddings([cleaned_query])
    if not vectors:
        return []
    query_vector = vectors[0]

    # 2. Query Qdrant with tenant filter
    client = get_qdrant_client()
    try:
        response = client.query_points(
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
    except Exception as exc:
        logger.error(
            "Error querying Qdrant for tenant=%s query='%s': %s",
            tenant_id,
            cleaned_query[:50],
            exc,
        )
        return []

    retrieved_chunks: List[RetrievedChunk] = []
    for pt in response.points:
        payload = pt.payload or {}
        chunk_id_str = payload.get("chunk_id")
        doc_id_str = payload.get("document_id")
        text = payload.get("text", "")

        if not chunk_id_str or not doc_id_str:
            continue

        try:
            retrieved_chunks.append(
                RetrievedChunk(
                    chunk_id=uuid.UUID(chunk_id_str),
                    document_id=uuid.UUID(doc_id_str),
                    text=text,
                    score=float(pt.score or 0.0),
                )
            )
        except ValueError:
            continue

    logger.info(
        "Retrieved %d context chunks for tenant=%s query='%s'",
        len(retrieved_chunks),
        tenant_id,
        cleaned_query[:40],
    )
    return retrieved_chunks
