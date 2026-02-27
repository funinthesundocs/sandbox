'use client';

import { Video } from 'lucide-react';
import { VideoCard } from './VideoCard';

interface VideoCardVideo {
  id: string;
  youtube_id: string;
  original_title: string | null;
  original_thumbnail_url: string | null;
  channel_name: string | null;
  duration_seconds: number | null;
  scrape_status: 'pending' | 'processing' | 'complete' | 'error';
  view_count: number | null;
}

interface VideoGridProps {
  videos: VideoCardVideo[];
  projectId: string;
  isLoading?: boolean;
}

export function VideoGrid({ videos, projectId, isLoading = false }: VideoGridProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[--re-border-radius] bg-[--re-bg-secondary] overflow-hidden animate-pulse"
          >
            <div className="aspect-video bg-[--re-bg-hover]" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-[--re-bg-hover] rounded w-full" />
              <div className="h-3 bg-[--re-bg-hover] rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Video className="w-12 h-12 text-[--re-text-disabled] mb-4" />
        <p className="text-[--re-text-primary] font-medium">No videos yet</p>
        <p className="text-[--re-text-muted] text-sm mt-1">
          Paste a YouTube URL above to start scraping
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} projectId={projectId} />
      ))}
    </div>
  );
}
