---
phase: 03-remix-pipeline-4-hours
plan: 01
subsystem: api
tags: [gemini, zod, title-generation, script-generation, ai, google-generative-ai, fal-ai]

# Dependency graph
requires:
  - phase: 01-foundation-4-hours
    provides: getServerConfig() in config.ts, RemixEngineConfig with apiKeys.gemini
  - phase: 02-scraping-pipeline-4-hours
    provides: Database schema with re_remixed_titles, re_remixed_scripts, re_scenes tables
provides:
  - generateTitleVariations() — Gemini JSON mode, returns exactly 8 validated TitleVariation objects
  - generateRemixedScript() — Gemini JSON mode, returns RemixedScript with sequential scenes (15-45s duration)
  - TitleVariationSchema, TitlesResponseSchema, RemixTitleParams Zod schemas
  - SceneSchema, RemixedScriptSchema, RemixScriptParams Zod schemas
  - Jest test infrastructure with ts-jest, node environment, @/ alias mapping
affects:
  - 03-remix-pipeline-4-hours (plans 02-07): worker handler, API routes, UI consume these functions

# Tech tracking
tech-stack:
  added:
    - "@google/generative-ai@0.12.0 — Gemini 2.0 Flash with JSON mode (responseMimeType: application/json)"
    - "@fal-ai/serverless-client@0.14.3 — fal.ai FLUX thumbnail generation (used by later plans)"
    - "jest@30.2.0 + ts-jest@29.4.6 — unit test framework with TypeScript support"
  patterns:
    - "Gemini JSON mode: responseMimeType application/json with temperature/topP/topK config"
    - "Two-stage parse: JSON.parse first (catch invalid JSON), then Zod.parse (catch schema mismatch)"
    - "Application-layer sequential validation: Zod enforces per-field rules, app code enforces cross-field ordering"
    - "getServerConfig() for all API key access — zero process.env in library code"
    - "Relative imports in lib files (../remix-engine/config) for worker process compatibility"

key-files:
  created:
    - src/lib/remix/title-types.ts
    - src/lib/remix/title-prompts.ts
    - src/lib/remix/title-remixer.ts
    - src/lib/remix/script-types.ts
    - src/lib/remix/script-prompts.ts
    - src/lib/remix/script-remixer.ts
    - src/lib/remix/__tests__/title-remixer.test.ts
    - src/lib/remix/__tests__/script-remixer.test.ts
    - jest.config.js
  modified:
    - package.json (added test script, @google/generative-ai, @fal-ai/serverless-client, jest deps)

key-decisions:
  - "Gemini model gemini-2.0-flash chosen — JSON mode support, cost-effective for structured output"
  - "Jest + ts-jest selected over Vitest — existing package.json already had jest/ts-jest devDeps pre-installed"
  - "Two-stage validation: JSON.parse then Zod.parse — gives distinct error messages for malformed JSON vs wrong schema"
  - "Sequential scene number check in application layer (not Zod) — array-level constraint requires cross-element logic"
  - "ts-jest v29.4.6 confirmed compatible with Jest v30 via peerDependency check"

patterns-established:
  - "Gemini library pattern: buildPrompt(params) → generateContent(JSON mode) → JSON.parse → Zod.parse → return"
  - "Test mock pattern: mock @google/generative-ai with _mockGenerateContent escape hatch for per-test control"
  - "Error message pattern: include schema name + Zod message + raw JSON substring for debuggability"

requirements-completed: [R3.1, R3.3]

# Metrics
duration: 5min
completed: 2026-02-27
---

# Phase 3 Plan 01: Gemini Title and Script Remix Libraries Summary

