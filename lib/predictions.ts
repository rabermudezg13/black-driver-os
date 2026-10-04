import { parseDay } from "./dates";
export { miamiDay } from "./dates";
export function parsePrediction(body: unknown) {
  if (!body || typeof body !== "object") throw new Error("Predicción inválida");
  const data = body as Record<string, unknown>;
  const date = parseDay(data.date);
  const text = (key: string, required = false) => {
    if (typeof data[key] !== "string" || (data[key] as string).length > 4000 || (required && !(data[key] as string).trim())) throw new Error(`Revisa ${key}`);
    return (data[key] as string).trim();
  };
  const rawRevenue = data.expectedRevenue;
  if (typeof rawRevenue !== "number" && (typeof rawRevenue !== "string" || !/^\d+(\.\d+)?$/.test(rawRevenue.trim()))) throw new Error("Ingresos esperados inválidos");
  const expectedRevenue = Number(rawRevenue);
  if (!Number.isFinite(expectedRevenue) || expectedRevenue < 0 || expectedRevenue > 1000000) throw new Error("Ingresos esperados inválidos");
  return { date, plan: text("plan", true), expectedRevenue, notes: text("notes") };
}
export type Prediction = ReturnType<typeof parsePrediction> & { id: string; createdAt: string; actualRevenue: number; actualTrips: number };
