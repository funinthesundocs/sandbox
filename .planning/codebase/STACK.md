# Technology Stack

**Analysis Date:** 2026-02-26

## Languages

**Primary:**
- TypeScript 5+ - Full codebase, strict mode enabled
- JavaScript (Node.js) - Worker scripts and build tools

**Secondary:**
- TSX/JSX - React components with Next.js App Router

## Runtime

**Environment:**
- Node.js 18+ (inferred from modern async/await patterns)

**Package Manager:**
- npm (lockfile present: `package-lock.json`)

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack framework with App Router, API routes, server components
- React 19.2.3 - UI library, hooks-based components
- React DOM 19.2.3 - DOM rendering

**Authentication & Database:**
- Supabase JS SDK 2.97.0 - PostgreSQL client, auth, storage, realtime
- Supabase SSR 0.8.0 - Server-side rendering support, cookie-based sessions

**Styling:**
- Tailwind CSS 4 - Utility-first CSS framework
- PostCSS 4 (via @tailwindcss/postcss) - CSS transformation plugin

**Development & Linting:**
- TypeScript 5 - Type checking, compilation
- ESLint 9 - Code linting with Next.js rules (`eslint-config-next`)
- ESLint Config Next 16.1.6 - Next.js specific linting rules

**Type Definitions:**
- @types/node 20+ - Node.js type definitions
- @types/react 19+ - React type definitions
- @types/react-dom 19+ - React DOM type definitions

## Key Dependencies

**Critical (Already Installed):**
- `@supabase/ssr` ^0.8.0 - Server-side session management with cookies
- `@supabase/supabase-js` ^2.97.0 - Official Supabase JavaScript client

**Planned/Required (Per CLAUDE.md):**
- `bullmq` - Job queue for scrape, remix, generate, render pipelines
- `redis` - Message broker for job queue
- `@google/generative-ai` - Google Gemini API client
- `@fal-ai/serverless-client` - fal.ai image generation client
- `yt-dlp` - YouTube video/transcript downloader (Node.js wrapper)
- `ffmpeg` - Video encoding and processing
- `remotion` - Programmatic video rendering
- `zod` - Schema validation for API request/response data
- `nanoid` - Unique ID generation
- Potential: `kling` (optional video generation fallback)

## Configuration

**Environment:**
Environment variables flow through `createStandaloneConfig()` in `src/lib/remix-engine/config.ts`. Business logic NEVER reads `process.env` directly.

**Required Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
YOUTUBE_DATA_API_KEY=AIza...
GOOGLE_GEMINI_API_KEY=AIza...
FAL_KEY=fal_...
ELEVENLABS_API_KEY=sk_...
HEYGEN_API_KEY=...
RUNWAY_API_KEY=...
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Optional:**
- `KLING_API_KEY` - Fallback video generation (optional)
- `WEBHOOK_BASE_URL` - Webhook ingestion endpoint (defaults to NEXT_PUBLIC_APP_URL)

**Build Configuration:**
- `next.config.ts` - Next.js configuration (minimal, empty defaults)
- `tsconfig.json` - TypeScript compiler options with path alias `@/*` → `./src/*`
- `postcss.config.mjs` - PostCSS with Tailwind CSS plugin
- `eslint.config.mjs` - ESLint with Next.js Core Web Vitals and TypeScript rules
- Worker: `tsconfig.worker.json` - Separate TypeScript config for worker process (relative imports, no aliases)

## Build & Development

**Dev Commands:**
- `npm run dev` - Next.js dev server on port 3000
- `npm run worker:dev` - Separate BullMQ worker process (must run alongside dev)
- `redis-server` - Redis instance (if not running as service)

**Verification:**
- `npx tsc --noEmit` - Type check (zero errors required)
- `npm run build` - Production build
- `npm run lint` - ESLint

**Database:**
- `npx supabase db push` - Apply migrations to remote
- `npx supabase gen types typescript --local > src/lib/supabase/types.ts` - Regenerate types after schema changes

**Worker Build:**
- `npx tsc -p tsconfig.worker.json` - Compile worker separately (relative imports, no Next.js aliases)

## Platform Requirements

**Development:**
- Node.js 18+
- Redis server (local or service)
- Supabase account and project
- FFmpeg installed (for local video processing)
- yt-dlp installed (for YouTube transcript/video download)
- Chromium (for Remotion video rendering in worker)

**Production/Deployment:**
- Railway or similar Node.js hosting
- Railway Redis addon or external Redis
- Supabase project (hosted)
- Docker container (to bundle FFmpeg, yt-dlp, Chromium)

## Client Initialization

**Browser (`src/lib/supabase/client.ts`):**
Uses `createBrowserClient()` from `@supabase/ssr` with anonymous key and cookie session management.

**Server (`src/lib/supabase/server.ts`):**
Uses `createServerClient()` from `@supabase/ssr` with async cookie handling for SSR.

**Admin (`src/lib/supabase/admin.ts` - planned):**
Uses service role key (bypasses RLS) — worker process only.

---

*Stack analysis: 2026-02-26*
