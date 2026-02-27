'use client';

import Link from 'next/link';
import { Video } from 'lucide-react';

interface VideoCardProps {
  video: {
    id: string;
    youtube_id: string;
    original_title: string | null;
    original_thumbnail_url: string | null;
    channel_name: string | null;
    duration_seconds: number | null;
    scrape_status: 'pending' | 'processing' | 'complete' | 'error';
    view_count: number | null;
  };
  projectId: string;
}

const STATUS_CONFIG = {
  pending: {
    label: 'Queued',
    color: 'text-[--re-text-muted]',
    bg: 'bg-[--re-bg-hover]',
  },
  processing: {
    label: 'Scraping',
    color: 'text-[--re-accent-primary]',
    bg: 'bg-[--re-accent-primary]/10',
  },
  complete: {
    label: 'Ready',
    color: 'text-[--re-success]',
    bg: 'bg-[--re-success]/10',
  },
  error: {
    label: 'Error',
    color: 'text-[--re-destructive]',
    bg: 'bg-[--re-destructive]/10',
  },
} as const;

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

export function VideoCard({ video, projectId }: VideoCardProps) {
  const status = STATUS_CONFIG[video.scrape_status];

  return (
    <Link href={`/dashboard/projects/${projectId}/videos/${video.id}`}>
      <div className="group flex flex-col overflow-hidden rounded-[--re-border-radius] bg-[--re-bg-secondary]/60 backdrop-blur-md border border-[--re-border]/60 hover:border-[--re-accent-primary]/40 transition-all duration-200 hover:shadow-[0_0_20px_hsl(217_91%_60%/0.12)] cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-[--re-bg-hover] overflow-hidden">
          {video.original_thumbnail_url ? (
            <img
              src={video.original_thumbnail_url}
              alt={video.original_title || ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="w-8 h-8 text-[--re-text-disabled]" />
            </div>
          )}
          {/* Duration badge — bottom right of thumbnail */}
          {video.duration_seconds != null && (
            <span className="absolute bottom-2 right-2 text-xs px-1.5 py-0.5 rounded bg-black/70 text-white font-mono">
              {formatDuration(video.duration_seconds)}
            </span>
          )}
          {/* Status badge — top right of thumbnail */}
          <span
            className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${status.color} ${status.bg}`}
          >
            {status.label}
          </span>
        </div>
        {/* Card body */}
        <div className="p-3 flex-1">
          <p className="text-[--re-text-primary] text-sm font-medium line-clamp-2 leading-snug">
            {video.original_title || 'Loading...'}
          </p>
          <p className="text-[--re-text-muted] text-xs mt-1 truncate">
            {video.channel_name || ''}
          </p>
        </div>
      </div>
    </Link>
  );
}
