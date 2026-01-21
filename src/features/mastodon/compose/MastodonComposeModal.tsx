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
  closeCircle,
  earthOutline,
  eyeOffOutline,
  lockClosedOutline,
  mailOutline,
  imageOutline,
  warningOutline,
} from "ionicons/icons";
import { useEffect, useMemo, useRef, useState } from "react";

import useAppToast from "#/helpers/useAppToast";
import { MastodonClient, MastodonMediaAttachment, MastodonStatus } from "#/services/mastodon";
import { useAppDispatch, useAppSelector } from "#/store";

import {
  activeMastodonAccountSelector,
} from "../../auth/mastodon/mastodonAuthSlice";
import { createMastodonStatus, editMastodonStatus } from "../status/mastodonStatusSlice";
import MastodonAvatar from "../shared/MastodonAvatar";

import styles from "./MastodonComposeModal.module.css";

type Visibility = "public" | "unlisted" | "private" | "direct";

interface MastodonComposeModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  replyTo?: MastodonStatus;
  editStatus?: MastodonStatus;
  onSuccess?: (status: MastodonStatus) => void;
}

interface UploadedMedia {
  id: string;
  previewUrl: string;
  uploading?: boolean;
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
const MAX_IMAGES = 4;

export default function MastodonComposeModal({
  isOpen,
  onDismiss,
  replyTo,
  editStatus,
  onSuccess,
}: MastodonComposeModalProps) {
  const dispatch = useAppDispatch();
  const presentToast = useAppToast();
  const activeAccount = useAppSelector(activeMastodonAccountSelector);

  const textareaRef = useRef<HTMLIonTextareaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [spoilerText, setSpoilerText] = useState("");
  const [showSpoilerInput, setShowSpoilerInput] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [uploading, setUploading] = useState(false);

  const client = useMemo(() => {
    if (!activeAccount) return null;
    return new MastodonClient(activeAccount.instance, activeAccount.accessToken);
  }, [activeAccount]);

  const remainingChars = MAX_CHARS - content.length - spoilerText.length;
  const isOverLimit = remainingChars < 0;
  const hasContent = content.trim().length > 0 || uploadedMedia.length > 0;
  const canPost = hasContent && !isOverLimit && !posting && !uploading;

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

  // Set initial content for editing
  useEffect(() => {
    if (isOpen && editStatus) {
      // Strip HTML to get plain text
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = editStatus.content;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";
      setContent(textContent);
      setVisibility(editStatus.visibility);
      if (editStatus.spoiler_text) {
        setSpoilerText(editStatus.spoiler_text);
        setShowSpoilerInput(true);
      }
      // Load existing media attachments
      if (editStatus.media_attachments.length > 0) {
        setUploadedMedia(
          editStatus.media_attachments.map((m) => ({
            id: m.id,
            previewUrl: m.preview_url,
          })),
        );
      }
    }
  }, [isOpen, editStatus]);

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
      setUploadedMedia([]);
      setUploading(false);
    }
  }, [isOpen]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !client) return;

    const remainingSlots = MAX_IMAGES - uploadedMedia.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      presentToast({
        message: `Maximum ${MAX_IMAGES} images allowed`,
        color: "warning",
      });
      return;
    }

    setUploading(true);

    for (const file of filesToUpload) {
      // Add placeholder with local preview
      const localPreview = URL.createObjectURL(file);
      const placeholderId = `uploading-${Date.now()}-${Math.random()}`;

      setUploadedMedia((prev) => [
        ...prev,
        { id: placeholderId, previewUrl: localPreview, uploading: true },
      ]);

      try {
        const media = await client.uploadMedia(file);

        // Replace placeholder with actual media
        setUploadedMedia((prev) =>
          prev.map((m) =>
            m.id === placeholderId
              ? { id: media.id, previewUrl: media.preview_url }
              : m,
          ),
        );
      } catch (error) {
        // Remove placeholder on error
        setUploadedMedia((prev) => prev.filter((m) => m.id !== placeholderId));
        URL.revokeObjectURL(localPreview);

        presentToast({
          message: error instanceof Error ? error.message : "Failed to upload image",
          color: "danger",
        });
      }
    }

    setUploading(false);
    // Reset file input
    event.target.value = "";
  };

  const handleRemoveMedia = (mediaId: string) => {
    setUploadedMedia((prev) => prev.filter((m) => m.id !== mediaId));
  };

  const handlePost = async () => {
    if (!canPost) return;

    setPosting(true);

    try {
      let status: MastodonStatus;
      const mediaIds = uploadedMedia
        .filter((m) => !m.uploading)
        .map((m) => m.id);

      if (editStatus) {
        // Editing existing status
        status = await dispatch(
          editMastodonStatus(editStatus.id, {
            status: content,
            spoiler_text: showSpoilerInput ? spoilerText : undefined,
            media_ids: mediaIds.length > 0 ? mediaIds : undefined,
          }),
        );
        presentToast({
          message: "Post updated!",
          color: "success",
        });
      } else {
        // Creating new status
        status = await dispatch(
          createMastodonStatus({
            status: content,
            visibility,
            spoiler_text: showSpoilerInput ? spoilerText : undefined,
            in_reply_to_id: replyTo?.id,
            media_ids: mediaIds.length > 0 ? mediaIds : undefined,
          }),
        );
        presentToast({
          message: replyTo ? "Reply posted!" : "Post published!",
          color: "success",
        });
      }

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
          <IonTitle>{editStatus ? "Edit Post" : replyTo ? "Reply" : "New Post"}</IonTitle>
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

          {uploadedMedia.length > 0 && (
            <div className={styles.mediaPreview}>
              {uploadedMedia.map((media) => (
                <div key={media.id} className={styles.mediaItem}>
                  <img src={media.previewUrl} alt="" />
                  {media.uploading && (
                    <div className={styles.mediaUploading}>
                      <IonSpinner name="crescent" />
                    </div>
                  )}
                  {!media.uploading && (
                    <button
                      className={styles.removeMedia}
                      onClick={() => handleRemoveMedia(media.id)}
                    >
                      <IonIcon icon={closeCircle} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className={styles.toolbar}>
            <div className={styles.toolbarActions}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className={styles.fileInput}
              />
              <button
                className={styles.toolbarButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadedMedia.length >= MAX_IMAGES || uploading}
                title="Add image"
              >
                <IonIcon icon={imageOutline} />
                {uploading && <IonSpinner name="crescent" className={styles.uploadSpinner} />}
              </button>

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
