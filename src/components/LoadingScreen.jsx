import { Plane } from 'lucide-react';
import styles from './LoadingScreen.module.css';

export default function LoadingScreen() {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>
        <Plane size={28} />
      </div>
      <p className={styles.text}>Cargando viaje...</p>
    </div>
  );
}
