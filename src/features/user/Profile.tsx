import { IonIcon, IonItem, IonLabel, IonList } from "@ionic/react";
import { ComponentProps, useState } from "react";
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
  const router = useOptimizedIonRouter();
  const buildGeneralBrowseLink = useBuildGeneralBrowseLink();

  const isSelf = getRemoteHandle(person.person) === myHandle;

  // Fetch function for Overview (posts + comments mixed)
  const fetchOverview: FetchFn<PostCommentItem> = async (
    page_cursor,
    ...rest
  ) => {
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
  };

  // Fetch function for Posts only
  const fetchPosts: FetchFn<PostCommentItem> = async (page_cursor, ...rest) => {
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
  };

  // Fetch function for Comments only
  const fetchComments: FetchFn<PostCommentItem> = async (
    page_cursor,
    ...rest
  ) => {
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
  };

  // Fetch function for Saved
  const fetchSaved: FetchFn<PostCommentItem> = async (page_cursor, ...rest) => {
    const response = await client.listPersonSaved(
      {
        page_cursor,
        person_id: person.person.id,
        limit: LIMIT,
      },
      ...rest,
    );

    return response;
  };

  // Fetch function for Upvoted
  const fetchUpvoted: FetchFn<PostCommentItem> = async (
    page_cursor,
    ...rest
  ) => {
    const response = await client.listPersonLiked(
      {
        page_cursor,
        type: "Upvoted",
        limit: LIMIT,
      },
      ...rest,
    );

    return response;
  };

  // Fetch function for Downvoted
  const fetchDownvoted: FetchFn<PostCommentItem> = async (
    page_cursor,
    ...rest
  ) => {
    const response = await client.listPersonLiked(
      {
        page_cursor,
        type: "Downvoted",
        limit: LIMIT,
      },
      ...rest,
    );

    return response;
  };

  // Get the appropriate fetch function based on active tab
  const getFetchFn = (): FetchFn<PostCommentItem> => {
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
  };

  const handleTabChange = (tab: ProfileTabType) => {
    // Hidden tab navigates to a separate page (uses local DB, different data source)
    if (tab === "hidden") {
      const handle = getRemoteHandle(person.person);
      router.push(buildGeneralBrowseLink(`/u/${handle}/hidden`));
      return;
    }

    setActiveTab(tab);
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
    </MaxWidthContainer>
  );

  return (
    <PostCommentFeed
      key={activeTab} // Force re-mount when tab changes to reset feed state
      fetchFn={getFetchFn()}
      header={header}
      filterHiddenPosts={false}
      filterKeywordsAndWebsites={false}
      onPull={onPull}
    />
  );
}
