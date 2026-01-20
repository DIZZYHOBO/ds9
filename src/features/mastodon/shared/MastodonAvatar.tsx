import { IonAvatar } from "@ionic/react";

import { MastodonAccount } from "#/services/mastodon";

import styles from "./MastodonAvatar.module.css";

interface MastodonAvatarProps {
  account: MastodonAccount;
  size?: "small" | "medium" | "large";
  className?: string;
}

export default function MastodonAvatar({
  account,
  size = "medium",
  className,
}: MastodonAvatarProps) {
  const sizeClass = styles[size];

  return (
    <IonAvatar className={`${styles.avatar} ${sizeClass} ${className ?? ""}`}>
      <img
        src={account.avatar}
        alt={account.display_name || account.username}
        onError={(e) => {
          // Fallback to avatar_static if avatar fails
          const target = e.target as HTMLImageElement;
          if (account.avatar_static && target.src !== account.avatar_static) {
            target.src = account.avatar_static;
          }
        }}
      />
    </IonAvatar>
  );
}
