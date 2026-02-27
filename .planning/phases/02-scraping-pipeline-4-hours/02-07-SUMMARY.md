---
phase: 02-scraping-pipeline-4-hours
plan: 07
subsystem: ui
tags: [supabase-realtime, react-hooks, next.js, bullmq, progress-tracking]

# Dependency graph
requires:
  - phase: 02-scraping-pipeline-4-hours
    provides: "Plans 01-06: scraper library, YouTube API, BullMQ worker handler, API scrape routes, scrape UI components, channel batch UI, video detail page"
provides:
  - "useJobProgress(jobId) React hook — Supabase Realtime subscription on re_jobs with initial fetch"
  - "ScrapeProgressSteps component — three discrete steps (Downloading, Extracting transcript, Uploading to storage)"
  - "JobProgressSubscriber — progress cards with auto-navigation to video detail on complete (800ms)"
  - "ProjectDetailClient — server/client split for project detail page with active job tracking"
  - "Header quick-add button — floating modal with ProjectSelector and ScrapeInput from any page"
  - "POST /api/remix-engine/scrape/[jobId]/cancel — cancel endpoint marking job + video as cancelled"
  - "GET /api/remix-engine/projects — user project list endpoint for quick-add ProjectSelector"
affects:
  - 03-remix-pipeline
  - any plan rendering live pipeline status

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase Realtime postgres_changes subscription with initial fetch for hydration"
    - "Server/client component split: server component fetches data, client component manages interactive state"
    - "Auto-navigation with setTimeout delay (800ms) after job completion for UX polish"
    - "Fire-and-forget video status update in cancel endpoint — best-effort pattern"

key-files:
  created:
    - src/hooks/useJobProgress.ts
    - src/components/scraper/ScrapeProgressSteps.tsx
    - src/components/scraper/JobProgressSubscriber.tsx
    - src/app/(dashboard)/projects/[id]/ProjectDetailClient.tsx
    - src/app/api/remix-engine/scrape/[jobId]/cancel/route.ts
    - src/app/api/remix-engine/projects/route.ts
  modified:
    - src/app/(dashboard)/projects/[id]/page.tsx
    - src/components/layout/Header.tsx

key-decisions:
  - "useJobProgress uses createClient() from supabase/client.ts directly — RemixEngineConfig has no supabaseClient property; plan description was aspirational, actual hook API is correct pattern"
  - "cancel endpoint uses fire-and-forget for video status update — cancellation is best-effort, job status is authoritative"
  - "ScrapeProgressSteps treats cancelled status same as error for step visual state"
  - "ProjectSelector fetches projects client-side on mount in Header — avoids server/client data passing complexity"

patterns-established:
  - "Realtime hook pattern: initial fetch for hydration + subscribe for updates, cleanup via unsubscribe in effect teardown"
  - "Job progress card: shows in project page inline, dismissible on error/cancelled only, never during active processing"

requirements-completed:
  - R2.7
  - R2.8
  - R2.9

# Metrics
duration: 8min
completed: 2026-02-27
---

# Phase 2 Plan 07: Realtime Progress, Auto-Navigation, Header Quick-Add Summary

**Supabase Realtime job progress hook with discrete step indicator, 800ms auto-navigation to video detail on complete, and header quick-add modal with client-side project selector**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-27T05:30:15Z
- **Completed:** 2026-02-27T05:38:00Z
- **Tasks:** 2
- **Files modified:** 8 (6 created, 2 updated)

## Accomplishments
- Live job progress via Supabase Realtime — `useJobProgress` subscribes to `re_jobs` UPDATE events and returns `JobProgress` state
- Three-step visual indicator (Downloading → Extracting transcript → Uploading to storage) with pending/active/complete/error states using `--re-*` design tokens
- Auto-navigation 800ms after scrape completes, navigating to `/dashboard/projects/{id}/videos/{videoId}`
- Header Plus button opens floating quick-add modal with client-side project selector fetching from `/api/remix-engine/projects`
- Project detail page refactored to server/client split — server fetches data, `ProjectDetailClient` tracks active jobs
- Cancel endpoint marks `re_jobs` as cancelled and `re_videos.scrape_status` as error

## Task Commits

Each task was committed atomically:

1. **Task 1: Realtime progress hook, step component, cancel endpoint** - `1e64cdc` (feat)
2. **Task 2: JobProgressSubscriber, project page integration, header quick-add** - `49b0bdf` (feat)

**Plan metadata:** (pending final docs commit)

## Files Created/Modified
- `src/hooks/useJobProgress.ts` — React hook: initial fetch + Supabase Realtime postgres_changes subscription on re_jobs
- `src/components/scraper/ScrapeProgressSteps.tsx` — Step indicator: pending/active/complete/error visual states per milestone
- `src/components/scraper/JobProgressSubscriber.tsx` — Wrapper: live progress display + 800ms auto-navigate on complete
- `src/app/(dashboard)/projects/[id]/ProjectDetailClient.tsx` — Client portion of project detail page managing activeJobs state
- `src/app/api/remix-engine/scrape/[jobId]/cancel/route.ts` — POST cancel endpoint, auth-gated, marks job + video as cancelled
- `src/app/api/remix-engine/projects/route.ts` — GET endpoint returning user's projects for quick-add selector
- `src/app/(dashboard)/projects/[id]/page.tsx` — Updated to use ProjectDetailClient (server/client split)
- `src/components/layout/Header.tsx` — Added Plus button, quickAddOpen state, ProjectSelector, quick-add modal

## Decisions Made
- `useJobProgress` uses `createClient()` from `src/lib/supabase/client.ts` directly instead of `useRemixEngine().supabaseClient` — the plan described the latter but `RemixEngineConfig` has no `supabaseClient` property; using `createClient()` is the correct established pattern
- Cancel endpoint applies fire-and-forget pattern for video status update — cancellation outcome on job row is authoritative
- `ScrapeProgressSteps` treats `cancelled` status identically to `error` for step visual state (shows error indicator on reached steps)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] useJobProgress uses createClient() not useRemixEngine().supabaseClient**
- **Found during:** Task 1 (Realtime progress hook implementation)
- **Issue:** Plan specified `const { supabaseClient } = useRemixEngine()` but `RemixEngineConfig` type has no `supabaseClient` property — this would be a TypeScript error
- **Fix:** Used `createClient()` from `@/lib/supabase/client.ts` directly, which is the established browser Supabase client pattern
- **Files modified:** src/hooks/useJobProgress.ts
- **Verification:** TypeScript compiles with zero errors
- **Committed in:** 1e64cdc (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type error / incorrect API usage)
**Impact on plan:** Essential correctness fix. RemixEngineConfig is the config object, not a supabase client container. No scope creep.

## Issues Encountered
- Pre-existing build failure: `Cannot apply unknown utility class 'border-border'` in `globals.css` — this predates Plan 07 and is unrelated to any changes here. TypeScript compiles cleanly with zero errors.

## User Setup Required
None - no external service configuration required. Supabase Realtime requires the project to have Realtime enabled on the `re_jobs` table (should already be configured from prior phases).

## Next Phase Readiness
- Phase 2 scraping pipeline is complete: all 7 plans shipped
- Realtime progress infrastructure ready for Phase 3 (remix pipeline) to use the same pattern for remix job progress
- Cancel endpoint pattern can be reused for other job types in future phases

## Self-Check: PASSED

All 6 created files exist on disk. Both task commits verified: 1e64cdc and 49b0bdf present in git log. TypeScript compiles with zero errors.

---
*Phase: 02-scraping-pipeline-4-hours*
*Completed: 2026-02-27*
