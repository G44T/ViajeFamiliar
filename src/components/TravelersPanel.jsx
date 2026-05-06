import { useState } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { fmt } from '../utils/calculations';
import styles from './TravelersPanel.module.css';

export default function TravelersPanel({ travelers, expenses, currency, onAdd, onRemove }) {
  const [newName, setNewName] = useState('');

  const handleAdd = e => {
    e.preventDefault();
    if (!newName.trim() || travelers.length >= 8) return;
    onAdd(newName.trim());
    setNewName('');
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.addCard}>
        <h2 className={styles.title}>Gestionar viajeros</h2>
        <form onSubmit={handleAdd} className={styles.addForm}>
          <div className={styles.inputWrap}>
            <UserPlus size={16} className={styles.icon}/>
            <input type="text" placeholder="Nombre del viajero (máx. 8)" value={newName}
              onChange={e=>setNewName(e.target.value)} maxLength={20}/>
          </div>
          <button type="submit" className={styles.btnAdd} disabled={!newName.trim()||travelers.length>=8}>
            <Plus size={16}/> Agregar
          </button>
        </form>
      </div>

      <div className={styles.travelersList}>
        {travelers.map(t => {
          const paid     = expenses.filter(e=>e.paidBy===t.id).reduce((s,e)=>s+e.amount,0);
          const expCount = expenses.filter(e=>e.paidBy===t.id).length;
          const inSplit  = expenses.filter(e=>e.splitAmong?.includes(t.id)).length;
          const canRemove= !expenses.some(e=>e.paidBy===t.id||e.splitAmong?.includes(t.id));
          return (
            <div key={t.id} className={`${styles.travelerCard} animate-fade`}>
              <div className={styles.travelerLeft}>
                <div className={styles.avatar} style={{background:t.color}}>{t.avatar}</div>
                <div>
                  <div className={styles.name}>{t.name}</div>
                  <div className={styles.meta}>
                    {expCount>0?`Pagó ${expCount} gasto${expCount!==1?'s':''}`:'Sin pagos registrados'}
                    {inSplit>0&&` · incluido en ${inSplit}`}
                  </div>
                </div>
              </div>
              <div className={styles.travelerRight}>
                <div className={styles.paidAmount}>
                  <span className={styles.paidLabel}>Total pagado</span>
                  <span className={styles.paidValue}>{fmt(paid,currency)}</span>
                </div>
                <button className={styles.removeBtn} title={canRemove?'Eliminar':'Tiene gastos asociados'}
                  onClick={()=>{
                    if(!canRemove){alert('No puedes eliminar a este viajero porque tiene gastos asociados.');return;}
                    if(window.confirm(`¿Eliminar a ${t.name} del viaje?`))onRemove(t.id);
                  }}>
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {travelers.length===0&&(
        <div className={styles.empty}><span>👥</span><p>No hay viajeros. Agrega al menos 2.</p></div>
      )}
    </div>
  );
}
