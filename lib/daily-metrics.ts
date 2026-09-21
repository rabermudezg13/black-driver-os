type DailyTrip = { fare: number; tip: number; timestamp: string };
/** Uses receipt timestamps, including the gaps between trips. Input is today's trips. */
export function dailyMetrics(trips: DailyTrip[]) {
  const total = trips.reduce((sum, trip) => sum + trip.fare + trip.tip, 0);
  const times = trips.map(trip => Date.parse(trip.timestamp));
  const valid = times.length > 0 && times.every(Number.isFinite);
  const first = valid ? Math.min(...times) : null;
  const last = valid ? Math.max(...times) : null;
  const hours = first !== null && last !== null ? (last - first) / 3600000 : 0;
  return { total, first, last, hours, hourly: hours > 0 ? total / hours : null };
}
