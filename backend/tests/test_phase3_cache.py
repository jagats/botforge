"""Phase 3 semantic-cache unit tests (pure helpers; Redis is a no-op in tests)."""

from app.services import semantic_cache as c


def test_cache_disabled_without_redis():
    # Tests run with no REDIS_URL, so the cache must be a transparent no-op.
    assert c.is_enabled() is False


def test_cosine():
    assert round(c._cosine([1, 0, 0], [1, 0, 0]), 6) == 1.0
    assert round(c._cosine([1, 0, 0], [0, 1, 0]), 6) == 0.0
    assert c._cosine([1, 0], [1, 0, 0]) == -1.0  # length mismatch


def test_vector_roundtrip():
    v = [0.1, -0.25, 0.5, 0.0, 0.9]
    out = c._decode_vec(c._encode_vec(v))
    assert [round(x, 4) for x in out] == [round(x, 4) for x in v]


def test_normalize():
    assert c._norm("  How   MUCH is Coorg? ") == "how much is coorg?"


def test_is_cacheable_rules():
    fb = ["Sorry, I don't know."]
    # grounded, safe answer -> cache
    assert c.is_cacheable("how much is coorg", "It's 475 for a 250 g bag.", fb) is True
    # fallback/refusal -> never cache
    assert c.is_cacheable("random", "Sorry, I don't know.", fb) is False
    # PII in question or answer -> never cache
    assert c.is_cacheable("mail me at a@b.com", "ok", fb) is False
    assert c.is_cacheable("hi", "call 98765 43210 now", fb) is False
    # empty answer -> never cache
    assert c.is_cacheable("hi", "", fb) is False
