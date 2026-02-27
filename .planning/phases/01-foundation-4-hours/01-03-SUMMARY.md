---
phase: 01-foundation-4-hours
plan: "03"
subsystem: database
tags: [supabase, postgresql, schema, rls, migrations, realtime, storage, typescript]

# Dependency graph
requires:
  - "01-01"  # RemixEngineProvider config/hooks already established
provides:
  - supabase/ directory with config.toml (local dev configuration)
  - Migration 001: 12 re_ prefixed tables with triggers and indexes
  - Migration 002: RLS enabled on all tables with helper functions
  - Migration 003: remix-engine storage bucket (private) with access policies
  - Migration 004: Realtime publication for 5 tables
  - src/lib/supabase/types.ts: Database interface with all table Row/Insert/Update types
affects:
  - All API routes that query re_ tables (future phases)
  - Worker handlers that insert into re_jobs, re_api_usage
  - Auth flow (handle_new_user trigger auto-creates re_users on signup)
  - Supabase clients (types.ts can be used to type createClient() calls)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "All DB tables prefixed re_ — 12 tables: re_users, re_projects, re_batch_jobs, re_videos, re_remixed_titles, re_remixed_thumbnails, re_remixed_scripts, re_scenes, re_rendered_videos, re_jobs, re_api_usage, re_system_settings"
    - "RLS helper functions: is_active_user(), is_editor_or_admin(), is_admin() — all SECURITY DEFINER STABLE"
    - "Dynamic RLS policy loop via DO $$ block for content tables"
    - "Storage bucket 'remix-engine' (hyphen, private) — signed URLs generated server-side"
    - "handle_new_user trigger: auto-inserts re_users row from auth.users on signup"
    - "updated_at triggers on re_users, re_projects, re_videos, re_batch_jobs, re_system_settings"

key-files:
  created:
    - supabase/config.toml
    - supabase/migrations/001_initial_schema.sql
    - supabase/migrations/002_rls_policies.sql
    - supabase/migrations/003_storage_setup.sql
    - supabase/migrations/004_realtime_setup.sql
    - supabase/seed.sql
    - src/lib/supabase/types.ts
  modified: []

key-decisions:
  - "Used spec Section 5 as authoritative schema — richer than plan's simplified spec (12 tables not 6)"
  - "Storage bucket named 'remix-engine' (with hyphen) per CLAUDE.md namespace rules, not spec's 'remixengine-assets'"
  - "re_users uses is_active (boolean) per spec — not status (text) as plan description suggested"
  - "re_scenes has UNIQUE(script_id, scene_number) (per spec) — plan's description said video_id but spec is authoritative"
  - "types.ts hand-written stub — Docker not available for local Supabase gen types command"
  - "Seed.sql uses system settings only — no auth user stub (auth.users FK constraint prevents direct insert)"

# Metrics
duration: 4min
completed: 2026-02-27
---

# Phase 1 Plan 03: Supabase Schema Summary

**Supabase initialized with 4 migrations covering 12 re_-prefixed tables, RLS policies with 3 helper functions, private remix-engine storage bucket, realtime on 5 tables, and hand-written TypeScript types matching the full spec schema**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-02-27T03:02:21Z
- **Completed:** 2026-02-27T03:06:20Z
- **Tasks:** 2
- **Files created:** 7

## Accomplishments

- Initialized Supabase local configuration (`npx supabase init` — no Docker required for config only)
- Created complete initial schema with all 12 `re_` prefixed tables from spec Section 5
- Implemented all triggers: `handle_new_user` (auth signup), `updated_at` (5 tables), `update_batch_progress` (batch tracking)
- Created all indexes for foreign keys and query optimization patterns
- Enabled RLS on all 12 tables with three SECURITY DEFINER helper functions and full policy coverage
- Created private `remix-engine` storage bucket with role-based access policies
- Enabled Supabase Realtime for 5 tables (re_jobs, re_videos, re_projects, re_batch_jobs, re_scenes)
- Hand-written TypeScript `Database` interface with Row/Insert/Update types for all tables — TypeScript compiles with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Supabase and write migration 001 (initial schema)** - `e5e1dfa` (feat)
2. **Task 2: Write migrations 002-004 and generate types** - `9f41ef0` (feat)

## Files Created

