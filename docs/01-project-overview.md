# 01 — Project Overview

## Company & owner
- Company: **DVIO Digital Pvt. Ltd.** (web agency, builds client websites)
- Owner/developer: Jagat Pal Singh

## The problem
DVIO builds websites. Some clients also want a customer-support chatbot that answers questions from their own knowledge base (FAQs, product info, policies). DVIO does not offer this today, so clients go to another agency. DVIO loses the business and the client relationship gets split across vendors.

## The idea
Build an in-house **AI Bot-as-a-Service** platform:
1. Client signs up and uploads FAQs / PDFs / web page URLs.
2. The platform turns this content into a searchable knowledge base.
3. An AI model answers website visitors' questions using **only** that content.
4. Client pastes one script tag to add the bot to their site.
5. DVIO earns a **recurring subscription** per client.

"As-a-Service" = monthly subscription, not a one-time fee.

## Business value
| Benefit | Why it matters |
|---|---|
| Recurring revenue | Monthly income instead of one-time project fees |
| Client retention | Chatbot work stays in-house |
| Low delivery cost | One platform serves many clients |
| Competitive edge | DVIO becomes an AI-capable agency |
| Upsell | Offer to every existing and new website client |

## Goals (MVP)
- A client can sign up, log in, upload documents, test the bot, and copy an embed script.
- Bot answers grounded in that client's data only.
- Strict data isolation between clients (multi-tenant).
- Whole app runs with `docker compose up`.
- Pilot with 1 real client.

## Non-goals (for the MVP)
- Billing/payments integration (pricing tiers are defined later; no Stripe yet).
- Multiple bots per tenant, custom branding themes, human handoff, live agent chat.
- Multi-language tuning, voice, WhatsApp/Slack channels.
- Per-tenant separate databases or Qdrant collections.

## Proposed next steps from the original proposal (business side)
- Validate with 2–3 existing DVIO clients who asked for a chatbot.
- Pilot with one friendly client.
- Define pricing tiers (e.g., by number of messages or documents).
- Phased rollout across the client base.
