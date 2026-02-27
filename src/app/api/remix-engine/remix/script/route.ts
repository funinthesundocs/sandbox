import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { remixQueue } from '@/lib/queue/queues';

// Use broad UUID regex — Zod v4 enforces strict version bits (rejects all-letter test UUIDs)
const uuidSchema = z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, 'Invalid UUID format');

const BodySchema = z.object({
  videoId: uuidSchema,
  projectId: uuidSchema,
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { videoId, projectId } = body.data;

  const { data: video } = await supabase
    .from('re_videos')
    .select('original_title, original_description, original_transcript, channel_name, duration_seconds')
    .eq('id', videoId)
    .single();
  if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  if (!video.original_transcript) return NextResponse.json({ error: 'Video has no transcript to remix' }, { status: 422 });

  const { data: job } = await supabase
    .from('re_jobs')
    .insert({ type: 'remix_script', video_id: videoId, project_id: projectId, status: 'queued', created_by: user.id })
    .select('id')
    .single();

  await remixQueue.add('remix_script', {
    type: 'script',
    jobId: job!.id,
    videoId,
    projectId,
    video: { originalTitle: video.original_title, originalTranscript: video.original_transcript, channelName: video.channel_name, durationSeconds: video.duration_seconds },
  });

  return NextResponse.json({ jobId: job!.id, videoId }, { status: 202 });
}
