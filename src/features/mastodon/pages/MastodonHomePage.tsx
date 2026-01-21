import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { createOutline, personCircleOutline } from "ionicons/icons";
import { useState } from "react";

import { MastodonStatus } from "#/services/mastodon";
import { useAppSelector } from "#/store";

import {
  activeMastodonAccountSelector,
  mastodonLoggedInSelector,
} from "../../auth/mastodon/mastodonAuthSlice";
import MastodonComposeModal from "../compose/MastodonComposeModal";
import LemmyFederatedFeed from "../feed/LemmyFederatedFeed";
import MastodonFeed, { MastodonFeedType } from "../feed/MastodonFeed";
import MastodonAvatar from "../shared/MastodonAvatar";

import styles from "./MastodonHomePage.module.css";

type TimelineType = "home" | "local" | "federated" | "lemmy";

export default function MastodonHomePage() {
  const isLoggedIn = useAppSelector(mastodonLoggedInSelector);
  const activeAccount = useAppSelector(activeMastodonAccountSelector);

  const [timeline, setTimeline] = useState<TimelineType>("home");
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<MastodonStatus | undefined>(undefined);
  const [editStatus, setEditStatus] = useState<MastodonStatus | undefined>(undefined);

  const handleReply = (status: MastodonStatus) => {
    setReplyTo(status);
    setEditStatus(undefined);
    setComposeOpen(true);
  };

  const handleEdit = (status: MastodonStatus) => {
    setEditStatus(status);
    setReplyTo(undefined);
    setComposeOpen(true);
  };

  const handleComposeClose = () => {
    setComposeOpen(false);
    setReplyTo(undefined);
    setEditStatus(undefined);
  };

  if (!isLoggedIn || !activeAccount) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Mastodon</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className={styles.notLoggedIn}>
            <IonIcon icon={personCircleOutline} className={styles.notLoggedInIcon} />
            <p>Log in to your Mastodon account to see your timeline</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const getFeedType = (): MastodonFeedType => {
    switch (timeline) {
      case "home":
        return "home";
      case "local":
        return "local";
      case "federated":
        return "public";
      default:
        return "home";
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton>
              <MastodonAvatar account={activeAccount.account} size="small" />
            </IonButton>
          </IonButtons>
          <IonTitle>{activeAccount.instance}</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={timeline}
            onIonChange={(e) => setTimeline(e.detail.value as TimelineType)}
          >
            <IonSegmentButton value="home">Home</IonSegmentButton>
            <IonSegmentButton value="local">Local</IonSegmentButton>
            <IonSegmentButton value="federated">Federated</IonSegmentButton>
            <IonSegmentButton value="lemmy">Lemmy</IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {timeline === "lemmy" ? (
          <LemmyFederatedFeed />
        ) : (
          <MastodonFeed
            key={timeline}
            feedType={getFeedType()}
            onReply={handleReply}
            onEdit={handleEdit}
          />
        )}
        {timeline !== "lemmy" && (
          <IonFab slot="fixed" vertical="bottom" horizontal="end">
            <IonFabButton onClick={() => setComposeOpen(true)}>
              <IonIcon icon={createOutline} />
            </IonFabButton>
          </IonFab>
        )}
      </IonContent>

      <MastodonComposeModal
        isOpen={composeOpen}
        onDismiss={handleComposeClose}
        replyTo={replyTo}
        editStatus={editStatus}
        onSuccess={() => {
          // Could refresh feed here if needed
        }}
      />
    </IonPage>
  );
}
