// src/worker/handlers/remix.ts
// BullMQ remix job handler — runs OUTSIDE Next.js. Relative imports only.

import { Job } from 'bullmq';
import { supabaseAdmin } from '../../lib/supabase/admin';
import { generateTitleVariations } from '../../lib/remix/title-remixer';
import { generateThumbnailVariation } from '../../lib/remix/thumbnail-remixer';
import { generateRemixedScript } from '../../lib/remix/script-remixer';
import { storagePath } from '../../lib/remix-engine/hooks';

export interface RemixJobData {
  type: 'title' | 'thumbnail' | 'script';
  jobId: string;
  videoId: string;
  projectId: string;
  style?: 'bold-text-overlay' | 'cinematic-scene' | 'face-reaction';
  stylePromptOverride?: string;
  video: {
    originalTitle?: string | null;
    description?: string | null;
    originalDescription?: string | null;
    channelName?: string | null;
    durationSeconds?: number | null;
    originalTranscript?: string | null;
    originalThumbnailUrl?: string | null;
  };
}

/**
 * Fire-and-forget DB helper: executes a Supabase PromiseLike query without blocking.
 * Status updates and idempotent deletes are best-effort — errors are logged, not thrown.
 * Uses Promise.resolve() to coerce PromiseLike → Promise (adds .catch support).
 */
function fireQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: PromiseLike<any>,
  context: string
): void {
  Promise.resolve(query).catch((err: unknown) => {
    console.error(`[remixWorker] DB fire-and-forget error in ${context}:`, err);
  });
}

/**
 * Update re_jobs status — fire-and-forget.
 */
function updateJobStatus(jobId: string, status: 'processing' | 'complete' | 'error', errorMessage?: string): void {
  const query = supabaseAdmin.from('re_jobs').update({
    status,
    ...(status === 'processing' ? { started_at: new Date().toISOString() } : {}),
    ...(status !== 'processing' ? { completed_at: new Date().toISOString() } : {}),
    ...(errorMessage ? { error_message: errorMessage } : {}),
  }).eq('id', jobId);
  fireQuery(query, `updateJobStatus(${jobId}, ${status})`);
}

export async function handleRemixJob(job: Job<RemixJobData>): Promise<void> {
  const { type, jobId } = job.data;

  updateJobStatus(jobId, 'processing');
  await job.updateProgress(10);

  try {
    if (type === 'title') {
      await handleTitleRemix(job);
    } else if (type === 'thumbnail') {
      await handleThumbnailRemix(job);
    } else if (type === 'script') {
      await handleScriptRemix(job);
    } else {
      throw new Error(`Unknown remix job type: ${type}`);
    }

    updateJobStatus(jobId, 'complete');
    await job.updateProgress(100);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    updateJobStatus(jobId, 'error', message);
    throw err; // Re-throw so BullMQ marks job as failed
  }
}

async function handleTitleRemix(job: Job<RemixJobData>): Promise<void> {
  const { videoId, video } = job.data;

  const result = await generateTitleVariations({
    originalTitle: video.originalTitle ?? 'Untitled',
    description: video.description ?? video.originalDescription ?? '',
    channelName: video.channelName ?? '',
    videoDuration: video.durationSeconds ?? undefined,
  });

  await job.updateProgress(70);

  // Delete existing titles for this video (idempotent on regeneration) — fire-and-forget
  fireQuery(
    supabaseAdmin.from('re_remixed_titles').delete().eq('video_id', videoId),
    'delete re_remixed_titles'
  );

  // Insert all 8 variations with is_selected=false — fire-and-forget
  const inserts = result.variations.map((v) => ({
    video_id: videoId,
    style: v.style,
    title: v.title,
    reasoning: v.reasoning,
    is_selected: false,
  }));
  fireQuery(
    supabaseAdmin.from('re_remixed_titles').insert(inserts),
    'insert re_remixed_titles'
  );

  // Update video remix status — fire-and-forget
  fireQuery(
    supabaseAdmin.from('re_videos').update({ remix_status: 'complete' }).eq('id', videoId),
    'update re_videos remix_status (title)'
  );
}

