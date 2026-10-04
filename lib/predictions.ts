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
  if (typeof data.expectedRevenue !== "number" || !Number.isFinite(data.expectedRevenue) || data.expectedRevenue < 0 || data.expectedRevenue > 1000000) throw new Error("Ingresos esperados inválidos");
  return { date, plan: text("plan", true), expectedRevenue: data.expectedRevenue, notes: text("notes") };
}
export type Prediction = ReturnType<typeof parsePrediction> & { id: string; createdAt: string; actualRevenue: number; actualTrips: number };
