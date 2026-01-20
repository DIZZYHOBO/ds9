import {
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonRadio,
  IonReorder,
} from "@ionic/react";

import { RemoveItemButton } from "#/features/shared/ListEditor";
import MastodonAvatar from "#/features/mastodon/shared/MastodonAvatar";
import { useAppDispatch } from "#/store";

import { MastodonAccountCredential, logoutMastodonAccount } from "./mastodonAuthSlice";

import styles from "./MastodonAccount.module.css";

interface MastodonAccountProps {
  editing: boolean;
  account: MastodonAccountCredential;
  allowEdit: boolean;
}

export default function MastodonAccount({
  editing,
  account,
  allowEdit,
}: MastodonAccountProps) {
  const dispatch = useAppDispatch();
  const handle = `${account.account.username}@${account.instance}`;

  function logout() {
    dispatch(logoutMastodonAccount(handle));
  }

  const label = (
    <div className={styles.accountLabel}>
      <MastodonAvatar account={account.account} size="small" />
      <span className={styles.handle}>{handle}</span>
      <span className={styles.badge}>Mastodon</span>
    </div>
  );

  return (
    <IonItemSliding>
      {allowEdit && (
        <IonItemOptions side="end" onIonSwipe={logout}>
          <IonItemOption color="danger" expandable onClick={logout}>
            Log out
          </IonItemOption>
        </IonItemOptions>
      )}
      <IonItem>
        {editing && <RemoveItemButton />}
        {editing ? (
          <>
            <IonLabel className="ion-text-nowrap">{label}</IonLabel>
            <IonReorder slot="end" />
          </>
        ) : (
          <IonRadio value={`mastodon:${handle}`}>{label}</IonRadio>
        )}
      </IonItem>
    </IonItemSliding>
  );
}
