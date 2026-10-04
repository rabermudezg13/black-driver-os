import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { TripInput } from "./trips";
import { miamiDay, parseDay } from "./dates";

export function isStorageConfigured() {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}
export function database() {
  const app = getApps().find(app => app.name === "trips") ?? initializeApp({ credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }) }, "trips");
  return getFirestore(app);
}
export async function saveTrip(id: string, input: TripInput) {
  const db = database();
  const ref = db.collection("trips").doc(id);
  return db.runTransaction(async transaction => {
    const previous = await transaction.get(ref);
    if (previous.exists) {
      const trip = previous.data()!;
      if (Object.entries(input).some(([key, value]) => trip[key] !== value)) return { conflict: true as const };
      return { conflict: false as const, duplicate: true, trip: { ...trip, id } };
    }
    const trip = { ...input, timestamp: new Date().toISOString() };
    transaction.create(ref, trip);
    return { conflict: false as const, duplicate: false, trip: { ...trip, id } };
  });
}

export async function tripsForDay(date: string) {
  parseDay(date);
  const start = new Date(`${date}T00:00:00Z`);
  const snapshot = await database().collection("trips")
    .where("timestamp", ">=", start.toISOString())
    .where("timestamp", "<", new Date(start.getTime() + 48 * 3600000).toISOString())
    .orderBy("timestamp", "desc").get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TripInput & { id: string; timestamp: string }))
    .filter(trip => miamiDay(new Date(trip.timestamp)) === date);
}
export async function todayTrips() {
  return tripsForDay(miamiDay(new Date()));
}

export async function deleteTrip(id: string) {
  await database().collection("trips").doc(id).delete();
}
