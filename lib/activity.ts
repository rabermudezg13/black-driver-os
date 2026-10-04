import { miamiDay, parseDay } from "./dates";
export function monthRange(month: string) {
  parseDay(`${month}-01`);
  const start = new Date(`${month}-01T00:00:00Z`);
  const next = new Date(start);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return { start: start.toISOString(), end: new Date(next.getTime() + 24 * 3600000).toISOString(), nextMonth: next.toISOString().slice(0, 7) };
}
export function activityDays(month: string, trips: { timestamp: string }[], predictions: { date: string }[]) {
  const days = new Map<string, { date: string; trips: number; predictions: number }>();
  const add = (date: string, kind: "trips" | "predictions") => {
    if (!date.startsWith(`${month}-`)) return;
    const day = days.get(date) ?? { date, trips: 0, predictions: 0 };
    day[kind]++; days.set(date, day);
  };
  trips.forEach(trip => { if (Number.isFinite(new Date(trip.timestamp).getTime())) add(miamiDay(new Date(trip.timestamp)), "trips"); });
  predictions.forEach(prediction => add(prediction.date, "predictions"));
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}
