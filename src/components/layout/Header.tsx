'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface HeaderProps {
  user?: {
    email?: string;
    name?: string;
  };
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s);
}

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
  return 'SB';
}

interface Crumb {
  label: string;
  href?: string;
}

function useBreadcrumbs(): Crumb[] {
  const pathname = usePathname();
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});

  const segments = pathname.split('/').filter(Boolean);

  // Find UUIDs and resolve them to project names
  useEffect(() => {
    const uuids = segments.filter(isUuid);
    if (uuids.length === 0) return;

    // Only fetch names we haven't resolved yet
    const toResolve = uuids.filter((id) => !resolvedNames[id]);
    if (toResolve.length === 0) return;

    fetch('/api/remix-engine/projects')
      .then((r) => r.json())
      .then((d) => {
        const projects: { id: string; name: string }[] = d.projects || [];
        const map: Record<string, string> = {};
        for (const p of projects) {
          if (toResolve.includes(p.id)) {
            map[p.id] = p.name;
          }
        }
        if (Object.keys(map).length > 0) {
          setResolvedNames((prev) => ({ ...prev, ...map }));
        }
      })
      .catch(() => {});
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const crumbs: Crumb[] = [{ label: 'Sandbox', href: '/projects' }];

  let builtPath = '';
  for (const seg of segments) {
    builtPath += '/' + seg;
    if (isUuid(seg)) {
      crumbs.push({
        label: resolvedNames[seg] || '...',
        href: builtPath,
      });
    } else {
      crumbs.push({
        label: seg.charAt(0).toUpperCase() + seg.slice(1),
        href: builtPath,
      });
    }
  }

  return crumbs;
}

export function Header({ user }: HeaderProps) {
  const crumbs = useBreadcrumbs();
  const initials = getInitials(user);

  return (
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
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 min-w-0">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: 'var(--re-text-disabled)' }}
                />
              )}
              {isLast ? (
                <span
                  className="truncate"
                  style={{
                    color: 'var(--re-text-primary)',
                    fontWeight: 'var(--re-font-semibold)',
                    fontSize: 'var(--re-text-sm)',
                  }}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href!}
                  className="truncate hover:underline"
                  style={{
                    color: 'var(--re-text-muted)',
                    fontSize: 'var(--re-text-sm)',
                  }}
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

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
              // Sign out will be wired later.
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
