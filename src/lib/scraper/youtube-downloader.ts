import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { getTempDir, ensureTempDir } from './temp-files';
import { getVideoDuration, compressTo720p, getFileSizeBytes } from './video-utils';
import { ScrapeError, mapYtDlpError } from './error-codes';

const execAsync = promisify(exec);

const MAX_DURATION_SECONDS = 20 * 60; // 20 minutes
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024; // 200MB
const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface DownloadResult {
  filePath: string;   // Absolute path to the .mp4 file in /tmp
  duration: number;   // Duration in seconds
  sizeBytes: number;  // Final file size after optional compression
}

/**
 * Downloads a YouTube video using yt-dlp into a temp directory.
 * Enforces max duration (20 min) and compresses if file exceeds 200MB.
 *
 * NOTE: Does NOT call cleanTempDir — that is the worker handler's responsibility (in finally block).
 */
export async function downloadYouTubeVideo(
  youtubeUrl: string,
  videoId: string
): Promise<DownloadResult> {
  try {
    ensureTempDir(videoId);

    const outputTemplate = path.join(getTempDir(videoId), '%(id)s.%(ext)s');
    const cmd = [
      'yt-dlp',
      '-f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best"',
      '--merge-output-format mp4',
      `--output "${outputTemplate}"`,
      '--socket-timeout 30',
      '--no-playlist',
      `"${youtubeUrl}"`,
    ].join(' ');

    await execAsync(cmd, {
      timeout: DOWNLOAD_TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024,
    });

    // Find the downloaded .mp4 file
    const dir = getTempDir(videoId);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mp4'));
    if (files.length === 0) {
      throw new ScrapeError('UNAVAILABLE', 'Could not download video file.');
    }

    const filePath = path.join(dir, files[0]);

    // Enforce duration limit
    const duration = await getVideoDuration(filePath);
    if (duration > MAX_DURATION_SECONDS) {
      throw new ScrapeError(
        'TOO_LONG',
        `This video is ${Math.round(duration / 60)} minutes long. Maximum is 20 minutes.`
      );
    }

    // Compress if over size limit
    const sizeBytes = getFileSizeBytes(filePath);
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      await compressTo720p(filePath);
    }

    return {
      filePath,
      duration,
      sizeBytes: getFileSizeBytes(filePath),
    };
  } catch (err) {
    if (err instanceof ScrapeError) {
      throw err;
    }
    throw mapYtDlpError(err);
  }
}
