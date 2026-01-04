import { IonIcon, IonItem, IonLabel, IonList, IonSpinner } from "@ionic/react";
import { ComponentProps, useCallback, useEffect, useRef, useState } from "react";
import { CommentView, PersonView } from "threadiverse";

import { userHandleSelector } from "#/features/auth/authSelectors";
import { receivedComments } from "#/features/comment/commentSlice";
import { FetchFn } from "#/features/feed/Feed";
import PostCommentFeed, {
  PostCommentItem,
} from "#/features/feed/PostCommentFeed";
import {
  getModColor,
  getModIcon,
  getModName,
} from "#/features/moderation/useCanModerate";
import useModZoneActions from "#/features/moderation/useModZoneActions";
import { MaxWidthContainer } from "#/features/shared/AppContent";
import { getRemoteHandle, isPost } from "#/helpers/lemmy";
import { useBuildGeneralBrowseLink } from "#/helpers/routes";
import { useMode } from "#/helpers/threadiverse";
import useClient from "#/helpers/useClient";
import { useOptimizedIonRouter } from "#/helpers/useOptimizedIonRouter";
import { LIMIT } from "#/services/lemmy";
import { useAppDispatch, useAppSelector } from "#/store";

import ProfileHeader from "./ProfileHeader";
import ProfileTabs, { ProfileTabType } from "./ProfileTabs";

import styles from "./Profile.module.css";

interface ProfileProps
  extends Pick<ComponentProps<typeof PostCommentFeed>, "onPull"> {
  person: Pick<PersonView, "person" | "counts">;
}

