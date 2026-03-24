# CLAUDE.md — DevSync Configuration

## Project Overview

**DevSync**: AI tool that parses developer updates (calls/chats/notes) and generates structured reports
(done/blockers/assignments/deadlines) + business-friendly translations of technical updates.

**Problem**: Non-technical managers spend 2–3 hours/week manually parsing dev updates.
**Solution**: Paste text → AI extracts structure → generates reports (weekly/monthly/KPI) in minutes.

**Target**: Indie managers, tech leads, consultants. Freemium SaaS model.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL) + Vercel Edge Functions
- **Auth**: Clerk
- **Deploy**: Vercel (preview deployments per commit)
- **AI**: Claude API (sonnet-3-5 for extraction/translation, opus-4-6 for reports)
- **Payments**: CloudPayments (Russia) / Stripe (global)
- **Observability**: PostHog + Sentry + Clarity (v1.1+)
- **MCP Required**: Context7, Supabase, GitHub

---

## Architecture

**5 Modules**:
1. **Auth** (Clerk): User signup/login, plan management
2. **Input** (Frontend): Paste text, validation, preprocessing
3. **Extraction** (Claude Sonnet): Parse text → JSON (done/blockers/deadlines/assignments)
4. **Reports** (Claude Opus): Weekly/monthly/KPI/follow-up reports from extracted data
5. **Translation** (Claude Sonnet): Technical → plain business English

**Data flow**: User text → Claude API → Supabase → Reports → Export

---

## Team & Agents

**6 Specialized AI Agents** (all read Context7 + Supabase docs):

| Agent | Model | Focus |
|-------|-------|-------|
| `planner` | sonnet | Task decomposition, vertical slices, change proposals |
| `database-architect` | opus | Schema design, migrations, RLS, indexes |
| `backend-engineer` | opus | API routes, Server Actions, Claude integration |
| `frontend-developer` | sonnet | UI/components, forms, state, accessibility |
| `qa-reviewer` | sonnet | **READ-ONLY**: code review, tests, security (no Write/Edit) |
| `ai-agent-architect` | opus | Prompt engineering, extraction logic, reliability |

---

## Key Rules

**Database** (`supabase/migrations/**`):
- All DB changes through migrations only
- Every migration must include rollback plan
- RLS mandatory on all tables
- Index strategy: id (PK), user_id (FK), created_at (ts)

**API** (`src/app/api/**`):
- TDD on: extraction logic, rate limiting, payment validation
- Error codes: 200, 400 (bad request), 401 (auth), 404, 429 (rate limit), 500
- Input validation: min 10 words, max 100k chars
- Rate limit: 10 analyses/minute per user

**Frontend** (`src/app/**/*.tsx`):
- States: loading/empty/error/success (for each component)
- shadcn/ui for all UI
- Server Components by default, use 'use client' sparingly
- 2-3 hours/week → 15-20 min with tool = measure of success

---

## Coding Principles

**Vertical Slices**: One feature → data + API + UI + analytics + tests (not backend-first, not frontend-first).

**TDD Selective**: Write tests for API, critical business rules, payments, integrations. Not on every UI component.

**Code Review**: After each feature, run:
- **Vertical review**: End-to-end path (user action → DB → response → render)
- **Horizontal review**: Consistency in error handling, logging, validation across similar zones

**Hooks Mandatory**:
- Pre-commit: lint + format (Prettier)
- Pre-push: all tests pass
- Pre-release: env/secrets check (no .env.local in git, verify Supabase keys)

---

## Process: Idea → Shipped

1. **Discovery**: Describe change, capture in PROJECT_IDEA.md or ADR
2. **Spec**: Use SPEC_TEMPLATE.md, fill all 8 sections, no TODOs
3. **OpenSpec**: Propose → Apply → Verify → Archive (change management)
4. **GSD**: GSD tool owns artifacts (source of truth)
5. **Config**: MCP + platform ready (Supabase/Vercel/Clerk/payments)
6. **Build**: Vertical slices + vertical+horizontal reviews + TDD where needed
7. **Observability**: PostHog events, Sentry errors, preview deploy checks
8. **Release**: Merge main + production deploy
9. **Iterate**: Real data → new changes

---

## Definition of Done

Feature is "done" ONLY if all 8 are true:
- [ ] Spec filled (SPEC_TEMPLATE.md)
- [ ] Code written & tested (vertical slice: data+API+UI+tests)
- [ ] Tests pass (API + business logic)
- [ ] PostHog analytics events added
- [ ] Sentry error handling in place
- [ ] Code reviewed by qa-reviewer
- [ ] Preview deploy verified on Vercel
- [ ] `.env.example` updated, secrets policy followed

---

## Commands

```bash
# Dev
npm run dev                  # Next.js dev server

# Database
npx supabase db list        # List migrations
npx supabase migrations new # Create migration

# Deploy
git push origin main        # Auto-deploys to Vercel preview
git merge main              # Deploys to production (after review)

# AI Agents
# (Invoked via Claude Code UI, use SPEC_TEMPLATE.md to describe features)
```

---

## Contact & Decisions

**Product Owner**: Pavel (user)
**Architecture Owner**: Database-architect + Backend-engineer agents
**Tech Decisions**: Recorded in ADR/ folder

---

## Metrics (MVP Success Criteria)

- 5+ beta users with >1 analysis each
- Extraction accuracy >80% (user validation)
- Time-to-report <2 min from paste
- NPS >40
- Cost per extraction <$0.10

---

## Next Steps

1. Create .claude/agents/ (6 agent files)
2. Create .claude/rules/ (3 rule files)
3. Create .claude/skills/ (3 skill files)
4. Create SPEC_TEMPLATE.md, DEFINITION_OF_DONE.md, CODING_PROCESS.md
5. Create ADR/ with first 3 architecture decisions
6. Initialize Supabase project + GitHub repo
7. Connect GSD as source of truth
8. Begin build loop (features as vertical slices)
