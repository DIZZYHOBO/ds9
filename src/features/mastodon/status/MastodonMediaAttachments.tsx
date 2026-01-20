import { IonIcon } from "@ionic/react";
import { eyeOffOutline, playOutline, volumeHighOutline } from "ionicons/icons";
import { useState } from "react";

import { MastodonMediaAttachment } from "#/services/mastodon";

import styles from "./MastodonMediaAttachments.module.css";

interface MastodonMediaAttachmentsProps {
  attachments: MastodonMediaAttachment[];
  sensitive?: boolean;
}

export default function MastodonMediaAttachments({
  attachments,
  sensitive,
}: MastodonMediaAttachmentsProps) {
  const [revealed, setRevealed] = useState(!sensitive);

  const gridClass =
    attachments.length === 1
      ? styles.single
      : attachments.length === 2
        ? styles.double
        : attachments.length === 3
          ? styles.triple
          : styles.quad;

  const handleReveal = () => {
    setRevealed(true);
  };

  if (!revealed) {
    return (
      <div className={styles.sensitiveOverlay} onClick={handleReveal}>
        <div className={styles.sensitiveContent}>
          <IonIcon icon={eyeOffOutline} className={styles.sensitiveIcon} />
          <span>Sensitive content</span>
          <span className={styles.sensitiveHint}>Tap to reveal</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${gridClass}`}>
      {attachments.slice(0, 4).map((attachment) => (
        <MediaItem key={attachment.id} attachment={attachment} />
      ))}
    </div>
  );
}

function MediaItem({ attachment }: { attachment: MastodonMediaAttachment }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={styles.mediaError}>
        <span>Failed to load media</span>
      </div>
    );
  }

  switch (attachment.type) {
    case "image":
      return (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.mediaLink}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={attachment.preview_url || attachment.url}
            alt={attachment.description || ""}
            className={styles.media}
            onError={() => setError(true)}
            loading="lazy"
          />
        </a>
      );

    case "video":
    case "gifv":
      return (
        <div className={styles.videoContainer}>
          <video
            src={attachment.url}
            poster={attachment.preview_url}
            controls={attachment.type === "video"}
            autoPlay={attachment.type === "gifv"}
            loop={attachment.type === "gifv"}
            muted={attachment.type === "gifv"}
            playsInline
            className={styles.media}
            onError={() => setError(true)}
          />
          {attachment.type === "video" && (
            <div className={styles.videoOverlay}>
              <IonIcon icon={playOutline} />
            </div>
          )}
        </div>
      );

    case "audio":
      return (
        <div className={styles.audioContainer}>
          <IonIcon icon={volumeHighOutline} className={styles.audioIcon} />
          <audio src={attachment.url} controls className={styles.audio} />
        </div>
      );

    default:
      return (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.unknownMedia}
          onClick={(e) => e.stopPropagation()}
        >
          View attachment
        </a>
      );
  }
}
