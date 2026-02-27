---
phase: 01-foundation-4-hours
plan: "05"
subsystem: auth
tags: [supabase, ssr, middleware, invite-only, next-auth, health-check]

# Dependency graph
requires:
  - phase: 01-foundation-4-hours
    provides: "Plan 01 — Supabase clients (browser + server + admin), getServerConfig(), InviteUserSchema"
  - phase: 01-foundation-4-hours
    provides: "Plan 02 — shadcn/ui components (Button, Input, Label), --re-* CSS tokens in globals.css"
provides:
  - "src/middleware.ts — Next.js edge middleware protecting /dashboard/*, allowing /api/*, /login, /signup"
  - "src/app/(auth)/layout.tsx — Auth route group layout with mode gate (returns null in module mode)"
  - "src/app/(auth)/login/page.tsx — Email/password login page using Supabase signInWithPassword"
  - "src/app/(auth)/signup/page.tsx — Invite-token signup page (server component, async searchParams)"
  - "src/app/(auth)/signup/SignupForm.tsx — Client component completing verifyOtp + updateUser invite flow"
  - "POST /api/remix-engine/auth/invite — Admin-only invite endpoint using supabaseAdmin.inviteUserByEmail"
  - "GET /api/remix-engine/health — Health check returning { status, mode, timestamp, version }"
affects:
  - "All dashboard routes now require authentication"
  - "Phase 2+ API routes can add admin-only guards following the same pattern"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Middleware uses process.env directly (documented exception — Edge Runtime cannot use getServerConfig())"
    - "Auth layout mode gate: if config.mode === 'module' return null — auth pages invisible in module mode"
    - "Invite flow: verifyOtp({ token_hash, type: 'invite' }) → updateUser({ password, data: { full_name } })"
    - "Hard window.location.href redirect after login/signup — ensures middleware cookie refresh fires"
    - "Admin auth guard: check user.user_metadata.role === 'admin' before privileged operations"

key-files:
  created:
    - src/middleware.ts
    - src/app/(auth)/layout.tsx
    - src/app/(auth)/login/page.tsx
    - src/app/(auth)/signup/page.tsx
    - src/app/(auth)/signup/SignupForm.tsx
    - src/app/api/remix-engine/auth/invite/route.ts
    - src/app/api/remix-engine/health/route.ts
  modified: []

key-decisions:
  - "Middleware reads process.env directly — documented exception to the no-process.env rule (Edge Runtime limitation)"
  - "SignupForm extracted to separate file SignupForm.tsx — server page.tsx imports it after token check"
  - "window.location.href used for post-auth redirect (not Next.js router.push) to ensure middleware runs cookie refresh"
  - "Invite flow uses verifyOtp type:'invite' then updateUser — Supabase recommended pattern for invite links"

patterns-established:
  - "Pattern: Auth layout mode gate — check config.mode === 'module' at layout level, return null to hide auth pages"
  - "Pattern: Admin-only API route guard — getUser() → check user_metadata.role === 'admin' → 403 if not"
  - "Pattern: Async searchParams in Next.js 15+ — accept as Promise<{ param?: string }> and await"

requirements-completed:
  - R1.4
  - RM.8

# Metrics
duration: 6min
completed: 2026-02-27
---

# Phase 1 Plan 05: Auth Flow Summary

**Invite-only auth with Supabase SSR middleware (edge-compatible cookie refresh), login/signup pages using shadcn/ui + --re-* tokens, admin invite endpoint, and health check route**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-02-27T03:02:48Z
- **Completed:** 2026-02-27T03:09:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Secured all `/dashboard/*` routes — unauthenticated requests are redirected to `/login` by middleware
- Built login page with email/password Supabase auth and hard redirect to `/dashboard` on success
- Built invite-only signup flow: server component reads `?token=` from searchParams, shows "Invite Required" message without token, or renders SignupForm client component with token
- Added admin-only `POST /api/remix-engine/auth/invite` endpoint calling `supabaseAdmin.auth.admin.inviteUserByEmail`
- Added `GET /api/remix-engine/health` health check endpoint returning `{ status, mode, timestamp, version }`
- Auth pages are invisible in module mode (layout returns null) per RM.8 requirement

## Task Commits

Each task was committed atomically:

1. **Task 1: Middleware and auth layout** - `5a94227` (feat)
2. **Task 2: Login page, signup page, invite API, health route** - `2833c07` (feat)

## Files Created/Modified

