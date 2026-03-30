import { useState, useEffect, useRef } from "react";

const API = "https://car-price-pred-2.onrender.com/api";
const fmt = n => "₹" + Number(n).toLocaleString("en-IN");

const COLORS = ["#e8d5a3","#c4a35a","#6dbf8a","#7eb8e0","#e07060","#b388dd","#f0a070","#70c8c0"];

export default function Trends() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const brandRef = useRef(null);
  const fuelRef  = useRef(null);
  const yearRef  = useRef(null);
  const charts   = useRef({});

  useEffect(() => {
    fetch(`${API}/stats`)
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => { setError("Could not load stats. Ensure backend is running."); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!stats) return;
    const Chart = window.Chart;
    if (!Chart) return;

    const destroy = id => { if (charts.current[id]) { charts.current[id].destroy(); delete charts.current[id]; } };

    // Brand avg price
    if (brandRef.current) {
      destroy("brand");
      const brands = Object.entries(stats.brand_avg).sort((a,b)=>b[1]-a[1]);
      charts.current.brand = new Chart(brandRef.current, {
        type: "bar",
        data: {
          labels: brands.map(b=>b[0]),
          datasets: [{ data: brands.map(b=>b[1]), backgroundColor: COLORS, borderRadius: 4, borderSkipped: false }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.raw) } } },
          scales: {
            x: { ticks: { color:"#888580", font:{size:11} }, grid:{ color:"rgba(255,255,255,0.04)" } },
            y: { ticks: { color:"#888580", font:{size:11}, callback: v => "₹"+Math.round(v/100000)+"L" }, grid:{ color:"rgba(255,255,255,0.06)" } }
          }
        }
      });
    }

    // Fuel distribution
    if (fuelRef.current) {
      destroy("fuel");
      const fuels = Object.entries(stats.fuel_dist);
      charts.current.fuel = new Chart(fuelRef.current, {
        type: "doughnut",
        data: {
          labels: fuels.map(f=>f[0]),
          datasets: [{ data: fuels.map(f=>f[1]), backgroundColor: COLORS, borderWidth: 0 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: "65%",
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: c => `${c.label}: ${c.raw.toLocaleString()} cars` } }
          }
        }
      });
    }

    // Year avg price trend
    if (yearRef.current) {
      destroy("year");
      const years = Object.entries(stats.year_avg).filter(([y])=>+y>=2015).sort((a,b)=>a[0]-b[0]);
      charts.current.year = new Chart(yearRef.current, {
        type: "line",
        data: {
          labels: years.map(y=>y[0]),
          datasets: [{
            data: years.map(y=>y[1]),
            borderColor: "#e8d5a3", backgroundColor: "rgba(232,213,163,0.08)",
            borderWidth: 2, pointBackgroundColor: "#c4a35a", pointRadius: 4, fill: true, tension: 0.4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend:{ display:false }, tooltip:{ callbacks:{ label: c => fmt(c.raw) } } },
          scales: {
            x: { ticks:{ color:"#888580", font:{size:11} }, grid:{ color:"rgba(255,255,255,0.04)" } },
            y: { ticks:{ color:"#888580", font:{size:11}, callback: v=>"₹"+Math.round(v/100000)+"L" }, grid:{ color:"rgba(255,255,255,0.06)" } }
          }
        }
      });
    }

    return () => { ["brand","fuel","year"].forEach(destroy); };
  }, [stats]);

  if (loading) return <div style={{color:"var(--muted)",padding:"48px 0",textAlign:"center"}}><span className="spinner"/>Loading market data…</div>;
  if (error)   return <div className="error-msg">{error}</div>;

  const fuels      = Object.entries(stats.fuel_dist);
  const totalCars  = fuels.reduce((s,[,v])=>s+v,0);

  return (
    <>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" />

      <div className="metric-grid">
        {[
          { label: "Avg price",    value: fmt(stats.avg_price) },
          { label: "Median price", value: fmt(stats.median_price) },
          { label: "Total records",value: stats.total_cars.toLocaleString() },
          { label: "Brands tracked",value: Object.keys(stats.brand_avg).length },
        ].map(m => (
          <div className="metric" key={m.label}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Brand chart */}
      <div className="card">
        <div className="card-title">Average price by brand</div>
        <div style={{position:"relative",width:"100%",height:260}}>
          <canvas ref={brandRef}></canvas>
        </div>
      </div>

      <div className="two-col">
        {/* Fuel donut */}
        <div className="card">
          <div className="card-title">Fuel type distribution</div>
          <div style={{position:"relative",width:"100%",height:220}}>
            <canvas ref={fuelRef}></canvas>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px 16px",marginTop:16}}>
            {fuels.map(([f,v],i)=>(
              <span key={f} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--muted)"}}>
                <span style={{width:10,height:10,borderRadius:2,background:COLORS[i],display:"inline-block"}}/>
                {f} — {Math.round(v/totalCars*100)}%
              </span>
            ))}
          </div>
        </div>

        {/* Year trend */}
        <div className="card">
          <div className="card-title">Avg price by model year</div>
          <div style={{position:"relative",width:"100%",height:220}}>
            <canvas ref={yearRef}></canvas>
          </div>
          <div style={{fontSize:12,color:"var(--muted)",marginTop:12}}>
            Newer cars command a significant premium — electric & hybrid models drive 2023–25 averages up.
          </div>
        </div>
      </div>

      {/* Top brands table */}
      <div className="card">
        <div className="card-title">Brand price ranking</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Rank</th><th>Brand</th><th>Avg market price</th><th>Segment</th></tr></thead>
            <tbody>
              {Object.entries(stats.brand_avg)
                .sort((a,b)=>b[1]-a[1])
                .map(([brand,avg],i)=>{
                  const seg = avg > 3000000 ? "Luxury" : avg > 1200000 ? "Premium" : "Mass market";
                  const bc  = seg === "Luxury" ? "badge-green" : seg === "Premium" ? "badge-amber" : "badge-red";
                  return (
                    <tr key={brand}>
                      <td style={{color:"var(--muted)"}}>{i+1}</td>
                      <td style={{color:"var(--accent)",fontWeight:500}}>{brand}</td>
                      <td>{fmt(avg)}</td>
                      <td><span className={`badge ${bc}`}>{seg}</span></td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
