import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export async function createTrip(tripData) {
  const ref = await addDoc(collection(db, 'trips'), { ...tripData, createdAt: serverTimestamp() });
  return ref.id;
}
export async function updateTrip(tripId, data) { await updateDoc(doc(db, 'trips', tripId), data); }

export async function addTraveler(tripId, traveler) {
  const ref = doc(collection(db, 'trips', tripId, 'travelers'));
  await setDoc(ref, { ...traveler, id: ref.id, createdAt: serverTimestamp() });
  return ref.id;
}
export async function removeTraveler(tripId, travelerId) { await deleteDoc(doc(db, 'trips', tripId, 'travelers', travelerId)); }

export async function addExpense(tripId, expense) {
  const ref = doc(collection(db, 'trips', tripId, 'expenses'));
  await setDoc(ref, { ...expense, id: ref.id, createdAt: serverTimestamp() });
  return ref.id;
}
export async function removeExpense(tripId, expenseId) { await deleteDoc(doc(db, 'trips', tripId, 'expenses', expenseId)); }
export async function updateExpense(tripId, expenseId, data) { await updateDoc(doc(db, 'trips', tripId, 'expenses', expenseId), data); }

export function subscribeTrip(tripId, onData, onError) {
  return onSnapshot(doc(db, 'trips', tripId), snap => {
    if (snap.exists()) onData({ id: snap.id, ...snap.data() });
    else onError?.(new Error('Viaje no encontrado'));
  }, onError);
}
export function subscribeTravelers(tripId, onData, onError) {
  return onSnapshot(query(collection(db, 'trips', tripId, 'travelers'), orderBy('createdAt', 'asc')),
    snap => onData(snap.docs.map(d => ({ ...d.data(), id: d.id }))), onError);
}
export function subscribeExpenses(tripId, onData, onError) {
  return onSnapshot(query(collection(db, 'trips', tripId, 'expenses'), orderBy('createdAt', 'desc')),
    snap => onData(snap.docs.map(d => ({ ...d.data(), id: d.id }))), onError);
}
