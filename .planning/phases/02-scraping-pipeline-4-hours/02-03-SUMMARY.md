---
phase: 02-scraping-pipeline-4-hours
plan: 03
subsystem: api
tags: [bullmq, worker, youtube, supabase, nextjs, typescript]

# Dependency graph
requires:
  - phase: 02-scraping-pipeline-4-hours
    plan: 01
    provides: "scraper library (youtube-downloader, transcript-extractor, vtt-parser, temp-files, error-codes)"
  - phase: 02-scraping-pipeline-4-hours
    plan: 02
    provides: "youtube-api client (metadata, url-parser, channel, url resolver)"
provides:
  - "handleScrapeJob() BullMQ handler: full download+transcript+upload pipeline with cleanTempDir in finally"
  - "POST /api/remix-engine/scrape: enqueue single video with duplicate detection"
  - "POST /api/remix-engine/scrape/preview: metadata-only preview with 20-min duration gate"
  - "POST /api/remix-engine/scrape/batch: enqueue up to 10 URLs sequentially"
  - "GET /api/remix-engine/channel: paginated channel video listing"
  - "Worker entry point: scrapeWorker concurrency:3, graceful SIGTERM/SIGINT shutdown"
affects:
  - "03-remix-pipeline"
  - "ui-scrape"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Worker handler: try/finally with cleanTempDir(videoId) — mandatory disk cleanup pattern"
    - "Worker handler: updateProgress() DRY helper updates both BullMQ job and re_jobs.progress"
    - "Parallel I/O: download + metadata in Promise.all(), storage uploads in Promise.all()"
    - "API route auth pattern: createClient().auth.getUser() → 401 if no user"
    - "Duplicate detection: check re_videos by youtube_id + project_id before inserting"
    - "Batch processing: sequential loop (not parallel) for DB inserts up to max 10"
    - "storagePath() helper for all storage paths — never manual construction"
    - "supabaseAdmin in worker, createClient() in API routes"

key-files:
  created:
    - "src/worker/handlers/scrape.ts"
    - "src/worker/index.ts"
    - "src/app/api/remix-engine/scrape/route.ts"
    - "src/app/api/remix-engine/scrape/preview/route.ts"
    - "src/app/api/remix-engine/scrape/batch/route.ts"
    - "src/app/api/remix-engine/channel/route.ts"
  modified:
    - "tsconfig.worker.json"
    - "src/lib/scraper/error-codes.ts"
    - "src/lib/youtube-api/client.ts"

key-decisions:
  - "ArrayBuffer → Uint8Array → Buffer conversion for thumbnail upload (TypeScript strict overload compatibility)"
  - "tsconfig.worker.json: added lib ES2022, jsx:react, excluded provider.tsx to allow React lib files in worker compilation scope"
  - "error-codes.ts: Error cause stored via property assignment instead of super() second arg for ES2020 compat"
  - "youtube-api/client.ts: @/ alias → relative import to be compatible with tsconfig.worker.json (no path aliases)"
  - "Batch route uses sequential URL processing (not Promise.all) to avoid DB overwhelm at max 10 items"

patterns-established:
  - "Worker cleanup pattern: cleanTempDir(videoId) always in finally block regardless of success/failure"
  - "Progress dual-update: job.updateProgress(pct) AND supabaseAdmin re_jobs.update({ progress }) via local helper"
  - "Storage bucket: always 'remix-engine' literal string (not from config — bucket name is fixed)"

requirements-completed: [R2.5, R2.6, R2.7, R2.8, R2.9]

# Metrics
duration: 4min
completed: 2026-02-27
---

# Phase 2 Plan 03: Scraping Integration Layer Summary

**BullMQ scrape worker handler and five Next.js API routes wiring the scraper library (Plan 01) and YouTube API client (Plan 02) into an end-to-end pipeline triggered by YouTube URL paste**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-27T05:13:40Z
- **Completed:** 2026-02-27T05:18:02Z
- **Tasks:** 2
- **Files modified:** 9 (6 created, 3 modified)

## Accomplishments

- `handleScrapeJob()` orchestrates download+metadata (parallel) → transcript extraction → parallel storage upload → DB update → job completion, with cleanTempDir in finally
- Five API routes cover all scrape entry points: single, batch, preview, and channel browse — all auth-gated
- Worker entry point registers scrapeWorker with concurrency:3, graceful shutdown on SIGTERM/SIGINT

## Task Commits

Each task was committed atomically:

1. **Task 1: BullMQ scrape worker handler** - `8dafca1` (feat)
2. **Task 2: Scrape API routes (enqueue, preview, batch, channel browse)** - `354ba4c` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `src/worker/handlers/scrape.ts` - Full scrape pipeline orchestrator: download+metadata parallel, transcript, storage upload, DB update; cleanTempDir in finally
- `src/worker/index.ts` - Worker entry point: scrapeWorker concurrency:3, graceful shutdown
- `src/app/api/remix-engine/scrape/route.ts` - POST: duplicate detection, re_videos+re_jobs insert, scrapeQueue.add()
- `src/app/api/remix-engine/scrape/preview/route.ts` - POST: metadata-only preview with 20-min duration gate and duplicate check
- `src/app/api/remix-engine/scrape/batch/route.ts` - POST: sequential processing of up to 10 URLs with per-URL error collection
- `src/app/api/remix-engine/channel/route.ts` - GET: resolve channel handle/slug, return paginated ChannelVideo[] list
- `tsconfig.worker.json` - Added lib ES2022, jsx:react, excluded provider.tsx
- `src/lib/scraper/error-codes.ts` - Fixed Error cause constructor for ES2020 compatibility
- `src/lib/youtube-api/client.ts` - Changed @/ alias to relative import for worker compat

