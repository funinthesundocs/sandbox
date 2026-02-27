jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { POST, PATCH } from '../select/route';
import { NextRequest } from 'next/server';

const mockUser = { id: 'user-uuid' };

function makeSupabaseMock() {
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      // Final .eq() in the update chain must resolve
      then: jest.fn().mockResolvedValue({ error: null }),
    }),
  };
}

describe('POST /api/remix-engine/remix/select', () => {
  it('returns 401 when unauthenticated', async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    });
    const req = new NextRequest('http://localhost/api/remix-engine/remix/select', {
      method: 'POST',
      body: JSON.stringify({ videoId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', type: 'title', id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('clears existing selections and sets the chosen one', async () => {
    const updateMock = jest.fn().mockReturnThis();
    const eqMock = jest.fn().mockReturnThis();
    // Last update chain resolves
    eqMock.mockReturnValueOnce({ error: null });

    const mockClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
      from: jest.fn().mockReturnValue({ update: updateMock, eq: eqMock }),
    };
    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const req = new NextRequest('http://localhost/api/remix-engine/remix/select', {
      method: 'POST',
      body: JSON.stringify({ videoId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', type: 'title', id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    // Expect the route to call update twice: once to clear, once to set
    expect(updateMock).toHaveBeenCalledWith({ is_selected: false });
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ is_selected: true }));
  });

  it('accepts editedText and saves it for title type', async () => {
    const updateMock = jest.fn().mockReturnThis();
    const eqMock = jest.fn().mockReturnThis();
    eqMock.mockReturnValueOnce({ error: null });

    const mockClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
      from: jest.fn().mockReturnValue({ update: updateMock, eq: eqMock }),
    };
    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const req = new NextRequest('http://localhost/api/remix-engine/remix/select', {
      method: 'POST',
      body: JSON.stringify({
        videoId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        type: 'title',
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        editedText: 'My custom title edit',
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    await POST(req);
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'My custom title edit', is_selected: true }));
  });
});

describe('PATCH /api/remix-engine/remix/select (scene edit)', () => {
  it('updates dialogue_line for the given sceneId', async () => {
    const updateMock = jest.fn().mockReturnThis();
    const eqMock = jest.fn().mockReturnValue({ error: null });

    const mockClient = {
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }) },
      from: jest.fn().mockReturnValue({ update: updateMock, eq: eqMock }),
    };
    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const req = new NextRequest('http://localhost/api/remix-engine/remix/select', {
      method: 'PATCH',
      body: JSON.stringify({ sceneId: 'dddddddd-dddd-dddd-dddd-dddddddddddd', dialogueLine: 'Edited scene text.' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({ dialogue_line: 'Edited scene text.' });
  });
});
