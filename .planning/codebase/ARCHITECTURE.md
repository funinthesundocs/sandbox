# Architecture

**Analysis Date:** 2026-02-26

## Pattern Overview

**Overall:** Dual-Mode Next.js Application + Separate Worker Process

RemixEngine is a **hybrid architecture** that runs simultaneously as:
1. A **Next.js web application** (App Router) with API routes
2. A **standalone Node.js worker process** that executes long-running jobs via a message queue (BullMQ + Redis)

The entire codebase is unified under a single **RemixEngineProvider** context boundary layer that allows the same business logic to run in two deployment modes:
- **Standalone Mode**: Full app with own auth, layout, routing, environment config
- **Module Mode**: Embedded into a parent dashboard — auth/layout/routing/config provided by parent

**Key Characteristics:**
- **Config injection pattern**: Business logic NEVER reads `process.env` directly. All configuration flows through `RemixEngineProvider` context.
- **Strict namespace prefixing**: Database tables (`re_`), API routes (`/api/remix-engine/`), storage paths (`remix-engine/`), CSS variables (`--re-`) are all namespaced to prevent collisions.
- **Async job queue architecture**: Video processing (scraping, rendering) happens offline. Web service enqueues jobs; worker service dequeues and processes.
- **Server-side integration**: All external API calls (Gemini, HeyGen, ElevenLabs, etc.) happen server-side. API keys never exposed to client.
- **Supabase-first persistence**: Postgres database + Storage for all user-generated content.

## Layers

**Frontend Layer:**
- Purpose: User-facing React components, pages, and client hooks
- Location: `src/app/`, `src/components/` (planned)
- Contains: Next.js App Router page components, layouts, client-side hooks (`useRemixEngine()`)
- Depends on: `RemixEngineProvider` context, Supabase client (`src/lib/supabase/client.ts`)
- Used by: End users via browser

**Configuration & Context Layer:**
- Purpose: Centralized config management and dependency injection
- Location: `src/lib/remix-engine/`
- Contains:
  - `config.ts`: `RemixEngineConfig` type definition, `createStandaloneConfig()` (reads env vars), `getServerConfig()` (server singleton), `setServerConfig()` (for module mode injection)
  - `provider.tsx`: `RemixEngineProvider` React context component (wraps app in standalone mode)
  - `hooks.ts`: Client-side hooks (`useRemixEngine()`) + helper functions (`storagePath()`, `table()`) for prefixing
- Depends on: Environment variables (standalone only)
- Used by: All business logic layers; Frontend layer

**Database Layer:**
- Purpose: Postgres persistence via Supabase
- Location: Supabase (external), migrations stored in `supabase/migrations/` (planned)
- Contains: All `re_`-prefixed tables (`re_projects`, `re_videos`, `re_jobs`, `re_api_usage`, etc.)
- Row-level security (RLS) policies for multi-tenant access control
- Real-time subscriptions for live job progress
- Depends on: Supabase SDK clients
- Used by: API routes, Worker handlers

**Supabase Client Layer:**
- Purpose: Database and storage access with auth
- Location: `src/lib/supabase/`
- Contains:
  - `client.ts`: Browser client for SSR (Supabase SSR package, anon key, cookie session)
  - `server.ts`: Server-side client (Supabase SSR package, anon key, server cookies)
  - `admin.ts` (planned): Service role client (bypasses RLS) for worker-only operations
  - `types.ts`: Auto-generated TypeScript types from Supabase schema
- Depends on: Supabase environment variables, `next/headers` for cookie management
- Used by: API routes, Server components, Worker handlers

**API Route Layer (Web Service):**
- Purpose: HTTP endpoints that coordinate pipeline jobs and serve UI data
- Location: `src/app/api/remix-engine/`
- Contains:
  - Job enqueue routes: `POST /api/remix-engine/scrape`, `POST /api/remix-engine/remix/title`, `POST /api/remix-engine/audio/generate`, etc.
  - Status routes: `GET /api/remix-engine/scrape/status/[jobId]`, `GET /api/remix-engine/avatar/status/[jobId]`, etc.
  - Data routes: `GET /api/remix-engine/projects`, `POST /api/remix-engine/projects`, etc.
  - Admin routes: `GET /api/remix-engine/admin/users`, `PUT /api/remix-engine/admin/settings`, etc.
  - Webhook routes: `POST /api/remix-engine/webhooks/heygen`, `POST /api/remix-engine/webhooks/runway`, etc.
  - Health/meta: `GET /api/remix-engine/health`, `GET /api/remix-engine/spec.json`
- Validation: Zod schemas for request/response contracts (defined in `src/lib/validation/` planned)
- Depends on: BullMQ queues (`src/lib/queue/queues.ts`), Supabase client, external API clients
- Used by: Frontend, external webhooks, administrative tools

