import { IonIcon } from "@ionic/react";
import { arrowUpOutline, chatbubbleOutline, timeOutline } from "ionicons/icons";

import Ago from "#/features/labels/Ago";
import { CommentNodeI } from "#/helpers/lemmy";
import { formatNumber } from "#/helpers/number";

import styles from "./FederatedComment.module.css";

interface FederatedCommentProps {
  node: CommentNodeI;
  depth: number;
}

export default function FederatedComment({ node, depth }: FederatedCommentProps) {
  const { comment_view: commentView } = node;
  const { comment, creator, counts } = commentView;

  // Limit depth indentation
  const displayDepth = Math.min(depth, 6);

  return (
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

        {counts.child_count > 0 && (
          <div className={styles.childCount}>
            <IonIcon icon={chatbubbleOutline} />
            {counts.child_count} {counts.child_count === 1 ? "reply" : "replies"}
          </div>
        )}
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
  );
}
