"""Phase 1 production-hardening tests: price/currency guard + brand-neutral prompt."""

from app.services.llm import (
    NO_CONTEXT_FALLBACK,
    SYSTEM_PROMPT,
    contains_ungrounded_amount,
)


def test_currency_guard_allows_grounded_amounts():
    ctx = ["Coorg Highlands is ₹475 for a 250 g bag.", "Shipping is a flat ₹60."]
    assert contains_ungrounded_amount("It costs ₹475.", ctx) is False
    assert contains_ungrounded_amount("Shipping is ₹60; delivery 3-5 days.", ctx) is False
    assert contains_ungrounded_amount("It has cocoa and citrus notes.", ctx) is False


def test_currency_guard_flags_invented_amounts():
    ctx = ["Coorg Highlands is ₹475 for a 250 g bag."]
    assert contains_ungrounded_amount("It costs ₹999.", ctx) is True
    assert contains_ungrounded_amount("That is $12 per bag.", ctx) is True
    assert contains_ungrounded_amount("Shipping is 900 rupees.", ctx) is True


def test_fallback_and_prompt_are_brand_neutral():
    # No tenant-specific words baked into shared copy — safe for multi-brand deploys.
    for banned in ("roast", "root", "coffee", "nilgiri", "coorg"):
        assert banned not in NO_CONTEXT_FALLBACK.lower()
        assert banned not in SYSTEM_PROMPT.lower()
    # Key guardrails are present in the prompt.
    p = SYSTEM_PROMPT.lower()
    assert "<context>" in p
    assert "cannot" in p or "can't" in p  # no-action rule
    assert "medical" in p