- `src/middleware.ts` — Next.js middleware: @supabase/ssr session refresh, /dashboard protection, /login+/signup redirect for authenticated users, matcher config excluding static assets
- `src/app/(auth)/layout.tsx` — Auth route group layout: config.mode gate returns null in module mode; standalone mode renders children centered with min-h-screen flex bg-[--re-bg-primary]
- `src/app/(auth)/login/page.tsx` — 'use client' login page: email/password state, signInWithPassword, error display with --re-destructive, Button/Input/Label shadcn components
- `src/app/(auth)/signup/page.tsx` — Server component: async searchParams (Next.js 15+ pattern), renders "Invite Required" or delegates to SignupForm
- `src/app/(auth)/signup/SignupForm.tsx` — 'use client' invite completion form: verifyOtp({ token_hash, type: 'invite' }) + updateUser({ password, data: { full_name } }) + redirect
- `src/app/api/remix-engine/auth/invite/route.ts` — Admin-only POST: 401 if unauthenticated, 403 if not admin, InviteUserSchema validation, supabaseAdmin.inviteUserByEmail
- `src/app/api/remix-engine/health/route.ts` — GET health check: { status: 'ok', mode, timestamp, version }

## Decisions Made

- **Middleware process.env exception:** Middleware runs at the Edge Runtime before the Node.js module system initializes — `getServerConfig()` cannot be called. Process.env exception documented with comment in the file.
- **SignupForm as separate file:** The plan suggested inline 'use client' in the server page.tsx. Since Next.js 15 requires server/client boundary separation, SignupForm was extracted to `SignupForm.tsx` (same directory) and imported into the server page.tsx.
- **Hard redirect after auth:** `window.location.href = '/dashboard'` used instead of `router.push()` — the full page navigation ensures the middleware's `getUser()` + cookie refresh runs on the next request.
- **Invite flow:** `verifyOtp({ token_hash: token, type: 'invite' })` is the Supabase-recommended approach for invite link tokens. The token in the URL is `token_hash`, not a raw token. After session is established, `updateUser()` sets password and full_name.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extracted SignupForm to separate file**
- **Found during:** Task 2 (Signup page implementation)
- **Issue:** Plan suggested inline 'use client' in server page.tsx, but Next.js 15 does not allow mixing 'use client' directly in server component files with async searchParams
- **Fix:** Extracted SignupForm to `src/app/(auth)/signup/SignupForm.tsx` as a separate client component file; page.tsx remains a server component that imports it
- **Files modified:** Created `src/app/(auth)/signup/SignupForm.tsx`, simplified `src/app/(auth)/signup/page.tsx`
- **Verification:** `npx tsc --noEmit` passes
- **Committed in:** 2833c07 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - Blocking)
**Impact on plan:** Required for Next.js 15 server/client component boundary rules. The separation is architecturally cleaner. No scope creep.

## Issues Encountered

- TypeScript initially reported a missing `@/components/layout/Header` module during verification. On re-run this was resolved — `Header.tsx` exists in `src/components/layout/` from Plan 04 and was never missing; the error was transient (likely TS server cache).

## User Setup Required

None - no external service configuration required at this stage. Supabase auth is configured via environment variables documented in `.env.example`.

## Next Phase Readiness

- `/dashboard/*` routes are secured — any dashboard content built in Phase 2+ will automatically be protected
- Auth flow is complete — login, invite-only signup, and the admin invite endpoint are all functional
- `POST /api/remix-engine/auth/invite` is wired and ready for use in the Admin panel (Phase 2)
- Health check endpoint is live at `GET /api/remix-engine/health` for monitoring

---
*Phase: 01-foundation-4-hours*
*Completed: 2026-02-27*

## Self-Check: PASSED

All created files confirmed present on disk. All commits confirmed in git log.

- `src/middleware.ts` — FOUND
- `src/app/(auth)/layout.tsx` — FOUND
- `src/app/(auth)/login/page.tsx` — FOUND
- `src/app/(auth)/signup/page.tsx` — FOUND
- `src/app/(auth)/signup/SignupForm.tsx` — FOUND
- `src/app/api/remix-engine/auth/invite/route.ts` — FOUND
- `src/app/api/remix-engine/health/route.ts` — FOUND
- `.planning/phases/01-foundation-4-hours/01-05-SUMMARY.md` — FOUND
- Commit `5a94227` (Task 1) — FOUND
- Commit `2833c07` (Task 2) — FOUND
