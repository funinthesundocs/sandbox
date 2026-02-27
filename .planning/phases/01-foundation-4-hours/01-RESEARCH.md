# Phase 1: Foundation - Research

**Researched:** 2026-02-26
**Domain:** Next.js App Router + Supabase Auth + shadcn/ui + BullMQ + RemixEngineProvider module boundary
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Dashboard Shell — Sidebar
- Collapsible sidebar — collapses to icon rail when closed, expands to full width on click
- Toggle is click-based (not hover). State persists across sessions.
- Expanded width: 240px
- Collapsed state: icons only, no labels. Tooltips on hover show label.
- Two sections: main nav (top) and admin/settings (bottom), separated by divider
- Main nav items: Projects, Queue, Analytics
- Bottom section: Admin, Settings
- Logo at top of sidebar (visible in both expanded and collapsed states — icon only when collapsed)

#### Dashboard Shell — Header
- Header bar contains: page title (left) + user avatar with dropdown menu (right)
- Avatar dropdown: profile info, logout
- No breadcrumbs in Phase 1

#### Auth Flow
- Invite-only: only admins can send invites, via the Admin panel
- Invite mechanism: Supabase auth invite email → one-time signup link with token in URL
- `/signup` without a valid invite token → redirect to `/login` with "Invite required" message
- Signup form only renders/works when a valid invite token is present in the URL
- After successful login → redirect to `/dashboard`
- Role enforcement in nav: hide restricted items rather than show-and-block
  - Viewer: sees Projects, Analytics only
  - Editor: sees Projects, Queue, Analytics
  - Admin: sees all nav including Admin section
- Role stored in Supabase user metadata, checked by middleware on every route

#### Module Boundary
- Sidebar, Header, auth pages only render when `config.mode === 'standalone'`
- All nav links use `config.routePrefix` — no hardcoded paths

### Claude's Discretion
- Exact icon set for nav items (use a consistent icon library, e.g., lucide-react)
- Active state styling for nav items
- Exact avatar dropdown styling
- Transition/animation for sidebar expand/collapse
- Skeleton loader design for dashboard shell

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within Phase 1 scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| R1.1 | Next.js 14+ App Router with TypeScript, Tailwind, shadcn/ui | Project already uses Next.js 16.1.6 + React 19 + Tailwind v4. shadcn/ui CLI handles Tailwind v4 + React 19 natively with `npx shadcn@latest init`. |
| R1.2 | Supabase project with all migrations — ALL tables prefixed `re_` | Full SQL schema is in spec Section 5. Four migrations: initial schema, RLS policies, storage setup, realtime setup. |
| R1.3 | RLS policies, storage bucket (`remix-engine/` prefix), Realtime enabled | RLS helper functions (`is_active_user()`, `is_editor_or_admin()`, `is_admin()`) + storage policies + `ALTER PUBLICATION supabase_realtime ADD TABLE` are all specified in spec. |
| R1.4 | Auth flow — Supabase email/password, invite-only signup, role-based middleware | `supabaseAdmin.auth.admin.inviteUserByEmail()` + `handle_new_user` trigger + `src/middleware.ts` using `@supabase/ssr` `createServerClient`. |
| R1.5 | Dark mode dashboard layout with sidebar navigation (standalone mode shell) | shadcn/ui + next-themes + Tailwind v4 `@custom-variant dark` in globals.css. Collapsible 240px sidebar with localStorage persistence. |
| R1.6 | BullMQ job queue with Redis connection | BullMQ 5.x + ioredis 5.x. Worker runs outside Next.js with `tsconfig.worker.json`. Queue definitions in `src/lib/queue/queues.ts`. |
| R1.7 | `RemixEngineProvider` context — the module boundary layer | Full spec in Section 0. React context + server singleton (`getServerConfig()` / `setServerConfig()`). |
| R1.8 | `RemixEngineConfig` type defining all injectable dependencies | Full interface in spec Section 0 with `mode`, `routePrefix`, `supabase`, `redis`, `apiKeys`, `auth?`, `webhookBaseUrl`, `storagePrefix`, `tablePrefix`. |
| R1.9 | UUPM design system generated at `design-system/MASTER.md` | To be generated via UUPM command. Must define `--re-` prefixed CSS variables. No hardcoded hex colors anywhere. |
| R1.10 | `.gitignore`, `.env.example`, Zod validation schemas file | Gitignore additions: `.env.local`, `/tmp/remixengine/`, `supabase/.temp/`. Zod schemas from spec Section 6. |
| RM.1 | `RemixEngineProvider` React context wraps all RemixEngine UI | Context creation pattern from spec Section 0. `createStandaloneConfig()` reads `process.env` only here. |
| RM.2 | `RemixEngineConfig` TypeScript interface with full contract | Interface spec verified in spec Section 0 and REQUIREMENTS.md — exact shape documented. |
| RM.3 | All API routes live under `routePrefix` | `src/app/api/remix-engine/` directory. No bare route names. |
| RM.4 | All DB tables prefixed with `tablePrefix` (`re_`) | `table('videos')` helper → `re_videos`. Never write bare table names. |
| RM.5 | All Supabase Storage paths prefixed with `storagePrefix` | `storagePath()` helper in `src/lib/remix-engine/hooks.ts`. Never construct paths manually. |
| RM.6 | CSS variables only — zero hardcoded colors | All colors via `--re-*` variables in globals.css. `@theme inline` maps to Tailwind utilities. |
| RM.7 | Layout components only render in standalone mode | `if (config.mode === 'module') return <>{children}</>` pattern in dashboard layout. |
| RM.8 | Auth pages only exist in standalone mode | `src/app/(auth)/` routes check `config.mode` before rendering. |
| RM.9 | `useRemixEngine()` hook provides config to any component | Context hook exported from `src/lib/remix-engine/hooks.ts`. Never `process.env` in client code. |
| RM.10 | Full spec exportable as JSON at health/spec endpoint | `src/app/api/remix-engine/spec.json/route.ts` — GET handler returning module contract. |
</phase_requirements>

