# Codebase Structure

**Analysis Date:** 2026-02-26

## Directory Layout

```
remix-engine/
├── .planning/                          # GSD planning documents (generated)
│   └── codebase/
│       ├── ARCHITECTURE.md
│       ├── STRUCTURE.md
│       ├── CONVENTIONS.md
│       ├── TESTING.md
│       ├── STACK.md
│       ├── INTEGRATIONS.md
│       └── CONCERNS.md
├── .claude/                            # Claude Code metadata (not committed)
├── .git/                               # Version control
├── .next/                              # Next.js build output (not committed)
├── .env.example                        # Template for environment variables
├── .env.local                          # Local dev environment (not committed)
├── .gitignore
├── src/
│   ├── app/                            # Next.js App Router pages and layouts
│   │   ├── api/
│   │   │   └── remix-engine/           # ALL API routes — namespace prefix
│   │   │       ├── scrape/
│   │   │       │   ├── route.ts        # POST /api/remix-engine/scrape
│   │   │       │   ├── batch/
│   │   │       │   │   └── route.ts    # POST /api/remix-engine/scrape/batch
│   │   │       │   └── status/
│   │   │       │       └── [jobId]/
│   │   │       │           └── route.ts # GET /api/remix-engine/scrape/status/:jobId
│   │   │       ├── remix/              # Title, thumbnail, script remix routes
│   │   │       │   ├── title/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── thumbnail/
│   │   │       │   │   └── route.ts
│   │   │       │   └── script/
│   │   │       │       └── route.ts
│   │   │       ├── audio/              # Voiceover generation routes
│   │   │       │   ├── generate/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── voices/
│   │   │       │   │   └── route.ts
│   │   │       │   └── preview/
│   │   │       │       └── route.ts
│   │   │       ├── avatar/             # Avatar video generation routes
│   │   │       │   ├── generate/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── avatars/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── status/
│   │   │       │   │   └── [jobId]/
│   │   │       │   │       └── route.ts
│   │   │       │   └── cancel/
│   │   │       │       └── route.ts
│   │   │       ├── broll/              # B-roll generation routes
│   │   │       │   ├── generate/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── status/
│   │   │       │   │   └── [jobId]/
│   │   │       │   │       └── route.ts
│   │   │       │   └── cancel/
│   │   │       │       └── route.ts
│   │   │       ├── render/             # Final assembly routes
│   │   │       │   ├── route.ts
│   │   │       │   ├── status/
│   │   │       │   │   └── [jobId]/
│   │   │       │   │       └── route.ts
│   │   │       │   └── cancel/
│   │   │       │       └── route.ts
│   │   │       ├── webhooks/           # External service callbacks
│   │   │       │   ├── heygen/
│   │   │       │   │   └── route.ts    # HeyGen completion webhook
│   │   │       │   └── runway/
│   │   │       │       └── route.ts    # Runway ML completion webhook
│   │   │       ├── projects/           # Project CRUD routes
│   │   │       │   ├── route.ts        # GET (list), POST (create)
│   │   │       │   └── [id]/
│   │   │       │       └── route.ts    # GET, PATCH, DELETE individual project
│   │   │       ├── admin/              # Admin-only routes
│   │   │       │   ├── users/
│   │   │       │   │   ├── route.ts    # GET users, POST invite
│   │   │       │   │   └── [id]/
│   │   │       │   │       └── route.ts # PATCH, DELETE user
│   │   │       │   ├── usage/
│   │   │       │   │   └── route.ts    # GET API usage stats
│   │   │       │   └── settings/
│   │   │       │       └── route.ts    # GET, PUT system settings
│   │   │       ├── health/
│   │   │       │   └── route.ts        # GET /api/remix-engine/health (healthcheck)
│   │   │       └── spec.json/
│   │   │           └── route.ts        # GET full module contract as JSON
│   │   ├── (dashboard)/                # Route group for shell + sidebar layout
│   │   │   ├── layout.tsx              # Dashboard layout (conditionally renders shell based on mode)
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx            # List projects
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx        # Single project detail + edit
│   │   │   ├── admin/                  # Admin section (only in standalone mode)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── users/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx
│   │   │   └── batch/                  # Batch processing (only in standalone mode)
│   │   │       └── page.tsx
│   │   ├── (auth)/                     # Route group for auth pages (only in standalone mode)
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── layout.tsx                  # Root layout (wraps with RemixEngineProvider)
│   │   ├── page.tsx                    # Root page / redirect (guides to /projects or login)
│   │   ├── globals.css                 # Global Tailwind + CSS variables (--re-*)
│   │   └── favicon.ico
│   ├── components/                     # Reusable React components
│   │   ├── ui/                         # shadcn/ui components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── layout/                     # Shell components (sidebar, header)
│   │   │   ├── Sidebar.tsx             # Left sidebar (only render in standalone mode)
│   │   │   ├── Header.tsx              # Top header (only render in standalone mode)
│   │   │   └── ThemeProvider.tsx       # Dark/light theme toggle
│   │   ├── remix-engine/               # Domain-specific components
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ScraperForm.tsx
│   │   │   ├── TitleVariations.tsx
│   │   │   ├── ThumbnailPreview.tsx
│   │   │   ├── ScriptEditor.tsx
│   │   │   ├── AudioPreview.tsx
│   │   │   ├── AvatarSelector.tsx
│   │   │   ├── JobProgress.tsx         # Real-time job status indicator
│   │   │   ├── PipelineTimeline.tsx    # Visual pipeline state machine
│   │   │   └── CostEstimate.tsx        # Cost breakdown display
│   │   └── common/                     # Generic components
│   │       ├── Loading.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── Toast.tsx
│   │       └── Modal.tsx
│   ├── lib/                            # Utility libraries and business logic
│   │   ├── remix-engine/               # Core config and context boundary
│   │   │   ├── config.ts               # RemixEngineConfig type, createStandaloneConfig(), getServerConfig()
│   │   │   ├── provider.tsx            # RemixEngineProvider React context
│   │   │   └── hooks.ts                # useRemixEngine(), storagePath(), table() helpers
│   │   ├── supabase/                   # Database and auth clients
│   │   │   ├── client.ts               # Browser client (anon key, cookie session)
│   │   │   ├── server.ts               # Server-side client (SSR, cookie session)
│   │   │   ├── admin.ts                # Service role client (worker only) [PLANNED]
│   │   │   └── types.ts                # Auto-generated types from schema
│   │   ├── queue/                      # Job queue setup [PLANNED]
│   │   │   ├── connection.ts           # Redis connection singleton
│   │   │   └── queues.ts               # BullMQ queue definitions
│   │   ├── validation/                 # Zod schemas [PLANNED]
│   │   │   ├── scrape.ts
│   │   │   ├── remix.ts
│   │   │   ├── audio.ts
│   │   │   ├── avatar.ts
│   │   │   └── common.ts
│   │   ├── scraper/                    # YouTube scraping utilities [PLANNED]
│   │   │   ├── youtube-dl.ts           # yt-dlp wrapper
│   │   │   ├── metadata.ts             # YouTube Data API v3 client
│   │   │   ├── transcript.ts           # VTT subtitle extraction
│   │   │   ├── thumbnail.ts            # Thumbnail download/resize
│   │   │   ├── batch.ts                # Batch channel scraping
│   │   │   ├── vtt-parser.ts           # Parse .vtt to plain text
│   │   │   └── types.ts
│   │   ├── remix/                      # Remix generation services [PLANNED]
│   │   │   ├── title-remixer.ts        # Gemini title generation
│   │   │   ├── title-prompts.ts
│   │   │   ├── thumbnail-remixer.ts    # fal.ai thumbnail generation
│   │   │   ├── thumbnail-analyzer.ts   # Gemini Vision analysis
│   │   │   ├── thumbnail-prompts.ts
│   │   │   ├── script-remixer.ts       # Gemini script rewriting
│   │   │   ├── script-prompts.ts
│   │   │   ├── scene-splitter.ts
│   │   │   └── types.ts
│   │   ├── audio/                      # Voiceover generation [PLANNED]
│   │   │   ├── elevenlabs.ts           # 11Labs API client
│   │   │   ├── voice-config.ts
│   │   │   ├── audio-concat.ts         # FFmpeg audio joining
│   │   │   └── types.ts
│   │   ├── video/                      # Video generation services [PLANNED]
│   │   │   ├── heygen.ts               # HeyGen API client
│   │   │   ├── heygen-poller.ts        # Async status polling
│   │   │   ├── avatar-config.ts
│   │   │   ├── runway.ts               # Runway ML B-roll generation
│   │   │   ├── kling.ts                # Kling (optional) B-roll alternative
│   │   │   ├── remotion.ts             # Remotion video composition + FFmpeg assembly
│   │   │   └── types.ts
│   │   ├── storage/                    # File upload/download utilities [PLANNED]
│   │   │   ├── signed-urls.ts          # Generate 1-hour signed URLs
│   │   │   ├── upload.ts               # Handle file uploads (TUS for >50MB)
│   │   │   ├── download.ts             # Stream files with Range header support
│   │   │   ├── temp.ts                 # Temp dir management + cleanup
│   │   │   └── paths.ts                # Path helpers (always use storagePath() helper)
│   │   ├── external-apis/              # Third-party API wrappers [PLANNED]
│   │   │   ├── gemini.ts               # Google Gemini client
│   │   │   ├── youtube-data-api.ts     # YouTube Data API v3 client
│   │   │   ├── fal-ai.ts               # fal.ai image generation client
│   │   │   └── types.ts
│   │   ├── logging/                    # Structured logging [PLANNED]
│   │   │   └── logger.ts               # JSON logger for Railway integration
│   │   ├── utils/                      # General utilities
│   │   │   ├── types.ts                # Common TypeScript types
│   │   │   └── constants.ts            # App constants (queue names, timeouts, etc.)
│   │   └── middleware.ts               # Next.js middleware for auth/redirect [PLANNED]
│   ├── middleware.ts                   # Next.js middleware (auth, redirects) [PLANNED]
│   └── worker/                         # Separate Node.js worker process [PLANNED]
│       ├── index.ts                    # Worker entry point, queue setup
│       ├── tsconfig.json               # Worker-specific config (relative imports only)
│       └── handlers/
│           ├── scrape-handler.ts       # Process scrape jobs
│           ├── remix-handler.ts        # Process remix jobs (or split per remix type)
│           ├── voice-handler.ts        # Process audio generation
│           ├── avatar-handler.ts       # Process avatar video generation
│           ├── broll-handler.ts        # Process B-roll generation
│           └── render-handler.ts       # Process final video assembly
├── public/                             # Static assets
│   ├── next.svg
│   ├── vercel.svg
│   ├── file.svg
│   ├── globe.svg
│   └── window.svg
├── design-system/                      # Generated by UI UX Pro Max [PLANNED]
│   ├── MASTER.md                       # Master design tokens (CSS variables)
│   ├── pages/
│   │   ├── projects.md
│   │   ├── admin.md
│   │   ├── batch.md
│   │   └── ...
│   └── tokens.css                      # Generated CSS variables file
├── supabase/                           # Supabase migrations and config [PLANNED]
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20260226_initial_schema.sql
│   │   ├── 20260226_rls_policies.sql
│   │   └── ...
│   └── seed.sql                        # Optional seed data
├── .eslintrc.mjs                       # ESLint config
├── .prettierrc                         # Prettier formatting config [PLANNED]
├── postcss.config.mjs                  # PostCSS config (Tailwind integration)
├── tailwind.config.ts                  # Tailwind CSS configuration
├── tsconfig.json                       # Main TypeScript config
├── tsconfig.worker.json                # Worker TypeScript config (relative imports)
├── next.config.ts                      # Next.js configuration
├── package.json                        # Dependencies and scripts
├── package-lock.json                   # Lock file
├── Dockerfile                          # Production container build [PLANNED]
├── docker-compose.yml                  # Local dev with Redis + Supabase [PLANNED]
├── .dockerignore
├── Railway.yaml                        # Railway deployment config [PLANNED]
├── CLAUDE.md                           # Project instructions for Claude Code
├── PROJECT.md                          # Project overview and architecture
├── REMIXENGINE_SPEC_v3.md              # Full technical specification (source of truth)
├── REQUIREMENTS.md                     # Functional requirements
├── ROADMAP.md                          # Development roadmap and phases
├── STATE.md                            # Current project state
├── README.md                           # Public project README
├── CHANGELOG.md                        # Release notes [PLANNED]
└── .gitignore                          # Git ignore rules
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router pages, layouts, and API routes
- Contains: All user-facing pages + backend API endpoints
- Key files: Root layout, auth pages, dashboard pages, all `/api/remix-engine/*` routes
- Pattern: Nested folder structure matches URL paths

**`src/app/api/remix-engine/`:**
- Purpose: ALL API routes for the RemixEngine module (namespace prefix `api/remix-engine/`)
- Contains: Job enqueue routes, status routes, webhooks, CRUD endpoints, admin routes
- Key files: `scrape/route.ts`, `remix/title/route.ts`, `avatar/generate/route.ts`, `webhooks/heygen/route.ts`
- Organization: Each major feature gets a subfolder with `route.ts` (+ optional nested routes for status, cancel, etc.)

**`src/app/(dashboard)/`:**
- Purpose: Dashboard shell layout (sidebar + header) — route group
- Contains: Main project pages, edit pages, batch processing
- Key files: `layout.tsx` (conditional shell rendering based on `config.mode`), `projects/page.tsx`, `admin/page.tsx`
- Conditional: Only renders sidebar/header in standalone mode

**`src/app/(auth)/`:**
- Purpose: Authentication pages (login, signup) — route group
- Contains: Login page, signup page, password reset (planned)
- Key files: `layout.tsx`, `login/page.tsx`, `signup/page.tsx`
- Conditional: Only renders in standalone mode

**`src/lib/remix-engine/`:**
- Purpose: Core config, context, and helper abstractions
- Contains: RemixEngineConfig type, RemixEngineProvider context, utility hooks
- Key files: `config.ts` (defines config shape, `createStandaloneConfig()`, `getServerConfig()`), `provider.tsx` (React context), `hooks.ts` (useRemixEngine, storagePath, table helpers)
- Usage: Every other lib and page imports from this directory

**`src/lib/supabase/`:**
- Purpose: Supabase client initialization and type definitions
- Contains: Browser client, server client, admin client (planned), auto-generated types
- Key files: `client.ts` (browser), `server.ts` (server SSR), `admin.ts` (service role, worker only), `types.ts` (generated)
- Pattern: Lazy singleton initialization, exported functions

**`src/lib/queue/`:**
- Purpose: Redis/BullMQ job queue coordination
- Contains: Redis connection, queue definitions for scrape/remix/generate/render
- Key files: `connection.ts`, `queues.ts`
- Usage: API routes call `queue.add()`, worker handlers call `queue.process()`

**`src/lib/validation/`:**
- Purpose: Zod runtime schema definitions for requests/responses/database
- Contains: Schemas for every major domain (scrape, remix, audio, avatar, render, etc.)
- Key files: Organized by domain (`scrape.ts`, `remix.ts`, `audio.ts`, etc.)
- Usage: API routes parse + validate requests, worker validates before processing

**`src/lib/scraper/`:**
- Purpose: YouTube video downloading and metadata extraction
- Contains: yt-dlp wrapper, YouTube Data API client, transcript extraction, VTT parser, batch processor
- Key files: `youtube-dl.ts`, `metadata.ts`, `transcript.ts`, `vtt-parser.ts`
- Usage: Called by scrape job handler in worker

**`src/lib/remix/`:**
- Purpose: Title, thumbnail, and script generation services
- Contains: Gemini integration for text, fal.ai for images, prompt templates, scene splitting
- Key files: `title-remixer.ts`, `thumbnail-remixer.ts`, `script-remixer.ts`
- Usage: Called by API routes and worker handlers

**`src/lib/audio/`:**
- Purpose: Voiceover generation via ElevenLabs
- Contains: 11Labs API client, voice selection, audio concatenation (FFmpeg)
- Key files: `elevenlabs.ts`, `audio-concat.ts`
- Usage: Called by audio generation job handler

**`src/lib/video/`:**
- Purpose: Avatar and B-roll video generation + final assembly
- Contains: HeyGen client, Runway/Kling integration, Remotion composition, FFmpeg assembly
- Key files: `heygen.ts`, `runway.ts`, `remotion.ts`
- Usage: Called by avatar, B-roll, and render job handlers

**`src/lib/storage/`:**
- Purpose: File upload/download utilities and temp directory management
- Contains: Signed URL generation, TUS resumable uploads, Range-header streaming, temp cleanup
- Key files: `signed-urls.ts`, `upload.ts`, `download.ts`, `temp.ts`
- Usage: Every handler that touches files imports cleanup, API routes use signed URLs

**`src/lib/logging/`:**
- Purpose: Structured JSON logging for observability
- Contains: Logger with job ID tracing, context injection
- Key files: `logger.ts`
- Usage: Every worker handler and API route logs events for debugging

**`src/components/ui/`:**
- Purpose: shadcn/ui component library (auto-generated)
- Contains: Unstyled, accessible UI primitives (Button, Input, Dialog, etc.)
- Key files: Generated on demand via `npx shadcn-ui add component-name`
- Usage: All other components import from here

**`src/components/layout/`:**
- Purpose: Shell UI (sidebar, header, theme)
- Contains: Sidebar navigation (standalone only), top header (standalone only), theme toggle
- Key files: `Sidebar.tsx`, `Header.tsx`, `ThemeProvider.tsx`
- Usage: Rendered by root layout + dashboard layout (conditionally based on mode)

**`src/components/remix-engine/`:**
- Purpose: Domain-specific components for RemixEngine features
- Contains: Project cards, scraper forms, title selector, thumbnail preview, script editor, audio preview, avatar selector, job progress, pipeline timeline
- Key files: One component per feature
- Usage: Pages import these to build specific features

**`src/worker/`:**
- Purpose: Standalone Node.js worker process (separate from Next.js)
- Contains: BullMQ queue consumer setup, individual job handlers
- Key files: `index.ts` (entry point), `handlers/scrape-handler.ts`, etc.
- Configuration: Uses `tsconfig.worker.json` (relative imports, no `@/` aliases)
- Execution: Run as separate process (`npm run worker:dev` or Railway service)

**`design-system/`:**
- Purpose: UI design tokens (generated by UI UX Pro Max at build time)
- Contains: Master token definitions, page-specific overrides, CSS variables
- Key files: `MASTER.md` (source of truth for all design), `pages/{page}.md` (page-specific overrides)
- Usage: Read before building any UI component; all styles use `--re-*` CSS variables

**`supabase/`:**
- Purpose: Database schema, migrations, and seed data
- Contains: SQL migration files, Supabase config, seed script
- Key files: Migration files ordered by date (e.g., `20260226_initial_schema.sql`)
- Execution: `npx supabase db push` applies to remote

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout — wraps entire app with RemixEngineProvider
- `src/app/page.tsx`: Root page — redirects to `/projects` or `/login`
- `src/worker/index.ts`: Worker entry point — sets up BullMQ consumers

**Configuration:**
- `src/lib/remix-engine/config.ts`: Defines RemixEngineConfig type, `createStandaloneConfig()`, `getServerConfig()`
- `CLAUDE.md`: Project instructions for Claude Code
- `REMIXENGINE_SPEC_v3.md`: Full technical specification (source of truth)
- `tsconfig.json`: Main TypeScript config (includes `@/*` path alias)
- `tsconfig.worker.json`: Worker config (relative imports only)
- `next.config.ts`: Next.js settings

**Core Logic:**
- `src/lib/remix-engine/hooks.ts`: `useRemixEngine()` client hook, `storagePath()`, `table()` helpers
- `src/lib/queue/queues.ts`: BullMQ queue definitions
- `src/lib/supabase/server.ts`: Server-side Supabase client
- `src/lib/supabase/client.ts`: Browser Supabase client

**Testing:**
- `src/**/*.test.ts`: Unit tests co-located with source (pattern: TBD)
- `src/**/*.integration.test.ts`: Integration tests (pattern: TBD)
- `jest.config.js`: Jest configuration (if added)

**Styling:**
- `src/app/globals.css`: Global styles + Tailwind imports + CSS variables
- `tailwind.config.ts`: Tailwind configuration
- Design tokens defined in `design-system/MASTER.md` (read before styling anything)

## Naming Conventions

**Files:**
- **Source files**: camelCase + extension (e.g., `youtube-dl.ts`, `elevenlabs.ts`, `vtt-parser.ts`)
- **React components**: PascalCase (e.g., `ProjectCard.tsx`, `ScriptEditor.tsx`, `JobProgress.tsx`)
- **Pages**: Lowercase or bracketed segments (e.g., `page.tsx`, `[id]/route.ts`)
- **API routes**: `route.ts` with path structure (e.g., `api/remix-engine/scrape/route.ts`)
- **Database migrations**: `YYYYMMDD_description.sql` (e.g., `20260226_initial_schema.sql`)

**Directories:**
- **Feature folders**: Lowercase plural (e.g., `components/`, `handlers/`, `queues/`)
- **Route groups**: Parenthesized (e.g., `(dashboard)/`, `(auth)/`)
- **API namespace**: `api/remix-engine/` prefix (matches naming rules in CLAUDE.md)

**Database:**
- **Tables**: `re_` prefix + snake_case (e.g., `re_projects`, `re_videos`, `re_api_usage`)
- **Columns**: snake_case (e.g., `created_at`, `user_id`, `job_status`)
- **Constraints**: Descriptive, prefixed (e.g., `re_videos_project_id_fk`, `re_jobs_status_check`)

**CSS:**
- **Variables**: `--re-` prefix + kebab-case (e.g., `--re-bg-primary`, `--re-accent-primary`, `--re-border-radius`)
- **Class names**: Tailwind classes + custom utilities as needed (no custom prefixes outside CSS variables)

**API & Routes:**
- **Endpoints**: `/api/remix-engine/{feature}/{action}/{param}` pattern
  - Examples:
    - `POST /api/remix-engine/scrape` (enqueue)
    - `GET /api/remix-engine/scrape/status/[jobId]` (poll)
    - `POST /api/remix-engine/avatar/generate` (enqueue)
    - `GET /api/remix-engine/admin/users` (list, admin only)
- **HTTP status codes**: 200 OK, 400 Bad Request (validation), 401 Unauthorized, 403 Forbidden (authz), 404 Not Found, 409 Conflict, 500 Server Error

**Functions & Variables:**
- **Utility functions**: camelCase (e.g., `cleanTempDir()`, `generateSignedUrl()`, `parseVTT()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_VIDEO_DURATION = 1200`, `QUEUE_NAMES`)
- **Types/Interfaces**: PascalCase (e.g., `RemixEngineConfig`, `ScrapedVideo`, `RemixedScript`)
- **Enums**: PascalCase, values UPPER_SNAKE_CASE (e.g., `enum JobStatus { PENDING, PROCESSING, COMPLETED }`)

## Where to Add New Code

**New API Endpoint (e.g., new remix service):**
1. Create folder: `src/app/api/remix-engine/{feature}/{action}/`
2. Add: `src/app/api/remix-engine/{feature}/{action}/route.ts` (with POST/GET handlers)
3. Create validation schema: `src/lib/validation/{feature}.ts`
4. Create business logic: `src/lib/{category}/{feature}.ts` (e.g., `src/lib/remix/new-remix.ts`)
5. If async, enqueue to queue: `src/lib/queue/queues.ts` add new queue
6. If worker process, add handler: `src/worker/handlers/new-handler.ts`

**New Frontend Feature (e.g., new page):**
1. Create page folder: `src/app/(dashboard)/{feature}/`
2. Add: `src/app/(dashboard)/{feature}/page.tsx`
3. Create components: `src/components/remix-engine/{FeatureName}.tsx`
4. Import context/config: `const config = useRemixEngine()` (client-side)
5. Add to navigation: Update `src/components/layout/Sidebar.tsx`

**New Component:**
1. Create file: `src/components/{category}/{ComponentName}.tsx`
2. If UI primitive (button, input, etc.): Place in `src/components/ui/`
3. If domain-specific: Place in `src/components/remix-engine/`
4. If layout shell: Place in `src/components/layout/`
5. Import design tokens: Read `design-system/MASTER.md` for CSS variable names
6. Use `--re-*` CSS variables for all colors, spacing, fonts (never hardcode hex)

**New Utility/Service:**
1. Create folder in `src/lib/`: `src/lib/{service-name}/`
2. Organize by responsibility: `{service}.ts`, `{service}-utils.ts`, `types.ts`
3. Export main function/class as default or named export
4. Use TypeScript strict mode, document complex functions with JSDoc

**New Worker Handler:**
1. Create file: `src/worker/handlers/{feature}-handler.ts`
2. Signature: `export async function handle{Feature}Job(job: Job) { ... }`
3. Always include try-finally: `try { /* work */ } finally { await cleanTempDir(videoId); }`
4. Register in `src/worker/index.ts`: `{feature}Queue.process(handle{Feature}Job)`
5. Use relative imports, no `@/` aliases (worker uses separate tsconfig)

**New Database Schema:**
1. Create migration: `supabase/migrations/YYYYMMDD_description.sql`
2. Follow naming: `re_` prefix for tables, snake_case for columns
3. Include RLS policies for multi-tenant isolation
4. After push: `npx supabase db push && npx supabase gen types typescript --local > src/lib/supabase/types.ts`
5. Commit generated `types.ts` to repo

## Special Directories

**`src/worker/`:**
- Purpose: Separate Node.js process for long-running jobs
- Generated: No (hand-written)
- Committed: Yes
- Configuration: Uses `tsconfig.worker.json` (strict relative imports, no `@/` aliases)
- Execution: Runs as separate service (not inside Next.js)
- Key constraint: Must use `supabaseAdmin` (service role), call `cleanTempDir()` in finally blocks

**`.planning/codebase/`:**
- Purpose: GSD analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: Yes (by Claude Code mapper)
- Committed: Yes
- Content: Read-only reference for other Claude instances

**`.next/`:**
- Purpose: Next.js build output and type cache
- Generated: Yes (during `npm run build` or `npm run dev`)
- Committed: No (in `.gitignore`)

**`design-system/`:**
- Purpose: UI design tokens (generated by UI UX Pro Max at build time)
- Generated: Yes (by UUPM tool at build)
- Committed: Yes (checked in for reference)
- Reading: Always read `design-system/MASTER.md` before building UI
- Usage: All colors/spacing/fonts defined as CSS variables prefixed `--re-`

**`supabase/migrations/`:**
- Purpose: Database schema migration files
- Generated: No (hand-written SQL)
- Committed: Yes
- Format: One file per migration, ordered by date
- Execution: `npx supabase db push` applies to remote Supabase

---

*Structure analysis: 2026-02-26*
