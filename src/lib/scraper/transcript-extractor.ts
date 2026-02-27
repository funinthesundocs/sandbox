import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { getTempDir } from './temp-files';

const execAsync = promisify(exec);

/**
 * Extracts English auto-generated subtitles from a YouTube video using yt-dlp.
 * Returns the path to the .en.vtt file, or null if no captions are available.
 *
 * Subtitle extraction failure is non-fatal — the scrape continues without a transcript.
 */
export async function extractSubtitles(
  youtubeUrl: string,
  videoId: string
): Promise<string | null> {
  const tmpDir = getTempDir(videoId);

  try {
    const cmd = [
      'yt-dlp',
      '--write-auto-sub',
      '--sub-lang en',
      '--skip-download',
      `--output "${tmpDir}/%(id)s"`,
      `"${youtubeUrl}"`,
    ].join(' ');

    await execAsync(cmd, { timeout: 60 * 1000 });

    // Look for the generated .en.vtt file
    const vttFile = fs.readdirSync(tmpDir).find((f) => f.endsWith('.en.vtt'));
    if (vttFile) {
      return path.join(tmpDir, vttFile);
    }

    return null;
  } catch (err) {
    console.warn('[extractSubtitles] Subtitle extraction failed (non-fatal):', err);
    return null;
  }
}
