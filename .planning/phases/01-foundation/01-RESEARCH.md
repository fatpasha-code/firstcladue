# Phase 1: Foundation - Research

**Researched:** 2026-03-25
**Domain:** Next.js scaffolding + Supabase Auth SSR + route protection
**Confidence:** HIGH

## Summary

Phase 1 is a greenfield scaffold: create a Next.js App Router project with TypeScript, Tailwind CSS, and shadcn/ui, then wire up Supabase Auth with email+password login, password reset, and middleware-based route protection. The project currently has zero application code -- only specs, ADRs, and planning docs.

The standard approach uses `@supabase/ssr` (not the deprecated `@supabase/auth-helpers-nextjs`) with cookie-based session management. Two Supabase client utilities are created (server and browser), and a Next.js middleware refreshes the auth token on every request. Route protection combines middleware redirects (for pages) with server-side `getUser()` checks (for API routes returning 401 JSON).

**Primary recommendation:** Use the official Supabase SSR pattern with `createServerClient`/`createBrowserClient`, cookie-based sessions via `getAll`/`setAll`, and `supabase.auth.getUser()` in middleware. Never trust `getSession()` server-side.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Email + password only (no magic link). This is the primary daily login method.
- **D-02:** Password reset via email link is required. User should be able to recover access without manual Supabase Dashboard intervention.
- **D-03:** Minimal design -- centered card on neutral background. Email field + password field + submit button. No logo, no branding, no extra copy.
- **D-04:** Error handling -- inline error message displayed below the form on failed login (e.g. "Invalid email or password"). Not a toast, not a modal -- inline.
- **D-05:** Password reset -- "Forgot password?" link on the login page triggers email reset flow.
- **D-06:** ALL routes are protected: both pages (`/`, `/history`, etc.) and `/api/*` routes. API routes return 401 JSON when unauthenticated (not redirect).
- **D-07:** Only `/login` and the password reset flow pages are public. No other public routes.

### Claude's Discretion
- Exact middleware implementation pattern (Supabase SSR `createServerClient`, `updateSession`, Next.js matcher config) -- standard Supabase SSR approach
- Folder structure: `src/` directory, `@/` path alias, App Router conventions
- TypeScript config: strict mode on
- shadcn/ui components to use for login form (likely `Card`, `Input`, `Button`, `Label`)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign in with email and password or magic link | Supabase `signInWithPassword()` via Server Action. CONTEXT.md narrows to email+password only (D-01). |
| AUTH-02 | User session persists across browser refresh | `@supabase/ssr` cookie-based sessions + middleware `updateSession` handles token refresh automatically. |
| AUTH-03 | All pages redirect to /login when unauthenticated | Middleware checks `getUser()`, redirects to `/login`. API routes return 401 JSON per D-06. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Stack locked:** Next.js (App Router) + Tailwind CSS + shadcn/ui + Supabase + Vercel
- **UI design references:** 21st.dev (modern UI patterns, layout, interactions), uibits.co (visual inspiration) — shadcn/ui for components, these for design direction
- **Server Components by default.** `use client` only for interactivity (login form needs it).
- **4-state pattern** for async components (loading/empty/error/success) -- applies to login form states.
- **Server Actions for form submit** -- login action must be a Server Action, not a fetch to `/api/`.
- **All DB changes via migrations** with rollback plan. Phase 1 has no custom tables (auth.users is built-in).
- **Input validation first** in all API endpoints and Server Actions.
- **No hardcoded API keys** -- env vars only.
- **.env.example must be updated** with all required vars.
- **Don't code without spec** -- TECH_SPEC.md Module 1 covers auth.
- **Spec divergence requires explicit decision** -- if implementation differs from spec, document and get approval.
- **AI model IDs from env vars, never hardcoded** -- not relevant to Phase 1 but noted.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.1 | App framework (App Router) | Project spec requirement |
| react / react-dom | 19.x | UI library | Bundled with Next.js 16 |
| typescript | 5.x | Type safety | Project spec: strict mode |
| tailwindcss | 4.x | Utility-first CSS | Project spec requirement |
| @supabase/supabase-js | 2.100.0 | Supabase client SDK | Project spec: Supabase backend |
| @supabase/ssr | 0.9.0 | SSR cookie-based auth | Official Supabase SSR package, replaces deprecated auth-helpers |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui (CLI) | 4.1.0 | Component library (copied, not installed) | Login form components: Card, Input, Button, Label, Alert |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @supabase/ssr | @supabase/auth-helpers-nextjs | auth-helpers is DEPRECATED. Do not use. |
| Server Actions for login | API route POST /api/auth/login | CLAUDE.md mandates Server Actions for form submit |
| shadcn/ui | Custom components | shadcn/ui is project standard per CLAUDE.md |

