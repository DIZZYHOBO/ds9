import { IonIcon } from "@ionic/react";
import { calendarOutline, personCircle } from "ionicons/icons";
import { useEffect, useState } from "react";
import { PersonView } from "threadiverse";

import Ago from "#/features/labels/Ago";
import { formatNumber } from "#/helpers/number";
import { useAppSelector } from "#/store";

import styles from "./ProfileHeader.module.css";

interface ProfileHeaderProps {
  person: Pick<PersonView, "person" | "counts">;
}

export default function ProfileHeader({ person }: ProfileHeaderProps) {
  const { person: user, counts } = person;
  const [avatarError, setAvatarError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  // Get the connected instance to build the image proxy URL
  const connectedInstance = useAppSelector(
    (state) => state.auth.connectedInstance,
  );

  const displayName = user.display_name || user.name;
  const username = user.name;

  // Access avatar and banner - these are optional fields
  const avatarUrl = user.avatar ?? undefined;
  const bannerUrl = user.banner ?? undefined;
  const bio = user.bio ?? undefined;

  // Debug logging
  useEffect(() => {
    console.log("[ProfileHeader] Rendering with user data:", {
      name: user.name,
      display_name: user.display_name,
      avatar: user.avatar,
      banner: user.banner,
      bio: user.bio,
      actor_id: user.actor_id,
      connectedInstance,
    });
  }, [user, connectedInstance]);

  // Extract instance domain from actor_id
  let instanceDomain = "";
  try {
    if (user.actor_id) {
      instanceDomain = new URL(user.actor_id).hostname;
    }
  } catch {
    instanceDomain = "unknown";
  }

  // Build proxied image URL to avoid CORS issues
  // Uses the connected instance's image proxy
  const getProxiedImageUrl = (originalUrl: string | undefined) => {
    if (!originalUrl) return undefined;
    if (!connectedInstance) return originalUrl;

    // Check if the image is already from the connected instance (no proxy needed)
    try {
      const imageHost = new URL(originalUrl).hostname;
      if (imageHost === connectedInstance) {
        return originalUrl;
      }
    } catch {
      return originalUrl;
    }

    // Use the Lemmy image proxy
    const proxyUrl = `https://${connectedInstance}/api/v3/image_proxy?url=${encodeURIComponent(originalUrl)}`;
    console.log("[ProfileHeader] Proxying image:", originalUrl, "->", proxyUrl);
    return proxyUrl;
  };

  const proxiedAvatarUrl = getProxiedImageUrl(avatarUrl);
  const proxiedBannerUrl = getProxiedImageUrl(bannerUrl);

  const showAvatar = Boolean(proxiedAvatarUrl) && !avatarError;
  const showBanner = Boolean(proxiedBannerUrl) && !bannerError;

  return (
    <div className={styles.profileHeader}>
      {/* Banner Section */}
      <div className={styles.bannerContainer}>
        {showBanner ? (
          <img
            src={proxiedBannerUrl}
            alt=""
            className={styles.bannerImage}
            loading="lazy"
            onError={() => {
              console.log(
                "[ProfileHeader] Banner failed to load:",
                proxiedBannerUrl,
              );
              setBannerError(true);
            }}
          />
        ) : (
          <div className={styles.bannerPlaceholder} />
        )}

        {/* Avatar - positioned to overlap banner */}
        <div className={styles.avatarContainer}>
          {showAvatar ? (
            <img
              src={proxiedAvatarUrl}
              alt={`${displayName}'s avatar`}
              className={styles.avatar}
              loading="lazy"
              onError={() => {
                console.log(
                  "[ProfileHeader] Avatar failed to load:",
                  proxiedAvatarUrl,
                );
                setAvatarError(true);
              }}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <IonIcon icon={personCircle} className={styles.avatarIcon} />
            </div>
          )}
        </div>
      </div>

      {/* User Info Section */}
      <div className={styles.userInfo}>
        <h1 className={styles.displayName}>{displayName}</h1>
        <p className={styles.username}>
          @{username}
          {instanceDomain && `@${instanceDomain}`}
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
