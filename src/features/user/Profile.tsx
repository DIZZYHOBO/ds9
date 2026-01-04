import { IonIcon, IonItem, IonLabel, IonList } from "@ionic/react";
import { ComponentProps, useEffect, useState } from "react";
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
import { getHandle, getRemoteHandle, isPost } from "#/helpers/lemmy";
import { useBuildGeneralBrowseLink } from "#/helpers/routes";
import { useMode } from "#/helpers/threadiverse";
import useClient from "#/helpers/useClient";
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
  const buildGeneralBrowseLink = useBuildGeneralBrowseLink();
  const mode = useMode();
  const client = useClient();
  const myHandle = useAppSelector(userHandleSelector);
  const { present: presentModZoneActions, role } = useModZoneActions({
    type: "ModeratorView",
  });
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<ProfileTabType>("overview");

  const isSelf = getRemoteHandle(person.person) === myHandle;

  // Debug logging
  useEffect(() => {
    console.log("[Profile] Component mounted with person:", {
      person: person.person,
      counts: person.counts,
      isSelf,
    });
  }, [person, isSelf]);

  const fetchFn: FetchFn<PostCommentItem> = async (page_cursor, ...rest) => {
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

  const handleTabChange = (tab: ProfileTabType) => {
    if (tab === "overview") {
      setActiveTab("overview");
      return;
    }

    // For other tabs, navigate to dedicated pages
    const handle = getHandle(person.person);
    const routes: Record<ProfileTabType, string> = {
      overview: `/u/${handle}`,
      posts: `/u/${handle}/posts`,
      comments: `/u/${handle}/comments`,
      saved: `/u/${handle}/saved`,
      upvoted: `/u/${handle}/upvoted`,
      downvoted: `/u/${handle}/downvoted`,
      hidden: `/u/${handle}/hidden`,
    };

    window.location.href = buildGeneralBrowseLink(routes[tab]);
  };

  const header = (
    <MaxWidthContainer>
      {/* New Profile Header with Banner, Avatar, Bio */}
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
      fetchFn={fetchFn}
      header={header}
      filterHiddenPosts={false}
      filterKeywordsAndWebsites={false}
      onPull={onPull}
    />
  );
}
