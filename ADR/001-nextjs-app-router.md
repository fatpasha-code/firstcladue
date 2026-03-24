# ADR-001: Next.js 14 with App Router

## Decision

Use **Next.js 14 with App Router** (not Pages Router, not Remix, not SvelteKit).

## Context

Need to pick frontend framework for DevSync. Candidates:
- Next.js 14 (App Router)
- Remix
- SvelteKit
- Astro

## Rationale

**Next.js App Router wins because**:
1. **Server Components by default** → reduces JS bundle, faster rendering
2. **API routes in same repo** → easy to maintain API + frontend together
3. **Vercel integration** → 1-click deploy, preview per commit, Edge Functions
4. **Clerk integration** → out-of-box support for Clerk auth middleware
5. **Large ecosystem** → shadcn/ui, TanStack Router, countless integrations
6. **TypeScript first** → better DX, fewer runtime errors
7. **Least learning curve** for team → many tutorials, StackOverflow answers

**Why not Remix?**: More learning curve, fewer integrations, Vercel integration less seamless.

**Why not SvelteKit?**: Smaller ecosystem, fewer Clerk/Supabase integrations.

**Why not Astro?**: Better for static sites; DevSync needs real-time updates + interactivity.

## Consequences

**Positive**:
- Fast deployment to Vercel
- Server Components reduce client-side complexity
- Easy API route organization
- Strong TypeScript support

**Negative**:
- Vendor lock-in to Vercel (mitigated by exporting to standalone)
- App Router still evolving (may have breaking changes in minor versions)
- Larger initial bundle than Svelte (mitigated by code splitting)

## Status

**ACCEPTED** — Implementation begins with Next.js 14.0+

---

Date: 2024-03-24
Decided by: Pavel (Product Owner) + architecture team
