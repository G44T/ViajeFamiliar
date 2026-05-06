import { useState } from 'react';
import { MapPin, Calendar, DollarSign, Users, ArrowRight, Plane, Link } from 'lucide-react';
import { CURRENCIES } from '../utils/calculations';
import styles from './SetupScreen.module.css';

export default function SetupScreen({ onSetup, onJoin, error }) {
  const [mode, setMode]   = useState('new');
  const [step, setStep]   = useState(1);
  const [tripData, setTripData] = useState({ name:'', destination:'', currency:'PEN', startDate:'', endDate:'' });
  const [travelers, setTravelers] = useState([]);
  const [newName, setNewName]     = useState('');
  const [joinId, setJoinId]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const COLORS = ['#c8502a','#2a6fa8','#3a7a52','#d4a017','#7a3a8a','#2a8a8a','#a85028','#5a7a2a'];

  const addTraveler = () => { if (!newName.trim() || travelers.length >= 8) return; setTravelers(p=>[...p,newName.trim()]); setNewName(''); };
  const handleFinish = async () => { if (travelers.length < 2 || submitting) return; setSubmitting(true); await onSetup(tripData, travelers); };
  const handleJoin = async e => { e.preventDefault(); if (!joinId.trim() || submitting) return; setSubmitting(true); onJoin(joinId.trim()); };

  return (
    <div className={styles.wrap}>
      <div className={styles.bg}><div className={styles.blob1}/><div className={styles.blob2}/></div>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logoMark}><Plane size={22}/></div>
          <h1 className={styles.title}>FamilyTrip</h1>
          <p className={styles.subtitle}>Divide gastos de viaje sin complicaciones</p>
        </div>
        <div className={styles.card}>
          <div className={styles.modeTabs}>
            <button className={`${styles.modeTab} ${mode==='new'?styles.modeActive:''}`} onClick={()=>{setMode('new');setStep(1);}}>✈️ Nuevo viaje</button>
            <button className={`${styles.modeTab} ${mode==='join'?styles.modeActive:''}`} onClick={()=>setMode('join')}>🔗 Unirse a viaje</button>
          </div>

          {mode==='join' && (
            <form onSubmit={handleJoin} className={`${styles.form} animate-fade`}>
              <p className={styles.joinHint}>Pide al creador del viaje que te comparta el <strong>ID del viaje</strong> y pégalo aquí.</p>
              <div className={styles.field}>
                <label>ID del viaje</label>
                <div className={styles.inputWrap}><Link size={16} className={styles.icon}/>
                  <input type="text" placeholder="Ej: abc123XYZ..." value={joinId} onChange={e=>setJoinId(e.target.value)} required/>
                </div>
              </div>
              {error && <div className={styles.errorBox}>⚠️ {error}</div>}
              <button type="submit" className={styles.btnPrimary} disabled={submitting||!joinId.trim()}>
                {submitting?'Buscando...':'Unirse al viaje'} {!submitting&&<ArrowRight size={16}/>}
              </button>
            </form>
          )}

          {mode==='new' && <>
            <div className={styles.steps}>
              <div className={`${styles.step} ${step>=1?styles.active:''}`}><div className={styles.stepDot}>1</div><span>El viaje</span></div>
              <div className={styles.stepLine}/>
              <div className={`${styles.step} ${step>=2?styles.active:''}`}><div className={styles.stepDot}>2</div><span>Viajeros</span></div>
            </div>
            {step===1 && (
              <form onSubmit={e=>{e.preventDefault();if(tripData.name.trim()&&tripData.destination.trim())setStep(2);}} className={`${styles.form} animate-fade`}>
                <div className={styles.field}><label>Nombre del viaje</label>
                  <div className={styles.inputWrap}><Plane size={16} className={styles.icon}/>
                    <input type="text" placeholder="Ej: Vacaciones en Cusco 2025" value={tripData.name} onChange={e=>setTripData(p=>({...p,name:e.target.value}))} required/>
                  </div>
                </div>
                <div className={styles.field}><label>Destino</label>
                  <div className={styles.inputWrap}><MapPin size={16} className={styles.icon}/>
                    <input type="text" placeholder="Ej: Cusco, Perú" value={tripData.destination} onChange={e=>setTripData(p=>({...p,destination:e.target.value}))} required/>
                  </div>
                </div>
                <div className={styles.row2}>
                  <div className={styles.field}><label>Fecha inicio</label>
                    <div className={styles.inputWrap}><Calendar size={16} className={styles.icon}/>
                      <input type="date" value={tripData.startDate} onChange={e=>setTripData(p=>({...p,startDate:e.target.value}))}/>
                    </div>
                  </div>
                  <div className={styles.field}><label>Fecha fin</label>
                    <div className={styles.inputWrap}><Calendar size={16} className={styles.icon}/>
                      <input type="date" value={tripData.endDate} onChange={e=>setTripData(p=>({...p,endDate:e.target.value}))}/>
                    </div>
                  </div>
                </div>
                <div className={styles.field}><label>Moneda</label>
                  <div className={styles.inputWrap}><DollarSign size={16} className={styles.icon}/>
                    <select value={tripData.currency} onChange={e=>setTripData(p=>({...p,currency:e.target.value}))}>
                      {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className={styles.btnPrimary}>Continuar <ArrowRight size={16}/></button>
              </form>
            )}
            {step===2 && (
              <div className={`${styles.form} animate-fade`}>
                <div className={styles.travelerHint}><Users size={16}/><span>Agrega al menos 2 personas ({travelers.length}/8)</span></div>
                <div className={styles.field}><label>Nombre del viajero</label>
                  <div className={styles.addRow}>
                    <div className={styles.inputWrap} style={{flex:1}}><Users size={16} className={styles.icon}/>
                      <input type="text" placeholder="Ej: Mamá, Papá, Juan..." value={newName} onChange={e=>setNewName(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addTraveler())} maxLength={20}/>
                    </div>
                    <button type="button" onClick={addTraveler} className={styles.btnAdd} disabled={!newName.trim()||travelers.length>=8}>+</button>
                  </div>
                </div>
                {travelers.length>0&&<div className={styles.travelerList}>
                  {travelers.map((name,i)=>(
                    <div key={i} className={`${styles.travelerChip} animate-scale`}>
                      <div className={styles.chipAvatar} style={{background:COLORS[i%COLORS.length]}}>{name.slice(0,2).toUpperCase()}</div>
                      <span>{name}</span>
                      <button onClick={()=>setTravelers(p=>p.filter((_,idx)=>idx!==i))} className={styles.chipRemove}>×</button>
                    </div>
                  ))}
                </div>}
                <div className={styles.btnRow}>
                  <button type="button" onClick={()=>setStep(1)} className={styles.btnSecondary}>← Atrás</button>
                  <button type="button" onClick={handleFinish} className={styles.btnPrimary} disabled={travelers.length<2||submitting}>
                    {submitting?'Creando...':'🗺️ Comenzar viaje'}
                  </button>
                </div>
              </div>
            )}
          </>}
        </div>
      </div>
    </div>
  );
}
