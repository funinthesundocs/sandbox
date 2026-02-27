// src/lib/remix/script-prompts.ts
// Builds the Gemini prompt for generating a remixed script split into scenes.

import { RemixScriptParams } from './script-types';

export function buildScriptPrompt(params: RemixScriptParams): string {
  const transcriptPreview = params.originalTranscript.substring(0, 2000);
  return `You are a YouTube script editor. Rewrite this video content as an engaging script split into scenes.

Original title: "${params.originalTitle}"
Channel: "${params.channelName}"
${params.targetDurationSeconds ? `Target total duration: ~${Math.round(params.targetDurationSeconds / 60)} minutes` : ''}

Original transcript:
${transcriptPreview}

Rewrite this as a remixed script with these rules:
1. Split into scenes. Each scene: 15-45 seconds of spoken dialogue (estimate: ~150 words/min)
2. Scene numbers start at 1 and increase sequentially — no gaps, no duplicates
3. Each scene needs a broll_description: what visual footage would play (e.g. "Close-up of hands typing on keyboard")
4. duration_seconds must be an integer between 15 and 45
5. Keep the core information but improve pacing, hook, and engagement

Return valid JSON with this exact structure:
{
  "tone": "energetic and direct",
  "target_audience": "software developers",
  "scenes": [
    {
      "scene_number": 1,
      "dialogue_line": "spoken dialogue text for this scene",
      "duration_seconds": 25,
      "broll_description": "visual footage description",
      "on_screen_text": "optional text overlay or null"
    }
  ]
}

CRITICAL: scene_number must start at 1 and be sequential. duration_seconds must be 15-45. Do not include scene_number gaps.`;
}
