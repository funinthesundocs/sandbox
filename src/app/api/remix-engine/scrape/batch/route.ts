// src/app/api/remix-engine/scrape/batch/route.ts
// POST — Enqueue up to 10 YouTube video scrape jobs in a single request.
// URLs are processed sequentially to avoid overwhelming the database.
//
// Returns:
//   201 {
//     enqueued:   [{ videoId, jobId, youtubeId }],
//     duplicates: [{ videoId, youtubeId, scrapeStatus }],
//     errors:     [{ url, error }]
//   }
//   400 { error }  — validation failure
//   401 { error: 'Unauthorized' }

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { scrapeQueue } from '@/lib/queue/queues';
import { extractYouTubeId } from '@/lib/youtube-api/url-parser';

const BatchScrapeBodySchema = z.object({
  youtubeUrls: z
    .array(z.string().url())
    .min(1, 'At least one URL is required')
    .max(10, 'Maximum 10 URLs per batch request'),
  projectId: z.string().uuid(),
});

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

  const result = BatchScrapeBodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { youtubeUrls, projectId } = result.data;

  const enqueued: Array<{ videoId: string; jobId: string; youtubeId: string }> = [];
  const duplicates: Array<{ videoId: string; youtubeId: string; scrapeStatus: string }> = [];
  const errors: Array<{ url: string; error: string }> = [];

  // Process URLs sequentially (max 10) to avoid DB overload
  for (const youtubeUrl of youtubeUrls) {
    // Extract YouTube video ID
    let youtubeId: string;
    try {
      youtubeId = extractYouTubeId(youtubeUrl);
    } catch (err) {
      errors.push({
        url: youtubeUrl,
        error: err instanceof Error ? err.message : 'Invalid YouTube video URL',
      });
      continue;
    }

    // Check for duplicate
    const { data: existing } = await supabaseAdmin
      .from('re_videos')
      .select('id, scrape_status')
      .eq('youtube_id', youtubeId)
      .eq('project_id', projectId)
      .single();

    if (existing) {
      duplicates.push({
        videoId: existing.id,
        youtubeId,
        scrapeStatus: existing.scrape_status,
      });
      continue;
    }

    // Create re_videos record
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
      errors.push({ url: youtubeUrl, error: 'Failed to create video record' });
      continue;
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
      errors.push({ url: youtubeUrl, error: 'Failed to create job record' });
      continue;
    }

    // Enqueue BullMQ scrape job
    try {
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

      enqueued.push({ videoId, jobId, youtubeId });
    } catch (err) {
      errors.push({
        url: youtubeUrl,
        error: err instanceof Error ? err.message : 'Failed to enqueue job',
      });
    }
  }

  return NextResponse.json({ enqueued, duplicates, errors }, { status: 201 });
}
