"use client";
import { useEffect, useState } from "react";
import { miamiDay, type Prediction } from "../lib/predictions";
const money = (value: number) => new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" }).format(value);
export default function PredictionJournal({ token, date: selectedDate, onSaved }: { token: string; date: string; onSaved: () => void }) {
  const [entries, setEntries] = useState<Prediction[]>([]);
  const [date, setDate] = useState(selectedDate);
  const [plan, setPlan] = useState("");
  const [revenue, setRevenue] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  async function load(signal?: AbortSignal) {
    const response = await fetch(`/api/predictions?date=${encodeURIComponent(selectedDate)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo cargar el diario");
    if (signal?.aborted) return;
    setEntries(data.predictions.sort((a: Prediction, b: Prediction) => b.createdAt.localeCompare(a.createdAt))); setLoaded(true);
  }
  useEffect(() => { setDate(selectedDate); }, [selectedDate]);
  useEffect(() => {
    const controller = new AbortController();
    setLoaded(false); setError(""); setEntries([]);
    void load(controller.signal).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [token, selectedDate]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/predictions", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ date, plan, expectedRevenue: Number(revenue), notes }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar");
      setPlan(""); setRevenue(""); setNotes(""); setMessage("Predicción guardada."); onSaved(); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Error de conexión"); }
    finally { setBusy(false); }
  }
  return <section className="card journal">
    <h2>Diario de predicciones</h2>
    <p className="muted">Guarda tu plan antes de conducir y compáralo con los viajes registrados. Cada predicción conserva su fecha de creación.</p>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <form onSubmit={save}>
      <label htmlFor="prediction-date">Día previsto · Miami</label><input id="prediction-date" type="date" required value={date} onChange={e => setDate(e.target.value)} />
      <label htmlFor="prediction-plan">Zonas, horarios y demanda esperada</label><textarea id="prediction-plan" required maxLength={4000} rows={4} placeholder="Brickell de 4 a 6 PM; Beach por la noche…" value={plan} onChange={e => setPlan(e.target.value)} />
      <label htmlFor="prediction-revenue">Ingresos esperados ($, con propinas)</label><input id="prediction-revenue" type="number" min="0" max="1000000" step="0.01" required value={revenue} onChange={e => setRevenue(e.target.value)} />
      <label htmlFor="prediction-notes">Motivos y notas</label><textarea id="prediction-notes" rows={3} maxLength={4000} value={notes} onChange={e => setNotes(e.target.value)} />
      <div className="actions"><button className="primary" disabled={busy}>{busy ? "Guardando…" : "Guardar predicción"}</button><button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await load(); } catch (e) { setError(e instanceof Error ? e.message : "Error de conexión"); } finally { setBusy(false); } }}>Actualizar comparación</button></div>
    </form>
    <p className="muted">Predicciones de {selectedDate}. Ingresos reales = tarifas + propinas del día completo, sin descontar gastos. La comparación de hoy es parcial; las zonas y horarios se revisan leyendo tu plan y los viajes.</p>
    {!loaded && !error && <p>Cargando diario…</p>}
    {loaded && !entries.filter(entry => entry.date === selectedDate).length && <p className="muted">No hay predicciones guardadas para esta fecha.</p>}
    {entries.filter(entry => entry.date === selectedDate).map(entry => {
      const future = entry.date > miamiDay(new Date());
      return <article className="journalEntry" key={entry.id}>
        <h3>{entry.date} {entry.date === miamiDay(new Date()) ? "· En curso" : future ? "· Pendiente" : ""}</h3>
        <p className="preserveLines">{entry.plan}</p>
        <p>Previsto: <strong>{money(entry.expectedRevenue)}</strong> · Registrado: <strong>{future ? "—" : money(entry.actualRevenue)}</strong></p>
        {!future && <p className="muted">{entry.actualTrips} viajes · Diferencia: {money(entry.actualRevenue - entry.expectedRevenue)}{!entry.actualTrips ? " · Sin viajes registrados; no confirma ausencia de actividad." : ""}</p>}
        {entry.notes && <p className="muted preserveLines">{entry.notes}</p>}
        <small className="muted">Guardada {new Date(entry.createdAt).toLocaleString("es-US", { timeZone: "America/New_York" })} · Miami</small>
      </article>;
    })}
  </section>;
}