---

## Summary

The project scaffold already exists as a Next.js 16.1.6 app with React 19 and Tailwind v4 — **newer than the spec's stated versions (Next.js 14, React 18, Tailwind v3)**. This is a positive finding: the newer stack is fully supported and the approach does not change, but the implementation details differ from what the spec examples show (Tailwind v4 is CSS-first with no `tailwind.config.js`, dark mode uses `@custom-variant` instead of `darkMode: 'class'`, shadcn/ui components use OKLCH colors).

The phase has three distinct workstreams that must happen in order: (1) infrastructure wiring (RemixEngineProvider, Supabase clients, BullMQ queues, Zod schemas, env setup), (2) database schema (four migration files, apply via `npx supabase db push`), and (3) UI shell (shadcn/ui install, design system generation, sidebar/header/auth pages). The RemixEngineProvider module boundary must be established first because every other component depends on it for config access.

Key constraint from CLAUDE.md: business logic NEVER reads `process.env` directly — only `createStandaloneConfig()` in `src/lib/remix-engine/config.ts` does. This rule must be enforced from the first line of code. The existing `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` already violate this (they read `process.env` directly) — they must be replaced with versions that use `getServerConfig()`.

**Primary recommendation:** Establish RemixEngineProvider and `getServerConfig()` first, then rewrite existing Supabase clients to use it, then run schema migrations, then install shadcn/ui and build the UI shell — in that strict order.

---

## Standard Stack

### Core (Already Scaffolded)
| Library | Version (actual) | Purpose | Notes |
|---------|---------|---------|-------|
| next | 16.1.6 | App Router framework | NEWER than spec. All App Router patterns apply. |
| react / react-dom | 19.2.3 | UI rendering | NEWER than spec. ForwardRefs removed in React 19. |
| typescript | ^5 | Type safety | Configured in `tsconfig.json` |
| @supabase/supabase-js | ^2.97.0 | DB + Auth + Storage | Newer than spec's ^2.45 |
| @supabase/ssr | ^0.8.0 | Cookie-based SSR session | Newer than spec's ^0.4 |
| tailwindcss | ^4 (v4) | Styling | MAJOR CHANGE from spec's v3 — CSS-first, no config file |

### To Be Added (Phase 1)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui | latest | Component library | Spec requirement R1.1. Fully supports Tailwind v4 + React 19 as of 2025. |
| lucide-react | ^0.575 (latest) | Icons | Spec's explicit suggestion. Spec references 0.441 but latest is 0.575. |
| next-themes | ^0.4 | Dark mode class toggling | Works with Tailwind v4 `@custom-variant` approach. |
| zod | ^3.23 | Validation schemas | Spec requirement R1.10, Section 6 has full schema definitions. |
| bullmq | ^5.12 | Job queue | Spec requirement R1.6. Worker process. |
| ioredis | ^5.4 | Redis client for BullMQ | Required by BullMQ. |
| class-variance-authority | ^0.7 | Component variant utility | shadcn/ui dependency. |
| clsx | ^2.1 | Class merging | shadcn/ui dependency. |
| tailwind-merge | ^2.5 | Tailwind class conflict resolution | shadcn/ui dependency. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-themes | Manual class toggle | next-themes handles SSR hydration safely; manual implementation risks flash-of-unstyled-content |
| shadcn/ui | Custom components | shadcn/ui gives owned, customizable components with full Tailwind v4 support |
| lucide-react | heroicons, phosphor | lucide-react is spec-explicit and has consistent icon naming |

