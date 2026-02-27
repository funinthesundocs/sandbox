---
phase: 01-foundation-4-hours
plan: "04"
subsystem: ui
tags: [dashboard, sidebar, header, next-themes, dark-mode, layout, spec-json]

# Dependency graph
requires:
  - phase: 01-foundation-4-hours
    provides: "Plan 01 — RemixEngine module boundary (provider, config, hooks)"
  - phase: 01-foundation-4-hours
    provides: "Plan 02 — Design system (--re-* CSS variables, shadcn/ui components)"
provides:
  - "Root layout wrapping app in RemixEngineProvider + ThemeProvider via Providers client component"
  - "ThemeProvider (next-themes) setting .dark class on <html> for always-on dark mode"
  - "Dashboard shell layout with mode-gate: standalone renders Sidebar+Header, module returns bare children"
  - "Collapsible Sidebar: 240px expanded / 64px collapsed icon rail, localStorage re-sidebar-collapsed"
  - "Role-based nav: adminOnly items hidden for non-admin roles"
  - "Header with page title derived from pathname + avatar dropdown with sign-out stub"
  - "Page shells: /dashboard/projects, /dashboard/queue, /dashboard/analytics, /dashboard/admin, /dashboard/settings"
  - "GET /api/remix-engine/spec.json returning module contract JSON"
affects:
  - "All subsequent UI plans — they build on the dashboard shell"
  - "Plan 05 (auth) — will wire real user/role into Sidebar+Header props, implement sign-out"

# Tech tracking
tech-stack:
  added:
    - next-themes@0.4.6 (dark mode class management)
  patterns:
    - "Providers pattern: root layout (server) delegates to Providers client component for context wrapping"
    - "Mode gate: dashboard layout checks getServerConfig().mode before rendering shell UI"
    - "Sidebar uses inline style for CSS variable widths (not Tailwind arbitrary values — CSS vars don't work there)"
    - "localStorage key re-sidebar-collapsed persists sidebar collapse state"
    - "All color values via --re-* CSS variables — zero hardcoded hex colors"
    - "React 19: no forwardRef anywhere"

key-files:
  created:
    - src/app/providers.tsx
    - src/components/layout/ThemeProvider.tsx
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/page.tsx
    - src/components/layout/Sidebar.tsx
    - src/components/layout/Header.tsx
    - src/app/(dashboard)/projects/page.tsx
    - src/app/(dashboard)/queue/page.tsx
    - src/app/(dashboard)/analytics/page.tsx
    - src/app/(dashboard)/admin/page.tsx
    - src/app/(dashboard)/settings/page.tsx
    - src/app/api/remix-engine/spec.json/route.ts
  modified:
    - src/app/layout.tsx

key-decisions:
  - "Providers pattern chosen: root layout is server component; Providers.tsx ('use client') composes RemixEngineProvider + ThemeProvider, avoiding server/client boundary issues"
  - "suppressHydrationWarning on <html> element required with next-themes to prevent SSR hydration mismatch on class attribute"
  - "Sidebar uses inline style={{ width }} for CSS variable values — Tailwind v4 arbitrary values like w-[var(--re-sidebar-width)] work but inline style is more explicit and reliable"
  - "adminOnly nav items shown when userRole is undefined (Phase 1 shell — real role injected in Plan 05)"
  - "routePrefix from config is for API routes only; UI nav links use hardcoded /dashboard/* paths per CONTEXT.md"

patterns-established:
  - "All layout components enforce mode gate — Sidebar/Header only in standalone mode"
  - "CSS variables used exclusively for all colors, spacing, and typography in components"
  - "Page shells follow consistent pattern: h1 with --re-text-primary, subtitle with --re-text-muted"

requirements-completed:
  - R1.5
  - RM.7
  - RM.10

# Metrics
duration: 4min
completed: 2026-02-27
---

# Phase 1 Plan 04: Dashboard Shell UI Summary

