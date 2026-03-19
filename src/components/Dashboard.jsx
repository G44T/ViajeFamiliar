import { useState } from 'react';
import { MapPin, Plus, Users, BarChart2, ArrowLeftRight, LogOut, Share2, Copy, Check } from 'lucide-react';
import ExpenseList from './ExpenseList';
import AddExpenseModal from './AddExpenseModal';
import SettlementView from './SettlementView';
import TravelersPanel from './TravelersPanel';
import { fmt } from '../utils/calculations';
import styles from './Dashboard.module.css';

const TABS = [
  { id: 'expenses',   label: 'Gastos',   icon: BarChart2 },
  { id: 'settlement', label: 'División', icon: ArrowLeftRight },
  { id: 'travelers',  label: 'Viajeros', icon: Users },
];

export default function Dashboard({ state, store, tripId }) {
  const { trip, travelers, expenses } = state;
  const [tab, setTab]         = useState('expenses');
  const [showAdd, setShowAdd] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied]   = useState(false);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const perPerson     = travelers.length > 0 ? totalExpenses / travelers.length : 0;

  const copyId = () => {
    navigator.clipboard.writeText(tripId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={styles.app}>
      {/* Share modal */}
      {showShare && (
        <div className={styles.shareOverlay} onClick={() => setShowShare(false)}>
          <div className={styles.shareCard} onClick={e => e.stopPropagation()}>
            <h3>Compartir viaje</h3>
            <p>Comparte este ID para que otros puedan unirse y ver los gastos en tiempo real:</p>
            <div className={styles.idBox}>
              <code>{tripId}</code>
              <button onClick={copyId} className={styles.copyBtn}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <button className={styles.closeShare} onClick={() => setShowShare(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.logoIcon}>✈️</div>
            <div>
              <h1 className={styles.tripName}>{trip.name}</h1>
              <div className={styles.tripMeta}>
                <MapPin size={12} />
                <span>{trip.destination}</span>
                {trip.startDate && <><span className={styles.dot}>·</span><span>{trip.startDate}</span></>}
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.actionBtn} onClick={() => setShowShare(true)} title="Compartir">
              <Share2 size={16} />
            </button>
            <button
              className={styles.actionBtn}
              title="Salir del viaje"
              onClick={() => {
                if (window.confirm('¿Salir del viaje? Puedes volver ingresando el ID.')) {
                  store.leaveTrip();
                }
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Summary ribbon */}
        <div className={styles.ribbon}>
          <div className={styles.ribbonStat}>
            <span className={styles.ribbonLabel}>Total gastado</span>
            <span className={styles.ribbonValue}>{fmt(totalExpenses, trip.currency)}</span>
          </div>
          <div className={styles.ribbonDivider} />
          <div className={styles.ribbonStat}>
            <span className={styles.ribbonLabel}>Por persona</span>
            <span className={styles.ribbonValue}>{fmt(perPerson, trip.currency)}</span>
          </div>
          <div className={styles.ribbonDivider} />
          <div className={styles.ribbonStat}>
            <span className={styles.ribbonLabel}>Gastos</span>
            <span className={styles.ribbonValue}>{expenses.length}</span>
          </div>
          <div className={styles.ribbonDivider} />
          <div className={styles.ribbonStat}>
            <span className={styles.ribbonLabel}>Viajeros</span>
            <span className={styles.ribbonValue}>{travelers.length}</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            <t.icon size={16} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className={styles.main}>
        {tab === 'expenses'   && <ExpenseList   expenses={expenses} travelers={travelers} currency={trip.currency} onRemove={store.removeExpense} onUpdate={store.updateExpense} />}
        {tab === 'settlement' && <SettlementView expenses={expenses} travelers={travelers} currency={trip.currency} />}
        {tab === 'travelers'  && <TravelersPanel travelers={travelers} expenses={expenses} currency={trip.currency} onAdd={store.addTraveler} onRemove={store.removeTraveler} />}
      </main>

      {/* FAB */}
      {tab === 'expenses' && (
        <button className={styles.fab} onClick={() => setShowAdd(true)}>
          <Plus size={22} />
          <span>Agregar gasto</span>
        </button>
      )}

      {showAdd && (
        <AddExpenseModal
          travelers={travelers}
          currency={trip.currency}
          onSave={(exp) => { store.addExpense(exp); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