**Installation:**
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
npx shadcn@latest init
npx shadcn@latest add card input button label alert
npm install @supabase/supabase-js @supabase/ssr
```

**Version verification:** Versions checked against npm registry on 2026-03-25.

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    (auth)/
      login/
        page.tsx           # Login page (Server Component wrapper)
        login-form.tsx     # Client Component with form logic
        actions.ts         # Server Actions: login, resetPassword
      reset-password/
        page.tsx           # Password reset form (enter new password)
        actions.ts         # Server Action: updatePassword
    auth/
      confirm/
        route.ts           # GET handler for email confirmation/reset links
    layout.tsx             # Root layout
    page.tsx               # Home page (protected)
    globals.css            # Tailwind imports
  components/
    ui/                    # shadcn/ui components (auto-generated)
  lib/
    supabase/
      server.ts            # createClient() for Server Components, Actions, Route Handlers
      client.ts            # createClient() for Client Components
      middleware.ts         # updateSession() helper
  middleware.ts            # Root middleware (imports from lib/supabase/middleware)
```

### Pattern 1: Supabase Server Client (Server Components, Server Actions, Route Handlers)
**What:** Async factory function that creates a Supabase client with cookie access for server-side contexts.
**When to use:** Every server-side Supabase call.
**Example:**
```typescript
// src/lib/supabase/server.ts
// Source: Official Supabase SSR docs + Vercel template pattern
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component -- ignore, middleware will persist
          }
        },
      },
    }
  )
}
```

### Pattern 2: Supabase Browser Client (Client Components)
**What:** Singleton browser client for client-side Supabase calls.
**When to use:** Any `use client` component needing Supabase (e.g., listening to auth state changes).
**Example:**
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Pattern 3: Middleware Session Refresh
**What:** Middleware that refreshes the auth token on every request and handles route protection.
**When to use:** Runs on every matched request.
**Example:**
```typescript
// src/lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(({ name, value }) => ({ name, value }))
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Route protection logic
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/reset-password') ||
    request.nextUrl.pathname.startsWith('/auth/confirm')

  if (!user && !isAuthRoute) {
    // API routes: handled separately (see Pattern 5)
    // Page routes: redirect to login
    if (!request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // API routes return 401 JSON
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  // Redirect authenticated users away from login
  if (user && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}
```

```typescript
// src/middleware.ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Pattern 4: Login Server Action
**What:** Server Action for email+password sign-in (per CLAUDE.md: Server Actions for form submit).
**When to use:** Login form submission.
**Example:**
```typescript
// src/app/(auth)/login/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  // Input validation first (per CLAUDE.md API rules)
  if (!email) {
    return { error: 'Email is required' }
  }
  if (!password) {
    return { error: 'Password is required' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Invalid email or password' }  // Don't expose internal error details
  }

  redirect('/')
}

