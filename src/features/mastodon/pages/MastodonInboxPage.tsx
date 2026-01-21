import {
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
} from "@ionic/react";
import {
  chatbubbleOutline,
  heartOutline,
  personAddOutline,
  repeatOutline,
  starOutline,
} from "ionicons/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VListHandle } from "virtua";

import { useRangeChange } from "#/features/feed/useRangeChange";
import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import { formatRelative } from "#/helpers/date";
import { useOptimizedIonRouter } from "#/helpers/useOptimizedIonRouter";
import { AppVList } from "#/helpers/virtua";
import {
  MastodonClient,
  MastodonNotification,
  PaginatedResponse,
} from "#/services/mastodon";
import { useAppSelector } from "#/store";

import { activeMastodonAccountSelector } from "../../auth/mastodon/mastodonAuthSlice";

import styles from "./MastodonInboxPage.module.css";

export default function MastodonInboxPage() {
  const router = useOptimizedIonRouter();
  const activeAccount = useAppSelector(activeMastodonAccountSelector);
  const [notifications, setNotifications] = useState<MastodonNotification[]>([]);
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

  const fetchNotifications = useCallback(
    async (
      maxId?: string,
    ): Promise<PaginatedResponse<MastodonNotification> | null> => {
      if (!client) return null;
      return client.getNotifications({ max_id: maxId, limit: 30 });
    },
    [client],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    nextMaxIdRef.current = undefined;

    try {
      const response = await fetchNotifications();
      if (response) {
        setNotifications(response.data);
        nextMaxIdRef.current = response.next;
        setHasMore(!!response.next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextMaxIdRef.current) return;

    setLoadingMore(true);

    try {
      const response = await fetchNotifications(nextMaxIdRef.current);
      if (response) {
        setNotifications((prev) => [...prev, ...response.data]);
        nextMaxIdRef.current = response.next;
        setHasMore(!!response.next);
      }
    } catch (e) {
      console.error("Failed to load more:", e);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchNotifications, loadingMore, hasMore]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const onScroll = useRangeChange(virtuaHandle, (_start, end) => {
    if (end + 5 > notifications.length && hasMore) {
      loadMore();
    }
  });

  const handleRefresh = async (event: RefresherCustomEvent) => {
    await loadInitial();
    event.detail.complete();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
      case "follow_request":
        return personAddOutline;
      case "favourite":
        return heartOutline;
      case "reblog":
        return repeatOutline;
      case "mention":
        return chatbubbleOutline;
      case "poll":
        return starOutline;
      default:
        return chatbubbleOutline;
    }
  };

  const getNotificationText = (notification: MastodonNotification) => {
    const name = notification.account.display_name || notification.account.username;
    switch (notification.type) {
      case "follow":
        return `${name} followed you`;
      case "follow_request":
        return `${name} requested to follow you`;
      case "favourite":
        return `${name} favourited your post`;
      case "reblog":
        return `${name} boosted your post`;
      case "mention":
        return `${name} mentioned you`;
      case "poll":
        return `A poll you voted in has ended`;
      case "status":
        return `${name} posted`;
      default:
        return `${name} interacted with you`;
    }
  };

  const handleNotificationClick = (notification: MastodonNotification) => {
    if (notification.status) {
      router.push(`/posts/mastodon/status/${notification.status.id}`);
    }
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

  if (notifications.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No notifications</p>
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
          {notifications.map((notification) => (
            <IonItem
              key={notification.id}
              className={styles.notificationItem}
              button
              detail={false}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className={styles.notificationContent}>
                <div className={styles.notificationHeader}>
                  <IonIcon
                    icon={getNotificationIcon(notification.type)}
                    className={styles.notificationIcon}
                  />
                  <img
                    src={notification.account.avatar}
                    alt=""
                    className={styles.avatar}
                  />
                  <div className={styles.notificationInfo}>
                    <IonLabel className={styles.notificationText}>
                      {getNotificationText(notification)}
                    </IonLabel>
                    <span className={styles.time}>
                      {formatRelative(notification.created_at)}
                    </span>
                  </div>
                </div>
                {notification.status && (
                  <div
                    className={styles.statusPreview}
                    dangerouslySetInnerHTML={{
                      __html: notification.status.content,
                    }}
                  />
                )}
              </div>
            </IonItem>
          ))}
        </IonList>

        {loadingMore && (
          <div className={styles.loadingMore}>
            <CenteredSpinner />
          </div>
        )}

        {!hasMore && notifications.length > 0 && (
          <div className={styles.endOfFeed}>No more notifications</div>
        )}
      </AppVList>
    </div>
  );
}
