'use client';

// src/components/scraper/ChannelVideoGrid.tsx
// Grid/list view of channel videos with checkbox selection.
// Used by ChannelBrowser to display and select videos from a channel.

import { Check } from 'lucide-react';

export interface ChannelVideoItem {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  channelName: string;
  durationSeconds: number | null; // null from search.list
}

interface ChannelVideoGridProps {
  videos: ChannelVideoItem[];
  selected: Set<string>;        // Set of youtubeIds
  onToggle: (youtubeId: string) => void;
  viewMode: 'grid' | 'list';
  isLoading?: boolean;
}

// Loading skeleton for grid mode
function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[--re-border-radius] overflow-hidden bg-[--re-bg-secondary]/60 border border-[--re-border]/60 animate-pulse"
        >
          <div className="aspect-video bg-[--re-bg-hover]" />
          <div className="p-2.5 space-y-2">
            <div className="h-3 bg-[--re-bg-hover] rounded w-full" />
            <div className="h-3 bg-[--re-bg-hover] rounded w-3/4" />
            <div className="h-2.5 bg-[--re-bg-hover] rounded w-1/2 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Loading skeleton for list mode
function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-[--re-border-radius] bg-[--re-bg-secondary]/60 border border-[--re-border]/60 animate-pulse"
        >
          <div className="w-5 h-5 rounded bg-[--re-bg-hover] flex-shrink-0" />
          <div className="w-20 h-11 bg-[--re-bg-hover] rounded flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[--re-bg-hover] rounded w-3/4" />
            <div className="h-2.5 bg-[--re-bg-hover] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChannelVideoGrid({
  videos,
  selected,
  onToggle,
  viewMode,
  isLoading = false,
}: ChannelVideoGridProps) {
  if (isLoading) {
    return viewMode === 'grid' ? <GridSkeleton /> : <ListSkeleton />;
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {videos.map((video) => {
          const isSelected = selected.has(video.youtubeId);
          return (
            <div
              key={video.youtubeId}
              onClick={() => onToggle(video.youtubeId)}
              className={`relative cursor-pointer rounded-[--re-border-radius] overflow-hidden transition-all duration-150 bg-[--re-bg-secondary]/60 backdrop-blur-md ${
                isSelected
                  ? 'border-2 border-[--re-accent-primary] shadow-[0_0_16px_hsl(217_91%_60%/0.25)]'
                  : 'border border-[--re-border]/60 hover:border-[--re-accent-primary]/40 hover:shadow-[0_0_12px_hsl(217_91%_60%/0.12)]'
              }`}
            >
              {/* Checkbox overlay — top-left */}
              <div className="absolute top-2 left-2 z-10">
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[--re-accent-primary] border-[--re-accent-primary]'
                      : 'bg-black/50 border border-white/30'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              {/* Thumbnail */}
              <div className="aspect-video overflow-hidden">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Card body */}
              <div className="p-2.5">
                <p className="text-[--re-text-primary] text-sm font-medium line-clamp-2 leading-snug">
                  {video.title}
                </p>
                <p className="text-[--re-text-muted] text-xs mt-1">
                  {new Date(video.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // List mode
  return (
    <div className="flex flex-col gap-2">
      {videos.map((video) => {
        const isSelected = selected.has(video.youtubeId);
        return (
          <div
            key={video.youtubeId}
            onClick={() => onToggle(video.youtubeId)}
            className={`flex items-center gap-3 p-3 rounded-[--re-border-radius] cursor-pointer transition-all ${
              isSelected
                ? 'bg-[--re-accent-primary]/10 border border-[--re-accent-primary]/40'
                : 'bg-[--re-bg-secondary]/60 border border-[--re-border]/60 hover:bg-[--re-bg-hover]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center ${
                isSelected ? 'bg-[--re-accent-primary]' : 'border border-[--re-border]'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            <img
              src={video.thumbnailUrl}
              alt=""
              className="w-20 h-11 object-cover rounded flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[--re-text-primary] text-sm font-medium truncate">
                {video.title}
              </p>
              <p className="text-[--re-text-muted] text-xs mt-0.5">
                {video.channelName} &bull;{' '}
                {new Date(video.publishedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
