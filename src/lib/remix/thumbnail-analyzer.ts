import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { getServerConfig } from '../remix-engine/config';

export async function analyzeThumbnail(thumbnailUrl: string): Promise<string> {
  const config = getServerConfig();
  const genAI = new GoogleGenerativeAI(config.apiKeys.gemini);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Fetch and convert to base64 — gracefully degrades on failure
  let imageData: string;
  try {
    const response = await fetch(thumbnailUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    imageData = Buffer.from(buffer).toString('base64');
  } catch {
    // Non-fatal: return generic analysis so thumbnail generation can still proceed
    return 'Unable to analyze original thumbnail. Using default composition for generation.';
  }

  const prompt = `Analyze this YouTube thumbnail briefly. In 2-3 sentences describe: dominant colors, main visual element, and overall mood. Be specific and visual. No bullet points.`;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/jpeg', data: imageData } },
          ] as Part[],
        },
      ],
    });
    return result.response.text();
  } catch {
    return 'Thumbnail analysis unavailable. Using default composition for generation.';
  }
}
