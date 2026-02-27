// src/lib/remix/__tests__/title-remixer.test.ts
// Tests for generateTitleVariations — mocks Gemini and validates Zod schema enforcement.

import { generateTitleVariations } from '../title-remixer';
import { TitleVariationSchema } from '../title-types';

// Mock @google/generative-ai
jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn();
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
    _mockGenerateContent: mockGenerateContent,
  };
});

// Mock getServerConfig
jest.mock('../../remix-engine/config', () => ({
  getServerConfig: jest.fn().mockReturnValue({
    apiKeys: {
      gemini: 'test-gemini-key',
    },
  }),
}));

function makeVariations(overrides: object[] = []) {
  const base = [
    { style: 'Curiosity Gap', title: 'What They Never Tell You About TypeScript', reasoning: 'Creates mystery around a common topic to drive clicks from developers.' },
    { style: 'Direct Value', title: '10 TypeScript Tips That Save Hours of Debugging', reasoning: 'Immediately communicates the concrete benefit to the viewer.' },
    { style: 'Contrarian', title: 'Why Most TypeScript Tutorials Are Wrong', reasoning: 'Challenges established wisdom to attract curious and experienced viewers.' },
    { style: 'Listicle', title: 'Top 7 TypeScript Mistakes Developers Make Daily', reasoning: 'Numbered format sets clear expectations and implies actionable takeaways.' },
    { style: 'Question', title: 'Is Your TypeScript Code Actually Type-Safe?', reasoning: 'Provokes self-reflection and insecurity in the target audience.' },
    { style: 'Emotional Hook', title: 'Stop Wasting Time on Broken TypeScript Code', reasoning: 'Triggers frustration and urgency that every developer has felt.' },
    { style: 'Tutorial', title: 'How to Write Bulletproof TypeScript in 15 Minutes', reasoning: 'Clear instructional framing with a time constraint to reduce friction.' },
    { style: 'Story-Driven', title: 'I Spent 3 Days Debugging TypeScript — Here Is What I Found', reasoning: 'Personal narrative creates empathy and promises a useful revelation.' },
  ];
  return base.map((v, i) => ({ ...v, ...(overrides[i] || {}) }));
}

function getMockGenerateContent() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@google/generative-ai');
  return mod._mockGenerateContent as jest.Mock;
}

function mockGeminiResponse(data: unknown) {
  getMockGenerateContent().mockResolvedValue({
    response: {
      text: () => JSON.stringify(data),
    },
  });
}

const validParams = {
  originalTitle: 'TypeScript Best Practices',
  description: 'A deep dive into TypeScript tips and tricks for modern developers.',
  channelName: 'DevChannel',
};

describe('generateTitleVariations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns exactly 8 validated title objects with style, title, and reasoning fields', async () => {
    const variations = makeVariations();
    mockGeminiResponse({ variations });

    const result = await generateTitleVariations(validParams);

    expect(result.variations).toHaveLength(8);
    result.variations.forEach((v) => {
      expect(v).toHaveProperty('style');
      expect(v).toHaveProperty('title');
      expect(v).toHaveProperty('reasoning');
      expect(() => TitleVariationSchema.parse(v)).not.toThrow();
    });
  });

  test('rejects response with wrong number of variations', async () => {
    const variations = makeVariations().slice(0, 5); // only 5
    mockGeminiResponse({ variations });

    await expect(generateTitleVariations(validParams)).rejects.toThrow(
      /schema validation failed/i
    );
  });

  test('rejects response with invalid style enum value', async () => {
    const variations = makeVariations();
    variations[0] = { ...variations[0], style: 'InvalidStyle' };
    mockGeminiResponse({ variations });

    await expect(generateTitleVariations(validParams)).rejects.toThrow(
      /schema validation failed/i
    );
  });

  test('rejects non-JSON response from Gemini', async () => {
    getMockGenerateContent().mockResolvedValue({
      response: {
        text: () => 'This is not JSON at all',
      },
    });

    await expect(generateTitleVariations(validParams)).rejects.toThrow(
      /invalid JSON/i
    );
  });

  test('rejects title shorter than 5 characters', async () => {
    const variations = makeVariations();
    variations[0] = { ...variations[0], title: 'Hi' }; // too short (< 5 chars)
    mockGeminiResponse({ variations });

    await expect(generateTitleVariations(validParams)).rejects.toThrow(
      /schema validation failed/i
    );
  });
});