**Installation:**
```bash
# shadcn/ui (handles its own deps including clsx, tailwind-merge, cva)
npx shadcn@latest init

# After shadcn init, add specific components needed for Phase 1
npx shadcn@latest add button input label dropdown-menu tooltip avatar separator

# Queue + Redis
npm install bullmq ioredis

# Validation
npm install zod

# Theming
npm install next-themes

# Icons
npm install lucide-react
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                    # Auth group — standalone mode only
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts      # Supabase OAuth callback
│   ├── (dashboard)/               # Protected group — requires auth
│   │   ├── layout.tsx             # Shell: checks config.mode, renders Sidebar+Header
│   │   ├── page.tsx               # Redirects to /dashboard/projects
│   │   ├── projects/page.tsx      # Placeholder for Phase 2
│   │   ├── queue/page.tsx         # Placeholder for Phase 2
│   │   ├── analytics/page.tsx     # Placeholder
│   │   └── admin/
│   │       └── page.tsx           # Admin placeholder for Phase 6
│   └── api/
│       └── remix-engine/          # ALL API routes — namespaced
│           └── spec.json/route.ts # RM.10 spec export
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx            # Collapsible sidebar — standalone mode
│   │   ├── Header.tsx             # Page title + user avatar — standalone mode
│   │   └── ThemeProvider.tsx      # next-themes wrapper
│   └── ui/                        # shadcn/ui components live here
├── lib/
│   ├── remix-engine/
│   │   ├── config.ts              # RemixEngineConfig type + createStandaloneConfig() + getServerConfig()
│   │   ├── provider.tsx           # RemixEngineProvider React context
│   │   └── hooks.ts               # useRemixEngine(), storagePath(), table() helpers
│   ├── supabase/
│   │   ├── client.ts              # Browser client (uses getServerConfig() — NOT process.env)
│   │   ├── server.ts              # Server client (cookie session)
│   │   ├── admin.ts               # Service role client (worker only)
│   │   └── types.ts               # Auto-generated types
│   ├── queue/
│   │   ├── connection.ts          # IORedis instance via getServerConfig()
│   │   └── queues.ts              # BullMQ Queue definitions
│   ├── auth/
│   │   ├── auth-context.tsx       # React context: user + role
│   │   ├── auth-guard.tsx         # Client redirect wrapper
│   │   ├── role-guard.tsx         # Hides content by role
│   │   ├── require-role.ts        # Server-side API route guard
│   │   └── auth-actions.ts        # Server actions: login, logout, invite
│   └── validators/
│       └── schemas.ts             # All Zod schemas (spec Section 6)
├── worker/
│   ├── index.ts                   # Worker entry point — outside Next.js
│   └── handlers/                  # Stub files for Phase 2+
├── middleware.ts                   # Session refresh + route protection
supabase/
├── config.toml
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_rls_policies.sql
│   ├── 003_storage_setup.sql
│   └── 004_realtime_setup.sql
└── seed.sql
design-system/
└── MASTER.md                      # UUPM-generated design tokens
```

### Pattern 1: RemixEngineProvider Module Boundary

**What:** Single React context that either reads from `process.env` (standalone) or accepts injected config (module). Every component reads config from this context, never from env directly.

**When to use:** Wrap the entire app in `src/app/layout.tsx` (standalone mode). In module mode, parent wraps their `<RemixEngine>` component.

