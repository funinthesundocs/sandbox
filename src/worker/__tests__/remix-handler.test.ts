// Worker handler uses relative imports — mock accordingly
jest.mock('../../lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'script-id' }, error: null }),
      then: jest.fn().mockResolvedValue({ error: null }),
    }),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
      }),
    },
  },
}));

jest.mock('../../lib/remix/title-remixer', () => ({
  generateTitleVariations: jest.fn().mockResolvedValue({
    variations: Array(8).fill({ style: 'Curiosity Gap', title: 'Test', reasoning: 'r' }),
  }),
}));

jest.mock('../../lib/remix/thumbnail-remixer', () => ({
  generateThumbnailVariation: jest.fn().mockResolvedValue({
    falUrl: 'https://fal.ai/files/test.jpg',
    prompt: 'test prompt',
    analysis: 'test analysis',
  }),
}));

jest.mock('../../lib/remix/script-remixer', () => ({
  generateRemixedScript: jest.fn().mockResolvedValue({
    scenes: [
      { scene_number: 1, dialogue_line: 'Scene 1', duration_seconds: 20, broll_description: 'Shot 1' },
    ],
    tone: 'energetic',
    target_audience: 'general',
  }),
}));

jest.mock('../../lib/remix-engine/hooks', () => ({
  storagePath: jest.fn((...args: string[]) => args.join('/')),
}));

// Mock global fetch for thumbnail download
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-image').buffer),
});

import { handleRemixJob } from '../../worker/handlers/remix';
import type { Job } from 'bullmq';

function makeJob(data: Record<string, unknown>): Job {
  return {
    data,
    updateProgress: jest.fn().mockResolvedValue(undefined),
  } as unknown as Job;
}

describe('handleRemixJob', () => {
  it('dispatches to title handler for type: title', async () => {
    const { generateTitleVariations } = jest.requireMock('../../lib/remix/title-remixer');
    const job = makeJob({
      type: 'title',
      jobId: 'job-1',
      videoId: 'vid-1',
      projectId: 'proj-1',
      video: { originalTitle: 'Test', description: 'Desc', channelName: 'Chan' },
    });
    await handleRemixJob(job);
    expect(generateTitleVariations).toHaveBeenCalled();
  });

  it('dispatches to thumbnail handler for type: thumbnail', async () => {
    const { generateThumbnailVariation } = jest.requireMock('../../lib/remix/thumbnail-remixer');
    const job = makeJob({
      type: 'thumbnail',
      jobId: 'job-2',
      videoId: 'vid-1',
      projectId: 'proj-1',
      style: 'bold-text-overlay',
      video: { originalTitle: 'Test', originalDescription: 'Desc', originalThumbnailUrl: null },
    });
    await handleRemixJob(job);
    expect(generateThumbnailVariation).toHaveBeenCalled();
  });

  it('dispatches to script handler for type: script', async () => {
    const { generateRemixedScript } = jest.requireMock('../../lib/remix/script-remixer');
    const job = makeJob({
      type: 'script',
      jobId: 'job-3',
      videoId: 'vid-1',
      projectId: 'proj-1',
      video: { originalTitle: 'Test', originalTranscript: 'Transcript text', channelName: 'Chan' },
    });
    await handleRemixJob(job);
    expect(generateRemixedScript).toHaveBeenCalled();
  });

  it('throws for unknown job type', async () => {
    const job = makeJob({
      type: 'unknown',
      jobId: 'job-4',
      videoId: 'vid-1',
      projectId: 'proj-1',
      video: {},
    });
    await expect(handleRemixJob(job)).rejects.toThrow(/unknown remix job type/i);
  });

  it('updates job progress to 100 on completion', async () => {
    const job = makeJob({
      type: 'title',
      jobId: 'job-5',
      videoId: 'vid-1',
      projectId: 'proj-1',
      video: { originalTitle: 'Test', description: '', channelName: '' },
    });
    await handleRemixJob(job);
    expect(job.updateProgress).toHaveBeenCalledWith(100);
  });
});
