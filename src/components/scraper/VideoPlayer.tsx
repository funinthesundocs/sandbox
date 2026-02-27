'use client';

// src/components/scraper/VideoPlayer.tsx
// YouTube IFrame API embed player with Supabase signed URL fallback.
// Exposes seekTo capability via onPlayerReady callback prop.

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Extend window with YouTube IFrame API globals
declare global {
  interface Window {
    YT: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: { seekTo: (seconds: number, allowSeekAhead: boolean) => void } }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => {
        destroy: () => void;
        seekTo: (seconds: number, allowSeekAhead: boolean) => void;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoPlayerProps {
  youtubeId: string;
  videoId: string; // DB video ID — for fetching signed URL fallback
  onPlayerReady?: (seekTo: (seconds: number) => void) => void;
  className?: string;
}

export function VideoPlayer({ youtubeId, videoId, onPlayerReady, className }: VideoPlayerProps) {
  const [useFallback, setUseFallback] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<InstanceType<Window['YT']['Player']> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initPlayer = () => {
      if (!playerDivRef.current || !isMounted) return;

      playerRef.current = new window.YT.Player(playerDivRef.current, {
        videoId: youtubeId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => {
            if (isMounted) {
              onPlayerReady?.((s: number) => e.target.seekTo(s, true));
            }
          },
          onError: () => {
            if (isMounted) setUseFallback(true);
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      // Load the YouTube IFrame API script if not already present
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      isMounted = false;
      playerRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId]);

  // Fetch signed URL when switching to fallback
  useEffect(() => {
    if (!useFallback) return;
    fetch(`/api/remix-engine/videos/${videoId}/signed-url`)
      .then(r => r.json())
      .then(d => setSignedUrl(d.signedUrl))
      .catch(() => {});
  }, [useFallback, videoId]);

  return (
    <div
      className={`relative aspect-video bg-[--re-bg-secondary] rounded-[--re-border-radius] overflow-hidden ${className ?? ''}`}
    >
      {!useFallback && <div ref={playerDivRef} className="w-full h-full" />}
      {useFallback && signedUrl && (
        <video src={signedUrl} controls className="w-full h-full" />
      )}
      {useFallback && !signedUrl && (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[--re-text-muted]" />
        </div>
      )}
    </div>
  );
}
