import { useIonActionSheet } from "@ionic/react";
import { useCallback, useMemo } from "react";
import {
  addCircleOutline,
  banOutline,
  bookmark,
  bookmarkOutline,
  chatbubbleOutline,
  copyOutline,
  createOutline,
  heart,
  heartOutline,
  linkOutline,
  repeatOutline,
  shareOutline,
  trashOutline,
} from "ionicons/icons";

import useAppToast from "#/helpers/useAppToast";
import { getClient } from "#/services/client";
import { MastodonClient, MastodonStatus } from "#/services/mastodon";
import { useAppDispatch, useAppSelector } from "#/store";

import { activeMastodonAccountSelector } from "../../auth/mastodon/mastodonAuthSlice";
import {
  deleteMastodonStatus,
  mastodonBookmarkedSelector,
  mastodonFavouritedSelector,
  mastodonRebloggedSelector,
  toggleBookmarkMastodonStatus,
  toggleFavouriteMastodonStatus,
  toggleReblogMastodonStatus,
} from "./mastodonStatusSlice";

interface StatusActionsOptions {
  onReply?: (status: MastodonStatus) => void;
  onEdit?: (status: MastodonStatus) => void;
}

// Known Lemmy-compatible instance patterns
const LEMMY_POST_URL_PATTERN = /^https?:\/\/([^/]+)\/post\/(\d+)/;

/**
 * Detects if a status URL is from a Lemmy instance and extracts the instance and post ID
 */
function parseLemmyPostUrl(url: string | undefined): { instance: string; postId: number } | null {
  if (!url) return null;
  const match = url.match(LEMMY_POST_URL_PATTERN);
  if (match) {
    return { instance: match[1]!, postId: parseInt(match[2]!, 10) };
  }
  return null;
}

