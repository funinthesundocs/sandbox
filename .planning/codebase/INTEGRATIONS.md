# External Integrations

**Analysis Date:** 2026-02-26

## APIs & External Services

**YouTube:**
- YouTube Data API v3 - Video metadata, channel search (API key auth only — NO OAuth required)
  - SDK/Client: Direct fetch calls via `@google-cloud/youtube`
  - Auth: `YOUTUBE_DATA_API_KEY` (set in `createStandaloneConfig()`)
  - Endpoints:
    - `GET /youtube/v3/videos` - Metadata (snippet, contentDetails, statistics)
    - `GET /youtube/v3/search` - Channel video search (5-10 most recent videos)
  - Implementation: `src/lib/scraper/metadata.ts` (planned)

**Google Gemini:**
- Google Generative AI - Title/script remixing, thumbnail analysis
  - SDK/Client: `@google/generative-ai`
  - Auth: `GOOGLE_GEMINI_API_KEY` (retrieved via `getServerConfig()`)
  - Model: `gemini-2.0-flash`
  - Use cases:
    - Title variation generation (5-10 options)
    - Script rewriting for remixed content
    - Thumbnail prompt generation
  - Implementation: `src/lib/video/remix.ts` (planned)

**fal.ai:**
- Nano Banana Pro / Flux Dev - Thumbnail image generation from text prompts
  - SDK/Client: `@fal-ai/serverless-client`
  - Auth: `FAL_KEY` (set via `fal.config({ credentials: ... })`)
  - Model: `fal-ai/flux/dev`
  - Input: text prompt, image size (1280x720), num_images
  - Output: Image URLs → downloaded and uploaded to Supabase
  - Implementation: `src/lib/video/thumbnail.ts` (planned)

**ElevenLabs:**
- ElevenLabs Text-to-Speech - Convert remixed scripts to voiceover audio
  - SDK/Client: Direct REST API via fetch
  - Auth: `ELEVENLABS_API_KEY` (header: `xi-api-key`)
  - Endpoint: `POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}`
  - Input: text, voice_id, model_id (`eleven_multilingual_v2`), output_format (`mp3_44100_128`)
  - Output: MP3 audio binary → saved to `/tmp` → uploaded to Supabase Storage
  - Implementation: `src/lib/video/voiceover.ts` (planned)

**HeyGen:**
- HeyGen Avatar Video Generation - AI avatar speaking voiceover
  - SDK/Client: Direct REST API via fetch
  - Auth: `HEYGEN_API_KEY` (header: `X-Api-Key`)
  - Endpoints:
    - `POST https://upload.heygen.com/v1/asset` - Upload audio asset (returns `asset_id`)
    - `POST https://api.heygen.com/v2/video/generate` - Generate avatar video
  - File Delivery: **Upload Asset API pattern** (no public URLs needed)
    - Audio downloaded from private Supabase → uploaded to HeyGen's storage → referenced by `audio_asset_id`
    - Supabase Storage stays 100% private
  - Webhooks: `POST /api/remix-engine/webhooks/heygen` (callback_url in generation request)
  - Implementation: `src/lib/video/heygen.ts` (planned)

**Runway ML:**
- Runway ML Image-to-Video - B-roll video clip generation from thumbnails
  - SDK/Client: Direct REST API via fetch
  - Auth: `RUNWAY_API_KEY` (header: `Authorization: Bearer ...`)
  - Endpoint: `POST https://api.runwayml.com/v1/image-to-video`
  - File Delivery: Supabase signed URL (10-minute expiry) — Runway fetches immediately
    - Alternative: API Proxy pattern at `POST /api/remix-engine/proxy/asset/[token]` (one-time-use, auto-expires)
  - Webhooks: `POST /api/remix-engine/webhooks/runway` (callback_url in generation request)
  - Implementation: `src/lib/video/broll.ts` (planned)

**Kling (Optional):**
- Kling Video Generation - Fallback/alternative to Runway ML
  - Auth: `KLING_API_KEY` (optional)
  - Status: Not yet integrated, reserved for future phases

## Data Storage

**Primary Database:**
- Supabase PostgreSQL
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser), `SUPABASE_SERVICE_ROLE_KEY` (worker)
  - Client: `@supabase/supabase-js` (browser) + `@supabase/ssr` (Next.js server)
  - Schema: All tables prefixed `re_` (re_videos, re_projects, re_jobs, re_scenes, etc.)
  - RLS: Row-level security enabled on all tables
  - Migrations: `npx supabase db push` (in `src/migrations/` - planned)
  - Type generation: `npx supabase gen types typescript --local > src/lib/supabase/types.ts`

**File Storage:**
- Supabase Storage (`remixengine-assets` bucket)
  - Bucket: Private (no public access)
  - Paths: Prefixed `remix-engine/videos/{projectId}/{videoId}/`
  - Contents: Original MP4, thumbnail images, audio MP3, remixed script
  - Access: Signed URLs (1-hour expiry for frontend playback, 10-minute for external APIs)
  - Client: `supabaseAdmin.storage` (worker) with service role key
  - Resumable upload: TUS protocol for files >50MB

**Types:**
- Auto-generated: `src/lib/supabase/types.ts` (do NOT commit — regenerate after schema changes)

## Job Queue & Message Broker

