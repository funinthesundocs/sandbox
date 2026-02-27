import fs from 'fs';

export interface TranscriptSegment {
  timestamp: string; // Human-readable: "0:42" or "1:23:45"
  startMs: number;   // Milliseconds from video start — for seek-on-click
  text: string;      // Clean plain text, no HTML tags
}

/**
 * Converts a VTT timestamp string ("00:00:42.500" or "00:42.500") to milliseconds.
 */
function vttTimeToMs(vttTime: string): number {
  const parts = vttTime.trim().split(':');
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const s = parseFloat(parts[2]);
    return h * 3_600_000 + m * 60_000 + Math.round(s * 1000);
  } else if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseFloat(parts[1]);
    return m * 60_000 + Math.round(s * 1000);
  }
  return 0;
}

/**
 * Formats a millisecond value as "M:SS" (< 1 hour) or "H:MM:SS" (>= 1 hour).
 */
function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Parses a WebVTT file into an array of TranscriptSegment objects.
 * Deduplicates adjacent identical lines (common in auto-generated captions).
 */
export function parseVTT(filePath: string): TranscriptSegment[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const segments: TranscriptSegment[] = [];
  let currentStartMs: number | null = null;
  let currentTextLines: string[] = [];

  const flushSegment = () => {
    if (currentStartMs === null || currentTextLines.length === 0) return;
    const text = currentTextLines.join(' ').trim();
    if (!text) return;

    const lastSegment = segments[segments.length - 1];
    // Deduplicate: skip if same text as previous segment
    if (lastSegment && lastSegment.text === text) return;

    segments.push({
      timestamp: formatTimestamp(currentStartMs),
      startMs: currentStartMs,
      text,
    });
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Skip header, metadata, and empty lines
    if (
      line.startsWith('WEBVTT') ||
      line.startsWith('NOTE') ||
      line.startsWith('STYLE') ||
      line === ''
    ) {
      continue;
    }

    // Skip numeric cue identifiers (lines that are purely a number)
    if (/^\d+$/.test(line)) {
      continue;
    }

    // Timestamp line detection
    if (line.includes(' --> ')) {
      // Save previous segment before starting a new one
      flushSegment();
      currentStartMs = null;
      currentTextLines = [];

      // Parse the start timestamp — strip cue settings (anything after the timestamp)
      const startRaw = line.split(' --> ')[0].trim();
      currentStartMs = vttTimeToMs(startRaw);
      continue;
    }

    // Text line — strip HTML tags and collect
    if (currentStartMs !== null) {
      const cleanText = line.replace(/<[^>]*>/g, '').trim();
      if (cleanText) {
        currentTextLines.push(cleanText);
      }
    }
  }

  // Flush final segment
  flushSegment();

  return segments;
}

/**
 * Concatenates all segment texts into a single plain-text string.
 * Used for storing the plain text transcript in the database.
 */
export function transcriptToPlainText(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text).join(' ');
}
