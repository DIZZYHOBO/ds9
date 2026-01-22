import {
  IonButtons,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent,
} from "@ionic/react";
import { chatbubbleEllipsesOutline } from "ionicons/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { CommentView, PostView } from "threadiverse";
import { VListHandle } from "virtua";

import { activeMastodonAccountSelector } from "#/features/auth/mastodon/mastodonAuthSlice";
import { useRangeChange } from "#/features/feed/useRangeChange";
import Post from "#/features/post/inFeed/Post";
import AppHeader from "#/features/shared/AppHeader";
import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import { AppPage } from "#/helpers/AppPage";
import { buildCommentsTreeWithMissing } from "#/helpers/lemmy";
import { formatNumber } from "#/helpers/number";
import useAppToast from "#/helpers/useAppToast";
import { AppVList } from "#/helpers/virtua";
import FeedContent from "#/routes/pages/shared/FeedContent";
import { AppBackButton } from "#/routes/twoColumn/AppBackButton";
import { getClient } from "#/services/client";
import { MastodonClient, MastodonStatus } from "#/services/mastodon";
import { useAppDispatch, useAppSelector } from "#/store";

import { receivedPosts } from "#/features/post/postSlice";
import MastodonComposeModal from "../compose/MastodonComposeModal";
import FederatedComment from "./FederatedComment";

import styles from "./MastodonLemmyPostPage.module.css";

interface MastodonLemmyPostPageParams {
  id: string;
  instance: string;
}

export default function MastodonLemmyPostPage() {
  const { id, instance = "lemmy.world" } = useParams<MastodonLemmyPostPageParams>();
  const dispatch = useAppDispatch();
  const presentToast = useAppToast();

  const [post, setPost] = useState<PostView | null>(null);
  const [comments, setComments] = useState<CommentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyToStatus, setReplyToStatus] = useState<MastodonStatus | null>(null);

  const virtuaHandle = useRef<VListHandle>(null);

  const activeAccount = useAppSelector(activeMastodonAccountSelector);

  // Mastodon client for the user's instance
  const mastodonClient = useMemo(() => {
    if (!activeAccount) return null;
    return new MastodonClient(activeAccount.instance, activeAccount.accessToken);
  }, [activeAccount]);

  // Create anonymous Lemmy client for the specified instance
  const client = useMemo(() => {
    return getClient(instance);
  }, [instance]);

  const handleReplyToPost = useCallback(async () => {
    if (!mastodonClient || !post?.post.ap_id) {
      presentToast({
        message: "Cannot reply: not logged in to Mastodon",
        color: "warning",
      });
      return;
    }

    setResolving(true);

    try {
      // Search for the Lemmy post on the Mastodon instance
      const searchResult = await mastodonClient.search(post.post.ap_id, {
        type: "statuses",
        resolve: true,
        limit: 1,
      });

      if (searchResult.statuses.length === 0) {
        presentToast({
          message: "Could not find this post on your Mastodon instance",
          color: "warning",
        });
        return;
      }

      setReplyToStatus(searchResult.statuses[0]!);
      setComposeOpen(true);
    } catch (error) {
      presentToast({
        message: error instanceof Error ? error.message : "Failed to resolve post",
        color: "danger",
      });
    } finally {
      setResolving(false);
    }
  }, [mastodonClient, post, presentToast]);

  const loadPost = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch post and comments
      const [postResponse, commentsResponse] = await Promise.all([
        client.getPost({ id: +id }),
        client.getComments({
          post_id: +id,
          max_depth: 8,
          sort: "Hot",
        }),
      ]);

      setPost(postResponse.post_view);
      setComments(commentsResponse.data);

      // Store in Redux for consistency
      dispatch(receivedPosts([postResponse.post_view]));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load post");
    } finally {
      setLoading(false);
    }
  }, [client, id, dispatch]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleRefresh = async (event: RefresherCustomEvent) => {
    await loadPost();
    event.detail.complete();
  };

  const onScroll = useRangeChange(virtuaHandle, () => {});

  // Build comment tree
  const commentTree = useMemo(() => {
    if (!comments.length) return [];
    return buildCommentsTreeWithMissing(comments, false);
  }, [comments]);

  return (
    <AppPage>
      <AppHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <AppBackButton defaultHref="/posts" />
          </IonButtons>
          <IonTitle>
            {post ? `${formatNumber(post.counts.comments)} Comments` : "Post"}
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
            <button onClick={loadPost} className={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : post ? (
          <AppVList
            ref={virtuaHandle}
            className="ion-content-scroll-host"
            onScroll={onScroll}
          >
            {/* Main post */}
            <Post post={post} />

            {/* Reply to post action bar */}
            {activeAccount && (
              <div className={styles.postActions}>
                <button
                  className={styles.replyButton}
                  onClick={handleReplyToPost}
                  disabled={resolving}
                >
                  {resolving ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      <IonIcon icon={chatbubbleEllipsesOutline} />
                      Reply to post
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Comments */}
            <div className={styles.commentsHeader}>
              {formatNumber(post.counts.comments)} Comments
            </div>

            {commentTree.length === 0 ? (
              <div className={styles.noComments}>No comments yet</div>
            ) : (
              commentTree.map((node) => (
                <FederatedComment
                  key={node.comment_view.comment.id}
                  node={node}
                  depth={0}
                />
              ))
            )}
          </AppVList>
        ) : null}
      </FeedContent>

      <MastodonComposeModal
        isOpen={composeOpen}
        onDismiss={() => {
          setComposeOpen(false);
          setReplyToStatus(null);
        }}
        replyTo={replyToStatus ?? undefined}
        onSuccess={() => {
          // Refresh comments after replying
          loadPost();
        }}
      />
    </AppPage>
  );
}
