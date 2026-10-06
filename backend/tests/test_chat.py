"""Integration tests for RAG chat endpoint, session management, and tenant isolation."""

import uuid
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _create_test_tenant(prefix: str = "chat_tenant"):
    """Helper to create a new tenant with owner credentials."""
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post(
        "/api/v1/auth/signup",
        json={"company_name": f"{prefix.title()} Corp", "email": email, "password": "Password123!"},
    )
    assert res.status_code == 201
    return res.json()["access_token"], res.json()["tenant_id"]


def test_chat_new_session_and_message_persistence():
    token, tenant_id = _create_test_tenant("chat_persist")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Ingest knowledge document
    faq_payload = {
        "title": "Pricing & Plans",
        "faq_text": (
            "Our Pro subscription plan costs $49 per month and includes unlimited AI conversations, "
            "custom branding, and priority support. Enterprise plan is customized per client."
        ),
    }
    doc_res = client.post("/api/v1/documents/faq", json=faq_payload, headers=headers)
    assert doc_res.status_code == 202

    # 2. First chat query (creates session automatically)
    chat_res = client.post(
        "/api/v1/chat",
        json={"message": "How much does the Pro subscription cost?"},
        headers=headers,
    )
    assert chat_res.status_code == 200
    data = chat_res.json()
    assert "session_id" in data
    session_id = data["session_id"]
    assert len(data["sources"]) > 0
    assert len(data["source_chunks"]) > 0
    assert "$49" in data["answer"] or "Pro" in data["answer"]

    # 3. Follow-up query in same session
    followup_res = client.post(
        "/api/v1/chat",
        json={"session_id": session_id, "message": "What is included with priority support?"},
        headers=headers,
    )
    assert followup_res.status_code == 200
    followup_data = followup_res.json()
    assert followup_data["session_id"] == session_id

    # 4. Verify session history endpoint
    session_history_res = client.get(f"/api/v1/chat/sessions/{session_id}", headers=headers)
    assert session_history_res.status_code == 200
    history_data = session_history_res.json()
    assert history_data["id"] == session_id
    assert len(history_data["messages"]) == 4  # 2 user messages, 2 assistant responses
    assert history_data["messages"][0]["role"] == "user"
    assert history_data["messages"][1]["role"] == "assistant"
    assert history_data["messages"][2]["role"] == "user"
    assert history_data["messages"][3]["role"] == "assistant"


def test_chat_cross_tenant_isolation():
    # Tenant A
    token_a, tenant_a_id = _create_test_tenant("tenant_a")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    client.post(
        "/api/v1/documents/faq",
        json={
            "title": "Confidential A",
            "faq_text": "Tenant A top secret project code is PROJECT-ALPHA-7788.",
        },
        headers=headers_a,
    )

    # Tenant B
    token_b, tenant_b_id = _create_test_tenant("tenant_b")
    headers_b = {"Authorization": f"Bearer {token_b}"}
    client.post(
        "/api/v1/documents/faq",
        json={
            "title": "Confidential B",
            "faq_text": "Tenant B public support hours are Monday to Friday 9am to 5pm.",
        },
        headers=headers_b,
    )

    # 1. Tenant A starts a chat session
    chat_a_res = client.post(
        "/api/v1/chat",
        json={"message": "What is the top secret project code?"},
        headers=headers_a,
    )
    assert chat_a_res.status_code == 200
    session_a_id = chat_a_res.json()["session_id"]
    assert "PROJECT-ALPHA-7788" in chat_a_res.json()["answer"]

    # 2. Tenant B asks about Tenant A's secret - must NOT retrieve Tenant A's info
    chat_b_res = client.post(
        "/api/v1/chat",
        json={"message": "What is the top secret project code for Tenant A?"},
        headers=headers_b,
    )
    assert chat_b_res.status_code == 200
    answer_b = chat_b_res.json()["answer"]
    assert "PROJECT-ALPHA-7788" not in answer_b

    # 3. Tenant B attempts to access Tenant A's session history - must return 404
    hijack_res = client.get(f"/api/v1/chat/sessions/{session_a_id}", headers=headers_b)
    assert hijack_res.status_code == 404


def test_chat_no_context_fallback():
    token, _ = _create_test_tenant("chat_empty")
    headers = {"Authorization": f"Bearer {token}"}

    # Ask question when tenant has zero knowledge base docs
    res = client.post(
        "/api/v1/chat",
        json={"message": "What is quantum field entanglement theory?"},
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["sources"]) == 0
    assert "knowledge base" in data["answer"].lower()
