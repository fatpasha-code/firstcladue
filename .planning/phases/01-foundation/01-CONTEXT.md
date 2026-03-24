# Phase 1: Foundation - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold the project, configure Supabase Auth, and protect all routes. Nothing else can be built until auth is working end-to-end: user enters credentials → session established → protected routes accessible → sign out works.

</domain>

<decisions>
## Implementation Decisions

### Auth Method
- **D-01:** Email + password only (no magic link). This is the primary daily login method.
- **D-02:** Password reset via email link is required. User should be able to recover access without manual Supabase Dashboard intervention.

### Login Page
- **D-03:** Minimal design — centered card on neutral background. Email field + password field + submit button. No logo, no branding, no extra copy.
- **D-04:** Error handling — inline error message displayed below the form on failed login (e.g. "Invalid email or password"). Not a toast, not a modal — inline.
- **D-05:** Password reset — "Forgot password?" link on the login page triggers email reset flow.

### Middleware & Route Protection
- **D-06:** ALL routes are protected: both pages (`/`, `/history`, etc.) and `/api/*` routes. API routes return 401 JSON when unauthenticated (not redirect).
- **D-07:** Only `/login` and the password reset flow pages are public. No other public routes.

### Claude's Discretion
- Exact middleware implementation pattern (Supabase SSR `createServerClient`, `updateSession`, Next.js matcher config) — standard Supabase SSR approach
- Folder structure: `src/` directory, `@/` path alias, App Router conventions
- TypeScript config: strict mode on
- shadcn/ui components to use for login form (likely `Card`, `Input`, `Button`, `Label`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Spec
- `TECH_SPEC.md` §Module 1: Auth & Session — Supabase Auth setup, middleware pattern, client setup
- `CLAUDE.md` — Stack decisions, process rules, agent responsibilities
- `ADR/003-clerk-auth.md` — Why Supabase Auth over Clerk (single user, native RLS)

### Requirements
- `REQUIREMENTS.md` — AUTH-01, AUTH-02, AUTH-03

### Roadmap
- `.planning/ROADMAP.md` §Phase 1 — Plans breakdown and done criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project. No existing components or utilities.

### Established Patterns
- None yet — Phase 1 establishes the baseline patterns for all subsequent phases.

### Integration Points
- Supabase client will be set up here and reused in every subsequent phase
- Middleware auth check established here applies to all future routes automatically

</code_context>

<specifics>
## Specific Ideas

- No specific design references — minimal and functional is the brief
- Password reset is standard Supabase email reset flow (no custom UI needed beyond the trigger link)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-25*
