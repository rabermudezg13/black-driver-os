export const allowedServices = ["Black", "Black SUV", "Premier", "Comfort", "XL", "Private"];

export function parseTrip(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Expected a JSON object");
  const data = body as Record<string, unknown>;
  if (typeof data.zone !== "string" || !data.zone.trim() || data.zone.trim().length > 120) throw new Error("zone must contain 1–120 characters");
  if (typeof data.service !== "string" || !allowedServices.includes(data.service)) throw new Error("Invalid service");
  const number = (key: string, optional = false) => {
    const raw = data[key] === undefined && optional ? 0 : data[key];
    if (typeof raw !== "number" && (typeof raw !== "string" || !/^\d+(\.\d+)?$/.test(raw.trim()))) throw new Error(`${key} must be a non-negative number`);
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value > 1000000) throw new Error(`${key} is outside the allowed range`);
    return value;
  };
  return { zone: data.zone.trim(), service: data.service, fare: number("fare"), tip: number("tip", true), miles: number("miles"), waitingMinutes: number("waitingMinutes", true), tripMinutes: number("tripMinutes") };
}
export type TripInput = ReturnType<typeof parseTrip>;
