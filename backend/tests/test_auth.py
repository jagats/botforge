"""Automated tests for authentication and multi-tenant onboarding."""

import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_signup_success():
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "company_name": "Acme Diagnostic Care",
        "email": unique_email,
        "password": "Password123!",
    }

    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.json()

    assert "tenant_id" in data
    assert "user_id" in data
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_signup_duplicate_email():
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "company_name": "Clinic Alpha",
        "email": unique_email,
        "password": "Password123!",
    }

    # First signup should succeed
    res1 = client.post("/api/v1/auth/signup", json=payload)
    assert res1.status_code == 201

    # Second signup with same email should fail with 409 Conflict
    res2 = client.post("/api/v1/auth/signup", json=payload)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]


def test_login_success():
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    password = "CorrectPassword123!"

    # Create account
    client.post(
        "/api/v1/auth/signup",
        json={
            "company_name": "Beta Labs",
            "email": unique_email,
            "password": password,
        },
    )

    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": password},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "tenant_id" in data


def test_login_invalid_password():
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"

    # Create account
    client.post(
        "/api/v1/auth/signup",
        json={
            "company_name": "Gamma Corp",
            "email": unique_email,
            "password": "RealPassword123!",
        },
    )

    # Login with wrong password
    response = client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "WrongPassword999!"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_me_authenticated():
    unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    company_name = "Delta Pharma"
    password = "SecurePassword123!"

    # Signup
    signup_res = client.post(
        "/api/v1/auth/signup",
        json={
            "company_name": company_name,
            "email": unique_email,
            "password": password,
        },
    )
    token = signup_res.json()["access_token"]

    # Access /me
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    data = me_res.json()

    assert data["email"] == unique_email
    assert data["role"] == "owner"
    assert data["company_name"] == company_name
    assert "tenant_id" in data
    assert "user_id" in data


def test_me_unauthenticated():
    # Without token
    res1 = client.get("/api/v1/auth/me")
    assert res1.status_code == 403 or res1.status_code == 401

    # With invalid token
    res2 = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_garbage_token"},
    )
    assert res2.status_code == 401
