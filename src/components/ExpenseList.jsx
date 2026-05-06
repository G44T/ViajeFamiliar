import { useState } from 'react';
import { Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { CATEGORIES, fmt, getTravelerById } from '../utils/calculations';
import AddExpenseModal from './AddExpenseModal';
import styles from './ExpenseList.module.css';

function groupByDate(expenses) {
  const groups = {};
  expenses.forEach(e => { const d = e.date||'Sin fecha'; if(!groups[d])groups[d]=[]; groups[d].push(e); });
  return Object.entries(groups).sort((a,b)=>b[0].localeCompare(a[0]));
}
function formatDate(s) {
  if(!s||s==='Sin fecha') return 'Sin fecha';
  return new Date(s+'T00:00:00').toLocaleDateString('es-PE',{weekday:'long',day:'numeric',month:'long'});
}

export default function ExpenseList({ expenses, travelers, currency, onRemove, onUpdate }) {
  const [collapsed, setCollapsed] = useState({});
  const [editing, setEditing] = useState(null);

  if(expenses.length===0) return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>✈️</div>
      <h3>¡Todo listo para el viaje!</h3>
      <p>Agrega el primer gasto usando el botón de abajo.</p>
    </div>
  );

  const groups = groupByDate(expenses);
  return (
    <>
      <div className={styles.list}>
        {groups.map(([date,items])=>{
          const dayTotal=items.reduce((s,e)=>s+e.amount,0);
          const isCollapsed=collapsed[date];
          return (
            <div key={date} className={styles.group}>
              <button className={styles.groupHeader} onClick={()=>setCollapsed(p=>({...p,[date]:!p[date]}))}>
                <div><span className={styles.groupDate}>{formatDate(date)}</span><span className={styles.groupCount}>{items.length} gasto{items.length!==1?'s':''}</span></div>
                <div className={styles.groupRight}><span className={styles.groupTotal}>{fmt(dayTotal,currency)}</span>{isCollapsed?<ChevronDown size={16}/>:<ChevronUp size={16}/>}</div>
              </button>
              {!isCollapsed&&items.map(exp=>(
                <ExpenseItem key={exp.id} exp={exp} travelers={travelers} currency={currency} onRemove={onRemove} onEdit={()=>setEditing(exp)}/>
              ))}
            </div>
          );
        })}
      </div>
      {editing&&(
        <AddExpenseModal travelers={travelers} currency={currency} initialData={editing}
          onSave={updated=>{onUpdate(editing.id,updated);setEditing(null);}}
          onClose={()=>setEditing(null)}/>
      )}
    </>
  );
}

function ExpenseItem({ exp, travelers, currency, onRemove, onEdit }) {
  const cat   = CATEGORIES.find(c=>c.id===exp.category)||CATEGORIES[CATEGORIES.length-1];
  const payer = getTravelerById(travelers, exp.paidBy);
  const isCustom = exp.splitMode==='custom'&&exp.customShares;

  const splitSummary = () => {
    if(isCustom) return `Montos individuales · ${exp.splitAmong?.length??0} personas`;
    const share = exp.splitAmong?.length ? exp.amount/exp.splitAmong.length : 0;
    return `${fmt(share,currency)}/persona`;
  };

  return (
    <div className={`${styles.item} animate-fade`}>
      <div className={styles.itemLeft}>
        <div className={styles.catBadge}>{cat.emoji}</div>
        <div className={styles.itemInfo}>
          <div className={styles.itemDesc}>{exp.desc}</div>
          <div className={styles.itemMeta}>
            {payer&&<div className={styles.payerTag} style={{background:payer.color+'22',color:payer.color}}><div className={styles.payerDot} style={{background:payer.color}}/>{payer.name}</div>}
            <span className={styles.catTag}>{cat.label}</span>
            {isCustom&&<span className={styles.customTag}>⚖️ Exacto</span>}
            {exp.note&&<span className={styles.noteTag}>📎 {exp.note}</span>}
          </div>
          {exp.splitAmong?.length>0&&(
            <div className={styles.splitInfo}>
              <span>{splitSummary()}</span>
              <span className={styles.splitDot}>·</span>
              <div className={styles.avatarRow}>
                {exp.splitAmong.slice(0,5).map(pid=>{const t=getTravelerById(travelers,pid);return t?(<div key={pid} className={styles.miniAvatar} style={{background:t.color}} title={isCustom&&exp.customShares?.[pid]?`${t.name}: ${fmt(exp.customShares[pid],currency)}`:t.name}>{t.avatar}</div>):null;})}
                {exp.splitAmong.length>5&&<div className={styles.miniAvatarMore}>+{exp.splitAmong.length-5}</div>}
              </div>
            </div>
          )}
          {isCustom&&exp.splitAmong?.length>0&&(
            <div className={styles.customShareDetail}>
              {exp.splitAmong.map(pid=>{const t=getTravelerById(travelers,pid);const share=exp.customShares[pid];return t&&share?(<span key={pid} className={styles.shareChip} style={{borderColor:t.color+'55'}}><span className={styles.shareChipDot} style={{background:t.color}}/>{t.name} · {fmt(share,currency)}</span>):null;})}
            </div>
          )}
        </div>
      </div>
      <div className={styles.itemRight}>
        <span className={styles.amount}>{fmt(exp.amount,currency)}</span>
        <div className={styles.actions}>
          <button className={styles.editBtn} onClick={onEdit} title="Editar"><Pencil size={13}/></button>
          <button className={styles.deleteBtn} onClick={()=>window.confirm('¿Eliminar este gasto?')&&onRemove(exp.id)} title="Eliminar"><Trash2 size={13}/></button>
        </div>
      </div>
    </div>
  );
}