**Redis:**
- Connection: `REDIS_URL` (environment variable)
- Client: BullMQ (planned)
- Queues:
  - `scrape` - Download YouTube videos, transcripts, metadata
  - `remix` - Generate title/script variations, thumbnails
  - `generate` - Convert scripts to voiceover + avatar videos
  - `render` - Assemble final Remotion video (concurrency: 1 — CPU-intensive)
- Worker: Separate Node.js process (`src/worker/index.ts`) — NOT inside Next.js
- Handler Pattern: Job handlers in `src/worker/handlers/`
- Cleanup: Every handler calls `cleanTempDir(videoId)` in `finally` block

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Scope: User sign-up/login, JWT tokens
  - Session: Cookie-based (via `@supabase/ssr`)
  - Mode:
    - **Standalone**: Full auth flow (sign-up, sign-in, sign-out)
    - **Module**: Parent app provides user context (auth disabled in RemixEngine)
  - Implementation: `src/lib/remix-engine/provider.tsx` checks `config.auth` to enable/disable UI
  - Types: Auto-generated in `src/lib/supabase/types.ts`

## Monitoring & Observability

**Error Tracking:**
- Not yet integrated (planned for future phases)

**Logs:**
- Console-based logging via `logger` utility (planned in `src/lib/logger.ts`)
- Retry utility tracks failed attempts with backoff logging

## CI/CD & Deployment

**Hosting:**
- Railway (primary target)
  - Environment: Node.js runtime
  - Services: Web (Next.js), Worker (BullMQ), Redis addon
  - Config: `railway.toml` (planned)

**Docker:**
- Dockerfile required (planned)
  - Base: Node.js 18+
  - Dependencies: FFmpeg, yt-dlp, Chromium (for Remotion)
  - Multi-stage: Build Next.js, bundle worker, install system tools
  - Deployment: `railway up` or GitHub Actions integration

**CI Pipeline:**
- Not yet configured (planned)
  - Suggested: GitHub Actions
  - Steps: `npm run lint`, `npm run build`, type check, tests

## Environment Configuration

**Required Environment Variables:**

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (worker only) | `eyJ...` |
| `YOUTUBE_DATA_API_KEY` | YouTube Data API v3 key | `AIza...` |
| `GOOGLE_GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `FAL_KEY` | fal.ai API key | `fal_...` |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | `sk_...` |
| `HEYGEN_API_KEY` | HeyGen API key | (no prefix specified) |
| `RUNWAY_API_KEY` | Runway ML API key | (no prefix specified) |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `NEXT_PUBLIC_APP_URL` | App public URL | `http://localhost:3000` |

**Optional:**
| Variable | Purpose | Example |
|---|---|---|
| `KLING_API_KEY` | Kling video generation (fallback) | (no prefix specified) |
| `WEBHOOK_BASE_URL` | Webhook ingestion base | (defaults to `NEXT_PUBLIC_APP_URL`) |

**Secrets Location:**
- Development: `.env.local` (Never commit)
- Railway: Secret variables in project settings (via web UI or `railway env`)
- All secrets centralized via `createStandaloneConfig()` in `src/lib/remix-engine/config.ts`

## Webhooks & Callbacks

**Incoming Webhooks:**

| Service | Endpoint | Purpose |
|---|---|---|
| HeyGen | `POST /api/remix-engine/webhooks/heygen` | Avatar video generation completion |
| Runway ML | `POST /api/remix-engine/webhooks/runway` | B-roll video generation completion |

**Outgoing Webhooks:**
- HeyGen generation request includes `callback_url` parameter
- Runway generation request includes `webhook_url` parameter
- Job status updated in database upon webhook receipt (with idempotency checks)

## File Delivery Security Strategy

**Core Principle:** Supabase Storage stays 100% private. No public URLs.

| External API | Method | How It Works |
|---|---|---|
| **HeyGen** | Upload Asset API | Push audio file to HeyGen's storage. Reference by `audio_asset_id`. Zero public exposure. |
| **Runway ML** | Signed URL (10-min expiry) | Generate Supabase signed URL. Runway fetches once, URL auto-expires. |
| **fal.ai** | Direct prompt (no file) | Text-to-image. No file delivery needed. |
| **ElevenLabs** | Text input (no file) | Text-to-speech. We send text, receive audio. No file delivery. |
| **Gemini** | Base64 or text input | For image analysis: convert to base64 inline or send text prompt. No URL needed. |

**Implementation Patterns:**

- **HeyGen pattern** (`src/lib/video/heygen.ts`):
  1. Download audio from private Supabase to `/tmp`
  2. Upload to `https://upload.heygen.com/v1/asset` → receive `audio_asset_id`
  3. Generate video using `audio_asset_id` (not URL)
  4. Clean up `/tmp` file

- **Runway pattern** (`src/lib/video/broll.ts`):
  1. Generate Supabase signed URL: `createSignedUrl(path, 600)` (10-minute expiry)
  2. Pass URL to Runway API
  3. Runway fetches immediately, URL expires automatically

- **Proxy pattern** (optional maximum security):
  - Endpoint: `POST /api/remix-engine/proxy/asset/[token]`
  - One-time-use token, 5-minute TTL
  - Streams file from Supabase, self-destructs after first request
  - Returns URLs like `https://your-app.railway.app/api/remix-engine/proxy/asset/a8f3k2m...`

---

*Integration audit: 2026-02-26*
