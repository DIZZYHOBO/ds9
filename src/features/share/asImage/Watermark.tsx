import styles from "./Watermark.module.css";

export default function Watermark() {
  return (
    <div className={styles.container}>
      <div className={styles.text}>Tuvix for Lemmy</div>
      <img src="/logo.png" className={styles.logoImg} />
    </div>
  );
}
