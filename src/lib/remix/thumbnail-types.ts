import { z } from 'zod';

// The 3 thumbnail variation styles — each gets a different visual approach
export const ThumbnailStyleSchema = z.enum([
  'bold-text-overlay',   // High contrast text, minimal imagery
  'cinematic-scene',     // Atmospheric, wide shot, mood-driven
  'face-reaction',       // Close-up expressive face/character
]);

export const ThumbnailGenerationParamsSchema = z.object({
  videoId: z.string().uuid(),
  originalThumbnailUrl: z.string().url().optional(),
  videoTitle: z.string(),
  videoDescription: z.string(),
  style: ThumbnailStyleSchema,
  stylePromptOverride: z.string().optional(), // User's custom style prompt for regeneration
});

export const ThumbnailAnalysisResultSchema = z.object({
  description: z.string(),
  colors: z.string(),
  composition: z.string(),
  mood: z.string(),
});

export type ThumbnailStyle = z.infer<typeof ThumbnailStyleSchema>;
export type ThumbnailGenerationParams = z.infer<typeof ThumbnailGenerationParamsSchema>;
export type ThumbnailAnalysisResult = z.infer<typeof ThumbnailAnalysisResultSchema>;
