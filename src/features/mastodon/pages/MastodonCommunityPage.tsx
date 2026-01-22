import {
  IonButtons,
  IonIcon,
  IonItem,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent,
} from "@ionic/react";
import {
  checkmarkCircle,
  chevronDownOutline,
  chevronUpOutline,
  addCircleOutline,
} from "ionicons/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { CommunityView, PostView } from "threadiverse";
import { VListHandle } from "virtua";

import { activeMastodonAccountSelector } from "#/features/auth/mastodon/mastodonAuthSlice";
import { useRangeChange } from "#/features/feed/useRangeChange";
import LargePost from "#/features/post/inFeed/large/LargePost";
import { receivedPosts } from "#/features/post/postSlice";
import AppHeader from "#/features/shared/AppHeader";
import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import { cx } from "#/helpers/css";
import { AppPage } from "#/helpers/AppPage";
import { isTouchDevice } from "#/helpers/device";
import { formatNumber } from "#/helpers/number";
import { useBuildMastodonLink } from "#/helpers/routes";
import useAppToast from "#/helpers/useAppToast";
import { useOptimizedIonRouter } from "#/helpers/useOptimizedIonRouter";
import { AppVList } from "#/helpers/virtua";
import FeedContent from "#/routes/pages/shared/FeedContent";
import { AppBackButton } from "#/routes/twoColumn/AppBackButton";
import { getClient } from "#/services/client";
import { LIMIT } from "#/services/lemmy";
import { MastodonClient } from "#/services/mastodon";
import { useAppDispatch, useAppSelector } from "#/store";

import styles from "./MastodonCommunityPage.module.css";

interface MastodonCommunityPageParams {
  community: string;
  instance: string;
}

