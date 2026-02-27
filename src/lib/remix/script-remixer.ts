// src/lib/remix/script-remixer.ts
// Generates a remixed script split into scenes using Gemini JSON mode.
// Uses getServerConfig() for the API key — zero process.env calls.
// Validates sequential scene numbers (application-layer check) after Zod schema validation.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { getServerConfig } from '../remix-engine/config';
import { RemixedScriptSchema, RemixScriptParams } from './script-types';
import { buildScriptPrompt } from './script-prompts';

export async function generateRemixedScript(
  params: RemixScriptParams
): Promise<z.infer<typeof RemixedScriptSchema>> {
  const config = getServerConfig();
  const genAI = new GoogleGenerativeAI(config.apiKeys.gemini);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = buildScriptPrompt(params);

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
    },
  });

  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Gemini returned invalid JSON for script generation. Raw: ${text.substring(0, 200)}`);
  }

  let validated: z.infer<typeof RemixedScriptSchema>;
  try {
    validated = RemixedScriptSchema.parse(parsed);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new Error(`Script schema validation failed: ${err.message}`);
    }
    throw err;
  }

  // Application-layer: enforce sequential scene numbers starting at 1
  validated.scenes.forEach((scene, idx) => {
    if (scene.scene_number !== idx + 1) {
      throw new Error(
        `Scene numbers must be sequential starting at 1. Got scene_number ${scene.scene_number} at position ${idx + 1}`
      );
    }
  });

  return validated;
}
