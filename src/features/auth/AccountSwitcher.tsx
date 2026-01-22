import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonItemDivider,
  IonLabel,
  IonList,
  IonLoading,
  IonRadioGroup,
  IonReorderGroup,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { add } from "ionicons/icons";
import { use, useEffect, useMemo, useState } from "react";

import AppHeader from "#/features/shared/AppHeader";
import {
  ListEditButton,
  ListEditorContext,
  ListEditorProvider,
} from "#/features/shared/ListEditor";
import { AppPage } from "#/helpers/AppPage";
import { moveItem } from "#/helpers/array";
import { isPromiseResolvedByPaint } from "#/helpers/promise";
import { useOptimizedIonRouter } from "#/helpers/useOptimizedIonRouter";
import { useAppDispatch, useAppSelector } from "#/store";

import Account from "./Account";
import { loggedInAccountsSelector } from "./authSelectors";
import { setAccounts } from "./authSlice";
import MastodonAccount from "./mastodon/MastodonAccount";
import {
  mastodonAccountsSelector,
  setMastodonMode,
  switchMastodonAccount,
} from "./mastodon/mastodonAuthSlice";

type AccountSwitcherProps = {
  onDismiss: (data?: string, role?: string) => void;
  onSelectAccount: ((account: string) => Promise<void>) | void;
  showGuest?: boolean;
  activeHandle?: string;
} & (
  | {
      allowEdit?: true;
      presentLogin: () => void;
    }
  | {
      allowEdit: false;
    }
);

export default function AccountSwitcher(props: AccountSwitcherProps) {
  return (
    <ListEditorProvider>
      <AccountSwitcherContents {...props} />
    </ListEditorProvider>
  );
}

