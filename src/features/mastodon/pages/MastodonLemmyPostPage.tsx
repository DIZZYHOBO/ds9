import {
  IonButtons,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  RefresherCustomEvent,
} from "@ionic/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";
import { CommentView, PostView } from "threadiverse";
import { VListHandle } from "virtua";

import { useRangeChange } from "#/features/feed/useRangeChange";
import Post from "#/features/post/inFeed/Post";
import AppHeader from "#/features/shared/AppHeader";
import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import { AppPage } from "#/helpers/AppPage";
import { buildCommentsTreeWithMissing } from "#/helpers/lemmy";
import { formatNumber } from "#/helpers/number";
import { AppVList } from "#/helpers/virtua";
import FeedContent from "#/routes/pages/shared/FeedContent";
import { AppBackButton } from "#/routes/twoColumn/AppBackButton";
import { getClient } from "#/services/client";
import { useAppDispatch } from "#/store";

import { receivedPosts } from "#/features/post/postSlice";
import FederatedComment from "./FederatedComment";

import styles from "./MastodonLemmyPostPage.module.css";

interface MastodonLemmyPostPageParams {
  id: string;
  instance: string;
}

export default function MastodonLemmyPostPage() {
  const { id, instance = "lemmy.world" } = useParams<MastodonLemmyPostPageParams>();
  const dispatch = useAppDispatch();

  const [post, setPost] = useState<PostView | null>(null);
  const [comments, setComments] = useState<CommentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const virtuaHandle = useRef<VListHandle>(null);

  // Create anonymous client for the specified instance
  const client = useMemo(() => {
    return getClient(instance);
  }, [instance]);

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
    </AppPage>
  );
}
