"use client";
import { useEffect, useState } from "react";
import { miamiDay } from "../lib/dates";
type Day = { date: string; trips: number; predictions: number };
export default function ActivityCalendar({ token, date, busy, revision, onSelect }: { token: string; date: string; busy: boolean; revision: string; onSelect: (date: string) => void }) {
  const [month, setMonth] = useState(date.slice(0, 7));
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { setMonth(date.slice(0, 7)); }, [date]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setDays([]);
    async function load() {
      try {
        const response = await fetch(`/api/activity?month=${month}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!controller.signal.aborted) setDays(data.days);
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "No se pudo cargar el calendario"); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [month, token, revision]);
  const first = new Date(`${month}-01T12:00:00Z`);
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const activity = new Map(days.map(day => [day.date, day]));
  const today = miamiDay(new Date());
  const title = first.toLocaleDateString("es-US", { month: "long", year: "numeric", timeZone: "UTC" });
  function move(amount: number) { const next = new Date(first); next.setUTCMonth(next.getUTCMonth() + amount); setMonth(next.toISOString().slice(0, 7)); }
  return <section className="activityCalendar" aria-label="Calendario de registros">
    <div className="calendarHeader"><button type="button" aria-label="Mes anterior" onClick={() => move(-1)}>‹</button><strong>{title}</strong><button type="button" aria-label="Mes siguiente" onClick={() => move(1)}>›</button></div>
    <div className="calendarGrid">
      {["L", "M", "X", "J", "V", "S", "D"].map(day => <span className="weekday" key={day} aria-hidden="true">{day}</span>)}
      {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}
      {Array.from({ length: count }, (_, index) => {
        const value = `${month}-${String(index + 1).padStart(2, "0")}`;
        const info = activity.get(value);
        return <button type="button" key={value} disabled={busy} className={`calendarDay ${value === date ? "selectedDay" : ""} ${value === today ? "todayDay" : ""}`} aria-pressed={value === date} aria-label={`${value}${info ? `: ${info.trips} viajes y ${info.predictions} predicciones` : loading ? ": cargando información" : error ? ": información no disponible" : ": sin registros"}`} onClick={() => onSelect(value)}>
          <span>{index + 1}</span><span className={`activityDot ${info ? "hasActivity" : ""}`} aria-hidden="true" />
        </button>;
      })}
    </div>
    <p className="muted calendarLegend"><span className="activityDot hasActivity" aria-hidden="true" /> Día con viajes o predicciones</p>
    {loading && <p className="muted" role="status">Cargando fechas…</p>}{error && <p role="alert">{error}</p>}
  </section>;
}
