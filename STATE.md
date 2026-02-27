# State

## Current Position
- **Milestone**: 1 (MVP)
- **Phase**: 1 — Foundation (4 hours)
- **Status**: discuss-phase complete. Ready for `/gsd:plan-phase 1`.

## Decisions
- Dual-mode architecture: standalone + module from single codebase
- GSD for development workflow, UUPM for design system
- All DB tables prefixed `re_`, all storage paths prefixed `remix-engine/`
- RemixEngineProvider as the module boundary layer
- HeyGen: Upload Asset API (audio_asset_id), never public URLs
- YouTube transcripts via yt-dlp (not Captions API — OAuth requirement)
- Remotion + Chromium for video rendering in worker container
- Railway for standalone deployment (web + worker + Redis)

## Blockers
None.

## Key Files
- `REMIXENGINE_SPEC_v3.md` — Complete technical spec (source of truth for all implementation detail)
- `PROJECT.md` — Project vision (this file set)
- `REQUIREMENTS.md` — Scoped requirements with phase traceability
- `ROADMAP.md` — Phase plan with verify checkpoints

## Notes
- The full spec (`REMIXENGINE_SPEC_v3.md`) contains: database schema SQL, Zod validation schemas, API route map, API integration code (HeyGen, 11Labs, Gemini, fal.ai, Runway), Dockerfile, Railway config, cost estimation formulas, error handling patterns, logging strategy, and the complete directory structure.
- When executing phases, reference the relevant sections of `REMIXENGINE_SPEC_v3.md` for implementation details.
- The UUPM design system should be generated in Phase 1 and stored in `design-system/MASTER.md`.
