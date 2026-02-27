// src/app/api/remix-engine/scrape/route.ts
// POST — Enqueue a single YouTube video scrape job.
//
// Returns:
//   201 { jobId, videoId }               — job enqueued
//   200 { existing: true, videoId, scrapeStatus } — duplicate detected
//   400 { error }                         — validation failure
//   401 { error: 'Unauthorized' }
//   500 { error }                         — unexpected server error

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { scrapeQueue } from '@/lib/queue/queues';
import { ScrapeRequestSchema } from '@/lib/validators/schemas';
import { extractYouTubeId } from '@/lib/youtube-api/url-parser';

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

  const result = ScrapeRequestSchema.safeParse(body);
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

  // Duplicate detection — check if this video is already in the project
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

  // Create re_videos record with pending status
  const videoId = randomUUID();
  const { error: videoInsertError } = await supabaseAdmin
    .from('re_videos')
    .insert({
      id: videoId,
      project_id: projectId,
      youtube_url: youtubeUrl,
      youtube_id: youtubeId,
      scrape_status: 'pending',
      created_by: user.id,
    });

  if (videoInsertError) {
    return NextResponse.json(
      { error: 'Failed to create video record' },
      { status: 500 }
    );
  }

  // Create re_jobs record
  const jobId = randomUUID();
  const { error: jobInsertError } = await supabaseAdmin
    .from('re_jobs')
    .insert({
      id: jobId,
      type: 'scrape',
      status: 'queued',
      video_id: videoId,
      project_id: projectId,
      progress: 0,
      created_by: user.id,
    });

  if (jobInsertError) {
    return NextResponse.json(
      { error: 'Failed to create job record' },
      { status: 500 }
    );
  }

  // Enqueue BullMQ scrape job
  await scrapeQueue.add(
    'scrape',
    {
      youtubeUrl,
      youtubeId,
      projectId,
      videoId,
      userId: user.id,
    },
    { jobId }
  );

  return NextResponse.json({ jobId, videoId }, { status: 201 });
}
