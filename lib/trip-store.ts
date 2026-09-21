import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { TripInput } from "./trips";

export function isStorageConfigured() {
  return Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);
}
export async function saveTrip(id: string, input: TripInput) {
  const app = getApps().find(app => app.name === "trips") ?? initializeApp({ credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }) }, "trips");
  const db = getFirestore(app);
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
