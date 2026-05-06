import * as XLSX from 'xlsx';
import { calculateSettlement, getTravelerById, CATEGORIES } from './calculations';

/**
 * exportTripExcel — genera un archivo .xlsx con 4 hojas:
 *  1. Resumen        — totales por viajero (pagó, le corresponde, balance, acciones)
 *  2. Liquidaciones  — transacciones exactas para saldar deudas
 *  3. Gastos detalle — todos los gastos con participantes y montos
 *  4. Por categoría  — desglose de gastos por categoría
 */
export function exportTripExcel(trip, travelers, expenses) {
  const wb = XLSX.utils.book_new();
  const currency = trip.currency || 'PEN';
  const sym = { PEN: 'S/', USD: '$', EUR: '€', COP: '$', MXN: '$', ARS: '$', CLP: '$', BRL: 'R$' }[currency] || currency;
  const fmtVal = (n) => parseFloat(Math.abs(n).toFixed(2));
  const fmtStr = (n) => `${sym} ${Math.abs(n).toFixed(2)}`;

  const { balances, settlements } = calculateSettlement(travelers, expenses);
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

  // ── Hoja 1: RESUMEN POR VIAJERO ────────────────────────────────────────────
  const summaryData = travelers.map(t => {
    const paid = expenses.filter(e => e.paidBy === t.id).reduce((s, e) => s + e.amount, 0);
    const owes = expenses.reduce((s, e) => {
      if (!e.splitAmong?.includes(t.id)) return s;
      if (e.splitMode === 'custom' && e.customShares?.[t.id] != null)
        return s + Number(e.customShares[t.id]);
      return s + e.amount / (e.splitAmong.length || 1);
    }, 0);
    const balance = balances[t.id] ?? 0;
    // What was discounted from what they paid = paid - owes (if positive, they overpaid)
    const discounted = paid - owes;

    return {
      'Viajero':                    t.name,
      [`Total pagado (${sym})`]:    fmtVal(paid),
      [`Le corresponde (${sym})`]:  fmtVal(owes),
      [`Diferencia (${sym})`]:      parseFloat(discounted.toFixed(2)),
      'Balance':                    balance > 0.01 ? `Le deben ${fmtStr(balance)}` : balance < -0.01 ? `Debe pagar ${fmtStr(balance)}` : 'Equilibrado ✓',
      'Estado':                     balance > 0.01 ? 'ACREEDOR' : balance < -0.01 ? 'DEUDOR' : 'EQUILIBRADO',
    };
  });

  // Totals row
  summaryData.push({
    'Viajero':                    'TOTAL',
    [`Total pagado (${sym})`]:    fmtVal(totalSpent),
    [`Le corresponde (${sym})`]:  fmtVal(totalSpent),
    [`Diferencia (${sym})`]:      0,
    'Balance':                    '',
    'Estado':                     '',
  });

  const ws1 = XLSX.utils.json_to_sheet(summaryData);
  styleSheet(ws1, summaryData.length, 6);
  XLSX.utils.book_append_sheet(wb, ws1, '👤 Resumen por viajero');

  // ── Hoja 2: LIQUIDACIONES ──────────────────────────────────────────────────
  const settlementData = settlements.length > 0
    ? settlements.map((s, i) => {
        const from = getTravelerById(travelers, s.from);
        const to   = getTravelerById(travelers, s.to);
        return {
          '#':              i + 1,
          'Quien paga':     from?.name ?? s.from,
          'A quién paga':   to?.name   ?? s.to,
          [`Monto (${sym})`]: fmtVal(s.amount),
          'Descripción':    `${from?.name} debe pagar ${fmtStr(s.amount)} a ${to?.name}`,
        };
      })
    : [{ '#': '-', 'Quien paga': 'Nadie', 'A quién paga': '-', [`Monto (${sym})`]: 0, 'Descripción': 'Todos los gastos están equilibrados ✓' }];

  const ws2 = XLSX.utils.json_to_sheet(settlementData);
  styleSheet(ws2, settlementData.length, 5);
  XLSX.utils.book_append_sheet(wb, ws2, '💸 Liquidaciones');

  // ── Hoja 3: GASTOS DETALLE ─────────────────────────────────────────────────
  const sortedExpenses = [...expenses].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const detailData = sortedExpenses.map(exp => {
    const payer = getTravelerById(travelers, exp.paidBy);
    const cat   = CATEGORIES.find(c => c.id === exp.category);
    const isCustom = exp.splitMode === 'custom' && exp.customShares;

    // Build participants string
    let participantsStr = '';
    if (isCustom) {
      participantsStr = (exp.splitAmong || []).map(pid => {
        const t = getTravelerById(travelers, pid);
        return t ? `${t.name}: ${sym} ${Number(exp.customShares[pid]).toFixed(2)}` : '';
      }).filter(Boolean).join(' | ');
    } else {
      const share = exp.splitAmong?.length ? exp.amount / exp.splitAmong.length : 0;
      participantsStr = (exp.splitAmong || []).map(pid => {
        const t = getTravelerById(travelers, pid);
        return t ? `${t.name}: ${sym} ${share.toFixed(2)}` : '';
      }).filter(Boolean).join(' | ');
    }

    return {
      'Fecha':               exp.date || '',
      'Descripción':         exp.desc,
      'Categoría':           cat ? `${cat.emoji} ${cat.label}` : exp.category,
      'Pagado por':          payer?.name ?? '',
      [`Monto total (${sym})`]: fmtVal(exp.amount),
      'Tipo de división':    isCustom ? 'Montos exactos' : 'Partes iguales',
      'Participantes y montos': participantsStr,
      'Nota':                exp.note || '',
    };
  });

  if (detailData.length === 0) detailData.push({ 'Fecha': '', 'Descripción': 'Sin gastos registrados', 'Categoría': '', 'Pagado por': '', [`Monto total (${sym})`]: 0, 'Tipo de división': '', 'Participantes y montos': '', 'Nota': '' });

  const ws3 = XLSX.utils.json_to_sheet(detailData);
  styleSheet(ws3, detailData.length, 8);
  XLSX.utils.book_append_sheet(wb, ws3, '📋 Gastos detalle');

  // ── Hoja 4: POR CATEGORÍA ──────────────────────────────────────────────────
  const catMap = {};
  expenses.forEach(exp => {
    const cat = CATEGORIES.find(c => c.id === exp.category)?.label || exp.category;
    catMap[cat] = (catMap[cat] || 0) + exp.amount;
  });
  const catData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, total]) => ({
      'Categoría':           cat,
      [`Total (${sym})`]:    fmtVal(total),
      '% del total':         totalSpent > 0 ? `${((total / totalSpent) * 100).toFixed(1)}%` : '0%',
    }));
  if (catData.length === 0) catData.push({ 'Categoría': 'Sin datos', [`Total (${sym})`]: 0, '% del total': '0%' });

  const ws4 = XLSX.utils.json_to_sheet(catData);
  styleSheet(ws4, catData.length, 3);
  XLSX.utils.book_append_sheet(wb, ws4, '📊 Por categoría');

  // ── Generar y descargar ────────────────────────────────────────────────────
  const tripName = (trip.name || 'viaje').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').trim();
  const dateStr  = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `FamilyTrip_${tripName}_${dateStr}.xlsx`);
}

/** Set column widths and basic styles on a worksheet */
function styleSheet(ws, rowCount, colCount) {
  const colWidths = {
    0: 20, 1: 22, 2: 22, 3: 18, 4: 28, 5: 20, 6: 60, 7: 30,
  };
  ws['!cols'] = Array.from({ length: colCount }, (_, i) => ({ wch: colWidths[i] ?? 18 }));
}
