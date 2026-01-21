import {
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonToggle,
} from "@ionic/react";

import { useAppDispatch, useAppSelector } from "#/store";

/**
 * Mastodon-specific general settings
 * Adapted from Lemmy settings to suit Mastodon's features
 */
export default function MastodonGeneralSettings() {
  return (
    <>
      <MastodonPostsSettings />
      <MastodonTimelineSettings />
      <MastodonMediaSettings />
      <MastodonOtherSettings />
    </>
  );
}

function MastodonPostsSettings() {
  return (
    <>
      <IonListHeader>
        <IonLabel>Posts</IonLabel>
      </IonListHeader>
      <IonList inset>
        <IonItem>
          <IonLabel>
            <h3>Show Boosts</h3>
            <p>Show boosted posts in your timeline</p>
          </IonLabel>
          <IonToggle checked slot="end" />
        </IonItem>
        <IonItem>
          <IonLabel>
            <h3>Show Replies</h3>
            <p>Show replies in your timeline</p>
          </IonLabel>
          <IonToggle checked slot="end" />
        </IonItem>
        <IonItem>
          <IonLabel>
            <h3>Expand Content Warnings</h3>
            <p>Automatically expand posts with content warnings</p>
          </IonLabel>
          <IonToggle slot="end" />
        </IonItem>
      </IonList>
    </>
  );
}

function MastodonTimelineSettings() {
  return (
    <>
      <IonListHeader>
        <IonLabel>Timeline</IonLabel>
      </IonListHeader>
      <IonList inset>
        <IonItem>
          <IonLabel>
            <h3>Default Timeline</h3>
            <p>Choose your default timeline view</p>
          </IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>
            <h3>Auto-refresh Timeline</h3>
            <p>Automatically load new posts</p>
          </IonLabel>
          <IonToggle slot="end" />
        </IonItem>
      </IonList>
    </>
  );
}

function MastodonMediaSettings() {
  return (
    <>
      <IonListHeader>
        <IonLabel>Media</IonLabel>
      </IonListHeader>
      <IonList inset>
        <IonItem>
          <IonLabel>
            <h3>Auto-play GIFs</h3>
            <p>Automatically play animated GIFs</p>
          </IonLabel>
          <IonToggle checked slot="end" />
        </IonItem>
        <IonItem>
          <IonLabel>
            <h3>Auto-play Videos</h3>
            <p>Automatically play videos in feed</p>
          </IonLabel>
          <IonToggle slot="end" />
        </IonItem>
        <IonItem>
          <IonLabel>
            <h3>Hide Sensitive Media</h3>
            <p>Blur media marked as sensitive</p>
          </IonLabel>
          <IonToggle checked slot="end" />
        </IonItem>
      </IonList>
    </>
  );
}

function MastodonOtherSettings() {
  return (
    <>
      <IonListHeader>
        <IonLabel>Other</IonLabel>
      </IonListHeader>
      <IonList inset>
        <IonItem>
          <IonLabel>
            <h3>Default Post Visibility</h3>
            <p>Choose the default visibility for new posts</p>
          </IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>
            <h3>Confirm Before Boosting</h3>
            <p>Show confirmation dialog before boosting</p>
          </IonLabel>
          <IonToggle slot="end" />
        </IonItem>
        <IonItem>
          <IonLabel>
            <h3>Confirm Before Favouriting</h3>
            <p>Show confirmation dialog before favouriting</p>
          </IonLabel>
          <IonToggle slot="end" />
        </IonItem>
      </IonList>
    </>
  );
}
