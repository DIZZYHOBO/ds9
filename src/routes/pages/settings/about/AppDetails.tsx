import AppVersionInfo from "./AppVersionInfo";

import styles from "./AppDetails.module.css";

export default function AppDetails() {
  return (
    <div className={styles.container}>
      <img src="/logo.png" alt="" />
      <div>
        Tuvix <AppVersionInfo verbose betaAs="aside" />
        <aside>by dumbass</aside>
      </div>
    </div>
  );
}
