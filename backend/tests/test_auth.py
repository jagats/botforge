"""Automated tests for authentication and user sessions."""

import uuid
from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import provision_test_brand

client = TestClient(app)


def test_public_signup_route_is_removed():
    """Verify that public signup endpoint has been completely removed."""
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "company_name": "Acme Diagnostic Care",
        "email": unique_email,
        "password": "Password123!",
    }

    response = client.post("/api/v1/auth/signup", json=payload)
    # The route no longer exists, returning 404 Not Found or 405 Method Not Allowed
    assert response.status_code in [404, 405]


def test_login_success():
    """Verify that an onboarded brand owner can successfully authenticate and receive access token."""
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    password = "CorrectPassword123!"

    # Provision brand account via admin service helper
    brand = provision_test_brand(company_name="Beta Labs", email=email, password=password)

    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["tenant_id"] == brand["tenant_id"]
    assert data["role"] == "owner"


def test_login_invalid_password():
    """Verify that invalid password returns 401 Unauthorized."""
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    provision_test_brand(company_name="Gamma Corp", email=email, password="RealPassword123!")

    # Login with wrong password
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "WrongPassword999!"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_me_authenticated():
    """Verify that /me endpoint returns profile information for authenticated user."""
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    company_name = "Delta Pharma"
    brand = provision_test_brand(company_name=company_name, email=email)
    token = brand["access_token"]

    # Access /me
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    data = me_res.json()

    assert data["email"] == email
    assert data["role"] == "owner"
    assert data["company_name"] == company_name
    assert data["tenant_id"] == brand["tenant_id"]
    assert data["user_id"] == brand["user_id"]
    assert data["is_active"] is True


def test_me_unauthenticated():
    """Verify unauthenticated access to /me is rejected."""
    # Without token
    res1 = client.get("/api/v1/auth/me")
    assert res1.status_code in [401, 403]

    # With invalid token
    res2 = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_garbage_token"},
    )
    assert res2.status_code == 401


def test_login_sets_httponly_cookie_and_authenticates():
    """Verify login sets HttpOnly cookie and subsequent requests authenticate via cookie alone."""
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    password = "CorrectPassword123!"
    provision_test_brand(company_name="Cookie Co", email=email, password=password)

    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200
    assert "botforge_user_token" in login_res.cookies

    # Authenticate via cookie only (no Authorization header)
    me_res = client.get("/api/v1/auth/me")
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # Logout to clear cookies
    logout_res = client.post("/api/v1/auth/logout")
    assert logout_res.status_code == 200

    # Unauthenticated access rejected after logout
    after_res = client.get("/api/v1/auth/me")
    assert after_res.status_code in [401, 403]

