import {
  IonAccordion,
  IonAccordionGroup,
  IonBackButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { lockClosed, sparkles } from "ionicons/icons";

import { canShare, shareUrl } from "#/features/share/share";
import AppContent from "#/features/shared/AppContent";
import AppHeader from "#/features/shared/AppHeader";
import { IonItemInAppExternalLink } from "#/features/shared/InAppExternalLink";
import { AppPage } from "#/helpers/AppPage";
import { getShareIcon } from "#/helpers/device";

import { IconBg } from "../SettingsPage";
import AppDetails from "./AppDetails";

import styles from "./AboutPage.module.css";

/**
 * UPDATE THIS SECTION WHEN MAKING CHANGES TO THE APP
 * This is shown in the "What's new" accordion on the About page
 */
const WHATS_NEW_CONTENT = `
**January 22, 2026**
- Added Mastodon integration for seamless Lemmy/Mastodon experience
- Reply to Lemmy posts and comments from your Mastodon account
- Browse federated Lemmy content via anonymous client
- Renamed app from Voyager to Tuvix
- Fixed account switching navigation issues
`.trim();

const PRIVACY_POLICY_CONTENT = `
**Tuvix for Lemmy/Mastodon — Privacy Policy**

Last updated January 22, 2026

The Tuvix for Lemmy/Mastodon app does not collect or process any personal information from its users. The app is used to connect to third-party Lemmy/Mastodon servers that may or may not collect personal information and are not covered by this privacy policy. Each third-party Lemmy/Mastodon server comes equipped with its own privacy policy that can be viewed through that server's website.
`.trim();

export default function AboutPage() {
  return (
    <AppPage>
      <AppHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton text="Settings" defaultHref="/settings" />
          </IonButtons>

          <IonTitle>About</IonTitle>
        </IonToolbar>
      </AppHeader>
      <AppContent scrollY fullscreen color="light-bg">
        <AppDetails />

        <IonList inset color="primary">
          <IonAccordionGroup>
            <IonAccordion value="whats-new">
              <IonItem slot="header">
                <IconBg color="color(display-p3 0.7 0 1)" size="0.8" slot="start">
                  <IonIcon icon={sparkles} />
                </IconBg>
                <IonLabel>What&apos;s new</IonLabel>
              </IonItem>
              <div className={styles.accordionContent} slot="content">
                {WHATS_NEW_CONTENT.split("\n").map((line, i) => {
                  if (line.startsWith("**") && line.endsWith("**")) {
                    return (
                      <p key={i} className={styles.dateHeader}>
                        {line.replace(/\*\*/g, "")}
                      </p>
                    );
                  }
                  if (line.startsWith("- ")) {
                    return (
                      <p key={i} className={styles.listItem}>
                        • {line.slice(2)}
                      </p>
                    );
                  }
                  return line ? <p key={i}>{line}</p> : null;
                })}
              </div>
            </IonAccordion>

            <IonAccordion value="privacy">
              <IonItem slot="header">
                <IconBg color="#0e7afe" slot="start">
                  <IonIcon icon={lockClosed} />
                </IconBg>
                <IonLabel>Privacy Policy</IonLabel>
              </IonItem>
              <div className={styles.accordionContent} slot="content">
                {PRIVACY_POLICY_CONTENT.split("\n").map((line, i) => {
                  if (line.startsWith("**") && line.endsWith("**")) {
                    return (
                      <p key={i} className={styles.policyTitle}>
                        {line.replace(/\*\*/g, "")}
                      </p>
                    );
                  }
                  return line ? <p key={i}>{line}</p> : null;
                })}
              </div>
            </IonAccordion>
          </IonAccordionGroup>

          <IonItemInAppExternalLink
            href="https://tuvix.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            detail
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey) return;
              if (!canShare()) return;

              e.preventDefault();
              e.stopPropagation();

              shareUrl("https://tuvix.netlify.app");
            }}
          >
            <IconBg color="color(display-p3 0.7 0 1)" size="1" slot="start">
              <IonIcon icon={getShareIcon(true)} />
            </IconBg>
            <IonLabel>Share Tuvix</IonLabel>
          </IonItemInAppExternalLink>
        </IonList>
      </AppContent>
    </AppPage>
  );
}
