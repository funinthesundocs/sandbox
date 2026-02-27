'use client';

// src/components/scraper/ScrapeProgressSteps.tsx
// Step indicator component for scrape job progress.
// Shows discrete steps: Downloading → Extracting transcript → Uploading to storage.
// Steps light up as progress milestones are reached.

import React from 'react';
import { Check, Loader2, X } from 'lucide-react';

interface ScrapeProgressStepsProps {
  progress: number;   // 0-100
  status: 'queued' | 'processing' | 'complete' | 'error' | 'cancelled';
  errorMessage?: string | null;
}

const STEPS = [
  { label: 'Downloading', completeAt: 40, startAt: 10 },
  { label: 'Extracting transcript', completeAt: 60, startAt: 40 },
  { label: 'Uploading to storage', completeAt: 100, startAt: 60 },
] as const;

function getStepState(
  step: { label: string; completeAt: number; startAt: number },
  progress: number,
  status: string
): 'pending' | 'active' | 'complete' | 'error' {
  if (status === 'error' || status === 'cancelled') {
    return progress >= step.startAt ? 'error' : 'pending';
  }
  if (status === 'complete' || progress >= step.completeAt) return 'complete';
  if (progress >= step.startAt) return 'active';
  return 'pending';
}

export function ScrapeProgressSteps({
  progress,
  status,
  errorMessage,
}: ScrapeProgressStepsProps) {
  return (
    <div>
      <div className="flex items-center gap-3">
        {STEPS.map((step, i) => {
          const stepState = getStepState(step, progress, status);
          return (
            <React.Fragment key={step.label}>
              {/* Step indicator */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                    stepState === 'complete'
                      ? 'bg-[--re-success] shadow-[0_0_8px_hsl(142_71%_45%/0.5)]'
                      : stepState === 'active'
                        ? 'bg-[--re-accent-primary] shadow-[0_0_10px_hsl(217_91%_60%/0.5)] animate-pulse'
                        : stepState === 'error'
                          ? 'bg-[--re-destructive]'
                          : 'bg-[--re-bg-hover] border border-[--re-border]'
                  }`}
                >
                  {stepState === 'complete' && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                  {stepState === 'active' && (
                    <Loader2 className="w-3 h-3 text-white animate-spin" />
                  )}
                  {stepState === 'error' && (
                    <X className="w-3 h-3 text-white" />
                  )}
                  {stepState === 'pending' && (
                    <span className="w-2 h-2 rounded-full bg-[--re-border]" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    stepState === 'complete'
                      ? 'text-[--re-success]'
                      : stepState === 'active'
                        ? 'text-[--re-accent-primary] font-medium'
                        : stepState === 'error'
                          ? 'text-[--re-destructive]'
                          : 'text-[--re-text-disabled]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {/* Connector line between steps */}
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px transition-all duration-500 ${
                    progress >= STEPS[i].completeAt
                      ? 'bg-[--re-success]'
                      : 'bg-[--re-border-subtle]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {/* Error message */}
      {(status === 'error' || status === 'cancelled') && errorMessage && (
        <p className="text-[--re-destructive] text-sm mt-3">{errorMessage}</p>
      )}
    </div>
  );
}