**Job Queue Layer:**
- Purpose: Coordinate asynchronous video processing across multiple workers
- Location: `src/lib/queue/`
- Contains:
  - `connection.ts`: Redis connection singleton (via `getServerConfig()`)
  - `queues.ts`: BullMQ queue definitions for scrape, remix, generate, render jobs
- Depends on: Redis (via Supabase Service Role or local instance)
- Used by: API routes (enqueue jobs), Worker handlers (process jobs)

**Worker Layer (Standalone Process):**
- Purpose: Execute long-running video processing tasks offline
- Location: `src/worker/`
- Contains:
  - `index.ts`: Worker entry point — initializes BullMQ consumers, sets up error handlers
  - `handlers/`: Individual job handlers
    - `scrape-handler.ts`: Download video + metadata + transcript via yt-dlp + YouTube Data API
    - `remix-handler.ts`: Run title/thumbnail/script remixes (may be split into separate handlers per agent)
    - `voice-handler.ts`: Generate audio via ElevenLabs
    - `avatar-handler.ts`: Generate avatar video via HeyGen
    - `broll-handler.ts`: Generate B-roll via Runway ML / Kling
    - `render-handler.ts`: Final video assembly via FFmpeg + Remotion
- Configuration:
  - Uses `tsconfig.worker.json` — relative imports only (no Next.js `@/` aliases)
  - Uses `supabaseAdmin` (service role key) for unrestricted database access
  - Runs as **completely separate Node.js process**, NOT inside Next.js
  - Each handler must call `cleanTempDir(videoId)` in a `finally` block
  - Render queue has `concurrency: 1` (CPU-intensive)
- Depends on: Redis connection, Supabase admin client, external APIs
- Used by: Job queue — autonomous, event-driven

**External Integration Layer:**
- Purpose: Encapsulate API calls to third-party services
- Location: `src/lib/` (organized by service: `gemini.ts`, `elevenlabs.ts`, `heygen.ts`, `fal.ts`, `runway.ts`, etc.) — planned
- Contains: API client wrappers, request/response type definitions, error handling
- Depends on: HTTP clients (fetch), API keys from `RemixEngineConfig`
- Used by: Worker handlers, API routes

**Storage Layer:**
- Purpose: Manage file uploads/downloads to Supabase Storage and temp disk
- Location: Storage helpers in `src/lib/storage/` (planned), temp dirs in `/tmp`
- Contains:
  - Upload utilities (handles large files via TUS resumable protocol for >50MB)
  - Download utilities with Range header support (for streaming)
  - Signed URL generation (1-hour TTL for frontend playback)
  - Temp directory cleanup utilities
- Depends on: Supabase Storage client, Node.js `fs` module
- Used by: Worker handlers, API routes

## Data Flow

**Main Pipeline Flow:**

1. **Scrape Initiation** → User submits YouTube URL via frontend
2. **API Route** → `/api/remix-engine/scrape` POST route receives request
3. **Validation** → Zod schema validates URL format
4. **Job Enqueue** → API route calls `scrapeQueue.add({ videoId, url, ... })`
5. **Queue Storage** → BullMQ stores job in Redis
6. **Worker Dequeue** → Worker process picks up job from `scrapeQueue`
7. **Scrape Handler** → Downloads video (yt-dlp), metadata (YouTube API), transcript (yt-dlp subtitles)
8. **Storage** → Uploads MP4, thumbnail, metadata to Supabase Storage (`remix-engine/videos/{projectId}/{videoId}/original.mp4`)
9. **Database** → Creates `re_videos` record with metadata, marks as "scrape_complete"
10. **Cleanup** → Handler calls `cleanTempDir(videoId)` to remove `/tmp` files
11. **Status Update** → Frontend polls `GET /api/remix-engine/scrape/status/{jobId}` (or uses Supabase Realtime)
12. **UI Refresh** → User sees "Scrape Complete" and moves to remix step

**Remix Title Flow:**

1. **Remix Request** → User reviews scraped title, clicks "Generate Title Variations"
2. **API Route** → `/api/remix-engine/remix/title` POST receives original title + description
3. **Gemini Integration** → API route (or worker) calls Gemini API with structured prompt
4. **Response** → Gemini returns JSON with 8 title variations + reasoning
5. **Database** → Variations stored in `re_remixed_titles` table (or embedded in `re_videos.remix_data` JSONB)
6. **Frontend** → User selects preferred title, confirmed variation saved back

**Avatar Video Generation Flow:**

