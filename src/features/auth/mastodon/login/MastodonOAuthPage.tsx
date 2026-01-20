import {
  IonAvatar,
  IonBackButton,
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { use, useEffect, useRef, useState } from "react";

import { HelperText } from "#/features/settings/shared/formatting";
import AppHeader from "#/features/shared/AppHeader";
import { DynamicDismissableModalContext } from "#/features/shared/DynamicDismissableModal";
import InAppExternalLink from "#/features/shared/InAppExternalLink";
import { loginSuccess } from "#/helpers/toastMessages";
import useAppToast from "#/helpers/useAppToast";
import { VOYAGER_TERMS } from "#/helpers/voyager";
import { MastodonInstance } from "#/services/mastodon";
import { useAppDispatch, useAppSelector } from "#/store";

import { completeMastodonOAuth } from "../mastodonAuthSlice";

import styles from "./MastodonOAuthPage.module.css";

interface MastodonOAuthPageProps {
  instance: string;
  instanceInfo: MastodonInstance;
  authUrl: string;
}

export default function MastodonOAuthPage({
  instance,
  instanceInfo,
  authUrl,
}: MastodonOAuthPageProps) {
  const dispatch = useAppDispatch();
  const presentToast = useAppToast();
  const loading = useAppSelector((state) => state.mastodonAuth.loading);

  const { dismiss, setCanDismiss } = use(DynamicDismissableModalContext);

  const codeInputRef = useRef<HTMLIonInputElement>(null);
  const [code, setCode] = useState("");
  const [authOpened, setAuthOpened] = useState(false);

  useEffect(() => {
    // Auto-focus code input after a delay
    if (authOpened) {
      setTimeout(() => {
        codeInputRef.current?.setFocus();
      }, 500);
    }
  }, [authOpened]);

  async function submit() {
    if (!code.trim()) {
      presentToast({
        message: "Please enter the authorization code",
        color: "danger",
        fullscreen: true,
      });
      return;
    }

    try {
      await dispatch(completeMastodonOAuth(code.trim()));
      presentToast(loginSuccess);
      setCanDismiss(true);
      dismiss();
    } catch (error) {
      presentToast({
        message:
          error instanceof Error
            ? error.message
            : "Failed to complete authorization",
        color: "danger",
        fullscreen: true,
      });
    }
  }

  return (
    <>
      <AppHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
          <IonTitle>Authorize</IonTitle>
          <IonButtons slot="end">
            {loading ? (
              <IonSpinner />
            ) : (
              <IonButton
                strong
                onClick={submit}
                disabled={!code.trim() || !authOpened}
              >
                Done
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </AppHeader>
      <IonContent color="light-bg">
        <div className="ion-padding">
          <IonText>
            <p>
              You are logging in to{" "}
              <InAppExternalLink
                href={`https://${instance}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IonChip outline>
                  <IonAvatar>
                    <img
                      src={instanceInfo.thumbnail?.url}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </IonAvatar>
                  <IonLabel>{instance}</IonLabel>
                </IonChip>
              </InAppExternalLink>
            </p>
          </IonText>
        </div>

        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <IonText>
                <p className={styles.stepTitle}>Open authorization page</p>
                <p className={styles.stepDescription}>
                  Click the button below to authorize Voyager on your Mastodon
                  account
                </p>
              </IonText>
              <InAppExternalLink
                href={authUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setAuthOpened(true)}
              >
                <IonButton expand="block" className={styles.authButton}>
                  Authorize on {instance}
                </IonButton>
              </InAppExternalLink>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <IonText>
                <p className={styles.stepTitle}>Copy the authorization code</p>
                <p className={styles.stepDescription}>
                  After authorizing, you'll see a code. Copy it and paste it
                  below.
                </p>
              </IonText>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <IonText>
                <p className={styles.stepTitle}>Enter the code</p>
              </IonText>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <input type="submit" className="ion-hide" />
                <IonList inset className={styles.codeInputList}>
                  <IonItem>
                    <IonInput
                      ref={codeInputRef}
                      labelPlacement="stacked"
                      label="Authorization Code"
                      placeholder="Paste your code here"
                      value={code}
                      onIonInput={(e) => setCode(e.detail.value || "")}
                      enterkeyhint="done"
                      disabled={!authOpened}
                    />
                  </IonItem>
                </IonList>
              </form>
            </div>
          </div>
        </div>

        <HelperText>
          By using Voyager, you agree to the{" "}
          <InAppExternalLink
            href={VOYAGER_TERMS}
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Use
          </InAppExternalLink>
        </HelperText>
      </IonContent>
    </>
  );
}
