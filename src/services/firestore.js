/**
 * Capa de servicio Firebase Firestore
 *
 * Estructura en Firestore:
 *
 *  trips/{tripId}
 *    ├── name, destination, currency, startDate, endDate, createdAt
 *    ├── travelers/ (subcolección)
 *    │     └── {travelerId}  →  { name, avatar, color, order }
 *    └── expenses/ (subcolección)
 *          └── {expenseId}   →  { desc, amount, paidBy, splitAmong, category, date, note, createdAt }
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Trip ────────────────────────────────────────────────────────────────────

export async function createTrip(tripData) {
  const ref = await addDoc(collection(db, 'trips'), {
    ...tripData,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTrip(tripId, data) {
  await updateDoc(doc(db, 'trips', tripId), data);
}

// ─── Travelers ───────────────────────────────────────────────────────────────

export async function addTraveler(tripId, traveler) {
  const ref = doc(collection(db, 'trips', tripId, 'travelers'));
  await setDoc(ref, { ...traveler, id: ref.id, createdAt: serverTimestamp() });
  return ref.id;
}

export async function removeTraveler(tripId, travelerId) {
  await deleteDoc(doc(db, 'trips', tripId, 'travelers', travelerId));
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export async function addExpense(tripId, expense) {
  const ref = doc(collection(db, 'trips', tripId, 'expenses'));
  await setDoc(ref, { ...expense, id: ref.id, createdAt: serverTimestamp() });
  return ref.id;
}

export async function removeExpense(tripId, expenseId) {
  await deleteDoc(doc(db, 'trips', tripId, 'expenses', expenseId));
}

export async function updateExpense(tripId, expenseId, data) {
  await updateDoc(doc(db, 'trips', tripId, 'expenses', expenseId), data);
}

// ─── Realtime listeners ───────────────────────────────────────────────────────

export function subscribeTrip(tripId, onData, onError) {
  return onSnapshot(doc(db, 'trips', tripId), (snap) => {
    if (snap.exists()) {
      onData({ id: snap.id, ...snap.data() });
    } else {
      onError?.(new Error('Viaje no encontrado'));
    }
  }, onError);
}

export function subscribeTravelers(tripId, onData, onError) {
  const q = query(
    collection(db, 'trips', tripId, 'travelers'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  }, onError);
}

export function subscribeExpenses(tripId, onData, onError) {
  const q = query(
    collection(db, 'trips', tripId, 'expenses'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  }, onError);
}
