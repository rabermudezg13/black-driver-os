export const miamiDay = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
export function parsePrediction(body: unknown) {
  if (!body || typeof body !== "object") throw new Error("Predicción inválida");
  const data = body as Record<string, unknown>;
  if (typeof data.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.date) || new Date(`${data.date}T12:00:00Z`).toISOString().slice(0, 10) !== data.date) throw new Error("Fecha inválida");
  const text = (key: string, required = false) => {
    if (typeof data[key] !== "string" || (data[key] as string).length > 4000 || (required && !(data[key] as string).trim())) throw new Error(`Revisa ${key}`);
    return (data[key] as string).trim();
  };
  if (typeof data.expectedRevenue !== "number" || !Number.isFinite(data.expectedRevenue) || data.expectedRevenue < 0 || data.expectedRevenue > 1000000) throw new Error("Ingresos esperados inválidos");
  return { date: data.date, plan: text("plan", true), expectedRevenue: data.expectedRevenue, notes: text("notes") };
}
export type Prediction = ReturnType<typeof parsePrediction> & { id: string; createdAt: string; actualRevenue: number; actualTrips: number };
