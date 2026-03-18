/**
 * calculateSettlement — algoritmo greedy para liquidar deudas con el mínimo de transacciones.
 *
 * Soporta dos modos de división:
 *  - splitMode: 'equal'  → splitAmong: [id, id, ...]  (partes iguales)
 *  - splitMode: 'custom' → customShares: { id: monto, id: monto, ... } (montos individuales)
 */
export function calculateSettlement(travelers, expenses) {
  if (!travelers.length || !expenses.length) return { balances: {}, settlements: [] };

  const balances = {};
  travelers.forEach(t => { balances[t.id] = 0; });

  expenses.forEach(exp => {
    const { paidBy, amount, splitMode, splitAmong, customShares } = exp;

    // Payer gets full credit
    if (balances[paidBy] !== undefined) {
      balances[paidBy] += amount;
    }

    if (splitMode === 'custom' && customShares) {
      // Each person owes exactly their custom share
      Object.entries(customShares).forEach(([pid, share]) => {
        if (balances[pid] !== undefined) {
          balances[pid] -= Number(share);
        }
      });
    } else {
      // Equal split
      if (!splitAmong || !splitAmong.length) return;
      const share = amount / splitAmong.length;
      splitAmong.forEach(pid => {
        if (balances[pid] !== undefined) {
          balances[pid] -= share;
        }
      });
    }
  });

  // Greedy settlement
  const settlements = [];
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < -0.01)
    .map(([id, v]) => ({ id, amount: -v }))
    .sort((a, b) => b.amount - a.amount);
  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0.01)
    .map(([id, v]) => ({ id, amount: v }))
    .sort((a, b) => b.amount - a.amount);

  let d = 0, c = 0;
  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    const amount = Math.min(debtor.amount, creditor.amount);
    settlements.push({ from: debtor.id, to: creditor.id, amount: Math.round(amount * 100) / 100 });
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount < 0.01) d++;
    if (creditor.amount < 0.01) c++;
  }

  return { balances, settlements };
}

export function getTravelerById(travelers, id) {
  return travelers.find(t => t.id === id);
}

export function fmt(amount, currency = 'PEN') {
  const symbols = { PEN: 'S/', USD: '$', EUR: '€', COP: '$', MXN: '$', ARS: '$', CLP: '$', BRL: 'R$' };
  const sym = symbols[currency] || currency + ' ';
  return `${sym} ${Math.abs(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtNum(amount) {
  return Math.abs(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const CATEGORIES = [
  { id: 'transport',  label: 'Transporte',   emoji: '✈️' },
  { id: 'lodging',    label: 'Hospedaje',     emoji: '🏨' },
  { id: 'food',       label: 'Comida',        emoji: '🍽️' },
  { id: 'activities', label: 'Actividades',   emoji: '🎡' },
  { id: 'shopping',   label: 'Compras',       emoji: '🛍️' },
  { id: 'health',     label: 'Salud',         emoji: '💊' },
  { id: 'fuel',       label: 'Gasolina',      emoji: '⛽' },
  { id: 'other',      label: 'Otros',         emoji: '📦' },
];

export const CURRENCIES = [
  { code: 'PEN', label: 'Sol peruano (S/)' },
  { code: 'USD', label: 'Dólar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'COP', label: 'Peso colombiano' },
  { code: 'MXN', label: 'Peso mexicano' },
  { code: 'ARS', label: 'Peso argentino' },
  { code: 'CLP', label: 'Peso chileno' },
  { code: 'BRL', label: 'Real brasileño' },
];
