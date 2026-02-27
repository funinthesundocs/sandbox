# Requirements

## V1 — MVP (This Build)

### Foundation [Phase 1]
- R1.1: Next.js 14+ App Router with TypeScript, Tailwind, shadcn/ui
- R1.2: Supabase project with all migrations — ALL tables prefixed `re_` (e.g., `re_videos`, `re_projects`)
- R1.3: RLS policies, storage bucket (`remix-engine/` prefix on all paths), Realtime enabled
- R1.4: Auth flow — Supabase email/password, invite-only signup, role-based middleware (standalone mode)
- R1.5: Dark mode dashboard layout with sidebar navigation (standalone mode shell)
- R1.6: BullMQ job queue with Redis connection
- R1.7: `RemixEngineProvider` context — the module boundary layer (see RM requirements below)
- R1.8: `RemixEngineConfig` type defining all injectable dependencies
- R1.9: UI UX Pro Max design system generated at build time via `--design-system` command
- R1.10: `.gitignore`, `.env.example`, Zod validation schemas file

### Scraping Pipeline [Phase 2]
- R2.1: yt-dlp wrapper — download MP4 from YouTube URL (max 20min, compress >200MB to 720p)
- R2.2: YouTube Data API v3 — fetch title, description, thumbnail, stats (API key only)
- R2.3: Transcript extraction via yt-dlp auto-subtitles (NOT Captions API — requires OAuth)
- R2.4: VTT parser — strip timestamps and duplicate lines into plain text
- R2.5: Upload all assets to Supabase Storage at `remix-engine/videos/{project_id}/{video_id}/`
- R2.6: Batch channel scraping — `search.list` with `channelId`, up to 10 most recent videos
- R2.7: Job progress reported via Supabase Realtime subscriptions on `re_jobs` table
- R2.8: `/tmp` cleanup in `finally` block after every scrape job (success or failure)
- R2.9: Reject private, age-restricted, and unavailable videos with clear error messages

### Remix Pipeline [Phase 3]
- R3.1: Gemini 2.0 Flash — 8 categorized title variations per video (JSON mode with Zod validation)
- R3.2: Gemini Vision analysis + fal.ai FLUX — 3 thumbnail variations at 1280x720
- R3.3: Gemini script rewriting with scene splitting (15-45s per scene, unique scene numbers enforced by DB constraint)
- R3.4: All remixed content stored in DB with `is_selected` boolean pattern
- R3.5: User can select, edit, regenerate any remix variation from UI
- R3.6: Pipeline pauses after remix — user MUST approve selections before generation starts
- R3.7: Batch remix — process all videos in a project in parallel

### Generation Pipeline [Phase 4]
- R4.1: ElevenLabs REST API (direct fetch, not npm package) — per-scene MP3 at 44100Hz
- R4.2: Voice list endpoint with preview capability, responses cached 1 hour
- R4.3: HeyGen Upload Asset API → `audio_asset_id` → avatar video generation (NEVER public URLs)
- R4.4: HeyGen webhook endpoint (`/api/remix-engine/webhooks/heygen`) + polling fallback (5 min)
- R4.5: Runway ML B-roll — 4-second clips per scene, auto-fallback to Kling on 3+ failures
- R4.6: Runway webhook endpoint (`/api/remix-engine/webhooks/runway`) + polling fallback
- R4.7: Cost estimation widget displayed before user commits (uses pricing formulas from spec)
- R4.8: Cancel endpoints for all generation job types
- R4.9: All generated assets uploaded to Supabase Storage at namespaced paths
- R4.10: Track all API usage in `re_api_usage` table (service, tokens, characters, minutes, cost)

