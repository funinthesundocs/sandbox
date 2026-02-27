// src/app/(dashboard)/projects/[id]/videos/[videoId]/page.tsx
// Server component — video detail page: player, metadata header, transcript panel.

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Wand2, RefreshCw, Download, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Button } from '@/components/ui/button';
import { VideoDetailLayout } from '@/components/scraper/VideoDetailLayout';

// --- Helpers ---

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `0:${String(seconds).padStart(2, '0')}`;
  }
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K views`;
  return `${count} views`;
}

// --- Transcript segment type ---

interface TranscriptSegment {
  timestamp: string;
  startMs: number;
  text: string;
}

// --- Page ---

export default async function VideoDetailPage({
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

  // Fetch video — scoped to project for RLS + path validation
  const { data: video } = await supabase
    .from('re_videos')
    .select('*')
    .eq('id', videoId)
    .eq('project_id', projectId)
    .single();

  if (!video) notFound();

  // Load transcript segments from storage (if available)
  let transcriptSegments: TranscriptSegment[] = [];
  if (video.transcript_file_path) {
    const { data: signedData } = await supabaseAdmin.storage
      .from('remix-engine')
      .createSignedUrl(video.transcript_file_path, 300); // 5-min for SSR fetch

    if (signedData?.signedUrl) {
      try {
        const res = await fetch(signedData.signedUrl);
        if (res.ok) {
          transcriptSegments = await res.json();
        }
      } catch {
        // If fetch fails, show empty transcript — not a fatal error
      }
    }
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="inline-flex items-center gap-1 text-[--re-text-muted] text-sm hover:text-[--re-text-primary] transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to project
      </Link>

      {/* Title + action buttons row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1
            className="font-semibold text-[--re-text-primary] leading-snug"
            style={{ fontSize: 'var(--re-text-xl)' }}
          >
            {video.original_title ?? 'Untitled Video'}
          </h1>

          {/* Metadata chips */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {video.duration_seconds != null && (
              <span className="text-xs px-2 py-0.5 rounded-[--re-border-radius-sm] bg-[--re-bg-hover] text-[--re-text-secondary] font-mono">
                {formatDuration(video.duration_seconds)}
              </span>
            )}
            {video.channel_name && (
              <span className="text-xs text-[--re-text-muted]">{video.channel_name}</span>
            )}
            {video.view_count != null && (
              <span className="text-xs text-[--re-text-muted]">
                {formatViewCount(video.view_count)}
              </span>
            )}
            {video.published_at && (
              <span className="text-xs text-[--re-text-muted]">
                Published {new Date(video.published_at).toLocaleDateString()}
              </span>
            )}
            {video.created_at && (
              <span className="text-xs text-[--re-text-muted]">
                Scraped {new Date(video.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="default" size="sm" disabled>
            <Wand2 className="w-4 h-4 mr-1" />
            Start Remix
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Re-scrape
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/remix-engine/videos/${videoId}/signed-url`} download>
              <Download className="w-4 h-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[--re-destructive] hover:text-[--re-destructive]"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Responsive grid: player + transcript (managed by client layout component) */}
      <VideoDetailLayout
        youtubeId={video.youtube_id}
        videoId={videoId}
        transcriptSegments={transcriptSegments}
      />
    </div>
  );
}
