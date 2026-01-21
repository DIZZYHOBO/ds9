import {
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonToolbar,
} from "@ionic/react";
import { atOutline, chatbubbleOutline, pricetagOutline } from "ionicons/icons";
import { createRef, useCallback, useMemo, useState } from "react";

import { CenteredSpinner } from "#/features/shared/CenteredSpinner";
import { useOptimizedIonRouter } from "#/helpers/useOptimizedIonRouter";
import { MastodonAccount, MastodonClient, MastodonStatus } from "#/services/mastodon";
import { useAppSelector } from "#/store";

import { activeMastodonAccountSelector } from "../../auth/mastodon/mastodonAuthSlice";
import MastodonStatusItem from "../status/MastodonStatusItem";

import styles from "./MastodonSearchPage.module.css";

type SearchType = "accounts" | "statuses" | "hashtags";

interface SearchResults {
  accounts: MastodonAccount[];
  statuses: MastodonStatus[];
  hashtags: { name: string; url: string; history?: { uses: string }[] }[];
}

export default function MastodonSearchPage() {
  const router = useOptimizedIonRouter();
  const activeAccount = useAppSelector(activeMastodonAccountSelector);
  const [search, setSearch] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("accounts");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchBarRef = createRef<HTMLIonSearchbarElement>();

  const client = useMemo(() => {
    if (!activeAccount) return null;
    return new MastodonClient(activeAccount.instance, activeAccount.accessToken);
  }, [activeAccount]);

  const performSearch = useCallback(
    async (query: string) => {
      if (!client || !query.trim()) {
        setResults(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchResults = await client.search(query.trim(), {
          type: searchType === "hashtags" ? "hashtags" : searchType,
          limit: 20,
        });
        setResults(searchResults);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [client, searchType],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    const el = await searchBarRef.current?.getInputElement();
    el?.blur();
    performSearch(search);
  };

  const handleAccountClick = (account: MastodonAccount) => {
    // Navigate to user profile (could create a MastodonUserPage later)
    router.push(`/posts/mastodon/user/${account.id}`);
  };

  const handleHashtagClick = (tag: string) => {
    // Search for posts with this hashtag
    setSearch(`#${tag}`);
    setSearchType("statuses");
    performSearch(`#${tag}`);
  };

  const renderEmptyState = () => (
    <div className={styles.emptyState}>
      <p>Search for accounts, posts, or hashtags</p>
    </div>
  );

  const renderResults = () => {
    if (!results) return renderEmptyState();

    switch (searchType) {
      case "accounts":
        if (results.accounts.length === 0) {
          return (
            <div className={styles.noResults}>
              <p>No accounts found</p>
            </div>
          );
        }
        return (
          <IonList>
            {results.accounts.map((account) => (
              <IonItem
                key={account.id}
                button
                detail
                onClick={() => handleAccountClick(account)}
              >
                <img
                  src={account.avatar}
                  alt=""
                  className={styles.avatar}
                  slot="start"
                />
                <IonLabel>
                  <h2>{account.display_name || account.username}</h2>
                  <p>@{account.acct}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        );

      case "statuses":
        if (results.statuses.length === 0) {
          return (
            <div className={styles.noResults}>
              <p>No posts found</p>
            </div>
          );
        }
        return (
          <div className={styles.statusList}>
            {results.statuses.map((status) => (
              <MastodonStatusItem key={status.id} status={status} />
            ))}
          </div>
        );

      case "hashtags":
        if (results.hashtags.length === 0) {
          return (
            <div className={styles.noResults}>
              <p>No hashtags found</p>
            </div>
          );
        }
        return (
          <IonList>
            {results.hashtags.map((tag) => (
              <IonItem
                key={tag.name}
                button
                detail
                onClick={() => handleHashtagClick(tag.name)}
              >
                <IonIcon icon={pricetagOutline} slot="start" color="primary" />
                <IonLabel>
                  <h2>#{tag.name}</h2>
                  {tag.history && tag.history.length > 0 && (
                    <p>{tag.history[0].uses} posts today</p>
                  )}
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        );
    }
  };

  if (!activeAccount) {
    return (
      <div className={styles.notLoggedIn}>
        <p>Not logged in to Mastodon</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        <IonSearchbar
          ref={searchBarRef}
          placeholder="Search Mastodon"
          autocapitalize="on"
          showCancelButton={search ? "always" : "focus"}
          showClearButton={search ? "always" : "never"}
          className={styles.searchbar}
          value={search}
          onIonInput={(e) => setSearch(e.detail.value ?? "")}
          enterkeyhint="search"
        />
      </form>

      <IonToolbar className={styles.segmentToolbar}>
        <IonSegment
          value={searchType}
          onIonChange={(e) => {
            const newType = e.detail.value as SearchType;
            setSearchType(newType);
            if (search.trim()) {
              performSearch(search);
            }
          }}
        >
          <IonSegmentButton value="accounts">
            <IonIcon icon={atOutline} />
            <IonLabel>Accounts</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="statuses">
            <IonIcon icon={chatbubbleOutline} />
            <IonLabel>Posts</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="hashtags">
            <IonIcon icon={pricetagOutline} />
            <IonLabel>Tags</IonLabel>
          </IonSegmentButton>
        </IonSegment>
      </IonToolbar>

      <div className={styles.resultsContainer}>
        {loading ? (
          <CenteredSpinner />
        ) : error ? (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        ) : (
          renderResults()
        )}
      </div>
    </div>
  );
}
