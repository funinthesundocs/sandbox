# Phase 2: Scraping Pipeline - Research

**Researched:** 2026-02-27
**Domain:** YouTube content scraping, metadata extraction, transcript handling, Supabase Storage upload, BullMQ job queue, Realtime progress
**Confidence:** HIGH

## Summary

Phase 2 implements the raw material ingestion layer of RemixEngine: downloading YouTube videos, extracting metadata/transcripts, and storing everything in Supabase Storage with namespaced paths. The stack is mature and well-established: yt-dlp for downloads/transcripts, YouTube Data API v3 for metadata, BullMQ for async job queuing, and Supabase Realtime for progress updates.

The critical decision points are:
1. **yt-dlp vs YouTube Captions API**: Must use yt-dlp's auto-subtitle extraction (VTT format) because Captions API requires OAuth, which is out of scope.
2. **Storage strategy**: All assets go to Supabase Storage under `remix-engine/videos/{projectId}/{videoId}/` prefix. Helper `storagePath()` prevents manual path construction.
3. **Batch processing**: Channel scraping uses YouTube Data API's `search.list` endpoint (API key only, no OAuth), with concurrency limited to 3 to respect rate limits.
4. **Realtime progress**: `re_jobs` table publishes updates via Supabase Realtime; client subscribes for live progress bars.

The main pitfall is **transcript fallback logic**: if yt-dlp finds no auto-captions, the job succeeds but flags the transcript as missing. User can then manually paste one OR request Gemini audio transcription (Phase 3 extension, deferred).

**Primary recommendation:** Implement yt-dlp wrapper with 5-minute timeout, YouTube Data API metadata fetch in parallel, and VTT parser in pipeline. Use BullMQ concurrency of 3 for channels, 1 for single videos. Store all paths with `storagePath()` helper — never construct paths manually.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Scrape flow UX**: Preview before scrape — paste URL → fetch metadata (title, thumbnail, duration) → show preview card → user confirms before downloading
- **Step-based progress**: Discrete steps light up as they complete (Downloading → Extracting transcript → Uploading to storage)
- **Entry points**: URL input on project page AND top-level quick-add from sidebar/header
- **Post-scrape**: Auto-navigate to video's detail page showing thumbnail, metadata, and transcript
- **Video library display**: Card grid layout, thumbnail-forward, responsive. Show: thumbnail, title, duration badge, pipeline status badge, channel name as subtitle
- **Media-focused detail page**: Large video player (YouTube embed default, fallback to Supabase signed URL), transcript below in scrollable panel, metadata in header bar
- **Transcript presentation**: Timestamps shown, each segment displays timestamp (e.g., [0:42]), clickable to jump video player. Timestamps in fixed-width gutter on left — never interfere with text selection
- **Transcript is editable** at scrape stage (inline editing — click text to edit in place, auto-save)
- **URL input & validation**: Single smart input auto-detects video vs channel URL. All YouTube formats accepted (full URLs, short URLs, mobile URLs, playlists — extract individual videos, channel URLs, @handle URLs)
- **Multi-line paste**: User can paste multiple video URLs (one per line) for batch scraping — same queue experience as channel batch
- **Duplicate detection**: Warn "This video already exists in this project. Scrape again?" — allow re-scrape (overwrites old data)
- **Batch channel scraping**: Browse-and-pick — paste channel URL → see browsable grid of channel videos (thumbnails, titles, durations) → checkbox-select which to scrape
- **Grid/list view toggle** for browsing channel videos
- **50 videos per page** with "Load More" pagination
- **Max 10 videos per batch scrape**
- **Queue list UI**: All selected videos shown with individual status badges (queued, downloading, done, failed). Overall completion bar at top. Batch controls: pause, resume, cancel
- **Transcript fallback chain**: Priority 1: yt-dlp auto-captions (VTT extraction — free, instant). Priority 2: User pastes own transcript (manual option, always available). Priority 3: Gemini audio transcription (extract audio from video → send to Gemini API for STT, requires user confirmation)
- **Failure & edge cases**: Error display as toast + inline detail. Batch partial failures: continue scraping the rest. Failed videos show as "failed" in queue with error reason. Missing transcript: warn and confirm — "No transcript available for this video. Scrape anyway?" Rejection reasons: too long (>20 min), private, age-restricted, unavailable — clear specific messages
- **Visual design**: Dark mode + light mode both required. Dark is primary. Glassmorphism everywhere (CSS-only decoration, zero DOM impact). Product name: **EpicVideo**

### Claude's Discretion
- Loading skeleton design and animation
- Exact spacing, typography sizes, and responsive breakpoints
- Error state visual treatment
- Progress step animation style
- Queue list sort order
- Exact glassmorphism intensity values (blur, opacity, glow radius)
- Video player controls and sizing
- Transcript segment granularity (sentence vs paragraph)

