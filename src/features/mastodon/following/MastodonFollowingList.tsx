import {
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
} from "@ionic/react";
import { personOutline } from "ionicons/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VListHandle } from "virtua";

import { useRangeChange } from "#/features/feed/useRangeChange";
import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import { AppVList } from "#/helpers/virtua";
import {
  MastodonAccount,
  MastodonClient,
  PaginatedResponse,
} from "#/services/mastodon";
import { useAppSelector } from "#/store";

import { activeMastodonAccountSelector } from "../../auth/mastodon/mastodonAuthSlice";

import styles from "./MastodonFollowingList.module.css";

interface MastodonFollowingListProps {
  onListAtTopChange?: (atTop: boolean) => void;
}

export default function MastodonFollowingList({
  onListAtTopChange,
}: MastodonFollowingListProps) {
  const activeAccount = useAppSelector(activeMastodonAccountSelector);
  const [following, setFollowing] = useState<MastodonAccount[]>([]);
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

  const fetchFollowing = useCallback(
    async (maxId?: string): Promise<PaginatedResponse<MastodonAccount> | null> => {
      if (!client || !activeAccount) return null;
      return client.getAccountFollowing(activeAccount.account.id, {
        max_id: maxId,
        limit: 40,
      });
    },
    [client, activeAccount],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    nextMaxIdRef.current = undefined;

    try {
      const response = await fetchFollowing();
      if (response) {
        setFollowing(response.data);
        nextMaxIdRef.current = response.next;
        setHasMore(!!response.next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load following");
    } finally {
      setLoading(false);
    }
  }, [fetchFollowing]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextMaxIdRef.current) return;

    setLoadingMore(true);

    try {
      const response = await fetchFollowing(nextMaxIdRef.current);
      if (response) {
        setFollowing((prev) => [...prev, ...response.data]);
        nextMaxIdRef.current = response.next;
        setHasMore(!!response.next);
      }
    } catch (e) {
      console.error("Failed to load more:", e);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchFollowing, loadingMore, hasMore]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const onScroll = useRangeChange(virtuaHandle, (start, end) => {
    onListAtTopChange?.(start === 0);
    if (end + 5 > following.length && hasMore) {
      loadMore();
    }
  });

  const handleRefresh = async (event: RefresherCustomEvent) => {
    await loadInitial();
    event.detail.complete();
  };

  if (!activeAccount) {
    return (
      <div className={styles.notLoggedIn}>
        <p>Not logged in to Mastodon</p>
      </div>
    );
  }

  if (loading) {
    return <CenteredSpinner />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={loadInitial} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <div className={styles.empty}>
        <IonIcon icon={personOutline} className={styles.emptyIcon} />
        <p>Not following anyone yet</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      <AppVList
        ref={virtuaHandle}
        className="ion-content-scroll-host"
        onScroll={onScroll}
      >
        <IonList>
          {following.map((account) => (
            <IonItem
              key={account.id}
              className={styles.followingItem}
              detail={false}
            >
              <img
                src={account.avatar}
                alt=""
                className={styles.avatar}
                slot="start"
              />
              <IonLabel>
                <h3 className={styles.displayName}>
                  {account.display_name || account.username}
                </h3>
                <p className={styles.handle}>@{account.acct}</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>

        {loadingMore && (
          <div className={styles.loadingMore}>
            <CenteredSpinner />
          </div>
        )}
      </AppVList>
    </div>
  );
}
