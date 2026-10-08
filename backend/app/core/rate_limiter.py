"""In-memory sliding window rate limiter for API endpoint abuse prevention."""

import time
import threading
from collections import deque
from typing import Dict, Tuple, Optional
from fastapi import Request, HTTPException, status

from app.core.config import settings


class InMemoryRateLimiter:
    """Thread-safe in-memory sliding window rate limiter.
    
    Tracks timestamps for unique keys (e.g. client IP or public API key)
    and enforces maximum allowable requests within a sliding time window.
    """

    def __init__(self, cleanup_interval_seconds: int = 300):
        self._lock = threading.Lock()
        self._store: Dict[str, deque[float]] = {}
        self._last_cleanup = time.time()
        self._cleanup_interval = cleanup_interval_seconds

    def is_rate_limited(
        self,
        key: str,
        max_requests: int,
        window_seconds: int = 60,
    ) -> Tuple[bool, int]:
        """Check if request exceeds rate limit.
        
        Returns:
            Tuple[bool, int]: (is_limited, retry_after_seconds)
        """
        if not settings.RATE_LIMIT_ENABLED or max_requests <= 0:
            return False, 0

        now = time.time()
        window_start = now - window_seconds

        with self._lock:
            # Periodic cleanup of expired entries
            if now - self._last_cleanup > self._cleanup_interval:
                self._cleanup(now, window_seconds)

            if key not in self._store:
                self._store[key] = deque()

            timestamps = self._store[key]

            # Discard timestamps outside current sliding window
            while timestamps and timestamps[0] <= window_start:
                timestamps.popleft()

            # Check if limit reached
            if len(timestamps) >= max_requests:
                # Calculate seconds until the oldest request leaves the window
                oldest_timestamp = timestamps[0]
                retry_after = max(1, int(oldest_timestamp + window_seconds - now) + 1)
                return True, retry_after

            # Record current request timestamp
            timestamps.append(now)
            return False, 0

    def _cleanup(self, now: float, default_window: int = 60):
        """Remove stale keys from internal dictionary to free memory."""
        self._last_cleanup = now
        stale_keys = [
            k for k, q in self._store.items()
            if not q or q[-1] < (now - default_window)
        ]
        for k in stale_keys:
            del self._store[k]

    def reset(self):
        """Reset all rate limit tracking (primarily for test isolation)."""
        with self._lock:
            self._store.clear()
            self._last_cleanup = time.time()


# Global limiter instance
limiter = InMemoryRateLimiter()


def get_client_ip(request: Request) -> str:
    """Extract client IP address, supporting forwarded headers from proxies."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    if request.client and request.client.host:
        return request.client.host

    return "unknown"


def rate_limit_auth(request: Request):
    """FastAPI dependency: Rate limit authentication attempts by client IP."""
    ip = get_client_ip(request)
    key = f"auth:ip:{ip}"
    is_limited, retry_after = limiter.is_rate_limited(
        key=key,
        max_requests=settings.RATE_LIMIT_AUTH_PER_MINUTE,
        window_seconds=60,
    )
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication requests. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )


def rate_limit_widget(
    request: Request,
):
    """FastAPI dependency: Rate limit widget chat requests by IP and public API key."""
    ip = get_client_ip(request)
    
    # 1. Check IP rate limit
    ip_key = f"widget:ip:{ip}"
    is_limited, retry_after = limiter.is_rate_limited(
        key=ip_key,
        max_requests=settings.RATE_LIMIT_WIDGET_IP_PER_MINUTE,
        window_seconds=60,
    )
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many chat requests from your device. Please wait a moment before sending another message.",
            headers={"Retry-After": str(retry_after)},
        )

    # 2. Check public key / tenant rate limit
    public_key = request.headers.get("x-public-key")
    if not public_key:
        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            public_key = auth_header.split(" ", 1)[1].strip()

    if public_key:
        key_key = f"widget:key:{public_key}"
        is_limited, retry_after = limiter.is_rate_limited(
            key=key_key,
            max_requests=settings.RATE_LIMIT_WIDGET_PER_MINUTE,
            window_seconds=60,
        )
        if is_limited:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Organization chat volume limit reached. Please try again shortly.",
                headers={"Retry-After": str(retry_after)},
            )
