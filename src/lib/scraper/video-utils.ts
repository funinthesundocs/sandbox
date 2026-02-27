import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

/**
 * Returns the duration of a video file in seconds using ffprobe.
 * Throws if ffprobe fails.
 */
export async function getVideoDuration(filePath: string): Promise<number> {
  const cmd = `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`;
  try {
    const { stdout } = await execAsync(cmd);
    const duration = parseFloat(stdout.trim());
    if (isNaN(duration)) {
      throw new Error(`ffprobe returned non-numeric duration: ${stdout.trim()}`);
    }
    return duration;
  } catch (err) {
    throw new Error(`Failed to get video duration: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Re-encodes a video file to 720p using ffmpeg in-place.
 * If the compressed file is larger than the original, keeps the original.
 */
export async function compressTo720p(filePath: string): Promise<void> {
  const compressedPath = `${filePath}.compressed.mp4`;
  const originalSize = getFileSizeBytes(filePath);

  const cmd = `ffmpeg -i "${filePath}" -vf scale=-2:720 -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 128k -y "${compressedPath}"`;
  await execAsync(cmd);

  const compressedSize = getFileSizeBytes(compressedPath);

  console.log(
    `[compressTo720p] Original: ${(originalSize / 1024 / 1024).toFixed(1)}MB, Compressed: ${(compressedSize / 1024 / 1024).toFixed(1)}MB`
  );

  if (compressedSize >= originalSize) {
    // Edge case: compression made the file larger — keep the original
    console.warn('[compressTo720p] Compressed file is not smaller than original — keeping original.');
    fs.unlinkSync(compressedPath);
  } else {
    fs.renameSync(compressedPath, filePath);
  }
}

/**
 * Returns the size of a file in bytes.
 */
export function getFileSizeBytes(filePath: string): number {
  return fs.statSync(filePath).size;
}
