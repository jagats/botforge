"""Brand-agnostic semantic answer cache (Phase 3).

Two layers, Redis-backed and scoped per tenant:
  1. Exact match on the normalized question (instant, no embedding needed).
  2. Semantic match: compare the question embedding to recently cached questions;
     a cosine >= SEMANTIC_CACHE_THRESHOLD returns the cached answer, skipping
     retrieval and the LLM entirely.

Only safe, grounded answers are cached (never refusals, fallbacks, or PII). The cache
is invalidated by bumping a per-tenant version whenever documents change; a TTL is the
backstop. If REDIS_URL is not configured, every function is a no-op so dev/tests are
unaffected.
"""

import base64
import hashlib
import json
import logging
import math
import re
import uuid
from array import array
from typing import List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis = None
_redis_init = False

# PII we never want to cache (emails, long digit runs like phone/card numbers).
_PII_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+|\b\d[\d \-]{8,}\d\b")


def _client():
    global _redis, _redis_init
    if _redis_init:
        return _redis
    _redis_init = True
    if not (settings.SEMANTIC_CACHE_ENABLED and settings.REDIS_URL):
        _redis = None
        return None
    try:
        import redis
        _redis = redis.Redis.from_url(settings.REDIS_URL, socket_timeout=1.0, decode_responses=True)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Semantic cache disabled (Redis init failed): %s", exc)
        _redis = None
    return _redis


def is_enabled() -> bool:
    return _client() is not None


def _norm(q: str) -> str:
    return re.sub(r"\s+", " ", q.strip().lower())


def _encode_vec(vec: List[float]) -> str:
    return base64.b64encode(array("f", vec).tobytes()).decode("ascii")


def _decode_vec(s: str) -> List[float]:
    a = array("f")
    a.frombytes(base64.b64decode(s))
    return list(a)


def _cosine(a: List[float], b: List[float]) -> float:
    if len(a) != len(b):
        return -1.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return -1.0
    return dot / (na * nb)


def is_cacheable(message: str, answer: str, fallback_texts: List[str]) -> bool:
    """Only cache safe, grounded answers — never refusals/fallbacks or PII."""
    if not answer:
        return False
    if answer in fallback_texts:
        return False
    if _PII_RE.search(message) or _PII_RE.search(answer):
        return False
    return True


def _version(r, tenant_id: uuid.UUID) -> str:
    v = r.get(f"sc:ver:{tenant_id}")
    return v if v else "1"


def bump_version(tenant_id: uuid.UUID) -> None:
    """Invalidate a tenant's cache (call when its documents change)."""
    r = _client()
    if not r:
        return
    try:
        r.incr(f"sc:ver:{tenant_id}")
    except Exception as exc:  # noqa: BLE001
        logger.warning("Cache version bump failed for tenant=%s: %s", tenant_id, exc)


def get_exact(tenant_id: uuid.UUID, message: str) -> Optional[dict]:
    r = _client()
    if not r:
        return None
    try:
        key = f"sc:ex:{tenant_id}:{_version(r, tenant_id)}:{hashlib.md5(_norm(message).encode()).hexdigest()}"
        raw = r.get(key)
        return json.loads(raw) if raw else None
    except Exception as exc:  # noqa: BLE001
        logger.warning("Cache get_exact failed: %s", exc)
        return None


def get_semantic(tenant_id: uuid.UUID, query_vector: List[float]) -> Optional[dict]:
    r = _client()
    if not r or not query_vector:
        return None
    try:
        key = f"sc:sem:{tenant_id}:{_version(r, tenant_id)}"
        entries = r.lrange(key, 0, -1)
        best, best_payload = settings.SEMANTIC_CACHE_THRESHOLD, None
        for raw in entries:
            e = json.loads(raw)
            score = _cosine(query_vector, _decode_vec(e["v"]))
            if score >= best:
                best, best_payload = score, e["p"]
        return best_payload
    except Exception as exc:  # noqa: BLE001
        logger.warning("Cache get_semantic failed: %s", exc)
        return None


def store(
    tenant_id: uuid.UUID,
    message: str,
    query_vector: Optional[List[float]],
    payload: dict,
) -> None:
    """Cache a safe answer under both the exact and semantic layers."""
    r = _client()
    if not r:
        return
    try:
        ver = _version(r, tenant_id)
        ttl = settings.SEMANTIC_CACHE_TTL_SECONDS
        ex_key = f"sc:ex:{tenant_id}:{ver}:{hashlib.md5(_norm(message).encode()).hexdigest()}"
        r.set(ex_key, json.dumps(payload), ex=ttl)
        if query_vector:
            sem_key = f"sc:sem:{tenant_id}:{ver}"
            r.rpush(sem_key, json.dumps({"v": _encode_vec(query_vector), "p": payload}))
            r.ltrim(sem_key, -settings.SEMANTIC_CACHE_MAX_ENTRIES, -1)
            r.expire(sem_key, ttl)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Cache store failed for tenant=%s: %s", tenant_id, exc)
