"use client";
import { useEffect, useRef, useState } from "react";
import { dailyMetrics } from "../lib/daily-metrics";
import type { TripInput } from "../lib/trips";
import { miamiDay } from "../lib/dates";
import ActivityCalendar from "./activity-calendar";
import PredictionJournal from "./prediction-journal";
type Trip = TripInput & { id: string; timestamp: string };
const money = (value: number) => new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" }).format(value);
export default function Home() {
  const [key, setKey] = useState("");
  const access = useRef("");
  const selectedDay = useRef(miamiDay(new Date()));
  const [date, setDate] = useState(selectedDay.current);
  const loading = useRef(false);
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [calendarRevision, setCalendarRevision] = useState(0);
  const [updated, setUpdated] = useState("");
  async function refresh(token: string, day = selectedDay.current) {
    if (loading.current) return;
    loading.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/dashboard?date=${encodeURIComponent(day)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudieron cargar los viajes");
      access.current = token; selectedDay.current = data.date; setDate(data.date); setKey(""); setTrips(data.trips); setCalendarRevision(value => value + 1);
      setUpdated(new Date().toLocaleTimeString("es-US", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) { setError(e instanceof Error ? e.message : "Error de conexión"); }
    finally { loading.current = false; setBusy(false); }
  }
  async function removeTrip(trip: Trip) {
    if (loading.current || !window.confirm(`¿Borrar el viaje de ${trip.zone} (${trip.service}) por ${money(trip.fare + trip.tip)}? Esta acción es permanente.`)) return;
    loading.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/dashboard?id=${encodeURIComponent(trip.id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${access.current}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo borrar el viaje");
      setTrips(previous => previous?.filter(item => item.id !== trip.id) ?? null); setCalendarRevision(value => value + 1);
      setUpdated(new Date().toLocaleTimeString("es-US", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) { setError(e instanceof Error ? e.message : "Error de conexión"); }
    finally { loading.current = false; setBusy(false); }
  }
  useEffect(() => {
    const timer = setInterval(() => { if (access.current) void refresh(access.current); }, 30000);
    return () => clearInterval(timer);
  }, []);
  const daily = dailyMetrics(trips ?? []);
  const revenue = daily.total;
  const clock = (time: number) => new Date(time).toLocaleTimeString("es-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit" });
  const waiting = trips?.reduce((sum, trip) => sum + trip.waitingMinutes, 0) ?? 0;
  return <main>
    <header className="hero"><div><p className="eyebrow">BLACK DRIVER OS</p><h1>Tus viajes, Rodrigo.</h1><p className="muted">Ingresos reales de tus viajes registrados.</p></div></header>
    {error && <p role="alert" className="card">{error}</p>}
    {trips === null ? <form className="card" onSubmit={event => { event.preventDefault(); void refresh(key.trim()); }}>
      <h2>Accede a tus registros</h2><p className="muted">Usa la misma clave de tu atajo. Se conserva solo mientras esta página esté abierta.</p>
      <label htmlFor="access-key">Clave de acceso</label>
      <input id="access-key" type="password" value={key} onChange={event => setKey(event.target.value)} required autoComplete="off" />
      <div className="actions"><button className="primary" disabled={busy}>{busy ? "Cargando…" : "Ver mis viajes"}</button></div>
    </form> : <>
      <div className="card"><ActivityCalendar token={access.current} date={date} busy={busy} revision={String(calendarRevision)} onSelect={day => void refresh(access.current, day)} /><label htmlFor="trips-date">Consultar viajes por fecha · Miami</label><input id="trips-date" type="date" value={date} disabled={busy} onChange={event => { if (event.target.value) void refresh(access.current, event.target.value); }} /><div className="actions"><button disabled={busy} onClick={() => void refresh(access.current, miamiDay(new Date()))}>Ver hoy</button></div></div>
      <p className="muted">{date === miamiDay(new Date()) ? "Hoy" : date} · Hora de Miami · Actualizado {updated}</p>
      <section className="metrics dailySummary" aria-label="Resumen del día">
        <article><p>Total del día</p><strong>{money(daily.total)}</strong><small>Tarifas + propinas · Sin descontar gastos</small></article>
        <article><p>Promedio por hora del día</p><strong>{daily.hourly === null ? "—" : `${money(daily.hourly)}/h`}</strong><small>{daily.hourly === null ? "Se necesitan dos viajes registrados a distintas horas" : `${clock(daily.first!)} – ${clock(daily.last!)} · ${daily.hours.toFixed(2)} h`}</small></article>
      </section>
      <p className="muted">Total de la fecha seleccionada ÷ tiempo entre el primer y el último registro, incluidas las pausas. Se usa la hora en que guardas cada viaje.</p>
      <section className="metrics">
        <article><p>Viajes</p><strong>{trips.length}</strong><small>{date}</small></article>
        <article><p>Promedio por viaje</p><strong>{money(trips.length ? revenue / trips.length : 0)}</strong><small>Incluye propinas</small></article>
        <article><p>Espera</p><strong>{waiting} min</strong><small>Total registrado</small></article>
      </section>
      <div className="actions"><button disabled={busy} onClick={() => void refresh(access.current)}>{busy ? "Actualizando…" : "Actualizar viajes"}</button><button disabled={busy} onClick={() => { access.current = ""; setTrips(null); setError(""); }}>Cerrar vista</button></div>
      <PredictionJournal token={access.current} date={date} onSaved={() => setCalendarRevision(value => value + 1)} />
      <section className="card"><h2>Seguimiento por filtros activos</h2><p className="muted">Agrupado por los filtros que tenías activos al recibir cada carrera. Ingresos incluyen propinas.</p>
        {[...new Set(trips.map(trip => trip.activeFilters ?? "No registrados"))].map(filters => {
          const group = trips.filter(trip => (trip.activeFilters ?? "No registrados") === filters);
          const total = group.reduce((sum, trip) => sum + trip.fare + trip.tip, 0);
          return <div className="trip" key={filters}><div><strong>{filters}</strong><p>{group.length} viajes · Espera {group.reduce((sum, trip) => sum + trip.waitingMinutes, 0)} min</p></div><div className="money"><strong>{money(total)}</strong><p>Promedio {money(total / group.length)} por viaje</p></div></div>;
        })}
        {!trips.length && <p className="muted">Sin viajes para comparar en esta fecha.</p>}
      </section>
      <section className="card"><div className="sectionTitle"><h2>Viajes del {date}</h2></div>
        {trips.length === 0 && <p className="muted">No hay viajes registrados para esta fecha.</p>}
        {trips.map(trip => <div className="trip" key={trip.id}><div><strong>{trip.zone}</strong><p>Filtros activos: {trip.activeFilters ?? "No registrados"}</p><p>{trip.service} · {new Date(trip.timestamp).toLocaleTimeString("es-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit" })}</p><p>{trip.miles} mi · {trip.tripMinutes} min · Espera {trip.waitingMinutes} min</p></div><div className="money"><strong>{money(trip.fare + trip.tip)}</strong><p>{money(trip.tip)} de propina</p><button className="deleteTrip" disabled={busy} onClick={() => void removeTrip(trip)} aria-label={`Borrar viaje de ${trip.zone} por ${money(trip.fare + trip.tip)}`}>Borrar</button></div></div>)}
      </section><p className="muted">Se actualiza automáticamente cada 30 segundos.</p>
    </>}
  </main>;
}
