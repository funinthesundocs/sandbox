// src/lib/remix/__tests__/script-remixer.test.ts
// Tests for generateRemixedScript — mocks Gemini and validates Zod schema enforcement.

import { generateRemixedScript } from '../script-remixer';

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

function makeValidScript(sceneCount = 3) {
  return {
    tone: 'energetic and direct',
    target_audience: 'developers',
    scenes: Array.from({ length: sceneCount }, (_, i) => ({
      scene_number: i + 1,
      dialogue_line: `This is the dialogue for scene ${i + 1} with enough content to be meaningful.`,
      duration_seconds: 25,
      broll_description: 'Developer typing code on a laptop with multiple monitors',
      on_screen_text: i === 0 ? 'Key insight here' : undefined,
    })),
  };
}

const validParams = {
  originalTitle: 'TypeScript Best Practices',
  originalTranscript: 'Today we are going to talk about TypeScript best practices that every developer should know. First, always use strict mode. Second, avoid the any type. Third, use interfaces over type aliases when possible.',
  channelName: 'DevChannel',
};

describe('generateRemixedScript', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns validated script with sequential scene numbers starting at 1', async () => {
    const validScript = makeValidScript(3);
    mockGeminiResponse(validScript);

    const result = await generateRemixedScript(validParams);

    expect(result.scenes).toHaveLength(3);
    result.scenes.forEach((scene, idx) => {
      expect(scene.scene_number).toBe(idx + 1);
    });
  });

  test('rejects scenes with duration_seconds outside 15-45 range', async () => {
    const script = makeValidScript(2);
    script.scenes[0].duration_seconds = 10; // too short
    mockGeminiResponse(script);

    await expect(generateRemixedScript(validParams)).rejects.toThrow(
      /schema validation failed/i
    );
  });

  test('rejects non-sequential scene numbers', async () => {
    const script = makeValidScript(3);
    script.scenes[1].scene_number = 5; // gap in sequence
    mockGeminiResponse(script);

    await expect(generateRemixedScript(validParams)).rejects.toThrow(
      /sequential/i
    );
  });

  test('rejects non-JSON response from Gemini', async () => {
    getMockGenerateContent().mockResolvedValue({
      response: {
        text: () => 'Not valid JSON content at all',
      },
    });

    await expect(generateRemixedScript(validParams)).rejects.toThrow(
      /invalid JSON/i
    );
  });
});
