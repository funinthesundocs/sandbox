'use client';

// src/components/layout/Header.tsx
// Application header — page title (derived from route) + user avatar dropdown.
// Only renders in standalone mode (mode gate enforced in dashboard layout.tsx).
// React 19 — no forwardRef.

import { usePathname } from 'next/navigation';
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

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
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
              // Sign out will be wired in Plan 05 (auth integration).
              // For now, stub — no-op.
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
