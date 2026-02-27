# RemixEngine

## Vision
RemixEngine is a YouTube content remixing pipeline — scrape videos, remix titles/thumbnails/scripts with AI, generate avatar voiceovers with B-roll, assemble final rendered videos.

## Architecture Mode: Dual-Mode (Standalone + Module)

RemixEngine runs in two modes from a single codebase:

**Standalone Mode (default — build and test now)**:
- Full Next.js app with its own auth (Supabase), layout (sidebar + header), routing
- Deploys independently to Railway at its own domain
- Reads config from environment variables
- Has its own login/signup pages, admin panel, dashboard shell
- This is how you develop, test, and demo the app

**Module Mode (future — embed into parent dashboard)**:
- Same business logic, but auth/layout/routing provided by parent app
- RemixEngine pages mount as route segments inside parent's layout
- Config injected via `<RemixEngineProvider>` React context (API keys, Supabase client, user, role)
- No sidebar, no header, no login pages — parent provides all of that
- Database tables already namespaced with `re_` prefix, no collisions

**The boundary**: A `RemixEngineProvider` context that in standalone mode wraps the app with its own shell and reads env vars, and in module mode accepts everything from the parent. All business logic imports from this provider, never directly from env.

```
┌─────────────────────────────────────────────┐
│  STANDALONE MODE                            │
│  RemixEngineProvider (reads from env)       │
│  ├── Own Auth (Supabase login/signup)       │
│  ├── Own Layout (sidebar + header)          │
│  └── Own Routing (/projects, /admin, etc.)  │
│       └── Business Logic (scraper, remix,   │
│           generate, assemble)               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  MODULE MODE                                │
│  ParentApp                                  │
│  ├── Parent Auth (provides user + role)     │
│  ├── Parent Layout (sidebar + header)       │
│  └── Parent Routing (/dashboard/remix/...)  │
│       └── RemixEngineProvider (injected)    │
│            └── Business Logic (same code)   │
└─────────────────────────────────────────────┘
```

## Stack
Next.js 14+ (App Router) · Supabase (Postgres + Auth + Storage) · BullMQ + Redis (job queue) · FFmpeg + Remotion (video assembly) · yt-dlp (scraping)

## External APIs
- Google Gemini (title/script remix)
- fal.ai FLUX (thumbnail generation)
- ElevenLabs (voiceover)
- HeyGen (avatar video — uses Upload Asset API, never public URLs)
- Runway ML / Kling (B-roll generation)
- YouTube Data API v3 (metadata)

## Core Pipeline
```
YouTube URL → SCRAPE → REMIX (title + thumbnail + script) → GENERATE (voice + avatar + B-roll) → ASSEMBLE → Final MP4
```

## Users & Roles
- **Admin**: Full access. Manage users, API keys, all pipeline stages, delete projects.
- **Editor**: Create projects, run pipelines, edit/approve content. No user management.
- **Viewer**: Read-only. Download final outputs.

Standalone mode: Supabase Auth with invite-only signup.
Module mode: Roles inherited from parent app's auth context.

## Deployment
- **Standalone**: Railway — 3 services (web + worker + Redis). $13-30/mo.
- **Module**: Consumed by parent Next.js app as internal package or monorepo workspace.

## Design System
Generated at build time via **UI UX Pro Max** skill. CSS variables only — in standalone mode uses generated tokens, in module mode inherits parent's tokens. Never hardcoded colors.

## Development Framework
Built using **GSD (Get Shit Done)** — spec-driven development with fresh context per phase.

## Key Constraints
- Videos max 20 minutes. Larger rejected at scrape.
- Supabase Pro required for file uploads >50MB.
- Remotion needs Chromium in worker container (Dockerfile).
- YouTube Captions API requires OAuth — use yt-dlp instead.
- HeyGen audio: Upload Asset API (audio_asset_id), never public URLs.
- All DB tables prefixed `re_`, all storage paths prefixed `remix-engine/`.
- All business logic imports config from RemixEngineProvider, never process.env directly.

## Spec Export
Full architecture exportable as JSON at `/api/remix-engine/spec.json` — any AI can read the complete module contract, database schema, API surface, and integration requirements.

## Full Technical Spec
See `REMIXENGINE_SPEC_v3.md` for complete architecture, database schema, API code, and deployment config.
