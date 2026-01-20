import { useIonActionSheet } from "@ionic/react";
import { useCallback } from "react";
import {
  bookmark,
  bookmarkOutline,
  copyOutline,
  heart,
  heartOutline,
  linkOutline,
  repeatOutline,
  shareOutline,
  trashOutline,
} from "ionicons/icons";

import useAppToast from "#/helpers/useAppToast";
import { MastodonStatus } from "#/services/mastodon";
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

export default function useMastodonStatusActions(status: MastodonStatus) {
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

    // Cancel button
    buttons.push({
      text: "Cancel",
      role: "cancel" as const,
    });

    presentActionSheet({
      buttons,
    });
  }, [
    bookmarked,
    dispatch,
    favourited,
    isOwnStatus,
    presentActionSheet,
    presentToast,
    reblogged,
    status.account.acct,
    status.account.id,
    status.content,
    status.id,
    status.url,
    status.visibility,
  ]);

  return openStatusActions;
}
