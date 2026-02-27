---
phase: 03-remix-pipeline-4-hours
plan: 05
subsystem: ui
tags: [react, next.js, tailwind, testing-library, jest, supabase]

# Dependency graph
requires:
  - phase: 03-remix-pipeline-4-hours
    provides: "Plan 03 remix API routes (select, approve), Plan 04 PipelineTabs + remix review page shell"
provides:
  - "RemixReviewPage client orchestrator component"
  - "TitleGrid: 2-column radio grid with inline edit and per-title regen"
  - "ThumbnailCards: 3-card responsive grid with signed URL display and per-thumbnail regen"
  - "SceneEditor: stacked scene cards with click-to-edit inline textarea and blur-to-save"
  - "ApprovalGate: sticky checklist bar with 3 items + confirmation dialog + approve endpoint"
  - "POST /api/remix-engine/videos/[videoId]/approve — verifies all 3 selections before approving"
affects:
  - phase-04-generation (approval gate unlocks generation tab)

# Tech tracking
tech-stack:
  added:
    - "@testing-library/jest-dom setupFilesAfterEnv integration"
    - "src/types/testing.d.ts global type reference for jest-dom matchers"
  patterns:
    - "Named import aliasing to avoid server/client component name collision (RemixReviewPageClient)"
    - "Server-only helpers extracted to server-helpers.ts to avoid React createContext in API routes"

key-files:
  created:
    - "src/app/api/remix-engine/videos/[videoId]/approve/route.ts"
    - "src/components/remix/TitleGrid.tsx"
    - "src/components/remix/ThumbnailCards.tsx"
    - "src/components/remix/SceneEditor.tsx"
    - "src/components/remix/ApprovalGate.tsx"
    - "src/components/remix/RemixReviewPage.tsx"
    - "src/lib/remix-engine/server-helpers.ts"
    - "src/jest.setup.ts"
    - "src/types/testing.d.ts"
  modified:
    - "src/app/(dashboard)/projects/[id]/videos/[videoId]/remix/page.tsx"
    - "jest.config.js"
    - "src/app/globals.css"
    - "src/app/api/remix-engine/videos/[videoId]/transcript/route.ts"

key-decisions:
  - "Approve endpoint validates selections server-side (is_selected=true) — no new DB column needed; selections are the unlock signal"
  - "Page function named RemixReviewPage collides with client component import — resolved with 'as RemixReviewPageClient' alias"
  - "storagePath/table extracted to server-helpers.ts — hooks.ts uses createContext which breaks Turbopack when imported in API routes"
  - "globals.css @theme inline requires --color-border/ring/background/foreground for Tailwind v4 shadcn @apply compatibility"
  - "jest.config.js jsdom project gets setupFilesAfterEnv to load @testing-library/jest-dom matchers globally"
  - "Script reviewed = having a script present (scene count > 0) — simple, unambiguous gate per CONTEXT.md guidance"

patterns-established:
  - "Approval gate pattern: sticky checklist + disabled button + confirmation dialog summary"
  - "Inline edit pattern: card displays text by default, becomes textarea on selection/click, saves on blur via API"
  - "Radio card pattern: selected state via border color + accent check badge, inline edit appears only after card is selected"

requirements-completed:
  - R3.4
  - R3.5
  - R3.6

# Metrics
duration: 7min
completed: 2026-02-27
---

# Phase 3 Plan 05: Remix Review Interactive UI Summary

**Full remix review UI: TitleGrid radio-select with inline edit, ThumbnailCards with signed URLs + per-thumbnail regen, SceneEditor click-to-edit with blur-save, sticky ApprovalGate checklist + confirmation dialog, and approve API endpoint**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-27T06:57:37Z
- **Completed:** 2026-02-27T07:04:37Z
- **Tasks:** 2
- **Files modified:** 13 (9 created, 4 modified)

## Accomplishments
- Built 5 interactive React client components for the remix review UX (TitleGrid, ThumbnailCards, SceneEditor, ApprovalGate, RemixReviewPage)
- Created `POST /api/remix-engine/videos/[videoId]/approve` endpoint with 3-way selection validation
- Wired RemixReviewPage into the remix page server component, replacing the TODO placeholder
- Fixed 4 pre-existing build blockers: jest-dom types, border-border Tailwind v4, hooks.ts createContext in API route, missing jest setup

## Task Commits

Each task was committed atomically:

1. **Task 1: Approve endpoint, TitleGrid, ThumbnailCards** - `747ec62` (feat)
2. **Task 2: SceneEditor, ApprovalGate, RemixReviewPage, remix page wire-up + bug fixes** - `1e7edac` (feat)

**Plan metadata:** *(final commit to follow)*

