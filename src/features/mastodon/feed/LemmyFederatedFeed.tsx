import {
  IonItem,
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
} from "@ionic/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PostView } from "threadiverse";
import { VListHandle } from "virtua";

import { useRangeChange } from "#/features/feed/useRangeChange";
import LargePost from "#/features/post/inFeed/large/LargePost";
import { receivedPosts } from "#/features/post/postSlice";
import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import { cx } from "#/helpers/css";
import { isTouchDevice } from "#/helpers/device";
import { useBuildMastodonLink } from "#/helpers/routes";
import { useOptimizedIonRouter } from "#/helpers/useOptimizedIonRouter";
import { AppVList } from "#/helpers/virtua";
import { getClient } from "#/services/client";
import { LIMIT } from "#/services/lemmy";
import { useAppDispatch } from "#/store";

import styles from "./LemmyFederatedFeed.module.css";

interface LemmyFederatedFeedProps {
  instance?: string;
}

export default function LemmyFederatedFeed({
  instance = "lemmy.world",
}: LemmyFederatedFeedProps) {
  const dispatch = useAppDispatch();
  const router = useOptimizedIonRouter();
  const buildMastodonLink = useBuildMastodonLink();

  const [posts, setPosts] = useState<PostView[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nextCursorRef = useRef<string | undefined>(undefined);
  const virtuaHandle = useRef<VListHandle>(null);

  // Create anonymous Lemmy client for the specified instance
  const client = useMemo(() => {
    return getClient(instance);
  }, [instance]);

  const fetchPosts = useCallback(
    async (refresh = false) => {
      if (!refresh && loadingMore) return;

      if (refresh) {
        setLoading(true);
        setError(null);
        nextCursorRef.current = undefined;
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await client.getPosts({
          page_cursor: refresh ? undefined : nextCursorRef.current,
          limit: LIMIT,
          type_: "All",
          sort: "Hot",
        });

        const newPosts = response.data;

        if (refresh) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }

        // Store in Redux for consistency
        dispatch(receivedPosts(newPosts));

        nextCursorRef.current = response.next_page?.toString();
        setHasMore(!!response.next_page && newPosts.length > 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load posts");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [client, loadingMore, dispatch],
  );

  // Initial load
  useEffect(() => {
    fetchPosts(true);
  }, []);

  const onScroll = useRangeChange(virtuaHandle, (_start, end) => {
    if (end + 5 > posts.length && hasMore && !loadingMore) {
      fetchPosts(false);
    }
  });

  const handleRefresh = async (event: RefresherCustomEvent) => {
    await fetchPosts(true);
    event.detail.complete();
  };

  const handlePostClick = (post: PostView) => {
    // Navigate to the federated post page
    router.push(buildMastodonLink(`/mastodon/lemmy/${instance}/post/${post.post.id}`));
  };

  if (loading) {
    return (
      <>
        <div className={styles.instanceBanner}>
          Browsing {instance} via federation
        </div>
        <CenteredSpinner />
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className={styles.instanceBanner}>
          Browsing {instance} via federation
        </div>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={() => fetchPosts(true)} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      <AppVList
        ref={virtuaHandle}
        className="ion-content-scroll-host"
        onScroll={onScroll}
      >
        <div className={styles.instanceBanner}>
          Browsing {instance} via federation
        </div>

        {posts.map((post) => (
          <IonItem
            key={post.post.id}
            mode="ios"
            className={cx(styles.postItem, isTouchDevice() && "ion-activatable")}
            detail={false}
            onClick={() => handlePostClick(post)}
            href={undefined}
          >
            <LargePost post={post} />
          </IonItem>
        ))}

        {loadingMore && (
          <div className={styles.loadingMore}>
            <CenteredSpinner />
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className={styles.endOfFeed}>No more posts</div>
        )}
      </AppVList>
    </>
  );
}