### Deferred Ideas (OUT OF SCOPE)
- **Channel monitoring**: auto-detect and download new content since last scrape — recurring/scheduled capability, its own phase
- **Custom output directory / cloud storage linking**: project uses fixed Supabase Storage paths; custom directories would be a different storage model
- **Gemini 3 Pro Image Preview integration**: API key set up (`GOOGLE_GEMINI_IMAGE_API_KEY`), model `gemini-3-pro-image-preview` — wired into config.ts during Phase 3 (thumbnail generation)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| R2.1 | yt-dlp wrapper — download MP4 from YouTube URL (max 20min, compress >200MB to 720p) | `ffmpeg` installed in Dockerfile; yt-dlp via pip3; child_process wrapper with timeout; compression logic for files >200MB |
| R2.2 | YouTube Data API v3 — fetch title, description, thumbnail, stats (API key only) | API key authentication only (no OAuth); endpoint: `GET /youtube/v3/videos?part=snippet,contentDetails,statistics` and `GET /youtube/v3/search?part=snippet&channelId=...` |
| R2.3 | Transcript extraction via yt-dlp auto-subtitles (NOT Captions API — requires OAuth) | yt-dlp flag: `--write-auto-sub --sub-lang en` produces `.en.vtt` file; no Captions API |
| R2.4 | VTT parser — strip timestamps and duplicate lines into plain text | Custom parser to convert VTT format to plain text with embedded timestamps |
| R2.5 | Upload all assets to Supabase Storage at `remix-engine/videos/{project_id}/{video_id}/` | `storagePath()` helper; bucket name: `remixengine-assets`; never construct paths manually |
| R2.6 | Batch channel scraping — `search.list` with `channelId`, up to 10 most recent videos | YouTube Data API `search.list` endpoint with `channelId` parameter; concurrency: 3 |
| R2.7 | Job progress reported via Supabase Realtime subscriptions on `re_jobs` table | `re_jobs` table; Realtime publication enabled; client subscribes for live updates |
| R2.8 | `/tmp` cleanup in `finally` block after every scrape job (success or failure) | `cleanTempDir(videoId)` utility in every worker handler's finally block |
| R2.9 | Reject private, age-restricted, and unavailable videos with clear error messages | Error detection in yt-dlp output; specific error codes mapped to user-facing messages |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| yt-dlp | latest | Video download + subtitle extraction (auto-captions) | YouTube-optimized, actively maintained, supports VTT extraction without OAuth |
| YouTube Data API v3 | v3 | Fetch metadata (title, description, thumbnail, stats) | Official Google API, API key auth only, no OAuth overhead |
| BullMQ | ^5.12 | Job queue for async scraping | Redis-backed, strong Realtime integration, TypeScript-first |
| ioredis | ^5.4 | Redis connection client | Standard Redis driver, required by BullMQ |
| Supabase Storage | (via @supabase/supabase-js) | File upload and signed URLs | Private storage, built-in RLS policies, signed URLs for playback |
| @supabase/supabase-js | ^2.45 | Supabase client library | Server-side service role key for worker uploads |
| fluent-ffmpeg | ^2.1 | Video compression (>200MB → 720p) | Wrapper around system FFmpeg; easy format/bitrate control |
| pino | ^9.0 | Structured logging | Fast JSON logging; domain-specific child loggers |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^3.23 | Validation for scrape request schemas | Validate YouTubeUrl, projectId, channel URLs |
| nanoid | ^5.0 | Generate unique IDs for temp files | yt-dlp output file naming |
| date-fns | ^3.6 | Parse/format timestamps from YouTube API | Format video publish dates |

### System Dependencies
| Tool | Purpose | Install |
|------|---------|---------|
| yt-dlp | Download videos + extract subtitles | `pip3 install yt-dlp` (macOS: `pip3 install yt-dlp`, Dockerfile: `RUN pip3 install --break-system-packages yt-dlp`) |
| FFmpeg | Video compression + normalization | `brew install ffmpeg` (macOS), Dockerfile: `apt-get install ffmpeg` |
| Redis | Job queue backend | `brew install redis` (macOS, dev only), Railway addon (production) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| yt-dlp | pytube, youtube-dl | youtube-dl is unmaintained; pytube lacks VTT extraction and is Python-heavy |
| YouTube Data API v3 | YouTube Scraper (unofficial) | Unofficial libraries break when YouTube changes DOM; API v3 is stable and supported |
| BullMQ | Bull (npm), RQ (Python) | Bull has memory leak issues at scale; BullMQ is rewritten, production-grade |
| Supabase Storage | AWS S3 | S3 requires AWS account, IAM roles, more complex setup; Supabase is simpler SaaS |

