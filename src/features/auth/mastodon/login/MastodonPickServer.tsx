import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonItem,
  IonList,
  IonSearchbar,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VList, VListHandle } from "virtua";

import AppHeader from "#/features/shared/AppHeader";
import { isValidHostname, stripProtocol } from "#/helpers/url";
import useAppToast from "#/helpers/useAppToast";
import { MastodonClient } from "#/services/mastodon";
import { useAppDispatch, useAppSelector } from "#/store";

import {
  fetchMastodonInstanceInfo,
  initMastodonOAuth,
} from "../mastodonAuthSlice";
import MastodonOAuthPage from "./MastodonOAuthPage";

import styles from "./MastodonPickServer.module.css";

// Popular Mastodon instances
const MASTODON_SERVERS = [
  "mastodon.social",
  "mastodon.online",
  "mstdn.social",
  "mas.to",
  "mastodon.world",
  "techhub.social",
  "universeodon.com",
  "infosec.exchange",
  "hachyderm.io",
  "fosstodon.org",
  "masto.ai",
  "toot.community",
  "c.im",
  "mastodon.art",
  "writing.exchange",
];

export default function MastodonPickServer() {
  const dispatch = useAppDispatch();
  const presentToast = useAppToast();
  const loading = useAppSelector((state) => state.mastodonAuth.loading);

  const [search, setSearch] = useState("");
  const searchHostname = stripProtocol(search.trim()).toLowerCase();

  const instances = useMemo(
    () =>
      MASTODON_SERVERS.filter((server) =>
        server.includes(searchHostname),
      ),
    [searchHostname],
  );

  const vHandle = useRef<VListHandle>(null);
  const ref = useRef<HTMLDivElement>(null);
  const searchbarRef = useRef<HTMLIonSearchbarElement>(null);

  const searchInvalid = useMemo(
    () =>
      !(
        isValidHostname(searchHostname) &&
        searchHostname.includes(".") &&
        !searchHostname.endsWith(".")
      ),
    [searchHostname],
  );

  useEffect(() => {
    vHandle.current?.scrollTo(0);
  }, [search]);

  useEffect(() => {
    setTimeout(() => {
      searchbarRef.current?.setFocus();
    }, 300);
  }, []);

  const submit = useCallback(async () => {
    if (loading) return;

    const potentialServer = searchHostname;

    if (instances[0] && search !== potentialServer) {
      setSearch(instances[0]);
      return;
    }

    try {
      // Validate the instance first
      const instanceInfo = await dispatch(fetchMastodonInstanceInfo(potentialServer));

      if (!instanceInfo) {
        presentToast({
          message: `Could not connect to "${potentialServer}". Make sure it's a valid Mastodon instance.`,
          color: "danger",
          fullscreen: true,
        });
        return;
      }

      // Initialize OAuth and get the authorization URL
      const authUrl = await dispatch(initMastodonOAuth(potentialServer));

      // Navigate to the OAuth page
      ref.current?.closest("ion-nav")?.push(() => (
        <MastodonOAuthPage
          instance={potentialServer}
          instanceInfo={instanceInfo}
          authUrl={authUrl}
        />
      ));
    } catch (error) {
      presentToast({
        message:
          error instanceof Error
            ? error.message
            : `Failed to connect to "${potentialServer}"`,
        color: "danger",
        fullscreen: true,
      });
    }
  }, [dispatch, instances, loading, presentToast, search, searchHostname]);

  return (
    <>
      <AppHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
          <IonTitle>Mastodon Login</IonTitle>
          <IonButtons slot="end">
            {loading ? (
              <IonSpinner color="medium" />
            ) : (
              <IonButton strong onClick={submit} disabled={searchInvalid}>
                Next
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </AppHeader>
      <IonContent scrollY={false} color="light-bg">
        <div className={styles.container} ref={ref}>
          <div className="ion-padding">
            <IonText color="medium">
              Enter your Mastodon server or pick from popular instances
            </IonText>
          </div>

          <IonSearchbar
            ref={searchbarRef}
            enterkeyhint="next"
            placeholder="Enter server URL (e.g., mastodon.social)"
            inputMode="url"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;

              if (
                searchInvalid &&
                instances[0] &&
                instances[0] !== searchHostname
              ) {
                setSearch(instances[0]);
                return;
              }

              if (search) return submit();

              if (!searchInvalid) {
                submit();
                return;
              }

              if (instances[0]) {
                setSearch(instances[0]);
                return;
              }

              presentToast({
                message: `"${search}" is not a valid server.`,
                color: "danger",
                fullscreen: true,
              });
            }}
            value={search}
            onIonInput={(e) => {
              setSearch(e.detail.value ?? "");
            }}
          />

          <IonList className={styles.list}>
            <VList
              data={instances}
              ref={vHandle}
              className="ion-content-scroll-host"
            >
              {(instance) => {
                return (
                  <IonItem
                    detail
                    onClick={() => {
                      setSearch(instance);
                      setTimeout(() => submit(), 0);
                    }}
                  >
                    {instance}
                  </IonItem>
                );
              }}
            </VList>
          </IonList>
        </div>
      </IonContent>
    </>
  );
}
