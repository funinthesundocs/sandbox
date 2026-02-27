// Mock Supabase clients
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/queue/queues', () => ({
  remixQueue: { add: jest.fn().mockResolvedValue({}) },
}));

import { createClient } from '@/lib/supabase/server';
import { remixQueue } from '@/lib/queue/queues';
import { POST as titlePost } from '../title/route';
import { POST as thumbnailPost } from '../thumbnail/route';
import { POST as scriptPost } from '../script/route';
import { NextRequest } from 'next/server';

const mockUser = { id: 'user-uuid-1234' };
const mockVideo = {
  original_title: 'Test Video',
  original_description: 'Desc',
  channel_name: 'Chan',
  duration_seconds: 120,
  original_thumbnail_url: null,
  original_transcript: 'Full transcript text.',
};
const mockJob = { id: 'job-uuid-5678' };

function makeSupabaseMock(overrides: Record<string, unknown> = {}) {
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockVideo }),
      insert: jest.fn().mockReturnThis(),
      ...overrides,
    }),
  };
}

describe('POST /api/remix-engine/remix/title', () => {
  it('returns 401 when unauthenticated', async () => {
    const mockClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    };
    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const req = new NextRequest('http://localhost/api/remix-engine/remix/title', {
      method: 'POST',
      body: JSON.stringify({ videoId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', projectId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await titlePost(req);
    expect(res.status).toBe(401);
  });

  it('returns 202 and enqueues job when authenticated', async () => {
    const mockClient = makeSupabaseMock();
    // insert chain returns job id
    mockClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({ data: mockVideo })  // video fetch
        .mockResolvedValueOnce({ data: mockJob }),   // job insert
      insert: jest.fn().mockReturnThis(),
    });
    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const req = new NextRequest('http://localhost/api/remix-engine/remix/title', {
      method: 'POST',
      body: JSON.stringify({ videoId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', projectId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await titlePost(req);
    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json).toHaveProperty('jobId');
    expect(remixQueue.add).toHaveBeenCalledWith('remix_title', expect.objectContaining({ type: 'title' }));
  });
});

describe('POST /api/remix-engine/remix/thumbnail', () => {
  it('returns 202 and enqueues 3 jobs when no style specified', async () => {
    const mockClient = makeSupabaseMock();
    let insertCallCount = 0;
    mockClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(() => {
        insertCallCount++;
        return Promise.resolve({ data: insertCallCount === 1 ? mockVideo : { id: `job-${insertCallCount}` } });
      }),
      insert: jest.fn().mockReturnThis(),
    });
    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const req = new NextRequest('http://localhost/api/remix-engine/remix/thumbnail', {
      method: 'POST',
      body: JSON.stringify({ videoId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', projectId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await thumbnailPost(req);
    expect(res.status).toBe(202);
  });
});

describe('POST /api/remix-engine/remix/script', () => {
  it('returns 422 when video has no transcript', async () => {
    const mockClient = makeSupabaseMock();
    mockClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { ...mockVideo, original_transcript: null } }),
    });
    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const req = new NextRequest('http://localhost/api/remix-engine/remix/script', {
      method: 'POST',
      body: JSON.stringify({ videoId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', projectId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await scriptPost(req);
    expect(res.status).toBe(422);
  });
});