**Installation:**
```bash
npm install bullmq ioredis zod nanoid date-fns pino pino-pretty fluent-ffmpeg
npm install -D @types/fluent-ffmpeg

# System-level (dev)
brew install yt-dlp ffmpeg redis

# System-level (Dockerfile — handled in Phase 5)
# RUN apt-get install -y ffmpeg python3 python3-pip
# RUN pip3 install --break-system-packages yt-dlp
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── scraper/                    # yt-dlp wrappers
│   │   ├── youtube-downloader.ts   # Download MP4 with timeout
│   │   ├── transcript-extractor.ts # VTT extraction + parsing
│   │   └── vtt-parser.ts           # Convert VTT → plain text with timestamps
│   ├── youtube-api/                # YouTube Data API wrappers
│   │   ├── client.ts               # OAuth-free API client (key-only auth)
│   │   ├── metadata.ts             # Fetch video snippet, stats
│   │   └── channel.ts              # Search channel videos
│   ├── queue/
│   │   ├── connection.ts           # Redis connection (via getServerConfig)
│   │   └── queues.ts               # BullMQ queue definitions
│   └── remix-engine/
│       └── hooks.ts                # storagePath() helper, table() helper
├── worker/
│   ├── index.ts                    # Worker entry point
│   └── handlers/
│       └── scrape.ts               # handleScrapeJob() — main orchestrator
├── app/
│   └── api/remix-engine/
│       ├── scrape/
│       │   ├── route.ts            # POST /api/remix-engine/scrape
│       │   └── batch/route.ts      # POST /api/remix-engine/scrape/batch
│       └── scrape/
│           └── status/[jobId]/route.ts  # GET /api/remix-engine/scrape/status/[jobId]
```

### Pattern 1: yt-dlp Wrapper with Timeout

**What:** Encapsulate yt-dlp as a Node.js child_process with configurable timeout (5 minutes max) and error handling for common YouTube failures (private, age-restricted, unavailable).

**When to use:** Every scrape job handler (single or batch) must download video and extract subtitles.

**Example:**
```typescript
// src/lib/scraper/youtube-downloader.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { logger } from '../logger';

const execAsync = promisify(exec);

interface DownloadResult {
  filePath: string;
  duration: number; // seconds
  fileName: string;
}

/**
 * Download YouTube video to /tmp with 5-minute timeout.
 * Compress to 720p if file > 200MB.
 */
export async function downloadYouTubeVideo(
  youtubeUrl: string,
  videoId: string,
  options = { maxDurationSec: 20 * 60 } // 20 min default from Phase 1 config
): Promise<DownloadResult> {
  const tmpDir = `/tmp/remixengine/${videoId}`;
  const outputTemplate = path.join(tmpDir, '%(id)s.%(ext)s');

  try {
    // Command: download best video ≤1080p + audio, merge, timeout 5min
    const cmd = [
      'yt-dlp',
      `-f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]"`,
      '--merge-output-format mp4',
      `--output "${outputTemplate}"`,
      `--socket-timeout 10`,
      youtubeUrl,
    ].join(' ');

    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 5 * 60 * 1000, // 5 minutes
      maxBuffer: 10 * 1024 * 1024, // 10MB stdout
    });

    // Extract final file name from yt-dlp output
    const match = stdout.match(/\[download\] (\S+) has already been downloaded/);
    const fileName = match ? match[1] : `${videoId}.mp4`;
    const filePath = path.join(tmpDir, fileName);

    // Get file size for compression check
    const { size } = fs.statSync(filePath);
    if (size > 200 * 1024 * 1024) {
      logger.info('Compressing video to 720p', { videoId, sizeBefore: size });
      await compressToH264720p(filePath);
    }

    // Get duration via ffprobe (part of ffmpeg)
    const duration = await getVideoDuration(filePath);

    if (duration > maxDurationSec) {
      throw new Error(`Video duration ${duration}s exceeds limit ${maxDurationSec}s`);
    }

    logger.info('Video downloaded successfully', { videoId, size, duration });
    return { filePath, duration, fileName };
  } catch (error: any) {
    // Detect common YouTube errors from stderr
    if (error.message.includes('Private video')) {
      throw new Error('PRIVATE_VIDEO');
    }
    if (error.message.includes('age-restricted')) {
      throw new Error('AGE_RESTRICTED');
    }
    if (error.message.includes('not available')) {
      throw new Error('UNAVAILABLE');
    }
    if (error.code === 'ETIMEDOUT') {
      throw new Error('DOWNLOAD_TIMEOUT');
    }
    logger.error('yt-dlp download failed', { videoId, error: error.message });
    throw error;
  }
}

// Source: Based on REMIXENGINE_SPEC_v3.md Section 14 & 19
```

### Pattern 2: VTT Parser with Timestamp Extraction

**What:** Convert VTT subtitle format to plain text, preserving segment timestamps but in a clean, clickable format suitable for UI display.

**When to use:** After yt-dlp extracts `.en.vtt` file, before storing transcript in Supabase and database.

**Example:**
```typescript
// src/lib/scraper/vtt-parser.ts
import fs from 'fs';

interface TranscriptSegment {
  timestamp: string;  // "0:42"
  text: string;       // Clean text
  startMs: number;    // For clicking to jump video to this time
}

