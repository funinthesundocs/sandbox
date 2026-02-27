'use client';

// src/components/layout/Sidebar.tsx
// Collapsible sidebar with role-based navigation and localStorage persistence.
// Only renders in standalone mode (mode gate enforced in dashboard layout.tsx).
// React 19 — no forwardRef.

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderOpen,
  ListChecks,
  BarChart2,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const mainNav: NavItem[] = [
  { label: 'Projects', href: '/dashboard/projects', icon: FolderOpen },
  { label: 'Queue', href: '/dashboard/queue', icon: ListChecks },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart2 },
];

const bottomNav: NavItem[] = [
  { label: 'Admin', href: '/dashboard/admin', icon: ShieldCheck, adminOnly: true },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  userRole?: 'admin' | 'editor' | 'viewer';
}

export function Sidebar({ userRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Read collapse state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('re-sidebar-collapsed');
    if (stored !== null) {
      setCollapsed(stored === 'true');
    }
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('re-sidebar-collapsed', String(next));
  }

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + '/');
  }

  function renderNavItem(item: NavItem) {
    // Filter admin-only items for non-admin users
    if (item.adminOnly && userRole && userRole !== 'admin') {
      return null;
    }

    const active = isActive(item.href);
    const Icon = item.icon;

    const itemStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: collapsed ? 0 : '10px',
      height: 'var(--re-nav-item-height)',
      padding: 'var(--re-nav-item-padding)',
      borderRadius: 'var(--re-border-radius)',
      transition: 'background var(--re-transition-fast), color var(--re-transition-fast)',
      cursor: 'pointer',
      textDecoration: 'none',
      justifyContent: collapsed ? 'center' : 'flex-start',
      background: active ? 'var(--re-accent-primary-subtle)' : 'transparent',
      color: active ? 'var(--re-accent-primary)' : 'var(--re-text-secondary)',
      fontWeight: active ? 'var(--re-font-medium)' : 'var(--re-font-normal)',
      fontSize: 'var(--re-text-sm)',
      width: '100%',
    };

    const iconStyles: React.CSSProperties = {
      flexShrink: 0,
      color: active ? 'var(--re-accent-primary)' : 'var(--re-text-muted)',
      width: 18,
      height: 18,
    };

    const linkEl = (
      <Link
        href={item.href}
        style={itemStyles}
        className="group hover:!bg-[--re-bg-hover] hover:!text-[--re-text-primary]"
      >
        <Icon style={iconStyles} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <TooltipProvider key={item.href} delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              {linkEl}
            </TooltipTrigger>
            <TooltipContent side="right">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <div key={item.href}>{linkEl}</div>;
  }

  return (
    <aside
      style={{
        width: collapsed ? 'var(--re-sidebar-width-collapsed)' : 'var(--re-sidebar-width)',
        transition: 'width var(--re-transition-base)',
        background: 'var(--re-bg-sidebar)',
        borderRight: '1px solid var(--re-border-subtle)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Logo area — matches header height */}
      <div
        style={{
          height: 'var(--re-header-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 12px',
          borderBottom: '1px solid var(--re-border-subtle)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflow: 'hidden',
          }}
        >
          <Zap
            style={{
              width: 20,
              height: 20,
              color: 'var(--re-accent-primary)',
              flexShrink: 0,
            }}
          />
          {!collapsed && (
            <span
              style={{
                color: 'var(--re-text-primary)',
                fontWeight: 'var(--re-font-semibold)',
                fontSize: 'var(--re-text-sm)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              RemixEngine
            </span>
          )}
        </div>

        {/* Collapse toggle button — only shown when expanded (icon visible via absolute in collapsed) */}
        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--re-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: 'var(--re-border-radius-sm)',
              flexShrink: 0,
            }}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '8px 0',
            borderBottom: '1px solid var(--re-border-subtle)',
            flexShrink: 0,
          }}
        >
          <button
            onClick={toggleCollapsed}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--re-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: 'var(--re-border-radius-sm)',
            }}
            aria-label="Expand sidebar"
          >
            <ChevronRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      )}

      {/* Main nav */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {mainNav.map((item) => renderNavItem(item))}
      </nav>

      {/* Bottom nav — admin + settings */}
      <div
        style={{
          padding: '8px',
          paddingBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        <Separator
          style={{
            background: 'var(--re-border-subtle)',
            marginBottom: '8px',
          }}
        />
        {bottomNav.map((item) => renderNavItem(item))}
      </div>
    </aside>
  );
}
