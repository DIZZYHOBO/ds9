import { Link } from "react-router-dom";

import { useBuildMastodonLink } from "#/helpers/routes";
import { MastodonAccount } from "#/services/mastodon";

import styles from "./MastodonDisplayName.module.css";

interface MastodonDisplayNameProps {
  account: MastodonAccount;
  className?: string;
  linkToProfile?: boolean;
}

export default function MastodonDisplayName({
  account,
  className,
  linkToProfile = false,
}: MastodonDisplayNameProps) {
  const buildMastodonLink = useBuildMastodonLink();
  const displayName = account.display_name || account.username;

  // Check if display name contains custom emojis
  const hasEmojis = account.emojis.length > 0;

  const nameContent = hasEmojis ? (() => {
    let processedName = displayName;
    for (const emoji of account.emojis) {
      const emojiRegex = new RegExp(`:${emoji.shortcode}:`, "g");
      processedName = processedName.replace(
        emojiRegex,
        `<img src="${emoji.url}" alt=":${emoji.shortcode}:" class="${styles.emoji}" />`,
      );
    }

    return (
      <span
        className={`${styles.displayName} ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: processedName }}
      />
    );
  })() : (
    <span className={`${styles.displayName} ${className ?? ""}`}>
      {displayName}
    </span>
  );

  if (linkToProfile) {
    return (
      <Link
        to={buildMastodonLink(`/mastodon/user/${account.id}`)}
        className={styles.link}
        onClick={(e) => e.stopPropagation()}
      >
        {nameContent}
      </Link>
    );
  }

  return nameContent;
}
