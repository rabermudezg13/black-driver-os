import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { TripInput } from "./trips";

export function isStorageConfigured() {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}
function database() {
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

export async function todayTrips() {
  const now = new Date();
  const day = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const snapshot = await database().collection("trips").where("timestamp", ">=", new Date(now.getTime() - 48 * 3600000).toISOString()).orderBy("timestamp", "desc").get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TripInput & { id: string; timestamp: string })).filter(trip => day(new Date(trip.timestamp)) === day(now));
}
