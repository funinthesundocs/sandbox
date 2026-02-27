// src/lib/remix/title-types.ts
// Zod schemas for title variation generation via Gemini.

import { z } from 'zod';

export const TitleStyleSchema = z.enum([
  'Curiosity Gap',
  'Direct Value',
  'Contrarian',
  'Listicle',
  'Question',
  'Emotional Hook',
  'Tutorial',
  'Story-Driven',
]);

export const TitleVariationSchema = z.object({
  style: TitleStyleSchema,
  title: z.string().min(5).max(100),
  reasoning: z.string().min(10).max(500),
});

export const TitlesResponseSchema = z.object({
  variations: z.array(TitleVariationSchema).length(8),
});

export const RemixTitleParamsSchema = z.object({
  originalTitle: z.string().min(1),
  description: z.string(),
  channelName: z.string(),
  videoDuration: z.number().optional(),
});

export type TitleStyle = z.infer<typeof TitleStyleSchema>;
export type TitleVariation = z.infer<typeof TitleVariationSchema>;
export type TitlesResponse = z.infer<typeof TitlesResponseSchema>;
export type RemixTitleParams = z.infer<typeof RemixTitleParamsSchema>;