- `supabase/config.toml` — Supabase local dev config (defaults, no ports changed)
- `supabase/migrations/001_initial_schema.sql` — 12 re_ tables, triggers, indexes
- `supabase/migrations/002_rls_policies.sql` — RLS on all tables, 3 helper functions, policies
- `supabase/migrations/003_storage_setup.sql` — remix-engine bucket (private), 4 storage policies
- `supabase/migrations/004_realtime_setup.sql` — Realtime for re_jobs, re_videos, re_projects, re_batch_jobs, re_scenes
- `supabase/seed.sql` — Default system settings (7 key/value pairs)
- `src/lib/supabase/types.ts` — Database interface, Tables<>/InsertTables<>/UpdateTables<> aliases, named row types

## Schema Summary

| Table | Purpose | Key Constraints |
|---|---|---|
| re_users | Auth user profiles | PK refs auth.users, email UNIQUE |
| re_projects | Video remix projects | status CHECK, settings JSONB |
| re_batch_jobs | Multi-video batch scrape | status CHECK, progress tracking |
| re_videos | Scraped YouTube videos | UNIQUE(project_id, youtube_id), 4 pipeline status columns |
| re_remixed_titles | AI-generated title variants | is_selected boolean |
| re_remixed_thumbnails | AI-generated thumbnails | is_selected boolean, file_path |
| re_remixed_scripts | AI-generated scripts | is_selected boolean |
| re_scenes | Script scene breakdown | UNIQUE(script_id, scene_number), 3 asset status columns |
| re_rendered_videos | Final rendered output | refs video + script |
| re_jobs | Async job tracking | 9 job types, Realtime progress |
| re_api_usage | API cost tracking | 7 service types, cost_estimate |
| re_system_settings | Admin key/value config | TEXT PK, JSONB value |

## Decisions Made

- Followed spec Section 5 as authoritative source — it specifies 12 tables with richer schema than the plan's simplified 6-table description
- Named storage bucket `remix-engine` (hyphen) per CLAUDE.md namespace rules: storage paths prefix `remix-engine/`
- `re_users` uses `is_active` boolean column per spec (not `status` text as the plan description mentioned — spec is authoritative)
- `re_scenes` has `UNIQUE(script_id, scene_number)` per spec — unique per script (not per video as plan desc suggested)
- Types file hand-written: Docker Desktop not available on this machine, so `npx supabase gen types typescript --local` fails; hand-written stub provides equivalent TypeScript safety

## Deviations from Plan

### Schema Richer Than Plan Description

**1. [Rule 2 - Auto-added] Full spec schema (12 tables) instead of plan's simplified 6 tables**
- **Found during:** Task 1 (reading REMIXENGINE_SPEC_v3.md Section 5 as instructed)
- **Issue:** Plan description listed 6 tables as a summary; spec Section 5 defines 12 tables (adds re_batch_jobs, re_remixed_titles, re_remixed_thumbnails, re_remixed_scripts, re_rendered_videos, re_system_settings)
- **Fix:** Implemented the full spec schema — the plan explicitly instructs "Read REMIXENGINE_SPEC_v3.md Section 5 for the complete schema. Do NOT invent schema — read it from Section 5."
- **Files modified:** supabase/migrations/001_initial_schema.sql, src/lib/supabase/types.ts

**2. [Rule 3 - Blocking] Hand-written types.ts instead of CLI generation**
- **Found during:** Task 2 (running `npx supabase gen types typescript --local`)
- **Issue:** Docker Desktop not available — CLI requires local Supabase running in Docker
- **Fix:** Plan explicitly anticipates this: "If not available (no local Supabase running), create a hand-written stub" — created comprehensive types file matching full schema
- **Files modified:** src/lib/supabase/types.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors

---

**Total deviations:** 2 auto-handled per plan instructions and deviation rules
**Impact on plan:** Richer schema is correct behavior. Types stub is explicitly planned fallback. Zero TypeScript errors.

## Issues Encountered

None beyond the expected Docker unavailability for types generation.

## Apply Migrations

To apply migrations to your Supabase project:
```bash
npx supabase db push
```

Or for local development (requires Docker Desktop):
```bash
npx supabase start
npx supabase db push
```

## Next Phase Readiness

- All database tables exist in SQL migrations — ready to apply to Supabase project
- TypeScript types available — API routes can use `Database['public']['Tables']['re_videos']['Row']` etc.
- RLS policies configured — all tables are protected; worker uses supabaseAdmin (service role) to bypass
- Storage bucket and policies defined — server can generate signed URLs for frontend access
- Realtime configured — dashboard can subscribe to re_jobs for live progress updates

---
*Phase: 01-foundation-4-hours*
*Completed: 2026-02-27*

## Self-Check: PASSED
