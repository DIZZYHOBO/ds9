import { IonIcon } from "@ionic/react";
import { calendarOutline } from "ionicons/icons";
import { PersonView } from "threadiverse";

import Ago from "#/features/labels/Ago";
import { formatNumber } from "#/helpers/number";

import styles from "./ProfileHeader.module.css";

interface ProfileHeaderProps {
  person: Pick<PersonView, "person" | "counts">;
}

export default function ProfileHeader({ person }: ProfileHeaderProps) {
  const { person: user, counts } = person;

  const displayName = user.display_name || user.name;
  const username = user.name;
  const avatarUrl = user.avatar;
  const bannerUrl = user.banner;
  const bio = user.bio;
  const instanceDomain = new URL(user.actor_id).hostname;

  return (
    <div className={styles.profileHeader}>
      {/* Banner Section */}
      <div className={styles.bannerContainer}>
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt=""
            className={styles.bannerImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.bannerPlaceholder} />
        )}

        {/* Avatar - positioned to overlap banner */}
        <div className={styles.avatarContainer}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${displayName}'s avatar`}
              className={styles.avatar}
              loading="lazy"
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* User Info Section */}
      <div className={styles.userInfo}>
        <h1 className={styles.displayName}>{displayName}</h1>
        <p className={styles.username}>
          @{username}@{instanceDomain}
        </p>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {formatNumber(counts.post_count)}
            </span>
            <span className={styles.statLabel}>Posts</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {formatNumber(counts.comment_count)}
            </span>
            <span className={styles.statLabel}>Comments</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <IonIcon icon={calendarOutline} className={styles.statIcon} />
            <span className={styles.statValue}>
              <Ago as="short" date={user.published} />
            </span>
          </div>
        </div>

        {/* Bio Section */}
        {bio && (
          <div className={styles.bioContainer}>
            <p className={styles.bio}>{bio}</p>
          </div>
        )}
      </div>
    </div>
  );
}
