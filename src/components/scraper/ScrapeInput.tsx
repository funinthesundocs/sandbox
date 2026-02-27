'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrapePreviewCard } from './ScrapePreviewCard';

interface ScrapeInputProps {
  projectId: string;
  onScrapeStarted?: (jobId: string, videoId: string) => void;
  onBatchScrapeStarted?: (
    results: Array<{ jobId: string; videoId: string; youtubeId: string }>
  ) => void;
}

interface PreviewData {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  channelName: string;
  viewCount: number;
  youtubeUrl: string;
}

export function ScrapeInput({
  projectId,
  onScrapeStarted,
  onBatchScrapeStarted,
}: ScrapeInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [existingVideo, setExistingVideo] = useState<{ videoId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const urls = inputValue
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    if (urls.length === 0) return;

    // Batch flow
    if (urls.length > 1) {
      if (urls.length > 10) {
        setError('Maximum 10 URLs at once');
        return;
      }
      try {
        setIsLoading(true);
        const res = await fetch('/api/remix-engine/scrape/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ youtubeUrls: urls, projectId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Batch scrape failed');
          return;
        }
        onBatchScrapeStarted?.(data.enqueued);
        setInputValue('');
      } catch {
        setError('Failed to submit batch scrape');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Single URL flow
    try {
      setIsLoading(true);
      const res = await fetch('/api/remix-engine/scrape/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl: urls[0], projectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to fetch video preview');
        return;
      }
      if (data.existing) {
        setExistingVideo({ videoId: data.videoId });
      } else {
        setPreview({ ...data.preview, youtubeUrl: urls[0] });
      }
    } catch {
      setError('Failed to fetch video preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmScrape = async () => {
    if (!preview) return;
    setError(null);
    try {
      setIsScraping(true);
      const res = await fetch('/api/remix-engine/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl: preview.youtubeUrl, projectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Scrape failed');
        return;
      }
      onScrapeStarted?.(data.jobId, data.videoId);
      setPreview(null);
      setInputValue('');
    } catch {
      setError('Failed to start scrape');
    } finally {
      setIsScraping(false);
    }
  };

  const handleConfirmRescrape = async () => {
    if (!existingVideo) return;
    setError(null);
    // Re-use inputValue for the re-scrape URL
    const url = inputValue.trim();
    if (!url) return;
    try {
      setIsScraping(true);
      const res = await fetch('/api/remix-engine/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl: url, projectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Re-scrape failed');
        return;
      }
      onScrapeStarted?.(data.jobId, data.videoId);
      setExistingVideo(null);
      setInputValue('');
    } catch {
      setError('Failed to start re-scrape');
    } finally {
      setIsScraping(false);
    }
  };

  const textareaRows = inputValue.includes('\n') ? 4 : 1;

  return (
    <div className="w-full">
      {/* Input area */}
      {!preview && !existingVideo && (
        <form onSubmit={handleSubmit}>
          <div
            className="relative rounded-[--re-border-radius] bg-[--re-bg-secondary]/60 backdrop-blur-md border border-[--re-border]/60"
            style={{ boxShadow: '0 4px 24px hsl(240 10% 2% / 0.4)' }}
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste YouTube URL(s) — one per line for batch scraping"
              rows={textareaRows}
              className="w-full bg-transparent resize-none outline-none text-[--re-text-primary] placeholder:text-[--re-text-muted] p-4 pr-24"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-3 top-3"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
            </Button>
          </div>
          {error && (
            <p className="flex items-center gap-1.5 text-[--re-destructive] text-sm mt-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </p>
          )}
        </form>
      )}

      {/* Preview card */}
      {preview && (
        <ScrapePreviewCard
          preview={preview}
          onConfirm={handleConfirmScrape}
          onCancel={() => {
            setPreview(null);
            setInputValue('');
          }}
          isLoading={isScraping}
        />
      )}

      {/* Duplicate warning */}
      {existingVideo && (
        <div
          className="p-4 rounded-[--re-border-radius] bg-[--re-bg-secondary]/60 backdrop-blur-md border border-[--re-border]/60"
          style={{ boxShadow: '0 4px 24px hsl(240 10% 2% / 0.4)' }}
        >
          <p className="flex items-center gap-2 text-[--re-warning]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            This video already exists in this project. Scrape again?
          </p>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleConfirmRescrape} disabled={isScraping} variant="outline" size="sm">
              {isScraping ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Re-scrape
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isScraping}
              onClick={() => {
                setExistingVideo(null);
                setInputValue('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
