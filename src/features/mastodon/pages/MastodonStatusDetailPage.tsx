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
import { createOutline } from "ionicons/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { VListHandle } from "virtua";

import { useRangeChange } from "#/features/feed/useRangeChange";
import AppHeader from "#/features/shared/AppHeader";
import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import { AppPage } from "#/helpers/AppPage";
import { AppVList } from "#/helpers/virtua";
import { MastodonClient, MastodonStatus } from "#/services/mastodon";
import FeedContent from "#/routes/pages/shared/FeedContent";
import { AppBackButton } from "#/routes/twoColumn/AppBackButton";
import { useAppDispatch, useAppSelector } from "#/store";

import { activeMastodonAccountSelector } from "../../auth/mastodon/mastodonAuthSlice";
import MastodonComposeModal from "../compose/MastodonComposeModal";
import MastodonStatusItem from "../status/MastodonStatusItem";
import { setStatuses } from "../status/mastodonStatusSlice";

import styles from "./MastodonStatusDetailPage.module.css";

interface MastodonStatusDetailParams {
  id: string;
}

export default function MastodonStatusDetailPage() {
  const { id } = useParams<MastodonStatusDetailParams>();
  const dispatch = useAppDispatch();
  const activeAccount = useAppSelector(activeMastodonAccountSelector);

  const [status, setStatus] = useState<MastodonStatus | null>(null);
  const [ancestors, setAncestors] = useState<MastodonStatus[]>([]);
  const [descendants, setDescendants] = useState<MastodonStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<MastodonStatus | undefined>(undefined);

  const virtuaHandle = useRef<VListHandle>(null);

  const handleReply = (targetStatus: MastodonStatus) => {
    setReplyTo(targetStatus);
    setComposeOpen(true);
  };

  const handleComposeClose = () => {
    setComposeOpen(false);
    setReplyTo(undefined);
  };

  const handleReplySuccess = () => {
    // Refresh the thread to show the new reply
    loadStatus();
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
      // Fetch the status and its context (replies) in parallel
      const [statusResponse, contextResponse] = await Promise.all([
        client.getStatus(id),
        client.getStatusContext(id),
      ]);

      setStatus(statusResponse);
      setAncestors(contextResponse.ancestors);
      setDescendants(contextResponse.descendants);

      // Cache all statuses
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

  const onScroll = useRangeChange(virtuaHandle, () => {
    // No pagination for context
  });

  // Combine all statuses in order: ancestors -> main status -> descendants
  const allStatuses = useMemo(() => {
    if (!status) return [];
    return [...ancestors, status, ...descendants];
  }, [ancestors, status, descendants]);

  const mainStatusIndex = ancestors.length;

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
            {status ? `${descendants.length} Replies` : "Status"}
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
            {allStatuses.map((s, index) => (
              <div
                key={s.id}
                className={
                  index === mainStatusIndex
                    ? styles.mainStatus
                    : index < mainStatusIndex
                      ? styles.ancestor
                      : styles.descendant
                }
              >
                <MastodonStatusItem
                  status={s}
                  className={index === mainStatusIndex ? styles.highlighted : undefined}
                  onReply={handleReply}
                />
              </div>
            ))}
            {allStatuses.length === 1 && (
              <div className={styles.noReplies}>
                <p>No replies yet</p>
              </div>
            )}
          </AppVList>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={() => {
            // Reply to the main status by default
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
