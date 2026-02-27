---
phase: 02-scraping-pipeline-4-hours
plan: 04
subsystem: ui
tags: [react, nextjs, supabase, tailwind, glassmorphism, scraper]

# Dependency graph
requires:
  - phase: 02-scraping-pipeline-4-hours
    provides: "02-03 scrape API routes (single, preview, batch) and worker handler"
provides:
  - ScrapeInput component with single/batch URL input and preview-then-confirm flow
  - ScrapePreviewCard component showing thumbnail, title, duration, view count before download
  - VideoCard component with thumbnail, status badge, duration badge, channel name
  - VideoGrid component with responsive 1-2-3-4 column grid, skeleton, empty state
  - Projects list page (server component) with project cards
  - Project detail page [id] (server component) with ScrapeInput + VideoGrid
affects:
  - 02-07-PLAN.md (live progress updates wire into ScrapeInput via onScrapeStarted callback)
  - future video detail page

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Glassmorphism cards via backdrop-blur-md + bg-[--re-bg-secondary]/60 + border border-[--re-border]/60 pattern"
    - "Server component fetches data, passes to client components as props"
    - "ScrapeInput preview flow: POST /scrape/preview -> show ScrapePreviewCard -> POST /scrape on confirm"

key-files:
  created:
    - src/components/scraper/ScrapeInput.tsx
    - src/components/scraper/ScrapePreviewCard.tsx
    - src/components/scraper/VideoCard.tsx
    - src/components/scraper/VideoGrid.tsx
    - src/app/(dashboard)/projects/[id]/page.tsx
  modified:
    - src/app/(dashboard)/projects/page.tsx
    - src/components/scraper/VideoPlayer.tsx

key-decisions:
  - "bg-black/70 on video duration overlay badge is intentional — video player convention, not a --re-* token violation"
  - "formatDuration duplicated in VideoCard and ScrapePreviewCard — tiny helper, acceptable duplication vs coupling"
  - "VideoGrid type for video prop uses inline interface aligned to re_videos schema (not importing from types.ts directly to keep component self-contained)"

patterns-established:
  - "Glassmorphism pattern: className bg-[--re-bg-secondary]/60 backdrop-blur-md border border-[--re-border]/60 + boxShadow inline style for glow"
  - "Status badge config map: local const STATUS_CONFIG maps scrape_status enum to label/color/bg"
  - "Server component pattern for pages: fetch from re_projects/re_videos via createClient(), pass typed data to client components"

requirements-completed: [R2.1, R2.2, R2.7, R2.9]

# Metrics
duration: 4min
completed: 2026-02-27
---

# Phase 2 Plan 4: Scraper UI Components Summary

**Glassmorphism scraper UI: ScrapeInput with preview-before-download flow, VideoCard grid with status badges, Projects list and detail pages fed from Supabase re_projects/re_videos**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-27T05:21:51Z
- **Completed:** 2026-02-27T05:25:17Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- ScrapeInput: smart URL input auto-detecting single vs multi-URL batch paste, fetches preview from /scrape/preview, shows ScrapePreviewCard before confirming, duplicate detection with re-scrape option
- VideoCard + VideoGrid: responsive 4-column grid with thumbnail hover zoom, duration badge, status badge (pending/processing/complete/error), glassmorphism card design
- Projects list page (server component): lists all re_projects with create button and empty state
- Project detail page [id]: server-fetches project and videos, passes to ScrapeInput and VideoGrid client components

## Task Commits

Each task was committed atomically:

1. **Task 1: ScrapeInput and ScrapePreviewCard components** - `ec63672` (feat)
2. **Task 2: VideoCard, VideoGrid, Projects page, Project detail page** - `019028c` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `src/components/scraper/ScrapeInput.tsx` - Smart URL textarea input with preview/confirm/duplicate flow
- `src/components/scraper/ScrapePreviewCard.tsx` - Preview card with thumbnail, duration, view count, confirm/cancel buttons
- `src/components/scraper/VideoCard.tsx` - Single video card with status badge, duration badge, hover glow
- `src/components/scraper/VideoGrid.tsx` - Responsive grid with loading skeleton and empty state
- `src/app/(dashboard)/projects/page.tsx` - Projects list page (rewritten from stub)
- `src/app/(dashboard)/projects/[id]/page.tsx` - Project detail page with ScrapeInput + VideoGrid
- `src/components/scraper/VideoPlayer.tsx` - Bug fix: ReturnType -> InstanceType (Rule 1 auto-fix)

## Decisions Made
- `bg-black/70` on video duration overlay badge is intentional — standard video player overlay convention, not a design system violation
- `formatDuration` duplicated between VideoCard and ScrapePreviewCard — tiny 8-line helper, coupling components via shared module would be excessive
- VideoGrid uses inline interface rather than importing Database['re_videos']['Row'] to keep component self-contained

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed VideoPlayer.tsx ReturnType -> InstanceType for constructor type**
- **Found during:** Task 2 (TypeScript verification pass)
- **Issue:** `ReturnType<Window['YT']['Player']>` fails TypeScript because `YT.Player` is a constructor (`new` function), not a regular function. `ReturnType<>` only works with regular functions; `InstanceType<>` is required for constructors.
- **Fix:** Changed `ReturnType<Window['YT']['Player']>` to `InstanceType<Window['YT']['Player']>` on line 44 of VideoPlayer.tsx
- **Files modified:** `src/components/scraper/VideoPlayer.tsx`
- **Verification:** `npx tsc --noEmit` passes with zero errors after fix
- **Committed in:** `019028c` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug fix)
**Impact on plan:** Pre-existing bug in VideoPlayer.tsx from Plan 05 (which ran before this plan). Fix necessary for TypeScript to compile cleanly. Zero scope creep.

## Issues Encountered
- Pre-existing `VideoPlayer.tsx` TypeScript error discovered during verification. Was a constructor type mismatch (`ReturnType` vs `InstanceType`) — fixed inline per Rule 1.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ScrapeInput is wired to real API routes but live progress updates (job polling) are not yet connected — that's Plan 07
- Projects and project detail pages are fully functional for static browsing
- VideoCard links to `/dashboard/projects/${projectId}/videos/${video.id}` — that route is built in Plan 05 (already complete)

---
*Phase: 02-scraping-pipeline-4-hours*
*Completed: 2026-02-27*

## Self-Check: PASSED

- All 6 files created/modified confirmed on disk
- Both task commits (ec63672, 019028c) confirmed in git log
- TypeScript compiles clean (zero errors)
