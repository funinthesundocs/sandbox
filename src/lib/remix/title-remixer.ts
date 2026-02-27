// src/lib/remix/title-remixer.ts
// Generates 8 categorized title variations using Gemini JSON mode.
// Uses getServerConfig() for the API key — zero process.env calls.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { getServerConfig } from '../remix-engine/config';
import { TitlesResponseSchema, RemixTitleParams } from './title-types';
import { buildTitlePrompt } from './title-prompts';

export async function generateTitleVariations(
  params: RemixTitleParams
): Promise<z.infer<typeof TitlesResponseSchema>> {
  const config = getServerConfig();
  const genAI = new GoogleGenerativeAI(config.apiKeys.gemini);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = buildTitlePrompt(params);

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.8,
      topP: 0.95,
      topK: 40,
    },
  });

  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned invalid JSON for title generation. Raw: ${text.substring(0, 200)}`);
  }

  try {
    return TitlesResponseSchema.parse(parsed);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new Error(`Title schema validation failed: ${err.message}. Raw: ${JSON.stringify(parsed).substring(0, 200)}`);
    }
    throw err;
  }
}
