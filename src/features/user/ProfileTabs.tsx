import { PersonView } from "threadiverse";

import { userHandleSelector } from "#/features/auth/authSelectors";
import { getRemoteHandle } from "#/helpers/lemmy";
import { useMode } from "#/helpers/threadiverse";
import { useAppSelector } from "#/store";

import styles from "./ProfileTabs.module.css";

export type ProfileTabType =
  | "overview"
  | "posts"
  | "comments"
  | "saved"
  | "upvoted"
  | "downvoted"
  | "hidden";

interface ProfileTabsProps {
  person: Pick<PersonView, "person" | "counts">;
  activeTab: ProfileTabType;
  onTabChange: (tab: ProfileTabType) => void;
}

interface TabConfig {
  id: ProfileTabType;
  label: string;
  selfOnly?: boolean;
  excludePiefed?: boolean;
}

const TABS: TabConfig[] = [
  { id: "overview", label: "Overview" },
  { id: "posts", label: "Posts" },
  { id: "comments", label: "Comments" },
  { id: "saved", label: "Saved", selfOnly: true },
  { id: "upvoted", label: "Upvoted", selfOnly: true, excludePiefed: true },
  { id: "downvoted", label: "Downvoted", selfOnly: true, excludePiefed: true },
  { id: "hidden", label: "Hidden", selfOnly: true },
];

export default function ProfileTabs({
  person,
  activeTab,
  onTabChange,
}: ProfileTabsProps) {
  const myHandle = useAppSelector(userHandleSelector);
  const mode = useMode();
  const isSelf = getRemoteHandle(person.person) === myHandle;

  const visibleTabs = TABS.filter((tab) => {
    if (tab.selfOnly && !isSelf) return false;
    if (tab.excludePiefed && mode === "piefed") return false;
    return true;
  });

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabsScroll}>
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
