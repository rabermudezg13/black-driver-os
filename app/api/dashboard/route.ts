import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { todayTrips } from "../../../lib/trip-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request: Request) {
  const secret = process.env.SHORTCUTS_API_KEY;
  if (!secret) return reply({ error: "Servidor sin configurar" }, 503);
  const hash = (text: string) => createHash("sha256").update(text).digest();
  if (!timingSafeEqual(hash(request.headers.get("authorization") ?? ""), hash(`Bearer ${secret}`))) return reply({ error: "Clave incorrecta" }, 401);
  try { return reply({ trips: await todayTrips() }, 200); }
  catch { return reply({ error: "No se pudieron cargar los viajes. Inténtalo de nuevo." }, 503); }
}
