import {
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonRadio,
  IonReorder,
  IonText,
} from "@ionic/react";

import { RemoveItemButton } from "#/features/shared/ListEditor";
import { useAppDispatch } from "#/store";

import { MastodonAccountCredential, logoutMastodonAccount } from "./mastodonAuthSlice";

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
    <>
      {handle} <IonText color="tertiary">(Mastodon)</IonText>
    </>
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
