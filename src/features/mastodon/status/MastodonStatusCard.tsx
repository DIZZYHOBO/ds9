import { IonIcon } from "@ionic/react";
import { linkOutline } from "ionicons/icons";

import { MastodonCard } from "#/services/mastodon";

import styles from "./MastodonStatusCard.module.css";

interface MastodonStatusCardProps {
  card: MastodonCard;
}

export default function MastodonStatusCard({ card }: MastodonStatusCardProps) {
  const hostname = (() => {
    try {
      return new URL(card.url).hostname;
    } catch {
      return card.provider_name || card.url;
    }
  })();

  return (
    <a
      href={card.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.container}
      onClick={(e) => e.stopPropagation()}
    >
      {card.image && (
        <div className={styles.imageContainer}>
          <img
            src={card.image}
            alt=""
            className={styles.image}
            loading="lazy"
          />
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.provider}>
          <IonIcon icon={linkOutline} className={styles.linkIcon} />
          {hostname}
        </div>
        {card.title && <div className={styles.title}>{card.title}</div>}
        {card.description && (
          <div className={styles.description}>{card.description}</div>
        )}
      </div>
    </a>
  );
}
