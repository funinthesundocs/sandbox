// src/lib/validators/schemas.ts
// Zod validation schemas for the RemixEngine pipeline.
// All schemas are exported for use in API routes and client-side validation.

import { z } from 'zod';

// ============================================
// SCRAPE
// ============================================
export const ScrapeRequestSchema = z.object({
  youtubeUrl: z.string().url().refine(
    (url) => /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/.test(url),
    { message: 'Must be a valid YouTube video URL' }
  ),
  projectId: z.string().uuid(),
});

export const BatchScrapeRequestSchema = z.object({
  channelUrl: z.string().url().refine(
    (url) => /^https?:\/\/(www\.)?youtube\.com\/(channel\/|c\/|@)/.test(url),
    { message: 'Must be a valid YouTube channel URL' }
  ),
  projectId: z.string().uuid(),
  videoIds: z.array(z.string()).min(1).max(10).optional(),
  maxVideos: z.number().int().min(1).max(10).default(10),
});

// ============================================
// REMIX
// ============================================
export const RemixTitleRequestSchema = z.object({
  videoId: z.string().uuid(),
});

export const RemixThumbnailRequestSchema = z.object({
  videoId: z.string().uuid(),
  customPromptModifier: z.string().max(500).optional(),
});

export const RemixScriptRequestSchema = z.object({
  videoId: z.string().uuid(),
  selectedTitleId: z.string().uuid().optional(),
  tone: z.enum(['professional', 'casual', 'energetic', 'educational', 'storytelling']).optional(),
});

// ============================================
// GENERATION
// ============================================
export const GenerateAudioRequestSchema = z.object({
  sceneId: z.string().uuid(),
  voiceId: z.string().min(1),
  voiceSettings: z.object({
    stability: z.number().min(0).max(1).default(0.5),
    similarity_boost: z.number().min(0).max(1).default(0.75),
    style: z.number().min(0).max(1).default(0.5),
  }).optional(),
});

export const GenerateAvatarRequestSchema = z.object({
  sceneId: z.string().uuid(),
  avatarId: z.string().min(1),
  background: z.object({
    type: z.enum(['color', 'image', 'transparent']),
    value: z.string().optional(),
  }).default({ type: 'color', value: '#0A0A0B' }),
  aspectRatio: z.enum(['16:9', '9:16']).default('16:9'),
});

export const GenerateBRollRequestSchema = z.object({
  sceneId: z.string().uuid(),
  provider: z.enum(['runway', 'kling', 'auto']).default('auto'),
  durationSeconds: z.number().int().min(2).max(8).default(4),
});

export const RenderRequestSchema = z.object({
  videoId: z.string().uuid(),
  scriptId: z.string().uuid(),
  includeIntro: z.boolean().default(true),
  includeOutro: z.boolean().default(true),
});

// ============================================
// PROJECTS
// ============================================
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  settings: z.object({
    aspect_ratio: z.enum(['16:9', '9:16']).default('16:9'),
    voice_id: z.string().nullable().default(null),
    avatar_id: z.string().nullable().default(null),
  }).optional(),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

// ============================================
// ADMIN
// ============================================
export const InviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer']).default('editor'),
  fullName: z.string().min(1).max(100).optional(),
});

export const UpdateUserSchema = z.object({
  role: z.enum(['admin', 'editor', 'viewer']).optional(),
  is_active: z.boolean().optional(),
  full_name: z.string().max(100).optional(),
});

// ============================================
// CANCEL
// ============================================
export const CancelJobSchema = z.object({
  jobId: z.string().uuid(),
});

// ============================================
// CONVENIENCE TYPES
// ============================================
export type ScrapeRequest = z.infer<typeof ScrapeRequestSchema>;
export type BatchScrapeRequest = z.infer<typeof BatchScrapeRequestSchema>;
export type RemixTitleRequest = z.infer<typeof RemixTitleRequestSchema>;
export type RemixThumbnailRequest = z.infer<typeof RemixThumbnailRequestSchema>;
export type RemixScriptRequest = z.infer<typeof RemixScriptRequestSchema>;
export type GenerateAudioRequest = z.infer<typeof GenerateAudioRequestSchema>;
export type GenerateAvatarRequest = z.infer<typeof GenerateAvatarRequestSchema>;
export type GenerateBRollRequest = z.infer<typeof GenerateBRollRequestSchema>;
export type RenderRequest = z.infer<typeof RenderRequestSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type InviteUser = z.infer<typeof InviteUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
export type CancelJob = z.infer<typeof CancelJobSchema>;
