# Codebase Concerns

**Analysis Date:** 2026-02-26

## Critical Implementation Gaps

### Missing Core Architecture Layer

**Issue:** The `RemixEngineProvider` and `RemixEngineConfig` infrastructure is completely absent from codebase despite being the mandatory foundation in CLAUDE.md and REQUIREMENTS.md Section RM.1–RM.10.

**Files:** Missing entirely
- `src/lib/remix-engine/config.ts` — Should define `RemixEngineConfig` interface and `createStandaloneConfig()`
- `src/lib/remix-engine/provider.tsx` — Should export `RemixEngineProvider` React context
- `src/lib/remix-engine/hooks.ts` — Should export `useRemixEngine()`, `storagePath()`, `table()` helpers

**Impact:**
- All subsequent development cannot proceed without this boundary layer
- Cannot support module mode integration without provider
- Config is currently hardcoded with `process.env` directly in `src/lib/supabase/client.ts` (violates architecture rules)
- CLAUDE.md explicitly states: "Business logic NEVER reads `process.env` — the only place that happens is `createStandaloneConfig()`"

**Fix approach:**
1. Implement `RemixEngineConfig` TypeScript interface per REMIXENGINE_SPEC_v3.md Section 0 lines 61–88
2. Create `createStandaloneConfig()` function that reads `process.env` once at startup
3. Create `getServerConfig()` singleton for server-side access
4. Wrap app in `RemixEngineProvider` in `src/app/layout.tsx`
5. Replace direct `process.env` access in Supabase clients with config-derived values
6. Verify `npx tsc --noEmit` passes with zero errors

**Priority:** Critical — blocks all Phase 1 completion

---

### Incomplete Supabase Client Implementation

**Issue:** `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` are minimal scaffolds with hardcoded environment variable access, violating the architecture rule that config flows through `RemixEngineProvider`.

