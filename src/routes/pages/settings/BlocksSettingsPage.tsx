import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonToolbar,
} from "@ionic/react";
import { useState } from "react";

import { userHandleSelector } from "#/features/auth/authSelectors";
import { localUserSelector } from "#/features/auth/siteSlice";
import BlockedCommunities from "#/features/settings/blocks/BlockedCommunities";
import BlockedInstances from "#/features/settings/blocks/BlockedInstances";
import BlockedUsers from "#/features/settings/blocks/BlockedUsers";
import FilteredKeywords from "#/features/settings/blocks/FilteredKeywords";
import FilteredWebsites from "#/features/settings/blocks/FilteredWebsites";
import FilterNsfw from "#/features/settings/blocks/FilterNsfw";
import MastodonBlocksSettings from "#/features/settings/blocks/MastodonBlocksSettings";
import AppContent from "#/features/shared/AppContent";
import AppHeader from "#/features/shared/AppHeader";
import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import {
  ListEditButton,
  ListEditorProvider,
} from "#/features/shared/ListEditor";
import MultilineTitle from "#/features/shared/MultilineTitle";
import { AppPage } from "#/helpers/AppPage";
import { useAppSelector } from "#/store";

type BlocksTab = "lemmy" | "mastodon";

export default function BlocksSettingsPage() {
  const [activeTab, setActiveTab] = useState<BlocksTab>("lemmy");
  const userHandle = useAppSelector(userHandleSelector);
  const localUser = useAppSelector(localUserSelector);

  const hasBlocks = useAppSelector(
    (state) =>
      state.site.response?.my_user?.community_blocks.length ||
      state.site.response?.my_user?.person_blocks.length ||
      state.site.response?.my_user?.instance_blocks.length ||
      state.settings.blocks.keywords.length,
  );

  const lemmyContent = (() => {
    if (!localUser)
      return (
        <IonContent scrollY={false} color="light-bg">
          <CenteredSpinner />
        </IonContent>
      );

    return (
      <AppContent scrollY color="light-bg">
        <FilterNsfw />
        <BlockedCommunities />
        <BlockedUsers />
        <BlockedInstances />
        <FilteredKeywords />
        <FilteredWebsites />
      </AppContent>
    );
  })();

  const content = activeTab === "lemmy" ? lemmyContent : (
    <AppContent scrollY color="light-bg">
      <MastodonBlocksSettings />
    </AppContent>
  );

  const page = (
    <AppPage>
      <AppHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/settings" text="Settings" />
          </IonButtons>

          <MultilineTitle subheader={userHandle}>
            Filters & Blocks
          </MultilineTitle>

          <IonButtons slot="end">
            {activeTab === "lemmy" && hasBlocks ? <ListEditButton /> : null}
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={activeTab}
            onIonChange={(e) => setActiveTab(e.detail.value as BlocksTab)}
          >
            <IonSegmentButton value="lemmy">Lemmy</IonSegmentButton>
            <IonSegmentButton value="mastodon">Mastodon</IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </AppHeader>

      {content}
    </AppPage>
  );

  if (activeTab === "lemmy" && hasBlocks) {
    return <ListEditorProvider>{page}</ListEditorProvider>;
  } else return page;
}
