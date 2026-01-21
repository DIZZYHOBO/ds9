import { IonIcon, IonItem } from "@ionic/react";
import {
  arrowDownOutline,
  arrowUpOutline,
  chatbubbleOutline,
  linkOutline,
  peopleOutline,
  timeOutline,
} from "ionicons/icons";
import { PostView } from "threadiverse";

import { formatRelative } from "#/helpers/date";
import { getHandle } from "#/helpers/lemmy";

import styles from "./LemmyFederatedPostItem.module.css";

interface LemmyFederatedPostItemProps {
  post: PostView;
  onVote?: (post: PostView, direction: "up" | "down") => void;
  onReply?: (post: PostView) => void;
}

export default function LemmyFederatedPostItem({
  post,
  onVote,
  onReply,
}: LemmyFederatedPostItemProps) {
  const communityHandle = getHandle(post.community);
  const authorHandle = getHandle(post.creator);

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVote?.(post, "up");
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVote?.(post, "down");
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReply?.(post);
  };

  const thumbnail = post.post.thumbnail_url || (
    post.post.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? post.post.url : null
  );

  return (
    <IonItem className={styles.item} lines="none">
      <div className={styles.container}>
        <div className={styles.voteColumn}>
          <button
            className={`${styles.voteButton} ${post.my_vote === 1 ? styles.upvoted : ""}`}
            onClick={handleUpvote}
          >
            <IonIcon icon={arrowUpOutline} />
          </button>
          <span className={styles.score}>
            {post.counts.score}
          </span>
          <button
            className={`${styles.voteButton} ${post.my_vote === -1 ? styles.downvoted : ""}`}
            onClick={handleDownvote}
          >
            <IonIcon icon={arrowDownOutline} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.community}>
              <IonIcon icon={peopleOutline} className={styles.communityIcon} />
              {communityHandle}
            </span>
            <span className={styles.meta}>
              <IonIcon icon={timeOutline} className={styles.metaIcon} />
              {formatRelative(post.post.published)}
            </span>
          </div>

          <h3 className={styles.title}>{post.post.name}</h3>

          {post.post.body && (
            <p className={styles.body}>
              {post.post.body.length > 200
                ? `${post.post.body.slice(0, 200)}...`
                : post.post.body}
            </p>
          )}

          {thumbnail && (
            <div className={styles.thumbnail}>
              <img src={thumbnail} alt="" loading="lazy" />
            </div>
          )}

          {post.post.url && !thumbnail && (
            <a
              href={post.post.url}
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <IonIcon icon={linkOutline} />
              {new URL(post.post.url).hostname}
            </a>
          )}

          <div className={styles.footer}>
            <span className={styles.author}>by {authorHandle}</span>

            <div className={styles.actions}>
              <button className={styles.actionButton} onClick={handleReply}>
                <IonIcon icon={chatbubbleOutline} />
                <span>{post.counts.comments}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </IonItem>
  );
}