### Video Assembly [Phase 5]
- R5.1: Download all scene assets from Supabase to `/tmp/{video_id}/`
- R5.2: Normalize all video assets to 1080p 30fps H.264 via FFmpeg before Remotion
- R5.3: Remotion composition — avatar/B-roll alternating per scene, continuous audio track
- R5.4: Text overlays from script `onScreenText` fields
- R5.5: Configurable intro card (title) and outro card
- R5.6: Final render at 1920x1080 30fps MP4
- R5.7: Upload final video to Supabase Storage with download link via signed URL
- R5.8: Render progress reported in real-time (0-100%)
- R5.9: Chromium installed in worker container via Dockerfile
- R5.10: `/tmp` cleanup happens even on error (finally block)

### Polish & Admin [Phase 6]
- R6.1: Admin panel — user invite, role change, deactivate (standalone mode)
- R6.2: API key configuration — masked display, test connection per service
- R6.3: Usage statistics dashboard — cost per service, per project, over time
- R6.4: Role enforcement verified on every API route via `requireRole()` utility
- R6.5: Loading, error, empty states on every async component
- R6.6: Skeleton loaders, toast notifications, Framer Motion page transitions
- R6.7: Health check endpoint (`/api/remix-engine/health`)
- R6.8: Pino logger integrated throughout — domain-specific child loggers, never console.log
- R6.9: Spec export endpoint (`/api/remix-engine/spec.json`) — full module contract as JSON

### Module Architecture [All Phases — enforced from day 1]
- RM.1: `RemixEngineProvider` React context wraps all RemixEngine UI
  - Standalone: reads env vars, creates Supabase client, manages auth, renders shell
  - Module: accepts `{ supabaseClient, user, role, apiKeys, routePrefix }` from parent
- RM.2: `RemixEngineConfig` TypeScript interface defines the full contract:
  ```typescript
  interface RemixEngineConfig {
    mode: 'standalone' | 'module';
    routePrefix: string;              // default: '/remix-engine'
    supabaseUrl: string;
    supabaseAnonKey: string;
    supabaseServiceRoleKey: string;
    redisUrl: string;
    apiKeys: {
      youtube: string;
      gemini: string;
      falAi: string;
      elevenLabs: string;
      heyGen: string;
      runwayMl: string;
      kling?: string;
    };
    auth?: {                          // Only needed in module mode
      user: { id: string; email: string };
      role: 'admin' | 'editor' | 'viewer';
    };
    webhookBaseUrl: string;
    storagePrefix: string;            // default: 'remix-engine'
    tablePrefix: string;              // default: 're_'
  }
  ```
- RM.3: All API routes live under `routePrefix` (standalone: `/api/remix-engine/*`, module: parent configures)
- RM.4: All database tables prefixed with `tablePrefix` (`re_videos`, `re_projects`, etc.)
- RM.5: All Supabase Storage paths prefixed with `storagePrefix` (`remix-engine/videos/...`)
- RM.6: CSS variables only — zero hardcoded colors anywhere. Define defaults in `globals.css`, parent overrides in module mode.
- RM.7: Layout components (Sidebar, Header, ThemeProvider) only render in standalone mode. Controlled by `mode` in config.
- RM.8: Auth pages (`/login`, `/signup`) only exist in standalone mode. Module mode has no auth routes.
- RM.9: `useRemixEngine()` hook provides config to any component. All business logic uses this hook, never `process.env` directly on the client side. Server-side uses the config singleton.
- RM.10: Full spec exportable as structured JSON at health/spec endpoint for AI readability.

## V2 — Post-MVP
- Package extraction as `@remixengine/core` npm module or monorepo workspace
- Parent dashboard integration with shared Supabase instance
- YouTube Shorts (9:16) with vertical avatar compositions
- Custom avatar upload (HeyGen custom avatars)
- Multi-language (Gemini translation + 11Labs multilingual voices)
- A/B testing — generate 2 final videos with different titles/thumbnails
- Analytics — track which remixed titles/thumbnails perform best
- Automated CI/CD with tests

## Out of Scope
- Public-facing signup (invite-only internal tool)
- Mobile app or PWA
- Content moderation / NSFW detection
- Direct YouTube upload
- Real-time collaboration
- Non-linear video editing timeline
