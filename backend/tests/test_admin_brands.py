"""Automated integration tests for Phase 6 RBAC, superadmin brand provisioning, and lockout security."""

import uuid
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.db.seed import seed_superadmin
from app.db.session import SessionLocal
from app.main import app
from tests.conftest import provision_test_brand

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def ensure_superadmin_seeded():
    """Ensure the system superadmin exists before running admin tests."""
    db = SessionLocal()
    try:
        seed_superadmin(db)
    finally:
        db.close()


def get_superadmin_token() -> str:
    """Helper to authenticate as superadmin and retrieve access token."""
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": settings.SUPERADMIN_EMAIL,
            "password": settings.SUPERADMIN_PASSWORD,
        },
    )
    assert res.status_code == 200, f"Superadmin login failed: {res.text}"
    return res.json()["access_token"]


def test_superadmin_seed_and_login():
    """Verify master superadmin can authenticate and has superadmin role."""
    res = client.post(
        "/api/v1/auth/login",
        json={
            "email": settings.SUPERADMIN_EMAIL,
            "password": settings.SUPERADMIN_PASSWORD,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "superadmin"

    # Verify profile via /me
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["role"] == "superadmin"
    assert profile["email"] == settings.SUPERADMIN_EMAIL.lower().strip()
    assert profile["is_active"] is True


def test_public_signup_route_is_not_found():
    """Verify that public signup route does not exist and returns 404."""
    res = client.post(
        "/api/v1/auth/signup",
        json={
            "company_name": "Random Public Org",
            "email": f"public_{uuid.uuid4().hex[:6]}@example.com",
            "password": "Password123!",
        },
    )
    assert res.status_code in [404, 405]


def test_admin_brands_rbac_protection():
    """Verify that unauthenticated visitors and regular brand owners cannot access admin endpoints."""
    # 1. Unauthenticated -> 401 or 403
    res = client.get("/api/v1/admin/brands")
    assert res.status_code in [401, 403]

    # 2. Regular client brand owner -> 403 Forbidden
    brand = provision_test_brand(company_name="Client Regular")
    owner_token = brand["access_token"]

    forbidden_res = client.get(
        "/api/v1/admin/brands",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert forbidden_res.status_code == 403
    assert "superadmin" in forbidden_res.json()["detail"].lower()


def test_brand_provisioning_lifecycle_and_lockout():
    """Test full brand lifecycle: onboard -> list -> suspend -> lockout -> reactivate -> offboard."""
    admin_token = get_superadmin_token()
    headers = {"Authorization": f"Bearer {admin_token}"}

    brand_name = f"Nova Health {uuid.uuid4().hex[:4]}"
    brand_email = f"admin_{uuid.uuid4().hex[:6]}@novahealth.com"
    brand_password = "NovaSecurePass2026!"

    # 1. Onboard new brand via POST /admin/brands
    create_res = client.post(
        "/api/v1/admin/brands",
        headers=headers,
        json={
            "company_name": brand_name,
            "email": brand_email,
            "password": brand_password,
            "plan": "starter",
        },
    )
    assert create_res.status_code == 201
    brand_data = create_res.json()
    tenant_id = brand_data["tenant_id"]
    public_key = brand_data["public_api_key"]

    assert brand_data["name"] == brand_name
    assert brand_data["owner_email"] == brand_email.lower().strip()
    assert brand_data["status"] == "active"
    assert brand_data["is_active"] is True
    assert public_key is not None and public_key.startswith("bf_pub_")

    # 2. Verify duplicate email rejected
    dup_res = client.post(
        "/api/v1/admin/brands",
        headers=headers,
        json={
            "company_name": "Another Company",
            "email": brand_email,
            "password": "Password123!",
        },
    )
    assert dup_res.status_code == 409

    # 3. Newly provisioned brand owner can log in
    owner_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": brand_email,
            "password": brand_password,
        },
    )
    assert owner_login.status_code == 200
    assert owner_login.json()["role"] == "owner"

    # 4. Brand is present in GET /admin/brands
    list_res = client.get("/api/v1/admin/brands", headers=headers)
    assert list_res.status_code == 200
    brand_list = list_res.json()
    assert brand_list["total"] >= 1
    found = any(b["tenant_id"] == tenant_id for b in brand_list["brands"])
    assert found is True

    # 5. Suspend the brand via PATCH /admin/brands/{id}/status
    suspend_res = client.patch(
        f"/api/v1/admin/brands/{tenant_id}/status",
        headers=headers,
        json={"status": "suspended"},
    )
    assert suspend_res.status_code == 200
    assert suspend_res.json()["status"] == "suspended"
    assert suspend_res.json()["is_active"] is False

    # 6. Verify suspended brand owner is locked out of login (403 Forbidden)
    locked_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": brand_email,
            "password": brand_password,
        },
    )
    assert locked_login.status_code == 403

    # 7. Verify suspended brand widget chat is blocked (403 Forbidden)
    widget_blocked = client.post(
        "/api/v1/widget/chat",
        headers={"X-Public-Key": public_key},
        json={"message": "Hello?"},
    )
    assert widget_blocked.status_code == 403

    # 8. Reactivate the brand
    activate_res = client.patch(
        f"/api/v1/admin/brands/{tenant_id}/status",
        headers=headers,
        json={"status": "active"},
    )
    assert activate_res.status_code == 200
    assert activate_res.json()["status"] == "active"
    assert activate_res.json()["is_active"] is True

    # 9. Verify owner can log in again
    restored_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": brand_email,
            "password": brand_password,
        },
    )
    assert restored_login.status_code == 200

    # 10. Delete the brand via DELETE /admin/brands/{id}
    delete_res = client.delete(
        f"/api/v1/admin/brands/{tenant_id}",
        headers=headers,
    )
    assert delete_res.status_code == 204

    # 11. Verify brand is removed
    get_res = client.get(f"/api/v1/admin/brands/{tenant_id}", headers=headers)
    assert get_res.status_code == 404