1. **Avatar Request** → User selects voice, avatar ID, approves script, clicks "Generate Avatar Video"
2. **Audio Generation** → Worker processes audio via ElevenLabs per scene
3. **Audio Upload** → Scene MP3 files stored in Supabase Storage
4. **Audio Asset Upload** → Worker downloads audio from Supabase, uploads to HeyGen Upload Asset API → receives `audio_asset_id`
5. **Avatar Generation** → Worker calls HeyGen video generation API with `audio_asset_id` + avatar config
6. **Async Handling** → HeyGen returns job ID; worker stores in `re_jobs` table
7. **Webhook Callback** → On completion, HeyGen POSTs to `/api/remix-engine/webhooks/heygen`
8. **Webhook Handler** → Updates `re_jobs` status, triggers next stage
9. **Frontend** → Realtime subscription on `re_jobs` table shows progress
10. **Final Output** → Worker pulls completed avatar video from HeyGen, stores locally/in Supabase

**State Management:**

- **Job State**: Stored in Redis (BullMQ) + `re_jobs` table for persistence
- **Video State**: Column `status` in `re_videos` tracks: `scraping` → `scrape_complete` → `remixing` → `remix_complete` → `awaiting_approval` → `generating` → `generated` → `rendering` → `rendered` → `published`
- **User State**: JWT tokens from Supabase Auth, session stored in cookies (server-side)
- **Realtime Updates**: Supabase Realtime subscriptions on `re_jobs`, `re_videos` for live progress

## Key Abstractions

**RemixEngineConfig:**
- Purpose: Encapsulates all deployment-time configuration (URLs, API keys, mode)
- Examples: `src/lib/remix-engine/config.ts`
- Pattern: Singleton on server (`getServerConfig()`), context provider on client (`useRemixEngine()`)
- Usage: Every service that needs config imports `getServerConfig()` (server) or calls hook (client)

**RemixEngineProvider:**
- Purpose: React context boundary for dependency injection
- Examples: `src/lib/remix-engine/provider.tsx`
- Pattern: Wraps app in standalone mode (sets `mode: 'standalone'`), optional in module mode (parent injects config)
- Usage: Layout components check `config.mode` to conditionally render shell UI

**Helper Functions (in `src/lib/remix-engine/hooks.ts`):**
- `storagePath(category, projectId, videoId, filename)` → `${config.storagePrefix}/videos/{projectId}/{videoId}/{filename}`
- `table(tableName)` → `${config.tablePrefix}{tableName}` (e.g., `table('videos')` → `re_videos`)
- These ensure all code uses consistent prefixing without hardcoding

**BullMQ Queue Abstraction:**
- Purpose: Decouple job enqueue (web service) from job processing (worker)
- Examples: `src/lib/queue/queues.ts` defines 4 queues: scrape, remix, generate, render
- Pattern: Typed job data via TypeScript generics, progress events, completion callbacks
- Usage: API routes call `queue.add(jobData)`, handlers process via `queue.process(handler)`

**Zod Validation Schemas:**
- Purpose: Runtime type checking for API requests/responses + database records
- Examples: `src/lib/validation/` (planned) with schemas like `ScrapeJobSchema`, `RemixedScriptSchema`
- Pattern: Define at request/response boundary (API routes), refine in handlers
- Usage: `const data = ScrapeJobSchema.parse(request.body)` before processing

**Supabase Client Wrapper:**
- Purpose: Abstracts Supabase SDK initialization with config
- Examples: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
- Pattern: Singleton initialization, lazy export for use in components/routes
- Usage: `const supabase = await createClient()` in server actions; `const supabase = createClient()` in browser

**Temp Directory Manager:**
- Purpose: Centralize cleanup of video processing intermediate files
- Examples: `cleanTempDir(videoId)` (planned in `src/lib/storage/temp.ts`)
- Pattern: Store all `/tmp` work in `{videoId}` subdirectory, call cleanup in handler `finally` block
- Usage: Every worker handler guarantees cleanup even on failure

## Entry Points

**Web Service (Next.js):**
- Location: `src/app/layout.tsx` (root layout)
- Triggers: `npm run dev` (dev server on port 3000), `npm run build && npm run start` (production)
- Responsibilities:
  - Render React app structure
  - Provide RemixEngineProvider context to all pages/components
  - Handle authentication middleware (Supabase session from cookies)
  - Serve API routes

**Worker Service (Node.js):**
- Location: `src/worker/index.ts`
- Triggers: Separate process via `npm run worker:dev` (or in production, Railway service runs `node dist/worker/index.js`)
- Responsibilities:
  - Connect to Redis queue
  - Set up BullMQ consumers for each queue type
  - Process jobs with corresponding handlers
  - Call cleanup utilities and handle failures
  - Report progress back to `re_jobs` table + Realtime subscriptions

