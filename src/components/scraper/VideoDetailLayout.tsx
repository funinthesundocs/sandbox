'use client';

// src/components/scraper/VideoDetailLayout.tsx
// Client component that manages shared seekTo state between VideoPlayer and TranscriptViewer.
// Renders the 5-column responsive grid with player and transcript.

import { useState } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { TranscriptViewer } from './TranscriptViewer';

interface TranscriptSegment {
  timestamp: string;
  startMs: number;
  text: string;
}

interface VideoDetailLayoutProps {
  youtubeId: string;
  videoId: string;
  transcriptSegments: TranscriptSegment[];
}

export function VideoDetailLayout({
  youtubeId,
  videoId,
  transcriptSegments,
}: VideoDetailLayoutProps) {
  const [seekTo, setSeekTo] = useState<((s: number) => void) | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Video player — 3/5 width on large screens */}
      <div className="lg:col-span-3">
        <VideoPlayer
          youtubeId={youtubeId}
          videoId={videoId}
          onPlayerReady={(fn) => setSeekTo(() => fn)}
        />
      </div>

      {/* Transcript panel — 2/5 width */}
      <div className="lg:col-span-2">
        <TranscriptViewer
          segments={transcriptSegments}
          videoId={videoId}
          onSeek={seekTo ?? undefined}
        />
      </div>
    </div>
  );
}