**Files:**
- `src/lib/supabase/client.ts` (8 lines) — Directly reads `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `src/lib/supabase/server.ts` (28 lines) — Same pattern for server-side
- Missing: `src/lib/supabase/admin.ts` — Service role client for worker (uses `SUPABASE_SERVICE_ROLE_KEY`)
- Missing: `src/lib/supabase/types.ts` — Auto-generated from schema (should be generated via `npx supabase gen types typescript --local`)

**Impact:**
- Cannot support module mode where config is injected (client cannot create Supabase client from config)
- No admin client means worker cannot access protected data
- No types means no type safety for database operations
- Error handling is missing — all clients should handle network failures gracefully per REMIXENGINE_SPEC_v3.md Section 16

**Fix approach:**
1. Refactor clients to receive config from `RemixEngineProvider` context
2. Create server config getter: `getServerConfig()` that reads singleton
3. Implement `src/lib/supabase/admin.ts` for worker-only operations (service role key)
4. Run `npx supabase gen types typescript --local > src/lib/supabase/types.ts` after database schema is created
5. Add error handling per spec Section 16

**Priority:** Critical — Phase 1 blocker

---

### Missing Database Schema and Migrations

**Issue:** Supabase is connected but no database schema exists. All `re_` prefixed tables are completely absent.

**Files:** Missing entirely
- Database migrations directory (typically `supabase/migrations/`)
- No `re_videos`, `re_projects`, `re_jobs`, `re_scenes`, `re_api_usage` tables
- No RLS policies (REQUIREMENTS.md R1.3)
- No Supabase Storage bucket `remix-engine/` with correct prefixes

**Impact:**
- Cannot store any data
- Job queue has nowhere to persist state
- Realtime subscriptions (R2.7) cannot subscribe to non-existent tables
- Cost estimation (R4.7) has no `re_api_usage` table to track usage

**Fix approach:**
1. Create migrations directory: `supabase/migrations/`
2. Write migration file with all table definitions per REMIXENGINE_SPEC_v3.md Section 5 (database schema SQL)
3. Include RLS policies per spec Section 5
4. Create Supabase Storage bucket with `remix-engine/` namespace
5. Run `npx supabase db push` to apply to remote
6. Generate types: `npx supabase gen types typescript --local > src/lib/supabase/types.ts`

**Priority:** Critical — Phase 1 blocker

---

### Missing Worker Infrastructure

**Issue:** BullMQ worker for background jobs (`src/worker/`) does not exist, yet pipeline requires it for:
- Phase 2: Scraping jobs
- Phase 3: Remix generation
- Phase 4: Avatar/B-roll generation, API usage tracking
- Phase 5: Video rendering

**Files:** Completely missing
- `src/worker/index.ts` — Worker entry point (runs outside Next.js)
- `src/worker/handlers/scrape.ts`
- `src/worker/handlers/remix.ts`
- `src/worker/handlers/generate.ts`
- `src/worker/handlers/render.ts`
- `src/lib/queue/connection.ts` — Redis connection
- `src/lib/queue/queues.ts` — BullMQ queue definitions
- `tsconfig.worker.json` — Separate TypeScript config for worker (relative imports only)
- `Dockerfile` — Chromium installation for Remotion rendering

**Impact:**
- Pipeline cannot execute any jobs beyond scraping (which needs to be async)
- Video rendering requires Chromium in container (R5.9) — impossible without Docker config
- Worker MUST use service role Supabase client (bypasses RLS) — blocking architectural separation
- Each handler MUST call `cleanTempDir(videoId)` in finally block (R2.8, R5.10) — not implemented anywhere
- Render queue requires `concurrency: 1` (CPU-intensive) — needs queue configuration

**Fix approach:**
1. Create `src/worker/index.ts` entry point with BullMQ worker initialization
2. Implement queue connection: `src/lib/queue/connection.ts` (reads `config.redisUrl`)
3. Define queues: `src/lib/queue/queues.ts` (scrape, remix, generate, render)
4. Create handler stubs for all four job types
5. Implement temp directory cleanup in finally blocks
6. Create `tsconfig.worker.json` with relative imports only
7. Add Dockerfile with Chromium installation per REMIXENGINE_SPEC_v3.md Section 18

**Priority:** Critical — blocks Phases 2–5

---

### Missing API Routes

**Issue:** API infrastructure is completely absent. All routes must live under `src/app/api/remix-engine/` with proper namespace isolation.

**Files:** Completely missing
- `src/app/api/remix-engine/scrape` — POST to scrape YouTube video
- `src/app/api/remix-engine/batch-scrape` — POST to scrape channel
- `src/app/api/remix-engine/remix` — POST to generate remixes
- `src/app/api/remix-engine/generate/audio` — POST for voice generation
- `src/app/api/remix-engine/generate/avatar` — POST for HeyGen avatar video
- `src/app/api/remix-engine/generate/broll` — POST for Runway ML B-roll
- `src/app/api/remix-engine/webhooks/heygen` — POST for HeyGen webhook
- `src/app/api/remix-engine/webhooks/runway` — POST for Runway webhook
- `src/app/api/remix-engine/health` — GET health check (R6.7)
- `src/app/api/remix-engine/spec.json` — GET full module contract (R6.9)

**Impact:**
- Frontend cannot trigger any pipeline operations
- No job status updates can be queried
- No cost estimation endpoint (R4.7)
- No cancel endpoints for generation jobs (R4.8)
- Webhooks cannot receive updates from HeyGen, Runway ML
- No health check for deployment verification

**Fix approach:**
1. Create `/api/remix-engine/` directory structure
2. Implement each route following pattern: validate input with Zod, check auth role, enqueue job, return response
3. All routes MUST use `getServerConfig()` not `process.env`
4. All routes MUST verify user role via middleware (R6.4)
5. All webhook endpoints MUST verify signatures per external service spec
6. See REMIXENGINE_SPEC_v3.md Section 7 for complete API route map

**Priority:** Critical — blocks all phases

---

## Architecture Rule Violations

### Direct process.env Access in Production Code

**Issue:** `src/lib/supabase/client.ts` and `src/lib/supabase/server.ts` read `process.env` directly, violating CLAUDE.md rule: "Business logic NEVER reads `process.env`."

**Files:**
- `src/lib/supabase/client.ts` line 5–6 — Direct `process.env.NEXT_PUBLIC_SUPABASE_URL`
- `src/lib/supabase/server.ts` line 8–9 — Same

**Impact:**
- Breaks module mode where config is injected, not from environment
- Makes testing harder (cannot provide mock config)
- Violates the config-as-dependency injection pattern

**Fix approach:**
1. Move all `process.env` reads to `createStandaloneConfig()` in `src/lib/remix-engine/config.ts`
2. Pass config through `RemixEngineProvider`
3. Supabase clients receive config from context, not env vars

**Priority:** High — must fix before Phase 1 completion

---

### Layout Not Wrapped in Provider

**Issue:** `src/app/layout.tsx` does not wrap children in `RemixEngineProvider`, breaking config distribution to all components.

**Files:**
- `src/app/layout.tsx` (34 lines) — Missing provider wrapper

**Impact:**
- Components cannot access config via `useRemixEngine()` hook
- Cannot support both standalone and module modes simultaneously
- All Supabase clients fail because config is not available

**Fix approach:**
1. Implement `RemixEngineProvider` in `src/lib/remix-engine/provider.tsx`
2. Wrap `children` in layout: `<RemixEngineProvider config={...}>{children}</RemixEngineProvider>`
3. Conditionally render shell UI (sidebar, header) only when `config.mode === 'standalone'`

**Priority:** Critical — Phase 1 blocker

---

### Missing Namespace Prefixes

**Issue:** Application uses bare names instead of required prefixes per CLAUDE.md namespace rules.

**Files:**
- `src/app/layout.tsx` — No `--re-` CSS variables
- `src/app/page.tsx` — No `--re-` CSS variables, hardcoded hex colors (#383838, #ccc)
- Database: No `re_` table prefix enforcement
- Storage: No `remix-engine/` path prefix
- CSS: No `--re-` variable prefix

**Impact:**
- When embedded as module, colors will collide with parent app
- Supabase Storage paths will collide with other modules in shared bucket
- Database queries will collide if parent app has similar table names

**Fix approach:**
1. Read `design-system/MASTER.md` (generated in Phase 1)
2. Replace all hardcoded colors with `--re-*` CSS variables
3. Verify all table names start with `re_`
4. Verify all storage paths start with `remix-engine/`
5. Use `storagePath()` helper for all asset URLs

**Priority:** High — affects module isolation

---

## Configuration & Environment

### Missing Environment Variables

**Issue:** `.env.example` does not exist. No documentation of required environment variables.

**Files:**
- `.env.example` — Missing
- `CLAUDE.md` lists environment var requirement but `.env.example` not found

**Impact:**
- New developers cannot know what to configure
- Deployment will fail with cryptic errors from missing keys
- No clear API key requirements documented

**Fix approach:**
1. Create `.env.example` with all required vars per REMIXENGINE_SPEC_v3.md Section 12
2. Include: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REDIS_URL, all API keys (YouTube, Gemini, HeyGen, 11Labs, Runway ML, fal.ai, Kling optional)
3. Include optional vars: KLING_API_KEY (fallback), WEBHOOKS_SECRET (for signature verification)

**Priority:** Medium — needed before deployment

---

### Incomplete Type Definitions

**Issue:** `src/lib/supabase/types.ts` does not exist. Must be auto-generated from schema.

**Files:**
- `src/lib/supabase/types.ts` — Missing (auto-generated)

**Impact:**
- All database queries have `unknown` type instead of proper types
- Cannot catch schema mismatches at compile time
- Type safety is lost for database operations

**Fix approach:**
1. Run `npx supabase gen types typescript --local > src/lib/supabase/types.ts` after migrations exist
2. Add to npm scripts: `"db:generate-types": "supabase gen types typescript --local > src/lib/supabase/types.ts"`
3. Document that this must run after every schema change

**Priority:** High — Phase 1 blocker

---

## Standalone vs Module Mode Awareness

### Layout Shell Components Not Mode-Aware

**Issue:** `src/app/layout.tsx` should only render sidebar, header, auth pages when `config.mode === 'standalone'`. Currently, no mode check exists because provider doesn't exist.

**Files:**
- `src/app/layout.tsx` — Missing mode check

**Impact:**
- Module mode will render RemixEngine's shell (sidebar, header) instead of letting parent provide shell
- Duplication and visual conflicts in module mode
- Auth pages will appear in module mode (not applicable)

**Fix approach:**
1. Get mode from `useRemixEngine()`: `const { config } = useRemixEngine()`
2. Conditionally render:
   ```typescript
   {config.mode === 'standalone' && <Sidebar />}
   {children}
   {config.mode === 'standalone' && <Footer />}
   ```
3. Auth pages (`/login`, `/signup`) should only exist in standalone mode via route groups

**Priority:** Medium — needed before module mode support

---

## Design System Not Generated

**Issue:** `design-system/MASTER.md` does not exist. UUPM design system generation required in Phase 1 (R1.9) but no output.

**Files:**
- `design-system/MASTER.md` — Missing
- `design-system/pages/*.md` — Missing

**Impact:**
- No design tokens available for consistent styling
- CSS variables not documented
- Component builders cannot follow design system rules

**Fix approach:**
1. Generate design system via UUPM command (run during Phase 1)
2. Save output to `design-system/MASTER.md`
3. Create page-specific overrides in `design-system/pages/` for each page
4. Reference in UI components before building

**Priority:** High — Phase 1 blocker

---

## Zod Validation Schemas Missing

**Issue:** REQUIREMENTS.md R6 Section 6 specifies Zod validation schemas for all API payloads, but no schemas file exists.

**Files:**
- `src/lib/validation/schemas.ts` — Missing

**Impact:**
- Cannot validate incoming API requests
- Type safety lost for request payloads
- Vulnerable to malformed inputs

**Fix approach:**
1. Create `src/lib/validation/schemas.ts`
2. Implement all Zod schemas per REMIXENGINE_SPEC_v3.md Section 6
3. Use in all API routes via middleware
4. Export types for frontend form validation

**Priority:** High — Phase 2 blocker (scrape validation)

---

## Deployment Configuration Missing

### Dockerfile Not Found

**Issue:** No Dockerfile exists. Production deployment requires Chromium for Remotion rendering (R5.9).

**Files:**
- `Dockerfile` — Missing
- `docker-compose.yml` — Missing
- `.dockerignore` — Missing

**Impact:**
- Cannot containerize for deployment
- Worker cannot render video (needs Chromium)
- Railway deployment will fail

**Fix approach:**
1. Create Dockerfile with:
   - Node.js base image
   - Chromium installation via apt (for Remotion)
   - FFmpeg installation
   - Application dependencies
   - See REMIXENGINE_SPEC_v3.md Section 18 for full config
2. Create `.dockerignore`
3. Test locally with `docker build .`

**Priority:** High — needed before production

---

### Railway Configuration Missing

**Issue:** No Railway configuration. Standalone deployment target requires Railway setup per REQUIREMENTS.md and STATE.md.

**Files:**
- `railway.json` — Missing
- `railway.toml` — Missing

**Impact:**
- Deployment instructions unclear
- Environment variables not configured in Railway
- Worker process not separated from web process

**Fix approach:**
1. Create Railway configuration with three services:
   - Web (Next.js): `npm run build && npm start`
   - Worker: `npm run worker:dev`
   - Redis: Official Redis plugin or service
2. Configure environment variables in Railway
3. Set up healthcheck on `/api/remix-engine/health`

**Priority:** Medium — Post-MVP deployment

---

## Testing & Quality

### No Test Infrastructure

**Issue:** Test framework, patterns, and test files are completely missing.

**Files:**
- `jest.config.js` — Missing
- `src/**/*.test.ts` — None found
- `src/**/*.spec.ts` — None found

**Impact:**
- No way to verify functionality
- Refactoring is risky without tests
- ROADMAP.md Phase 6 includes "Automated CI/CD with tests" (V2 post-MVP) but no foundation

**Fix approach:**
1. Install Jest: `npm install --save-dev jest @types/jest ts-jest`
2. Create `jest.config.js` with TypeScript support
3. Add npm script: `"test": "jest"`
4. Write tests for all API routes, hooks, utilities
5. Aim for >80% coverage per Phase 6

**Priority:** Low — Phase 6 post-MVP, but foundational infrastructure should start in Phase 1

---

### Linting Incomplete

**Issue:** ESLint is installed but not configured. `npm run lint` will fail.

**Files:**
- `.eslintrc.json` — Missing
- `.prettierrc` — Missing

**Impact:**
- Code style inconsistent across developers
- No automated formatting
- Build step incomplete (lint must pass per CLAUDE.md verify commands)

**Fix approach:**
1. Create `.eslintrc.json` with Next.js and TypeScript rules
2. Create `.prettierrc` with consistent formatting rules
3. Add npm scripts:
   - `"lint": "eslint src --max-warnings=0"`
   - `"format": "prettier --write \"src/**/*.{ts,tsx}\""`
4. Enforce in CI/CD

**Priority:** High — Phase 1 requirement (verify step)

---

## Security Considerations

### No Role-Based Access Control Middleware

**Issue:** REQUIREMENTS.md R6.4 requires role enforcement on every API route, but no middleware exists.

**Files:**
- Middleware file for role checks — Missing
- No `requireRole()` utility

**Impact:**
- Any user can access admin endpoints
- Viewer accounts can delete projects
- Editor accounts can manage API keys

**Fix approach:**
1. Create `src/lib/auth/middleware.ts` with `requireRole()` helper
2. Use in all API routes: `await requireRole(['admin'], user, role)`
3. Verify session in every route handler
4. Return 403 Forbidden for insufficient permissions

**Priority:** Critical — security requirement

---

### No Webhook Signature Verification

**Issue:** HeyGen and Runway webhooks require signature verification, but no verification code exists.

**Files:**
- Webhook verification utilities — Missing

**Impact:**
- Any attacker can spoof webhook events
- Job state can be corrupted by fake webhooks
- Assets could be overwritten

**Fix approach:**
1. Implement signature verification per HeyGen and Runway API docs
2. Create `src/lib/webhooks/verify.ts` with verification logic
3. Call in webhook endpoints before processing
4. Use `WEBHOOKS_SECRET` from config

**Priority:** High — security requirement before Phase 4

---

### Hardcoded Secrets Risk

**Issue:** No `.gitignore` entry documented for `.env*` files. Risk of committing secrets.

**Files:**
- `.gitignore` — Check entries

**Impact:**
- Environment variables could be accidentally committed
- API keys exposed to public repository

**Fix approach:**
1. Verify `.gitignore` includes:
   ```
   .env
   .env.local
   .env.*.local
   .env.production.local
   ```
2. Never commit files containing secrets
3. Use GitHub Secrets for CI/CD

**Priority:** Medium — good practice

---

## Performance & Scaling

### No Request Validation Pipeline

**Issue:** No validation on incoming requests. Large payloads could cause memory issues.

**Files:**
- Request size limits — Not configured
- Validation middleware — Missing

**Impact:**
- Large file uploads could OOM the server
- Malformed JSON could crash endpoint
- No protection against payload bombs

**Fix approach:**
1. Set Next.js middleware to limit request size (e.g., `maxRequestBodySize`)
2. Validate all inputs with Zod before processing
3. Implement timeouts on external API calls
4. Add rate limiting per user (post-MVP)

**Priority:** Medium — needed before production load

---

### Video File Size Not Limited

**Issue:** REQUIREMENTS.md R2.1 specifies max 20-min video but no validation enforces it.

**Files:**
- Scrape endpoint — Will be in `src/app/api/remix-engine/scrape` (missing)

**Impact:**
- User could scrape 3+ hour videos
- yt-dlp would consume excessive disk/memory
- Compression step would take hours
- Database would store gigantic files

**Fix approach:**
1. Add duration check in scrape endpoint before download
2. Reject videos >20 minutes with clear error
3. Implement file size check: reject >200MB before compression
4. Document limits in error messages

**Priority:** High — Phase 2 requirement

---

## Documentation Gaps

### Specification Section References Not Indexed

**Issue:** CLAUDE.md lists "Spec Quick Reference" but code doesn't cite specific sections, making it hard to verify implementation correctness.

**Files:**
- No cross-references between code and spec sections

**Impact:**
- Developers must search full 3K-line spec to find relevant details
- Risk of missing requirements
- Hard to verify completeness

**Fix approach:**
1. Add comments in each handler with spec section reference:
   ```typescript
   // See REMIXENGINE_SPEC_v3.md Section 14.2 (HeyGen Upload Asset API)
   ```
2. Cross-link database schema comments to spec Section 5
3. Link API route handlers to spec Section 7

**Priority:** Low — documentation only

---

## Summary of Blockers

| Concern | Severity | Phase Impact | Status |
|---------|----------|--------------|--------|
| Missing `RemixEngineProvider` + `RemixEngineConfig` | Critical | Phase 1 blocks all phases | Blocks execution |
| Missing database schema + migrations | Critical | Phase 1 blocks 2–5 | Blocks execution |
| Missing worker infrastructure | Critical | Phase 1 blocks 2–5 | Blocks execution |
| Missing API route scaffold | Critical | Phase 1 blocks 2–5 | Blocks execution |
| Missing Supabase admin client | Critical | Phase 1 blocks worker | Blocks execution |
| Direct `process.env` in production code | High | Module mode broken | Blocks execution |
| Layout not wrapped in provider | Critical | Phase 1 blocker | Blocks execution |
| Missing design system generation | High | Phase 1 blocker | Blocks execution |
| Missing Zod schemas | High | Phase 2 blocker | Blocks Phase 2 |
| Missing Dockerfile | High | Production deployment | Blocks deploy |
| No role-based middleware | Critical | Security risk | Blocks execution |
| Missing `.eslintrc` + `.prettierrc` | High | Phase 1 verify step fails | Blocks execution |
| No webhook signature verification | High | Phase 4 security | Blocks Phase 4 |
| Missing `.env.example` | Medium | Deployment docs | Blocks deploy |
| No test infrastructure | Low | Phase 6 (post-MVP) | Future phase |

---

*Concerns audit: 2026-02-26*
