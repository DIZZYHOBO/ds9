import {
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
} from "@ionic/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VListHandle } from "virtua";

import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import { AppVList } from "#/helpers/virtua";
import { MastodonClient, MastodonStatus, PaginatedResponse } from "#/services/mastodon";
import { useAppDispatch, useAppSelector } from "#/store";

import { activeMastodonAccountSelector } from "../../auth/mastodon/mastodonAuthSlice";
import MastodonStatusItem from "../status/MastodonStatusItem";
import { setStatuses } from "../status/mastodonStatusSlice";

import styles from "./MastodonFeed.module.css";

export type MastodonFeedType = "home" | "public" | "local" | "tag" | "account";

interface MastodonFeedProps {
  feedType: MastodonFeedType;
  hashtag?: string;
  accountId?: string;
  onStatusClick?: (status: MastodonStatus) => void;
}

export default function MastodonFeed({
  feedType,
  hashtag,
  accountId,
  onStatusClick,
}: MastodonFeedProps) {
  const dispatch = useAppDispatch();
  const activeAccount = useAppSelector(activeMastodonAccountSelector);
  const [statuses, setLocalStatuses] = useState<MastodonStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nextMaxIdRef = useRef<string | undefined>(undefined);
  const virtuaHandle = useRef<VListHandle>(null);

  const client = useMemo(() => {
    if (!activeAccount) return null;
    return new MastodonClient(activeAccount.instance, activeAccount.accessToken);
  }, [activeAccount]);

  const fetchTimeline = useCallback(
    async (maxId?: string): Promise<PaginatedResponse<MastodonStatus> | null> => {
      if (!client) return null;

      const limit = 20;

      switch (feedType) {
        case "home":
          return client.getHomeTimeline({ max_id: maxId, limit });
        case "public":
          return client.getPublicTimeline({ max_id: maxId, limit });
        case "local":
          return client.getPublicTimeline({ local: true, max_id: maxId, limit });
        case "tag":
          if (!hashtag) return null;
          return client.getTagTimeline(hashtag, { max_id: maxId, limit });
        case "account":
          if (!accountId) return null;
          return client.getAccountStatuses(accountId, { max_id: maxId, limit });
        default:
          return null;
      }
    },
    [client, feedType, hashtag, accountId],
  );

  const loadStatuses = useCallback(
    async (refresh = false) => {
      if (!client) {
        setError("Not logged in to Mastodon");
        setLoading(false);
        return;
      }

      try {
        setError(null);
        if (refresh) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await fetchTimeline(refresh ? undefined : nextMaxIdRef.current);

        if (!response) {
          setError("Failed to load timeline");
          return;
        }

        // Cache statuses in Redux
        dispatch(setStatuses(response.data));

        if (refresh) {
          setLocalStatuses(response.data);
        } else {
          setLocalStatuses((prev) => [...prev, ...response.data]);
        }

        nextMaxIdRef.current = response.next;
        setHasMore(!!response.next && response.data.length > 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load timeline");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [client, dispatch, fetchTimeline],
  );

  // Initial load
  useEffect(() => {
    loadStatuses(true);
  }, [loadStatuses]);

  // Handle scroll to load more
  const handleScroll = useCallback(() => {
    if (!virtuaHandle.current || loadingMore || !hasMore) return;

    const handle = virtuaHandle.current;
    const scrollSize = handle.scrollSize;
    const viewportSize = handle.viewportSize;
    const scrollOffset = handle.scrollOffset;

    // Load more when near the bottom (within 500px)
    if (scrollSize - scrollOffset - viewportSize < 500) {
      loadStatuses(false);
    }
  }, [hasMore, loadStatuses, loadingMore]);

  const handleRefresh = async (event: RefresherCustomEvent) => {
    try {
      await loadStatuses(true);
    } finally {
      event.detail.complete();
    }
  };

  if (loading) {
    return <CenteredSpinner />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={() => loadStatuses(true)} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (statuses.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No posts to show</p>
      </div>
    );
  }

  return (
    <>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      <AppVList
        ref={virtuaHandle}
        className="ion-content-scroll-host virtual-scroller"
        style={{ height: "100%" }}
        onScroll={handleScroll}
      >
        {statuses.map((status) => (
          <MastodonStatusItem
            key={status.id}
            status={status}
            onClick={onStatusClick}
          />
        ))}
        {loadingMore && (
          <div className={styles.loadingMore}>
            <CenteredSpinner />
          </div>
        )}
        {!hasMore && statuses.length > 0 && (
          <div className={styles.endOfFeed}>
            You've reached the end
          </div>
        )}
      </AppVList>
    </>
  );
}
