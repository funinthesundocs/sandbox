import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { remixQueue } from '@/lib/queue/queues';

// Use broad UUID regex — Zod v4 enforces strict version bits (rejects all-letter test UUIDs)
const uuidSchema = z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, 'Invalid UUID format');

const BodySchema = z.object({
  videoId: uuidSchema,
  projectId: uuidSchema,
  stylePromptOverride: z.string().optional(), // For per-thumbnail regeneration
  style: z.enum(['bold-text-overlay', 'cinematic-scene', 'face-reaction']).optional(), // If omitted, generate all 3
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { videoId, projectId, style, stylePromptOverride } = body.data;

  const { data: video } = await supabase
    .from('re_videos')
    .select('original_title, original_description, original_thumbnail_url')
    .eq('id', videoId)
    .single();
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

  const stylesToGenerate: Array<'bold-text-overlay' | 'cinematic-scene' | 'face-reaction'> =
    style ? [style] : ['bold-text-overlay', 'cinematic-scene', 'face-reaction'];

  const jobIds: string[] = [];
  for (const s of stylesToGenerate) {
    const { data: job } = await supabase
      .from('re_jobs')
      .insert({ type: 'remix_thumbnail', video_id: videoId, project_id: projectId, status: 'queued', created_by: user.id })
      .select('id')
      .single();

    await remixQueue.add('remix_thumbnail', {
      type: 'thumbnail',
      jobId: job!.id,
      videoId,
      projectId,
      style: s,
      stylePromptOverride,
      video: { originalTitle: video.original_title, originalDescription: video.original_description, originalThumbnailUrl: video.original_thumbnail_url },
    });
    jobIds.push(job!.id);
  }

  return NextResponse.json({ jobIds, videoId }, { status: 202 });
}
