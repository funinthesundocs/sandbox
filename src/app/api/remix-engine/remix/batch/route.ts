import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { remixQueue } from '@/lib/queue/queues';

// Use broad UUID regex — Zod v4 enforces strict version bits (rejects all-letter test UUIDs)
const uuidSchema = z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, 'Invalid UUID format');

const BodySchema = z.object({
  projectId: uuidSchema,
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = BodySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { projectId } = body.data;

  // Fetch all scraped videos in project
  const { data: videos } = await supabase
    .from('re_videos')
    .select('id, original_title, original_description, original_transcript, original_thumbnail_url, channel_name, duration_seconds')
    .eq('project_id', projectId)
    .eq('scrape_status', 'complete');

  if (!videos || videos.length === 0) {
    return NextResponse.json({ error: 'No scraped videos found in project' }, { status: 404 });
  }

  const enqueuedJobs: Array<{ videoId: string; jobIds: string[] }> = [];

  for (const video of videos) {
    const videoJobIds: string[] = [];

    // Title job
    const { data: titleJob } = await supabase
      .from('re_jobs')
      .insert({ type: 'remix_title', video_id: video.id, project_id: projectId, status: 'queued', created_by: user.id })
      .select('id').single();
    await remixQueue.add('remix_title', {
      type: 'title', jobId: titleJob!.id, videoId: video.id, projectId,
      video: { originalTitle: video.original_title, description: video.original_description, channelName: video.channel_name, durationSeconds: video.duration_seconds },
    });
    videoJobIds.push(titleJob!.id);

    // Thumbnail jobs (3 styles)
    for (const style of ['bold-text-overlay', 'cinematic-scene', 'face-reaction'] as const) {
      const { data: thumbJob } = await supabase
        .from('re_jobs')
        .insert({ type: 'remix_thumbnail', video_id: video.id, project_id: projectId, status: 'queued', created_by: user.id })
        .select('id').single();
      await remixQueue.add('remix_thumbnail', {
        type: 'thumbnail', jobId: thumbJob!.id, videoId: video.id, projectId, style,
        video: { originalTitle: video.original_title, originalDescription: video.original_description, originalThumbnailUrl: video.original_thumbnail_url },
      });
      videoJobIds.push(thumbJob!.id);
    }

    // Script job (only if transcript available)
    if (video.original_transcript) {
      const { data: scriptJob } = await supabase
        .from('re_jobs')
        .insert({ type: 'remix_script', video_id: video.id, project_id: projectId, status: 'queued', created_by: user.id })
        .select('id').single();
      await remixQueue.add('remix_script', {
        type: 'script', jobId: scriptJob!.id, videoId: video.id, projectId,
        video: { originalTitle: video.original_title, originalTranscript: video.original_transcript, channelName: video.channel_name, durationSeconds: video.duration_seconds },
      });
      videoJobIds.push(scriptJob!.id);
    }

    enqueuedJobs.push({ videoId: video.id, jobIds: videoJobIds });
  }

  return NextResponse.json({ enqueuedJobs, videoCount: videos.length }, { status: 202 });
}
