import {
  IonBackButton,
  IonButtons,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useState } from "react";

import GeneralSettings from "#/features/settings/general/GeneralSettings";
import MastodonGeneralSettings from "#/features/settings/general/MastodonGeneralSettings";
import AppContent from "#/features/shared/AppContent";
import AppHeader from "#/features/shared/AppHeader";
import { AppPage } from "#/helpers/AppPage";

type SettingsTab = "lemmy" | "mastodon";

export default function GeneralPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("lemmy");

  return (
    <AppPage>
      <AppHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/settings" text="Settings" />
          </IonButtons>

          <IonTitle>General</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={activeTab}
            onIonChange={(e) => setActiveTab(e.detail.value as SettingsTab)}
          >
            <IonSegmentButton value="lemmy">Lemmy</IonSegmentButton>
            <IonSegmentButton value="mastodon">Mastodon</IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </AppHeader>
      <AppContent scrollY color="light-bg">
        {activeTab === "lemmy" ? <GeneralSettings /> : <MastodonGeneralSettings />}
      </AppContent>
    </AppPage>
  );
}
