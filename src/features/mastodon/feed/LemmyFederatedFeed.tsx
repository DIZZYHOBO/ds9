import { useMemo } from "react";

import { FetchFn } from "#/features/feed/Feed";
import FeedContextProvider from "#/features/feed/FeedContext";
import { PageTypeContext } from "#/features/feed/PageTypeContext";
import PostCommentFeed, {
  PostCommentItem,
} from "#/features/feed/PostCommentFeed";
import { ShowHiddenPostsProvider } from "#/features/feed/postFabs/HidePostsFab";
import PostAppearanceProvider, {
  WaitUntilPostAppearanceResolved,
} from "#/features/post/appearance/PostAppearanceProvider";
import { getClient } from "#/services/client";
import { LIMIT } from "#/services/lemmy";

import styles from "./LemmyFederatedFeed.module.css";

interface LemmyFederatedFeedProps {
  instance?: string;
}

export default function LemmyFederatedFeed({
  instance = "lemmy.world",
}: LemmyFederatedFeedProps) {
  // Create anonymous Lemmy client for the specified instance
  const client = useMemo(() => {
    return getClient(instance);
  }, [instance]);

  const fetchFn: FetchFn<PostCommentItem> = async (page_cursor, signal) => {
    return client.getPosts(
      {
        page_cursor,
        limit: LIMIT,
        type_: "All",
        sort: "Hot",
      },
      signal,
    );
  };

  return (
    <ShowHiddenPostsProvider>
      <PostAppearanceProvider feed={{ listingType: "All" }}>
        <FeedContextProvider>
          <PageTypeContext value="special-feed">
            <WaitUntilPostAppearanceResolved>
              <div className={styles.instanceBanner}>
                Browsing {instance} via federation
              </div>
              <PostCommentFeed
                fetchFn={fetchFn}
                filterHiddenPosts={false}
                filterKeywordsAndWebsites={false}
              />
            </WaitUntilPostAppearanceResolved>
          </PageTypeContext>
        </FeedContextProvider>
      </PostAppearanceProvider>
    </ShowHiddenPostsProvider>
  );
}