## Decisions Made

- **ArrayBuffer conversion**: TypeScript strict mode rejects `Buffer.from(ArrayBuffer)` directly; fixed via `Buffer.from(new Uint8Array(arrayBuffer))` which satisfies the overload
- **tsconfig.worker.json**: Added `lib: ["ES2020","ES2021","ES2022"]` for ErrorOptions type + `jsx: "react"` to handle React lib files pulled in by `src/lib/**/*`, and excluded `provider.tsx` (JSX component not needed in worker)
- **error-codes.ts**: `super(msg, { cause })` is ES2022 behavior; replaced with property assignment on `this` to maintain ES2020 target compatibility without losing the cause data
- **youtube-api/client.ts**: Changed `@/lib/remix-engine/config` to `../remix-engine/config` — tsconfig.worker.json has no paths aliases, so `@/` imports fail when worker compilation includes youtube-api files
- **Batch sequential processing**: URLs in batch are processed with a for-loop (not Promise.all) to keep DB inserts orderly and avoid race conditions on duplicate detection

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed youtube-api/client.ts @/ alias causing worker compilation failure**
- **Found during:** Task 1 (Worker TypeScript compilation)
- **Issue:** `tsconfig.worker.json` has no `paths` configuration, so `import from '@/lib/remix-engine/config'` fails when youtube-api files are compiled as part of the worker
- **Fix:** Changed to relative import `../remix-engine/config`
- **Files modified:** `src/lib/youtube-api/client.ts`
- **Verification:** `npx tsc -p tsconfig.worker.json --noEmit` passes
- **Committed in:** `8dafca1` (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed error-codes.ts Error constructor ES2020 incompatibility**
- **Found during:** Task 1 (Worker TypeScript compilation)
- **Issue:** `super(message, { cause })` two-argument Error constructor requires ES2022 lib typings; tsconfig.worker.json targeted ES2020
- **Fix:** Changed to `super(message)` + manual `this.cause = cause` property assignment; added `lib: ["ES2020","ES2021","ES2022"]` to tsconfig.worker.json
- **Files modified:** `src/lib/scraper/error-codes.ts`, `tsconfig.worker.json`
- **Verification:** `npx tsc -p tsconfig.worker.json --noEmit` passes
- **Committed in:** `8dafca1` (Task 1 commit)

**3. [Rule 3 - Blocking] Fixed provider.tsx JSX compilation error in worker tsconfig**
- **Found during:** Task 1 (Worker TypeScript compilation)
- **Issue:** `src/lib/**/*` pattern in tsconfig.worker.json pulls in `provider.tsx` which uses JSX, but no `jsx` compiler option was set
- **Fix:** Added `jsx: "react"` to tsconfig.worker.json and excluded `provider.tsx` (React component not needed in worker)
- **Files modified:** `tsconfig.worker.json`
- **Verification:** `npx tsc -p tsconfig.worker.json --noEmit` passes
- **Committed in:** `8dafca1` (Task 1 commit)

**4. [Rule 1 - Bug] Fixed ArrayBuffer → Buffer type mismatch for thumbnail upload**
- **Found during:** Task 1 (Worker TypeScript compilation)
- **Issue:** `Buffer.from(await fetch(...).then(r => r.arrayBuffer()))` — TypeScript strict mode does not allow `ArrayBuffer` as argument to `Buffer.from()` (wrong overload)
- **Fix:** Converted via `Buffer.from(new Uint8Array(arrayBuffer))` which satisfies the typed overload
- **Files modified:** `src/worker/handlers/scrape.ts`
- **Verification:** `npx tsc -p tsconfig.worker.json --noEmit` passes
- **Committed in:** `8dafca1` (Task 1 commit)

---

**Total deviations:** 4 auto-fixed (3 blocking, 1 bug — all in Task 1 compilation)
**Impact on plan:** All fixes required to make worker compilation pass. No scope creep. API routes compiled cleanly on first pass.

## Issues Encountered

All issues were compilation errors discovered during Task 1 worker TypeScript check and resolved inline. Task 2 (API routes) compiled cleanly on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Scraping pipeline fully wired: URL paste → API → BullMQ → worker → Supabase Storage + DB
- Worker ready to run: `npx ts-node -p tsconfig.worker.json src/worker/index.ts`
- Remaining scrape-side work: UI pages to trigger scrape, job status polling endpoint (Phase 3)
- Next phase (remix pipeline) can import `ScrapeJobData` interface from `src/worker/handlers/scrape.ts` for type reference

---
*Phase: 02-scraping-pipeline-4-hours*
*Completed: 2026-02-27*
