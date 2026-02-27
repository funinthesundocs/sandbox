jest.mock('@fal-ai/serverless-client', () => ({
  config: jest.fn(),
  subscribe: jest.fn(),
}));

jest.mock('@/lib/remix-engine/config', () => ({
  getServerConfig: jest.fn().mockReturnValue({
    apiKeys: { gemini: 'test-gemini', falAi: 'test-fal' },
  }),
}));

// analyzeThumbnail is called internally — mock it to avoid needing Gemini
jest.mock('../thumbnail-analyzer', () => ({
  analyzeThumbnail: jest.fn().mockResolvedValue('Mock analysis text.'),
}));

import * as fal from '@fal-ai/serverless-client';
import { generateThumbnailVariation } from '../thumbnail-remixer';

describe('generateThumbnailVariation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fal.subscribe as jest.Mock).mockResolvedValue({
      images: [{ url: 'https://fal.ai/files/test-image.jpg' }],
    });
  });

  it('calls fal.subscribe with fal-ai/flux/dev model', async () => {
    await generateThumbnailVariation({
      videoId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      videoTitle: 'Test Video',
      videoDescription: 'Test description',
      style: 'bold-text-overlay',
    });
    expect(fal.subscribe).toHaveBeenCalledWith(
      'fal-ai/flux/dev',
      expect.objectContaining({ input: expect.any(Object) })
    );
  });

  it('requests 1280x720 image dimensions', async () => {
    await generateThumbnailVariation({
      videoId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      videoTitle: 'Test Video',
      videoDescription: 'Test description',
      style: 'cinematic-scene',
    });
    const callArgs = (fal.subscribe as jest.Mock).mock.calls[0][1];
    expect(callArgs.input.image_size).toEqual({ width: 1280, height: 720 });
  });

  it('returns falUrl, prompt, and analysis from the response', async () => {
    const result = await generateThumbnailVariation({
      videoId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      videoTitle: 'Test Video',
      videoDescription: 'Description',
      style: 'face-reaction',
    });
    expect(result).toHaveProperty('falUrl');
    expect(result).toHaveProperty('prompt');
    expect(result).toHaveProperty('analysis');
    expect(result.falUrl).toBe('https://fal.ai/files/test-image.jpg');
  });

  it('throws when fal.ai returns no images', async () => {
    (fal.subscribe as jest.Mock).mockResolvedValue({ images: [] });
    await expect(
      generateThumbnailVariation({
        videoId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        videoTitle: 'T',
        videoDescription: '',
        style: 'bold-text-overlay',
      })
    ).rejects.toThrow(/no images/i);
  });

  it('calls onProgress callback when provided', async () => {
    const onProgress = jest.fn();
    // Simulate onQueueUpdate being called during subscribe
    (fal.subscribe as jest.Mock).mockImplementation((_model: string, opts: { onQueueUpdate?: (update: { status: string }) => void }) => {
      opts.onQueueUpdate?.({ status: 'IN_PROGRESS' });
      return Promise.resolve({ images: [{ url: 'https://fal.ai/files/test.jpg' }] });
    });

    await generateThumbnailVariation(
      { videoId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', videoTitle: 'T', videoDescription: '', style: 'bold-text-overlay' },
      onProgress
    );
    expect(onProgress).toHaveBeenCalled();
  });
});