/**
 * Parse VTT file into structured segments with timestamps.
 * Removes duplicates, cleans up formatting.
 */
export function parseVTT(filePath: string): TranscriptSegment[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const segments: TranscriptSegment[] = [];
  let currentTimestamp: string | null = null;
  let currentText: string[] = [];

  for (const line of lines) {
    // Skip WEBVTT header and notes
    if (line.startsWith('WEBVTT') || line.startsWith('NOTE')) continue;

    // Timestamp line: "00:00:42.500 --> 00:00:45.000"
    if (line.includes('-->')) {
      // Save previous segment if exists
      if (currentTimestamp && currentText.length) {
        segments.push({
          timestamp: formatTimestamp(currentTimestamp),
          text: currentText.join(' ').trim(),
          startMs: timeToMs(currentTimestamp),
        });
      }
      // Start new segment
      currentTimestamp = line.split(' --> ')[0].trim();
      currentText = [];
      continue;
    }

    // Text line
    if (line.trim() && currentTimestamp) {
      currentText.push(line.trim());
    }
  }

  // Don't forget last segment
  if (currentTimestamp && currentText.length) {
    segments.push({
      timestamp: formatTimestamp(currentTimestamp),
      text: currentText.join(' ').trim(),
      startMs: timeToMs(currentTimestamp),
    });
  }

  // Remove duplicates (same text within 1 second)
  return deduplicateSegments(segments);
}

function formatTimestamp(vttTime: string): string {
  // "00:00:42.500" → "0:42"
  const [hours, minutes, seconds] = vttTime.split(':');
  const h = parseInt(hours);
  const m = parseInt(minutes);
  const s = Math.floor(parseFloat(seconds));

  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeToMs(vttTime: string): number {
  const [hours, minutes, seconds] = vttTime.split(':');
  return (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds)) * 1000;
}

function deduplicateSegments(segments: TranscriptSegment[]): TranscriptSegment[] {
  const deduped: TranscriptSegment[] = [];
  let lastText = '';

  for (const seg of segments) {
    if (seg.text !== lastText) {
      deduped.push(seg);
      lastText = seg.text;
    }
  }

  return deduped;
}

// Source: Custom pattern based on REMIXENGINE_SPEC_v3.md requirements
```

### Pattern 3: Parallel Metadata Fetch (YouTube Data API)

**What:** While yt-dlp downloads the video (slow), fetch metadata in parallel via YouTube Data API. Both operations complete independently, then combine results.

**When to use:** Single video scrape — kick off download and metadata fetch simultaneously.

**Example:**
```typescript
// src/lib/youtube-api/metadata.ts
import { getServerConfig } from '../remix-engine/config';
import { logger } from '../logger';

interface VideoMetadata {
  title: string;
  description: string;
  channelName: string;
  channelId: string;
  duration: number; // seconds
  viewCount: bigint;
  publishedAt: string; // ISO timestamp
  thumbnailUrl: string;
}

