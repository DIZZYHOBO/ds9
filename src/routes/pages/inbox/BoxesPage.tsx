import {
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from "@ionic/react";
import {
  albumsOutline,
  chatbubbleOutline,
  ellipseOutline,
  fileTray,
  mail,
  personCircleOutline,
} from "ionicons/icons";
import { MouseEvent, use } from "react";

import { SharedDialogContext } from "#/features/auth/SharedDialogContext";
import { activeMastodonAccountSelector } from "#/features/auth/mastodon/mastodonAuthSlice";
import BoxesRedirectBootstrapper from "#/features/inbox/BoxesRedirectBootstrapper";
import { getInboxCounts } from "#/features/inbox/inboxSlice";
import MastodonInboxPage from "#/features/mastodon/pages/MastodonInboxPage";
import AppContent from "#/features/shared/AppContent";
import AppHeader from "#/features/shared/AppHeader";
import { AppPage } from "#/helpers/AppPage";
import FeedContent from "#/routes/pages/shared/FeedContent";
import { useAppDispatch, useAppSelector } from "#/store";

export default function BoxesPage() {
  const dispatch = useAppDispatch();
  const activeMastodonAccount = useAppSelector(activeMastodonAccountSelector);

  const { presentLoginIfNeeded } = use(SharedDialogContext);

  useIonViewWillEnter(() => {
    if (!activeMastodonAccount) {
      dispatch(getInboxCounts());
    }
  });

  function interceptIfLoggedOut(e: MouseEvent) {
    if (presentLoginIfNeeded()) e.preventDefault();
  }

  // Show Mastodon notifications when Mastodon account is active
  if (activeMastodonAccount) {
    return (
      <AppPage>
        <AppHeader>
          <IonToolbar>
            <IonTitle>Notifications</IonTitle>
          </IonToolbar>
        </AppHeader>
        <FeedContent>
          <MastodonInboxPage />
        </FeedContent>
      </AppPage>
    );
  }

  return (
    <>
      <BoxesRedirectBootstrapper />
      <AppPage>
        <AppHeader>
          <IonToolbar>
            <IonTitle>Boxes</IonTitle>
          </IonToolbar>
        </AppHeader>
        <AppContent scrollY fullscreen color="light-bg">
          <AppHeader collapse="condense">
            <IonToolbar>
              <IonTitle size="large">Boxes</IonTitle>
            </IonToolbar>
          </AppHeader>

          <IonList inset color="primary">
            <IonItem
              routerLink="/inbox/all"
              onClick={interceptIfLoggedOut}
              detail
            >
              <IonIcon icon={fileTray} color="primary" slot="start" />
              <IonLabel className="ion-text-nowrap">Inbox (All)</IonLabel>
            </IonItem>
            <IonItem
              routerLink="/inbox/unread"
              onClick={interceptIfLoggedOut}
              detail
            >
              <IonIcon icon={ellipseOutline} color="primary" slot="start" />
              <IonLabel className="ion-text-nowrap">Unread</IonLabel>
            </IonItem>
          </IonList>

          <IonList inset color="primary">
            <IonItem
              routerLink="/inbox/post-replies"
              onClick={interceptIfLoggedOut}
              detail
            >
              <IonIcon icon={albumsOutline} color="primary" slot="start" />
              <IonLabel className="ion-text-nowrap">Post Replies</IonLabel>
            </IonItem>
            <IonItem
              routerLink="/inbox/comment-replies"
              onClick={interceptIfLoggedOut}
              detail
            >
              <IonIcon icon={chatbubbleOutline} color="primary" slot="start" />
              <IonLabel className="ion-text-nowrap">Comment Replies</IonLabel>
            </IonItem>
            <IonItem
              routerLink="/inbox/mentions"
              onClick={interceptIfLoggedOut}
              detail
            >
              <IonIcon
                icon={personCircleOutline}
                color="primary"
                slot="start"
              />
              <IonLabel className="ion-text-nowrap">Mentions</IonLabel>
            </IonItem>
          </IonList>

          <IonList inset color="primary">
            <IonItem
              routerLink="/inbox/messages"
              onClick={interceptIfLoggedOut}
              detail
            >
              <IonIcon icon={mail} color="primary" slot="start" />
              <IonLabel className="ion-text-nowrap">Messages</IonLabel>
            </IonItem>
          </IonList>
        </AppContent>
      </AppPage>
    </>
  );
}
