import {
  IonButton,
  IonButtons,
  IonIcon,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { swapHorizontalSharp } from "ionicons/icons";
import { use, useEffect } from "react";

import {
  accountsListEmptySelector,
  loggedInSelector,
  userHandleSelector,
} from "#/features/auth/authSelectors";
import { SharedDialogContext } from "#/features/auth/SharedDialogContext";
import { getSite } from "#/features/auth/siteSlice";
import {
  activeMastodonAccountSelector,
  mastodonAccountsSelector,
} from "#/features/auth/mastodon/mastodonAuthSlice";
import MastodonHomePage from "#/features/mastodon/pages/MastodonHomePage";
import AppHeader from "#/features/shared/AppHeader";
import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import DocumentTitle from "#/features/shared/DocumentTitle";
import LoggedOut from "#/features/user/LoggedOut";
import Profile from "#/features/user/Profile";
import ProfilePageActions from "#/features/user/ProfilePageActions";
import { AppPage } from "#/helpers/AppPage";
import { isIosTheme } from "#/helpers/device";
import FeedContent from "#/routes/pages/shared/FeedContent";
import { useAppDispatch, useAppSelector } from "#/store";

export default function ProfilePage() {
  const accountsListEmpty = useAppSelector(accountsListEmptySelector);
  const handle = useAppSelector(userHandleSelector);
  const connectedInstance = useAppSelector(
    (state) => state.auth.connectedInstance,
  );
  const loggedIn = useAppSelector(loggedInSelector);
  const dispatch = useAppDispatch();

  // Mastodon account state
  const mastodonAccounts = useAppSelector(mastodonAccountsSelector);
  const activeMastodonAccount = useAppSelector(activeMastodonAccountSelector);

  const { presentAccountSwitcher } = use(SharedDialogContext);

  const myPerson = useAppSelector((state) => state.site.response?.my_user);

  // Check if we should show Mastodon content
  const showMastodon = !!activeMastodonAccount;
  const hasAnyAccounts = !accountsListEmpty || mastodonAccounts.length > 0;

  const title = showMastodon
    ? `${activeMastodonAccount.account.username}@${activeMastodonAccount.instance}`
    : handle ?? connectedInstance;

  // Debug logging for ProfilePage
  useEffect(() => {
    console.log("[ProfilePage] State:", {
      handle,
      loggedIn,
      myPerson: myPerson,
      localUserView: myPerson?.local_user_view,
      person: myPerson?.local_user_view?.person,
      avatar: myPerson?.local_user_view?.person?.avatar,
      banner: myPerson?.local_user_view?.person?.banner,
      showMastodon,
      activeMastodonAccount: activeMastodonAccount?.account?.username,
    });
  }, [handle, loggedIn, myPerson, showMastodon, activeMastodonAccount]);

  function renderContent() {
    // Show Mastodon content if Mastodon account is active
    if (showMastodon) {
      return <MastodonHomePage />;
    }

    if (!handle) return <LoggedOut />;

    if (!myPerson) return <CenteredSpinner />;

    console.log("[ProfilePage] Rendering Profile with:", {
      person: myPerson.local_user_view.person,
      counts: myPerson.local_user_view.counts,
    });

    return (
      <Profile
        person={{
          person: myPerson.local_user_view.person,
          counts: myPerson.local_user_view.counts,
        }}
        onPull={() => dispatch(getSite()) satisfies Promise<void>}
      />
    );
  }

  return (
    <AppPage>
      <AppHeader>
        <IonToolbar>
          {hasAnyAccounts && (
            <IonButtons slot="secondary">
              <IonButton onClick={() => presentAccountSwitcher()}>
                {isIosTheme() ? (
                  "Accounts"
                ) : (
                  <IonIcon icon={swapHorizontalSharp} slot="icon-only" />
                )}
              </IonButton>
            </IonButtons>
          )}

          <DocumentTitle>{title}</DocumentTitle>
          <IonTitle>{title}</IonTitle>

          {loggedIn && !showMastodon && (
            <IonButtons slot="end">
              <ProfilePageActions />
            </IonButtons>
          )}
        </IonToolbar>
      </AppHeader>

      <FeedContent color="light-bg">{renderContent()}</FeedContent>
    </AppPage>
  );
}
