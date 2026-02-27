# Phase 2: Scraping Pipeline - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Download YouTube videos, extract metadata/transcripts, and store everything in Supabase Storage at namespaced paths. Users paste URLs (single or channel), watch progress, browse scraped videos, read/edit transcripts. This is raw material ingestion — the first pipeline step before remixing.

Covers: yt-dlp download, YouTube Data API metadata, VTT transcript extraction, Gemini STT fallback, Supabase Storage upload, batch channel scraping, BullMQ job queue, Realtime progress via `re_jobs`.

Does NOT cover: Remix/script generation (Phase 3), video rendering (Phase 5), channel monitoring/auto-scrape scheduling (deferred).

</domain>

<decisions>
## Implementation Decisions

### Scrape flow UX
- Preview before scrape: paste URL → fetch metadata (title, thumbnail, duration) → show preview card → user confirms before downloading
- Step-based progress: discrete steps light up as they complete (Downloading → Extracting transcript → Uploading to storage)
- Entry points: URL input on the project page AND a top-level quick-add from sidebar/header
- Post-scrape: auto-navigate to the new video's detail page showing thumbnail, metadata, and transcript

### Video library display
- Card grid layout: thumbnail-forward responsive grid for browsing scraped videos within a project
- Moderate info density: thumbnail, title, duration badge, pipeline status badge, channel name as subtitle. View count and details on hover or click
- Media-focused detail page: large video player on top, transcript below in scrollable panel, metadata in header bar (title, duration chips, views, channel, publish date, scrape date)
- Video player source: YouTube embed by default, fall back to downloaded copy from Supabase Storage (signed URL) if YouTube unavailable
- Action buttons on detail page: Start Remix, Re-scrape, Delete, Download Original (full controls)
- Transcript is editable at scrape stage (inline editing — click text to edit in place, auto-save)

### URL input & validation
- Single smart input: auto-detects video URL vs channel URL and routes to the right flow
- All YouTube URL formats accepted: full URLs (youtube.com/watch?v=...), short URLs (youtu.be/...), mobile URLs, playlist URLs (extract individual videos), channel URLs, @handle URLs
- Multi-line paste: user can paste multiple video URLs (one per line) for batch scraping — same queue experience as channel batch
- Duplicate detection: warn "This video already exists in this project. Scrape again?" — allow re-scrape (overwrites old data)

### Batch channel scraping
- Browse-and-pick: paste channel URL → see browsable grid of channel videos (thumbnails, titles, durations) → checkbox-select which to scrape
- Grid/list view toggle for browsing channel videos
- 50 videos per page with "Load More" pagination
- Max 10 videos per batch scrape
- Queue list UI: all selected videos shown with individual status badges (queued, downloading, done, failed)
- Overall completion bar at top of queue
- Batch controls: pause, resume, cancel

### Transcript fallback chain
- Priority 1: yt-dlp auto-captions (VTT extraction — free, instant)
- Priority 2: User pastes own transcript (manual option, always available)
- Priority 3: Gemini audio transcription (extract audio from video → send to Gemini API for STT)
- Gemini STT requires user confirmation: "No captions available. Transcribe via Gemini?" — user clicks confirm before API call
- "Paste your own transcript" available both during the no-captions scrape flow AND as a "Replace Transcript" action on the video detail page anytime

### Transcript presentation
- Timestamps shown: each segment displays its timestamp (e.g., [0:42]), clickable to jump video player to that moment
- Timestamps in a fixed-width gutter on the left — never interfere with text selection. Clean text highlighting is non-negotiable
- No speaker labels — just clean text with timestamps
- Inline editing: click any text segment to edit in place, auto-save
- Replace Transcript button available on detail page at any time

### Failure & edge cases
- Error display: toast notification for the alert + inline detail in the input area showing why it was rejected and what to do
- Batch partial failures: continue scraping the rest. Failed videos show as "failed" in queue with error reason. User can retry failed ones individually
- Missing transcript: warn and confirm — "No transcript available for this video. Scrape anyway?"
- Retry: failed scrapes show a one-click "Retry" button in queue or video list
- Rejection reasons: too long (>20 min), private, age-restricted, unavailable — clear specific messages

### Visual design direction
- Product name: **EpicVideo** (module within EpicDash.AI platform)
- Dark mode + light mode: both required. Dark is primary experience
- User-selectable primary accent color: default vivid teal/cyan. RemixEngine's `--re-*` CSS variables must reference the parent's primary color variable so glow/accents inherit automatically
- Glassmorphism everywhere (subtle): light glass effect on all card backgrounds and panels. Glow on interactive elements (buttons, inputs, status badges). Unified glass aesthetic
- High-tech AI 2.0 flair: allowed because this is a video/AI creative tool. More expressive than a standard business module
- **Hard rule: Glassmorphism is CSS-only decoration (`backdrop-filter`, `border`, `box-shadow`). Zero extra DOM elements, zero impact on interactivity, click targets, tab order, or z-index stacking. Function over flash — always.**
- Reference images: `UIExamples/` directory — EpicDash dark dashboard (structure/colors), HeyGen template browser (content grid patterns), Agent selection screen (glassmorphism/glow target aesthetic)

### Claude's Discretion
- Loading skeleton design and animation
- Exact spacing, typography sizes, and responsive breakpoints
- Error state visual treatment
- Progress step animation style
- Queue list sort order
- Exact glassmorphism intensity values (blur, opacity, glow radius)
- Video player controls and sizing
- Transcript segment granularity (sentence vs paragraph)

</decisions>

<specifics>
## Specific Ideas

- "Ultra High Tech, AI 2.0, Glass Morphism, Glow High Tech But Professional" — user's exact design brief
- UI must plug into EpicDash.AI dashboard as a module — same sidebar, header, dark/light mode, primary color system
- Different modules can have their own flair — EpicVideo gets creative license because of its nature (video/AI), but an accounting module would be more restrained
- "I don't want ghost containers sitting on or in my buttons making it impossible for me to click" — glassmorphism must never compromise usability
- "Timestamps should not get in the way of text when a user is trying to highlight" — timestamps in separate gutter, clean text selection
- Video card grid similar to YouTube's own video grid (thumbnail-forward)
- HeyGen-style template browser as reference for content browsing patterns
- Reference images saved in `UIExamples/` for downstream agents to review

</specifics>

<deferred>
## Deferred Ideas

- **Channel monitoring**: auto-detect and download new content since last scrape — recurring/scheduled capability, its own phase
- **Custom output directory / cloud storage linking**: project uses fixed Supabase Storage paths; custom directories would be a different storage model
- **Gemini 3 Pro Image Preview integration**: API key set up (`GOOGLE_GEMINI_IMAGE_API_KEY`), model `gemini-3-pro-image-preview` — wired into config.ts during Phase 3 (thumbnail generation)

</deferred>

---

*Phase: 02-scraping-pipeline-4-hours*
*Context gathered: 2026-02-27*