**Gemini 2.0 Flash JSON mode title remixer (8 categorized variations) and scene-split script remixer (15-45s duration enforcement) with full Zod v4 validation and Jest test infrastructure**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-27T06:25:50Z
- **Completed:** 2026-02-27T06:30:18Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Created `src/lib/remix/` directory with 6 production files: title-types, title-prompts, title-remixer, script-types, script-prompts, script-remixer
- Both `generateTitleVariations()` and `generateRemixedScript()` use Gemini 2.0 Flash JSON mode with two-stage validation (JSON.parse then Zod.parse) for clear error messages
- Established Jest test infrastructure (jest.config.js, ts-jest, node environment, @/ alias) — 9 tests across 2 suites all GREEN
- Application-layer sequential scene number validation in script-remixer catches out-of-order Gemini responses that pass Zod field-level validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Install packages and create title remix library** - `f1511c3` (feat)
2. **Task 2: Create script remix library** - `5b265db` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/lib/remix/title-types.ts` — TitleStyleSchema (8-value enum), TitleVariationSchema, TitlesResponseSchema (array.length(8)), RemixTitleParamsSchema
- `src/lib/remix/title-prompts.ts` — buildTitlePrompt(): instructs Gemini to return exactly 8 variations with exact style names
- `src/lib/remix/title-remixer.ts` — generateTitleVariations(): Gemini JSON mode, two-stage parse, Zod validation
- `src/lib/remix/script-types.ts` — SceneSchema (duration_seconds int 15-45), RemixedScriptSchema, RemixScriptParamsSchema
- `src/lib/remix/script-prompts.ts` — buildScriptPrompt(): enforces sequential scene numbers, 15-45s duration constraint in prompt
- `src/lib/remix/script-remixer.ts` — generateRemixedScript(): Gemini JSON mode, Zod validation, sequential scene number application-layer check
- `src/lib/remix/__tests__/title-remixer.test.ts` — 5 tests covering: happy path, wrong count, invalid enum, non-JSON, short title
- `src/lib/remix/__tests__/script-remixer.test.ts` — 4 tests covering: sequential numbers, duration out of range, non-sequential, non-JSON
- `jest.config.js` — Multi-project Jest config: node env for lib tests, jsdom env for component tests
- `package.json` — Added test script, @google/generative-ai@0.12.0, @fal-ai/serverless-client@0.14.3

## Decisions Made
- Used Gemini 2.0 Flash (not Pro) — JSON mode support, lower cost, sufficient quality for structured output
- Jest + ts-jest chosen — project already had jest/ts-jest in devDependencies (pre-existing), just needed jest.config.js and test script
- Two-stage validation (JSON.parse → Zod.parse) gives distinct error types: "invalid JSON" vs "schema validation failed"
- Sequential scene validation done in application code not Zod — Zod validates individual scene fields, cross-element ordering requires imperative forEach

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Set up Jest test infrastructure**
- **Found during:** Task 1 (title remix library — verification step)
- **Issue:** Plan referenced `npm run test` and test files but no test framework was configured (no jest.config.js, no test script in package.json). `npm run test` would fail with "missing script: test".
- **Fix:** Created jest.config.js with ts-jest preset, node environment, @/ alias mapping; added test script to package.json scripts
- **Files modified:** jest.config.js (created), package.json (test script added)
- **Verification:** `npm run test -- src/lib/remix/__tests__/title-remixer.test.ts --watchAll=false` — 5/5 PASS
- **Committed in:** f1511c3 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to run any tests. jest/ts-jest packages were already in devDependencies — only config file and script were missing. No scope creep.

## Issues Encountered
- Zod v4 (4.3.6) is installed — plan notes mention Zod v3 compat. Zod v4 is fully backward compatible for all patterns used (z.enum, z.object, z.array().length(), z.ZodError). No changes needed.
- ts-jest v29.4.6 with Jest v30.2.0: checked peerDependencies — ts-jest 29 explicitly supports "^29.0.0 || ^30.0.0". Compatible.

## Next Phase Readiness
- `generateTitleVariations()` and `generateRemixedScript()` ready for import by the remix worker handler (Plan 03)
- Worker handler must use relative imports (not @/ aliases) when importing from src/lib/remix/
- Both functions use `getServerConfig()` — worker process will auto-bootstrap from createStandaloneConfig()
- Test infrastructure ready for Plans 02-07 test files

---
*Phase: 03-remix-pipeline-4-hours*
*Completed: 2026-02-27*
