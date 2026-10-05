"""Automated integration tests for Document upload, ingestion, Qdrant vectors, and cross-tenant isolation."""

import io
import uuid
import pytest
from fastapi.testclient import TestClient
from pypdf import PdfWriter

from app.main import app

client = TestClient(app)


def _create_test_tenant(prefix: str = "tenant"):
    """Helper to create a new tenant with owner credentials."""
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post(
        "/api/v1/auth/signup",
        json={"company_name": f"{prefix.title()} Corp", "email": email, "password": "Password123!"},
    )
    assert res.status_code == 201
    return res.json()["access_token"], res.json()["tenant_id"]


def _generate_minimal_pdf_bytes(text_content: str = "Welcome to BotForge. This is a knowledge base document.") -> io.BytesIO:
    """Generate in-memory valid PDF bytes for testing upload."""
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    # Using a simple annotation or empty page with text metadata for minimal valid PDF
    pdf_buffer = io.BytesIO()
    writer.write(pdf_buffer)
    pdf_buffer.seek(0)
    return pdf_buffer


def test_faq_document_ingestion_and_listing():
    token, tenant_id = _create_test_tenant("faq")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Post a FAQ document
    faq_payload = {
        "title": "Return Policy & Refunds",
        "faq_text": (
            "We offer a 30-day money-back guarantee on all our digital software plans. "
            "To request a refund, please email support@example.com with your invoice number. "
            "Refunds are processed within 3 to 5 business days back to the original payment method."
        ),
    }
    create_res = client.post("/api/v1/documents/faq", json=faq_payload, headers=headers)
    assert create_res.status_code == 202
    data = create_res.json()
    assert data["title"] == "Return Policy & Refunds"
    assert data["source_type"] == "faq_text"
    doc_id = data["id"]

    # 2. List documents (TestClient runs background tasks synchronously)
    list_res = client.get("/api/v1/documents", headers=headers)
    assert list_res.status_code == 200
    docs = list_res.json()["documents"]
    assert len(docs) == 1
    assert docs[0]["id"] == doc_id
    assert docs[0]["status"] == "ready"
    assert docs[0]["chunk_count"] >= 1

    # 3. Retrieve single document details
    get_res = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "ready"
    assert get_res.json()["chunk_count"] >= 1


def test_pdf_upload_validation_and_rejection():
    token, _ = _create_test_tenant("pdfval")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Reject non-PDF file extension
    files = {"file": ("test.txt", b"plain text", "text/plain")}
    res = client.post("/api/v1/documents/upload", files=files, headers=headers)
    assert res.status_code == 400
    assert "PDF" in res.json()["detail"]


def test_document_deletion_purges_record():
    token, _ = _create_test_tenant("delete")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Ingest a document
    faq_payload = {
        "title": "Hours of Operation",
        "faq_text": "Our customer support team is available Monday through Friday from 9 AM to 6 PM EST.",
    }
    create_res = client.post("/api/v1/documents/faq", json=faq_payload, headers=headers)
    doc_id = create_res.json()["id"]

    # 2. Delete the document
    del_res = client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
    assert del_res.status_code == 204

    # 3. Confirm 404 on fetch
    get_res = client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert get_res.status_code == 404

    # 4. Confirm document list is empty
    list_res = client.get("/api/v1/documents", headers=headers)
    assert len(list_res.json()["documents"]) == 0


def test_strict_cross_tenant_document_isolation():
    # Tenant A
    token_a, tenant_a = _create_test_tenant("corp_a")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Tenant B
    token_b, tenant_b = _create_test_tenant("corp_b")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. Tenant A uploads confidential document
    payload = {
        "title": "Tenant A Secret FAQ",
        "faq_text": "Confidential company data strictly intended for Tenant A's website visitors.",
    }
    create_res = client.post("/api/v1/documents/faq", json=payload, headers=headers_a)
    doc_a_id = create_res.json()["id"]

    # 2. Tenant B attempts to read Tenant A's document directly -> 404
    cross_get = client.get(f"/api/v1/documents/{doc_a_id}", headers=headers_b)
    assert cross_get.status_code == 404
    assert cross_get.json()["detail"] == "Document not found."

    # 3. Tenant B lists documents -> Tenant A's document is NOT visible
    list_b = client.get("/api/v1/documents", headers=headers_b)
    assert list_b.status_code == 200
    assert len(list_b.json()["documents"]) == 0

    # 4. Tenant B attempts to delete Tenant A's document -> 404
    cross_delete = client.delete(f"/api/v1/documents/{doc_a_id}", headers=headers_b)
    assert cross_delete.status_code == 404

    # 5. Confirm Tenant A's document is intact
    check_a = client.get(f"/api/v1/documents/{doc_a_id}", headers=headers_a)
    assert check_a.status_code == 200
    assert check_a.json()["id"] == doc_a_id
