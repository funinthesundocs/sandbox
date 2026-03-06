'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderOpen,
  Lightbulb,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FlaskConical,
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

interface ProjectItem {
  id: string;
  name: string;
}

const bottomNav: NavItem[] = [
  { label: 'Admin', href: '/admin', icon: ShieldCheck, adminOnly: true },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  userRole?: 'admin' | 'editor' | 'viewer';
}

export function Sidebar({ userRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('re-sidebar-collapsed');
    if (stored !== null) {
      setCollapsed(stored === 'true');
    }
  }, []);

  // Fetch projects for the accordion
  useEffect(() => {
    fetch('/api/remix-engine/projects')
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []))
      .catch(() => {});
  }, [pathname]); // re-fetch when navigating (catches new project creation)

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('re-sidebar-collapsed', String(next));
  }

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + '/');
  }

  function renderNavItem(item: NavItem) {
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

  const projectsActive = isActive('/projects');

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
      {/* Logo area */}
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
          <FlaskConical
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
              Sandbox
            </span>
          )}
        </div>

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
        {/* Projects accordion */}
        {collapsed ? (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/projects"
                  className="group hover:!bg-[--re-bg-hover] hover:!text-[--re-text-primary]"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 'var(--re-nav-item-height)',
                    borderRadius: 'var(--re-border-radius)',
                    background: projectsActive ? 'var(--re-accent-primary-subtle)' : 'transparent',
                    color: projectsActive ? 'var(--re-accent-primary)' : 'var(--re-text-secondary)',
                    textDecoration: 'none',
                    width: '100%',
                  }}
                >
                  <FolderOpen style={{ width: 18, height: 18, color: projectsActive ? 'var(--re-accent-primary)' : 'var(--re-text-muted)' }} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Projects</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div>
            {/* Projects header row — clickable accordion toggle */}
            <button
              onClick={() => setProjectsOpen(!projectsOpen)}
              className="group hover:!bg-[--re-bg-hover] hover:!text-[--re-text-primary]"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                height: 'var(--re-nav-item-height)',
                padding: 'var(--re-nav-item-padding)',
                borderRadius: 'var(--re-border-radius)',
                background: projectsActive ? 'var(--re-accent-primary-subtle)' : 'transparent',
                color: projectsActive ? 'var(--re-accent-primary)' : 'var(--re-text-secondary)',
                fontWeight: projectsActive ? 'var(--re-font-medium)' : 'var(--re-font-normal)',
                fontSize: 'var(--re-text-sm)',
                width: '100%',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'none',
                textAlign: 'left',
              }}
            >
              <FolderOpen style={{ width: 18, height: 18, flexShrink: 0, color: projectsActive ? 'var(--re-accent-primary)' : 'var(--re-text-muted)' }} />
              <span style={{ flex: 1 }}>Projects</span>
              <ChevronDown
                style={{
                  width: 14,
                  height: 14,
                  color: 'var(--re-text-disabled)',
                  transition: 'transform var(--re-transition-fast)',
                  transform: projectsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                }}
              />
            </button>

            {/* Project children */}
            {projectsOpen && (
              <div style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '2px' }}>
                {projects.map((p) => {
                  const href = `/projects/${p.id}`;
                  const active = isActive(href);
                  return (
                    <Link
                      key={p.id}
                      href={href}
                      className="group hover:!bg-[--re-bg-hover] hover:!text-[--re-text-primary]"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        height: '30px',
                        padding: '0 8px',
                        borderRadius: 'var(--re-border-radius)',
                        background: active ? 'var(--re-accent-primary-subtle)' : 'transparent',
                        color: active ? 'var(--re-accent-primary)' : 'var(--re-text-muted)',
                        fontSize: '13px',
                        textDecoration: 'none',
                        overflow: 'hidden',
                      }}
                    >
                      <Lightbulb style={{ width: 14, height: 14, flexShrink: 0, opacity: 0.6 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </span>
                    </Link>
                  );
                })}
                {projects.length === 0 && (
                  <span style={{ color: 'var(--re-text-disabled)', fontSize: '12px', padding: '4px 8px' }}>
                    No projects
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Bottom nav */}
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
