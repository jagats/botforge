"""Embedding and Qdrant vector operations service."""

import hashlib
import logging
import math
import uuid
from typing import List, Tuple
from openai import AsyncOpenAI
from qdrant_client.http import models

from app.core.config import settings
from app.core.qdrant import get_qdrant_client, EMBEDDING_VECTOR_SIZE

logger = logging.getLogger(__name__)


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
    Generate embeddings for a list of text strings using OpenAI text-embedding-3-small.
    Falls back to deterministic mock vectors if API key is not configured or in mock test mode.
    """
    if not texts:
        return []

    # Check if a real OpenAI API key is set
    has_real_key = bool(
        settings.OPENAI_API_KEY
        and settings.OPENAI_API_KEY != "sk-replace-me"
        and not settings.OPENAI_API_KEY.startswith("sk-dummy")
    )

    if not has_real_key:
        logger.warning("OPENAI_API_KEY is not configured. Using deterministic mock embeddings for %d texts.", len(texts))
        return [_generate_deterministic_mock_vector(t) for t in texts]

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=texts,
        )
        return [item.embedding for item in response.data]
    except Exception as exc:
        logger.error("OpenAI embedding generation failed: %s. Falling back to mock embeddings.", exc)
        return [_generate_deterministic_mock_vector(t) for t in texts]


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