export default function Profile({ person, onPull }: ProfileProps) {
  const mode = useMode();
  const client = useClient();
  const myHandle = useAppSelector(userHandleSelector);
  const { present: presentModZoneActions, role } = useModZoneActions({
    type: "ModeratorView",
  });
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<ProfileTabType>("overview");
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [feedKey, setFeedKey] = useState(0);
  const router = useOptimizedIonRouter();
  const buildGeneralBrowseLink = useBuildGeneralBrowseLink();
  const pendingTabRef = useRef<ProfileTabType | null>(null);

  const isSelf = getRemoteHandle(person.person) === myHandle;

  // Create a wrapped fetch function that handles loading state
  const createFetchFn = useCallback(
    (baseFetchFn: FetchFn<PostCommentItem>): FetchFn<PostCommentItem> => {
      return async (page_cursor, ...rest) => {
        const result = await baseFetchFn(page_cursor, ...rest);

        // After first fetch completes, clear loading state
        if (isTabLoading) {
          setIsTabLoading(false);
        }

        // If this was triggered by a tab change, update the active tab
        if (pendingTabRef.current !== null) {
          pendingTabRef.current = null;
        }

        return result;
      };
    },
    [isTabLoading],
  );

  // Fetch function for Overview (posts + comments mixed)
  const fetchOverview: FetchFn<PostCommentItem> = useCallback(
    async (page_cursor, ...rest) => {
      const response = await client.listPersonContent(
        {
          page_cursor,
          limit: LIMIT,
          person_id: person.person.id,
        },
        ...rest,
      );

      dispatch(
        receivedComments(
          response.data.filter((c) => !isPost(c)) as CommentView[],
        ),
      );

      return response;
    },
    [client, person.person.id, dispatch],
  );

  // Fetch function for Posts only
  const fetchPosts: FetchFn<PostCommentItem> = useCallback(
    async (page_cursor, ...rest) => {
      const response = await client.listPersonContent(
        {
          page_cursor,
          limit: LIMIT,
          person_id: person.person.id,
          type: "Posts",
        },
        ...rest,
      );

      return response;
    },
    [client, person.person.id],
  );

  // Fetch function for Comments only
  const fetchComments: FetchFn<PostCommentItem> = useCallback(
    async (page_cursor, ...rest) => {
      const response = await client.listPersonContent(
        {
          page_cursor,
          limit: LIMIT,
          person_id: person.person.id,
          type: "Comments",
        },
        ...rest,
      );

      dispatch(receivedComments(response.data as CommentView[]));

      return response;
    },
    [client, person.person.id, dispatch],
  );

  // Fetch function for Saved
  const fetchSaved: FetchFn<PostCommentItem> = useCallback(
    async (page_cursor, ...rest) => {
      const response = await client.listPersonSaved(
        {
          page_cursor,
          person_id: person.person.id,
          limit: LIMIT,
        },
        ...rest,
      );

      return response;
    },
    [client, person.person.id],
  );

  // Fetch function for Upvoted
  const fetchUpvoted: FetchFn<PostCommentItem> = useCallback(
    async (page_cursor, ...rest) => {
      const response = await client.listPersonLiked(
        {
          page_cursor,
          type: "Upvoted",
          limit: LIMIT,
        },
        ...rest,
      );

      return response;
    },
    [client],
  );

  // Fetch function for Downvoted
  const fetchDownvoted: FetchFn<PostCommentItem> = useCallback(
    async (page_cursor, ...rest) => {
      const response = await client.listPersonLiked(
        {
          page_cursor,
          type: "Downvoted",
          limit: LIMIT,
        },
        ...rest,
      );

      return response;
    },
    [client],
  );

  // Get the base fetch function based on active tab
  const getBaseFetchFn = useCallback((): FetchFn<PostCommentItem> => {
    switch (activeTab) {
      case "posts":
        return fetchPosts;
      case "comments":
        return fetchComments;
      case "saved":
        return fetchSaved;
      case "upvoted":
        return fetchUpvoted;
      case "downvoted":
        return fetchDownvoted;
      case "overview":
      default:
        return fetchOverview;
    }
  }, [
    activeTab,
    fetchPosts,
    fetchComments,
    fetchSaved,
    fetchUpvoted,
    fetchDownvoted,
    fetchOverview,
  ]);

  // Wrapped fetch function with loading state management
  const getFetchFn = useCallback((): FetchFn<PostCommentItem> => {
    const baseFn = getBaseFetchFn();
    return async (page_cursor, ...rest) => {
      const result = await baseFn(page_cursor, ...rest);

      // Clear loading state after first fetch
      if (isTabLoading) {
        setIsTabLoading(false);
      }

      return result;
    };
  }, [getBaseFetchFn, isTabLoading]);

  const handleTabChange = (tab: ProfileTabType) => {
    if (tab === activeTab) return;

    // Hidden tab navigates to a separate page (uses local DB, different data source)
    if (tab === "hidden") {
      const handle = getRemoteHandle(person.person);
      router.push(buildGeneralBrowseLink(`/u/${handle}/hidden`));
      return;
    }

    // Show loading indicator for tab content
    setIsTabLoading(true);
    pendingTabRef.current = tab;
    setActiveTab(tab);
    // Increment key to force feed remount
    setFeedKey((prev) => prev + 1);
  };

  const header = (
    <MaxWidthContainer>
      {/* Profile Header with Banner, Avatar, Bio */}
      <ProfileHeader person={person} />

      {/* Horizontal Tabs */}
      <ProfileTabs
        person={person}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Mod Zone (only for self and if mod) */}
      {isSelf && role && (
        <IonList inset className={styles.modZone}>
          <IonItem detail button onClick={presentModZoneActions}>
            <IonIcon
              icon={getModIcon(role)}
              color={getModColor(role)}
              slot="start"
            />{" "}
            <IonLabel className="ion-text-nowrap">
              {getModName(role)} Zone
            </IonLabel>
          </IonItem>
        </IonList>
      )}

      {/* Inline loading indicator when switching tabs */}
      {isTabLoading && (
        <div className={styles.tabLoadingContainer}>
          <IonSpinner className={styles.tabLoadingSpinner} />
        </div>
      )}
    </MaxWidthContainer>
  );

  return (
    <PostCommentFeed
      key={feedKey}
      fetchFn={getFetchFn()}
      header={header}
      filterHiddenPosts={false}
      filterKeywordsAndWebsites={false}
      onPull={onPull}
    />
  );
}