function AccountSwitcherContents({
  onDismiss,
  onSelectAccount,
  allowEdit = true,
  showGuest = true,
  activeHandle: _activeHandle,
  ...rest
}: AccountSwitcherProps) {
  // presentLogin only exists if allowEdit = false
  let presentLogin: (() => void) | undefined;
  if ("presentLogin" in rest) presentLogin = rest.presentLogin;

  const dispatch = useAppDispatch();
  const router = useOptimizedIonRouter();
  const [loading, setLoading] = useState(false);

  // Lemmy accounts
  const lemmyAccounts = useAppSelector(
    showGuest
      ? (state) => state.auth.accountData?.accounts
      : loggedInAccountsSelector,
  );

  // Mastodon accounts
  const mastodonAccounts = useAppSelector(mastodonAccountsSelector);

  const appActiveHandle = useAppSelector(
    (state) => state.auth.accountData?.activeHandle,
  );

  const mastodonActiveHandle = useAppSelector(
    (state) => state.mastodonAuth.accountData?.activeHandle,
  );

  const isMastodonMode = useAppSelector(
    (state) => state.mastodonAuth.isMastodonMode,
  );

  // Determine which account is currently active (Lemmy or Mastodon)
  // Mastodon handles need the "mastodon:" prefix for the radio group
  const getInitialSelectedAccount = () => {
    if (_activeHandle) return _activeHandle;
    // Check if we're in Mastodon mode first
    if (isMastodonMode && mastodonActiveHandle) {
      return `mastodon:${mastodonActiveHandle}`;
    }
    if (appActiveHandle) return appActiveHandle;
    if (mastodonActiveHandle) return `mastodon:${mastodonActiveHandle}`;
    return undefined;
  };

  const [selectedAccount, setSelectedAccount] = useState(getInitialSelectedAccount);

  const { editing } = use(ListEditorContext);

  useEffect(() => {
    if (_activeHandle) {
      setSelectedAccount(_activeHandle);
    } else if (isMastodonMode && mastodonActiveHandle) {
      setSelectedAccount(`mastodon:${mastodonActiveHandle}`);
    } else if (appActiveHandle) {
      setSelectedAccount(appActiveHandle);
    } else if (mastodonActiveHandle) {
      setSelectedAccount(`mastodon:${mastodonActiveHandle}`);
    }
  }, [_activeHandle, appActiveHandle, mastodonActiveHandle, isMastodonMode]);

  const hasAnyAccounts = useMemo(
    () => (lemmyAccounts?.length ?? 0) > 0 || mastodonAccounts.length > 0,
    [lemmyAccounts?.length, mastodonAccounts.length],
  );

  useEffect(() => {
    if (hasAnyAccounts) return;

    onDismiss();
  }, [hasAnyAccounts, onDismiss]);

  const handleAccountSelect = async (value: string) => {
    console.log("[AccountSwitcher] Selected account:", value);
    const old = selectedAccount;
    setSelectedAccount(value);

    // Check if it's a Mastodon account (prefixed with "mastodon:")
    if (value.startsWith("mastodon:")) {
      const mastodonHandle = value.replace("mastodon:", "");
      console.log("[AccountSwitcher] Switching to Mastodon account:", mastodonHandle);
      dispatch(switchMastodonAccount(mastodonHandle));
      onDismiss();
      // Navigate to posts tab to ensure clean routing state
      requestAnimationFrame(() => {
        router.push("/posts", "root", "replace");
      });
      return;
    }

    // Otherwise, it's a Lemmy account - disable Mastodon mode
    console.log("[AccountSwitcher] Switching to Lemmy account:", value);
    dispatch(setMastodonMode(false));
    // Navigate to posts tab to ensure clean routing state
    requestAnimationFrame(() => {
      router.push("/posts", "root", "replace");
    });

    const selectionChangePromise = onSelectAccount?.(value);

    // Bail on rendering the loading indicator
    if (
      !selectionChangePromise ||
      (await isPromiseResolvedByPaint(selectionChangePromise))
    ) {
      onDismiss();
      return;
    }

    setLoading(true);

    try {
      await selectionChangePromise;
    } catch (error) {
      setSelectedAccount(old);
      throw error;
    } finally {
      setLoading(false);
    }

    onDismiss();
  };

  const lemmyAccountEls = lemmyAccounts?.map((account) => (
    <Account
      key={account.handle}
      account={account}
      editing={editing}
      allowEdit={allowEdit}
    />
  ));

  const mastodonAccountEls = mastodonAccounts.map((account) => {
    const mastodonValue = `mastodon:${account.account.username}@${account.instance}`;
    console.log("[AccountSwitcher] Rendering Mastodon account with value:", mastodonValue);
    return (
      <MastodonAccount
        key={mastodonValue}
        account={account}
        editing={editing}
        allowEdit={allowEdit}
      />
    );
  });

  return (
    <AppPage>
      <IonLoading isOpen={loading} />
      <AppHeader>
        <IonToolbar>
          <IonButtons slot="start">
            {editing ? (
              <IonButton onClick={() => presentLogin?.()}>
                <IonIcon icon={add} />
              </IonButton>
            ) : (
              <IonButton onClick={() => onDismiss()}>Cancel</IonButton>
            )}
          </IonButtons>
          <IonTitle>Accounts</IonTitle>
          {allowEdit && (
            <IonButtons slot="end">
              <ListEditButton />
            </IonButtons>
          )}
        </IonToolbar>
      </AppHeader>
      <IonContent color="light-bg">
        {!editing ? (
          <IonRadioGroup
            value={selectedAccount}
            onIonChange={(e) => {
              console.log("[AccountSwitcher] IonRadioGroup onChange:", e.target.value);
              handleAccountSelect(e.target.value);
            }}
          >
            <IonList>
              {lemmyAccounts && lemmyAccounts.length > 0 && (
                <>
                  {mastodonAccounts.length > 0 && (
                    <IonItemDivider>
                      <IonLabel>Lemmy</IonLabel>
                    </IonItemDivider>
                  )}
                  {lemmyAccountEls}
                </>
              )}
              {mastodonAccounts.length > 0 && (
                <>
                  <IonItemDivider>
                    <IonLabel>Mastodon</IonLabel>
                  </IonItemDivider>
                  {mastodonAccountEls}
                </>
              )}
            </IonList>
          </IonRadioGroup>
        ) : (
          <IonList>
            {lemmyAccounts && lemmyAccounts.length > 0 && (
              <>
                {mastodonAccounts.length > 0 && (
                  <IonItemDivider>
                    <IonLabel>Lemmy</IonLabel>
                  </IonItemDivider>
                )}
                <IonReorderGroup
                  onIonItemReorder={(event) => {
                    if (lemmyAccounts)
                      dispatch(
                        setAccounts(
                          moveItem(lemmyAccounts, event.detail.from, event.detail.to),
                        ),
                      );

                    event.detail.complete();
                  }}
                  disabled={false}
                >
                  {lemmyAccountEls}
                </IonReorderGroup>
              </>
            )}
            {mastodonAccounts.length > 0 && (
              <>
                <IonItemDivider>
                  <IonLabel>Mastodon</IonLabel>
                </IonItemDivider>
                {mastodonAccountEls}
              </>
            )}
          </IonList>
        )}
      </IonContent>
    </AppPage>
  );
}
