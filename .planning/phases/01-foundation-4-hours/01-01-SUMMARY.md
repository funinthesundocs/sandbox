---
phase: 01-foundation-4-hours
plan: "01"
subsystem: infra
tags: [remix-engine, bullmq, ioredis, zod, supabase, react-context, config]

# Dependency graph
requires: []
provides:
  - RemixEngineConfig interface and singleton config system (config.ts)
  - RemixEngineProvider React context with standalone/module mode (provider.tsx)
  - useRemixEngine() hook, table() and storagePath() server-side helpers (hooks.ts)
  - Browser and server Supabase clients reading from config (not process.env)
  - supabaseAdmin service-role client for worker use
  - IORedis connection with maxRetriesPerRequest: null
  - BullMQ queue definitions: scrape, remix, generate, render
  - Zod validation schemas for all pipeline data types
  - Worker entry point stub with graceful shutdown
  - tsconfig.worker.json for isolated worker TypeScript compilation
  - .env.example documenting all required environment variables
affects:
  - All subsequent phases that import queues, config, or Supabase clients
  - Worker handlers that use relative imports under tsconfig.worker.json
  - API routes under /api/remix-engine/

# Tech tracking
tech-stack:
  added:
    - bullmq (BullMQ queue framework)
    - ioredis (Redis client, required by BullMQ)
    - zod (schema validation)
  patterns:
    - Config singleton: getServerConfig() / setServerConfig() — all code reads config, not process.env
    - process.env isolation: ONLY createStandaloneConfig() in config.ts reads env vars
    - Table/storage helpers: table('videos') -> 're_videos', storagePath() -> 'remix-engine/...'
    - Worker isolation: separate tsconfig.worker.json with CommonJS, no @/ aliases
    - Queue/worker separation: queues.ts defines queues; src/worker/handlers/ will define consumers

key-files:
  created:
    - src/lib/remix-engine/config.ts
    - src/lib/remix-engine/provider.tsx
    - src/lib/remix-engine/hooks.ts
    - src/lib/supabase/admin.ts
    - src/lib/queue/connection.ts
    - src/lib/queue/queues.ts
    - src/lib/validators/schemas.ts
    - src/worker/index.ts
    - tsconfig.worker.json
    - .env.example
  modified:
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - .gitignore
    - package.json

key-decisions:
  - "process.env is read ONLY in createStandaloneConfig() in config.ts — all other code uses getServerConfig()"
  - "getServerConfig() auto-bootstraps from createStandaloneConfig() if not explicitly set (no-throw in API routes)"
  - "RemixEngineProvider accepts optional config prop for module mode injection"
  - "z.record(z.string(), z.any()) required instead of z.record(z.any()) for Zod v3 compatibility"
  - "supabaseAdmin uses persistSession: false to prevent cookie interference in worker process"

patterns-established:
  - "Config pattern: never import process.env — call getServerConfig() or useRemixEngine()"
  - "Table naming: always use table('name') helper — never bare 're_name'"
  - "Storage paths: always use storagePath() helper — never construct manually"
  - "Worker imports: relative paths only — no @/ aliases in src/worker/"

requirements-completed:
  - R1.6
  - R1.7
  - R1.8
  - R1.10
  - RM.1
  - RM.2
  - RM.3
  - RM.4
  - RM.5
  - RM.9

# Metrics
duration: 4min
completed: 2026-02-27
---

# Phase 1 Plan 01: RemixEngine Module Boundary Summary

**RemixEngineConfig singleton with provider/hooks triad, corrected Supabase clients (config not process.env), BullMQ scrape/remix/generate/render queues with IORedis, full Zod schema suite from spec, and worker tsconfig isolation**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-27T02:48:04Z
- **Completed:** 2026-02-27T02:51:31Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Established the RemixEngine module boundary — the architectural spine every subsequent phase depends on
- Eliminated all process.env reads outside config.ts (Supabase clients now read from getServerConfig())
- Created complete BullMQ queue infrastructure with Redis connection and all four pipeline queues
- Added full Zod schema suite covering scrape, remix, generate, project, admin, and cancel operations
- Configured isolated worker TypeScript compilation with tsconfig.worker.json (CommonJS, no @/ aliases)

