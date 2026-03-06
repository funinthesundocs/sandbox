'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  FolderOpen,
  LayoutGrid,
  List,
  Film,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  videoCount: number;
}

interface ProjectsClientProps {
  projects: Project[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'var(--re-text-muted)' },
  scraping: { label: 'Scraping', color: '#3b82f6' },
  remixing: { label: 'Awaiting Approval', color: '#a855f7' },
  generating: { label: 'Generating Assets', color: '#eab308' },
  assembling: { label: 'Assembling', color: '#f97316' },
  complete: { label: 'Complete', color: '#22c55e' },
  error: { label: 'Error', color: '#ef4444' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{
        color: config.color,
        background: `color-mix(in srgb, ${config.color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${config.color} 25%, transparent)`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: config.color }}
      />
      {config.label}
    </span>
  );
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <FolderOpen className="w-12 h-12 text-[--re-text-disabled] mx-auto mb-4" />
      <p className="text-[--re-text-primary] font-medium">No projects yet</p>
      <p className="text-[--re-text-muted] text-sm mt-1">
        Create your first project to start remixing videos
      </p>
      <Link href="/projects/new">
        <Button size="sm" className="mt-4">
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </Link>
    </div>
  );
}

function CardView({ projects }: { projects: Project[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          <div className="p-4 rounded-[--re-border-radius] bg-[--re-bg-secondary]/60 backdrop-blur-md border border-[--re-border]/60 hover:border-[--re-accent-primary]/40 transition-all duration-200 cursor-pointer h-full flex flex-col">
            {/* Top row: status badge */}
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-[--re-text-primary] font-medium leading-tight line-clamp-1 mr-2">
                {project.name}
              </h3>
              <StatusBadge status={project.status} />
            </div>

            {/* Description */}
            {project.description ? (
              <p className="text-[--re-text-muted] text-sm mt-1 line-clamp-2 flex-1">
                {project.description}
              </p>
            ) : (
              <p className="text-[--re-text-disabled] text-sm italic mt-1 flex-1">
                No description
              </p>
            )}

            {/* Footer: video count + last updated */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[--re-border-subtle]">
              <span className="inline-flex items-center gap-1.5 text-[--re-text-muted] text-xs">
                <Film className="w-3.5 h-3.5" />
                {project.videoCount} {project.videoCount === 1 ? 'video' : 'videos'}
              </span>
              <span className="text-[--re-text-disabled] text-xs">
                {relativeTime(project.updated_at)}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ListView({ projects }: { projects: Project[] }) {
  return (
    <div className="rounded-[--re-border-radius] border border-[--re-border]/60 overflow-hidden">
      {/* Header row — hidden on mobile */}
      <div
        className="hidden sm:grid gap-4 px-4 py-2.5 text-xs font-medium text-[--re-text-muted] uppercase tracking-wider border-b border-[--re-border-subtle]"
        style={{
          gridTemplateColumns: '1fr 140px 90px 100px 32px',
          background: 'var(--re-bg-secondary)',
        }}
      >
        <span>Name</span>
        <span>Status</span>
        <span>Videos</span>
        <span>Updated</span>
        <span />
      </div>

      {/* Rows */}
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          {/* Desktop row */}
          <div
            className="hidden sm:grid gap-4 px-4 py-3 items-center border-b border-[--re-border-subtle] last:border-b-0 hover:bg-[--re-bg-hover] transition-colors cursor-pointer"
            style={{ gridTemplateColumns: '1fr 140px 90px 100px 32px' }}
          >
            <div className="min-w-0">
              <p className="text-[--re-text-primary] font-medium text-sm truncate">
                {project.name}
              </p>
              {project.description && (
                <p className="text-[--re-text-muted] text-xs truncate mt-0.5">
                  {project.description}
                </p>
              )}
            </div>
            <StatusBadge status={project.status} />
            <span className="inline-flex items-center gap-1.5 text-[--re-text-muted] text-sm">
              <Film className="w-3.5 h-3.5" />
              {project.videoCount}
            </span>
            <span className="text-[--re-text-disabled] text-xs">
              {relativeTime(project.updated_at)}
            </span>
            <ChevronRight className="w-4 h-4 text-[--re-text-disabled]" />
          </div>

          {/* Mobile row — stacked layout */}
          <div className="sm:hidden px-4 py-3 border-b border-[--re-border-subtle] last:border-b-0 hover:bg-[--re-bg-hover] transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <p className="text-[--re-text-primary] font-medium text-sm truncate mr-2">
                {project.name}
              </p>
              <StatusBadge status={project.status} />
            </div>
            {project.description && (
              <p className="text-[--re-text-muted] text-xs truncate mt-1">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center gap-1.5 text-[--re-text-muted] text-xs">
                <Film className="w-3 h-3" />
                {project.videoCount} videos
              </span>
              <span className="text-[--re-text-disabled] text-xs">
                {relativeTime(project.updated_at)}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function getInitialView(): 'grid' | 'list' {
  if (typeof window === 'undefined') return 'list';
  const stored = localStorage.getItem('re-projects-view');
  return stored === 'grid' ? 'grid' : 'list';
}

export function ProjectsClient({ projects }: ProjectsClientProps) {
  const [view, setView] = useState<'grid' | 'list'>(getInitialView);

  function toggleView(mode: 'grid' | 'list') {
    setView(mode);
    localStorage.setItem('re-projects-view', mode);
  }

  if (projects.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1
            className="font-semibold text-[--re-text-primary]"
            style={{ fontSize: 'var(--re-text-xl)' }}
          >
            Projects
          </h1>
        </div>
        <EmptyState />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="font-semibold text-[--re-text-primary]"
          style={{ fontSize: 'var(--re-text-xl)' }}
        >
          Projects
        </h1>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-[--re-border-radius] border border-[--re-border] overflow-hidden">
            <button
              onClick={() => toggleView('grid')}
              className="p-1.5 transition-colors"
              style={{
                background: view === 'grid' ? 'var(--re-accent-primary-subtle)' : 'transparent',
                color: view === 'grid' ? 'var(--re-accent-primary)' : 'var(--re-text-muted)',
              }}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => toggleView('list')}
              className="p-1.5 transition-colors"
              style={{
                background: view === 'list' ? 'var(--re-accent-primary-subtle)' : 'transparent',
                color: view === 'list' ? 'var(--re-accent-primary)' : 'var(--re-text-muted)',
              }}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Link href="/projects/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          </Link>
        </div>
      </div>

      {view === 'grid' ? (
        <CardView projects={projects} />
      ) : (
        <ListView projects={projects} />
      )}
    </div>
  );
}
