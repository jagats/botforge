"""Gate 1 hardening tests: widget origin whitelist, login lockout, plan quotas."""

import uuid

from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.rate_limiter import limiter
from app.db.session import SessionLocal
from app.main import app
from app.models.tenant import Tenant
from tests.conftest import provision_test_brand

client = TestClient(app)


def _set_allowed_domains(tenant_id: str, domains: list[str]) -> None:
    db = SessionLocal()
    try:
        tenant = db.query(Tenant).filter(Tenant.id == uuid.UUID(tenant_id)).first()
        tenant.allowed_domains = domains
        db.commit()
    finally:
        db.close()


def test_widget_origin_whitelist_enforced():
    """A widget key is rejected from a non-whitelisted origin and accepted from a listed one."""
    limiter.reset()
    brand = provision_test_brand(
        company_name="Origin Co", email=f"origin_{uuid.uuid4().hex[:8]}@example.com"
    )
    _set_allowed_domains(brand["tenant_id"], ["example.com"])
    key = brand["public_key"]

    blocked = client.post(
        "/api/v1/widget/chat",
        json={"message": "hi"},
        headers={"X-Public-Key": key, "Origin": "https://evil.com"},
    )
    assert blocked.status_code == 403
    assert "not authorized" in blocked.json()["detail"].lower()

    allowed = client.post(
        "/api/v1/widget/chat",
        json={"message": "hi"},
        headers={"X-Public-Key": key, "Origin": "https://example.com"},
    )
    assert allowed.status_code == 200
    limiter.reset()


def test_login_lockout_after_repeated_failures():
    """After LOGIN_MAX_FAILURES wrong attempts, the account is temporarily locked (429)."""
    limiter.reset()
    email = f"lockme_{uuid.uuid4().hex[:8]}@example.com"

    original = settings.LOGIN_MAX_FAILURES
    settings.LOGIN_MAX_FAILURES = 3
    try:
        for _ in range(3):
            res = client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": "wrong"},
            )
            assert res.status_code == 401

        locked = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "wrong"},
        )
        assert locked.status_code == 429
        assert "too many failed login" in locked.json()["detail"].lower()
    finally:
        settings.LOGIN_MAX_FAILURES = original
        limiter.reset()


def test_document_quota_enforced():
    """Uploading past the plan's document limit returns 402."""
    limiter.reset()
    brand = provision_test_brand(
        company_name="Quota Co", email=f"quota_{uuid.uuid4().hex[:8]}@example.com"
    )
    headers = {"Authorization": f"Bearer {brand['access_token']}"}

    original = dict(settings.PLAN_MAX_DOCUMENTS)
    settings.PLAN_MAX_DOCUMENTS = {**original, "starter": 1}
    try:
        first = client.post(
            "/api/v1/documents/faq",
            json={"title": "Doc 1", "faq_text": "This is the first knowledge entry."},
            headers=headers,
        )
        assert first.status_code == 202

        second = client.post(
            "/api/v1/documents/faq",
            json={"title": "Doc 2", "faq_text": "This is the second knowledge entry."},
            headers=headers,
        )
        assert second.status_code == 402
        assert "limit" in second.json()["detail"].lower()
    finally:
        settings.PLAN_MAX_DOCUMENTS = original
        limiter.reset()
