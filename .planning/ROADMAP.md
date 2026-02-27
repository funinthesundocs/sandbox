# Roadmap

## Milestone 1: MVP

### Phase 1: Foundation (~4 hours)
**Requirements**: R1.1–R1.10, RM.1–RM.10
**Summary**: Project scaffold, Supabase with `re_` prefixed tables, auth, dark theme, RemixEngineProvider module boundary, UUPM design system generation.
**Key decisions**:
- All tables get `re_` prefix from day one
- `RemixEngineProvider` and `RemixEngineConfig` created as the very first code
- UUPM design system generated and stored in `design-system/MASTER.md`
- Standalone shell (sidebar, header, auth pages) wrapped in `mode === 'standalone'` checks
- All API routes under `src/app/api/remix-engine/`
- All storage paths prefixed with `remix-engine/`
- CSS variables prefixed `--re-*`
**Verify**: Log in as admin → styled dashboard → navigate all page shells → `RemixEngineConfig` type exports cleanly → `/api/remix-engine/health` returns OK.

### Phase 2: Scraping Pipeline (~4 hours)
**Requirements**: R2.1–R2.9
**Summary**: yt-dlp download, YouTube Data API metadata, VTT transcript extraction, Supabase Storage upload at namespaced paths, batch channel scraping, BullMQ job queue, Realtime progress on `re_jobs` table.
**Key decisions**:
- yt-dlp for transcripts (NOT YouTube Captions API — OAuth requirement)
- Max 20 min videos, compress >200MB to 720p
- All storage at `remix-engine/videos/{project_id}/{video_id}/`
- All business logic uses `getServerConfig()` for API keys
**Verify**: Paste YouTube URL → video scraped → watch original → read transcript → batch scrape a channel.

### Phase 3: Remix Pipeline (~4 hours)
**Requirements**: R3.1–R3.7
**Summary**: Gemini title variations (8x JSON mode), Gemini Vision + fal.ai thumbnails (3x at 1280x720), Gemini script rewriting with scene splitting, user select/edit/regenerate UI. Pipeline PAUSES after remix.
**Key decisions**:
- Gemini JSON mode with Zod validation on response
- Scene numbers unique per script (DB constraint on `re_scenes`)
- Pipeline PAUSES after remix — user must approve before Phase 4
**Verify**: 8 title variations displayed → 3 thumbnails generated → script with editable scenes → can select and approve.

### Phase 4: Generation Pipeline (~6 hours)
**Requirements**: R4.1–R4.10
**Summary**: 11Labs voiceover per scene, HeyGen avatar via Upload Asset API (`audio_asset_id`, never public URLs), Runway B-roll with Kling fallback, webhook endpoints under `/api/remix-engine/webhooks/`, cost estimation widget, cancel endpoints.
**Key decisions**:
- HeyGen: Upload Asset API → `audio_asset_id`. NEVER public URLs. Storage stays private.
- Runway: Signed URLs (10-min expiry) for file delivery
- Cost estimator must display BEFORE user commits
- All webhook URLs use `config.webhookBaseUrl`
**Verify**: Hear voiceover → see avatar video → see B-roll clips → cost estimate matches expectations → cancel works.

### Phase 5: Video Assembly (~4 hours)
**Requirements**: R5.1–R5.10
**Summary**: Asset download from namespaced storage paths, FFmpeg normalization, Remotion composition (avatar/B-roll alternating), text overlays, final render at 1080p 30fps, upload to `remix-engine/rendered/{videoId}/`.
**Key decisions**:
- Chromium must be in worker Dockerfile
- Normalize ALL inputs to 1080p 30fps H.264 BEFORE Remotion
- One render at a time (CPU-intensive, `concurrency: 1`)
- `/tmp` cleanup in finally block even on crash
**Verify**: Click "Render" → progress bar updates → final video plays → download works → video has correct scenes.

### Phase 6: Polish & Admin (~4 hours)
**Requirements**: R6.1–R6.9
**Summary**: Admin panel (standalone mode only), role enforcement, error/loading/empty states everywhere, skeleton loaders, toast notifications, health check, spec.json export, pino logging.
**Key decisions**:
- Admin panel only renders in standalone mode
- Spec export endpoint returns full module contract as JSON
- Every async component verified for all three states (loading, error, empty)
- All API routes verified for role enforcement
**Verify**: Admin manages users → role blocks work → all states render → spec.json returns valid JSON → end-to-end: URL → final video in one flow.

---

## Milestone 2: Module Extraction (Post-MVP)
- Extract as `@remixengine/core` package or monorepo workspace
- Test embedding into parent dashboard with `mode: 'module'`
- Shared Supabase instance with parent app
- Vertical video support (9:16 YouTube Shorts)
- Custom avatar upload
- Multi-language support
