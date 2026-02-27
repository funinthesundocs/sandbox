---
phase: 02-scraping-pipeline-4-hours
plan: 05
subsystem: ui
tags: [next.js, react, youtube-iframe-api, supabase-storage, transcript, signed-url]

# Dependency graph
requires:
  - phase: 02-scraping-pipeline-4-hours
    provides: Scrape worker handler, re_videos DB table, video_file_path / transcript_file_path storage fields
  - phase: 02-scraping-pipeline-4-hours
    provides: VideoCard and VideoGrid for project detail navigation to video detail page

provides:
  - Video detail page at /projects/[id]/videos/[videoId] with YouTube player, metadata header, and transcript panel
  - GET /api/remix-engine/videos/[videoId] — video detail fetch
  - DELETE /api/remix-engine/videos/[videoId] — remove video with storage file cleanup
  - PATCH /api/remix-engine/videos/[videoId]/transcript — save edited transcript segments
  - GET /api/remix-engine/videos/[videoId]/signed-url — 1-hour signed URL for video playback
  - VideoPlayer component with YouTube IFrame API + Supabase signed URL fallback
  - TranscriptViewer component with 64px timestamp gutter, inline editing, 1s auto-save debounce
  - VideoDetailLayout client component managing shared seekTo state

affects: [02-07-auto-navigate-to-detail, 03-remix-pipeline, future-player-enhancement]

# Tech tracking
tech-stack:
  added: [YouTube IFrame API (loaded dynamically via script tag)]
  patterns:
    - YouTube IFrame API loaded once via script tag, YT.Player initialized in useEffect
    - onPlayerReady callback pattern to expose seekTo without forwardRef (React 19 compatible)
    - Client layout component bridges server-fetched data to shared interactive state
    - Inline transcript editing with 1-second debounce auto-save via useRef timer
    - SSR transcript load via 5-min signed URL in server component, player seeks via IFrame API

key-files:
  created:
    - src/app/api/remix-engine/videos/[videoId]/route.ts
    - src/app/api/remix-engine/videos/[videoId]/transcript/route.ts
    - src/app/api/remix-engine/videos/[videoId]/signed-url/route.ts
    - src/components/scraper/VideoPlayer.tsx
    - src/components/scraper/TranscriptViewer.tsx
    - src/components/scraper/VideoDetailLayout.tsx
    - src/app/(dashboard)/projects/[id]/videos/[videoId]/page.tsx
  modified: []

key-decisions:
  - "VideoDetailLayout client component wraps player + transcript to share seekTo state — avoids prop drilling or context for single-page concern"
  - "onPlayerReady callback pattern (not forwardRef) used to expose seekTo — React 19 compatible, aligns with plan spec"
  - "DELETE handler uses re_users.role check (editor/admin) from server Supabase client for RLS-compatible role verification"
  - "Transcript SSR: 5-min signed URL for fetch during server render, separate 1-hour signed URL API for client video playback"

patterns-established:
  - "Pattern: YouTube IFrame API — check window.YT.Player before loading script, set onYouTubeIframeAPIReady as global fallback"
  - "Pattern: Inline editing with debounced save — useRef timer, clearTimeout on each keystroke, PATCH on 1s idle"
  - "Pattern: Transcript gutter — button element in fixed w-16 column, text in flex-1 column, prevents selection interference"

requirements-completed: [R2.5, R2.7]

# Metrics
duration: 4min
completed: 2026-02-27
---

# Phase 2 Plan 05: Video Detail Page Summary

**YouTube IFrame API player with seek-from-transcript, inline transcript editing with 1s debounce auto-save, and four API routes for video CRUD, transcript save, and signed URL generation**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-27T05:22:08Z
- **Completed:** 2026-02-27T05:26:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Four API routes covering GET/DELETE video, PATCH transcript, and GET signed URL (1-hour expiry enforced)
- VideoPlayer with YouTube IFrame API embed, onPlayerReady callback exposing seekTo, Supabase signed URL video fallback when embed fails
- TranscriptViewer with 64px timestamp gutter (click-to-seek), inline text editing, 1-second auto-save debounce to PATCH endpoint
- Server-component video detail page: SSR metadata header, action buttons, transcript loaded via 5-min signed URL at render time

## Task Commits

Each task was committed atomically:

1. **Task 1: API routes for video detail, transcript save, and signed URL** - `7c3144c` (feat)
2. **Task 2: VideoPlayer, TranscriptViewer, and video detail page** - `4535fea` (feat)

## Files Created/Modified

- `src/app/api/remix-engine/videos/[videoId]/route.ts` — GET (video detail), DELETE (storage + DB removal with role check)
- `src/app/api/remix-engine/videos/[videoId]/transcript/route.ts` — PATCH saves edited segments to storage (upsert) and plain text to re_videos
- `src/app/api/remix-engine/videos/[videoId]/signed-url/route.ts` — GET returns 1-hour signed URL from supabaseAdmin
- `src/components/scraper/VideoPlayer.tsx` — YouTube IFrame API embed, onPlayerReady callback, signed URL fallback on error codes
- `src/components/scraper/TranscriptViewer.tsx` — Fixed-width gutter timestamps, inline editing, debounce auto-save, save status indicator
- `src/components/scraper/VideoDetailLayout.tsx` — Client component managing shared seekTo state, renders 5-col grid
- `src/app/(dashboard)/projects/[id]/videos/[videoId]/page.tsx` — Server component: auth, video fetch, transcript SSR, metadata chips, action buttons

## Decisions Made

- **VideoDetailLayout pattern:** Server page passes data props to a single client layout component that owns seekTo state and renders both VideoPlayer and TranscriptViewer — cleaner than prop drilling through page or using React context for a single-page concern.
- **onPlayerReady callback (not forwardRef):** Plan explicitly notes React 19 drops forwardRef; callback prop used to expose seekTo from VideoPlayer to parent.
- **DELETE role check via re_users.role:** Checked from server Supabase client (RLS) — matches existing auth pattern in the codebase.
- **5-min signed URL for SSR transcript fetch:** Short-lived URL for server-side fetch (transcript.json), separate from the 1-hour video playback URL.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Video detail page is fully functional — players, transcript editing, and all four API routes wired
- Plan 07 (auto-navigate after scrape) can link directly to `/dashboard/projects/${projectId}/videos/${videoId}`
- Start Remix button is a disabled stub — ready to be wired when remix pipeline is built in Phase 3

---
*Phase: 02-scraping-pipeline-4-hours*
*Completed: 2026-02-27*
