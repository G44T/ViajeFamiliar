import styles from './LoadingScreen.module.css';
export default function LoadingScreen() {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>✈️</div>
      <p className={styles.text}>Cargando viaje...</p>
    </div>
  );
}
