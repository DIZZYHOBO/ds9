import {
  IonButtons,
  IonFab,
  IonFabButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent,
} from "@ionic/react";
import {
  arrowDownOutline,
  arrowUpOutline,
  bookmarkOutline,
  bookmark,
  createOutline,
  shareOutline,
} from "ionicons/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { VListHandle } from "virtua";

import { useRangeChange } from "#/features/feed/useRangeChange";
import AppHeader from "#/features/shared/AppHeader";
import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import { cx } from "#/helpers/css";
import { AppPage } from "#/helpers/AppPage";
import { AppVList } from "#/helpers/virtua";
import { MastodonClient, MastodonStatus } from "#/services/mastodon";
import FeedContent from "#/routes/pages/shared/FeedContent";
import { AppBackButton } from "#/routes/twoColumn/AppBackButton";
import { useAppDispatch, useAppSelector } from "#/store";

import { activeMastodonAccountSelector } from "../../auth/mastodon/mastodonAuthSlice";
import MastodonComposeModal from "../compose/MastodonComposeModal";
import MastodonStatusItem from "../status/MastodonStatusItem";
import {
  mastodonBookmarkedSelector,
  mastodonFavouritedSelector,
  setStatuses,
  toggleBookmarkMastodonStatus,
  toggleFavouriteMastodonStatus,
} from "../status/mastodonStatusSlice";

import styles from "./MastodonStatusDetailPage.module.css";

interface MastodonStatusDetailParams {
  id: string;
}

export default function MastodonStatusDetailPage() {
  const { id } = useParams<MastodonStatusDetailParams>();
  const dispatch = useAppDispatch();
  const activeAccount = useAppSelector(activeMastodonAccountSelector);

  const [status, setStatus] = useState<MastodonStatus | null>(null);
  const [descendants, setDescendants] = useState<MastodonStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<MastodonStatus | undefined>(undefined);

  const virtuaHandle = useRef<VListHandle>(null);

  // Selectors for the main status actions
  const isFavourited = useAppSelector(mastodonFavouritedSelector(id));
  const isBookmarked = useAppSelector(mastodonBookmarkedSelector(id));
  const favourited = isFavourited ?? status?.favourited;
  const bookmarked = isBookmarked ?? status?.bookmarked;

  const handleReply = (targetStatus: MastodonStatus) => {
    setReplyTo(targetStatus);
    setComposeOpen(true);
  };

  const handleComposeClose = () => {
    setComposeOpen(false);
    setReplyTo(undefined);
  };

  const handleReplySuccess = () => {
    loadStatus();
  };

  const handleFavourite = () => {
    dispatch(toggleFavouriteMastodonStatus(id));
  };

  const handleBookmark = () => {
    dispatch(toggleBookmarkMastodonStatus(id));
  };

  const client = useMemo(() => {
    if (!activeAccount) return null;
    return new MastodonClient(activeAccount.instance, activeAccount.accessToken);
  }, [activeAccount]);

  const loadStatus = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setError(null);

    try {
      const [statusResponse, contextResponse] = await Promise.all([
        client.getStatus(id),
        client.getStatusContext(id),
      ]);

      setStatus(statusResponse);
      setDescendants(contextResponse.descendants);

      dispatch(
        setStatuses([
          statusResponse,
          ...contextResponse.ancestors,
          ...contextResponse.descendants,
        ]),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  }, [client, id, dispatch]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleRefresh = async (event: RefresherCustomEvent) => {
    await loadStatus();
    event.detail.complete();
  };

  const onScroll = useRangeChange(virtuaHandle, () => {});

  if (!activeAccount) {
    return (
      <AppPage>
        <AppHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <AppBackButton defaultHref="/posts" />
            </IonButtons>
            <IonTitle>Status</IonTitle>
          </IonToolbar>
        </AppHeader>
        <FeedContent>
          <div className={styles.notLoggedIn}>
            <p>Not logged in to Mastodon</p>
          </div>
        </FeedContent>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <AppHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <AppBackButton defaultHref="/posts" />
          </IonButtons>
          <IonTitle>
            {status ? `${descendants.length} Comments` : "Status"}
          </IonTitle>
        </IonToolbar>
      </AppHeader>

      <FeedContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <CenteredSpinner />
        ) : error ? (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={loadStatus} className={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : (
          <AppVList
            ref={virtuaHandle}
            className="ion-content-scroll-host"
            onScroll={onScroll}
          >
            {/* Main post */}
            {status && (
              <>
                <MastodonStatusItem
                  status={status}
                  disableNavigation
                  onReply={handleReply}
                />

                {/* Action bar under main post */}
                <div className={styles.actionBar}>
                  <button
                    className={cx(styles.actionBtn, favourited && styles.active)}
                    onClick={handleFavourite}
                  >
                    <IonIcon icon={arrowUpOutline} />
                  </button>
                  <button className={styles.actionBtn}>
                    <IonIcon icon={arrowDownOutline} />
                  </button>
                  <button
                    className={cx(styles.actionBtn, bookmarked && styles.active)}
                    onClick={handleBookmark}
                  >
                    <IonIcon icon={bookmarked ? bookmark : bookmarkOutline} />
                  </button>
                  <button className={styles.actionBtn}>
                    <IonIcon icon={shareOutline} />
                  </button>
                </div>
              </>
            )}

            {/* Comments - flat list */}
            {descendants.map((s) => (
              <div key={s.id} className={styles.comment}>
                <MastodonStatusItem
                  status={s}
                  onReply={handleReply}
                />
              </div>
            ))}

            {descendants.length === 0 && status && (
              <div className={styles.noReplies}>
                <p>No comments yet</p>
              </div>
            )}
          </AppVList>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={() => {
            if (status) {
              handleReply(status);
            }
          }}>
            <IonIcon icon={createOutline} />
          </IonFabButton>
        </IonFab>
      </FeedContent>

      <MastodonComposeModal
        isOpen={composeOpen}
        onDismiss={handleComposeClose}
        replyTo={replyTo}
        onSuccess={handleReplySuccess}
      />
    </AppPage>
  );
}
