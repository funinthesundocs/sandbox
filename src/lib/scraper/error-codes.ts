export type ScrapeErrorCode =
  | 'PRIVATE_VIDEO'
  | 'AGE_RESTRICTED'
  | 'UNAVAILABLE'
  | 'DOWNLOAD_TIMEOUT'
  | 'TOO_LONG'
  | 'NO_CAPTIONS'
  | 'STORAGE_UPLOAD_FAILED'
  | 'METADATA_FETCH_FAILED'
  | 'UNKNOWN';

export class ScrapeError extends Error {
  constructor(
    public readonly code: ScrapeErrorCode,
    public readonly userMessage: string,
    cause?: unknown
  ) {
    super(userMessage, { cause });
    this.name = 'ScrapeError';
  }
}

export const USER_FACING_ERRORS: Record<ScrapeErrorCode, string> = {
  PRIVATE_VIDEO: 'This video is private and cannot be scraped.',
  AGE_RESTRICTED: 'This video is age-restricted.',
  UNAVAILABLE: 'This video is unavailable.',
  DOWNLOAD_TIMEOUT: 'Download timed out. Please try again.',
  TOO_LONG: 'This video exceeds the maximum allowed duration of 20 minutes.',
  NO_CAPTIONS: 'This video does not have captions available.',
  STORAGE_UPLOAD_FAILED: 'Failed to upload video to storage.',
  METADATA_FETCH_FAILED: 'Failed to fetch video metadata.',
  UNKNOWN: 'An unexpected error occurred during scraping.',
};

/**
 * Maps a yt-dlp error (or any error) to a typed ScrapeError.
 * Inspects error.message for known yt-dlp error strings.
 */
export function mapYtDlpError(error: unknown): ScrapeError {
  const message =
    error instanceof Error ? error.message : String(error);
  const code = (error as { code?: string })?.code;

  if (/private video/i.test(message)) {
    return new ScrapeError('PRIVATE_VIDEO', USER_FACING_ERRORS.PRIVATE_VIDEO, error);
  }

  if (/age.?restricted/i.test(message)) {
    return new ScrapeError('AGE_RESTRICTED', USER_FACING_ERRORS.AGE_RESTRICTED, error);
  }

  if (/not available|unavailable|removed/i.test(message)) {
    return new ScrapeError('UNAVAILABLE', USER_FACING_ERRORS.UNAVAILABLE, error);
  }

  if (code === 'ETIMEDOUT' || code === 'ESOCKETTIMEDOUT') {
    return new ScrapeError('DOWNLOAD_TIMEOUT', USER_FACING_ERRORS.DOWNLOAD_TIMEOUT, error);
  }

  return new ScrapeError('UNKNOWN', USER_FACING_ERRORS.UNKNOWN, error);
}
