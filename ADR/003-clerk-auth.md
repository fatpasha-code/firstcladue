# ADR-003: Clerk for Authentication

## Decision

Use **Clerk** as the authentication layer (not Auth0, not NextAuth, not Stack Auth for MVP).

## Context

Need to pick auth provider. Candidates for MVP:
- Clerk (managed, fast setup)
- Auth0 (enterprise, complex)
- NextAuth.js (self-hosted, more work)
- Stack Auth (open-source, newer)

Note: For MVP, speed > flexibility. After v1.0, can reconsider Stack Auth for self-hosting.

## Rationale

**Clerk wins for MVP because**:
1. **Speed** → signup/login UI in <5 minutes, out-of-box
2. **Next.js integration** → Clerk middleware works natively with App Router
3. **OAuth built-in** → Google, GitHub sign-in without extra config
4. **Developer experience** → dashboard UI, Webhook management, user management
5. **Affordable** → free up to 10,000 users, $29/month after (vs Auth0 $1000+)
6. **Webhook sync** → easy to sync user data to Supabase on signup/update
7. **Sessions** → session management, token refresh, all handled

**Why not Auth0?**:
- Overkill for MVP
- $1000+/month enterprise pricing
- Slower time-to-value

**Why not NextAuth?**:
- More setup work (OAuth provider config, database sessions)
- Fewer built-in UI components
- Requires more security knowledge

**Why not Stack Auth (for MVP)?**:
- Newer, less battle-tested
- Self-hosting adds operational complexity
- Deferring to v1.1 when we have more resources

## Future Migration

**Post-MVP**: If we want full control (self-hosting, open-source), can migrate to Stack Auth
because Supabase webhook architecture stays the same. Clerk → Stack Auth transition is low-risk
because we sync user data to Supabase anyway.

## Consequences

**Positive**:
- Fastest route to production
- Excellent DX with Clerk dashboard
- Free for MVP scale
- Webhook integration is reliable

**Negative**:
- Vendor lock-in to Clerk (but low switching cost due to Supabase sync)
- Less control over auth flow vs self-hosted solution
- Pricing may increase with scale (but cheaper than alternatives until millions of users)

## Status

**ACCEPTED** — Clerk for MVP. Stack Auth reconsidered in v1.1 planning.

---

Date: 2024-03-24
Decided by: Pavel + backend-engineer
