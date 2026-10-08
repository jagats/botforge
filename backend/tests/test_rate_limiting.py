"""Tests for in-memory sliding window rate limiter and endpoint protection."""

import time
import uuid
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.rate_limiter import InMemoryRateLimiter, limiter
from app.main import app

client = TestClient(app)


def test_in_memory_rate_limiter_unit():
    """Verify sliding window algorithm logic, thresholds, and window recovery."""
    test_limiter = InMemoryRateLimiter()
    key = "test_unit_key"
    max_reqs = 3
    window = 2  # 2 seconds

    # First 3 requests should pass
    for _ in range(max_reqs):
        is_limited, retry_after = test_limiter.is_rate_limited(key, max_reqs, window)
        assert is_limited is False
        assert retry_after == 0

    # 4th request must be blocked
    is_limited, retry_after = test_limiter.is_rate_limited(key, max_reqs, window)
    assert is_limited is True
    assert retry_after >= 1

    # Wait for window to slide out
    time.sleep(2.1)

    # Next request should pass again
    is_limited, retry_after = test_limiter.is_rate_limited(key, max_reqs, window)
    assert is_limited is False
    assert retry_after == 0


def test_widget_chat_rate_limiting():
    """Verify that widget chat endpoint returns 429 when client exceeds request limit."""
    limiter.reset()

    # Create test tenant
    email = f"ratelimit_widget_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post(
        "/api/v1/auth/signup",
        json={"company_name": "Rate Limit Co", "email": email, "password": "Password123!"},
    )
    assert res.status_code == 201
    token = res.json()["access_token"]

    key_res = client.get("/api/v1/tenants/me/api-key", headers={"Authorization": f"Bearer {token}"})
    public_key = key_res.json()["public_key"]

    # Temporarily lower the threshold for test speed
    original_ip_limit = settings.RATE_LIMIT_WIDGET_IP_PER_MINUTE
    settings.RATE_LIMIT_WIDGET_IP_PER_MINUTE = 3

    try:
        # First 3 requests should succeed
        for i in range(3):
            chat_res = client.post(
                "/api/v1/widget/chat",
                json={"message": f"Hello {i}"},
                headers={"X-Public-Key": public_key, "X-Forwarded-For": "198.51.100.1"},
            )
            assert chat_res.status_code == 200

        # 4th request must trigger 429 Too Many Requests
        blocked_res = client.post(
            "/api/v1/widget/chat",
            json={"message": "Exceeded request"},
            headers={"X-Public-Key": public_key, "X-Forwarded-For": "198.51.100.1"},
        )
        assert blocked_res.status_code == 429
        assert "Too many chat requests" in blocked_res.json()["detail"]
        assert "Retry-After" in blocked_res.headers
    finally:
        settings.RATE_LIMIT_WIDGET_IP_PER_MINUTE = original_ip_limit
        limiter.reset()


def test_auth_login_rate_limiting():
    """Verify that auth endpoints reject excessive login attempts with 429."""
    limiter.reset()

    original_auth_limit = settings.RATE_LIMIT_AUTH_PER_MINUTE
    settings.RATE_LIMIT_AUTH_PER_MINUTE = 2

    fake_ip = "203.0.113.42"

    try:
        # First 2 requests should be processed (and return 401 for wrong credentials)
        for _ in range(2):
            res = client.post(
                "/api/v1/auth/login",
                json={"email": "wrong@example.com", "password": "wrongpassword"},
                headers={"X-Forwarded-For": fake_ip},
            )
            assert res.status_code == 401

        # 3rd request should immediately be rejected with 429
        blocked_res = client.post(
            "/api/v1/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpassword"},
            headers={"X-Forwarded-For": fake_ip},
        )
        assert blocked_res.status_code == 429
        assert "Too many authentication requests" in blocked_res.json()["detail"]
        assert "Retry-After" in blocked_res.headers
    finally:
        settings.RATE_LIMIT_AUTH_PER_MINUTE = original_auth_limit
        limiter.reset()
