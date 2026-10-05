"""Document service managing persistence, background ingestion, and deletion."""

import os
import uuid
import logging
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session, selectinload

from app.db.session import SessionLocal
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.ingestion import (
    extract_text_from_pdf,
    extract_text_from_url,
    chunk_text,
)
from app.services.embedding import (
    generate_embeddings,
    upsert_chunks_to_qdrant,
    delete_document_vectors,
)

logger = logging.getLogger(__name__)


def create_document_record(
    db: Session,
    tenant_id: uuid.UUID,
    source_type: str,
    title: str,
    original_url: Optional[str] = None,
    file_path: Optional[str] = None,
    uploaded_by: Optional[uuid.UUID] = None,
) -> Document:
    """Create a new Document record in 'pending' status."""
    document = Document(
        tenant_id=tenant_id,
        source_type=source_type,
        title=title,
        original_url=original_url,
        file_path=file_path,
        uploaded_by=uploaded_by,
        status="pending",
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


async def run_document_ingestion(
    document_id: uuid.UUID,
    tenant_id: uuid.UUID,
    raw_faq_text: Optional[str] = None,
) -> None:
    """
    Background worker that extracts text, generates chunks, computes embeddings,
    and indexes them into Postgres and Qdrant.
    """
    db: Session = SessionLocal()
    try:
        # Load document strictly filtered by tenant_id
        doc = db.scalar(
            select(Document).where(
                Document.id == document_id,
                Document.tenant_id == tenant_id,
            )
        )
        if not doc:
            logger.error("Ingestion failed: Document %s not found for tenant %s", document_id, tenant_id)
            return

        # 1. Update status to 'processing'
        doc.status = "processing"
        doc.error_message = None
        db.commit()

        # 2. Extract text according to source type
        extracted_text: str = ""
        if doc.source_type == "pdf":
            if not doc.file_path or not os.path.exists(doc.file_path):
                raise ValueError("PDF file is missing or not accessible on disk.")
            extracted_text = extract_text_from_pdf(doc.file_path)

        elif doc.source_type == "url":
            if not doc.original_url:
                raise ValueError("No URL provided for document.")
            page_title, extracted_text = await extract_text_from_url(doc.original_url)
            # Update title if it was placeholder
            if not doc.title or doc.title == doc.original_url:
                doc.title = page_title

        elif doc.source_type == "faq_text":
            if not raw_faq_text or not raw_faq_text.strip():
                raise ValueError("FAQ text content cannot be empty.")
            extracted_text = raw_faq_text.strip()

        else:
            raise ValueError(f"Unsupported source type: {doc.source_type}")

        # 3. Segment into chunks
        chunks = chunk_text(extracted_text)
        if not chunks:
            raise ValueError("Document contains no parseable text chunks.")

        # 4. Generate embeddings
        embeddings = await generate_embeddings(chunks)

        # 5. Insert DocumentChunk rows in Postgres and collect Qdrant points
        chunk_data = []  # (chunk_db_id, qdrant_point_id, chunk_text, vector)

        for idx, (chunk_str, vector) in enumerate(zip(chunks, embeddings)):
            qdrant_point_id = uuid.uuid4()
            chunk_row = DocumentChunk(
                tenant_id=tenant_id,
                document_id=doc.id,
                chunk_index=idx,
                content=chunk_str,
                qdrant_point_id=qdrant_point_id,
            )
            db.add(chunk_row)
            db.flush()  # Flush to get chunk_row.id
            chunk_data.append((chunk_row.id, qdrant_point_id, chunk_str, vector))

        # 6. Upsert vectors to Qdrant scoped to this tenant
        upsert_chunks_to_qdrant(
            tenant_id=tenant_id,
            document_id=doc.id,
            chunk_data=chunk_data,
        )

        # 7. Mark as ready
        doc.status = "ready"
        doc.error_message = None
        db.commit()
        logger.info(
            "Document %s (tenant %s) successfully processed with %d chunks.",
            document_id,
            tenant_id,
            len(chunks),
        )

    except Exception as exc:
        db.rollback()
        logger.exception("Failed ingesting document %s: %s", document_id, exc)
        try:
            doc = db.scalar(
                select(Document).where(
                    Document.id == document_id,
                    Document.tenant_id == tenant_id,
                )
            )
            if doc:
                doc.status = "failed"
                doc.error_message = str(exc)
                db.commit()
        except Exception as update_err:
            logger.error("Could not record error state for document %s: %s", document_id, update_err)
    finally:
        db.close()


def get_tenant_documents(db: Session, tenant_id: uuid.UUID) -> List[dict]:
    """Retrieve all documents for a tenant, including chunk counts."""
    # Query documents with a subquery count of chunks
    stmt = (
        select(
            Document,
            func.count(DocumentChunk.id).label("chunk_count"),
        )
        .outerjoin(DocumentChunk, DocumentChunk.document_id == Document.id)
        .where(Document.tenant_id == tenant_id)
        .group_by(Document.id)
        .order_by(Document.created_at.desc())
    )

    results = db.execute(stmt).all()
    output = []
    for doc, count in results:
        doc_dict = {
            "id": doc.id,
            "tenant_id": doc.tenant_id,
            "source_type": doc.source_type,
            "title": doc.title,
            "original_url": doc.original_url,
            "status": doc.status,
            "error_message": doc.error_message,
            "chunk_count": count,
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
        }
        output.append(doc_dict)
    return output


def get_document_by_id(db: Session, tenant_id: uuid.UUID, document_id: uuid.UUID) -> Optional[Document]:
    """Fetch single document strictly scoped to tenant_id."""
    return db.scalar(
        select(Document).where(
            Document.id == document_id,
            Document.tenant_id == tenant_id,
        )
    )


def delete_document(db: Session, tenant_id: uuid.UUID, document_id: uuid.UUID) -> bool:
    """
    Delete document from Postgres (cascades to chunks) and purge Qdrant vectors.
    """
    doc = get_document_by_id(db, tenant_id, document_id)
    if not doc:
        return False

    # 1. Purge vectors from Qdrant
    try:
        delete_document_vectors(tenant_id, document_id)
    except Exception as exc:
        logger.warning("Error deleting vectors from Qdrant: %s", exc)

    # 2. Delete local file if it was a PDF upload
    if doc.file_path and os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError as exc:
            logger.warning("Failed to remove file %s: %s", doc.file_path, exc)

    # 3. Delete from Postgres
    db.delete(doc)
    db.commit()
    return True
