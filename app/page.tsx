const trips = [
  { zone: "Brickell", service: "Black SUV", revenue: 62, tip: 12 },
  { zone: "MIA Airport", service: "Black", revenue: 48, tip: 8 },
];

export default function Home() {
  const revenue = trips.reduce((sum, trip) => sum + trip.revenue + trip.tip, 0);
  return (
    <main>
      <header className="hero">
        <div><p className="eyebrow">BLACK DRIVER OS</p><h1>Good evening, Rodrigo.</h1><p className="muted">Drive with data. Earn with intention.</p></div>
        <div className="status"><span /> Shift active</div>
      </header>
      <section className="metrics">
        <article><p>Today's revenue</p><strong>${revenue}</strong><small>Gross + tips</small></article>
        <article><p>Trips</p><strong>{trips.length}</strong><small>Today</small></article>
        <article><p>Avg. trip</p><strong>${Math.round(revenue / trips.length)}</strong><small>Including tips</small></article>
        <article><p>Waiting</p><strong>34m</strong><small>Track to optimize</small></article>
      </section>
      <section className="actions">
        <button className="primary">＋ Trip Completed</button>
        <button>◷ Start Waiting</button>
        <button>■ End Shift</button>
      </section>
      <section className="card">
        <div className="sectionTitle"><div><p className="eyebrow">TODAY</p><h2>Recent trips</h2></div><button className="textButton">View all</button></div>
        {trips.map((trip) => <div className="trip" key={trip.zone}><div><strong>{trip.zone}</strong><p>{trip.service}</p></div><div className="money"><strong>${trip.revenue + trip.tip}</strong><p>${trip.tip} tip</p></div></div>)}
      </section>
      <section className="insight"><p className="eyebrow">DRIVER INSIGHT</p><h2>Your data will become your advantage.</h2><p>Once Firebase is connected, Black Driver OS will learn which zones, hours and services produce your strongest $/hour.</p></section>
    </main>
  );
}