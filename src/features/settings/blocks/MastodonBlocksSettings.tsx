import {
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonToggle,
} from "@ionic/react";

/**
 * Mastodon-specific blocks and filters settings
 */
export default function MastodonBlocksSettings() {
  return (
    <>
      <MastodonContentFilters />
      <MastodonBlockedAccounts />
      <MastodonMutedAccounts />
      <MastodonBlockedDomains />
    </>
  );
}

function MastodonContentFilters() {
  return (
    <>
      <IonListHeader>
        <IonLabel>Content Filters</IonLabel>
      </IonListHeader>
      <IonList inset>
        <IonItem>
          <IonLabel>
            <h3>Hide Sensitive Content</h3>
            <p>Hide posts marked as sensitive</p>
          </IonLabel>
          <IonToggle slot="end" />
        </IonItem>
        <IonItem>
          <IonLabel>
            <h3>Filter Specific Words</h3>
            <p>Hide posts containing specific words or phrases</p>
          </IonLabel>
        </IonItem>
      </IonList>
    </>
  );
}

function MastodonBlockedAccounts() {
  return (
    <>
      <IonListHeader>
        <IonLabel>Blocked Accounts</IonLabel>
      </IonListHeader>
      <IonList inset>
        <IonItem>
          <IonLabel color="medium">
            <p>Blocked accounts cannot follow you, see your posts, or interact with you.</p>
          </IonLabel>
        </IonItem>
        <IonItem button detail>
          <IonLabel>Manage Blocked Accounts</IonLabel>
        </IonItem>
      </IonList>
    </>
  );
}

function MastodonMutedAccounts() {
  return (
    <>
      <IonListHeader>
        <IonLabel>Muted Accounts</IonLabel>
      </IonListHeader>
      <IonList inset>
        <IonItem>
          <IonLabel color="medium">
            <p>Muted accounts won't appear in your timeline, but can still follow and interact with you.</p>
          </IonLabel>
        </IonItem>
        <IonItem button detail>
          <IonLabel>Manage Muted Accounts</IonLabel>
        </IonItem>
      </IonList>
    </>
  );
}

function MastodonBlockedDomains() {
  return (
    <>
      <IonListHeader>
        <IonLabel>Blocked Domains</IonLabel>
      </IonListHeader>
      <IonList inset>
        <IonItem>
          <IonLabel color="medium">
            <p>Block entire instances from appearing in your timelines.</p>
          </IonLabel>
        </IonItem>
        <IonItem button detail>
          <IonLabel>Manage Blocked Domains</IonLabel>
        </IonItem>
      </IonList>
    </>
  );
}
