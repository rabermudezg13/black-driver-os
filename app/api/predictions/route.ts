import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { database, isStorageConfigured } from "../../../lib/trip-store";
import { parseDay } from "../../../lib/dates";
import { miamiDay, parsePrediction } from "../../../lib/predictions";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
function authorize(request: Request) {
  const secret = process.env.SHORTCUTS_API_KEY;
  if (!secret || !isStorageConfigured()) return reply({ error: "Servidor sin configurar" }, 503);
  const hash = (text: string) => createHash("sha256").update(text).digest();
  if (!timingSafeEqual(hash(request.headers.get("authorization") ?? ""), hash(`Bearer ${secret}`))) return reply({ error: "Clave incorrecta" }, 401);
}
export async function GET(request: Request) {
  const denied = authorize(request); if (denied) return denied;
  const requestedDate = new URL(request.url).searchParams.get("date");
  if (requestedDate !== null) { try { parseDay(requestedDate); } catch { return reply({ error: "Fecha inválida" }, 400); } }
  try {
    const db = database();
    const snapshot = requestedDate === null
      ? await db.collection("predictions").orderBy("createdAt", "desc").limit(100).get()
      : await db.collection("predictions").where("date", "==", requestedDate).get();
    const dates = [...new Set(snapshot.docs.map(doc => doc.data().date as string))];
    const totals = new Map(await Promise.all(dates.map(async date => {
      const start = new Date(`${date}T00:00:00Z`);
      const trips = await db.collection("trips").where("timestamp", ">=", start.toISOString()).where("timestamp", "<", new Date(start.getTime() + 48 * 3600000).toISOString()).get();
      const matching = trips.docs.map(doc => doc.data()).filter(trip => miamiDay(new Date(trip.timestamp)) === date);
      return [date, { actualRevenue: matching.reduce((sum, trip) => sum + trip.fare + trip.tip, 0), actualTrips: matching.length }] as const;
    })));
    return reply({ predictions: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, ...totals.get(doc.data().date) })) });
  } catch { return reply({ error: "No se pudo cargar el diario" }, 503); }
}
export async function POST(request: Request) {
  const denied = authorize(request); if (denied) return denied;
  let prediction;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 20000) return reply({ error: "Predicción demasiado larga" }, 413);
    prediction = parsePrediction(JSON.parse(raw));
  } catch { return reply({ error: "Revisa la fecha, el plan y los ingresos esperados" }, 400); }
  try {
    const id = randomUUID();
    await database().collection("predictions").doc(id).create({ ...prediction, createdAt: new Date().toISOString() });
    return reply({ ok: true, id }, 201);
  } catch { return reply({ error: "No se pudo guardar la predicción" }, 503); }
}