**Complete dashboard shell with collapsible sidebar (localStorage persistence, role-based nav), header with avatar dropdown, 5 page shells, and spec.json module contract route — all using --re-* CSS variables exclusively**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-27T03:03:06Z
- **Completed:** 2026-02-27T03:07:07Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Built the visual foundation every dashboard page depends on: collapsible sidebar, header, page shells
- Implemented the Providers pattern (server root layout + Providers client component) for clean context composition
- Sidebar correctly gates on `config.mode === 'standalone'` via dashboard layout.tsx mode check
- Sidebar collapse state persists across page refreshes via localStorage key `re-sidebar-collapsed`
- All nav items use CSS variable tokens exclusively — zero hardcoded hex colors verified by grep
- Published `GET /api/remix-engine/spec.json` module contract route for host app discovery

## Task Commits

Each task was committed atomically:

1. **Task 1: Root layout, ThemeProvider, Providers, dashboard shell layout** - `0142aa0` (feat)
2. **Task 2: Sidebar, Header, page shells, spec.json route** - `a7f1b1f` (feat)

## Files Created/Modified

- `src/app/layout.tsx` — MODIFIED: replaced scaffolded layout with Providers wrapper, kept Geist fonts, added suppressHydrationWarning
- `src/app/providers.tsx` — NEW: 'use client' component composing RemixEngineProvider + ThemeProvider around children
- `src/components/layout/ThemeProvider.tsx` — NEW: next-themes wrapper with attribute=class, defaultTheme=dark, enableSystem=false
- `src/app/(dashboard)/layout.tsx` — NEW: server component checking config.mode; renders Sidebar+Header or bare children
- `src/app/(dashboard)/page.tsx` — NEW: redirect to /dashboard/projects
- `src/components/layout/Sidebar.tsx` — NEW: 281 lines — collapsible sidebar with role-based nav, Tooltip on collapsed icons, localStorage persistence, all --re-* CSS variables
- `src/components/layout/Header.tsx` — NEW: page title from pathname + avatar dropdown with initials fallback
- `src/app/(dashboard)/projects/page.tsx` — NEW: placeholder shell
- `src/app/(dashboard)/queue/page.tsx` — NEW: placeholder shell
- `src/app/(dashboard)/analytics/page.tsx` — NEW: placeholder shell
- `src/app/(dashboard)/admin/page.tsx` — NEW: placeholder shell
- `src/app/(dashboard)/settings/page.tsx` — NEW: placeholder shell
- `src/app/api/remix-engine/spec.json/route.ts` — NEW: GET handler returning module contract

## Decisions Made

- **Providers pattern:** Root layout is a server component. Instead of marking it 'use client' (which would disable server features), a `Providers.tsx` client component wraps RemixEngineProvider + ThemeProvider. This is the standard Next.js App Router pattern.
- **suppressHydrationWarning on html:** next-themes sets the `.dark` class on `<html>` during client hydration, causing a hydration mismatch without this attribute.
- **Inline style for sidebar width:** `style={{ width: collapsed ? 'var(--re-sidebar-width-collapsed)' : 'var(--re-sidebar-width)' }}` — CSS variables in Tailwind arbitrary values (`w-[var(--...)]`) can be unreliable; inline style is explicit and always works.
- **routePrefix vs UI routes:** `config.routePrefix` (`/remix-engine`) is for API routes. All UI nav links use hardcoded `/dashboard/*` paths as specified in CONTEXT.md.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Dashboard shell is complete — Plans 03 (database) and 05 (auth) can use it immediately
- Plan 05 (auth) will wire real Supabase user session into Sidebar's `userRole` prop and implement the sign-out action
- All page shells are stubbed — Phase 2 plans will replace placeholder content with real UI

---
*Phase: 01-foundation-4-hours*
*Completed: 2026-02-27*

## Self-Check: PASSED

All 13 created/modified files confirmed present on disk. Both task commits (0142aa0, a7f1b1f) confirmed in git log. `npx tsc --noEmit` passes with zero errors. No hardcoded hex colors found in components.
