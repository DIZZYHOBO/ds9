import { ComponentProps } from "react";

import { cx } from "#/helpers/css";
import LargeFeedMedia from "#/features/post/inFeed/large/media/LargeFeedMedia";

import YouTubeEmbed from "./YouTubeEmbed";

import styles from "./LargeFeedYouTubeMedia.module.css";

interface LargeFeedYouTubeMediaProps
  extends Omit<ComponentProps<typeof LargeFeedMedia>, "src"> {
  url: string;
}

/**
 * YouTube embed component optimized for the large post feed view
 */
export default function LargeFeedYouTubeMedia({
  url,
  blur,
  className,
}: LargeFeedYouTubeMediaProps) {
  return (
    <YouTubeEmbed
      url={url}
      blur={blur}
      className={cx(styles.container, className)}
    />
  );
}