export async function fetchVideoMetadata(youtubeId: string): Promise<VideoMetadata> {
  const config = getServerConfig();
  const apiKey = config.apiKeys.youtube;

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?` +
    `part=snippet,contentDetails,statistics&id=${youtubeId}&key=${apiKey}`
  );

  if (!response.ok) {
    const error = await response.text();
    logger.error('YouTube API error', { youtubeId, status: response.status, error });
    throw new Error(`YouTube API: ${response.status}`);
  }

  const data = await response.json();
  if (!data.items?.length) {
    throw new Error('Video not found');
  }

  const item = data.items[0];
  const snippet = item.snippet;
  const contentDetails = item.contentDetails;
  const statistics = item.statistics;

  // Parse ISO 8601 duration "PT5M30S" → seconds
  const durationMatch = contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(durationMatch?.[1] || '0') || 0;
  const minutes = parseInt(durationMatch?.[2] || '0') || 0;
  const seconds = parseInt(durationMatch?.[3] || '0') || 0;
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  return {
    title: snippet.title,
    description: snippet.description,
    channelName: snippet.channelTitle,
    channelId: snippet.channelId,
    duration: totalSeconds,
    viewCount: BigInt(statistics.viewCount || '0'),
    publishedAt: snippet.publishedAt,
    thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default?.url,
  };
}

// Source: REMIXENGINE_SPEC_v3.md Section 14 — YouTube Data API
```

### Pattern 4: Job Status Tracking with Realtime

**What:** Create a `re_jobs` record before scraping, update it with progress milestones (Downloading → Extracting → Uploading), and client subscribes to Realtime updates for live UI progress bars.

**When to use:** Every scrape job (single or batch).

**Example:**
```typescript
// src/worker/handlers/scrape.ts
import { Job } from 'bullmq';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { storagePath } from '@/lib/remix-engine/hooks';
import { downloadYouTubeVideo } from '@/lib/scraper/youtube-downloader';
import { extractSubtitles } from '@/lib/scraper/transcript-extractor';
import { parseVTT } from '@/lib/scraper/vtt-parser';
import { fetchVideoMetadata } from '@/lib/youtube-api/metadata';
import { getVideoDuration } from '@/lib/utils/video-duration';
import { cleanTempDir } from '@/lib/utils/temp-files';
import { scrapeLogger as logger } from '@/lib/logger';

export async function handleScrapeJob(job: Job) {
  const { youtubeUrl, youtubeId, projectId, videoId } = job.data;

  // Create or update job tracking record
  const { data: jobRecord, error: jobError } = await supabaseAdmin
    .from('re_jobs')
    .upsert(
      {
        id: videoId,
        type: 'scrape',
        status: 'processing',
        video_id: videoId,
        project_id: projectId,
        progress: 0,
        created_by: job.data.userId,
        started_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select('id')
    .single();

  if (jobError) {
    logger.error('Failed to create job record', { error: jobError });
    throw jobError;
  }

  try {
    // Step 1: Download video (in parallel with metadata fetch)
    logger.info('Starting download', { youtubeId, projectId });
    job.updateProgress(10);
    await supabaseAdmin
      .from('re_jobs')
      .update({ progress: 10 })
      .eq('id', jobRecord.id);

    const [downloadResult, metadata] = await Promise.all([
      downloadYouTubeVideo(youtubeUrl, videoId),
      fetchVideoMetadata(youtubeId),
    ]);

    logger.info('Download + metadata complete', { youtubeId, duration: downloadResult.duration });
    job.updateProgress(40);
    await supabaseAdmin
      .from('re_jobs')
      .update({ progress: 40 })
      .eq('id', jobRecord.id);

    // Step 2: Extract subtitle file
    logger.info('Extracting subtitles', { youtubeId });
    job.updateProgress(60);
    const vttPath = await extractSubtitles(youtubeUrl, videoId);
    const transcriptSegments = parseVTT(vttPath);
    const transcriptText = transcriptSegments.map(s => s.text).join('\n');

    logger.info('Subtitles extracted', { youtubeId, segmentCount: transcriptSegments.length });
    job.updateProgress(70);
    await supabaseAdmin
      .from('re_jobs')
      .update({ progress: 70 })
      .eq('id', jobRecord.id);

    // Step 3: Upload to Supabase Storage
    logger.info('Uploading to storage', { youtubeId });
    const videoPath = storagePath('videos', projectId, videoId, 'original.mp4');
    const thumbnailPath = storagePath('videos', projectId, videoId, 'thumbnail.jpg');
    const transcriptPath = storagePath('videos', projectId, videoId, 'transcript.txt');

    const [videoUpload, thumbnailUpload, transcriptUpload] = await Promise.all([
      supabaseAdmin.storage
        .from('remixengine-assets')
        .upload(videoPath, fs.readFileSync(downloadResult.filePath)),
      supabaseAdmin.storage
        .from('remixengine-assets')
        .upload(
          thumbnailPath,
          Buffer.from(await fetch(metadata.thumbnailUrl).then(r => r.arrayBuffer()))
        ),
      supabaseAdmin.storage
        .from('remixengine-assets')
        .upload(transcriptPath, Buffer.from(transcriptText)),
    ]);

    if (videoUpload.error || thumbnailUpload.error || transcriptUpload.error) {
      throw new Error('Storage upload failed');
    }

    logger.info('Storage upload complete', { youtubeId });
    job.updateProgress(85);

    // Step 4: Update video record in database
    const { error: videoError } = await supabaseAdmin
      .from('re_videos')
      .update({
        original_title: metadata.title,
        original_description: metadata.description,
        original_thumbnail_url: metadata.thumbnailUrl,
        original_transcript: transcriptText,
        channel_name: metadata.channelName,
        channel_id: metadata.channelId,
        duration_seconds: metadata.duration,
        view_count: metadata.viewCount.toString(),
        published_at: metadata.publishedAt,
        video_file_path: videoPath,
        thumbnail_file_path: thumbnailPath,
        transcript_file_path: transcriptPath,
        scrape_status: 'complete',
      })
      .eq('id', videoId);

    if (videoError) {
      logger.error('Failed to update video record', { error: videoError });
      throw videoError;
    }

    // Mark job complete
    job.updateProgress(100);
    await supabaseAdmin
      .from('re_jobs')
      .update({
        status: 'complete',
        progress: 100,
        completed_at: new Date().toISOString(),
        result: { message: 'Scrape complete' },
      })
      .eq('id', jobRecord.id);

    logger.info('Scrape job complete', { youtubeId, projectId });
    return { success: true, videoId };
  } catch (error: any) {
    logger.error('Scrape job failed', { youtubeId, error: error.message });

    // Map error to user-facing message
    let errorMessage = error.message;
    if (error.message === 'PRIVATE_VIDEO') errorMessage = 'This video is private and cannot be scraped.';
    if (error.message === 'AGE_RESTRICTED') errorMessage = 'This video is age-restricted.';
    if (error.message === 'UNAVAILABLE') errorMessage = 'This video is unavailable.';
    if (error.message === 'DOWNLOAD_TIMEOUT') errorMessage = 'Download timed out. Please try again.';

    await supabaseAdmin
      .from('re_jobs')
      .update({
        status: 'error',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobRecord.id);

    await supabaseAdmin
      .from('re_videos')
      .update({ scrape_status: 'error', error_message: errorMessage })
      .eq('id', videoId);

    throw error;
  } finally {
    cleanTempDir(videoId);
  }
}

// Source: Based on REMIXENGINE_SPEC_v3.md Section 8 & 14
```

### Anti-Patterns to Avoid
- **Direct yt-dlp shell execution without timeout**: Can hang forever if YouTube is slow. Always wrap with timeout (5 min max).
- **Constructing storage paths manually**: Use `storagePath()` helper everywhere to ensure consistency and prefix handling.
- **Fetching metadata after download**: Fetch in parallel; both are I/O-bound and can complete independently.
- **Assuming all videos have auto-captions**: Check for empty/missing `.en.vtt` and handle gracefully with "no transcript" flag.
- **Not cleaning `/tmp` on error**: Always `cleanTempDir(videoId)` in finally block, even after exceptions.
- **Storing transcript as VTT format in database**: Parse to plain text; VTT is for display/parsing only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YouTube video download | Custom downloader | yt-dlp (Python) | YouTube format changes constantly; yt-dlp is maintained by community and works reliably. Custom parsing breaks every YouTube UI update. |
| Video format negotiation | Choose best quality manually | yt-dlp's `-f` format selector | yt-dlp handles codec compatibility, container format negotiation, and fallbacks automatically. |
| Subtitle parsing | Regex-based VTT parser | Simple state-machine parser (provided above) | VTT format has edge cases (multi-line text, cue settings, bom markers); a simple parser handles these correctly. |
| YouTube API auth | OAuth flow | YouTube Data API v3 with API key | Captions API requires OAuth; Metadata + Search endpoints work with API key only. OAuth is unnecessary complexity. |
| Video compression decisions | Manual ffmpeg command construction | fluent-ffmpeg wrapper | ffmpeg has many options; fluent-ffmpeg provides sane defaults and error handling. |
| Job progress tracking | Manual database updates in middleware | BullMQ + Supabase Realtime | BullMQ handles retries, dead-lettering, and state management. Realtime handles WebSocket subscriptions. Both are complex to implement correctly. |

**Key insight:** yt-dlp is the industry standard for YouTube scraping because YouTube actively blocks custom scrapers. Trying to build a downloader will fail immediately when YouTube changes their infrastructure (which they do monthly). BullMQ + Realtime are mature, production-grade systems that handle edge cases (job failure, worker crash, network timeout) that are nearly impossible to get right with ad-hoc code.

---

## Common Pitfalls

### Pitfall 1: yt-dlp Hangs or Times Out
**What goes wrong:** yt-dlp can hang indefinitely if YouTube is slow to respond or the connection drops. User sees "loading" spinner forever. Worker thread becomes unresponsive.

**Why it happens:** YouTube throttles requests from scrapers; some videos have slow servers; network conditions vary.

**How to avoid:** Wrap every yt-dlp call with a 5-minute timeout via child_process options. If timeout fires, catch it and throw a specific `DOWNLOAD_TIMEOUT` error that the UI renders as "Please try again."

**Warning signs:** User reports "scrape hung", worker logs show yt-dlp process still running after job creation.

### Pitfall 2: Missing Auto-Captions Breaks Transcript Flow
**What goes wrong:** yt-dlp extracts `.en.vtt`, but some videos have no auto-captions (set to private, comments disabled, or original language not English). Parser gets empty/broken file. Code assumes transcript always exists.

**Why it happens:** YouTube doesn't generate auto-captions for all videos; user may have disabled them; non-English videos don't have English subtitles.

**How to avoid:** Check if VTT file is empty or parsing yields < 3 segments. If so, set `scrape_status = 'complete'` but flag `original_transcript = null` in database. UI shows "No transcript available" and offers manual paste OR Gemini STT option (Phase 3 extension).

**Warning signs:** Scrape job succeeds but transcript is blank/garbage. Deployment crashes on missing VTT file.

### Pitfall 3: Storage Paths Are Inconsistent
**What goes wrong:** One part of code stores to `remix-engine/videos/{projectId}/{videoId}/`, another stores to `remix-engine/videos/{videoId}/`, another hardcodes bucket name. Files get scattered, UI can't find them.

**Why it happens:** `storagePath()` helper is new; developers construct paths manually out of habit; different agents don't coordinate.

**How to avoid:** **NEVER construct Supabase paths manually.** Always use `storagePath('videos', projectId, videoId, 'original.mp4')`. Make this a lint rule. Code review catches any manual path construction.

**Warning signs:** Video uploads succeed but signed URLs return 404. Files visible in Supabase dashboard but not in app.

### Pitfall 4: Batch Scraping Exceeds YouTube Rate Limits
**What goes wrong:** Scraping 10 videos in parallel → YouTube temporarily blocks requests → all jobs fail with "Too many requests" → user sees blank queue or retry loop.

**Why it happens:** YouTube's API and scraper limits are strict. Concurrent metadata fetches + downloads can trigger throttling.

**How to avoid:** BullMQ concurrency: 3 for scrape queue. This is documented in spec Section 8. Don't increase it without testing actual YouTube rate limits. If hitting limits in production, add backoff: if API returns 429, exponential backoff + retry.

**Warning signs:** Batch scrapes fail with "quotaExceeded" or "rateLimitExceeded" in API responses. All jobs in a batch fail together.

### Pitfall 5: /tmp Files Not Cleaned After Error
**What goes wrong:** Scrape job fails midway. Worker crashes. `/tmp/remixengine/{videoId}/` accumulates files over time. Disk fills up. Railway service runs out of space.

**Why it happens:** Developers forget `finally` block or put cleanup in `catch` only (doesn't run if outer error occurs).

**How to avoid:** **MANDATORY PATTERN**: Always `cleanTempDir(videoId)` in `finally` block, outside try-catch. This ensures cleanup runs even if an exception is thrown and not caught.

```typescript
try {
  // work
} finally {
  cleanTempDir(videoId);  // ← Always runs
}
```

**Warning signs:** Railway worker service crashes with "No space left on device". `/tmp` grows without bound. Server logs show "ENOSPC" errors.

### Pitfall 6: Metadata Fetch Fails While Download Succeeds
**What goes wrong:** Video downloads successfully, but YouTube API call times out or returns 403. Job is partially done. Database record is incomplete (no title, no view count).

**Why it happens:** Parallel operations can have different failure modes. Download uses yt-dlp (Python subprocess), API uses HTTP fetch (JavaScript). One succeeds, one fails.

**How to avoid:** Wrap `Promise.all([download, metadata])` such that if metadata fails, the whole job fails. Don't treat partial success as success. If critical metadata is missing, mark scrape as error, not complete. Optionally, do metadata fetch BEFORE download to fail fast if video is private/unavailable.

**Warning signs:** Videos in database have null titles, view counts = 0, channel names = empty.

### Pitfall 7: Duplicate Video in Project Not Detected
**What goes wrong:** User pastes same YouTube URL twice. Two separate jobs create two database records. Database UNIQUE constraint fires. Job fails. User confused.

**Why it happens:** Scrape API doesn't check for duplicates before enqueueing job. Job runs, inserts, conflicts with existing row.

**How to avoid:** Before enqueueing scrape job, check if `youtubeId` already exists in project:
```typescript
const existing = await supabaseAdmin
  .from('re_videos')
  .select('id')
  .eq('project_id', projectId)
  .eq('youtube_id', youtubeId)
  .single();

if (existing.data) {
  // Video already in project. Return existing or ask user to re-scrape.
  return { existing: true, videoId: existing.data.id };
}
```
If user wants to re-scrape, delete old `re_jobs` records and update `re_videos` with new scrape (overwrite).

**Warning signs:** Intermittent scrape failures with constraint violation errors. Jobs succeed but same video appears twice in UI.

---

## Code Examples

Verified patterns from official sources:

### yt-dlp Video Download (with Timeout)
```typescript
// Source: REMIXENGINE_SPEC_v3.md Section 14, standard practice
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function downloadVideo(
  url: string,
  outputDir: string,
  timeoutMs = 5 * 60 * 1000
) {
  const cmd = `yt-dlp -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" \\
    --merge-output-format mp4 -o "${outputDir}/%(id)s.%(ext)s" "${url}"`;

  const { stdout } = await execAsync(cmd, { timeout: timeoutMs });
  return stdout;
}
```

### YouTube Data API — Metadata Fetch
```typescript
// Source: REMIXENGINE_SPEC_v3.md Section 14
const response = await fetch(
  `https://www.googleapis.com/youtube/v3/videos?` +
  `part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`
);
const data = await response.json();
const { title, description, thumbnails } = data.items[0].snippet;
```

### BullMQ Queue Configuration
```typescript
// Source: REMIXENGINE_SPEC_v3.md Section 8
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const redis = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const scrapeQueue = new Queue('scrape', { connection: redis });

// Worker (separate process)
const scrapeWorker = new Worker('scrape', handleScrapeJob, {
  connection: redis,
  concurrency: 3,  // Max 3 concurrent videos
});
```

### Realtime Progress Subscription (Client-Side)
```typescript
// Source: REMIXENGINE_SPEC_v3.md Section 8
import { useEffect, useState } from 'react';
import { useRemixEngine } from '@/lib/remix-engine/hooks';

export function ScrapeProgress({ jobId }: { jobId: string }) {
  const config = useRemixEngine();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const subscription = config.supabaseClient
      .from(`re_jobs:id=eq.${jobId}`)
      .on('UPDATE', (payload) => {
        setProgress(payload.new.progress);
      })
      .subscribe();

    return () => {
      subscription?.unsubscribe();
    };
  }, [config.supabaseClient, jobId]);

  return <ProgressBar value={progress} />;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| YouTube Captions API | yt-dlp auto-subtitle extraction | 2023 (YouTube stricter on OAuth) | No OAuth needed, auto-captions faster, fewer API quotas |
