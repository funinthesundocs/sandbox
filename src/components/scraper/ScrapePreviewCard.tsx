'use client';

import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScrapePreviewCardProps {
  preview: {
    youtubeId: string;
    title: string;
    thumbnailUrl: string;
    durationSeconds: number;
    channelName: string;
    viewCount: number;
  };
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

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
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M views`;
  }
  if (count >= 1_000) {
    return `${Math.round(count / 1_000)}K views`;
  }
  return `${count} views`;
}

export function ScrapePreviewCard({
  preview,
  onConfirm,
  onCancel,
  isLoading,
}: ScrapePreviewCardProps) {
  return (
    <div
      className="flex gap-4 p-4 rounded-[--re-border-radius] bg-[--re-bg-secondary]/60 backdrop-blur-md border border-[--re-border]/60"
      style={{ boxShadow: '0 4px 24px hsl(240 10% 2% / 0.4)' }}
    >
      {/* Thumbnail */}
      <img
        src={preview.thumbnailUrl}
        alt={preview.title}
        className="w-48 h-27 object-cover rounded-[--re-border-radius-sm] flex-shrink-0"
        style={{ width: '12rem', height: '6.75rem' }}
      />
      {/* Metadata */}
      <div className="flex-1 min-w-0">
        <h3 className="text-[--re-text-primary] font-medium text-base leading-snug line-clamp-2">
          {preview.title}
        </h3>
        <p className="text-[--re-text-muted] text-sm mt-1">{preview.channelName}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs px-2 py-0.5 rounded bg-[--re-bg-hover] text-[--re-text-secondary] font-mono">
            {formatDuration(preview.durationSeconds)}
          </span>
          <span className="text-[--re-text-muted] text-xs">
            {formatViewCount(preview.viewCount)}
          </span>
        </div>
        <div className="flex gap-3 mt-4">
          <Button onClick={onConfirm} disabled={isLoading} size="sm">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Scrape Video
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