export default function MastodonCommunityPage() {
  const { community, instance = "lemmy.world" } = useParams<MastodonCommunityPageParams>();
  const dispatch = useAppDispatch();
  const presentToast = useAppToast();
  const router = useOptimizedIonRouter();
  const buildMastodonLink = useBuildMastodonLink();

  const [communityView, setCommunityView] = useState<CommunityView | null>(null);
  const [posts, setPosts] = useState<PostView[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const nextCursorRef = useRef<string | undefined>(undefined);
  const virtuaHandle = useRef<VListHandle>(null);

  const activeAccount = useAppSelector(activeMastodonAccountSelector);

  // Mastodon client for following
  const mastodonClient = useMemo(() => {
    if (!activeAccount) return null;
    return new MastodonClient(activeAccount.instance, activeAccount.accessToken);
  }, [activeAccount]);

  // Anonymous Lemmy client for the specified instance
  const lemmyClient = useMemo(() => {
    return getClient(instance);
  }, [instance]);

  const communityHandle = community.includes("@") ? community : `${community}@${instance}`;

  const loadCommunity = useCallback(async () => {
    setLoading(true);
    setError(null);
    nextCursorRef.current = undefined;

    try {
      const [communityResponse, postsResponse] = await Promise.all([
        lemmyClient.getCommunity({ name: communityHandle }),
        lemmyClient.getPosts({
          community_name: communityHandle,
          limit: LIMIT,
          sort: "Hot",
        }),
      ]);

      setCommunityView(communityResponse.community_view);
      setPosts(postsResponse.data);
      dispatch(receivedPosts(postsResponse.data));
      nextCursorRef.current = postsResponse.next_page?.toString();
      setHasMore(!!postsResponse.next_page && postsResponse.data.length > 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load community");
    } finally {
      setLoading(false);
    }
  }, [lemmyClient, communityHandle, dispatch]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursorRef.current) return;

    setLoadingMore(true);

    try {
      const response = await lemmyClient.getPosts({
        community_name: communityHandle,
        page_cursor: nextCursorRef.current,
        limit: LIMIT,
        sort: "Hot",
      });

      setPosts((prev) => [...prev, ...response.data]);
      dispatch(receivedPosts(response.data));
      nextCursorRef.current = response.next_page?.toString();
      setHasMore(!!response.next_page && response.data.length > 0);
    } catch (e) {
      console.error("Failed to load more:", e);
    } finally {
      setLoadingMore(false);
    }
  }, [lemmyClient, communityHandle, loadingMore, hasMore, dispatch]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  // Check if we're following this community via Mastodon
  useEffect(() => {
    const checkFollowing = async () => {
      if (!mastodonClient || !communityView) return;

      try {
        // Search for the community on Mastodon to get its account
        const searchResult = await mastodonClient.search(
          communityView.community.actor_id,
          { type: "accounts", resolve: true, limit: 1 }
        );

        if (searchResult.accounts.length > 0) {
          const account = searchResult.accounts[0]!;
          // Check if we're following
          const relationships = await mastodonClient.getRelationships([account.id]);
          if (relationships.length > 0) {
            setIsFollowing(relationships[0]!.following);
          }
        }
      } catch (e) {
        console.error("Failed to check following status:", e);
      }
    };

    checkFollowing();
  }, [mastodonClient, communityView]);

  const handleSubscribe = async () => {
    if (!mastodonClient || !communityView) return;

    setSubscribing(true);

    try {
      // Search for the community on Mastodon to resolve its ActivityPub actor
      const searchResult = await mastodonClient.search(
        communityView.community.actor_id,
        { type: "accounts", resolve: true, limit: 1 }
      );

      if (searchResult.accounts.length === 0) {
        presentToast({
          message: "Could not find community on your Mastodon instance",
          color: "warning",
        });
        return;
      }

      const account = searchResult.accounts[0]!;

      if (isFollowing) {
        await mastodonClient.unfollowAccount(account.id);
        setIsFollowing(false);
        presentToast({
          message: `Unsubscribed from ${communityView.community.name}`,
          color: "success",
        });
      } else {
        await mastodonClient.followAccount(account.id);
        setIsFollowing(true);
        presentToast({
          message: `Subscribed to ${communityView.community.name}`,
          color: "success",
        });
      }
    } catch (e) {
      presentToast({
        message: e instanceof Error ? e.message : "Failed to subscribe",
        color: "danger",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const onScroll = useRangeChange(virtuaHandle, (_start, end) => {
    if (end + 5 > posts.length && hasMore && !loadingMore) {
      loadMore();
    }
  });

  const handleRefresh = async (event: RefresherCustomEvent) => {
    await loadCommunity();
    event.detail.complete();
  };

  const handlePostClick = (post: PostView) => {
    router.push(buildMastodonLink(`/mastodon/lemmy/${instance}/post/${post.post.id}`));
  };

  const communityHeader = communityView && (
    <div className={styles.header}>
      {communityView.community.banner && (
        <div
          className={styles.banner}
          style={{ backgroundImage: `url(${communityView.community.banner})` }}
        />
      )}
      <div className={styles.communityInfo}>
        {communityView.community.icon && (
          <img
            src={communityView.community.icon}
            alt={communityView.community.name}
            className={styles.icon}
          />
        )}
        <div className={styles.names}>
          <h1 className={styles.displayName}>
            {communityView.community.title || communityView.community.name}
          </h1>
          <p className={styles.handle}>
            !{communityView.community.name}@{instance}
          </p>
        </div>
      </div>

      {activeAccount && (
        <button
          className={`${styles.subscribeButton} ${isFollowing ? styles.subscribed : ""}`}
          onClick={handleSubscribe}
          disabled={subscribing}
        >
          {subscribing ? (
            <IonSpinner name="crescent" />
          ) : isFollowing ? (
            <>
              <IonIcon icon={checkmarkCircle} />
              Subscribed
            </>
          ) : (
            <>
              <IonIcon icon={addCircleOutline} />
              Subscribe
            </>
          )}
        </button>
      )}

      {communityView.community.description && (
        <div className={styles.bioSection}>
          <button
            className={styles.bioToggle}
            onClick={() => setBioExpanded(!bioExpanded)}
          >
            <span>About this community</span>
            <IonIcon icon={bioExpanded ? chevronUpOutline : chevronDownOutline} />
          </button>
          {bioExpanded && (
            <div
              className={styles.bio}
              dangerouslySetInnerHTML={{ __html: communityView.community.description }}
            />
          )}
        </div>
      )}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {formatNumber(communityView.counts.subscribers)}
          </span>
          <span className={styles.statLabel}>Subscribers</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {formatNumber(communityView.counts.posts)}
          </span>
          <span className={styles.statLabel}>Posts</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {formatNumber(communityView.counts.comments)}
          </span>
          <span className={styles.statLabel}>Comments</span>
        </div>
      </div>
    </div>
  );

  return (
    <AppPage>
      <AppHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <AppBackButton defaultHref="/posts" />
          </IonButtons>
          <IonTitle>
            {communityView ? communityView.community.name : "Community"}
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
            <button onClick={loadCommunity} className={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : (
          <AppVList
            ref={virtuaHandle}
            className="ion-content-scroll-host"
            onScroll={onScroll}
          >
            {communityHeader}

            {posts.length === 0 ? (
              <div className={styles.empty}>
                <p>No posts yet</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </AppVList>
        )}
      </FeedContent>
    </AppPage>
  );
}
