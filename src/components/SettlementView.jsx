import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle, Download, FileSpreadsheet, Loader } from 'lucide-react';
import { calculateSettlement, fmt, getTravelerById, CATEGORIES } from '../utils/calculations';
import { exportTripExcel } from '../utils/exportExcel';
import styles from './SettlementView.module.css';

export default function SettlementView({ expenses, travelers, currency, trip }) {
  const [exporting, setExporting] = useState(false);
  const [exported, setExported]   = useState(false);

  const { balances, settlements } = useMemo(
    () => calculateSettlement(travelers, expenses),
    [travelers, expenses]
  );

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  const travelerStats = travelers.map(t => {
    const paid = expenses.filter(e => e.paidBy === t.id).reduce((s, e) => s + e.amount, 0);
    const owes = expenses.reduce((s, e) => {
      if (!e.splitAmong?.includes(t.id)) return s;
      if (e.splitMode === 'custom' && e.customShares?.[t.id] != null)
        return s + Number(e.customShares[t.id]);
      return s + e.amount / (e.splitAmong.length || 1);
    }, 0);
    const balance    = balances[t.id] ?? 0;
    const discounted = paid - owes; // positive = overpaid (someone owes them), negative = underpaid
    return { ...t, paid, owes, balance, discounted };
  });

  const catBreakdown = CATEGORIES.map(cat => ({
    ...cat,
    total: expenses.filter(e => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const maxCat = catBreakdown[0]?.total || 1;

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportTripExcel(trip, travelers, expenses);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (e) {
      console.error('Export error:', e);
      alert('Error al exportar. Intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>💰</div>
        <h3>Sin gastos aún</h3>
        <p>Agrega gastos para ver la división entre los viajeros.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>

      {/* ── Summary banner ── */}
      <div className={styles.banner}>
        <div className={styles.bannerStat}>
          <span className={styles.bannerLabel}>Total del viaje</span>
          <span className={styles.bannerValue}>{fmt(totalSpent, currency)}</span>
        </div>
        <div className={styles.bannerStat}>
          <span className={styles.bannerLabel}>Promedio ideal</span>
          <span className={styles.bannerValue}>
            {fmt(travelers.length > 0 ? totalSpent / travelers.length : 0, currency)}
          </span>
        </div>
      </div>

      {/* ── Export Excel button ── */}
      <button
        className={`${styles.exportBtn} ${exported ? styles.exportDone : ''}`}
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting
          ? <><Loader size={17} className={styles.spin} /> Generando Excel...</>
          : exported
          ? <><CheckCircle size={17} /> ¡Descargado!</>
          : <><FileSpreadsheet size={17} /> Exportar a Excel</>
        }
      </button>

      {/* What the Excel contains */}
      <div className={styles.exportHint}>
        <span>El Excel incluye 4 hojas:</span>
        <span className={styles.hintPill}>👤 Resumen</span>
        <span className={styles.hintPill}>💸 Liquidaciones</span>
        <span className={styles.hintPill}>📋 Detalle</span>
        <span className={styles.hintPill}>📊 Categorías</span>
      </div>

      {/* ── Settlements ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {settlements.length === 0
            ? '✅ ¡Todo equilibrado!'
            : `📋 ${settlements.length} transferencia${settlements.length !== 1 ? 's' : ''} para saldar`}
        </h2>
        {settlements.length === 0 ? (
          <div className={styles.allGood}>
            <CheckCircle size={40} className={styles.checkIcon} />
            <p>Todos los gastos están equilibrados. ¡Nadie se debe nada!</p>
          </div>
        ) : (
          <div className={styles.settlements}>
            {settlements.map((s, i) => {
              const from = getTravelerById(travelers, s.from);
              const to   = getTravelerById(travelers, s.to);
              return (
                <div key={i} className={`${styles.settlementCard} animate-fade`}>
                  <div className={styles.person}>
                    <div className={styles.personAvatar} style={{ background: from?.color }}>{from?.avatar}</div>
                    <div>
                      <div className={styles.personName}>{from?.name}</div>
                      <div className={styles.personRole}>Debe pagar</div>
                    </div>
                  </div>
                  <div className={styles.arrowWrap}>
                    <div className={styles.arrowAmount}>{fmt(s.amount, currency)}</div>
                    <ArrowRight size={20} className={styles.arrow} />
                  </div>
                  <div className={`${styles.person} ${styles.personRight}`}>
                    <div className={styles.personAvatar} style={{ background: to?.color }}>{to?.avatar}</div>
                    <div>
                      <div className={styles.personName}>{to?.name}</div>
                      <div className={styles.personRole}>Recibe</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Per-person breakdown ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>👤 Resumen por persona</h2>
        <div className={styles.personsGrid}>
          {travelerStats.map(t => (
            <div key={t.id} className={styles.personCard}>
              <div className={styles.personCardHeader}>
                <div className={styles.bigAvatar} style={{ background: t.color }}>{t.avatar}</div>
                <div>
                  <div className={styles.personCardName}>{t.name}</div>
                  <div className={`${styles.balanceBadge} ${t.balance > 0.01 ? styles.positive : t.balance < -0.01 ? styles.negative : styles.neutral}`}>
                    {t.balance > 0.01
                      ? `Le deben ${fmt(t.balance, currency)}`
                      : t.balance < -0.01
                      ? `Debe ${fmt(Math.abs(t.balance), currency)}`
                      : '✓ Equilibrado'}
                  </div>
                </div>
              </div>
              <div className={styles.personStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>💳 Total pagado</span>
                  <span className={styles.statValue}>{fmt(t.paid, currency)}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>📌 Le corresponde</span>
                  <span className={styles.statValue}>{fmt(t.owes, currency)}</span>
                </div>
                <div className={`${styles.stat} ${styles.statHighlight}`}>
                  <span className={styles.statLabel}>
                    {t.discounted >= 0 ? '✅ Le descontaron' : '⚠️ Faltó cubrir'}
                  </span>
                  <span className={`${styles.statValue} ${t.discounted >= 0 ? styles.green : styles.red}`}>
                    {fmt(Math.abs(t.discounted), currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Category breakdown ── */}
      {catBreakdown.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📊 Gastos por categoría</h2>
          <div className={styles.catList}>
            {catBreakdown.map(cat => (
              <div key={cat.id} className={styles.catRow}>
                <div className={styles.catInfo}>
                  <span className={styles.catEmoji}>{cat.emoji}</span>
                  <span className={styles.catName}>{cat.label}</span>
                </div>
                <div className={styles.catBarWrap}>
                  <div className={styles.catBar} style={{ width: `${(cat.total / maxCat * 100).toFixed(1)}%` }} />
                </div>
                <span className={styles.catAmount}>{fmt(cat.total, currency)}</span>
                <span className={styles.catPct}>
                  {totalSpent > 0 ? `${((cat.total / totalSpent) * 100).toFixed(0)}%` : '0%'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
