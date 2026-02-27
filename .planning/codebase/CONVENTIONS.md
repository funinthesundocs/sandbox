# Coding Conventions

**Analysis Date:** 2026-02-26

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `layout.tsx`, `page.tsx`)
- Utility/service modules: camelCase with `.ts` extension (e.g., `client.ts`, `server.ts`)
- No component suffix required for page components in Next.js app directory

**Functions:**
- Regular functions: camelCase (e.g., `createClient()`, `setAll()`)
- React components: PascalCase (e.g., `RootLayout`, `Home`)
- Handler functions: camelCase with intent prefix (e.g., `getAll()`, `setAll()`)

**Variables:**
- Local variables: camelCase (e.g., `cookieStore`, `geistSans`, `geistMono`)
- Constants: camelCase for module-level exports, UPPER_SNAKE_CASE for shared magic constants (observe in codebase usage)
- Props objects: Readonly destructured with explicit type annotations
- CSS class utility: inline within JSX, Tailwind utility names (e.g., `className="flex min-h-screen items-center"`)

**Types:**
- Type imports: use `type` keyword for clarity (e.g., `import type { Metadata } from "next"`)
- React component props: Readonly inline types in destructured parameters (see `RootLayout` in `src/app/layout.tsx`)
- DB prefixes: All database-related identifiers use `re_` prefix (e.g., `re_videos`, `re_projects`)
- API route prefixes: All API routes under `/api/remix-engine/` namespace
- CSS variables: Prefixed with `--re-` for all design system tokens (e.g., `--re-bg-primary`, `--re-accent-primary`)
- Storage path helpers: Use `storagePath()` utility function, never hardcoded paths

## Code Style

**Formatting:**
- No Prettier config detected in repo — follows default Next.js formatting conventions
- Indentation: 2 spaces (standard Next.js/JavaScript convention)
- Line length: No enforced maximum, but readable lines preferred
- JSX: Multi-line JSX preferred when complex, inline for simple expressions

**Linting:**
- ESLint configuration: `eslint.config.mjs` using Flat Config format
- Config composition: Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
- TypeScript strict mode enabled in `tsconfig.json`
- Linting rule: Run with `npm run lint` — must pass

## Import Organization

**Order:**
1. External packages (React, Next.js, third-party libraries)
2. Type imports from external packages (e.g., `import type { Metadata } from "next"`)
3. Local imports using path alias `@/` (e.g., `import { createClient } from "@/lib/supabase/server"`)
4. Relative imports for local files (rarely used, path alias preferred)
5. CSS/stylesheet imports (e.g., `import "./globals.css"`)

**Path Aliases:**
- Configured in `tsconfig.json`: `@/*` → `./src/*`
- Always use `@/` for internal imports to avoid relative path fragility
- Worker code (`src/worker/`): Uses separate `tsconfig.worker.json` with relative imports only (no aliases)
- API routes and app directory can freely use `@/` aliases

**Example import order:**
```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = { ... };
```

## Error Handling

**Patterns:**
- Try-catch blocks for async operations (see `server.ts` setAll method)
- Empty catch blocks with explanatory comment when error is expected/ignorable
- Non-null assertion operator `!` used for environment variables (e.g., `process.env.NEXT_PUBLIC_SUPABASE_URL!`)
- Graceful degradation: Log or comment why catch block exists, don't silently fail

**Example:**
```typescript
try {
  cookiesToSet.forEach(({ name, value, options }) =>
    cookieStore.set(name, value, options)
  );
} catch {
  // The `setAll` method was called from a Server Component.
  // This can be ignored if you have middleware refreshing sessions.
}
```

## Logging

**Framework:** console methods (no special logging library detected in current codebase)

**Patterns:**
- Use `console.log()` for general information
- Use `console.error()` for error states
- Include context in log messages for debugging
- Keep logs in catch blocks or error boundaries when relevant

## Comments

**When to Comment:**
- Explain WHY, not WHAT — code should be clear enough to show what it does
- Comment non-obvious behavior (e.g., expected errors that can be ignored)
- Document server vs. client context transitions (Next.js specific)
- Mark TODOs, FIXMEs, HACKs with issue references if applicable (none currently detected)

**JSDoc/TSDoc:**
- Use for exported functions and types
- Include parameter types and return type descriptions for public APIs
- Not heavily used in current minimal codebase, but recommended for future expansion

**Example:**
```typescript
/**
 * Creates a Supabase server client with cookie-based session management.
 * Handles auth refresh via middleware integration.
 */
export async function createClient() { ... }
```

## Function Design

**Size:**
- Prefer short, focused functions (under 30 lines for most utility functions)
- Current codebase: functions average 5-15 lines
- Complex logic: Break into separate helper functions

**Parameters:**
- Use destructured objects for multiple parameters
- Readonly type annotations for prop objects in React
- Keep parameter count ≤ 3; use object if more needed

**Return Values:**
- Be explicit about return types in function signatures
- Return whole client objects from factory functions (e.g., `createClient()`)
- Return void for side-effect-only functions

**Example:**
```typescript
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(...);
}
```

## Module Design

**Exports:**
- Named exports for utilities and factories (e.g., `export function createClient()`)
- Default exports for React components (e.g., `export default function RootLayout()`)
- Type exports with `export type` for clarity
- Single responsibility: Each module should do one thing well

**Barrel Files:**
- Not currently used in the minimal codebase
- Recommended pattern: Create `index.ts` in directories with multiple exports for cleaner imports
- Example: `src/lib/supabase/index.ts` could export `createClient` from both client and server

**Environment Variable Handling:**
- CRITICAL: Only read `process.env` in `src/lib/remix-engine/config.ts` via `createStandaloneConfig()`
- Use non-null assertion for required vars (e.g., `process.env.NEXT_PUBLIC_SUPABASE_URL!`)
- Configuration flows through `RemixEngineProvider` context; business logic accesses config, not env directly

## Namespace Isolation Rules

**Database Tables:**
- Always prefix: `re_` (e.g., `re_videos`, `re_projects`, `re_jobs`)
- Use `table()` helper from `src/lib/remix-engine/hooks.ts` instead of bare names

**API Routes:**
- All routes under `/api/remix-engine/` namespace
- Never create bare `/api/scrape`, always `/api/remix-engine/scrape`
- Helps distinguish RemixEngine APIs from other app endpoints

**Storage Paths:**
- Always prefix: `remix-engine/` (e.g., `remix-engine/videos/{projectId}/{videoId}/original.mp4`)
- Use `storagePath()` helper function instead of string concatenation
- Keep storage private; generate signed URLs server-side for client access

**CSS Variables:**
- All custom properties prefixed `--re-` (e.g., `--re-bg-primary`, `--re-accent-primary`)
- Source from `design-system/MASTER.md`
- No hardcoded hex colors; always use CSS variables

---

*Convention analysis: 2026-02-26*
