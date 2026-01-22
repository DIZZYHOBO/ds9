import {
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  RefresherCustomEvent,
} from "@ionic/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VListHandle } from "virtua";

import { useRangeChange } from "#/features/feed/useRangeChange";
import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import { formatRelative } from "#/helpers/date";
import { AppVList } from "#/helpers/virtua";
import {
  MastodonClient,
  MastodonStatus,
  PaginatedResponse,
} from "#/services/mastodon";
import { useAppDispatch, useAppSelector } from "#/store";

import { activeMastodonAccountSelector } from "../../auth/mastodon/mastodonAuthSlice";
import MastodonStatusItem from "../status/MastodonStatusItem";
import { setStatuses } from "../status/mastodonStatusSlice";

import styles from "./MastodonProfilePage.module.css";

type FeedTab = "posts" | "replies";

export default function MastodonProfilePage() {
  const dispatch = useAppDispatch();
  const activeAccount = useAppSelector(activeMastodonAccountSelector);
  const [activeTab, setActiveTab] = useState<FeedTab>("posts");
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

  const fetchStatuses = useCallback(
    async (maxId?: string): Promise<PaginatedResponse<MastodonStatus> | null> => {
      if (!client || !activeAccount) return null;

      // Posts tab: exclude replies, Replies tab: only replies
      return client.getAccountStatuses(activeAccount.account.id, {
        max_id: maxId,
        limit: 20,
        exclude_replies: activeTab === "posts",
        exclude_reblogs: activeTab === "replies",
      });
    },
    [client, activeAccount, activeTab],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    nextMaxIdRef.current = undefined;

    try {
      const response = await fetchStatuses();
      if (response) {
        // Filter to show only replies in the replies tab
        const filteredData = activeTab === "replies"
          ? response.data.filter(s => s.in_reply_to_id)
          : response.data;
        setLocalStatuses(filteredData);
        dispatch(setStatuses(response.data));
        nextMaxIdRef.current = response.next;
        setHasMore(!!response.next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load statuses");
    } finally {
      setLoading(false);
    }
  }, [fetchStatuses, dispatch, activeTab]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextMaxIdRef.current) return;

    setLoadingMore(true);

    try {
      const response = await fetchStatuses(nextMaxIdRef.current);
      if (response) {
        const filteredData = activeTab === "replies"
          ? response.data.filter(s => s.in_reply_to_id)
          : response.data;
        setLocalStatuses((prev) => [...prev, ...filteredData]);
        dispatch(setStatuses(response.data));
        nextMaxIdRef.current = response.next;
        setHasMore(!!response.next);
      }
    } catch (e) {
      console.error("Failed to load more:", e);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchStatuses, loadingMore, hasMore, dispatch, activeTab]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const onScroll = useRangeChange(virtuaHandle, (_start, end) => {
    if (end + 5 > statuses.length && hasMore) {
      loadMore();
    }
  });

  const handleRefresh = async (event: RefresherCustomEvent) => {
    await loadInitial();
    event.detail.complete();
  };

  const handleTabChange = (tab: FeedTab) => {
    setActiveTab(tab);
    setLocalStatuses([]);
    setLoading(true);
  };

  if (!activeAccount) {
    return (
      <div className={styles.notLoggedIn}>
        <p>Not logged in to Mastodon</p>
      </div>
    );
  }

  const account = activeAccount.account;

  // Profile header component to render at top of list
  const profileHeader = (
    <div className={styles.header}>
      {account.header && (
        <div
          className={styles.banner}
          style={{ backgroundImage: `url(${account.header})` }}
        />
      )}
      <div className={styles.profileInfo}>
        <img
          src={account.avatar}
          alt={account.display_name || account.username}
          className={styles.avatar}
        />
        <div className={styles.names}>
          <h1 className={styles.displayName}>
            {account.display_name || account.username}
          </h1>
          <p className={styles.handle}>
            @{account.username}@{activeAccount.instance}
          </p>
        </div>
      </div>

      {account.note && (
        <div
          className={styles.bio}
          dangerouslySetInnerHTML={{ __html: account.note }}
        />
      )}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{account.statuses_count}</span>
          <span className={styles.statLabel}>Posts</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{account.following_count}</span>
          <span className={styles.statLabel}>Following</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{account.followers_count}</span>
          <span className={styles.statLabel}>Followers</span>
        </div>
      </div>

      {account.fields && account.fields.length > 0 && (
        <div className={styles.fields}>
          {account.fields.map((field, index) => (
            <div key={index} className={styles.field}>
              <span className={styles.fieldName}>{field.name}</span>
              <span
                className={styles.fieldValue}
                dangerouslySetInnerHTML={{ __html: field.value }}
              />
            </div>
          ))}
        </div>
      )}

      <p className={styles.joinDate}>
        Joined {formatRelative(account.created_at)}
      </p>

      <div className={styles.tabsContainer}>
        <IonSegment
          value={activeTab}
          onIonChange={(e) => handleTabChange(e.detail.value as FeedTab)}
        >
          <IonSegmentButton value="posts">Posts</IonSegmentButton>
          <IonSegmentButton value="replies">Replies</IonSegmentButton>
        </IonSegment>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      {loading ? (
        <>
          {profileHeader}
          <CenteredSpinner />
        </>
      ) : error ? (
        <>
          {profileHeader}
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={loadInitial} className={styles.retryButton}>
              Retry
            </button>
          </div>
        </>
      ) : (
        <AppVList
          ref={virtuaHandle}
          className="ion-content-scroll-host"
          onScroll={onScroll}
        >
          {profileHeader}
          {statuses.length === 0 ? (
            <div className={styles.empty}>
              <p>No {activeTab === "posts" ? "posts" : "replies"} yet</p>
            </div>
          ) : (
            <>
              {statuses.map((status) => (
                <MastodonStatusItem
                  key={status.id}
                  status={status}
                  navigateToParentOnReply={activeTab === "replies"}
                />
              ))}
              {loadingMore && (
                <div className={styles.loadingMore}>
                  <CenteredSpinner />
                </div>
              )}
              {!hasMore && statuses.length > 0 && (
                <div className={styles.endOfFeed}>No more {activeTab}</div>
              )}
            </>
          )}
        </AppVList>
      )}
    </div>
  );
}
