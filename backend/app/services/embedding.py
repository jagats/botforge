"""Embedding and Qdrant vector operations service."""

import asyncio
import hashlib
import logging
import math
import uuid
from typing import List, Optional, Tuple
from openai import AsyncOpenAI
from qdrant_client.http import models

from app.core.config import settings
from app.core.qdrant import get_qdrant_client, EMBEDDING_VECTOR_SIZE

logger = logging.getLogger(__name__)

# OpenAI embeddings input cap safety + transient-error retry.
_EMBED_BATCH_SIZE = 100
_MAX_RETRIES = 3

_openai_client: Optional[AsyncOpenAI] = None


def _get_openai_client() -> AsyncOpenAI:
    """Lazily build and reuse a single AsyncOpenAI client (connection pooling)."""
    global _openai_client
    if _openai_client is None:
        _openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


def _generate_deterministic_mock_vector(text: str, dim: int = EMBEDDING_VECTOR_SIZE) -> List[float]:
    """
    Generate a deterministic unit-normalized mock embedding vector from text.
    Used for local testing when OPENAI_API_KEY is not configured or in test environments.
    """
    vector = []
    # Seed with sha256 chunks
    h = hashlib.sha256(text.encode("utf-8")).digest()
    for i in range(dim):
        val = (h[i % len(h)] + (i * 7)) % 256
        # Map 0..255 to -1.0 .. 1.0
        norm_val = (val / 127.5) - 1.0
        vector.append(norm_val)

    # Normalize vector to unit length
    magnitude = math.sqrt(sum(x * x for x in vector))
    if magnitude > 0:
        vector = [x / magnitude for x in vector]
    return vector


async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of text strings using the configured OpenAI model.

    Mock vectors are returned ONLY when USE_MOCK_AI is true (local dev/tests). When it
    is false, a missing key or an OpenAI failure raises instead of silently producing
    fake vectors (finding H-02). Inputs are batched and retried with backoff.
    """
    if not texts:
        return []

    if settings.USE_MOCK_AI:
        logger.info("USE_MOCK_AI enabled: returning deterministic mock embeddings for %d texts.", len(texts))
        return [_generate_deterministic_mock_vector(t) for t in texts]

    has_real_key = bool(
        settings.OPENAI_API_KEY
        and settings.OPENAI_API_KEY != "sk-replace-me"
        and not settings.OPENAI_API_KEY.startswith("sk-dummy")
    )
    if not has_real_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not configured and USE_MOCK_AI is false; cannot generate embeddings."
        )

    client = _get_openai_client()
    vectors: List[List[float]] = []
    for start in range(0, len(texts), _EMBED_BATCH_SIZE):
        batch = texts[start : start + _EMBED_BATCH_SIZE]
        last_exc: Optional[Exception] = None
        for attempt in range(_MAX_RETRIES):
            try:
                response = await client.embeddings.create(
                    model=settings.EMBEDDING_MODEL,
                    input=batch,
                )
                vectors.extend(item.embedding for item in response.data)
                break
            except Exception as exc:  # noqa: BLE001 - retried then re-raised
                last_exc = exc
                logger.warning(
                    "OpenAI embedding attempt %d/%d failed: %s", attempt + 1, _MAX_RETRIES, exc
                )
                await asyncio.sleep(0.5 * (2 ** attempt))
        else:
            raise RuntimeError("OpenAI embedding generation failed after retries.") from last_exc

    return vectors


def upsert_chunks_to_qdrant(
    tenant_id: uuid.UUID,
    document_id: uuid.UUID,
    chunk_data: List[Tuple[uuid.UUID, uuid.UUID, str, List[float]]],
) -> None:
    """
    Upsert vector points to Qdrant with tenant_id payload scoping.
    chunk_data: List of (chunk_db_id, qdrant_point_id, chunk_text, vector)
    """
    if not chunk_data:
        return

    client = get_qdrant_client()
    points = []

    for chunk_db_id, point_id, text, vector in chunk_data:
        point = models.PointStruct(
            id=str(point_id),
            vector=vector,
            payload={
                "tenant_id": str(tenant_id),
                "document_id": str(document_id),
                "chunk_id": str(chunk_db_id),
                "text": text,
            },
        )
        points.append(point)

    client.upsert(
        collection_name=settings.QDRANT_COLLECTION_NAME,
        points=points,
    )
    logger.info(
        "Upserted %d vector points for tenant=%s doc=%s into Qdrant",
        len(points),
        tenant_id,
        document_id,
    )


def delete_document_vectors(tenant_id: uuid.UUID, document_id: uuid.UUID) -> None:
    """
    Delete all vector points associated with a specific document, strictly filtered by tenant_id.
    """
    client = get_qdrant_client()
    client.delete(
        collection_name=settings.QDRANT_COLLECTION_NAME,
        points_selector=models.FilterSelector(
            filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="tenant_id",
                        match=models.MatchValue(value=str(tenant_id)),
                    ),
                    models.FieldCondition(
                        key="document_id",
                        match=models.MatchValue(value=str(document_id)),
                    ),
                ]
            )
        ),
    )
    logger.info("Deleted Qdrant vectors for tenant=%s doc=%s", tenant_id, document_id)


def delete_tenant_vectors(tenant_id: uuid.UUID) -> None:
    """
    Delete all vector points belonging to an entire tenant.
    """
    try:
        client = get_qdrant_client()
        client.delete(
            collection_name=settings.QDRANT_COLLECTION_NAME,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="tenant_id",
                            match=models.MatchValue(value=str(tenant_id)),
                        ),
                    ]
                )
            ),
        )
        logger.info("Deleted all Qdrant vectors for tenant=%s", tenant_id)
    except Exception as exc:
        logger.warning("Could not delete Qdrant vectors for tenant %s: %s", tenant_id, exc)

