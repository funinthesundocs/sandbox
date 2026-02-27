# Phase 1: Foundation - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Project scaffold with Next.js App Router + TypeScript + Tailwind, Supabase schema with `re_` prefixed tables, auth flow (login/signup, invite-only, role-based middleware), dark-mode dashboard shell (sidebar + header), RemixEngineProvider module boundary, and UUPM design system generation stored in `design-system/MASTER.md`. Standalone mode only — module mode shell is wrapped but not the focus.

</domain>

<decisions>
## Implementation Decisions

### Dashboard Shell — Sidebar
- Collapsible sidebar — collapses to icon rail when closed, expands to full width on click
- Toggle is click-based (not hover). State persists across sessions.
- Expanded width: 240px
- Collapsed state: icons only, no labels. Tooltips on hover show label.
- Two sections: main nav (top) and admin/settings (bottom), separated by divider
- Main nav items: Projects, Queue, Analytics
- Bottom section: Admin, Settings
- Logo at top of sidebar (visible in both expanded and collapsed states — icon only when collapsed)

### Dashboard Shell — Header
- Header bar contains: page title (left) + user avatar with dropdown menu (right)
- Avatar dropdown: profile info, logout
- No breadcrumbs in Phase 1

### Module Boundary
- Sidebar, Header, auth pages only render when `config.mode === 'standalone'`
- All nav links use `config.routePrefix` — no hardcoded paths

### Claude's Discretion
- Exact icon set for nav items (use a consistent icon library, e.g., lucide-react)
- Active state styling for nav items
- Exact avatar dropdown styling
- Transition/animation for sidebar expand/collapse
- Skeleton loader design for dashboard shell

</decisions>

<specifics>
## Specific Ideas

- Sidebar should feel like Linear or Vercel's dashboard — clean, dark, icon rail collapse pattern
- Icon-only rail with tooltip is the gold standard for this pattern

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within Phase 1 scope

</deferred>

---

*Phase: 01-foundation-4-hours*
*Context gathered: 2026-02-26*
