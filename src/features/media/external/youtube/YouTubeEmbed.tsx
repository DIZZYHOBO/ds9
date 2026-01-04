import { IonSpinner } from "@ionic/react";
import { MouseEvent, useState } from "react";

import { cx } from "#/helpers/css";
import { stopIonicTapClick } from "#/helpers/ionic";

import {
  buildYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  getYouTubeVideoId,
} from "./helpers";

import styles from "./YouTubeEmbed.module.css";

interface YouTubeEmbedProps {
  url: string;
  blur?: boolean;
  className?: string;
  /**
   * If true, shows thumbnail with play button that loads iframe on click
   * If false, loads iframe immediately
   * @default true
   */
  useThumbnail?: boolean;
}

/**
 * YouTube video embed component
 * Uses privacy-enhanced mode (youtube-nocookie.com) and lazy loading
 */
export default function YouTubeEmbed({
  url,
  blur,
  className,
  useThumbnail = true,
}: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(!useThumbnail);
  const [isLoading, setIsLoading] = useState(false);

  const videoId = getYouTubeVideoId(url);
  const embedUrl = buildYouTubeEmbedUrl(url);

  if (!videoId || !embedUrl) return null;

  const thumbnailUrl = getYouTubeThumbnailUrl(videoId, "hq");

  function handlePlayClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    stopIonicTapClick();

    if (blur) return; // Don't play if blurred (NSFW)

    setIsLoading(true);
    setIsPlaying(true);
  }

  function handleIframeLoad() {
    setIsLoading(false);
  }

  if (!isPlaying) {
    return (
      <div
        className={cx(styles.container, className)}
        onClick={handlePlayClick}
        onTouchStart={() => stopIonicTapClick()}
        role="button"
        tabIndex={0}
        aria-label="Play YouTube video"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handlePlayClick(e as unknown as MouseEvent);
          }
        }}
      >
        <div className={styles.thumbnailContainer}>
          <img
            src={thumbnailUrl}
            alt="YouTube video thumbnail"
            className={cx(styles.thumbnail, blur && styles.blur)}
            loading="lazy"
          />
          {!blur && (
            <>
              <div className={styles.playButton}>
                <div className={styles.playIcon} />
              </div>
              <div className={styles.youtubeIcon}>
                <YouTubeLogo />
                YouTube
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cx(styles.container, className)}>
      <div className={styles.aspectRatioBox}>
        {isLoading && (
          <div className={styles.loadingContainer}>
            <IonSpinner color="light" />
          </div>
        )}
        <iframe
          src={`${embedUrl}&autoplay=1`}
          className={styles.iframe}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={handleIframeLoad}
          style={isLoading ? { opacity: 0 } : undefined}
        />
      </div>
    </div>
  );
}

/**
 * YouTube logo SVG component
 */
function YouTubeLogo() {
  return (
    <svg viewBox="0 0 90 20" preserveAspectRatio="xMidYMid meet">
      <g fill="#FF0000">
        <path d="M27.973 0H30.6l-4.608 8.547v5.586h-2.457v-5.586L18.927 0h2.666l2.769 5.79L27.973 0z" />
        <path
          d="M17.722 4.883c-.993-.661-2.098-.992-3.313-.992-1.254 0-2.369.338-3.345 1.013-.975.676-1.537 1.686-1.686 3.03v2.193c.112 1.353.627 2.366 1.545 3.04.919.675 2.044 1.012 3.378 1.012 1.242 0 2.35-.324 3.325-.972.975-.649 1.507-1.643 1.594-2.984V7.907c-.087-1.216-.567-2.156-1.498-2.818v-.206zM16.79 10.27c-.082.6-.322 1.059-.718 1.375-.397.317-.893.475-1.49.475-.616 0-1.122-.158-1.518-.475-.397-.316-.626-.775-.689-1.375V7.704c.063-.6.292-1.069.689-1.408.396-.338.902-.508 1.518-.508.597 0 1.093.17 1.49.508.396.339.636.809.718 1.408v2.566z"
          fill="#FFF"
        />
      </g>
      <path
        fill="#FF0000"
        d="M7.893.093C3.535.093 0 3.628 0 7.986v4.028c0 4.358 3.535 7.893 7.893 7.893h4.028c4.358 0 7.893-3.535 7.893-7.893V7.986c0-4.358-3.535-7.893-7.893-7.893H7.893z"
      />
      <path fill="#FFF" d="M6.507 5.333v9.334L14.174 10z" />
    </svg>
  );
}
