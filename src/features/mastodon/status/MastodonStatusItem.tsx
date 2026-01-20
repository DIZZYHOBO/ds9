import { IonItem } from "@ionic/react";
import { memo, useCallback, useMemo } from "react";
import { useLongPress } from "use-long-press";

import { cx } from "#/helpers/css";
import { isTouchDevice } from "#/helpers/device";
import { filterEvents } from "#/helpers/longPress";
import { stopIonicTapClick } from "#/helpers/ionic";
import { MastodonStatus } from "#/services/mastodon";

import MastodonStatusContent from "./MastodonStatusContent";
import useMastodonStatusActions from "./useMastodonStatusActions";

import styles from "./MastodonStatusItem.module.css";

export interface MastodonStatusItemProps {
  status: MastodonStatus;
  className?: string;
  onClick?: (status: MastodonStatus) => void;
}

function MastodonStatusItem({
  status,
  className,
  onClick,
}: MastodonStatusItemProps) {
  const openStatusActions = useMastodonStatusActions(status);

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

  return (
    <IonItem
      mode="ios"
      className={cx(
        styles.item,
        isTouchDevice() && "ion-activatable",
        className,
      )}
      detail={false}
      onClick={() => onClick?.(displayStatus)}
      href={undefined}
      {...bind()}
    >
      <MastodonStatusContent
        status={displayStatus}
        isReblog={isReblog}
        reblogger={isReblog ? status.account : undefined}
      />
    </IonItem>
  );
}

export default memo(MastodonStatusItem);
