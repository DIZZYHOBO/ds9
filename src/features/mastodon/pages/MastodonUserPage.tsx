import {
  IonButtons,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent,
} from "@ionic/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { VListHandle } from "virtua";

import { useRangeChange } from "#/features/feed/useRangeChange";
import AppHeader from "#/features/shared/AppHeader";
import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import { AppPage } from "#/helpers/AppPage";
import { formatRelative } from "#/helpers/date";
import { AppVList } from "#/helpers/virtua";
import FeedContent from "#/routes/pages/shared/FeedContent";
import { AppBackButton } from "#/routes/twoColumn/AppBackButton";
import {
  MastodonAccount,
  MastodonClient,
  MastodonStatus,
  PaginatedResponse,
} from "#/services/mastodon";
import { useAppDispatch, useAppSelector } from "#/store";

import { activeMastodonAccountSelector } from "../../auth/mastodon/mastodonAuthSlice";
import MastodonStatusItem from "../status/MastodonStatusItem";
import { setStatuses } from "../status/mastodonStatusSlice";

import styles from "./MastodonUserPage.module.css";

interface MastodonUserPageParams {
  id: string;
}

type FeedTab = "posts" | "replies";

export default function MastodonUserPage() {
  const { id } = useParams<MastodonUserPageParams>();
  const dispatch = useAppDispatch();
  const activeAccount = useAppSelector(activeMastodonAccountSelector);

  const [user, setUser] = useState<MastodonAccount | null>(null);
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

  const fetchUser = useCallback(async () => {
    if (!client) return null;
    return client.getAccount(id);
  }, [client, id]);

  const fetchStatuses = useCallback(
    async (maxId?: string): Promise<PaginatedResponse<MastodonStatus> | null> => {
      if (!client) return null;

      // Posts tab: exclude replies, Replies tab: only replies
      return client.getAccountStatuses(id, {
        max_id: maxId,
        limit: 20,
        exclude_replies: activeTab === "posts",
        exclude_reblogs: activeTab === "replies",
      });
    },
    [client, id, activeTab],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    nextMaxIdRef.current = undefined;

    try {
      const [userResponse, statusesResponse] = await Promise.all([
        user ? Promise.resolve(user) : fetchUser(),
        fetchStatuses(),
      ]);

      if (userResponse && !user) {
        setUser(userResponse);
      }

      if (statusesResponse) {
        const filteredData = activeTab === "replies"
          ? statusesResponse.data.filter(s => s.in_reply_to_id)
          : statusesResponse.data;
        setLocalStatuses(filteredData);
        dispatch(setStatuses(statusesResponse.data));
        nextMaxIdRef.current = statusesResponse.next;
        setHasMore(!!statusesResponse.next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [fetchUser, fetchStatuses, dispatch, user, activeTab]);

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
      <AppPage>
        <AppHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <AppBackButton defaultHref="/posts" />
            </IonButtons>
            <IonTitle>User</IonTitle>
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

  // Profile header component to render at top of list
  const profileHeader = user ? (
    <div className={styles.header}>
      {user.header && (
        <div
          className={styles.banner}
          style={{ backgroundImage: `url(${user.header})` }}
        />
      )}
      <div className={styles.profileInfo}>
        <img
          src={user.avatar}
          alt={user.display_name || user.username}
          className={styles.avatar}
        />
        <div className={styles.names}>
          <h1 className={styles.displayName}>
            {user.display_name || user.username}
          </h1>
          <p className={styles.handle}>@{user.acct}</p>
        </div>
      </div>

      {user.note && (
        <div
          className={styles.bio}
          dangerouslySetInnerHTML={{ __html: user.note }}
        />
      )}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{user.statuses_count}</span>
          <span className={styles.statLabel}>Posts</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{user.following_count}</span>
          <span className={styles.statLabel}>Following</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{user.followers_count}</span>
          <span className={styles.statLabel}>Followers</span>
        </div>
      </div>

      {user.fields && user.fields.length > 0 && (
        <div className={styles.fields}>
          {user.fields.map((field, index) => (
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
        Joined {formatRelative(user.created_at)}
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
  ) : null;

  return (
    <AppPage>
      <AppHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <AppBackButton defaultHref="/posts" />
          </IonButtons>
          <IonTitle>
            {user ? user.display_name || user.username : "User"}
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
            <button onClick={loadInitial} className={styles.retryButton}>
              Retry
            </button>
          </div>
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
                  <MastodonStatusItem key={status.id} status={status} />
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
      </FeedContent>
    </AppPage>
  );
}