async function handleThumbnailRemix(job: Job<RemixJobData>): Promise<void> {
  const { videoId, projectId, style, stylePromptOverride, video } = job.data;

  if (!style) throw new Error('Thumbnail remix job missing style');

  const result = await generateThumbnailVariation(
    {
      videoId,
      originalThumbnailUrl: video.originalThumbnailUrl ?? undefined,
      videoTitle: video.originalTitle ?? 'Untitled',
      videoDescription: video.originalDescription ?? video.description ?? '',
      style,
      stylePromptOverride,
    },
    (status) => { job.updateProgress(50); console.log(`[remix:thumbnail] ${status}`); }
  );

  await job.updateProgress(70);

  // Download fal.ai image and upload to Supabase Storage (fal.ai URLs are temporary)
  const styleSlug = style.replace(/-/g, '_');
  const storageDest = storagePath('videos', projectId, videoId, 'thumbnails', `${styleSlug}.jpg`);

  const imageResponse = await fetch(result.falUrl);
  if (!imageResponse.ok) throw new Error(`Failed to download fal.ai thumbnail: ${imageResponse.status}`);
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from('remix-engine')
    .upload(storageDest, imageBuffer, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) throw new Error(`Failed to upload thumbnail: ${uploadError.message}`);

  await job.updateProgress(90);

  // Delete existing thumbnail for this style (idempotent) — fire-and-forget
  fireQuery(
    supabaseAdmin.from('re_remixed_thumbnails')
      .delete()
      .eq('video_id', videoId)
      .like('file_path', `%${styleSlug}%`),
    'delete re_remixed_thumbnails'
  );

  // Insert thumbnail record — fire-and-forget
  fireQuery(
    supabaseAdmin.from('re_remixed_thumbnails').insert({
      video_id: videoId,
      prompt: result.prompt,
      analysis: result.analysis,
      file_path: storageDest,
      is_selected: false,
    }),
    'insert re_remixed_thumbnails'
  );
}

async function handleScriptRemix(job: Job<RemixJobData>): Promise<void> {
  const { videoId, video } = job.data;

  if (!video.originalTranscript) throw new Error('Script remix job missing originalTranscript');

  const result = await generateRemixedScript({
    originalTitle: video.originalTitle ?? 'Untitled',
    originalTranscript: video.originalTranscript,
    channelName: video.channelName ?? '',
    targetDurationSeconds: video.durationSeconds ?? undefined,
  });

  await job.updateProgress(70);

  // Delete existing scripts for this video (idempotent on regeneration) — fire-and-forget.
  // Scenes cascade-delete via FK on re_scenes.script_id → re_remixed_scripts.id.
  fireQuery(
    supabaseAdmin.from('re_remixed_scripts').delete().eq('video_id', videoId),
    'delete re_remixed_scripts'
  );

  // Calculate total duration
  const totalDuration = result.scenes.reduce((sum, s) => sum + s.duration_seconds, 0);

  // Insert script record — needs .single() to be awaitable
  const { data: scriptRecord, error: scriptError } = await supabaseAdmin
    .from('re_remixed_scripts')
    .insert({
      video_id: videoId,
      full_script: result.scenes.map((s) => s.dialogue_line).join('\n\n'),
      tone: result.tone ?? null,
      target_audience: result.target_audience ?? null,
      total_duration_seconds: totalDuration,
      is_selected: false,
    })
    .select('id')
    .single();
  if (scriptError) throw new Error(`Failed to save script: ${scriptError.message}`);

  // Insert scenes sequentially to respect UNIQUE(script_id, scene_number) constraint
  for (const scene of result.scenes) {
    const { error: sceneError } = await supabaseAdmin.from('re_scenes').insert({
      script_id: scriptRecord!.id,
      scene_number: scene.scene_number,
      dialogue_line: scene.dialogue_line,
      duration_seconds: scene.duration_seconds,
      broll_description: scene.broll_description,
      on_screen_text: scene.on_screen_text ?? null,
    }).select('id').single();
    if (sceneError) throw new Error(`Failed to save scene ${scene.scene_number}: ${sceneError.message}`);
  }

  // Update video remix status — fire-and-forget
  fireQuery(
    supabaseAdmin.from('re_videos').update({ remix_status: 'complete' }).eq('id', videoId),
    'update re_videos remix_status (script)'
  );
}
