/**
 * YouTube URL detection and parsing helpers
 */

// Matches various YouTube URL formats:
// - https://www.youtube.com/watch?v=VIDEO_ID
// - https://youtube.com/watch?v=VIDEO_ID
// - https://youtu.be/VIDEO_ID
// - https://www.youtube.com/embed/VIDEO_ID
// - https://youtube.com/shorts/VIDEO_ID
// - https://www.youtube.com/v/VIDEO_ID
// - https://youtube-nocookie.com/embed/VIDEO_ID
// - URLs with additional parameters (playlists, timestamps, etc.)
const YOUTUBE_URL_REGEX =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([\w-]{11})(?:[?&].*)?/i;

/**
 * Check if a URL is a YouTube video URL
 */
export function isYouTubeUrl(url: string): boolean {
  return YOUTUBE_URL_REGEX.test(url);
}

/**
 * Extract the video ID from a YouTube URL
 * Returns undefined if not a valid YouTube URL
 */
export function getYouTubeVideoId(url: string): string | undefined {
  const match = url.match(YOUTUBE_URL_REGEX);
  return match?.[1];
}

/**
 * Get the privacy-focused embed URL for a YouTube video
 * Uses youtube-nocookie.com to avoid tracking cookies
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/**
 * Get thumbnail URL for a YouTube video
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: "default" | "mq" | "hq" | "sd" | "maxres" = "hq",
): string {
  const qualityMap = {
    default: "default",
    mq: "mqdefault",
    hq: "hqdefault",
    sd: "sddefault",
    maxres: "maxresdefault",
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Extract timestamp from YouTube URL (for start time)
 * Returns seconds or undefined
 */
export function getYouTubeTimestamp(url: string): number | undefined {
  // Match t=123 or t=1m30s or start=123 formats
  const timeMatch = url.match(/[?&](?:t|start)=(\d+)/);
  if (timeMatch) {
    return parseInt(timeMatch[1], 10);
  }

  // Match t=1m30s format
  const durationMatch = url.match(/[?&]t=(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  if (durationMatch) {
    const hours = parseInt(durationMatch[1] || "0", 10);
    const minutes = parseInt(durationMatch[2] || "0", 10);
    const seconds = parseInt(durationMatch[3] || "0", 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  return undefined;
}

/**
 * Build full embed URL with optional parameters
 */
export function buildYouTubeEmbedUrl(url: string): string | undefined {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return undefined;

  const embedUrl = new URL(getYouTubeEmbedUrl(videoId));

  // Add timestamp if present
  const timestamp = getYouTubeTimestamp(url);
  if (timestamp) {
    embedUrl.searchParams.set("start", timestamp.toString());
  }

  // Enable JS API for potential future controls
  embedUrl.searchParams.set("enablejsapi", "1");

  // Use relative protocol
  embedUrl.searchParams.set("rel", "0");

  return embedUrl.toString();
}
