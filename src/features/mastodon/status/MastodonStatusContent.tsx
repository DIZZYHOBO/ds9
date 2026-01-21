import { IonIcon, IonText } from "@ionic/react";
import {
  bookmarkOutline,
  bookmark,
  chatbubbleOutline,
  heartOutline,
  heart,
  repeatOutline,
  timeOutline,
} from "ionicons/icons";
import { Link } from "react-router-dom";

import { cx } from "#/helpers/css";
import { formatRelative } from "#/helpers/date";
import { useBuildMastodonLink } from "#/helpers/routes";
import { MastodonAccount, MastodonStatus } from "#/services/mastodon";
import { useAppDispatch, useAppSelector } from "#/store";

import {
  mastodonBookmarkedSelector,
  mastodonFavouritedSelector,
  mastodonRebloggedSelector,
  toggleBookmarkMastodonStatus,
  toggleFavouriteMastodonStatus,
  toggleReblogMastodonStatus,
} from "./mastodonStatusSlice";
import MastodonAvatar from "../shared/MastodonAvatar";
import MastodonDisplayName from "../shared/MastodonDisplayName";
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
}

export default function MastodonStatusContent({
  status,
  isReblog,
  reblogger,
  showActions = true,
  onReply,
}: MastodonStatusContentProps) {
  const dispatch = useAppDispatch();
  const buildMastodonLink = useBuildMastodonLink();

  const isFavourited = useAppSelector(mastodonFavouritedSelector(status.id));
  const isReblogged = useAppSelector(mastodonRebloggedSelector(status.id));
  const isBookmarked = useAppSelector(mastodonBookmarkedSelector(status.id));

  // Use local state if available, otherwise use status state
  const favourited = isFavourited ?? status.favourited;
  const reblogged = isReblogged ?? status.reblogged;
  const bookmarked = isBookmarked ?? status.bookmarked;

  const handleFavourite = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleFavouriteMastodonStatus(status.id));
  };

  const handleReblog = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleReblogMastodonStatus(status.id));
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleBookmarkMastodonStatus(status.id));
  };

  return (
    <div className={styles.container}>
      {isReblog && reblogger && (
        <div className={styles.reblogIndicator}>
          <IonIcon icon={repeatOutline} />
          <span>
            <MastodonDisplayName account={reblogger} linkToProfile /> boosted
          </span>
        </div>
      )}

      <div className={styles.mainContent}>
        <MastodonAvatar
          account={status.account}
          className={styles.avatar}
          linkToProfile
        />

        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.authorInfo}>
              <MastodonDisplayName
                account={status.account}
                className={styles.displayName}
                linkToProfile
              />
              <Link
                to={buildMastodonLink(`/mastodon/user/${status.account.id}`)}
                className={styles.handle}
                onClick={(e) => e.stopPropagation()}
              >
                @{status.account.acct}
              </Link>
            </div>
            <span className={styles.timestamp}>
              <IonIcon icon={timeOutline} className={styles.timeIcon} />
              {formatRelative(status.created_at)}
            </span>
          </div>

          {status.spoiler_text && (
            <div className={styles.spoilerWarning}>
              <IonText color="warning">
                <strong>CW:</strong> {status.spoiler_text}
              </IonText>
            </div>
          )}

          <div
            className={styles.statusText}
            dangerouslySetInnerHTML={{ __html: status.content }}
          />

          {status.media_attachments.length > 0 && (
            <MastodonMediaAttachments
              attachments={status.media_attachments}
              sensitive={status.sensitive}
            />
          )}

          {status.poll && <MastodonPollDisplay poll={status.poll} />}

          {status.card && !status.media_attachments.length && (
            <MastodonStatusCard card={status.card} />
          )}

          {showActions && (
            <div className={styles.actions}>
              <button
                className={styles.actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onReply?.(status);
                }}
              >
                <IonIcon icon={chatbubbleOutline} />
                <span>{status.replies_count || ""}</span>
              </button>

              <button
                className={cx(styles.actionButton, reblogged && styles.active)}
                onClick={handleReblog}
              >
                <IonIcon icon={repeatOutline} />
                <span>{status.reblogs_count || ""}</span>
              </button>

              <button
                className={cx(
                  styles.actionButton,
                  styles.favouriteButton,
                  favourited && styles.active,
                )}
                onClick={handleFavourite}
              >
                <IonIcon icon={favourited ? heart : heartOutline} />
                <span>{status.favourites_count || ""}</span>
              </button>

              <button
                className={cx(styles.actionButton, bookmarked && styles.active)}
                onClick={handleBookmark}
              >
                <IonIcon icon={bookmarked ? bookmark : bookmarkOutline} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
