import * as fal from '@fal-ai/serverless-client';
import { getServerConfig } from '../remix-engine/config';
import { ThumbnailGenerationParams } from './thumbnail-types';
import { buildThumbnailPrompt } from './thumbnail-prompts';
import { analyzeThumbnail } from './thumbnail-analyzer';

export interface GeneratedThumbnail {
  falUrl: string;   // Temporary fal.ai URL — download and upload to storage in worker
  prompt: string;   // The prompt used (stored in re_remixed_thumbnails.prompt)
  analysis: string; // Gemini Vision analysis (stored in re_remixed_thumbnails.analysis)
}

interface FalFluxOutput {
  images?: Array<{ url: string }>;
}

export async function generateThumbnailVariation(
  params: ThumbnailGenerationParams,
  onProgress?: (status: string) => void
): Promise<GeneratedThumbnail> {
  const config = getServerConfig();

  // Initialize fal client with API key from config (never process.env)
  fal.config({ credentials: config.apiKeys.falAi });

  // Step 1: Analyze original thumbnail (non-fatal)
  let analysis = 'No original thumbnail available.';
  if (params.originalThumbnailUrl) {
    analysis = await analyzeThumbnail(params.originalThumbnailUrl);
  }

  // Step 2: Build the image generation prompt
  const prompt = buildThumbnailPrompt({
    videoTitle: params.videoTitle,
    style: params.style,
    analysisContext: analysis,
    stylePromptOverride: params.stylePromptOverride,
  });

  // Step 3: Generate via fal.ai FLUX
  // Using unique seed per call for variation across the 3 thumbnails
  const result = await fal.subscribe('fal-ai/flux/dev', {
    input: {
      prompt,
      image_size: { width: 1280, height: 720 }, // YouTube thumbnail dimensions
      num_images: 1,
      enable_safety_checker: true,
      seed: Math.floor(Math.random() * 1_000_000),
    },
    onQueueUpdate: (update) => {
      onProgress?.(`fal.ai: ${update.status}`);
    },
    // 5-minute timeout — fal.ai default (60s) causes failures under load
    timeout: 300000,
  }) as FalFluxOutput;

  const images = result.images;
  if (!images || images.length === 0) {
    throw new Error('fal.ai returned no images for thumbnail generation');
  }

  return {
    falUrl: images[0].url,
    prompt,
    analysis,
  };
}
