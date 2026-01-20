import { MastodonAccount } from "#/services/mastodon";

import styles from "./MastodonDisplayName.module.css";

interface MastodonDisplayNameProps {
  account: MastodonAccount;
  className?: string;
}

export default function MastodonDisplayName({
  account,
  className,
}: MastodonDisplayNameProps) {
  const displayName = account.display_name || account.username;

  // Check if display name contains custom emojis
  const hasEmojis = account.emojis.length > 0;

  if (hasEmojis) {
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
  }

  return (
    <span className={`${styles.displayName} ${className ?? ""}`}>
      {displayName}
    </span>
  );
}
