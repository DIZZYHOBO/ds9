import { IonIcon, IonSpinner } from "@ionic/react";
import {
  arrowUpOutline,
  chatbubbleOutline,
  chatbubbleEllipsesOutline,
  timeOutline,
} from "ionicons/icons";
import { useState, useMemo, useCallback } from "react";

import Ago from "#/features/labels/Ago";
import { CommentNodeI } from "#/helpers/lemmy";
import { formatNumber } from "#/helpers/number";
import useAppToast from "#/helpers/useAppToast";
import { MastodonClient, MastodonStatus } from "#/services/mastodon";
import { useAppSelector } from "#/store";

import { activeMastodonAccountSelector } from "#/features/auth/mastodon/mastodonAuthSlice";
import MastodonComposeModal from "../compose/MastodonComposeModal";

import styles from "./FederatedComment.module.css";

interface FederatedCommentProps {
  node: CommentNodeI;
  depth: number;
}

export default function FederatedComment({ node, depth }: FederatedCommentProps) {
  const { comment_view: commentView } = node;
  const { comment, creator, counts } = commentView;
  const presentToast = useAppToast();

  const [resolving, setResolving] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyToStatus, setReplyToStatus] = useState<MastodonStatus | null>(null);

  const activeAccount = useAppSelector(activeMastodonAccountSelector);

  const client = useMemo(() => {
    if (!activeAccount) return null;
    return new MastodonClient(activeAccount.instance, activeAccount.accessToken);
  }, [activeAccount]);

  // Limit depth indentation
  const displayDepth = Math.min(depth, 6);

  const handleReply = useCallback(async () => {
    if (!client || !comment.ap_id) {
      presentToast({
        message: "Cannot reply: not logged in to Mastodon",
        color: "warning",
      });
      return;
    }

    setResolving(true);

    try {
      // Search for the Lemmy comment on the Mastodon instance
      // The resolve option will fetch remote content if not already known
      const searchResult = await client.search(comment.ap_id, {
        type: "statuses",
        resolve: true,
        limit: 1,
      });

      if (searchResult.statuses.length === 0) {
        presentToast({
          message: "Could not find this comment on your Mastodon instance",
          color: "warning",
        });
        return;
      }

      // Found the status, open compose modal
      setReplyToStatus(searchResult.statuses[0]!);
      setComposeOpen(true);
    } catch (error) {
      presentToast({
        message: error instanceof Error ? error.message : "Failed to resolve comment",
        color: "danger",
      });
    } finally {
      setResolving(false);
    }
  }, [client, comment.ap_id, presentToast]);

  return (
    <>
      <div
        className={styles.container}
        style={{ marginLeft: `${displayDepth * 12}px` }}
      >
        <div className={styles.comment}>
          <div className={styles.header}>
            <span className={styles.author}>{creator.name}</span>
            <span className={styles.stats}>
              <span className={styles.stat}>
                <IonIcon icon={arrowUpOutline} />
                {formatNumber(counts.score)}
              </span>
              <span className={styles.stat}>
                <IonIcon icon={timeOutline} />
                <Ago date={comment.published} />
              </span>
            </span>
          </div>

          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />

          <div className={styles.actions}>
            {activeAccount && (
              <button
                className={styles.replyButton}
                onClick={handleReply}
                disabled={resolving}
              >
                {resolving ? (
                  <IonSpinner name="crescent" />
                ) : (
                  <>
                    <IonIcon icon={chatbubbleEllipsesOutline} />
                    Reply
                  </>
                )}
              </button>
            )}

            {counts.child_count > 0 && (
              <span className={styles.childCount}>
                <IonIcon icon={chatbubbleOutline} />
                {counts.child_count} {counts.child_count === 1 ? "reply" : "replies"}
              </span>
            )}
          </div>
        </div>

        {/* Render children */}
        {node.children.map((childNode) => (
          <FederatedComment
            key={childNode.comment_view.comment.id}
            node={childNode}
            depth={depth + 1}
          />
        ))}
      </div>

      <MastodonComposeModal
        isOpen={composeOpen}
        onDismiss={() => {
          setComposeOpen(false);
          setReplyToStatus(null);
        }}
        replyTo={replyToStatus ?? undefined}
      />
    </>
  );
}
