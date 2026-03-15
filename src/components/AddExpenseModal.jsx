import { useState } from 'react';
import { X, DollarSign, User, Calendar, FileText, Tag, Users } from 'lucide-react';
import { CATEGORIES } from '../utils/calculations';
import styles from './AddExpenseModal.module.css';

export default function AddExpenseModal({ travelers, currency, onAdd, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    desc: '',
    amount: '',
    paidBy: travelers[0]?.id ?? '',
    splitAmong: travelers.map(t => t.id),
    category: 'food',
    date: today,
    note: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleSplit = (id) => {
    setForm(p => ({
      ...p,
      splitAmong: p.splitAmong.includes(id)
        ? p.splitAmong.filter(x => x !== id)
        : [...p.splitAmong, id],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.desc.trim() || !form.amount || +form.amount <= 0 || !form.splitAmong.length) return;
    onAdd({ ...form, amount: parseFloat(form.amount) });
  };

  const selectedCat = CATEGORIES.find(c => c.id === form.category);
  const sym = { PEN: 'S/', USD: '$', EUR: '€' }[currency] || currency;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} animate-fade`}>
        <div className={styles.modalHeader}>
          <h2>Nuevo gasto</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Categories */}
          <div className={styles.categories}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`${styles.catBtn} ${form.category === cat.id ? styles.catActive : ''}`}
                onClick={() => set('category', cat.id)}
              >
                <span className={styles.catEmoji}>{cat.emoji}</span>
                <span className={styles.catLabel}>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Desc & Amount */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label><FileText size={13} /> Descripción</label>
              <input
                type="text"
                placeholder="Ej: Cena en el restaurante"
                value={form.desc}
                onChange={e => set('desc', e.target.value)}
                required
              />
            </div>
            <div className={styles.field} style={{ maxWidth: 130 }}>
              <label><DollarSign size={13} /> Monto ({sym})</label>
              <input
                type="number"
                placeholder="0.00"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Paid by & Date */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label><User size={13} /> Pagó</label>
              <select value={form.paidBy} onChange={e => set('paidBy', e.target.value)}>
                {travelers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label><Calendar size={13} /> Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
              />
            </div>
          </div>

          {/* Split among */}
          <div className={styles.field}>
            <label><Users size={13} /> Dividir entre</label>
            <div className={styles.splitGrid}>
              <button
                type="button"
                className={styles.selectAll}
                onClick={() => set('splitAmong',
                  form.splitAmong.length === travelers.length ? [] : travelers.map(t => t.id)
                )}
              >
                {form.splitAmong.length === travelers.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
              {travelers.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.splitBtn} ${form.splitAmong.includes(t.id) ? styles.splitActive : ''}`}
                  onClick={() => toggleSplit(t.id)}
                >
                  <div
                    className={styles.avatar}
                    style={{ background: form.splitAmong.includes(t.id) ? t.color : 'var(--sand3)' }}
                  >
                    {t.avatar}
                  </div>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
            {form.amount && form.splitAmong.length > 0 && (
              <div className={styles.shareHint}>
                {sym} {(parseFloat(form.amount || 0) / form.splitAmong.length).toFixed(2)} por persona
              </div>
            )}
          </div>

          {/* Note */}
          <div className={styles.field}>
            <label><Tag size={13} /> Nota (opcional)</label>
            <input
              type="text"
              placeholder="Agrega una nota..."
              value={form.note}
              onChange={e => set('note', e.target.value)}
              maxLength={80}
            />
          </div>

          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={!form.desc.trim() || !form.amount || +form.amount <= 0 || !form.splitAmong.length}
          >
            {selectedCat?.emoji} Agregar gasto
          </button>
        </form>
      </div>
    </div>
  );
}
