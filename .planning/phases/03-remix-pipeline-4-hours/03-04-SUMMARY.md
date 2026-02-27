---
phase: 03-remix-pipeline-4-hours
plan: "04"
subsystem: ui
tags: [react, nextjs, supabase, pipeline-tabs, remix-review]

# Dependency graph
requires:
  - phase: 03-remix-pipeline-4-hours
    plan: "03"
    provides: "5 remix API routes (/title, /thumbnail, /script, /select, /batch-select) that StartRemixButton calls"
  - phase: 03-remix-pipeline-4-hours
    plan: "00"
    provides: "Wave 0 test scaffold including RemixReviewPage.test.tsx stub"
provides:
  - "PipelineTabs component: 3-stage pipeline navigation (Scraping, Remix Review, Generation) with locked/active/complete/processing states"
  - "StartRemixButton component: fires all 3 remix endpoints in parallel, navigates to remix review on success"
  - "Remix review route: server component at /dashboard/projects/[id]/videos/[videoId]/remix — fetches and displays remix data by status"
  - "Video detail page updated: PipelineTabs + StartRemixButton wired in"
affects:
  - "03-05 — RemixReviewPage client component inserts into remix/page.tsx placeholder"
  - "03-06 — approve route that approve button in RemixReviewPage calls"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pipeline tab pattern: 3 stages with locked/active/complete/processing states using --re-* CSS tokens"
    - "Server-side remix data fetch using supabaseAdmin for cross-table reads bypassing RLS"
    - "Signed URL generation for private thumbnail storage (1-hour TTL)"
    - "Promise.allSettled for parallel remix API calls — non-fatal per-endpoint failure"

key-files:
  created:
    - "src/components/remix/PipelineTabs.tsx"
    - "src/components/remix/StartRemixButton.tsx"
    - "src/app/(dashboard)/projects/[id]/videos/[videoId]/remix/page.tsx"
  modified:
    - "src/app/(dashboard)/projects/[id]/videos/[videoId]/page.tsx"

key-decisions:
  - "supabaseAdmin used in remix/page.tsx server component for cross-table reads — consistent with existing video detail page pattern (already uses supabaseAdmin for storage)"
  - "PipelineTabs uses 'use client' directive to support potential future interactivity (hover states, Link transitions)"
  - "Promise.allSettled (not Promise.all) for remix endpoint calls — navigate to review regardless of individual failures; review page shows partial results"
  - "bg-secondary token used for data summary card in remix page (not bg-card) — plan used bg-card but token doesn't exist in MASTER.md; bg-secondary is the correct Card token"

patterns-established:
  - "Pipeline tab component pattern: receives all 3 status props + activeTab, derives locked/active states from statuses"
  - "Remix review page pattern: server fetch + status-conditional rendering (pending/processing/complete/error states)"

requirements-completed:
  - R3.4
  - R3.5
  - R3.6

# Metrics
duration: 4min
completed: "2026-02-27"
---

# Phase 03 Plan 04: Pipeline Tabs and Remix Review Page Summary

**PipelineTabs component + StartRemixButton wired to video detail page, remix review server page shell fetching titles/thumbnails/scenes from Supabase**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-27T06:51:26Z
- **Completed:** 2026-02-27T06:54:50Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- PipelineTabs renders 3 pipeline stages with correct locked/active/complete/processing visual states using all --re-* CSS tokens
- StartRemixButton client component fires all 3 remix endpoints (title/thumbnail/script) in parallel via Promise.allSettled, then navigates to remix review route
- Remix review page (server component) fetches titles, thumbnails with signed URLs, and scripts+scenes; shows appropriate state for pending/processing/complete/error remix_status
- Video detail page updated: disabled Start Remix button replaced with StartRemixButton, PipelineTabs added above VideoDetailLayout

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PipelineTabs and StartRemixButton components** - `757e61d` (feat)
2. **Task 2: Update video detail page and create remix review page shell** - `a3d21ad` (feat)

**Plan metadata:** (to be added in final commit)

## Files Created/Modified
- `src/components/remix/PipelineTabs.tsx` - 3-stage pipeline nav with locked/active/complete/processing states
- `src/components/remix/StartRemixButton.tsx` - Client button firing 3 remix APIs in parallel
- `src/app/(dashboard)/projects/[id]/videos/[videoId]/remix/page.tsx` - Server component: fetch remix data, status-conditional rendering
- `src/app/(dashboard)/projects/[id]/videos/[videoId]/page.tsx` - Added PipelineTabs + StartRemixButton, removed disabled button

## Decisions Made
- `supabaseAdmin` used in remix/page.tsx for cross-table reads — consistent with pattern already established in video detail page (uses it for storage signed URLs)
- `Promise.allSettled` over `Promise.all` for remix endpoint calls — partial success is acceptable; review page renders whatever data loaded
- Used `var(--re-bg-secondary)` for data summary card in remix page instead of `var(--re-bg-card)` — bg-card token does not exist in design system MASTER.md; bg-secondary is the correct Card background token

## Deviations from Plan

None - plan executed exactly as written (minor CSS token correction noted in Decisions Made).

## Issues Encountered
- Pre-existing TypeScript errors from Wave 0 test stubs (RemixReviewPage.test.tsx, gate.test.ts) reference Plan 05+ files not yet created. These are out of scope for Plan 04 and pre-existed before this plan ran. All 31 actual tests pass GREEN.
- Pre-existing build error: `Cannot apply unknown utility class 'border-border'` in globals.css — not introduced by this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 05 can now insert RemixReviewPage client component at the `{/* TODO: RemixReviewPage client component inserted here by Plan 05 */}` comment in remix/page.tsx
- The video detail page pipeline navigation is fully functional — tabs lock/unlock based on video status
- Start Remix button is live and calls all 3 remix endpoints

---
*Phase: 03-remix-pipeline-4-hours*
*Completed: 2026-02-27*
