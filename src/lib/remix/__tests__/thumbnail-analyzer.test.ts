import { analyzeThumbnail } from '../thumbnail-analyzer';

// Mock @google/generative-ai
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Vivid red and yellow hues dominate the thumbnail. A close-up face shows intense surprise. The mood is dramatic and high-energy.',
        },
      }),
    }),
  })),
}));

// Mock getServerConfig
jest.mock('../../remix-engine/config', () => ({
  getServerConfig: jest.fn().mockReturnValue({
    apiKeys: {
      gemini: 'test-gemini-key',
    },
  }),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('analyzeThumbnail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a description string when fetch and Gemini succeed', async () => {
    const fakeBuffer = Buffer.from('fake-image-data');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => fakeBuffer.buffer,
    });

    const result = await analyzeThumbnail('https://example.com/thumbnail.jpg');

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('gracefully degrades when fetch returns a non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const result = await analyzeThumbnail('https://example.com/not-found.jpg');

    expect(result).toContain('Unable to analyze original thumbnail');
    // Should not throw
  });

  it('gracefully degrades when fetch throws a network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const result = await analyzeThumbnail('https://example.com/thumbnail.jpg');

    expect(result).toContain('Unable to analyze original thumbnail');
    // Should not throw
  });

  it('gracefully degrades when Gemini API throws', async () => {
    const fakeBuffer = Buffer.from('fake-image-data');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => fakeBuffer.buffer,
    });

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockRejectedValueOnce(new Error('Gemini API error')),
      }),
    }));

    const result = await analyzeThumbnail('https://example.com/thumbnail.jpg');

    expect(result).toContain('Thumbnail analysis unavailable');
    // Should not throw
  });
});