```typescript
// Source: REMIXENGINE_SPEC_v3.md Section 0
// src/lib/remix-engine/config.ts

export interface RemixEngineConfig {
  mode: 'standalone' | 'module';
  routePrefix: string;
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  redis: { url: string };
  apiKeys: {
    youtube: string;
    gemini: string;
    falAi: string;
    elevenLabs: string;
    heyGen: string;
    runwayMl: string;
    kling?: string;
  };
  auth?: {
    user: { id: string; email: string; full_name?: string };
    role: 'admin' | 'editor' | 'viewer';
  };
  webhookBaseUrl: string;
  storagePrefix: string;   // default: 'remix-engine'
  tablePrefix: string;     // default: 're_'
}

// ONLY place process.env is read:
export function createStandaloneConfig(): RemixEngineConfig {
  return {
    mode: 'standalone',
    routePrefix: '/remix-engine',
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    redis: { url: process.env.REDIS_URL! },
    apiKeys: {
      youtube: process.env.YOUTUBE_DATA_API_KEY!,
      gemini: process.env.GOOGLE_GEMINI_API_KEY!,
      falAi: process.env.FAL_KEY!,
      elevenLabs: process.env.ELEVENLABS_API_KEY!,
      heyGen: process.env.HEYGEN_API_KEY!,
      runwayMl: process.env.RUNWAY_API_KEY!,
      kling: process.env.KLING_API_KEY,
    },
    webhookBaseUrl: process.env.WEBHOOK_BASE_URL || process.env.NEXT_PUBLIC_APP_URL!,
    storagePrefix: 'remix-engine',
    tablePrefix: 're_',
  };
}

// Server singleton:
let _serverConfig: RemixEngineConfig | null = null;
export function getServerConfig(): RemixEngineConfig {
  if (!_serverConfig) _serverConfig = createStandaloneConfig();
  return _serverConfig;
}
export function setServerConfig(config: RemixEngineConfig) {
  _serverConfig = config;
}
```

### Pattern 2: Supabase Clients via Config (Not process.env)

**What:** Supabase clients read credentials from `getServerConfig()` or `useRemixEngine()`, never from `process.env` directly. The existing scaffolded clients in `src/lib/supabase/` violate this rule and must be replaced.

**CRITICAL:** The existing `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` read `process.env` directly. These must be rewritten to use `getServerConfig()`.

```typescript
// Source: REMIXENGINE_SPEC_v3.md Section 3 (supabase-specialist agent)
// src/lib/supabase/admin.ts — for worker use only
import { createClient } from '@supabase/supabase-js';
import { getServerConfig } from '../remix-engine/config';

const config = getServerConfig();
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  { auth: { persistSession: false } }
);
```

### Pattern 3: Tailwind v4 Dark Mode + CSS Variables

**What:** Tailwind v4 is CSS-first. There is no `tailwind.config.js`. Dark mode is configured in `globals.css` with `@custom-variant`. All design tokens are `--re-*` CSS variables.

**When to use:** This replaces the Tailwind v3 `darkMode: 'class'` config key entirely.

```css
/* Source: Official Tailwind v4 docs + shadcn/ui Tailwind v4 docs */
/* src/app/globals.css */

@import "tailwindcss";

/* Dark mode via class toggling (next-themes sets .dark on <html>) */
@custom-variant dark (&:is(.dark *));

/* RemixEngine design tokens — all --re- prefixed */
:root {
  --re-bg-primary: hsl(240 10% 3.9%);
  --re-bg-secondary: hsl(240 3.7% 15.9%);
  --re-accent-primary: hsl(217 91% 60%);
  /* ... more from MASTER.md ... */
}

.dark {
  /* dark mode overrides if needed */
}

@theme inline {
  --color-re-bg-primary: var(--re-bg-primary);
  --color-re-accent-primary: var(--re-accent-primary);
  /* ... maps CSS vars to Tailwind utilities ... */
}
```

### Pattern 4: Collapsible Sidebar with localStorage Persistence