def test_superadmin_impersonate_brand():
    """Verify superadmin can impersonate a client brand dashboard and non-admins are forbidden."""
    headers = {"Authorization": f"Bearer {get_superadmin_token()}"}

    # 1. Onboard a test brand
    company_name = f"ImpersonateTest_{uuid.uuid4().hex[:6]}"
    brand_email = f"owner_{uuid.uuid4().hex[:6]}@example.com"
    onboard_res = client.post(
        "/api/v1/admin/brands",
        headers=headers,
        json={
            "company_name": company_name,
            "email": brand_email,
            "password": "SecurePassword123!",
            "plan": "pro",
        },
    )
    assert onboard_res.status_code == 201
    tenant_id = onboard_res.json()["tenant_id"]

    try:
        # 2. Superadmin requests impersonation token
        impersonate_res = client.post(
            f"/api/v1/admin/brands/{tenant_id}/impersonate",
            headers=headers,
        )
        assert impersonate_res.status_code == 200
        assert "botforge_impersonation_token" in impersonate_res.cookies
        data = impersonate_res.json()
        assert "access_token" in data
        assert data["tenant_id"] == tenant_id
        assert data["brand_name"] == company_name
        assert data["is_impersonated"] is True
        assert data["impersonated_by"] == settings.SUPERADMIN_EMAIL.lower().strip()

        # 3. Use impersonation token to query client's /tenants/me
        impersonated_headers = {"Authorization": f"Bearer {data['access_token']}"}
        me_res = client.get("/api/v1/tenants/me", headers=impersonated_headers)
        assert me_res.status_code == 200
        assert me_res.json()["id"] == tenant_id
        assert me_res.json()["name"] == company_name

        # 4. Verify non-superadmin cannot impersonate
        forbidden_res = client.post(
            f"/api/v1/admin/brands/{tenant_id}/impersonate",
            headers=impersonated_headers,
        )
        assert forbidden_res.status_code == 403
    finally:
        client.delete(f"/api/v1/admin/brands/{tenant_id}", headers=headers)


def test_exit_impersonation_endpoint():
    """Verify exit-impersonation clears the botforge_impersonation_token cookie."""
    token = get_superadmin_token()
    headers = {"Authorization": f"Bearer {token}"}
    exit_res = client.post("/api/v1/admin/brands/exit-impersonation", headers=headers)
    assert exit_res.status_code == 200
    assert exit_res.json()["message"] == "Successfully exited impersonation session"


