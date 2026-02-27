# CLAUDE.md

## Project

RemixEngine — YouTube content remixing pipeline. Dual-mode: runs standalone now, embeds as module later. Full spec in `REMIXENGINE_SPEC_v3.md` (source of truth).

## Commands

```bash
# Dev
npm run dev                    # Next.js dev server (port 3000)
npm run worker:dev             # BullMQ worker (separate process, must run alongside dev)
redis-server                   # Redis (if not running as service)

# Verify (run after every change)
npx tsc --noEmit               # Type-check — must pass with zero errors
npm run build                  # Full production build — must succeed
npm run lint                   # ESLint

# Database
npx supabase db push           # Apply migrations to remote
npx supabase gen types typescript --local > src/lib/supabase/types.ts  # Regenerate types after schema changes

# Worker build
npx tsc -p tsconfig.worker.json  # Compile worker separately — uses relative imports, no Next.js aliases
```

## Architecture

Config flows through `RemixEngineProvider`. Business logic NEVER reads `process.env` — the only place that happens is `createStandaloneConfig()` in `src/lib/remix-engine/config.ts`.

- Client-side: `useRemixEngine()` hook
- Server-side: `getServerConfig()`
- Storage paths: `storagePath('videos', projectId, videoId, 'original.mp4')` helper

## Namespace Rules

IMPORTANT — every identifier is prefixed for module isolation:

| What | Prefix | Example |
|---|---|---|
| DB tables | `re_` | `re_videos`, `re_projects`, `re_jobs` |
| API routes | `/api/remix-engine/` | `/api/remix-engine/scrape`, not `/api/scrape` |
| Storage paths | `remix-engine/` | `remix-engine/videos/{projectId}/{videoId}/original.mp4` |
| CSS variables | `--re-` | `--re-bg-primary`, `--re-accent-primary` |
| Route links | `config.routePrefix` | `${config.routePrefix}/projects/${id}` |

Never write a bare table name, API path, storage path, or CSS color. Always use the prefix or helper.

## Key Files

```
src/lib/remix-engine/
├── config.ts              # RemixEngineConfig type + createStandaloneConfig() + getServerConfig()
├── provider.tsx           # RemixEngineProvider React context
└── hooks.ts               # useRemixEngine(), storagePath(), table() helpers

src/lib/supabase/
├── client.ts              # Browser client (anon key, cookie session)
├── server.ts              # Server client (cookie session, SSR)
├── admin.ts               # Service role client (bypasses RLS — worker only)
└── types.ts               # Auto-generated from schema

src/lib/queue/
├── connection.ts          # Redis connection via getServerConfig()
└── queues.ts              # BullMQ queue definitions (scrape, remix, generate, render)

src/worker/
├── index.ts               # Worker entry point — runs outside Next.js
└── handlers/              # Job handlers (scrape, remix, generate, render)

src/app/api/remix-engine/  # ALL API routes live here
design-system/MASTER.md    # UUPM-generated design tokens — read before building UI
```

## Security — Non-Negotiable

HeyGen audio: Upload Asset API (`POST https://upload.heygen.com/v1/asset`) → `audio_asset_id`. NEVER use `audio_url`. NEVER make storage public. See Spec Section 14 for the full pattern.

Supabase Storage stays private. Signed URLs (1-hour, server-generated) for frontend playback only. Runway ML gets 10-min signed URLs.

## Pipeline Gate

```
SCRAPE → REMIX → ⛔ USER APPROVAL ⛔ → GENERATE → ASSEMBLE
```

After remix, pipeline PAUSES. User must select title + thumbnail + approve script + choose voice/avatar. The `generate` endpoints MUST verify these selections exist before proceeding.

## Standalone vs Module

Sidebar, Header, login/signup pages: only render when `config.mode === 'standalone'`. Module mode returns `<>{children}</>`. Check mode in layout components before rendering shell UI.

## Design System

Read `design-system/MASTER.md` before building any UI. Check `design-system/pages/{page-name}.md` for page-specific overrides. All design tokens are CSS variables prefixed `--re-`. No hardcoded hex colors in components.

## Worker Rules

The worker is a separate Node.js process, NOT inside Next.js.
- Uses `tsconfig.worker.json` — relative imports only, no `@/` aliases
- Uses `supabaseAdmin` (service role key) — not the cookie-based client
- Every handler MUST call `cleanTempDir(videoId)` in a `finally` block
- Render queue: `concurrency: 1` (CPU-intensive)
- Remotion rendering requires Chromium — Dockerfile must install it (see Spec Section 18)
- Transcripts: use yt-dlp VTT extraction, not YouTube Captions API (requires OAuth)

## Spec Quick Reference

For implementation detail, read only the section you need — don't load the full 3K-line spec:

- Section 0: Dual-mode architecture, RemixEngineProvider, config types
- Section 5: Database schema (all `re_` prefixed tables, migrations, RLS, triggers)
- Section 6: Zod validation schemas
- Section 7: API route map (all `/api/remix-engine/` routes)
- Section 8: Pipeline state machine, job queue, worker concurrency
- Section 14: API integrations (HeyGen Upload Asset, ElevenLabs, Runway, Gemini, fal.ai)
- Section 15: Cost estimation engine
- Section 18: Dockerfile, Railway config, Chromium install for Remotion

## Git

- Branch per task: `feat/phase-1-auth`, `fix/heygen-upload`
- Atomic commits — one logical change per commit
- Commit format: `feat(scrape): add yt-dlp transcript extraction`
- Prefixes: `feat`, `fix`, `refactor`, `chore`, `docs`
