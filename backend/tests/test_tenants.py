"""Automated tests for tenant management and strict cross-tenant data isolation."""

import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_tenant_profile_and_patch():
    company = "Original Name Health"
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={"company_name": company, "email": email, "password": "Password123!"},
    )
    token = signup_res.json()["access_token"]
    tenant_id = signup_res.json()["tenant_id"]

    # 1. GET /tenants/me
    get_res = client.get(
        "/api/v1/tenants/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["name"] == company
    assert data["id"] == tenant_id
    assert data["plan"] == "trial"
    assert data["status"] == "active"

    # 2. PATCH /tenants/me
    new_name = "Updated Care Health"
    patch_res = client.patch(
        "/api/v1/tenants/me",
        json={"name": new_name},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == new_name

    # 3. Verify updated name persists
    verify_res = client.get(
        "/api/v1/tenants/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert verify_res.json()["name"] == new_name


def test_tenant_api_key():
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={"company_name": "API Key Clinic", "email": email, "password": "Password123!"},
    )
    token = signup_res.json()["access_token"]

    key_res = client.get(
        "/api/v1/tenants/me/api-key",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert key_res.status_code == 200
    key_data = key_res.json()
    assert key_data["public_key"].startswith("bf_pub_")
    assert key_data["is_active"] is True


def test_cross_tenant_isolation():
    """Verify strict tenant isolation: Tenant A and Tenant B never cross-pollinate data."""
    # Create Tenant A
    email_a = f"tenant_a_{uuid.uuid4().hex[:8]}@example.com"
    res_a = client.post(
        "/api/v1/auth/signup",
        json={"company_name": "Tenant Alpha Corp", "email": email_a, "password": "Password123!"},
    )
    token_a = res_a.json()["access_token"]
    tenant_id_a = res_a.json()["tenant_id"]

    # Create Tenant B
    email_b = f"tenant_b_{uuid.uuid4().hex[:8]}@example.com"
    res_b = client.post(
        "/api/v1/auth/signup",
        json={"company_name": "Tenant Beta Ltd", "email": email_b, "password": "Password123!"},
    )
    token_b = res_b.json()["access_token"]
    tenant_id_b = res_b.json()["tenant_id"]

    # Assert IDs are distinct
    assert tenant_id_a != tenant_id_b

    # Query with Token A -> must only receive Tenant A
    me_a = client.get("/api/v1/tenants/me", headers={"Authorization": f"Bearer {token_a}"}).json()
    assert me_a["id"] == tenant_id_a
    assert me_a["name"] == "Tenant Alpha Corp"

    # Query with Token B -> must only receive Tenant B
    me_b = client.get("/api/v1/tenants/me", headers={"Authorization": f"Bearer {token_b}"}).json()
    assert me_b["id"] == tenant_id_b
    assert me_b["name"] == "Tenant Beta Ltd"

    # API Keys are distinct
    key_a = client.get("/api/v1/tenants/me/api-key", headers={"Authorization": f"Bearer {token_a}"}).json()
    key_b = client.get("/api/v1/tenants/me/api-key", headers={"Authorization": f"Bearer {token_b}"}).json()
    assert key_a["public_key"] != key_b["public_key"]

    # Update Tenant A -> does NOT affect Tenant B
    client.patch(
        "/api/v1/tenants/me",
        json={"name": "Renamed Alpha Corp"},
        headers={"Authorization": f"Bearer {token_a}"},
    )

    check_b = client.get("/api/v1/tenants/me", headers={"Authorization": f"Bearer {token_b}"}).json()
    assert check_b["name"] == "Tenant Beta Ltd"
