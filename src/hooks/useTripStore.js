import { useState, useEffect, useCallback } from 'react';
import * as svc from '../services/firestore';

const TRIP_ID_KEY = 'familytrip_tripId';
const COLORS = ['#c8502a','#2a6fa8','#3a7a52','#d4a017','#7a3a8a','#2a8a8a','#a85028','#5a7a2a'];

export function useTripStore() {
  const [tripId, setTripId]       = useState(() => localStorage.getItem(TRIP_ID_KEY));
  const [trip, setTrip]           = useState(null);
  const [travelers, setTravelers] = useState([]);
  const [expenses, setExpenses]   = useState([]);
  const [loading, setLoading]     = useState(!!localStorage.getItem(TRIP_ID_KEY));
  const [error, setError]         = useState(null);

  useEffect(() => {
    if (tripId) localStorage.setItem(TRIP_ID_KEY, tripId);
    else localStorage.removeItem(TRIP_ID_KEY);
  }, [tripId]);

  useEffect(() => {
    if (!tripId) { setLoading(false); return; }
    setLoading(true); setError(null);
    const unsubs = [
      svc.subscribeTrip(tripId, data => { setTrip(data); setLoading(false); }, err => { setError(err.message); setLoading(false); }),
      svc.subscribeTravelers(tripId, setTravelers, e => console.error(e)),
      svc.subscribeExpenses(tripId, setExpenses, e => console.error(e)),
    ];
    return () => unsubs.forEach(u => u());
  }, [tripId]);

  const createTrip = useCallback(async (tripData, travelerNames) => {
    try {
      setLoading(true);
      const id = await svc.createTrip(tripData);
      for (let i = 0; i < travelerNames.length; i++) {
        const name = travelerNames[i].trim();
        await svc.addTraveler(id, { name, avatar: name.slice(0,2).toUpperCase(), color: COLORS[i % COLORS.length], order: i });
      }
      setTripId(id);
    } catch (err) { setError(err.message); setLoading(false); }
  }, []);

  const joinTrip  = useCallback(id => setTripId(id.trim()), []);
  const leaveTrip = useCallback(() => { setTripId(null); setTrip(null); setTravelers([]); setExpenses([]); }, []);

  const addTraveler    = useCallback(async name => {
    if (!tripId) return;
    const trimmed = name.trim();
    await svc.addTraveler(tripId, { name: trimmed, avatar: trimmed.slice(0,2).toUpperCase(), color: COLORS[travelers.length % COLORS.length], order: travelers.length });
  }, [tripId, travelers.length]);

  const removeTraveler = useCallback(async id => { if (tripId) await svc.removeTraveler(tripId, id); }, [tripId]);
  const addExpense     = useCallback(async exp => { if (tripId) await svc.addExpense(tripId, exp); }, [tripId]);
  const removeExpense  = useCallback(async id  => { if (tripId) await svc.removeExpense(tripId, id); }, [tripId]);
  const updateExpense  = useCallback(async (id, data) => { if (tripId) await svc.updateExpense(tripId, id, data); }, [tripId]);

  return { state: { trip, travelers, expenses }, tripId, loading, error, createTrip, joinTrip, leaveTrip, addTraveler, removeTraveler, addExpense, removeExpense, updateExpense };
}