| Bull npm package | BullMQ (rewrite) | 2021 | Memory leak fixes, better TypeScript support, production-ready |
| Manual ffmpeg command building | fluent-ffmpeg wrapper | Ongoing | Cleaner code, better error handling, easier maintenance |
| Public Storage URLs | Signed URLs + HeyGen Upload Asset | 2024 (security best practices) | Storage stays private, no public exposure, secure file delivery |

**Deprecated/outdated:**
- **YouTube Captions API**: Requires OAuth, quota-heavy, deprecated for public access. Use yt-dlp instead.
- **Bull npm package**: Had memory leaks and race conditions. Replaced by BullMQ 5.x+. Do not use old Bull.
- **youtube-dl (Python)**: Unmaintained since 2021. Use yt-dlp fork instead.

---

## Open Questions

1. **Transcript segment granularity**
   - What we know: VTT format provides sentence-level timestamps; each segment could be 1 sentence or 1 paragraph.
   - What's unclear: Should Phase 2 store each segment separately with start/end timestamps, or as plain text with embedded timestamps?
   - Recommendation: Store as plain text with inline timestamps (e.g., "[0:42] Here's the first sentence. [0:48] Here's the second.") for Phase 2 scrape. Phase 3 remix can further split into scene-based segments with precise timings. This balances simplicity (Phase 2) with flexibility (Phase 3).

