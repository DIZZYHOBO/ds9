import { useIonActionSheet } from "@ionic/react";
import { useCallback } from "react";
import {
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
    options,
    presentActionSheet,
    presentToast,
    reblogged,
    status,
  ]);

  return openStatusActions;
}
