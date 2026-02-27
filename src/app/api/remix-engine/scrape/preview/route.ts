// src/app/api/remix-engine/scrape/preview/route.ts
// POST — Fetch YouTube video metadata preview without downloading the video.
// Used by the UI to show title/thumbnail/duration before the user confirms scrape.
//
// Returns:
//   200 { preview: { youtubeId, title, thumbnailUrl, durationSeconds, channelName, viewCount }, existing: bool }
//   200 { existing: true, videoId, scrapeStatus } — already in project
//   400 { error }   — missing/invalid URL, non-video URL, or URL too long
//   401 { error: 'Unauthorized' }
//   422 { error: 'TOO_LONG', message }  — video exceeds 20-minute maximum

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { fetchVideoMetadata } from '@/lib/youtube-api/metadata';
import { extractYouTubeId } from '@/lib/youtube-api/url-parser';

const PreviewRequestSchema = z.object({
  youtubeUrl: z.string().url(),
  projectId: z.string().uuid(),
});

const MAX_DURATION_SECONDS = 20 * 60; // 20 minutes

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const result = PreviewRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { youtubeUrl, projectId } = result.data;

  // Extract video ID (throws for non-video URLs)
  let youtubeId: string;
  try {
    youtubeId = extractYouTubeId(youtubeUrl);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid YouTube video URL' },
      { status: 400 }
    );
  }

  // Fetch metadata from YouTube API (no download)
  let metadata: Awaited<ReturnType<typeof fetchVideoMetadata>>;
  try {
    metadata = await fetchVideoMetadata(youtubeId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch video metadata';
    if (message === 'VIDEO_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Video not found or is private' },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Check for duplicate in project
  const { data: existing } = await supabaseAdmin
    .from('re_videos')
    .select('id, scrape_status')
    .eq('youtube_id', youtubeId)
    .eq('project_id', projectId)
    .single();

  if (existing) {
    return NextResponse.json(
      { existing: true, videoId: existing.id, scrapeStatus: existing.scrape_status },
      { status: 200 }
    );
  }

  // Enforce duration limit
  if (metadata.durationSeconds > MAX_DURATION_SECONDS) {
    return NextResponse.json(
      {
        error: 'TOO_LONG',
        message: `Video is ${Math.round(metadata.durationSeconds / 60)} minutes. Maximum is 20 minutes.`,
      },
      { status: 422 }
    );
  }

  return NextResponse.json({
    preview: {
      youtubeId,
      title: metadata.title,
      thumbnailUrl: metadata.thumbnailUrl,
      durationSeconds: metadata.durationSeconds,
      channelName: metadata.channelName,
      viewCount: metadata.viewCount,
    },
    existing: false,
  });
}