**Root Layout (Conditional Shell):**
- Location: `src/app/layout.tsx` (or `src/app/(dashboard)/layout.tsx` for grouped routes)
- Conditional Logic: Checks `config.mode === 'standalone'` to decide:
  - **Standalone**: Render Sidebar + Header + Theme Provider
  - **Module**: Return `<>{children}</>` (parent provides shell)

**API Route Entry Points (All in `src/app/api/remix-engine/`):**
- `POST /api/remix-engine/scrape` — enqueue scrape job
- `GET /api/remix-engine/scrape/status/[jobId]` — poll scrape progress
- `POST /api/remix-engine/remix/title` — generate title variations
- `POST /api/remix-engine/audio/generate` — generate voiceover audio
- `POST /api/remix-engine/avatar/generate` — enqueue avatar video generation
- `GET /api/remix-engine/avatar/status/[jobId]` — poll avatar generation status
- `POST /api/remix-engine/webhooks/heygen` — handle HeyGen completion callbacks
- `GET /api/remix-engine/projects` — list user's projects
- `POST /api/remix-engine/projects` — create new project
- `GET /api/remix-engine/admin/users` — list all users (admin only)
- `GET /api/remix-engine/spec.json` — export full module contract

## Error Handling

**Strategy:** Fail-safe with graceful degradation

**Patterns:**

1. **Request Validation Error:**
   - Zod schema parse failure → Return 400 Bad Request with validation errors
   - Example: `POST /api/remix-engine/scrape` with invalid URL format

2. **Authentication/Authorization Error:**
   - Missing or invalid JWT → Return 401 Unauthorized
   - User lacks permission (role check) → Return 403 Forbidden
   - Example: Non-admin user calls `GET /api/remix-engine/admin/users`

3. **External API Errors (Gemini, HeyGen, ElevenLabs, etc.):**
   - Rate limit hit → Exponential backoff with jitter, max 3 retries
   - API server error (5xx) → Retry with exponential backoff, eventually fail job
   - Network timeout → Retry, set reasonable timeout ceiling (30s per request)
   - Invalid API key → Immediate fail, log security alert
   - Pattern: Wrap in try-catch, log with structured context (jobId, service, attempt count)

4. **Job Processing Error (Worker):**
   - Handler throws exception → BullMQ moves job to "failed" queue
   - Handler logs error with full stack + context (jobId, videoId, step)
   - Job can be manually retried or user notified in UI
   - Always call `cleanTempDir(videoId)` in `finally` block regardless of success/failure

5. **Database Errors:**
   - RLS policy violation → Return 403 (user not authorized to access record)
   - Unique constraint violation → Return 409 Conflict with descriptive message
   - Connection failure → Retry with circuit breaker pattern; if persistent, alert ops

6. **Storage Errors (Supabase Storage):**
   - File upload >50MB on free tier → Reject with guidance to upgrade or compress
   - Network failure during upload → Retry with TUS resumable protocol
   - Invalid bucket path → Return 400 + log as bug

7. **Realtime Subscription Errors:**
   - Connection drops → Auto-reconnect with exponential backoff
   - RLS policy blocks read → Frontend gracefully degrades, doesn't crash

## Cross-Cutting Concerns

**Logging:** Structured JSON logging (planned: `src/lib/logging/logger.ts`)
- Every job gets unique `jobId` for tracing
- Log format: `{ timestamp, level, jobId, videoId, service, message, stack, context }`
- Streams to `stdout` for Railway log aggregation

**Validation:** Zod schemas at API boundaries + selective backend validation
- All API request bodies validated before processing
- Database writes validated before insert/update
- Business logic assumes valid data (defense in depth)

**Authentication:** Supabase JWT + cookie-based session
- Standalone mode: Supabase Auth login/signup with email/password
- Module mode: JWT provided by parent app in RemixEngineConfig
- Middleware (next-auth or custom) validates JWT on every request
- RLS policies on all tables enforce user isolation

**Authorization:** Role-based access control (Admin/Editor/Viewer)
- Stored in `re_users.role` column
- Checked in API routes before processing (`if (user.role !== 'admin') return 403`)
- RLS policies on some tables (e.g., `re_api_usage` readable by admin only)

**Cost Estimation:** JSONB `pricing` column in `re_projects`
- Incremental cost tracking as pipeline progresses
- Example: `{ scrape: 0, remix: 0.05, audio_seconds: 120, avatar_minutes: 1.5, broll_minutes: 2, render: 0.50, total: 4.10 }`
- Updated in worker after each stage completes
- Users see real-time cost before approving generation

**Temp File Cleanup:** Critical for worker stability
- Every handler stores work in `/tmp/{videoId}/`
- Handler calls `cleanTempDir(videoId)` in `finally` block
- Prevents disk exhaustion on long-running workers
- If cleanup fails, log error but don't block job completion

---

*Architecture analysis: 2026-02-26*
