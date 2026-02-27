# Deferred Items — Phase 03: Remix Pipeline

## Pre-existing TypeScript Errors (Stub Test Files)

**Discovered during:** Plan 03-02 execution

**Issue:** The following stub test files reference API route modules that don't exist yet (they'll be built in Plans 03-04-05). This causes `npx tsc --noEmit` to fail.

**Files with errors:**
- `src/app/api/remix-engine/__tests__/gate.test.ts` — imports from `../videos/[videoId]/approve/route` (not yet built)
- `src/app/api/remix-engine/remix/__tests__/route.test.ts` — imports from `../title/route`, `../thumbnail/route`, `../script/route` (not yet built)
- `src/app/api/remix-engine/remix/__tests__/selection.test.ts` — imports from `../select/route` (not yet built)

**Status:** Pre-existing before Plan 02 work. Out of scope for Plans 01-02 (library layer).

**Resolution path:** These errors will resolve automatically when Plans 03-04-05 implement the API routes. The stub test files were created by Plan 03-00 or the Plan 01 executor as forward-looking test stubs.

**Impact:** TypeScript compile step in Plans 01-02 verification fails due to these stubs. The Plan 02 source files (thumbnail-*.ts) compile clean in isolation.
