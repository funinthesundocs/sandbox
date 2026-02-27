// src/app/(dashboard)/projects/[id]/videos/[videoId]/remix/page.tsx
// Server component — remix review page: fetches all remix data from DB.
// Full interactive UI is added in Plan 05 via RemixReviewPage client component.

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { PipelineTabs } from '@/components/remix/PipelineTabs';
import { RemixReviewPage as RemixReviewPageClient } from '@/components/remix/RemixReviewPage';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default async function RemixReviewPage({
  params,
}: {
  params: Promise<{ id: string; videoId: string }>;
}) {
  const { id: projectId, videoId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch video
  const { data: video } = await supabase
    .from('re_videos')
    .select('id, original_title, remix_status, generation_status, scrape_status')
    .eq('id', videoId)
    .eq('project_id', projectId)
    .single();
  if (!video) notFound();

  // Fetch remix data using admin client (bypasses RLS for cross-table reads)
  const [titlesResult, thumbnailsResult, scriptsResult] = await Promise.all([
    supabaseAdmin
      .from('re_remixed_titles')
      .select('id, style, title, reasoning, is_selected')
      .eq('video_id', videoId)
      .order('created_at'),
    supabaseAdmin
      .from('re_remixed_thumbnails')
      .select('id, prompt, file_path, is_selected')
      .eq('video_id', videoId)
      .order('created_at'),
    supabaseAdmin
      .from('re_remixed_scripts')
      .select(
        `
        id, full_script, tone, total_duration_seconds, is_selected,
        re_scenes ( id, scene_number, dialogue_line, duration_seconds, broll_description, on_screen_text )
      `
      )
      .eq('video_id', videoId)
      .order('created_at'),
  ]);

  const titles = titlesResult.data ?? [];
  const thumbnails = thumbnailsResult.data ?? [];
  const scripts = scriptsResult.data ?? [];
  const scenes =
    (scripts[0] as { re_scenes?: unknown[] } | undefined)?.re_scenes ?? [];

  // Generate signed URLs for thumbnails (1-hour expiry, storage stays private)
  const thumbnailsWithUrls = await Promise.all(
    thumbnails.map(async (thumb) => {
      const { data } = await supabaseAdmin.storage
        .from('remix-engine')
        .createSignedUrl(thumb.file_path, 3600);
      return { ...thumb, signedUrl: data?.signedUrl ?? null };
    })
  );

  const isRemixProcessing = video.remix_status === 'processing';
  const isRemixPending = video.remix_status === 'pending';

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/dashboard/projects/${projectId}/videos/${videoId}`}
        className="inline-flex items-center gap-1 text-sm hover:text-[--re-text-primary] transition-colors mb-4"
        style={{ color: 'var(--re-text-muted)' }}
      >
        <ChevronLeft className="w-4 h-4" />
        Back to video
      </Link>

      <h1
        className="font-semibold leading-snug mb-1"
        style={{
          fontSize: 'var(--re-text-xl)',
          color: 'var(--re-text-primary)',
        }}
      >
        {video.original_title ?? 'Untitled Video'}
      </h1>

      <PipelineTabs
        projectId={projectId}
        videoId={videoId}
        scrapeStatus={video.scrape_status}
        remixStatus={video.remix_status}
        generationStatus={video.generation_status}
        activeTab="remix"
      />

      {/* Processing state */}
      {(isRemixProcessing || isRemixPending) && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2
            className="w-10 h-10 animate-spin"
            style={{ color: 'var(--re-accent-primary)' }}
          />
          <p style={{ color: 'var(--re-text-secondary)' }}>
            {isRemixPending
              ? 'Remix is queued and will start shortly...'
              : 'Generating remix content... this may take a minute.'}
          </p>
          <p className="text-xs" style={{ color: 'var(--re-text-muted)' }}>
            This page auto-refreshes. You can also leave and come back.
          </p>
        </div>
      )}

      {/* Full interactive review UI */}
      {video.remix_status === 'complete' && (
        <RemixReviewPageClient
          videoId={videoId}
          projectId={projectId}
          titles={titles}
          thumbnails={thumbnailsWithUrls}
          scenes={scenes as Array<{ id: string; scene_number: number; dialogue_line: string; duration_seconds: number; broll_description: string }>}
        />
      )}

      {/* Error state */}
      {video.remix_status === 'error' && (
        <div
          className="text-sm px-4 py-3 rounded"
          style={{
            background: 'var(--re-bg-secondary)',
            color: 'var(--re-destructive)',
            border: '1px solid var(--re-destructive)',
          }}
        >
          Remix failed. Check the job log or try starting remix again from the
          video page.
        </div>
      )}
    </div>
  );
}