**What:** The sidebar manages its own collapse state. State persists via `localStorage` so it survives page navigation and browser refresh. Uses CSS `width` transition for animation (Claude's discretion item).

```typescript
// Pattern — localStorage + useState
'use client';
import { useState, useEffect } from 'react';

const SIDEBAR_KEY = 're-sidebar-collapsed';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SIDEBAR_KEY) === 'true';
  });

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
  };

  return (
    <aside style={{ width: collapsed ? '64px' : '240px' }} className="transition-all duration-200">
      {/* icon rail when collapsed, full nav when expanded */}
    </aside>
  );
}
```

### Pattern 5: Next.js Middleware for Session Refresh + Route Protection

**What:** `src/middleware.ts` intercepts every request (except static assets), refreshes the Supabase session cookie, and enforces auth/role-based routing.

**Critical:** Use `supabase.auth.getUser()` for route protection, NEVER `getSession()` — only `getUser()` validates the JWT server-side.

```typescript
// Source: Supabase docs https://supabase.com/docs/guides/auth/server-side/nextjs
// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getServerConfig } from './lib/remix-engine/config';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const config = getServerConfig();

  const supabase = createServerClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ALWAYS use getUser() — validates JWT, never getSession()
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = ['/login', '/signup', '/callback'].some(p => pathname.startsWith(p));

  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && isAuthRoute && !pathname.startsWith('/callback')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Admin route protection — fetch role from DB
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/remix-engine/admin')) {
    const { data: profile } = await supabase
      .from('re_users').select('role').eq('id', user!.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### Pattern 6: Invite-Only Auth Flow

**What:** No public signup. Admin uses `supabaseAdmin.auth.admin.inviteUserByEmail()` which sends a one-time email link. User clicks link → lands on `/signup?token=...` → sets password → `handle_new_user` trigger creates `re_users` profile with role from metadata.

**Signup page token validation:**
```typescript
// src/app/(auth)/signup/page.tsx
// Check for token in URL params — if absent, redirect to /login
import { redirect } from 'next/navigation';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { token_hash?: string; type?: string };
}) {
  // Supabase invite links include token_hash and type=invite
  if (!searchParams.token_hash || searchParams.type !== 'invite') {
    redirect('/login?message=invite-required');
  }
  // render signup form with token
}
```

### Pattern 7: BullMQ Queue Definitions

**What:** Queue instances defined once in `src/lib/queue/queues.ts`, imported by API routes for `.add()` and by worker for `.process()`. Worker is a completely separate Node.js process.

```typescript
// Source: REMIXENGINE_SPEC_v3.md Section 4 + BullMQ docs
// src/lib/queue/connection.ts
import IORedis from 'ioredis';
import { getServerConfig } from '../remix-engine/config';

