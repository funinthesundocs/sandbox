jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { POST } from '../videos/[videoId]/approve/route';
import { NextRequest } from 'next/server';

const mockUser = { id: 'user-uuid' };

describe('POST /api/remix-engine/videos/[videoId]/approve', () => {
  it('returns 401 when unauthenticated', async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const req = new NextRequest('http://localhost/api/remix-engine/videos/test-id/approve', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ videoId: 'test-id' }) });
    expect(res.status).toBe(401);
  });

  it('returns 422 when title is not selected', async () => {
    const mockClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
      from: jest.fn().mockImplementation((table: string) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        // Return empty for titles, data for others
        then: jest.fn().mockImplementation((cb: (v: { data: { id: string }[] }) => unknown) => {
          if (table === 're_remixed_titles') return Promise.resolve(cb({ data: [] }));
          return Promise.resolve(cb({ data: [{ id: 'some-id' }] }));
        }),
      })),
    };
    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const req = new NextRequest('http://localhost/api/remix-engine/videos/test-id/approve', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ videoId: 'test-id' }) });
    expect(res.status).toBe(422);
  });

  it('returns 200 with success:true when all selections exist', async () => {
    const mockClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        // Always return 1 item (selections exist)
        then: jest.fn().mockImplementation((cb: (v: { data: { id: string }[] }) => unknown) => Promise.resolve(cb({ data: [{ id: 'item-id' }] }))),
      }),
    };
    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const req = new NextRequest('http://localhost/api/remix-engine/videos/vid-id/approve', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ videoId: 'vid-id' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