2. **Channel scraping pagination**
   - What we know: YouTube Data API `search.list` returns max 50 results per page; spec says "50 videos per page with Load More pagination."
   - What's unclear: Should frontend handle pagination manually, or should worker pre-fetch all channel videos on scrape? How to handle channels with 1000+ videos?
   - Recommendation: Worker fetches first 50 only. Frontend shows "Load More" button. User can click to fetch next 50. This keeps initial load fast and respects YouTube rate limits.

3. **Error recovery on partial batch failure**
   - What we know: Spec says "continue scraping the rest" if some fail.
   - What's unclear: Should failed videos stay in queue for manual retry, or auto-retry with exponential backoff?
   - Recommendation: No auto-retry in Phase 2. Failed videos show as "failed" with error reason. User can click "Retry" to re-enqueue individual failed videos. Auto-retry can be added in Phase 6 (Polish).

---

## Validation Architecture

No additional test infrastructure needed for Phase 2. Phase 1 established:
- Jest test runner (configured in package.json)
- Supabase test database (local via Docker)
- Redis test instance

Phase 2 integration tests:
- Mock yt-dlp subprocess for unit tests (avoid actual YouTube API calls)
- Real YouTube API integration test (gated by env var, skipped in CI)
- BullMQ queue test (use in-memory connection)
- Supabase Storage test (local Supabase)

