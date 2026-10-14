"""Global pytest fixtures and test configuration."""

import pytest
from app.core.config import settings
from app.core.rate_limiter import limiter


@pytest.fixture(autouse=True)
def reset_rate_limiter_slate():
    """Reset the in-memory rate limiter before and after each test."""
    limiter.reset()
    yield
    limiter.reset()


@pytest.fixture(autouse=True)
def allow_signup_in_test_suite():
    """Keep signup enabled by default for existing test fixtures."""
    original = settings.ALLOW_PUBLIC_SIGNUP
    settings.ALLOW_PUBLIC_SIGNUP = True
    yield
    settings.ALLOW_PUBLIC_SIGNUP = original
