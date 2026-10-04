import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { database } from "../../../lib/trip-store";
import { activityDays, monthRange } from "../../../lib/activity";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: Request) {
  const secret = process.env.SHORTCUTS_API_KEY;
  if (!secret) return reply({ error: "Servidor sin configurar" }, 503);
  const hash = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(hash(request.headers.get("authorization") ?? ""), hash(`Bearer ${secret}`))) return reply({ error: "Clave incorrecta" }, 401);
  const month = new URL(request.url).searchParams.get("month") ?? "";
  let range;
  try { range = monthRange(month); } catch { return reply({ error: "Mes inválido" }, 400); }
  try {
    const db = database();
    const [trips, predictions] = await Promise.all([
      db.collection("trips").where("timestamp", ">=", range.start).where("timestamp", "<", range.end).select("timestamp").get(),
      db.collection("predictions").where("date", ">=", `${month}-01`).where("date", "<", `${range.nextMonth}-01`).select("date").get(),
    ]);
    return reply({ days: activityDays(month, trips.docs.map(doc => doc.data() as { timestamp: string }), predictions.docs.map(doc => doc.data() as { date: string })) });
  } catch { return reply({ error: "No se pudieron cargar las fechas con información" }, 503); }
}
