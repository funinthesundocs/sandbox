// src/lib/remix/script-types.ts
// Zod schemas for remixed script generation via Gemini.
// Scene duration is validated 15-45 seconds per requirement R3.3.

import { z } from 'zod';

export const SceneSchema = z.object({
  scene_number: z.number().int().min(1),
  dialogue_line: z.string().min(1),
  duration_seconds: z.number().int().min(15).max(45),
  broll_description: z.string().min(5),
  on_screen_text: z.string().optional(),
});

export const RemixedScriptSchema = z.object({
  scenes: z.array(SceneSchema).min(1),
  tone: z.string().optional(),
  target_audience: z.string().optional(),
});

export const RemixScriptParamsSchema = z.object({
  originalTitle: z.string().min(1),
  originalTranscript: z.string().min(1),
  channelName: z.string(),
  targetDurationSeconds: z.number().optional(), // e.g. 120 for 2-minute target
});

export type Scene = z.infer<typeof SceneSchema>;
export type RemixedScript = z.infer<typeof RemixedScriptSchema>;
export type RemixScriptParams = z.infer<typeof RemixScriptParamsSchema>;
