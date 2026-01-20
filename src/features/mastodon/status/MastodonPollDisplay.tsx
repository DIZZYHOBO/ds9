import { IonIcon } from "@ionic/react";
import { checkmarkCircle, ellipseOutline, squareOutline, checkmarkCircleOutline } from "ionicons/icons";

import { formatRelative } from "#/helpers/date";
import { MastodonPoll } from "#/services/mastodon";

import styles from "./MastodonPollDisplay.module.css";

interface MastodonPollDisplayProps {
  poll: MastodonPoll;
}

export default function MastodonPollDisplay({ poll }: MastodonPollDisplayProps) {
  const totalVotes = poll.votes_count;
  const hasVoted = poll.voted;
  const isExpired = poll.expired;
  const showResults = hasVoted || isExpired;

  return (
    <div className={styles.container}>
      {poll.options.map((option, index) => {
        const votes = option.votes_count ?? 0;
        const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
        const isSelected = poll.own_votes?.includes(index);

        return (
          <div
            key={index}
            className={`${styles.option} ${isSelected ? styles.selected : ""}`}
          >
            {showResults && (
              <div
                className={styles.progressBar}
                style={{ width: `${percentage}%` }}
              />
            )}
            <div className={styles.optionContent}>
              <div className={styles.optionLeft}>
                <IonIcon
                  icon={
                    poll.multiple
                      ? isSelected
                        ? checkmarkCircleOutline
                        : squareOutline
                      : isSelected
                        ? checkmarkCircle
                        : ellipseOutline
                  }
                  className={styles.optionIcon}
                />
                <span className={styles.optionTitle}>{option.title}</span>
              </div>
              {showResults && (
                <span className={styles.percentage}>
                  {percentage.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        );
      })}

      <div className={styles.footer}>
        <span>
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        </span>
        {poll.voters_count !== undefined && poll.voters_count !== totalVotes && (
          <span> from {poll.voters_count} voter{poll.voters_count !== 1 ? "s" : ""}</span>
        )}
        <span className={styles.separator}>·</span>
        {isExpired ? (
          <span>Closed</span>
        ) : poll.expires_at ? (
          <span>Ends {formatRelative(poll.expires_at)}</span>
        ) : null}
      </div>
    </div>
  );
}
