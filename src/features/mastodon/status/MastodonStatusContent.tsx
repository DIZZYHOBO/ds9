import { IonIcon, IonText } from "@ionic/react";
import {
  arrowDownOutline,
  arrowUpOutline,
  chatbubbleOutline,
  ellipsisHorizontal,
  repeatOutline,
} from "ionicons/icons";
import { Link } from "react-router-dom";

import Ago from "#/features/labels/Ago";
import { cx } from "#/helpers/css";
import { useBuildMastodonLink } from "#/helpers/routes";
import { MastodonAccount, MastodonStatus } from "#/services/mastodon";
import { useAppDispatch, useAppSelector } from "#/store";

import {
  mastodonFavouritedSelector,
  toggleFavouriteMastodonStatus,
} from "./mastodonStatusSlice";
import MastodonMediaAttachments from "./MastodonMediaAttachments";
import MastodonPollDisplay from "./MastodonPollDisplay";
import MastodonStatusCard from "./MastodonStatusCard";

import styles from "./MastodonStatusContent.module.css";

interface MastodonStatusContentProps {
  status: MastodonStatus;
  isReblog?: boolean;
  reblogger?: MastodonAccount;
  showActions?: boolean;
  onReply?: (status: MastodonStatus) => void;
  onMoreActions?: () => void;
}

export default function MastodonStatusContent({
  status,
  isReblog,
  reblogger,
  showActions = true,
  onMoreActions,
}: MastodonStatusContentProps) {
  const dispatch = useAppDispatch();
  const buildMastodonLink = useBuildMastodonLink();

  const isFavourited = useAppSelector(mastodonFavouritedSelector(status.id));
  const favourited = isFavourited ?? status.favourited;

  const handleFavourite = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleFavouriteMastodonStatus(status.id));
  };

  return (
    <div className={styles.container}>
      {isReblog && reblogger && (
        <div className={styles.reblogIndicator}>
          <IonIcon icon={repeatOutline} />
          <Link
            to={buildMastodonLink(`/mastodon/user/${reblogger.id}`)}
            onClick={(e) => e.stopPropagation()}
          >
            {reblogger.display_name || reblogger.username}
          </Link>
          <span>boosted</span>
        </div>
      )}

      {/* Header - Author info at top */}
      <div className={styles.header}>
        <div className={styles.authorInfo}>
          <Link
            to={buildMastodonLink(`/mastodon/user/${status.account.id}`)}
            className={styles.authorLink}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={status.account.avatar}
              alt=""
              className={styles.authorAvatar}
            />
            <span className={styles.authorName}>
              {status.account.display_name || status.account.username}
            </span>
            <span className={styles.authorHandle}>@{status.account.acct}</span>
          </Link>
        </div>
      </div>

      {/* Spoiler warning */}
      {status.spoiler_text && (
        <div className={styles.spoilerWarning}>
          <IonText color="warning">
            <strong>CW:</strong> {status.spoiler_text}
          </IonText>
        </div>
      )}

      {/* Content */}
      <div
        className={styles.statusText}
        dangerouslySetInnerHTML={{ __html: status.content }}
      />

      {/* Media */}
      {status.media_attachments.length > 0 && (
        <MastodonMediaAttachments
          attachments={status.media_attachments}
          sensitive={status.sensitive}
        />
      )}

      {/* Poll */}
      {status.poll && <MastodonPollDisplay poll={status.poll} />}

      {/* Link card */}
      {status.card && !status.media_attachments.length && (
        <MastodonStatusCard card={status.card} />
      )}

      {/* Details row - stats on left, actions on right */}
      <div className={styles.details}>
        <div className={styles.leftDetails}>
          <div className={styles.stats}>
            <span className={styles.stat}>
              <IonIcon icon={arrowUpOutline} />
              {status.favourites_count}
            </span>
            <span className={styles.stat}>
              <IonIcon icon={chatbubbleOutline} />
              {status.replies_count}
            </span>
            <span className={styles.stat}>
              <Ago date={status.created_at} />
            </span>
          </div>
        </div>

        {showActions && (
          <div className={styles.rightDetails}>
            <button
              className={styles.actionBtn}
              onClick={(e) => {
                e.stopPropagation();
                onMoreActions?.();
              }}
            >
              <IonIcon icon={ellipsisHorizontal} />
            </button>
            <button
              className={cx(styles.actionBtn, favourited && styles.active)}
              onClick={handleFavourite}
            >
              <IonIcon icon={arrowUpOutline} />
            </button>
            <button
              className={styles.actionBtn}
              onClick={(e) => e.stopPropagation()}
            >
              <IonIcon icon={arrowDownOutline} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
