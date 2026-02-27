'use client';

// src/app/(dashboard)/projects/[id]/ProjectDetailClient.tsx
// Client component that manages active scrape job state on the project detail page.
// Renders ScrapeInput, active JobProgressSubscriber cards, and VideoGrid.

import { useState } from 'react';
import Link from 'next/link';
import { Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrapeInput } from '@/components/scraper/ScrapeInput';
import { VideoGrid } from '@/components/scraper/VideoGrid';
import { JobProgressSubscriber } from '@/components/scraper/JobProgressSubscriber';

interface ActiveJob {
  jobId: string;
  videoId: string;
  title?: string;
}

interface ProjectDetailClientProps {
  projectId: string;
  projectName: string;
  initialVideos: Array<{
    id: string;
    youtube_id: string;
    original_title: string | null;
    original_thumbnail_url: string | null;
    channel_name: string | null;
    duration_seconds: number | null;
    scrape_status: 'pending' | 'processing' | 'complete' | 'error';
    view_count: number | null;
  }>;
}

export function ProjectDetailClient({
  projectId,
  projectName: _projectName,
  initialVideos,
}: ProjectDetailClientProps) {
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);

  const handleScrapeStarted = (jobId: string, videoId: string) => {
    setActiveJobs((prev) => [...prev, { jobId, videoId }]);
  };

  const handleJobDismiss = (jobId: string) => {
    setActiveJobs((prev) => prev.filter((j) => j.jobId !== jobId));
  };

  return (
    <div>
      <div className="mb-8 space-y-3">
        <ScrapeInput
          projectId={projectId}
          onScrapeStarted={handleScrapeStarted}
        />
        {/* Channel batch scrape entry point */}
        <div className="flex justify-end">
          <Link href={`/dashboard/projects/${projectId}/channel`}>
            <Button variant="outline" size="sm">
              <Network className="w-4 h-4 mr-2" /> Scrape from Channel
            </Button>
          </Link>
        </div>
        {/* Active scrape job progress cards */}
        {activeJobs.map((job) => (
          <JobProgressSubscriber
            key={job.jobId}
            jobId={job.jobId}
            videoId={job.videoId}
            projectId={projectId}
            videoTitle={job.title}
            onDismiss={() => handleJobDismiss(job.jobId)}
          />
        ))}
      </div>
      <VideoGrid videos={initialVideos} projectId={projectId} />
    </div>
  );
}
