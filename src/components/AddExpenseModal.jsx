import { useState, useEffect, useMemo } from 'react';
import { X, DollarSign, User, Calendar, FileText, Tag, Users, Equal, Sliders } from 'lucide-react';
import { CATEGORIES, fmtNum } from '../utils/calculations';
import styles from './AddExpenseModal.module.css';

/**
 * AddExpenseModal — crear o editar un gasto.
 *
 * splitMode:
 *  'equal'  → se divide el total en partes iguales entre splitAmong
 *  'custom' → cada persona ingresa su propio monto en customShares
 */
export default function AddExpenseModal({ travelers, currency, onSave, onClose, initialData }) {
  const isEditing = !!initialData;
  const today = new Date().toISOString().split('T')[0];

  const sym = { PEN: 'S/', USD: '$', EUR: '€', COP: '$', MXN: '$', ARS: '$', CLP: '$', BRL: 'R$' }[currency] || currency;

  // ── Initial state ──────────────────────────────────────────────────────────
  const initForm = () => {
    if (initialData) {
      return {
        desc:      initialData.desc      ?? '',
        amount:    initialData.amount    ?? '',
        paidBy:    initialData.paidBy    ?? travelers[0]?.id ?? '',
        splitMode: initialData.splitMode ?? 'equal',
        splitAmong: initialData.splitAmong ?? travelers.map(t => t.id),
        customShares: initialData.customShares
          ? { ...initialData.customShares }
          : Object.fromEntries(travelers.map(t => [t.id, ''])),
        category:  initialData.category  ?? 'food',
        date:      initialData.date      ?? today,
        note:      initialData.note      ?? '',
      };
    }
    return {
      desc: '', amount: '', paidBy: travelers[0]?.id ?? '',
      splitMode: 'equal',
      splitAmong: travelers.map(t => t.id),
      customShares: Object.fromEntries(travelers.map(t => [t.id, ''])),
      category: 'food', date: today, note: '',
    };
  };

  const [form, setForm] = useState(initForm);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalAmount = parseFloat(form.amount) || 0;

  // For equal mode: sum of selected
  const equalShare = form.splitAmong.length > 0
    ? totalAmount / form.splitAmong.length
    : 0;

  // For custom mode: sum of entered shares
  const customTotal = useMemo(() =>
    Object.values(form.customShares).reduce((s, v) => s + (parseFloat(v) || 0), 0),
    [form.customShares]
  );
  const customRemaining = totalAmount - customTotal;
  const customValid = Math.abs(customRemaining) < 0.01;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const toggleSplit = (id) => {
    setForm(p => ({
      ...p,
      splitAmong: p.splitAmong.includes(id)
        ? p.splitAmong.filter(x => x !== id)
        : [...p.splitAmong, id],
    }));
  };

  const setCustomShare = (id, val) => {
    setForm(p => ({
      ...p,
      customShares: { ...p.customShares, [id]: val },
    }));
  };

  // When switching to custom mode, pre-fill with equal shares for selected travelers
  const switchMode = (mode) => {
    if (mode === 'custom' && form.splitAmong.length > 0 && totalAmount > 0) {
      const share = (totalAmount / form.splitAmong.length).toFixed(2);
      const newShares = Object.fromEntries(
        travelers.map(t => [t.id, form.splitAmong.includes(t.id) ? share : ''])
      );
      setForm(p => ({ ...p, splitMode: mode, customShares: newShares }));
    } else {
      set('splitMode', mode);
    }
  };

  // When splitAmong changes in custom mode, clear deselected shares
  const toggleCustomPerson = (id) => {
    setForm(p => {
      const inList = p.splitAmong.includes(id);
      return {
        ...p,
        splitAmong: inList ? p.splitAmong.filter(x => x !== id) : [...p.splitAmong, id],
        customShares: { ...p.customShares, [id]: inList ? '' : p.customShares[id] },
      };
    });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const canSubmit = () => {
    if (!form.desc.trim() || totalAmount <= 0) return false;
    if (form.splitMode === 'equal') return form.splitAmong.length > 0;
    return customValid && form.splitAmong.length > 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit()) return;

    const payload = {
      desc:      form.desc.trim(),
      amount:    totalAmount,
      paidBy:    form.paidBy,
      splitMode: form.splitMode,
      category:  form.category,
      date:      form.date,
      note:      form.note.trim(),
    };

    if (form.splitMode === 'equal') {
      payload.splitAmong  = form.splitAmong;
      payload.customShares = null;
    } else {
      // Only include travelers in splitAmong with a non-zero share
      const active = form.splitAmong.filter(id => parseFloat(form.customShares[id]) > 0);
      payload.splitAmong = active;
      payload.customShares = Object.fromEntries(
        active.map(id => [id, parseFloat(form.customShares[id])])
      );
    }

    onSave(payload);
  };

  const selectedCat = CATEGORIES.find(c => c.id === form.category);

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} animate-fade`}>
        <div className={styles.modalHeader}>
          <h2>{isEditing ? '✏️ Editar gasto' : 'Nuevo gasto'}</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* ── Categories ── */}
          <div className={styles.categories}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} type="button"
                className={`${styles.catBtn} ${form.category === cat.id ? styles.catActive : ''}`}
                onClick={() => set('category', cat.id)}
              >
                <span className={styles.catEmoji}>{cat.emoji}</span>
                <span className={styles.catLabel}>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* ── Description & Amount ── */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label><FileText size={13} /> Descripción</label>
              <input type="text" placeholder="Ej: Almuerzo en restaurante"
                value={form.desc} onChange={e => set('desc', e.target.value)} required />
            </div>
            <div className={styles.field} style={{ maxWidth: 130 }}>
              <label><DollarSign size={13} /> Total ({sym})</label>
              <input type="number" placeholder="0.00" min="0.01" step="0.01"
                value={form.amount} onChange={e => set('amount', e.target.value)} required />
            </div>
          </div>

          {/* ── Paid by & Date ── */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label><User size={13} /> Pagó</label>
              <select value={form.paidBy} onChange={e => set('paidBy', e.target.value)}>
                {travelers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label><Calendar size={13} /> Fecha</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>

          {/* ── Split mode toggle ── */}
          <div className={styles.field}>
            <label><Users size={13} /> Cómo dividir</label>
            <div className={styles.modePills}>
              <button type="button"
                className={`${styles.modePill} ${form.splitMode === 'equal' ? styles.modePillActive : ''}`}
                onClick={() => switchMode('equal')}
              >
                <Equal size={14} /> Partes iguales
              </button>
              <button type="button"
                className={`${styles.modePill} ${form.splitMode === 'custom' ? styles.modePillActive : ''}`}
                onClick={() => switchMode('custom')}
              >
                <Sliders size={14} /> Montos exactos
              </button>
            </div>
          </div>

          {/* ── EQUAL MODE ── */}
          {form.splitMode === 'equal' && (
            <div className={styles.field}>
              <div className={styles.splitGrid}>
                <button type="button" className={styles.selectAll}
                  onClick={() => set('splitAmong',
                    form.splitAmong.length === travelers.length ? [] : travelers.map(t => t.id)
                  )}
                >
                  {form.splitAmong.length === travelers.length ? 'Deseleccionar todos' : 'Todos'}
                </button>
                {travelers.map(t => {
                  const active = form.splitAmong.includes(t.id);
                  return (
                    <button key={t.id} type="button"
                      className={`${styles.splitBtn} ${active ? styles.splitActive : ''}`}
                      onClick={() => toggleSplit(t.id)}
                    >
                      <div className={styles.avatar} style={{ background: active ? t.color : 'var(--sand3)' }}>
                        {t.avatar}
                      </div>
                      <div className={styles.splitBtnText}>
                        <span>{t.name}</span>
                        {active && totalAmount > 0 && (
                          <span className={styles.splitShare}>{sym} {fmtNum(equalShare)}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {totalAmount > 0 && form.splitAmong.length > 0 && (
                <div className={styles.shareHint}>
                  {sym} {fmtNum(equalShare)} por persona · {form.splitAmong.length} personas
                </div>
              )}
            </div>
          )}

          {/* ── CUSTOM MODE ── */}
          {form.splitMode === 'custom' && (
            <div className={styles.field}>
              <div className={styles.customGrid}>
                {travelers.map(t => {
                  const active = form.splitAmong.includes(t.id);
                  const val = form.customShares[t.id] ?? '';
                  return (
                    <div key={t.id} className={`${styles.customRow} ${active ? styles.customRowActive : ''}`}>
                      <button type="button"
                        className={`${styles.customToggle}`}
                        onClick={() => toggleCustomPerson(t.id)}
                      >
                        <div className={styles.avatar}
                          style={{ background: active ? t.color : 'var(--sand3)', opacity: active ? 1 : 0.5 }}
                        >
                          {t.avatar}
                        </div>
                        <span className={styles.customName} style={{ opacity: active ? 1 : 0.45 }}>
                          {t.name}
                        </span>
                      </button>
                      <div className={styles.customInputWrap}>
                        <span className={styles.customSym}>{sym}</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={val}
                          disabled={!active}
                          onChange={e => setCustomShare(t.id, e.target.value)}
                          className={styles.customInput}
                          onClick={() => !active && toggleCustomPerson(t.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Running total */}
              <div className={`${styles.customTotal} ${customValid ? styles.customOk : customRemaining < 0 ? styles.customOver : styles.customUnder}`}>
                <div className={styles.customTotalRow}>
                  <span>Total ingresado:</span>
                  <strong>{sym} {fmtNum(customTotal)}</strong>
                </div>
                <div className={styles.customTotalRow}>
                  <span>Total del gasto:</span>
                  <strong>{sym} {fmtNum(totalAmount)}</strong>
                </div>
                {!customValid && totalAmount > 0 && (
                  <div className={styles.customDiff}>
                    {customRemaining > 0
                      ? `Faltan ${sym} ${fmtNum(customRemaining)} por asignar`
                      : `Te pasaste ${sym} ${fmtNum(-customRemaining)}`
                    }
                  </div>
                )}
                {customValid && totalAmount > 0 && (
                  <div className={styles.customDiff} style={{ color: 'var(--sage)' }}>✓ Los montos cuadran</div>
                )}
              </div>
            </div>
          )}

          {/* ── Note ── */}
          <div className={styles.field}>
            <label><Tag size={13} /> Nota (opcional)</label>
            <input type="text" placeholder="Agrega una nota..."
              value={form.note} onChange={e => set('note', e.target.value)} maxLength={80} />
          </div>

          <button type="submit" className={styles.btnSubmit} disabled={!canSubmit()}>
            {selectedCat?.emoji} {isEditing ? 'Guardar cambios' : 'Agregar gasto'}
          </button>
        </form>
      </div>
    </div>
  );
}
