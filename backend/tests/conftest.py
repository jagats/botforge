"""Global pytest fixtures and test configuration."""

import uuid
import pytest
from app.core.config import settings
from app.core.rate_limiter import limiter
from app.core.security import create_access_token
from app.db.session import SessionLocal
from app.schemas.admin import BrandCreateRequest
from app.services.admin_service import onboard_brand


@pytest.fixture(autouse=True)
def reset_test_state(request):
    """Reset rate limiter and clear test client cookies before and after each test."""
    limiter.reset()
    client = getattr(request.module, "client", None)
    if client and hasattr(client, "cookies"):
        client.cookies.clear()
    yield
    limiter.reset()
    if client and hasattr(client, "cookies"):
        client.cookies.clear()


def provision_test_brand(
    company_name: str = "Test Brand",
    email: str = None,
    password: str = "Password123!",
    plan: str = "starter",
):
    """Helper for test suites to provision a brand tenant, owner user, and widget API key."""
    if not email:
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    db = SessionLocal()
    try:
        brand = onboard_brand(
            db,
            BrandCreateRequest(
                company_name=company_name,
                email=email,
                password=password,
                plan=plan,
            ),
        )
        token = create_access_token(
            {
                "user_id": str(brand.owner_user_id),
                "tenant_id": str(brand.tenant_id),
                "role": "owner",
            }
        )
        return {
            "tenant_id": str(brand.tenant_id),
            "user_id": str(brand.owner_user_id),
            "access_token": token,
            "public_key": brand.public_api_key,
            "email": email,
            "password": password,
        }
    finally:
        db.close()
