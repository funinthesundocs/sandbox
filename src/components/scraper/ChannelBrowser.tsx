'use client';

// src/components/scraper/ChannelBrowser.tsx
// Full channel browse-and-pick flow.
// Users paste a channel URL, browse thumbnails, select up to 10 videos,
// and dispatch a batch scrape.

import { useState } from 'react';
import { Loader2, List, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChannelVideoGrid } from './ChannelVideoGrid';
import { BatchQueueList, QueueItem } from './BatchQueueList';
import type { ChannelVideo } from '@/lib/youtube-api/channel';

interface ChannelBrowserProps {
  projectId: string;
}

export function ChannelBrowser({ projectId }: ChannelBrowserProps) {
  const [channelUrl, setChannelUrl] = useState('');
  const [isLoadingChannel, setIsLoadingChannel] = useState(false);
  const [channelVideos, setChannelVideos] = useState<ChannelVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isBatchScraping, setIsBatchScraping] = useState(false);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleChannelFetch() {
    setIsLoadingChannel(true);
    setError(null);
    setChannelVideos([]);
    setSelected(new Set());

    try {
      const res = await fetch(
        `/api/remix-engine/channel?channelUrl=${encodeURIComponent(channelUrl)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not load channel videos');
        return;
      }
      setChannelVideos(data.items);
      setNextPageToken(data.nextPageToken);
      setTotalResults(data.totalResults);
      setChannelId(data.channelId);
    } catch {
      setError('Network error — could not load channel videos');
    } finally {
      setIsLoadingChannel(false);
    }
  }

  async function handleLoadMore() {
    if (!nextPageToken) return;
    try {
      const res = await fetch(
        `/api/remix-engine/channel?channelUrl=${encodeURIComponent(channelUrl)}&pageToken=${encodeURIComponent(nextPageToken)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not load more videos');
        return;
      }
      setChannelVideos((prev) => [...prev, ...data.items]);
      setNextPageToken(data.nextPageToken);
    } catch {
      setError('Network error — could not load more videos');
    }
  }

  function handleToggleVideo(youtubeId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(youtubeId)) {
        next.delete(youtubeId);
      } else {
        if (next.size >= 10) {
          setError('Maximum 10 videos per batch scrape');
          return prev;
        }
        next.add(youtubeId);
      }
      // Clear selection-limit error when under the limit
      setError(null);
      return next;
    });
  }

  async function handleBatchScrape() {
    const selectedVideos = channelVideos.filter((v) => selected.has(v.youtubeId));
    const youtubeUrls = selectedVideos.map(
      (v) => `https://www.youtube.com/watch?v=${v.youtubeId}`
    );

    setIsBatchScraping(true);
    try {
      const res = await fetch('/api/remix-engine/scrape/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrls, projectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Batch scrape failed');
        return;
      }

      // Map enqueued to QueueItem[] with metadata from selectedVideos
      const enqueuedItems: QueueItem[] = (
        data.enqueued as Array<{ videoId: string; jobId: string; youtubeId: string }>
      ).map((item) => {
        const meta = selectedVideos.find((v) => v.youtubeId === item.youtubeId);
        return {
          jobId: item.jobId,
          videoId: item.videoId,
          youtubeId: item.youtubeId,
          title: meta?.title ?? item.youtubeId,
          thumbnailUrl: meta?.thumbnailUrl ?? '',
          status: 'queued',
          progress: 0,
        };
      });

      // Map duplicates to QueueItem[] as already-complete
      const duplicateItems: QueueItem[] = (
        data.duplicates as Array<{ videoId: string; youtubeId: string; scrapeStatus: string }>
      ).map((item) => {
        const meta = selectedVideos.find((v) => v.youtubeId === item.youtubeId);
        return {
          jobId: `dup-${item.videoId}`,
          videoId: item.videoId,
          youtubeId: item.youtubeId,
          title: meta?.title ?? item.youtubeId,
          thumbnailUrl: meta?.thumbnailUrl ?? '',
          status: 'complete',
          progress: 100,
        };
      });

      setQueueItems([...enqueuedItems, ...duplicateItems]);
    } catch {
      setError('Network error — batch scrape failed');
    } finally {
      setIsBatchScraping(false);
    }
  }

  async function handleRetry(item: QueueItem) {
    try {
      await fetch('/api/remix-engine/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl: `https://youtube.com/watch?v=${item.youtubeId}`,
          projectId,
        }),
      });
      // Reset status to queued
      setQueueItems((prev) =>
        prev.map((q) =>
          q.jobId === item.jobId
            ? { ...q, status: 'queued', progress: 0, errorMessage: null }
            : q
        )
      );
    } catch {
      // Silently fail — item stays in error state
    }
  }

  // Unused but kept to satisfy prop — channelId is resolved server-side
  void channelId;

  return (
    <div>
      {/* Channel URL input (hidden after batch scrape starts) */}
      {queueItems.length === 0 && (
        <div className="mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleChannelFetch();
            }}
          >
            <div className="flex gap-3">
              <input
                type="text"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder="Paste YouTube channel URL or @handle"
                className="flex-1 h-9 px-3 rounded-[--re-border-radius] bg-[--re-bg-input] border border-[--re-border] text-[--re-text-primary] placeholder:text-[--re-text-muted] outline-none focus:border-[--re-accent-primary] text-sm"
              />
              <Button
                type="submit"
                disabled={isLoadingChannel || !channelUrl.trim()}
                size="sm"
              >
                {isLoadingChannel ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Browse'
                )}
              </Button>
            </div>
          </form>
          {error && (
            <p className="text-[--re-destructive] text-sm mt-2">{error}</p>
          )}
        </div>
      )}

      {/* Queue list (shown after batch scrape starts) */}
      {queueItems.length > 0 && (
        <div className="mb-6">
          <BatchQueueList items={queueItems} onRetry={handleRetry} />
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            onClick={() => {
              setQueueItems([]);
              setSelected(new Set());
            }}
          >
            Browse more videos
          </Button>
        </div>
      )}

      {/* Channel video grid (shown after channel fetch, hidden during queue display) */}
      {channelVideos.length > 0 && queueItems.length === 0 && (
        <div>
          {/* Header: results count + view toggle + selection count + scrape button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-[--re-text-muted] text-sm">
                {totalResults} videos
              </span>
              {selected.size > 0 && (
                <span className="text-[--re-accent-primary] text-sm font-medium">
                  {selected.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setViewMode((v) => (v === 'grid' ? 'list' : 'grid'))
                }
                className="w-8 h-8"
                title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
              >
                {viewMode === 'grid' ? (
                  <List className="w-4 h-4" />
                ) : (
                  <LayoutGrid className="w-4 h-4" />
                )}
              </Button>
              {/* Scrape selected */}
              <Button
                size="sm"
                disabled={selected.size === 0 || isBatchScraping}
                onClick={handleBatchScrape}
              >
                {isBatchScraping ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Scrape{' '}
                {selected.size > 0
                  ? `${selected.size} Video${selected.size > 1 ? 's' : ''}`
                  : 'Selected'}
              </Button>
            </div>
          </div>

          <ChannelVideoGrid
            videos={channelVideos}
            selected={selected}
            onToggle={handleToggleVideo}
            viewMode={viewMode}
            isLoading={isLoadingChannel}
          />

          {/* Load More */}
          {nextPageToken && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" size="sm" onClick={handleLoadMore}>
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
