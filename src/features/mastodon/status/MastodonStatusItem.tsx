import { IonItem } from "@ionic/react";
import { memo, useCallback } from "react";
import { useLongPress } from "use-long-press";

import { cx } from "#/helpers/css";
import { isTouchDevice } from "#/helpers/device";
import { filterEvents } from "#/helpers/longPress";
import { stopIonicTapClick } from "#/helpers/ionic";
import { useOptimizedIonRouter } from "#/helpers/useOptimizedIonRouter";
import { MastodonStatus } from "#/services/mastodon";

import MastodonStatusContent from "./MastodonStatusContent";
import useMastodonStatusActions from "./useMastodonStatusActions";

import styles from "./MastodonStatusItem.module.css";

export interface MastodonStatusItemProps {
  status: MastodonStatus;
  className?: string;
  onClick?: (status: MastodonStatus) => void;
  disableNavigation?: boolean;
  onReply?: (status: MastodonStatus) => void;
  onEdit?: (status: MastodonStatus) => void;
}

function MastodonStatusItem({
  status,
  className,
  onClick,
  disableNavigation,
  onReply,
  onEdit,
}: MastodonStatusItemProps) {
  const router = useOptimizedIonRouter();
  const openStatusActions = useMastodonStatusActions(status, { onReply, onEdit });

  // If this is a reblog, show the original status with reblog indicator
  const displayStatus = status.reblog ?? status;
  const isReblog = !!status.reblog;

  const onStatusLongPress = useCallback(() => {
    openStatusActions();
    stopIonicTapClick();
  }, [openStatusActions]);

  const bind = useLongPress(onStatusLongPress, {
    threshold: 800,
    cancelOnMovement: 15,
    filterEvents,
  });

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(displayStatus);
      return;
    }

    if (disableNavigation) return;

    // Navigate to the status detail page
    router.push(`/posts/mastodon/status/${displayStatus.id}`);
  }, [onClick, disableNavigation, router, displayStatus]);

  return (
    <IonItem
      mode="ios"
      className={cx(
        styles.item,
        isTouchDevice() && "ion-activatable",
        className,
      )}
      detail={false}
      onClick={handleClick}
      href={undefined}
      {...bind()}
    >
      <MastodonStatusContent
        status={displayStatus}
        isReblog={isReblog}
        reblogger={isReblog ? status.account : undefined}
        onReply={onReply}
        onMoreActions={openStatusActions}
      />
    </IonItem>
  );
}

export default memo(MastodonStatusItem);
