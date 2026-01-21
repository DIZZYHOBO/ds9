import {
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
} from "@ionic/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PostView } from "threadiverse";
import { VListHandle } from "virtua";

import { useRangeChange } from "#/features/feed/useRangeChange";
import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import { AppVList } from "#/helpers/virtua";
import { getClient } from "#/services/client";
import { LIMIT } from "#/services/lemmy";

import LemmyFederatedPostItem from "./LemmyFederatedPostItem";

import styles from "./LemmyFederatedFeed.module.css";

interface LemmyFederatedFeedProps {
  instance?: string;
  onVotePost?: (post: PostView, direction: "up" | "down") => void;
  onReplyPost?: (post: PostView) => void;
}

export default function LemmyFederatedFeed({
  instance = "lemmy.world",
  onVotePost,
  onReplyPost,
}: LemmyFederatedFeedProps) {
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

      try {
        setError(null);
        if (refresh) {
          setLoading(true);
          nextCursorRef.current = undefined;
        } else {
          setLoadingMore(true);
        }

        const response = await client.getPosts({
          page_cursor: refresh ? undefined : nextCursorRef.current,
          limit: LIMIT,
          type_: "All",
          sort: "Hot",
        });

        if (refresh) {
          setPosts(response.data);
        } else {
          setPosts((prev) => [...prev, ...response.data]);
        }

        nextCursorRef.current = response.next_page?.toString();
        setHasMore(!!response.next_page && response.data.length > 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load posts");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [client, loadingMore],
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

  if (loading && posts.length === 0) {
    return <CenteredSpinner />;
  }

  if (error && posts.length === 0) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={() => fetchPosts(true)} className={styles.retryButton}>
          Retry
        </button>
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
        onScroll={onScroll}
      >
        <div className={styles.instanceBanner}>
          Browsing {instance} anonymously via federation
        </div>
        {posts.map((post) => (
          <LemmyFederatedPostItem
            key={post.post.id}
            post={post}
            onVote={onVotePost}
            onReply={onReplyPost}
          />
        ))}
        {loadingMore && (
          <div className={styles.loadingMore}>
            <CenteredSpinner />
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <div className={styles.endOfFeed}>You've reached the end</div>
        )}
      </AppVList>
    </>
  );
}
