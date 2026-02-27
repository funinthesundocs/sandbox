---
phase: 02-scraping-pipeline-4-hours
plan: "01"
subsystem: scraper
tags: [yt-dlp, ffmpeg, ffprobe, vtt, transcript, temp-files, error-handling, worker]

requires:
  - phase: 01-foundation-4-hours
    provides: worker architecture (tsconfig.worker.json relative-import pattern established)

provides:
  - getTempDir/ensureTempDir/cleanTempDir for /tmp/remixengine/{videoId} lifecycle
  - ScrapeError class with ScrapeErrorCode union and mapYtDlpError() mapper
  - USER_FACING_ERRORS record keyed by ScrapeErrorCode
  - downloadYouTubeVideo(url, videoId) with 5-min timeout, 20-min limit, 200MB auto-compress
  - extractSubtitles(url, videoId) returning vttPath or null (non-fatal)
  - parseVTT(filePath) returning TranscriptSegment[] with deduplication
  - transcriptToPlainText(segments) for database storage
  - getVideoDuration via ffprobe, compressTo720p via ffmpeg, getFileSizeBytes

affects:
  - 02-02 (metadata extractor — re-uses ScrapeError, temp-files)
  - 02-03 (worker handler — imports all scraper functions, must call cleanTempDir in finally)
  - 02-04 (API routes — uses ScrapeErrorCode for error responses)

tech-stack:
  added: []
  patterns:
    - "Relative imports only within src/lib/scraper/ — no @/ aliases (worker-safe)"
    - "cleanTempDir always in worker finally blocks — never inside library functions"
    - "Subtitle extraction is non-fatal — return null, log warning, continue scrape"
    - "ScrapeError re-throw pattern: rethrow ScrapeError directly, map unknown errors via mapYtDlpError()"

key-files:
  created:
    - src/lib/scraper/temp-files.ts
    - src/lib/scraper/error-codes.ts
    - src/lib/scraper/video-utils.ts
    - src/lib/scraper/youtube-downloader.ts
    - src/lib/scraper/transcript-extractor.ts
    - src/lib/scraper/vtt-parser.ts
  modified: []

key-decisions:
  - "cleanTempDir placed in caller (worker handler) not inside library — library functions are pure download/parse utilities"
  - "compressTo720p keeps original file if compressed is larger (edge case guard)"
  - "VTT deduplication compares adjacent segments only (not global) — correct for auto-caption repeat pattern"
  - "extractSubtitles catches all errors and returns null — non-fatal by design"

patterns-established:
  - "Relative imports pattern: all src/lib/scraper/ files import from ./other-scraper-file (no @/ aliases)"
  - "ScrapeError rethrow: catch block checks instanceof ScrapeError, rethrows directly; maps unknown errors via mapYtDlpError()"

requirements-completed: [R2.1, R2.3, R2.4, R2.8, R2.9]

duration: 2min
completed: "2026-02-27"
---

# Phase 2 Plan 01: Scraper Core Library Summary

**yt-dlp/ffmpeg scraper library with typed error codes, VTT transcript parsing, and temp-file lifecycle management — all worker-safe with relative imports**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-27T05:08:15Z
- **Completed:** 2026-02-27T05:10:07Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Six library files form the complete scraper layer consumed by BullMQ worker (Plan 03) and never touched by API routes directly
- downloadYouTubeVideo() enforces all three constraints: 5-min yt-dlp timeout, 20-min duration rejection (TOO_LONG), 200MB compression trigger
- parseVTT() handles real auto-caption quirks: adjacent deduplication, HTML tag stripping, cue settings on timestamp lines, numeric cue identifiers
- All nine ScrapeErrorCode values mapped to user-facing strings via USER_FACING_ERRORS — handlers never construct error messages manually

## Task Commits

Each task was committed atomically:

1. **Task 1: Temp file utilities, error codes, video utilities** - `e846204` (feat)
2. **Task 2: yt-dlp download wrapper, subtitle extractor, VTT parser** - `8fad7ac` (feat)

## Files Created/Modified

- `src/lib/scraper/temp-files.ts` — getTempDir/ensureTempDir/cleanTempDir for /tmp/remixengine/{videoId}
- `src/lib/scraper/error-codes.ts` — ScrapeErrorCode union, ScrapeError class, mapYtDlpError(), USER_FACING_ERRORS
- `src/lib/scraper/video-utils.ts` — getVideoDuration (ffprobe), compressTo720p (ffmpeg), getFileSizeBytes
- `src/lib/scraper/youtube-downloader.ts` — downloadYouTubeVideo() with DownloadResult interface
- `src/lib/scraper/transcript-extractor.ts` — extractSubtitles() non-fatal VTT extraction
- `src/lib/scraper/vtt-parser.ts` — parseVTT(), TranscriptSegment interface, transcriptToPlainText()

## Decisions Made

- cleanTempDir lives in the worker handler (Plan 03), not inside library functions — the library is pure utility code, cleanup is caller responsibility
- compressTo720p checks compressed vs original size before replacing — avoids the edge case where 720p re-encode produces a larger file
- VTT deduplication uses adjacent-segment comparison (not global) — matches the actual auto-caption repeat pattern where the same line appears twice in succession as words are added incrementally
- extractSubtitles wraps its entire body in try/catch and returns null — subtitle extraction failure must never abort a scrape job

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. (yt-dlp and ffmpeg are system dependencies documented in the plan context.)

## Next Phase Readiness

- Scraper core library complete — Plan 02 (metadata extractor) and Plan 03 (worker handler) can now import directly from src/lib/scraper/
- Worker handler (Plan 03) must call cleanTempDir(videoId) in its finally block — the library intentionally does not do this
- System dependencies (yt-dlp, ffmpeg) must be installed on the machine running the worker

## Self-Check: PASSED

- FOUND: src/lib/scraper/temp-files.ts
- FOUND: src/lib/scraper/error-codes.ts
- FOUND: src/lib/scraper/video-utils.ts
- FOUND: src/lib/scraper/youtube-downloader.ts
- FOUND: src/lib/scraper/transcript-extractor.ts
- FOUND: src/lib/scraper/vtt-parser.ts
- FOUND commit: e846204 (feat(02-01): add scraper temp-files, error-codes, video-utils)
- FOUND commit: 8fad7ac (feat(02-01): add youtube-downloader, transcript-extractor, vtt-parser)

---
*Phase: 02-scraping-pipeline-4-hours*
*Completed: 2026-02-27*
