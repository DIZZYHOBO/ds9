import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import {
  closeOutline,
  earthOutline,
  eyeOffOutline,
  lockClosedOutline,
  mailOutline,
  imageOutline,
  warningOutline,
} from "ionicons/icons";
import { useEffect, useRef, useState } from "react";

import useAppToast from "#/helpers/useAppToast";
import { MastodonInstance, MastodonStatus } from "#/services/mastodon";
import { useAppDispatch, useAppSelector } from "#/store";

import {
  activeMastodonAccountSelector,
} from "../../auth/mastodon/mastodonAuthSlice";
import { createMastodonStatus } from "../status/mastodonStatusSlice";
import MastodonAvatar from "../shared/MastodonAvatar";

import styles from "./MastodonComposeModal.module.css";

type Visibility = "public" | "unlisted" | "private" | "direct";

interface MastodonComposeModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  replyTo?: MastodonStatus;
  onSuccess?: (status: MastodonStatus) => void;
}

const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    value: "public",
    label: "Public",
    icon: earthOutline,
    description: "Visible for all",
  },
  {
    value: "unlisted",
    label: "Unlisted",
    icon: eyeOffOutline,
    description: "Visible for all, but not in public timelines",
  },
  {
    value: "private",
    label: "Followers only",
    icon: lockClosedOutline,
    description: "Only followers can see",
  },
  {
    value: "direct",
    label: "Direct",
    icon: mailOutline,
    description: "Only mentioned users can see",
  },
];

const MAX_CHARS = 500;

export default function MastodonComposeModal({
  isOpen,
  onDismiss,
  replyTo,
  onSuccess,
}: MastodonComposeModalProps) {
  const dispatch = useAppDispatch();
  const presentToast = useAppToast();
  const activeAccount = useAppSelector(activeMastodonAccountSelector);

  const textareaRef = useRef<HTMLIonTextareaElement>(null);

  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [spoilerText, setSpoilerText] = useState("");
  const [showSpoilerInput, setShowSpoilerInput] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  const remainingChars = MAX_CHARS - content.length - spoilerText.length;
  const isOverLimit = remainingChars < 0;
  const canPost = content.trim().length > 0 && !isOverLimit && !posting;

  // Set initial content for replies
  useEffect(() => {
    if (isOpen && replyTo) {
      // Pre-populate with @mention
      const mention = `@${replyTo.account.acct} `;
      setContent(mention);
      // Match reply visibility
      if (replyTo.visibility === "private" || replyTo.visibility === "direct") {
        setVisibility(replyTo.visibility);
      }
    }
  }, [isOpen, replyTo]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.setFocus();
      }, 300);
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setContent("");
      setVisibility("public");
      setSpoilerText("");
      setShowSpoilerInput(false);
      setShowVisibilityMenu(false);
    }
  }, [isOpen]);

  const handlePost = async () => {
    if (!canPost) return;

    setPosting(true);

    try {
      const status = await dispatch(
        createMastodonStatus({
          status: content,
          visibility,
          spoiler_text: showSpoilerInput ? spoilerText : undefined,
          in_reply_to_id: replyTo?.id,
        }),
      );

      presentToast({
        message: replyTo ? "Reply posted!" : "Post published!",
        color: "success",
      });

      onSuccess?.(status);
      onDismiss();
    } catch (error) {
      presentToast({
        message: error instanceof Error ? error.message : "Failed to post",
        color: "danger",
      });
    } finally {
      setPosting(false);
    }
  };

  const selectedVisibility = VISIBILITY_OPTIONS.find((v) => v.value === visibility)!;

  if (!activeAccount) return null;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onDismiss} disabled={posting}>
              <IonIcon icon={closeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
          <IonTitle>{replyTo ? "Reply" : "New Post"}</IonTitle>
          <IonButtons slot="end">
            <IonButton
              strong
              disabled={!canPost}
              onClick={handlePost}
            >
              {posting ? <IonSpinner name="crescent" /> : "Post"}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className={styles.content}>
        <div className={styles.composeContainer}>
          <div className={styles.header}>
            <MastodonAvatar account={activeAccount.account} size="medium" />
            <div className={styles.accountInfo}>
              <span className={styles.displayName}>
                {activeAccount.account.display_name || activeAccount.account.username}
              </span>
              <span className={styles.handle}>@{activeAccount.account.acct}</span>
            </div>
          </div>

          {replyTo && (
            <div className={styles.replyIndicator}>
              Replying to @{replyTo.account.acct}
            </div>
          )}

          {showSpoilerInput && (
            <div className={styles.spoilerInput}>
              <IonTextarea
                placeholder="Content warning"
                value={spoilerText}
                onIonInput={(e) => setSpoilerText(e.detail.value || "")}
                rows={1}
                autoGrow
                className={styles.spoilerTextarea}
              />
            </div>
          )}

          <IonTextarea
            ref={textareaRef}
            placeholder={replyTo ? "Write your reply..." : "What's on your mind?"}
            value={content}
            onIonInput={(e) => setContent(e.detail.value || "")}
            rows={6}
            autoGrow
            className={styles.textarea}
          />

          <div className={styles.toolbar}>
            <div className={styles.toolbarActions}>
              <button
                className={`${styles.toolbarButton} ${showSpoilerInput ? styles.active : ""}`}
                onClick={() => setShowSpoilerInput(!showSpoilerInput)}
                title="Add content warning"
              >
                <IonIcon icon={warningOutline} />
              </button>

              <div className={styles.visibilityContainer}>
                <button
                  className={styles.toolbarButton}
                  onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
                  title="Change visibility"
                >
                  <IonIcon icon={selectedVisibility.icon} />
                </button>

                {showVisibilityMenu && (
                  <div className={styles.visibilityMenu}>
                    {VISIBILITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        className={`${styles.visibilityOption} ${
                          visibility === option.value ? styles.selected : ""
                        }`}
                        onClick={() => {
                          setVisibility(option.value);
                          setShowVisibilityMenu(false);
                        }}
                      >
                        <IonIcon icon={option.icon} />
                        <div className={styles.visibilityOptionText}>
                          <span className={styles.visibilityLabel}>
                            {option.label}
                          </span>
                          <span className={styles.visibilityDescription}>
                            {option.description}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              className={`${styles.charCounter} ${
                isOverLimit ? styles.overLimit : ""
              }`}
            >
              {remainingChars}
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
}