export default function useMastodonStatusActions(
  status: MastodonStatus,
  options?: StatusActionsOptions,
) {
  const dispatch = useAppDispatch();
  const [presentActionSheet] = useIonActionSheet();
  const presentToast = useAppToast();

  const activeAccount = useAppSelector(activeMastodonAccountSelector);

  const isFavourited = useAppSelector(mastodonFavouritedSelector(status.id));
  const isReblogged = useAppSelector(mastodonRebloggedSelector(status.id));
  const isBookmarked = useAppSelector(mastodonBookmarkedSelector(status.id));

  // Detect if this is a Lemmy post
  const lemmyPostInfo = useMemo(() => parseLemmyPostUrl(status.url), [status.url]);

  // Mastodon client for subscribing
  const mastodonClient = useMemo(() => {
    if (!activeAccount) return null;
    return new MastodonClient(activeAccount.instance, activeAccount.accessToken);
  }, [activeAccount]);

  const favourited = isFavourited ?? status.favourited;
  const reblogged = isReblogged ?? status.reblogged;
  const bookmarked = isBookmarked ?? status.bookmarked;

  const isOwnStatus = activeAccount?.account.id === status.account.id;

  const openStatusActions = useCallback(() => {
    const buttons = [];

    // Reply action
    if (options?.onReply) {
      buttons.push({
        text: "Reply",
        icon: chatbubbleOutline,
        handler: () => {
          options.onReply!(status);
        },
      });
    }

    // Edit action (only for own posts)
    if (isOwnStatus && options?.onEdit) {
      buttons.push({
        text: "Edit",
        icon: createOutline,
        handler: () => {
          options.onEdit!(status);
        },
      });
    }

    // Favourite action
    buttons.push({
      text: favourited ? "Unfavourite" : "Favourite",
      icon: favourited ? heart : heartOutline,
      handler: () => {
        dispatch(toggleFavouriteMastodonStatus(status.id));
      },
    });

    // Boost action (only for public/unlisted posts)
    if (status.visibility === "public" || status.visibility === "unlisted") {
      buttons.push({
        text: reblogged ? "Unboost" : "Boost",
        icon: repeatOutline,
        handler: () => {
          dispatch(toggleReblogMastodonStatus(status.id));
        },
      });
    }

    // Bookmark action
    buttons.push({
      text: bookmarked ? "Remove Bookmark" : "Bookmark",
      icon: bookmarked ? bookmark : bookmarkOutline,
      handler: () => {
        dispatch(toggleBookmarkMastodonStatus(status.id));
      },
    });

    // Share action
    if (status.url) {
      buttons.push({
        text: "Share",
        icon: shareOutline,
        handler: () => {
          if (navigator.share) {
            navigator.share({
              title: `Post by @${status.account.acct}`,
              url: status.url!,
            });
          } else {
            navigator.clipboard.writeText(status.url!);
            presentToast({
              message: "Link copied to clipboard",
              color: "success",
            });
          }
        },
      });
    }

    // Copy link
    if (status.url) {
      buttons.push({
        text: "Copy Link",
        icon: linkOutline,
        handler: () => {
          navigator.clipboard.writeText(status.url!);
          presentToast({
            message: "Link copied to clipboard",
            color: "success",
          });
        },
      });
    }

    // Copy text
    if (status.content) {
      buttons.push({
        text: "Copy Text",
        icon: copyOutline,
        handler: () => {
          // Strip HTML tags from content
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = status.content;
          const textContent = tempDiv.textContent || tempDiv.innerText || "";
          navigator.clipboard.writeText(textContent);
          presentToast({
            message: "Text copied to clipboard",
            color: "success",
          });
        },
      });
    }

    // Delete action (only for own posts)
    if (isOwnStatus) {
      buttons.push({
        text: "Delete",
        icon: trashOutline,
        role: "destructive" as const,
        handler: () => {
          presentActionSheet({
            header: "Are you sure you want to delete this post?",
            buttons: [
              {
                text: "Delete",
                role: "destructive",
                handler: () => {
                  dispatch(deleteMastodonStatus(status.id))
                    .then(() => {
                      presentToast({
                        message: "Post deleted",
                        color: "success",
                      });
                    })
                    .catch(() => {
                      presentToast({
                        message: "Failed to delete post",
                        color: "danger",
                      });
                    });
                },
              },
              {
                text: "Cancel",
                role: "cancel",
              },
            ],
          });
        },
      });
    }

    // Block user action (not for own posts)
    if (!isOwnStatus && activeAccount) {
      buttons.push({
        text: `Block @${status.account.acct}`,
        icon: banOutline,
        role: "destructive" as const,
        handler: () => {
          presentActionSheet({
            header: `Block @${status.account.acct}?`,
            subHeader: "They won't be able to follow you or see your posts.",
            buttons: [
              {
                text: "Block",
                role: "destructive",
                handler: async () => {
                  try {
                    const client = new MastodonClient(
                      activeAccount.instance,
                      activeAccount.accessToken,
                    );
                    await client.blockAccount(status.account.id);
                    presentToast({
                      message: `Blocked @${status.account.acct}`,
                      color: "success",
                    });
                  } catch {
                    presentToast({
                      message: "Failed to block user",
                      color: "danger",
                    });
                  }
                },
              },
              {
                text: "Cancel",
                role: "cancel",
              },
            ],
          });
        },
      });
    }

    // Subscribe to community action (only for Lemmy posts)
    if (lemmyPostInfo && mastodonClient) {
      buttons.push({
        text: "Subscribe to Community",
        icon: addCircleOutline,
        handler: async () => {
          try {
            // Fetch the post from Lemmy to get community info
            const lemmyClient = getClient(lemmyPostInfo.instance);
            const postResponse = await lemmyClient.getPost({ id: lemmyPostInfo.postId });
            const community = postResponse.post_view.community;

            // Search for the community on Mastodon
            const searchResult = await mastodonClient.search(
              community.actor_id,
              { type: "accounts", resolve: true, limit: 1 }
            );

            if (searchResult.accounts.length === 0) {
              presentToast({
                message: "Could not find community on your Mastodon instance",
                color: "warning",
              });
              return;
            }

            const account = searchResult.accounts[0]!;

            // Check if already following
            const relationships = await mastodonClient.getRelationships([account.id]);
            const isFollowing = relationships.length > 0 && relationships[0]!.following;

            if (isFollowing) {
              // Already subscribed, offer to unsubscribe
              presentActionSheet({
                header: `Already subscribed to ${community.name}`,
                buttons: [
                  {
                    text: "Unsubscribe",
                    role: "destructive",
                    handler: async () => {
                      try {
                        await mastodonClient.unfollowAccount(account.id);
                        presentToast({
                          message: `Unsubscribed from ${community.name}`,
                          color: "success",
                        });
                      } catch {
                        presentToast({
                          message: "Failed to unsubscribe",
                          color: "danger",
                        });
                      }
                    },
                  },
                  {
                    text: "Cancel",
                    role: "cancel",
                  },
                ],
              });
            } else {
              // Subscribe
              await mastodonClient.followAccount(account.id);
              presentToast({
                message: `Subscribed to ${community.name}`,
                color: "success",
              });
            }
          } catch (error) {
            presentToast({
              message: error instanceof Error ? error.message : "Failed to subscribe",
              color: "danger",
            });
          }
        },
      });
    }

    // Cancel button
    buttons.push({
      text: "Cancel",
      role: "cancel" as const,
    });

    presentActionSheet({
      buttons,
    });
  }, [
    activeAccount,
    bookmarked,
    dispatch,
    favourited,
    isOwnStatus,
    lemmyPostInfo,
    mastodonClient,
    options,
    presentActionSheet,
    presentToast,
    reblogged,
    status,
  ]);

  return openStatusActions;
}