## Files Created/Modified
- `src/app/api/remix-engine/videos/[videoId]/approve/route.ts` — POST endpoint verifying title+thumbnail+script selection before returning 200
- `src/components/remix/TitleGrid.tsx` — 2-column grid of 8 radio-style cards; selected card shows inline textarea with 100-char limit + char count
- `src/components/remix/ThumbnailCards.tsx` — 3-card responsive grid (1 col mobile → 3 col sm+); signed URL images, selection overlay, per-thumbnail regen with style prompt input
- `src/components/remix/SceneEditor.tsx` — Stacked scene cards with scene number badge, duration badge (~Xs), click-to-edit textarea, blur-to-save via PATCH, full-script regen button
- `src/components/remix/ApprovalGate.tsx` — Sticky bar with 3 checklist items (CheckCircle2/Circle icons), Approve disabled until all 3, confirmation dialog showing selected title/thumbnail/scene count
- `src/components/remix/RemixReviewPage.tsx` — Orchestrator: manages selectedTitleId + selectedThumbnailId state across all 4 sub-components
- `src/app/(dashboard)/projects/[id]/videos/[videoId]/remix/page.tsx` — Replaced placeholder with `<RemixReviewPageClient>` when remix_status === 'complete'
- `src/lib/remix-engine/server-helpers.ts` — Server-only `storagePath()` and `table()` helpers without React import
- `jest.config.js` — Added `setupFilesAfterEnv` to jsdom project
- `src/jest.setup.ts` — Imports `@testing-library/jest-dom`
- `src/types/testing.d.ts` — Global TypeScript reference for jest-dom matcher types
- `src/app/globals.css` — Added `--color-border/ring/background/foreground` to `@theme inline` for Tailwind v4 shadcn compat
- `src/app/api/remix-engine/videos/[videoId]/transcript/route.ts` — Updated import from `hooks` to `server-helpers`

## Decisions Made
- Approve endpoint returns 200 with `{ success: true }` — no DB status field updated; generation tab unlocks by checking is_selected on its page server component
- `RemixReviewPage` component imported as `RemixReviewPageClient` to avoid name collision with the page's default export function
- "Script reviewed" = scenes.length > 0 (CONTEXT.md says "simply having a script present counts")

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added @testing-library/jest-dom setup for component tests**
- **Found during:** Task 2 (running RemixReviewPage.test.tsx)
- **Issue:** `toBeInTheDocument` and `toBeDisabled` matchers not globally available — test file imports existed but jest setup missing
- **Fix:** Created `src/jest.setup.ts` importing `@testing-library/jest-dom`, added `setupFilesAfterEnv` to jest.config.js jsdom project, created `src/types/testing.d.ts` for TypeScript declarations
- **Files modified:** `jest.config.js`, `src/jest.setup.ts`, `src/types/testing.d.ts`
- **Verification:** All 4 component tests passed, `npx tsc --noEmit` clean
- **Committed in:** `1e7edac`

**2. [Rule 1 - Bug] Fixed hooks.ts createContext causing Turbopack build error in API routes**
- **Found during:** Task 2 (`npm run build`)
- **Issue:** `transcript/route.ts` imported `storagePath` from `hooks.ts` which uses `createContext` — Turbopack rejects `createContext` in server-only API route context
- **Fix:** Created `src/lib/remix-engine/server-helpers.ts` with server-safe `storagePath`/`table` functions (no React import); updated transcript route import
- **Files modified:** `src/lib/remix-engine/server-helpers.ts`, `src/app/api/remix-engine/videos/[videoId]/transcript/route.ts`
- **Verification:** Build compiles successfully
- **Committed in:** `1e7edac`

**3. [Rule 1 - Bug] Fixed `border-border` unknown Tailwind utility class in globals.css**
- **Found during:** Task 2 (`npm run build`)
- **Issue:** `@apply border-border outline-ring/50` in globals.css failed because `--color-border` and `--color-ring` weren't in `@theme inline` — Tailwind v4 requires explicit theme mapping
- **Fix:** Added `--color-border: var(--border)`, `--color-ring: var(--ring)`, `--color-background: var(--background)`, `--color-foreground: var(--foreground)` to `@theme inline` block
- **Files modified:** `src/app/globals.css`
- **Verification:** Build compiles successfully
- **Committed in:** `1e7edac`

---

**Total deviations:** 3 auto-fixed (1 missing test infrastructure, 2 pre-existing build bugs)
**Impact on plan:** All fixes necessary for tests to pass and build to succeed. No scope creep.

## Issues Encountered
- Pre-existing build failures from Plans 02 and 04 blocked `npm run build` — these were out-of-scope at the time but became blockers per plan success criteria. Applied Rule 1/2 fixes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full Phase 3 remix review UI is complete. Users can now select titles, thumbnails, review scenes, and click Approve to proceed.
- Phase 4 (Generation) needs to check `is_selected=true` entries for title/thumbnail/script before starting generation — the gate is enforced by the approve endpoint.
- All 9 Phase 3 test suites GREEN (38 tests), TypeScript clean, production build succeeds.

## Self-Check: PASSED

- approve/route.ts: FOUND
- TitleGrid.tsx: FOUND
- ThumbnailCards.tsx: FOUND
- SceneEditor.tsx: FOUND
- ApprovalGate.tsx: FOUND
- RemixReviewPage.tsx: FOUND
- server-helpers.ts: FOUND
- Commit 747ec62: FOUND
- Commit 1e7edac: FOUND
- Commit 3435fdd: FOUND

---
*Phase: 03-remix-pipeline-4-hours*
*Completed: 2026-02-27*
