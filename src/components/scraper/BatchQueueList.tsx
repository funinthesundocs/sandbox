'use client';

// src/components/scraper/BatchQueueList.tsx
// Shows batch scrape queue with per-video status and overall progress bar.
// Used by ChannelBrowser after a batch scrape is submitted.

import { RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface QueueItem {
  jobId: string;
  videoId: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  status: 'queued' | 'processing' | 'complete' | 'error' | 'cancelled';
  progress: number;
  errorMessage?: string | null;
}

interface BatchQueueListProps {
  items: QueueItem[];
  onRetry?: (item: QueueItem) => void;
  onCancelJob?: (jobId: string) => void;
}

const STATUS_BADGE_CLASSES: Record<QueueItem['status'], string> = {
  queued: 'text-[--re-text-muted] bg-[--re-bg-hover]',
  processing: 'text-[--re-accent-primary] bg-[--re-accent-primary]/10',
  complete: 'text-[--re-success] bg-[--re-success]/10',
  error: 'text-[--re-destructive] bg-[--re-destructive]/10',
  cancelled: 'text-[--re-text-disabled] bg-[--re-bg-hover]',
};

const STATUS_LABELS: Record<QueueItem['status'], string> = {
  queued: 'Queued',
  processing: 'Scraping',
  complete: 'Done',
  error: 'Failed',
  cancelled: 'Cancelled',
};

export function BatchQueueList({ items, onRetry, onCancelJob }: BatchQueueListProps) {
  const completedCount = items.filter((item) => item.status === 'complete').length;

  const overallProgress =
    items.length === 0
      ? 0
      : Math.round(
          items.reduce((acc, item) => {
            if (item.status === 'complete') return acc + 100;
            if (item.status === 'error') return acc + 0;
            return acc + item.progress;
          }, 0) /
            (items.length * 100) *
            100
        );

  return (
    <div className="space-y-3">
      {/* Overall progress bar */}
      <div className="bg-[--re-bg-secondary] rounded-[--re-border-radius] p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[--re-text-primary] font-medium">
            {completedCount}/{items.length} videos scraped
          </span>
          <span className="text-[--re-text-muted]">{overallProgress}%</span>
        </div>
        <div className="h-2 bg-[--re-bg-hover] rounded-full overflow-hidden">
          <div
            className="h-full bg-[--re-accent-primary] rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Per-video queue rows */}
      {items.map((item) => (
        <div
          key={item.jobId}
          className="flex items-center gap-3 p-3 rounded-[--re-border-radius] bg-[--re-bg-secondary]/60 backdrop-blur-md border border-[--re-border]/60"
        >
          <img
            src={item.thumbnailUrl}
            alt=""
            className="w-16 h-9 object-cover rounded flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[--re-text-primary] text-sm truncate">
              {item.title || item.youtubeId}
            </p>
            {/* Progress bar for processing items */}
            {item.status === 'processing' && (
              <div className="h-1 bg-[--re-bg-hover] rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-[--re-accent-primary] rounded-full transition-all duration-500"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            )}
            {item.status === 'error' && (
              <p className="text-[--re-destructive] text-xs mt-1 truncate">
                {item.errorMessage || 'Scrape failed'}
              </p>
            )}
          </div>
          {/* Status badge */}
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_BADGE_CLASSES[item.status]}`}
          >
            {STATUS_LABELS[item.status]}
          </span>
          {/* Actions */}
          <div className="flex gap-1">
            {item.status === 'error' && onRetry && (
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={() => onRetry(item)}
                title="Retry"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
            {(item.status === 'queued' || item.status === 'processing') &&
              onCancelJob && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-[--re-text-muted]"
                  onClick={() => onCancelJob(item.jobId)}
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
          </div>
        </div>
      ))}
    </div>
  );
}
