# Update Tracker

## What This Is

Internal tool for Pavel: accepts text from calls, chats, and notes — and turns them into management artifacts. Extracts what's done, in progress, blocked, who owns what, and deadlines. Generates weekly/monthly digests and follow-up lists. Translates technical updates into management language: what's actually happening, hidden blockers, what to clarify.

Single user. Not a SaaS product.

## Core Value

Given a raw text from a call or chat, produce a structured management picture in under 2 minutes — reducing the need to re-read the original.

## Requirements

### Validated

- [x] All pages protected by auth (Supabase Auth, email/password) — *Validated in Phase 01: Foundation*
- [x] AUTH-01, AUTH-02, AUTH-03 — login, password reset, route protection — *Validated in Phase 01: Foundation*

### Active

**Core pipeline**
- [ ] User can paste text (call transcript / chat / notes) and trigger analysis
- [ ] Claude extracts: done, in_progress, blockers, assignments, deadlines (explicit vs inferred)
- [ ] Claude generates management interpretation: summary, real_status, hidden_blockers, clarification_questions
- [ ] User can view and edit extracted data

**Review / History**
- [ ] User can see history of all past records
- [ ] User can mark records as reviewed

**Reports**
- [ ] User can generate weekly / monthly / follow-up report from selected records
- [ ] User can copy generated report

### Out of Scope

- Audio/video ingestion — next phase; text-only for v1 (schema ready via `source_type`)
- KPI Drafts / Employee KPI Builder — future feature after core pipeline works
- Multi-user / team access — single user MVP only
- Payments, rate limiting — not a commercial product in v1
- PostHog, Sentry, observability — production level, not MVP requirement
- Export to PDF / Notion / Slack — v1 is copy-paste

## Context

- **Stack**: Next.js (App Router) + Tailwind + shadcn/ui, Supabase (Postgres + Auth), Vercel deploy, Anthropic SDK
- **Auth**: Supabase Auth native — no external auth provider needed for single user
- **AI**: `@anthropic-ai/sdk`, models via env vars (`CLAUDE_EXTRACTION_MODEL`, `CLAUDE_REPORT_MODEL`)
- **Async caveat**: `void runFn()` unreliable in Vercel serverless. For MVP: synchronous Server Action (5–15s acceptable for single user). True async = Supabase Edge Functions or Vercel Background Functions — decide explicitly if needed
- **Spec documents**: `PROJECT_IDEA.md`, `TECH_SPEC.md`, `SPEC_TEMPLATE.md`, `CLAUDE.md`, `CHANGES/v1-scope-proposal.md` (applied 2026-03-25)
- **UI references**: shadcn/ui (base library), 21st.dev + uibits.co (design inspiration)
- **Process**: Spec-First — read spec before coding; divergence requires explicit user confirmation before spec update; git checkpoint required before updating spec

## Constraints

- **Stack**: Next.js + Supabase + Vercel — chosen, not up for debate in v1
- **Single user**: No multi-tenancy, no team features, no public access in v1
- **AI models**: Never hardcoded — always from env vars. Fail explicitly if env not set
- **Migrations**: All schema changes via migration files with rollback plan. No manual SQL on prod
- **Spec**: Don't code without spec. Don't auto-update spec under unverified code

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase Auth over Clerk | Single user, native RLS integration, no external service needed | Chosen |
| Next.js App Router + Server Actions | Server Components default, forms via Server Actions, no client-side fetch boilerplate | Chosen |
| Synchronous extraction for MVP | `void runFn()` unreliable in Vercel serverless; 5-15s acceptable for single user | Temporary for v1 |
| `records` table (not `analyses`) | Neutral naming supports future `source_type` expansion (audio/video) without schema change | Chosen |
| Single `records` table for ingestion + analysis | MVP simplicity; no premature normalization | Future reconsideration |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after initialization*
