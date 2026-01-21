import { IonAvatar } from "@ionic/react";
import { Link } from "react-router-dom";

import { useBuildGeneralBrowseLink } from "#/helpers/routes";
import { MastodonAccount } from "#/services/mastodon";

import styles from "./MastodonAvatar.module.css";

interface MastodonAvatarProps {
  account: MastodonAccount;
  size?: "small" | "medium" | "large";
  className?: string;
  linkToProfile?: boolean;
}

export default function MastodonAvatar({
  account,
  size = "medium",
  className,
  linkToProfile = false,
}: MastodonAvatarProps) {
  const buildGeneralBrowseLink = useBuildGeneralBrowseLink();
  const sizeClass = styles[size];

  const avatar = (
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

  if (linkToProfile) {
    return (
      <Link
        to={buildGeneralBrowseLink(`/mastodon/user/${account.id}`)}
        className={styles.link}
        onClick={(e) => e.stopPropagation()}
      >
        {avatar}
      </Link>
    );
  }

  return avatar;
}