export const redisConnection = new IORedis(getServerConfig().redis.url, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

// src/lib/queue/queues.ts
import { Queue } from 'bullmq';
import { redisConnection } from './connection';

export const scrapeQueue = new Queue('scrape', { connection: redisConnection });
export const remixQueue = new Queue('remix', { connection: redisConnection });
export const generateQueue = new Queue('generate', { connection: redisConnection });
export const renderQueue = new Queue('render', { connection: redisConnection });
```

### Pattern 8: table() and storagePath() Helpers

**What:** Helpers in `hooks.ts` prevent hardcoded prefixes in business logic. They resolve table names and storage paths via config.

```typescript
// Source: REMIXENGINE_SPEC_v3.md Section 0 and 11
// src/lib/remix-engine/hooks.ts
import { useContext, createContext } from 'react';
import type { RemixEngineConfig } from './config';
import { getServerConfig } from './config';

export const RemixEngineContext = createContext<RemixEngineConfig | null>(null);

export function useRemixEngine(): RemixEngineConfig {
  const ctx = useContext(RemixEngineContext);
  if (!ctx) throw new Error('useRemixEngine must be used within RemixEngineProvider');
  return ctx;
}

// Server-side helpers (not hooks):
export function table(name: string): string {
  return `${getServerConfig().tablePrefix}${name}`;
}
// table('videos') → 're_videos'

export function storagePath(...segments: string[]): string {
  return [getServerConfig().storagePrefix, ...segments].join('/');
}
// storagePath('videos', projectId, videoId, 'original.mp4')
// → 'remix-engine/videos/{projectId}/{videoId}/original.mp4'
```

### Anti-Patterns to Avoid

- **Reading `process.env` in business logic:** Every file except `createStandaloneConfig()` must use `getServerConfig()` or `useRemixEngine()`. The existing scaffolded Supabase clients violate this.
- **Hardcoding table names:** Write `table('videos')` not `'re_videos'` directly.
- **Hardcoding route paths in `<Link>`:** Write `${config.routePrefix}/projects/${id}` not `/projects/${id}`.
- **Hardcoding hex colors in components:** All colors via `--re-*` CSS variables.
- **Using `getSession()` for auth protection:** Always use `getUser()` in server code.
- **Tailwind v3 patterns in Tailwind v4:** No `tailwind.config.js` — configuration is all in `globals.css`. No `darkMode: 'class'` key — use `@custom-variant dark (&:is(.dark *))`.
- **Using `forwardRef` in components:** React 19 removes forwardRef requirement — pass `ref` directly as a prop.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Component primitives (buttons, dropdowns, dialogs) | Custom component implementations | shadcn/ui | Accessibility, keyboard nav, ARIA handled. Owned code that lives in `/components/ui/`. |
| Icon set | Custom SVG components | lucide-react | 1000+ consistent icons, tree-shaken, TypeScript typed. |
| Dark mode toggle with SSR hydration | Custom localStorage + class solution | next-themes | Handles hydration mismatch, SSR-safe, supports system preference. |
| CSS-in-JS theming system | Custom theme context | Tailwind v4 `@theme` + CSS variables | Browser-native, no runtime overhead, works with shadcn/ui. |
| Auth session management | Custom JWT cookie handling | @supabase/ssr + middleware | Handles token refresh, cookie synchronization across RSC and client. |
| Supabase TypeScript types | Hand-writing DB types | `npx supabase gen types typescript` | Auto-generated from actual schema, always in sync. |

**Key insight:** Phase 1 is infrastructure/plumbing — the value comes from correctness and isolation, not custom code. Use established tools for every cross-cutting concern so implementation stays focused on the RemixEngine-specific patterns.

---

## Common Pitfalls

### Pitfall 1: Tailwind v4 vs v3 Configuration
**What goes wrong:** Writing `tailwind.config.js` with `darkMode: 'class'` and `content: [...]` — these don't exist in Tailwind v4. Styles simply don't apply.
**Why it happens:** The spec examples and most online tutorials target Tailwind v3.
**How to avoid:** Tailwind v4 is CSS-first. All config goes in `globals.css`. Use `@import "tailwindcss"` (already in scaffold). Configure dark mode with `@custom-variant dark (&:is(.dark *))`. Define custom tokens with `@theme { }`.
**Warning signs:** `postcss.config.mjs` uses `@tailwindcss/postcss` (v4 confirmed). No `tailwind.config.js` in root. `globals.css` uses `@import "tailwindcss"` not `@tailwind base`.

### Pitfall 2: React 19 ForwardRef Removal
**What goes wrong:** Component code using `React.forwardRef()` will cause TypeScript errors or runtime issues with React 19.
**Why it happens:** React 19 passes `ref` as a regular prop — no forwardRef wrapper needed.
**How to avoid:** When adding shadcn/ui components via CLI, they are already updated. Don't copy old shadcn patterns from pre-React-19 sources. Write `function MyInput({ ref, ...props })` not `React.forwardRef((props, ref) => ...)`.
**Warning signs:** TypeScript error about `forwardRef` types or React version mismatch.

### Pitfall 3: Supabase Client process.env Leak
**What goes wrong:** Business logic reads `process.env.NEXT_PUBLIC_SUPABASE_URL` directly, breaking module mode where config is injected via `RemixEngineProvider`.
**Why it happens:** The scaffolded `src/lib/supabase/client.ts` and `server.ts` do exactly this. They are wrong and must be replaced.
**How to avoid:** Rewrite both to read from `getServerConfig()` (server) or receive config as parameter from `useRemixEngine()` hook (client). The only place `process.env` is allowed is `createStandaloneConfig()` in `src/lib/remix-engine/config.ts`.
**Warning signs:** Any file importing `process.env.SUPABASE_*` outside of `config.ts`.

### Pitfall 4: Supabase getSession() for Auth Protection
**What goes wrong:** Using `supabase.auth.getSession()` in middleware or Server Components to check if a user is authenticated. Session data can be spoofed.
**Why it happens:** `getSession()` is tempting because it's cheaper — but it doesn't validate the JWT signature.
**How to avoid:** Always use `supabase.auth.getUser()` for any security-sensitive check. `getSession()` is only safe for non-security-critical reads.
**Warning signs:** `getSession()` in `middleware.ts` or any server-side route guard.

### Pitfall 5: Middleware Cookie Sync
**What goes wrong:** Session cookie is refreshed in middleware but not written back to both the request (for Server Components) AND the response (for the browser). One side gets a stale token.
**Why it happens:** The middleware must call `setAll` on both `request.cookies` AND the new `NextResponse`.
**How to avoid:** Follow the exact double-set pattern shown in Pattern 5 above. The `supabaseResponse` variable must be re-created after each `setAll` call.
**Warning signs:** Random logouts, "Session not found" errors on subsequent requests after login.

### Pitfall 6: Worker tsconfig.worker.json Alias Gap
**What goes wrong:** Worker code uses `@/` path aliases which don't resolve outside Next.js, causing `Cannot find module '@/lib/...'` errors.
**Why it happens:** `@/` aliases are configured in `tsconfig.json` for the Next.js bundler. The worker uses a separate `tsconfig.worker.json` with `"paths": {}` (no aliases).
**How to avoid:** All worker code (under `src/worker/`) must use relative imports only: `../../lib/supabase/admin` not `@/lib/supabase/admin`. The `tsconfig.worker.json` must be created in Phase 1 even though the worker isn't fully implemented yet.
**Warning signs:** Compile error from `npx tsc -p tsconfig.worker.json`.

### Pitfall 7: BullMQ maxRetriesPerRequest
**What goes wrong:** IORedis connection fails immediately with `MaxRetriesPerRequestError` when BullMQ tries to use it, because BullMQ needs `maxRetriesPerRequest: null` on the Redis connection.
**Why it happens:** BullMQ uses blocking Redis commands that don't work with the default retry behavior.
**How to avoid:** Always set `maxRetriesPerRequest: null` in the IORedis constructor options (shown in Pattern 7).
**Warning signs:** Worker crashes immediately on startup with BullMQ connection error.

### Pitfall 8: Supabase handle_new_user Trigger Role
**What goes wrong:** Invited users all get `viewer` role regardless of what role was specified in the invite, because `inviteUserByEmail` metadata isn't passed to the trigger correctly.
**Why it happens:** The trigger reads `NEW.raw_user_meta_data->>'role'` — if the `data.role` option isn't passed to `inviteUserByEmail`, this field is null and defaults to `viewer`.
**How to avoid:** Always pass `{ data: { role: 'editor' } }` (or the desired role) as the second argument to `supabaseAdmin.auth.admin.inviteUserByEmail(email, { data: { role } })`.
**Warning signs:** All new users appear as viewers in the admin panel.

---

## Code Examples

Verified patterns from official sources:

### shadcn/ui with Tailwind v4 — globals.css structure
```css
/* Source: https://ui.shadcn.com/docs/tailwind-v4 */
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: hsl(0 0% 100%);
  --foreground: hsl(0 0% 3.9%);
  /* shadcn vars use hsl() wrappers in v4 */
}

