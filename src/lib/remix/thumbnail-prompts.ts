import { ThumbnailStyle } from './thumbnail-types';

export function buildThumbnailPrompt(params: {
  videoTitle: string;
  style: ThumbnailStyle;
  analysisContext?: string;
  stylePromptOverride?: string;
}): string {
  const baseContext = params.analysisContext
    ? `Based on this YouTube thumbnail analysis: ${params.analysisContext.substring(0, 300)}. `
    : '';

  const override = params.stylePromptOverride
    ? ` Style modifier: ${params.stylePromptOverride}.`
    : '';

  const titleShort = params.videoTitle.substring(0, 60);

  const stylePrompts: Record<ThumbnailStyle, string> = {
    'bold-text-overlay': `YouTube thumbnail, bold dramatic text overlay "${titleShort}", high contrast colors, professional graphic design, clean background, eye-catching typography, 16:9 aspect ratio, 4K quality${override}`,
    'cinematic-scene': `YouTube thumbnail, cinematic widescreen scene related to "${titleShort}", dramatic lighting, atmospheric mood, professional photography, vibrant colors, no text overlays, 16:9 aspect ratio${override}`,
    'face-reaction': `YouTube thumbnail, expressive person or character reaction related to "${titleShort}", close-up portrait, dramatic expression, bright colors, studio lighting, highly engaging, 16:9 aspect ratio${override}`,
  };

  return baseContext + stylePrompts[params.style];
}