export async function resetPassword(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()

  if (!email) {
    return { error: 'Email is required' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/reset-password`,
  })

  if (error) {
    // Don't reveal whether email exists
    console.error('[resetPassword] error:', error)
  }

  // Always show success message (security: don't reveal if email exists)
  return { success: true }
}
```

### Pattern 5: Password Reset Update Flow
**What:** After user clicks email link, they land on a page to enter a new password.
**When to use:** Password reset completion.
**Example:**
```typescript
// src/app/(auth)/reset-password/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'Failed to update password. Please try again.' }
  }

  redirect('/')
}
```

### Pattern 6: Email Confirmation / Reset Link Handler
**What:** Route handler that processes email confirmation and password reset tokens from Supabase email links.
**When to use:** Handles GET requests from Supabase email links.
**Example:**
```typescript
// src/app/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      redirect(next)
    }
  }

  redirect('/login?error=invalid-link')
}
```

### Anti-Patterns to Avoid
- **Using `getSession()` on the server:** Never trust `getSession()` server-side -- it reads from cookies which can be spoofed. Always use `getUser()` which validates the token with Supabase Auth server.
- **Using deprecated `@supabase/auth-helpers-nextjs`:** Replaced by `@supabase/ssr`. The old package will not receive updates.
- **Using individual cookie methods (`get`/`set`/`remove`):** The SSR package requires `getAll`/`setAll` only. Individual methods are deprecated.
- **Storing sessions in localStorage:** The SSR package uses httpOnly cookies. Do not override this.
- **Fetching `/api/auth/login` from the client:** Use Server Actions per CLAUDE.md convention. No custom API routes for auth.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom JWT + cookie logic | `@supabase/ssr` cookie handling | Token refresh, PKCE, security headers handled automatically |
| Form components | Custom inputs from scratch | shadcn/ui Card + Input + Button + Label | Accessible, styled, consistent with project standard |
| Password hashing | bcrypt in app code | Supabase Auth handles it | Server-side, audited, salted |
| Email sending for reset | Custom SMTP integration | Supabase built-in email (or custom SMTP in Supabase settings) | Already configured, templates editable in Supabase Dashboard |
| CSRF protection | Custom tokens | Next.js Server Actions have built-in CSRF protection | Automatic with Server Actions |

**Key insight:** Supabase Auth handles the entire auth lifecycle (signup, login, session, token refresh, password reset, email verification). The application code only needs to call the SDK methods and handle UI state.

## Common Pitfalls

### Pitfall 1: Using getSession() Instead of getUser() on Server
**What goes wrong:** Session data can be spoofed from cookies. An attacker could modify cookie values to impersonate another user.
**Why it happens:** `getSession()` is faster (no network call) so developers prefer it.
**How to avoid:** Always use `supabase.auth.getUser()` in server contexts. It makes a request to Supabase Auth server to validate the token.
**Warning signs:** Any server-side code calling `getSession()` for authorization decisions.

### Pitfall 2: Middleware Not Refreshing Tokens
**What goes wrong:** Auth tokens expire (default 1 hour). Without middleware refresh, users get logged out unexpectedly.
**Why it happens:** Forgetting to call `supabase.auth.getUser()` in middleware, or middleware matcher excluding important routes.
**How to avoid:** The `updateSession` function in middleware must call `getUser()` on every matched request. The matcher must cover all application routes.
**Warning signs:** Users reporting random logouts after ~1 hour.

### Pitfall 3: Cookie setAll Errors in Server Components
**What goes wrong:** `cookieStore.set()` throws when called from a Server Component (they're read-only).
**Why it happens:** The Supabase client calls `setAll` to update cookies after token refresh, but Server Components can't write cookies.
**How to avoid:** Wrap `setAll` in try/catch in the server client utility. The middleware will persist the refreshed token anyway.
**Warning signs:** Unhandled runtime errors in Server Components that use Supabase.

### Pitfall 4: Exposing Auth Error Details to Users
**What goes wrong:** Showing Supabase error messages directly (e.g., "Email not confirmed", "Invalid login credentials") reveals whether an email exists in the system.
**Why it happens:** Developers pass `error.message` directly to the UI.
**How to avoid:** Return generic messages like "Invalid email or password" for login failures. For password reset, always show "Check your email" regardless of whether the email exists.
**Warning signs:** Login errors that distinguish between "email not found" and "wrong password".

### Pitfall 5: Missing Route Protection for API Routes
**What goes wrong:** API routes return HTML redirect instead of 401 JSON, breaking client-side fetch calls.
**Why it happens:** Middleware only does `redirect('/login')` without checking if the request is for an API route.
**How to avoid:** In middleware, check `request.nextUrl.pathname.startsWith('/api/')` and return JSON 401 for API routes (per D-06).
**Warning signs:** Frontend fetch calls getting HTML responses instead of JSON errors.

### Pitfall 6: Password Reset redirectTo URL Mismatch
**What goes wrong:** Password reset emails link to wrong URL, or the token verification fails.
**Why it happens:** `redirectTo` in `resetPasswordForEmail()` must match a URL configured in Supabase Dashboard's "Redirect URLs" setting.
**How to avoid:** Add `http://localhost:3000/auth/confirm` (dev) and production URL to Supabase Dashboard > Auth > URL Configuration > Redirect URLs.
**Warning signs:** Clicking password reset link shows error or redirects to wrong page.

### Pitfall 7: Not Pinning Next.js Version in package.json
**What goes wrong:** `npm install` pulls newer version, breaking compatibility.
**Why it happens:** CLAUDE.md explicitly says "pin the version, don't keep it floating".
**How to avoid:** After `create-next-app`, verify `package.json` has exact versions (no `^` prefix on next).
**Warning signs:** `^16.2.1` in package.json instead of `16.2.1`.

## Code Examples

### Login Form Component (Client Component)
```typescript
// src/app/(auth)/login/login-form.tsx
// Follows: 4-state pattern, Server Actions for form submit, inline error display (D-04)
'use client'

import { useState } from 'react'
import { login, resetPassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await login(formData)
    // If login succeeds, redirect happens server-side
    // If it fails, we get an error back
    if (result?.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  async function handleResetPassword(formData: FormData) {
    setError(null)
    const result = await resetPassword(formData)
    if (result?.success) {
      setResetSent(true)
    }
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        {/* Forgot password link (D-05) */}
        {/* Reset sent confirmation */}
      </CardContent>
    </Card>
  )
}
```

### Sign Out Action
```typescript
// src/app/actions.ts (or dedicated file)
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

## Environment Variables

Required `.env.example` entries for Phase 1:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Note:** `NEXT_PUBLIC_` prefix means these are exposed to the browser. The anon key is designed to be public (RLS enforces security). The service role key is NOT needed for auth and should NOT be exposed.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@supabase/auth-helpers-nextjs` | `@supabase/ssr` | 2024 | auth-helpers is deprecated. All new projects must use ssr. |
| Individual cookie methods (get/set/remove) | `getAll`/`setAll` only | 2024 (ssr 0.4+) | Individual methods deprecated in @supabase/ssr |
| `getSession()` for server auth checks | `getUser()` always on server | 2024 | Security: getSession reads unvalidated cookies |
| Pages Router middleware pattern | App Router middleware with `NextResponse.next({ request })` | Next.js 13+ | Different cookie API, different middleware signature |
| shadcn/ui via `npx shadcn-ui@latest` | `npx shadcn@latest` | 2024 | CLI package renamed |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. Do not install.
- `supabase.auth.getSession()` on server: Use `getUser()` instead for security.
- `npx shadcn-ui@latest`: Old CLI name. Use `npx shadcn@latest`.

## Supabase Dashboard Configuration

Before code works, these settings must be configured in Supabase Dashboard:

1. **Auth > Providers > Email:** Enable email+password sign-in (enabled by default).
2. **Auth > URL Configuration > Site URL:** Set to `http://localhost:3000` for dev.
3. **Auth > URL Configuration > Redirect URLs:** Add `http://localhost:3000/auth/confirm` (and production URL later).
4. **Auth > Email Templates:** Default templates work for MVP. Custom templates are optional.
5. **Create initial user:** Since this is single-user MVP, create Pavel's account via Supabase Dashboard or a one-time signup flow.

## Password Reset Flow (Complete)

1. User clicks "Forgot password?" on `/login`
2. Server Action calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
3. Supabase sends email with link containing `token_hash` and `type=recovery`
4. User clicks link, hits `/auth/confirm` route handler
5. Route handler calls `supabase.auth.verifyOtp({ type, token_hash })`
6. On success, redirects to `/reset-password` (user now has authenticated session)
7. User enters new password on `/reset-password` page
8. Server Action calls `supabase.auth.updateUser({ password })`
9. On success, redirects to `/`

## Open Questions

1. **Initial user creation method**
   - What we know: Single-user MVP for Pavel. Supabase Auth needs at least one user.
   - What's unclear: Create via Dashboard manually, or include a one-time signup page/script?
   - Recommendation: Create user manually in Supabase Dashboard. No signup page needed for single-user MVP. Simpler and more secure (no open registration endpoint).

2. **Email delivery in local development**
   - What we know: Supabase local dev (via CLI) has Inbucket for email capture. Cloud Supabase sends real emails.
   - What's unclear: Whether dev/test will use Supabase Cloud or local.
   - Recommendation: Use Supabase Cloud project from the start (simpler for single developer). Password reset emails will just work.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js runtime | Yes | 24.14.0 | -- |
| npm | Package management | Yes | 11.9.0 | -- |
| Supabase Cloud | Auth + DB | External service | -- | Must create project at supabase.com |

**Missing dependencies with no fallback:**
- Supabase Cloud project must be created and configured before auth can work.

**Missing dependencies with fallback:**
- None.

## Sources

### Primary (HIGH confidence)
- [Supabase SSR docs: Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) -- middleware, client setup, route protection
- [Supabase SSR docs: Creating a client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) -- getAll/setAll pattern
- [Supabase Auth: Password-based](https://supabase.com/docs/guides/auth/passwords) -- signInWithPassword, resetPasswordForEmail
- [shadcn/ui installation](https://ui.shadcn.com/docs/installation/next) -- Next.js setup
- npm registry (verified 2026-03-25) -- package versions
- Ryan Katayi blog verified against official patterns -- complete code examples

### Secondary (MEDIUM confidence)
- [Supabase resetPasswordForEmail reference](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) -- API details
- [Supabase auth.updateUser reference](https://supabase.com/docs/reference/javascript/auth-updateuser) -- password update API

### Tertiary (LOW confidence)
- None -- all findings verified against official sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all packages verified on npm, official Supabase SSR pattern well-documented
- Architecture: HIGH -- patterns from official Supabase docs and Vercel templates, cross-verified
- Pitfalls: HIGH -- documented in official Supabase troubleshooting guides and community discussions

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (stable stack, unlikely to change)
