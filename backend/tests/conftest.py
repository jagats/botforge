"""Global pytest fixtures and test configuration."""

import pytest
from app.core.rate_limiter import limiter


@pytest.fixture(autouse=True)
def reset_rate_limiter_slate():
    """Reset the in-memory rate limiter before and after each test."""
    limiter.reset()
    yield
    limiter.reset()
