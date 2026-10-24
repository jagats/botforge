"""Rate limiting + brute-force lockout.

Uses a shared Redis backend when REDIS_URL is configured (correct across workers
and containers), otherwise a per-process in-memory limiter for local dev/tests.
"""

import logging
import time
import threading
from collections import deque
from typing import Dict, Optional, Tuple
from fastapi import Request, HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)


class InMemoryRateLimiter:
    """Thread-safe in-memory sliding window rate limiter (dev/test fallback).

    Also holds fixed-window counters used for login-failure lockout.
    """

    def __init__(self, cleanup_interval_seconds: int = 300):
        self._lock = threading.Lock()
        self._store: Dict[str, "deque[float]"] = {}
        # key -> (count, expires_at) for lockout-style counters
        self._counters: Dict[str, Tuple[int, float]] = {}
        self._last_cleanup = time.time()
        self._cleanup_interval = cleanup_interval_seconds

    def is_rate_limited(
        self,
        key: str,
        max_requests: int,
        window_seconds: int = 60,
    ) -> Tuple[bool, int]:
        """Check if request exceeds rate limit. Returns (is_limited, retry_after_seconds)."""
        if not settings.RATE_LIMIT_ENABLED or max_requests <= 0:
            return False, 0

        now = time.time()
        window_start = now - window_seconds

        with self._lock:
            if now - self._last_cleanup > self._cleanup_interval:
                self._cleanup(now, window_seconds)

            if key not in self._store:
                self._store[key] = deque()
            timestamps = self._store[key]

            while timestamps and timestamps[0] <= window_start:
                timestamps.popleft()

            if len(timestamps) >= max_requests:
                oldest_timestamp = timestamps[0]
                retry_after = max(1, int(oldest_timestamp + window_seconds - now) + 1)
                return True, retry_after

            timestamps.append(now)
            return False, 0

    def increment_counter(self, key: str, window_seconds: int) -> int:
        """Increment a fixed-window counter and return the new count."""
        now = time.time()
        with self._lock:
            count, expires_at = self._counters.get(key, (0, 0.0))
            if now >= expires_at:
                count, expires_at = 0, now + window_seconds
            count += 1
            self._counters[key] = (count, expires_at)
            return count

    def get_counter(self, key: str) -> int:
        now = time.time()
        with self._lock:
            count, expires_at = self._counters.get(key, (0, 0.0))
            if now >= expires_at:
                return 0
            return count

    def clear_counter(self, key: str) -> None:
        with self._lock:
            self._counters.pop(key, None)

    def _cleanup(self, now: float, default_window: int = 60):
        self._last_cleanup = now
        stale_keys = [
            k for k, q in self._store.items()
            if not q or q[-1] < (now - default_window)
        ]
        for k in stale_keys:
            del self._store[k]
        stale_counters = [k for k, (_c, exp) in self._counters.items() if now >= exp]
        for k in stale_counters:
            del self._counters[k]

    def reset(self):
        """Reset all tracking (test isolation)."""
        with self._lock:
            self._store.clear()
            self._counters.clear()
            self._last_cleanup = time.time()


class RedisRateLimiter:
    """Shared fixed-window rate limiter + counters backed by Redis."""

    def __init__(self, redis_url: str):
        import redis  # imported lazily so the dep is only needed when REDIS_URL is set

        self._r = redis.Redis.from_url(redis_url, socket_timeout=1.0, decode_responses=True)

    def is_rate_limited(
        self,
        key: str,
        max_requests: int,
        window_seconds: int = 60,
    ) -> Tuple[bool, int]:
        if not settings.RATE_LIMIT_ENABLED or max_requests <= 0:
            return False, 0
        rkey = f"rl:{key}"
        try:
            count = self._r.incr(rkey)
            if count == 1:
                self._r.expire(rkey, window_seconds)
            if count > max_requests:
                ttl = self._r.ttl(rkey)
                return True, max(1, ttl if ttl and ttl > 0 else window_seconds)
            return False, 0
        except Exception as exc:  # noqa: BLE001 - never block traffic on limiter outage
            logger.warning("Redis rate limiter error (failing open): %s", exc)
            return False, 0

    def increment_counter(self, key: str, window_seconds: int) -> int:
        ckey = f"ct:{key}"
        try:
            count = self._r.incr(ckey)
            if count == 1:
                self._r.expire(ckey, window_seconds)
            return int(count)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis counter error: %s", exc)
            return 0

    def get_counter(self, key: str) -> int:
        try:
            v = self._r.get(f"ct:{key}")
            return int(v) if v else 0
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis counter read error: %s", exc)
            return 0

    def clear_counter(self, key: str) -> None:
        try:
            self._r.delete(f"ct:{key}")
        except Exception as exc:  # noqa: BLE001
            logger.warning("Redis counter clear error: %s", exc)

    def reset(self):
        """No-op: never flush a shared Redis from app code."""
        return None


