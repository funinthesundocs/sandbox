'use client';

// src/components/layout/Header.tsx
// Application header — page title (derived from route) + quick-add scrape button + user avatar dropdown.
// Only renders in standalone mode (mode gate enforced in dashboard layout.tsx).
// React 19 — no forwardRef.

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrapeInput } from '@/components/scraper/ScrapeInput';

interface HeaderProps {
  user?: {
    email?: string;
    name?: string;
  };
}

/** Derive a human-readable page title from the current pathname. */
function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  // Use the last meaningful segment
  const last = segments[segments.length - 1];
  if (!last || last === 'dashboard') return 'Dashboard';
  return last.charAt(0).toUpperCase() + last.slice(1);
}

/** Get avatar initials from name or email. */
function getInitials(user?: { email?: string; name?: string }): string {
  if (user?.name) {
    const parts = user.name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  if (user?.email) {
    return user.email.slice(0, 2).toUpperCase();
  }
  return 'RE';
}

/** Project selector — fetches user's projects client-side and renders a <select>. */
function ProjectSelector({
  onProjectSelected,
}: {
  onProjectSelected: (id: string) => void;
}) {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/remix-engine/projects')
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .catch(() => {});
  }, []);

  if (projects.length === 0) {
    return (
      <p className="text-[--re-text-muted] text-sm">
        No projects found. Create a project first.
      </p>
    );
  }

  return (
    <select
      onChange={(e) => onProjectSelected(e.target.value)}
      defaultValue=""
      className="w-full h-9 px-3 rounded-[--re-border-radius] bg-[--re-bg-input] border border-[--re-border] text-[--re-text-primary] text-sm outline-none focus:border-[--re-accent-primary]"
    >
      <option value="" disabled>
        Select a project...
      </option>
      {projects.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = getPageTitle(pathname);
  const initials = getInitials(user);

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddProjectId, setQuickAddProjectId] = useState<string | null>(null);

  return (
    <>
      <header
        style={{
          height: 'var(--re-header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          background: 'var(--re-bg-primary)',
          borderBottom: '1px solid var(--re-border-subtle)',
          flexShrink: 0,
        }}
      >
        {/* Page title */}
        <h1
          style={{
            color: 'var(--re-text-primary)',
            fontWeight: 'var(--re-font-semibold)',
            fontSize: 'var(--re-text-lg)',
            margin: 0,
          }}
        >
          {pageTitle}
        </h1>

        {/* Right side: quick-add button + user avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick scrape button */}
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-[--re-text-muted] hover:text-[--re-text-primary]"
            onClick={() => {
              setQuickAddProjectId(null);
              setQuickAddOpen(true);
            }}
            title="Quick scrape"
          >
            <Plus className="w-4 h-4" />
          </Button>

          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  padding: 0,
                }}
                aria-label="User menu"
              >
                <Avatar
                  style={{
                    width: 32,
                    height: 32,
                    border: '1px solid var(--re-border-subtle)',
                  }}
                >
                  <AvatarFallback
                    style={{
                      background: 'var(--re-accent-primary-subtle)',
                      color: 'var(--re-accent-primary)',
                      fontSize: 'var(--re-text-xs)',
                      fontWeight: 'var(--re-font-medium)',
                    }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              style={{
                background: 'var(--re-bg-secondary)',
                border: '1px solid var(--re-border)',
                borderRadius: 'var(--re-border-radius)',
                minWidth: '180px',
              }}
            >
              <DropdownMenuLabel
                style={{
                  color: 'var(--re-text-primary)',
                  fontSize: 'var(--re-text-sm)',
                }}
              >
                {user?.name ?? user?.email ?? 'Account'}
              </DropdownMenuLabel>
              {user?.email && user?.name && (
                <div
                  style={{
                    padding: '0 8px 6px',
                    color: 'var(--re-text-muted)',
                    fontSize: 'var(--re-text-xs)',
                  }}
                >
                  {user.email}
                </div>
              )}
              <DropdownMenuSeparator
                style={{ background: 'var(--re-border-subtle)' }}
              />
              <DropdownMenuItem
                style={{
                  color: 'var(--re-text-secondary)',
                  fontSize: 'var(--re-text-sm)',
                  cursor: 'pointer',
                }}
                onSelect={() => {
                  // Sign out will be wired in auth integration plan.
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Quick-add floating modal */}
      {quickAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          style={{ backdropFilter: 'blur(4px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuickAddOpen(false);
          }}
        >
          <div
            className="w-full max-w-xl mx-4 p-4 rounded-[--re-border-radius-lg] bg-[--re-bg-secondary] border border-[--re-border]"
            style={{ boxShadow: 'var(--re-shadow-lg)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-medium"
                style={{ color: 'var(--re-text-primary)' }}
              >
                Quick Scrape
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={() => setQuickAddOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {/* Project selector */}
            <ProjectSelector onProjectSelected={setQuickAddProjectId} />
            {/* ScrapeInput — shown once a project is selected */}
            {quickAddProjectId && (
              <div className="mt-3">
                <ScrapeInput
                  projectId={quickAddProjectId}
                  onScrapeStarted={() => {
                    setQuickAddOpen(false);
                    // Navigate to the project page — user will see progress there
                    router.push(`/dashboard/projects/${quickAddProjectId}`);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
