---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-02-27T05:11:37.983Z"
progress:
  total_phases: 2
  completed_phases: 1
  total_plans: 12
  completed_plans: 7
---

# State

## Current Position
- **Milestone**: 1 (MVP)
- **Phase**: 02-scraping-pipeline-4-hours — Plan 02/7 complete
- **Status**: Executing Phase 2. Plans 02-01 and 02-02 complete. YouTube API client library shipped.
- **Last session**: 2026-02-27T05:10:13Z
- **Stopped at**: Completed 02-02-PLAN.md (YouTube API client — URL parser, metadata fetch, channel search)

## Decisions
- Dual-mode architecture: standalone + module from single codebase
- GSD for development workflow, UUPM for design system
- All DB tables prefixed `re_`, all storage paths prefixed `remix-engine/`
- RemixEngineProvider as the module boundary layer
- HeyGen: Upload Asset API (audio_asset_id), never public URLs
- YouTube transcripts via yt-dlp (not Captions API — OAuth requirement)
- Remotion + Chromium for video rendering in worker container
- Railway for standalone deployment (web + worker + Redis)
- process.env is read ONLY in createStandaloneConfig() in config.ts — all other code uses getServerConfig()
- getServerConfig() auto-bootstraps from createStandaloneConfig() if not explicitly set (no-throw in API routes)
- z.record(z.string(), z.any()) required instead of z.record(z.any()) for Zod v3 compatibility
- supabaseAdmin uses persistSession: false to prevent cookie interference in worker process
- [Phase 01-foundation-4-hours]: process.env is read ONLY in createStandaloneConfig() in config.ts — all other code uses getServerConfig()
- [Phase 01-foundation-4-hours]: getServerConfig() auto-bootstraps from createStandaloneConfig() if not explicitly set
- [Phase 01-02]: shadcn/ui v3 uses oklch color space; --re-* tokens use HSL — both coexist in globals.css without conflict
- [Phase 01-02]: @theme inline maps only --re-* tokens; shadcn base colors handled via @import "shadcn/tailwind.css"
- [Phase 01-02]: Dark mode is always-on via .dark class on <html>; no light mode designed or supported
- [Phase 01-foundation-4-hours]: Middleware reads process.env directly — documented exception to the no-process.env rule (Edge Runtime cannot use getServerConfig())
- [Phase 01-foundation-4-hours]: Invite flow uses verifyOtp(token_hash, type:'invite') then updateUser — Supabase recommended pattern for invite link tokens
- [Phase 01-foundation-4-hours]: window.location.href used for post-auth redirect (not router.push) to ensure middleware cookie refresh fires on next request
- [Phase 01-foundation-4-hours]: Used spec Section 5 as authoritative schema — richer 12-table schema (not plan's 6-table summary)
- [Phase 01-foundation-4-hours]: Storage bucket named 'remix-engine' (hyphen) per CLAUDE.md namespace rules
- [Phase 01-foundation-4-hours]: re_scenes UNIQUE(script_id, scene_number) — unique per script not per video
- [Phase 01-foundation-4-hours]: types.ts hand-written stub — Docker not available for supabase gen types
- [Phase 01-foundation-4-hours]: Providers pattern: root layout (server) delegates to Providers client component for RemixEngineProvider + ThemeProvider composition
- [Phase 01-foundation-4-hours]: suppressHydrationWarning on html element required with next-themes to prevent SSR mismatch on class attribute
- [Phase 01-foundation-4-hours]: Sidebar uses inline style for CSS variable widths — routePrefix is for API routes, UI nav uses hardcoded /dashboard/* paths
- [Phase 02-02]: durationSeconds is null in ChannelVideo — search.list does not return contentDetails; callers must fetch metadata separately if durations needed
- [Phase 02-02]: resolveChannelId returns input directly for UC-prefixed IDs to avoid unnecessary API round-trip
- [Phase 02-02]: parseIsoDuration returns 0 for unrecognized formats (e.g. P0D) — safe fallback with no throw
- [Phase 02-02]: All youtube-api files use youtubeGet() wrapper — zero direct fetch() calls, zero process.env
- [Phase 02-scraping-pipeline-4-hours]: cleanTempDir placed in worker handler caller (Plan 03), not inside scraper library — library functions are pure utilities, cleanup is caller responsibility
- [Phase 02-scraping-pipeline-4-hours]: extractSubtitles is non-fatal: catches all errors and returns null — subtitle failure must never abort a scrape job

## Performance Metrics
| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01-foundation-4-hours | 01 | 4min | 2 | 13 |
| 01-foundation-4-hours | 02 | 4min | 2 | 12 |
| 01-foundation-4-hours | 03 | 4min | 2 | 7 |
| 01-foundation-4-hours | 04 | 4min | 2 | 13 |
| 01-foundation-4-hours | 05 | 6min | 2 | 7 |
| 02-scraping-pipeline-4-hours | 01 | 2min | 2 | 6 |
| 02-scraping-pipeline-4-hours | 02 | 2min | 2 | 4 |

## Blockers
None.

## Key Files
- `REMIXENGINE_SPEC_v3.md` — Complete technical spec (source of truth for all implementation detail)
- `PROJECT.md` — Project vision (this file set)
- `REQUIREMENTS.md` — Scoped requirements with phase traceability
- `ROADMAP.md` — Phase plan with verify checkpoints
- `src/lib/remix-engine/config.ts` — RemixEngineConfig type, createStandaloneConfig(), getServerConfig(), setServerConfig()
- `src/lib/remix-engine/provider.tsx` — RemixEngineProvider React context
- `src/lib/remix-engine/hooks.ts` — useRemixEngine(), table(), storagePath(), RemixEngineContext
- `design-system/MASTER.md` — UUPM design token reference (read before building any UI)
- `src/app/globals.css` — Tailwind v4 with @custom-variant dark, all --re-* tokens, @theme inline
- `src/components/ui/` — shadcn/ui components (button, input, label, dropdown-menu, tooltip, avatar, separator)

## Notes
- The full spec (`REMIXENGINE_SPEC_v3.md`) contains: database schema SQL, Zod validation schemas, API route map, API integration code (HeyGen, 11Labs, Gemini, fal.ai, Runway), Dockerfile, Railway config, cost estimation formulas, error handling patterns, logging strategy, and the complete directory structure.
- When executing phases, reference the relevant sections of `REMIXENGINE_SPEC_v3.md` for implementation details.
- The UUPM design system is complete in `design-system/MASTER.md` — ALL UI work must read this file first.
- Tailwind v4 dark mode uses @custom-variant, not darkMode config. Use bg-re-bg-primary etc. for RemixEngine tokens.
