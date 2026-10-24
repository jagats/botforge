"""Gate 2 hardening tests: security headers, PDF magic-byte check, audit logging."""

import uuid

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.db.seed import seed_superadmin
from app.db.session import SessionLocal
from app.main import app
from app.models.audit_log import AuditLog
from tests.conftest import provision_test_brand

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def ensure_superadmin_seeded():
    db = SessionLocal()
    try:
        seed_superadmin(db)
    finally:
        db.close()


def test_security_headers_present():
    """Baseline security headers are attached to responses (finding M-07)."""
    res = client.get("/health")
    assert res.headers.get("X-Content-Type-Options") == "nosniff"
    assert res.headers.get("X-Frame-Options") == "DENY"
    assert "default-src 'none'" in res.headers.get("Content-Security-Policy", "")


def test_pdf_magic_byte_rejected():
    """A .pdf file whose bytes are not a real PDF is rejected (finding M-06)."""
    brand = provision_test_brand(
        company_name="Magic Co", email=f"magic_{uuid.uuid4().hex[:8]}@example.com"
    )
    headers = {"Authorization": f"Bearer {brand['access_token']}"}
    files = {"file": ("fake.pdf", b"this is not really a pdf", "application/pdf")}
    res = client.post("/api/v1/documents/upload", files=files, headers=headers)
    assert res.status_code == 400
    assert "valid PDF" in res.json()["detail"]


def test_impersonation_is_audited():
    """Impersonating a brand writes an audit-log row (finding M-02)."""
    # Provision a brand to impersonate.
    brand = provision_test_brand(
        company_name="Audit Co", email=f"audit_{uuid.uuid4().hex[:8]}@example.com"
    )
    tenant_id = brand["tenant_id"]

    login = client.post(
        "/api/v1/auth/login",
        json={"email": settings.SUPERADMIN_EMAIL, "password": settings.SUPERADMIN_PASSWORD},
    )
    admin_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    res = client.post(
        f"/api/v1/admin/brands/{tenant_id}/impersonate",
        headers=admin_headers,
    )
    assert res.status_code == 200

    db = SessionLocal()
    try:
        count = (
            db.query(AuditLog)
            .filter(
                AuditLog.action == "brand.impersonate",
                AuditLog.target_tenant_id == uuid.UUID(tenant_id),
            )
            .count()
        )
    finally:
        db.close()
    assert count >= 1
