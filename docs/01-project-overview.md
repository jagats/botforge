# 01 — Project Overview

## Company & owner
- Company: **DVIO Digital Pvt. Ltd.** (web agency, builds client websites)
- Owner/developer: Jagat Pal Singh

## The problem
DVIO builds websites. Some clients also want a customer-support chatbot that answers questions from their own knowledge base (FAQs, product info, policies). DVIO does not offer this today, so clients go to another agency. DVIO loses the business and the client relationship gets split across vendors.

## The idea
Build an in-house **AI Bot-as-a-Service** platform for DVIO Digital and its client brands:
1. **Product Admin (DVIO)** onboards a client brand (member) into BotForge with dedicated login credentials.
2. **Client Brand** logs in via `/login` to their brand workspace and uploads FAQs / PDFs / web page URLs.
3. The platform turns this content into a searchable, tenant-isolated knowledge base in Qdrant.
4. An AI model answers website visitors' questions using **only** that brand's content.
5. Client pastes one script tag to add the bot to their site.
6. DVIO manages client subscriptions with one-click active/inactive controls.

"As-a-Service" = monthly retainer/subscription, controlled directly by DVIO.

## Business value
| Benefit | Why it matters |
|---|---|
| Recurring revenue | Monthly income instead of one-time project fees |
| Client retention | Chatbot work stays in-house with agency relationship intact |
| Controlled onboarding | No spam or open signups; only contracted brands are onboarded |
| Low delivery cost | One shared multi-tenant platform serves all agency clients |
| Competitive edge | DVIO becomes a full-stack AI-capable agency |
| Upsell | Offer to every existing and new website client |

## Goals (MVP)
- Product Admin can onboard client brands, view all members, and toggle their active/inactive status.
- Single unified `/login` page with role-based routing (no open public registration).
- Client Brand logs in, uploads documents, tests the bot, and copies their embed script.
- Bot answers grounded strictly in that brand's data.
- Strict data isolation between client brands (multi-tenant).
- Whole app runs with `docker compose up`.
- Pilot with 1 real client brand.

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