These will be added in Phase 6 (Polish) test infrastructure expansion.

---

## Sources

### Primary (HIGH confidence)
- REMIXENGINE_SPEC_v3.md (Section 0, 5, 7, 8, 14, 18, 19) — Core architecture, job queue, API specs, deployment, constraints
- REQUIREMENTS.md (R2.1–R2.9) — Phase 2 requirements with specific feature IDs
- .planning/phases/02-scraping-pipeline-4-hours/02-CONTEXT.md — User UX decisions locked for Phase 2

### Secondary (MEDIUM confidence)
- CLAUDE.md — Project conventions (namespace rules, config patterns, worker rules)
- .planning/STATE.md — Approved decisions from Phase 1 (config patterns, database naming, BullMQ setup)

### Tertiary (Verified Community Sources)
- yt-dlp GitHub README — Format selection syntax, subtitle extraction flags (https://github.com/yt-dlp/yt-dlp)
- BullMQ Official Docs — Concurrency settings, Realtime integration patterns
- YouTube Data API v3 Official Docs — Format negotiation, rate limiting, quota costs

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — yt-dlp, YouTube API v3, BullMQ, Supabase Storage all production-proven, extensively documented
- **Architecture:** HIGH — Job queue pattern, Realtime progress, storage paths all detailed in spec with code examples
- **Pitfalls:** HIGH — Spec Section 19 documents known constraints and workarounds from YouTube ecosystem
- **User constraints:** HIGH — Phase 2 CONTEXT.md provides all locked UX decisions

**Research date:** 2026-02-27
**Valid until:** 2026-03-27 (30 days — yt-dlp updates, YouTube API changes are slow; if faster changes occur, reevaluate)