.dark {
  --background: hsl(240 10% 3.9%);
  --foreground: hsl(0 0% 98%);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

### RemixEngine CSS variables (--re- prefix) layered on top
```css
/* All RemixEngine design tokens — from MASTER.md once generated */
:root {
  --re-bg-primary: hsl(240 10% 3.9%);
  --re-bg-sidebar: hsl(240 5% 6%);
  --re-accent-primary: hsl(217 91% 60%);
  --re-text-primary: hsl(0 0% 98%);
  --re-text-muted: hsl(240 5% 64.9%);
  --re-border: hsl(240 3.7% 15.9%);
  --re-sidebar-width: 240px;
  --re-sidebar-width-collapsed: 64px;
}

@theme inline {
  --color-re-bg-primary: var(--re-bg-primary);
  --color-re-accent-primary: var(--re-accent-primary);
}
```

### Supabase invite user (server action)
```typescript
// Source: REMIXENGINE_SPEC_v3.md Section 3 Agent 11
// src/lib/auth/auth-actions.ts
'use server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { InviteUserSchema } from '@/lib/validators/schemas';

export async function inviteUser(formData: FormData) {
  const parsed = InviteUserSchema.parse({
    email: formData.get('email'),
    role: formData.get('role') ?? 'editor',
    fullName: formData.get('fullName'),
  });

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    parsed.email,
    {
      data: {
        role: parsed.role,
        full_name: parsed.fullName,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/signup`,
    }
  );

  if (error) throw error;
}
```

### tsconfig.worker.json
```json
// Must be created in Phase 1 — no @/ aliases, CommonJS module output
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist/worker",
    "rootDir": "./src"
  },
  "include": ["src/worker/**/*", "src/lib/**/*"],
  "exclude": ["node_modules", ".next"]
}
```

### Module boundary check in dashboard layout
```typescript
// Source: REMIXENGINE_SPEC_v3.md Section 0
// src/app/(dashboard)/layout.tsx
import { getServerConfig } from '@/lib/remix-engine/config';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const config = getServerConfig();

  if (config.mode === 'module') {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[--re-bg-primary]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

---

## State of the Art

| Old Approach (Spec) | Current Approach (Scaffold) | Impact |
|---------------------|----------------------------|--------|
| Next.js 14 | Next.js 16.1.6 | No breaking changes for App Router patterns. Server Actions stable. |
| React 18 | React 19 | `forwardRef` no longer needed. Pass `ref` as regular prop. |
| Tailwind v3 (`tailwind.config.js`) | Tailwind v4 (CSS-first) | No `tailwind.config.js`. `@theme` replaces config. `@custom-variant` for dark mode. |
| `@supabase/ssr ^0.4` | `@supabase/ssr ^0.8.0` | API is compatible. Cookie handling patterns are the same. |
| `@supabase/supabase-js ^2.45` | `^2.97.0` | Compatible. Admin API unchanged. |
| shadcn/ui with Tailwind v3 | shadcn/ui fully supports Tailwind v4 | Init with `npx shadcn@latest init` — detects v4 automatically. Colors migrate to OKLCH. |

**Deprecated/outdated in this project:**
- `tailwind.config.js` does not exist and must NOT be created. Tailwind v4 reads only from CSS.
- `@tailwind base; @tailwind components; @tailwind utilities;` directives — replaced by `@import "tailwindcss"`.
- `darkMode: 'class'` in tailwind config — replaced by `@custom-variant dark` in CSS.
- `React.forwardRef()` — not needed in React 19.
- `supabase.auth.getSession()` for server-side auth protection — replaced by `supabase.auth.getUser()`.

---

## Open Questions

1. **UUPM Design System Generation**
   - What we know: UUPM is a separate tool that generates `design-system/MASTER.md`. The spec says "generated at build time via `--design-system` command." CLAUDE.md says "Read `design-system/MASTER.md` before building any UI."
   - What's unclear: UUPM is not a known npm package — it appears to be a project-specific or proprietary tool. It's unclear if a command exists in the project or if this needs to be manually created.
   - Recommendation: Generate a minimal `design-system/MASTER.md` manually as part of Phase 1 with the required `--re-*` CSS variable definitions. The planner should include a task to create this file with the dark SaaS aesthetic tokens before any UI components are built.

2. **Supabase Project Already Exists vs. New Setup**
   - What we know: The project has Supabase clients in `src/lib/supabase/` from the initial commit. No `supabase/` config directory exists yet.
   - What's unclear: Whether a Supabase project has been created on supabase.com and `.env.local` has been populated.
   - Recommendation: Phase 1 tasks should include: create Supabase project if not exists, populate `.env.local`, initialize local Supabase config (`npx supabase init`), write and apply all four migrations.

3. **Route prefix: `/remix-engine` vs. `/dashboard`**
   - What we know: `createStandaloneConfig()` sets `routePrefix: '/remix-engine'`. The CONTEXT.md decisions say "redirect to /dashboard after login."
   - What's unclear: The CONTEXT.md says "After successful login → redirect to `/dashboard`" but the spec's `routePrefix` is `/remix-engine`. In standalone mode, should the dashboard be at `/dashboard` (user-friendly) or `/remix-engine/dashboard` (module convention)?
   - Recommendation: Use `/dashboard` as the main UI path for standalone mode (matches user expectation and CONTEXT.md decision). The `routePrefix` in config is for API routes and programmatic link construction, not the literal path prefix. The Next.js routes should be in `src/app/(dashboard)/` which resolves to `/projects`, `/queue`, etc. Nav links use `config.routePrefix` as a prefix where applicable.

---

## Sources

### Primary (HIGH confidence)
- `REMIXENGINE_SPEC_v3.md` Sections 0, 3, 4, 5, 6, 11, 12 — Complete implementation specification
- `package.json` in project root — Actual installed versions confirmed
- `src/app/globals.css` + `postcss.config.mjs` — Tailwind v4 configuration confirmed
- `src/lib/supabase/client.ts` + `server.ts` — Existing code that must be replaced

### Secondary (MEDIUM confidence)
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — CSS variable structure, `@theme inline` pattern
- [Supabase SSR Next.js docs](https://supabase.com/docs/guides/auth/server-side/nextjs) — middleware pattern, `getUser()` security note
- [Supabase inviteUserByEmail JS docs](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) — invite API signature

### Tertiary (LOW confidence — verified by multiple search results)
- next-themes compatibility with Tailwind v4 `@custom-variant dark` pattern — multiple 2025 sources agree
- BullMQ `maxRetriesPerRequest: null` requirement — consistent across BullMQ docs and tutorials
- React 19 forwardRef removal — confirmed by shadcn/ui docs and React 19 release notes

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — actual installed versions confirmed from `package.json`. Newer than spec but fully compatible.
- Architecture patterns: HIGH — directly from spec Section 0, 3, 11 with minimal inference.
- Tailwind v4 specifics: HIGH — verified against official shadcn/ui Tailwind v4 docs.
- Auth flow: HIGH — directly from spec Section 3 Agent 11 + official Supabase docs.
- Pitfalls: HIGH — most come from reading the actual existing code vs. the spec requirements.

**Research date:** 2026-02-26
**Valid until:** 2026-03-28 (30 days — stack is stable, Tailwind v4 is released/stable)
