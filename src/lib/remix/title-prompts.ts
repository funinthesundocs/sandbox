// src/lib/remix/title-prompts.ts
// Builds the Gemini prompt for generating 8 categorized title variations.

import { RemixTitleParams } from './title-types';

export function buildTitlePrompt(params: RemixTitleParams): string {
  return `You are a YouTube title optimization expert. Create EXACTLY 8 title variations for a video using distinct strategies.

Original title: "${params.originalTitle}"
Channel: "${params.channelName}"
Description: "${params.description.substring(0, 500)}"
${params.videoDuration ? `Duration: ${Math.round(params.videoDuration / 60)} minutes` : ''}

Generate EXACTLY 8 variations — one per style below. Each must:
- Be 5-100 characters
- Be a genuine creative remix preserving core information
- Have exactly three fields: style, title, reasoning

Styles (use EXACTLY these names):
1. "Curiosity Gap" — creates mystery or intrigue, withholds key info
2. "Direct Value" — clear benefit or promise upfront
3. "Contrarian" — challenges conventional wisdom
4. "Listicle" — "N ways", "Top N", numbered format
5. "Question" — provocative question format
6. "Emotional Hook" — triggers fear, excitement, or surprise
7. "Tutorial" — instructional or how-to framing
8. "Story-Driven" — narrative hook that builds tension

CRITICAL: Return EXACTLY 8 objects in "variations" array. One per style. Do not add extra fields. Do not merge styles.`;
}