## Task Commits

Each task was committed atomically:

1. **Task 1: RemixEngine config, provider, and hooks** - `e1dab6f` (feat)
2. **Task 2: Supabase clients, queue, worker scaffold, env docs, Zod schemas** - `be8783e` (feat)

## Files Created/Modified

- `src/lib/remix-engine/config.ts` - RemixEngineConfig interface, createStandaloneConfig() (sole process.env reader), getServerConfig()/setServerConfig() singleton
- `src/lib/remix-engine/provider.tsx` - RemixEngineProvider React context component, standalone/module mode
- `src/lib/remix-engine/hooks.ts` - useRemixEngine() hook, table() and storagePath() server-side helpers, RemixEngineContext export
- `src/lib/supabase/client.ts` - REPLACED: browser Supabase client reading from getServerConfig()
- `src/lib/supabase/server.ts` - REPLACED: server Supabase client reading from getServerConfig() with cookie handling
- `src/lib/supabase/admin.ts` - NEW: service role client for worker use (bypasses RLS, persistSession: false)
- `src/lib/queue/connection.ts` - NEW: IORedis instance with maxRetriesPerRequest: null (BullMQ required)
- `src/lib/queue/queues.ts` - NEW: scrapeQueue, remixQueue, generateQueue, renderQueue BullMQ instances
- `src/lib/validators/schemas.ts` - NEW: full Zod schema set from spec Section 6 with TypeScript inferred types
- `src/worker/index.ts` - NEW: worker entry point stub with SIGTERM/SIGINT graceful shutdown
- `tsconfig.worker.json` - NEW: CommonJS output, no paths aliases, rootDir src/, includes worker + lib
- `.env.example` - REPLACED: comprehensive documentation of all required environment variables
- `.gitignore` - UPDATED: added /tmp/remixengine/, supabase/.temp/, dist/

## Decisions Made

- `getServerConfig()` auto-bootstraps from `createStandaloneConfig()` when no explicit config has been set — this prevents throws in standalone API routes that haven't been wrapped by a provider
- `RemixEngineProvider` accepts an optional `config` prop for module mode; falls back to `createStandaloneConfig()` for standalone mode
- Used `z.record(z.string(), z.any())` instead of `z.record(z.any())` — Zod v3 requires explicit key type argument (auto-fixed during Task 2 verification)
- `supabaseAdmin` initialized eagerly at module load (not lazily) — acceptable since it's only imported by worker process
- Worker stub uses exported `main()` function to enable testing later

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed z.record() call for Zod v3 compatibility**
- **Found during:** Task 2 (TypeScript verification after writing schemas.ts)
- **Issue:** `z.record(z.any())` caused TypeScript error TS2554 "Expected 2-3 arguments, but got 1" — Zod v3 requires explicit key schema
- **Fix:** Changed to `z.record(z.string(), z.any())` in UpdateProjectSchema
- **Files modified:** src/lib/validators/schemas.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** be8783e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Auto-fix required for TypeScript compilation. No scope creep.

## Issues Encountered

None — other than the Zod API deviation documented above.

## User Setup Required

None - no external service configuration required at this stage. See `.env.example` for all environment variables that will need values when running the application.

## Next Phase Readiness

- Config/provider/hooks infrastructure is complete — all subsequent phases can import from `src/lib/remix-engine/config.ts`
- BullMQ queues are defined — API routes in later phases can enqueue jobs immediately
- Zod schemas are defined — API route handlers can validate requests without additional schema work
- Worker scaffold is ready — handlers can be added to `src/worker/handlers/` in Phase 2+
- Supabase clients corrected — auth/database phases build on clean client foundation

---
*Phase: 01-foundation-4-hours*
*Completed: 2026-02-27*

## Self-Check: PASSED

All created files confirmed present on disk. All commits (e1dab6f, be8783e) confirmed in git log.
