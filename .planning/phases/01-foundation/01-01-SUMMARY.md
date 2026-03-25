---
phase: "01-foundation"
plan: "01"
subsystem: "foundation"
tags: ["nextjs", "supabase", "auth", "middleware", "scaffold"]
dependency_graph:
  requires: []
  provides:
    - "Next.js App Router project with TypeScript and Tailwind CSS"
    - "Supabase SSR client utilities (server + browser)"
    - "Auth middleware with route protection"
  affects:
    - "All subsequent phases (auth is baseline)"
tech_stack:
  added:
    - "next@16.2.1"
    - "react@19.1.0"
    - "react-dom@19.1.0"
    - "typescript@5.8.2"
    - "tailwindcss@4.0.12"
    - "@supabase/ssr@0.9.0"
    - "@supabase/supabase-js@2.100.0"
    - "shadcn@4.1.0"
    - "class-variance-authority@0.7.1"
    - "clsx@2.1.1"
    - "tailwind-merge@3.5.0"
    - "lucide-react@1.6.0"
    - "tw-animate-css@1.4.0"
    - "@base-ui/react@1.3.0"
  patterns:
    - "Server Components by default"
    - "Supabase SSR cookie-based sessions with getAll/setAll"
    - "getUser() (not getSession()) for server auth validation"
    - "Middleware-based route protection: redirect for pages, 401 JSON for /api/*"
key_files:
  created:
    - "package.json"
    - "tsconfig.json"
    - "next.config.ts"
    - "postcss.config.mjs"
    - "eslint.config.mjs"
    - "components.json"
    - ".gitignore"
    - ".env.example"
    - ".env.local"
    - "src/app/layout.tsx"
    - "src/app/page.tsx"
    - "src/app/globals.css"
    - "src/lib/utils.ts"
    - "src/lib/supabase/server.ts"
    - "src/lib/supabase/client.ts"
    - "src/lib/supabase/middleware.ts"
    - "src/middleware.ts"
    - "src/components/ui/button.tsx"
    - "src/components/ui/card.tsx"
    - "src/components/ui/input.tsx"
    - "src/components/ui/label.tsx"
    - "src/components/ui/alert.tsx"
  modified: []
decisions:
  - "Scaffolded manually (create-next-app blocked by existing planning files) — all config files created manually matching create-next-app output"
  - "All dependency versions pinned (no ^ prefix) per CLAUDE.md version pinning rule"
  - "Used next@16.2.1 (latest stable) as specified in RESEARCH.md"
  - "shadcn/ui initialized with New York style defaults; Tailwind v4 integration via @tailwindcss/postcss"
metrics:
  duration_minutes: 6
  completed_date: "2026-03-25"
  tasks_completed: 2
  tasks_total: 2
  files_created: 22
  files_modified: 0
---

# Phase 01 Plan 01: Next.js Scaffold + Supabase SSR Foundation Summary

**One-liner:** Next.js 16.2.1 project scaffolded with pinned dependencies, shadcn/ui components, and Supabase SSR cookie-based auth middleware using getUser() for route protection.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Scaffold Next.js project with dependencies | 3eac20b | package.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs, components.json, .gitignore, .env.example, src/app/*, src/components/ui/*, src/lib/utils.ts |
| 2 | Create Supabase client utilities and auth middleware | d107af8 | src/lib/supabase/server.ts, src/lib/supabase/client.ts, src/lib/supabase/middleware.ts, src/middleware.ts |

## Verification Results

- `npm run build`: PASSED — Next.js 16.2.1 build with Middleware proxy
- `npx tsc --noEmit`: PASSED — no TypeScript errors
- All four Supabase utility files exist with correct exports
- Middleware returns 401 JSON for /api/* routes and redirects pages to /login
- .env.example contains all three required environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SITE_URL)
- No `^` prefix on next/react/react-dom versions in package.json

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Scaffolded manually instead of create-next-app**
- **Found during:** Task 1
- **Issue:** `npx create-next-app` refused to run in a directory with existing files (planning docs, ADRs, CLAUDE.md) — no `--force` flag available
- **Fix:** Created all configuration files manually (package.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs, .gitignore) matching standard create-next-app output. Then ran `npx shadcn@latest init` and `npx shadcn@latest add` normally, which worked fine on the pre-populated directory.
- **Files modified:** package.json, tsconfig.json, next.config.ts, postcss.config.mjs, eslint.config.mjs
- **Commit:** 3eac20b

## Known Stubs

None — this plan establishes infrastructure only (no data rendering, no UI stubs).

## User Setup Required

Before auth can function, the user must complete Supabase Dashboard configuration:

1. Create a Supabase project at supabase.com if not already done
2. Copy Project URL and anon key from Dashboard → Settings → API into `.env.local`
3. Enable Email provider: Dashboard → Authentication → Providers → Email
4. Set Site URL to `http://localhost:3000`: Dashboard → Authentication → URL Configuration
5. Add `http://localhost:3000/auth/confirm` to Redirect URLs
6. Create Pavel's user account: Dashboard → Authentication → Users → Add User

## Self-Check: PASSED

Files verified:
- FOUND: src/lib/supabase/server.ts
- FOUND: src/lib/supabase/client.ts
- FOUND: src/lib/supabase/middleware.ts
- FOUND: src/middleware.ts
- FOUND: src/components/ui/button.tsx
- FOUND: src/components/ui/card.tsx
- FOUND: src/components/ui/input.tsx
- FOUND: src/components/ui/label.tsx
- FOUND: src/components/ui/alert.tsx
- FOUND: .env.example

Commits verified:
- FOUND: 3eac20b (feat: scaffold Next.js project)
- FOUND: d107af8 (feat: create Supabase utilities and middleware)