def _build_limiter():
    if settings.REDIS_URL:
        try:
            lim = RedisRateLimiter(settings.REDIS_URL)
            logger.info("Rate limiter using Redis backend.")
            return lim
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to init Redis limiter (%s); using in-memory fallback.", exc)
    return InMemoryRateLimiter()


# Global limiter instance
limiter = _build_limiter()


def get_client_ip(request: Request) -> str:
    """Extract the client IP, honoring X-Forwarded-For ONLY behind trusted proxies.

    With TRUSTED_PROXY_HOPS = N (> 0), the client IP is the Nth entry from the right
    of X-Forwarded-For (the hop your own proxy appended). With 0, the header is
    ignored entirely so it cannot be spoofed (finding H-03).
    """
    hops = settings.TRUSTED_PROXY_HOPS
    if hops > 0:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            parts = [p.strip() for p in forwarded.split(",") if p.strip()]
            if parts:
                idx = min(hops, len(parts))
                return parts[-idx]
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _enforce(key: str, max_requests: int, message: str, window_seconds: int = 60):
    is_limited, retry_after = limiter.is_rate_limited(key, max_requests, window_seconds)
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=message,
            headers={"Retry-After": str(retry_after)},
        )


def rate_limit_auth(request: Request):
    """Rate limit authentication attempts by client IP."""
    ip = get_client_ip(request)
    _enforce(
        f"auth:ip:{ip}",
        settings.RATE_LIMIT_AUTH_PER_MINUTE,
        "Too many authentication requests. Please try again later.",
    )


def rate_limit_chat(request: Request):
    """Rate limit dashboard chat requests by client IP."""
    ip = get_client_ip(request)
    _enforce(
        f"chat:ip:{ip}",
        settings.RATE_LIMIT_CHAT_PER_MINUTE,
        "Too many chat requests. Please slow down.",
    )


def rate_limit_widget_config(request: Request):
    """Rate limit public widget config fetches by client IP."""
    ip = get_client_ip(request)
    _enforce(
        f"widgetcfg:ip:{ip}",
        settings.RATE_LIMIT_WIDGET_IP_PER_MINUTE,
        "Too many requests. Please wait a moment.",
    )


def rate_limit_widget(request: Request):
    """Rate limit widget chat requests by IP and public API key."""
    ip = get_client_ip(request)
    _enforce(
        f"widget:ip:{ip}",
        settings.RATE_LIMIT_WIDGET_IP_PER_MINUTE,
        "Too many chat requests from your device. Please wait a moment before sending another message.",
    )

    public_key = request.headers.get("x-public-key")
    if not public_key:
        auth_header = request.headers.get("authorization", "")
        if auth_header.lower().startswith("bearer "):
            public_key = auth_header.split(" ", 1)[1].strip()

    if public_key:
        _enforce(
            f"widget:key:{public_key}",
            settings.RATE_LIMIT_WIDGET_PER_MINUTE,
            "Organization chat volume limit reached. Please try again shortly.",
        )


# ----------------------- Login brute-force lockout (H-05) -----------------------

def _lock_key(email: str) -> str:
    return f"loginfail:{email.lower().strip()}"


def is_login_locked(email: str) -> bool:
    """True if this email has too many recent failed logins."""
    if settings.LOGIN_MAX_FAILURES <= 0:
        return False
    return limiter.get_counter(_lock_key(email)) >= settings.LOGIN_MAX_FAILURES


def record_login_failure(email: str) -> None:
    limiter.increment_counter(_lock_key(email), settings.LOGIN_LOCKOUT_MINUTES * 60)


def clear_login_failures(email: str) -> None:
    limiter.clear_counter(_lock_key(email))
