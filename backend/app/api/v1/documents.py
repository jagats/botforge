"""Document API routes for uploading, listing, and deleting tenant knowledge sources."""

import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_tenant_id, get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.document import (
    DocumentUrlCreate,
    DocumentFaqCreate,
    DocumentResponse,
    DocumentListResponse,
)
from app.services.document_service import (
    create_document_record,
    run_document_ingestion,
    get_tenant_documents,
    get_document_by_id,
    delete_document,
)

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_pdf_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload a PDF document to be parsed, chunked, and vectorized for the authenticated tenant.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported for file upload.",
        )

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Sanitize and create unique file path
    safe_filename = f"{tenant_id}_{uuid.uuid4().hex[:8]}_{os.path.basename(file.filename)}"
    destination_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    # Write file to disk
    try:
        with open(destination_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {exc}",
        )
    finally:
        file.file.close()

    # Check file size limit
    file_size_mb = os.path.getsize(destination_path) / (1024 * 1024)
    if file_size_mb > settings.MAX_UPLOAD_SIZE_MB:
        os.remove(destination_path)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum upload size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
        )

    # Clean title
    doc_title = os.path.splitext(file.filename)[0].replace("_", " ").replace("-", " ").title()

    # Create document record
    document = create_document_record(
        db=db,
        tenant_id=tenant_id,
        source_type="pdf",
        title=doc_title,
        file_path=destination_path,
        uploaded_by=current_user.id,
    )

    # Queue background task for ingestion and vectorization
    background_tasks.add_task(run_document_ingestion, document.id, tenant_id)

    return DocumentResponse(
        id=document.id,
        tenant_id=document.tenant_id,
        source_type=document.source_type,
        title=document.title,
        original_url=None,
        status=document.status,
        error_message=None,
        chunk_count=0,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


@router.post("/url", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_url_document(
    payload: DocumentUrlCreate,
    background_tasks: BackgroundTasks,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Ingest text from a web page URL.
    """
    title = payload.title or payload.url

    document = create_document_record(
        db=db,
        tenant_id=tenant_id,
        source_type="url",
        title=title,
        original_url=payload.url,
        uploaded_by=current_user.id,
    )

    background_tasks.add_task(run_document_ingestion, document.id, tenant_id)

    return DocumentResponse(
        id=document.id,
        tenant_id=document.tenant_id,
        source_type=document.source_type,
        title=document.title,
        original_url=document.original_url,
        status=document.status,
        error_message=None,
        chunk_count=0,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


@router.post("/faq", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def ingest_faq_document(
    payload: DocumentFaqCreate,
    background_tasks: BackgroundTasks,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Ingest a raw text FAQ entry or business knowledge snippet.
    """
    document = create_document_record(
        db=db,
        tenant_id=tenant_id,
        source_type="faq_text",
        title=payload.title,
        uploaded_by=current_user.id,
    )

    background_tasks.add_task(
        run_document_ingestion,
        document.id,
        tenant_id,
        raw_faq_text=payload.faq_text,
    )

    return DocumentResponse(
        id=document.id,
        tenant_id=document.tenant_id,
        source_type=document.source_type,
        title=document.title,
        original_url=None,
        status=document.status,
        error_message=None,
        chunk_count=0,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


@router.get("", response_model=DocumentListResponse)
def list_documents(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    """
    List all documents and their indexing status for the authenticated tenant.
    """
    documents = get_tenant_documents(db, tenant_id)
    return DocumentListResponse(
        documents=[DocumentResponse(**doc) for doc in documents],
        total=len(documents),
    )


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    """
    Get a single document's metadata and ingestion status.
    """
    doc = get_document_by_id(db, tenant_id, document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    chunk_count = len(doc.chunks) if doc.chunks else 0
    return DocumentResponse(
        id=doc.id,
        tenant_id=doc.tenant_id,
        source_type=doc.source_type,
        title=doc.title,
        original_url=doc.original_url,
        status=doc.status,
        error_message=doc.error_message,
        chunk_count=chunk_count,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document_endpoint(
    document_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
):
    """
    Delete a document, its database chunks, and all associated vectors in Qdrant.
    """
    success = delete_document(db, tenant_id, document_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or does not belong to this tenant.",
        )
    return None
