'use client';

import Link from 'next/link';
import { CheckCircle2, Lock, Loader2 } from 'lucide-react';

interface PipelineTabsProps {
  projectId: string;
  videoId: string;
  scrapeStatus: 'pending' | 'processing' | 'complete' | 'error';
  remixStatus: 'pending' | 'processing' | 'complete' | 'error';
  generationStatus: 'pending' | 'processing' | 'complete' | 'error';
  activeTab: 'scraping' | 'remix' | 'generation';
}

export function PipelineTabs({
  projectId,
  videoId,
  scrapeStatus,
  remixStatus,
  generationStatus,
  activeTab,
}: PipelineTabsProps) {
  const baseVideoPath = `/dashboard/projects/${projectId}/videos/${videoId}`;

  const tabs = [
    {
      id: 'scraping' as const,
      label: 'Scraping',
      href: baseVideoPath,
      status: scrapeStatus,
      locked: false,
    },
    {
      id: 'remix' as const,
      label: 'Remix Review',
      href: `${baseVideoPath}/remix`,
      status: remixStatus,
      locked: scrapeStatus !== 'complete',
    },
    {
      id: 'generation' as const,
      label: 'Generation',
      href: `${baseVideoPath}/generation`,
      status: generationStatus,
      // Locked until user approves remix (generation_status starts 'pending' — locked visually)
      locked: remixStatus !== 'complete' || generationStatus === 'pending',
    },
  ];

  return (
    <div
      className="flex items-center gap-1 border-b mb-6"
      style={{ borderColor: 'var(--re-border)' }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const isComplete = tab.status === 'complete';
        const isProcessing = tab.status === 'processing';

        const content = (
          <div
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
              ${
                isActive
                  ? 'border-[--re-accent-primary] text-[--re-text-primary]'
                  : tab.locked
                    ? 'border-transparent text-[--re-text-muted] cursor-not-allowed'
                    : 'border-transparent text-[--re-text-secondary] hover:text-[--re-text-primary] hover:border-[--re-border-strong]'
              }
            `}
          >
            {isComplete && !isActive && (
              <CheckCircle2
                className="w-3.5 h-3.5"
                style={{ color: 'var(--re-success)' }}
              />
            )}
            {isProcessing && (
              <Loader2
                className="w-3.5 h-3.5 animate-spin"
                style={{ color: 'var(--re-accent-primary)' }}
              />
            )}
            {tab.locked && !isComplete && !isProcessing && (
              <Lock className="w-3 h-3" />
            )}
            {tab.label}
          </div>
        );

        if (tab.locked) return <div key={tab.id}>{content}</div>;
        return (
          <Link key={tab.id} href={tab.href}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
