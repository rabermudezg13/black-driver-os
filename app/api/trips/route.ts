import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { parseTrip } from "../../../lib/trips";
import { isStorageConfigured, saveTrip } from "../../../lib/trip-store";

export const runtime = "nodejs";
const reply = (body: unknown, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request: Request) {
  const secret = process.env.SHORTCUTS_API_KEY;
  if (!secret) return reply({ ok: false, error: "Server is not configured" }, 503);
  const hash = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(hash(request.headers.get("authorization") ?? ""), hash(`Bearer ${secret}`))) return reply({ ok: false, error: "Unauthorized" }, 401);
  if (!isStorageConfigured()) return reply({ ok: false, error: "Storage is not configured" }, 503);
  const key = request.headers.get("idempotency-key");
  if (key !== null && !/^[a-zA-Z0-9_-]{1,128}$/.test(key)) return reply({ ok: false, error: "Invalid Idempotency-Key" }, 400);
  let input;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 16384) return reply({ ok: false, error: "Request too large" }, 413);
    input = parseTrip(JSON.parse(raw));
  } catch (error) {
    return reply({ ok: false, error: error instanceof SyntaxError ? "Invalid JSON" : error instanceof Error ? error.message : "Invalid trip" }, 400);
  }
  try {
    const result = await saveTrip(key ?? randomUUID(), input);
    if (result.conflict) return reply({ ok: false, error: "Idempotency-Key already used with different trip data" }, 409);
    return reply({ ok: true, message: result.duplicate ? "Trip already saved" : "Trip saved", duplicate: result.duplicate, trip: result.trip }, result.duplicate ? 200 : 201);
  } catch {
    return reply({ ok: false, error: "Unable to save trip. Retry with the same Idempotency-Key." }, 503);
  }
}
export async function GET() {
  const configured = Boolean(process.env.SHORTCUTS_API_KEY) && isStorageConfigured();
  return reply({ ok: configured, service: "Black Driver OS Trips API", status: configured ? "configured" : "configuration_required" }, configured ? 200 : 503);
}
