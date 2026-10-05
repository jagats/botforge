"""Qdrant client initialization and collection management."""

import logging
from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.core.config import settings

logger = logging.getLogger(__name__)

# Vector dimensions for OpenAI text-embedding-3-small
EMBEDDING_VECTOR_SIZE = 1536


def get_qdrant_client() -> QdrantClient:
    """Return an active Qdrant client instance."""
    return QdrantClient(url=settings.QDRANT_URL)


def init_qdrant_collection() -> None:
    """Ensure the shared document_chunks collection exists with proper indexes."""
    client = get_qdrant_client()
    collection_name = settings.QDRANT_COLLECTION_NAME

    try:
        if not client.collection_exists(collection_name):
            logger.info("Creating Qdrant collection: %s", collection_name)
            client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=EMBEDDING_VECTOR_SIZE,
                    distance=models.Distance.COSINE,
                ),
            )
            # Create payload index on tenant_id for high-performance multi-tenant filtering
            client.create_payload_index(
                collection_name=collection_name,
                field_name="tenant_id",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
            # Create payload index on document_id for easy deletion by document
            client.create_payload_index(
                collection_name=collection_name,
                field_name="document_id",
                field_schema=models.PayloadSchemaType.KEYWORD,
            )
            logger.info("Qdrant collection %s created with indexes", collection_name)
        else:
            logger.info("Qdrant collection %s already exists", collection_name)
    except Exception as exc:
        logger.error("Failed to initialize Qdrant collection: %s", exc)
        raise exc
