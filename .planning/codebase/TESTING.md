# Testing Patterns

**Analysis Date:** 2026-02-26

## Test Framework

**Status:** Not yet configured

**Runner:**
- No test runner configured in current codebase
- Recommended for Next.js projects: Jest or Vitest
- Project setup stage — tests should be added during implementation phases

**Assertion Library:**
- Not yet selected
- Recommended: Jest's built-in assertions or Vitest + Chai/Expect

**Run Commands:**
```bash
# When testing is configured, expected commands:
npm run test              # Run all tests
npm run test:watch       # Watch mode for development
npm run test:coverage    # Generate coverage report
```

## Test File Organization

**Location:**
- Tests should be co-located with source files or in parallel `__tests__` directories
- Recommended pattern for Next.js:
  - `src/lib/supabase/__tests__/client.test.ts`
  - `src/lib/supabase/__tests__/server.test.ts`
  - `src/app/__tests__/layout.test.tsx`

**Naming:**
- Filename convention: `[module].test.ts` or `[module].spec.ts`
- Example: `client.test.ts` tests `client.ts`
- Component tests: `[Component].test.tsx` for React components

**Structure:**
```
src/
├── lib/
│   └── supabase/
│       ├── client.ts
│       ├── server.ts
│       └── __tests__/
│           ├── client.test.ts
│           └── server.test.ts
├── app/
│   ├── layout.tsx
│   └── __tests__/
│       └── layout.test.tsx
```

## Test Structure

**Suite Organization (Recommended):**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('createClient', () => {
  beforeEach(() => {
    // Setup for each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should create a Supabase client with correct credentials', () => {
    // Arrange
    const expectedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // Act
    const client = createClient();

    // Assert
    expect(client).toBeDefined();
  });

  it('should throw error when env vars are missing', () => {
    // Test error handling
  });
});
```

**Patterns:**
- Arrange-Act-Assert (AAA) pattern for test structure
- One logical assertion per test; multiple `expect()` calls acceptable for related assertions
- Descriptive test names using `it('should...')` convention
- Group related tests in `describe()` blocks

## Mocking

**Framework:**
- When configured, use Vitest's `vi.mock()` or Jest's `jest.mock()`
- For Next.js specific mocking: Use `next/navigation` mocks for router/params

**Patterns (Recommended for this codebase):**
```typescript
// Mock Supabase client
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({
    from: vi.fn(),
    auth: vi.fn(),
    // Add other methods as needed
  })),
  createServerClient: vi.fn(() => ({
    from: vi.fn(),
    auth: vi.fn(),
  })),
}));

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
```

**What to Mock:**
- External API clients (Supabase, HeyGen, ElevenLabs, Runway, Gemini, fal.ai)
- Next.js server functions (`cookies()`, `headers()`, `redirect()`)
- File system operations (uploads to storage)
- Redis/BullMQ operations (queue jobs)
- Environment variable reads

**What NOT to Mock:**
- Pure utility functions that have no side effects
- Type checking (let TypeScript handle it)
- Internal module imports (test the real behavior)
- Zod validation schemas (test actual validation behavior)

## Fixtures and Test Data

**Test Data:**
```typescript
// fixtures/supabase.ts
export const mockVideoData = {
  id: 'video-123',
  project_id: 'project-456',
  status: 'completed',
  created_at: '2026-02-26T00:00:00Z',
};

export const mockProjectData = {
  id: 'project-456',
  name: 'Test Project',
  user_id: 'user-789',
  created_at: '2026-02-26T00:00:00Z',
};

// Usage in test:
it('should fetch video metadata', () => {
  mockSupabaseClient.from.mockReturnValue({
    select: vi.fn().mockResolvedValue({
      data: [mockVideoData],
      error: null,
    }),
  });

  const result = await getVideo('video-123');
  expect(result).toEqual(mockVideoData);
});
```

**Location:**
- Create `src/__tests__/fixtures/` directory for shared test data
- Keep fixtures close to tests (same `__tests__` directory if single file)
- Factory functions for generating variations of test data

## Coverage

**Requirements:**
- Not yet enforced in this project
- Recommended targets:
  - Utility functions: 90%+
  - API routes: 85%+
  - React components: 80%+ (easier to test logic than visual rendering)
  - Worker handlers: 85%+ (critical job processing)

**View Coverage:**
```bash
npm run test:coverage
# Output: coverage/lcov-report/index.html (open in browser for detailed view)
```

## Test Types

**Unit Tests:**
- Test individual functions in isolation
- Focus: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
- Example: Test `createClient()` returns valid Supabase instance
- Scope: Single function/component behavior

**Integration Tests:**
- Test multiple modules working together
- Example: Test API route calls Supabase client and returns correct response
- Scope: Full request/response cycle for API routes
- Mocking: Mock external services (Supabase, storage, APIs)

**E2E Tests:**
- Not configured; consider later phases
- Framework: Playwright or Cypress for full workflow testing
- When needed: Test complete user journeys (auth → create project → scrape → remix)

## Common Patterns

**Async Testing (Vitest/Jest):**
```typescript
it('should create server client with cookies', async () => {
  const client = await createClient();
  expect(client).toBeDefined();
});

// Or with async/await in test body
it('should handle async operations', async () => {
  // Automatically awaits Promise
  const result = await someAsyncFunction();
  expect(result).toEqual(expectedValue);
});
```

**Error Testing:**
```typescript
it('should throw error when env vars missing', () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;

  expect(() => {
    createClient();
  }).toThrow('Missing Supabase URL');
});

// For async errors:
it('should reject when cookie operation fails', async () => {
  mockCookieStore.set.mockImplementation(() => {
    throw new Error('Cookie error');
  });

  await expect(createClient()).rejects.toThrow('Cookie error');
});
```

**Component Testing (React):**
```typescript
import { render, screen } from '@testing-library/react';

it('should render layout with children', () => {
  render(
    <RootLayout>
      <div>Test content</div>
    </RootLayout>
  );

  expect(screen.getByText('Test content')).toBeInTheDocument();
});
```

## Worker Testing

**Special Considerations:**
- Worker runs as separate Node.js process (not Next.js)
- Test file location: `src/worker/__tests__/handlers/[handler].test.ts`
- Mock Supabase admin client (`supabaseAdmin`) instead of regular client
- Test job queue setup: Mock BullMQ queues
- Always verify `cleanTempDir(videoId)` called in finally block

**Example Worker Test:**
```typescript
import { scrapeHandler } from '@/worker/handlers/scrape';
import { vi } from 'vitest';

describe('scrapeHandler', () => {
  it('should scrape video and save metadata', async () => {
    const mockJob = {
      data: { videoUrl: 'https://youtube.com/watch?v=test' },
    };

    const result = await scrapeHandler(mockJob);

    expect(result).toEqual({
      videoId: expect.any(String),
      transcript: expect.any(String),
    });
  });

  it('should clean temp directory in finally block', async () => {
    const cleanupSpy = vi.spyOn(fs, 'rmSync');

    try {
      await scrapeHandler(mockJob);
    } finally {
      expect(cleanupSpy).toHaveBeenCalledWith(expect.stringContaining('temp'));
    }
  });
});
```

---

*Testing analysis: 2026-02-26*
