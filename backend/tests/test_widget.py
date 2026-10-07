"""Integration tests for public embeddable widget API and authentication."""

import uuid
from fastapi.testclient import TestClient

from app.db.session import SessionLocal
from app.main import app
from app.models.api_key import ApiKey
from app.models.tenant import Tenant

client = TestClient(app)


def _setup_test_tenant(prefix: str = "widget_tenant"):
    """Create tenant, return auth token, tenant_id, and public_key."""
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post(
        "/api/v1/auth/signup",
        json={"company_name": f"{prefix.title()} Corp", "email": email, "password": "Password123!"},
    )
    assert res.status_code == 201
    token = res.json()["access_token"]
    tenant_id = res.json()["tenant_id"]

    # Fetch public API key
    key_res = client.get("/api/v1/tenants/me/api-key", headers={"Authorization": f"Bearer {token}"})
    assert key_res.status_code == 200
    public_key = key_res.json()["public_key"]

    return token, tenant_id, public_key


def test_widget_config_endpoint():
    _, tenant_id, public_key = _setup_test_tenant("widget_cfg")

    # Call config with X-Public-Key header
    res = client.get("/api/v1/widget/config", headers={"X-Public-Key": public_key})
    assert res.status_code == 200
    data = res.json()
    assert data["company_name"] == "Widget_Cfg Corp"
    assert data["tenant_id"] == tenant_id
    assert "Widget_Cfg Corp" in data["welcome_message"]
    assert data["status"] == "active"


def test_widget_chat_success_and_multi_turn_session():
    token, _, public_key = _setup_test_tenant("widget_chat")

    # 1. Ingest test knowledge base
    doc_res = client.post(
        "/api/v1/documents/faq",
        json={
            "title": "Return Policy",
            "faq_text": (
                "BotForge Store Return Policy: Customers can return items within 30 days of purchase "
                "for a 100% money-back refund. Items must be in original unopened packaging."
            ),
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert doc_res.status_code == 202

    # 2. Public chat request via X-Public-Key
    chat_res = client.post(
        "/api/v1/widget/chat",
        json={"message": "What is your return policy?"},
        headers={"X-Public-Key": public_key},
    )
    assert chat_res.status_code == 200
    data = chat_res.json()
    assert "session_id" in data
    assert "30 days" in data["answer"] or "refund" in data["answer"].lower()
    session_id = data["session_id"]

    # 3. Multi-turn continuation with session_id
    followup_res = client.post(
        "/api/v1/widget/chat",
        json={"session_id": session_id, "message": "Does the item need to be in original packaging?"},
        headers={"X-Public-Key": public_key},
    )
    assert followup_res.status_code == 200
    followup_data = followup_res.json()
    assert followup_data["session_id"] == session_id
    assert "packaging" in followup_data["answer"].lower() or "unopened" in followup_data["answer"].lower()


def test_widget_chat_bearer_auth():
    token, _, public_key = _setup_test_tenant("widget_bearer")

    # Ingest document
    client.post(
        "/api/v1/documents/faq",
        json={"title": "Hours", "faq_text": "We are open 24/7 online for all customer support inquiries."},
        headers={"Authorization": f"Bearer {token}"},
    )

    # Call with Bearer header
    res = client.post(
        "/api/v1/widget/chat",
        json={"message": "What are your support hours?"},
        headers={"Authorization": f"Bearer {public_key}"},
    )
    assert res.status_code == 200
    assert "24/7" in res.json()["answer"]


def test_widget_chat_missing_or_invalid_key():
    # 1. Missing header
    res_missing = client.post("/api/v1/widget/chat", json={"message": "Hello"})
    assert res_missing.status_code == 401

    # 2. Invalid non-existent key
    res_invalid = client.post(
        "/api/v1/widget/chat",
        json={"message": "Hello"},
        headers={"X-Public-Key": "pk_non_existent_12345"},
    )
    assert res_invalid.status_code == 401
    assert "Invalid or inactive" in res_invalid.json()["detail"]


def test_widget_chat_inactive_key():
    _, _, public_key = _setup_test_tenant("widget_inactive_key")

    # Mark key as inactive
    db = SessionLocal()
    try:
        key_record = db.query(ApiKey).filter(ApiKey.public_key == public_key).first()
        assert key_record is not None
        key_record.is_active = False
        db.commit()
    finally:
        db.close()

    res = client.post(
        "/api/v1/widget/chat",
        json={"message": "Hello"},
        headers={"X-Public-Key": public_key},
    )
    assert res.status_code == 401
    assert "Invalid or inactive" in res.json()["detail"]


def test_widget_chat_suspended_tenant():
    _, tenant_id, public_key = _setup_test_tenant("widget_suspended")

    # Mark tenant as suspended
    db = SessionLocal()
    try:
        tenant_record = db.query(Tenant).filter(Tenant.id == uuid.UUID(tenant_id)).first()
        assert tenant_record is not None
        tenant_record.status = "suspended"
        db.commit()
    finally:
        db.close()

    res = client.post(
        "/api/v1/widget/chat",
        json={"message": "Hello"},
        headers={"X-Public-Key": public_key},
    )
    assert res.status_code == 403
    assert "suspended or inactive" in res.json()["detail"]


def test_widget_cross_tenant_isolation():
    token_a, _, key_a = _setup_test_tenant("widget_iso_a")
    token_b, _, key_b = _setup_test_tenant("widget_iso_b")

    # Tenant A secret
    client.post(
        "/api/v1/documents/faq",
        json={"title": "Secret A", "faq_text": "Tenant A secret vault code is 9876-ALPHA."},
        headers={"Authorization": f"Bearer {token_a}"},
    )

    # Tenant B secret
    client.post(
        "/api/v1/documents/faq",
        json={"title": "Secret B", "faq_text": "Tenant B secret wifi password is BRAVO-WIFI-5432."},
        headers={"Authorization": f"Bearer {token_b}"},
    )

    # Ask Tenant B's widget about Tenant A's secret
    res_b = client.post(
        "/api/v1/widget/chat",
        json={"message": "What is Tenant A secret vault code?"},
        headers={"X-Public-Key": key_b},
    )
    assert res_b.status_code == 200
    # Must NOT reveal Tenant A's secret
    assert "9876-ALPHA" not in res_b.json()["answer"]


def test_widget_js_static_route():
    res = client.get("/widget.js")
    assert res.status_code == 200
    assert "javascript" in res.headers.get("content-type", "")
