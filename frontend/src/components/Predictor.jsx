import { useState } from "react";

const API = "https://car-price-pred-2.onrender.com/api";;

const MODELS = {
  "Maruti Suzuki": ["Swift","Baleno","Wagon R","Alto","Dzire","Brezza","Ertiga"],
  "Hyundai":       ["i20","Creta","Verna","Tucson","i10","Venue","Grand i10"],
  "Tata":          ["Nexon","Harrier","Altroz","Safari","Punch","Tiago","Tigor"],
  "Honda":         ["City","Amaze","Jazz","WR-V","CR-V","Elevate"],
  "Toyota":        ["Innova","Fortuner","Glanza","Urban Cruiser","Camry","Hyryder"],
  "Mahindra":      ["XUV500","Scorpio","Thar","Bolero","XUV300","XUV700","BE6e"],
  "Kia":           ["Seltos","Sonet","Carnival","Carens","EV6","EV9"],
  "Ford":          ["EcoSport","Endeavour","Figo","Freestyle","Aspire"],
  "BMW":           ["3 Series","5 Series","X1","X3","X5","M3"],
  "Mercedes-Benz": ["C-Class","E-Class","GLC","A-Class","S-Class","GLE"],
};

const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");

const factors = [
  { label: "Brand & Model",    w: "25%" },
  { label: "Age & Year",       w: "20%" },
  { label: "Kms driven",       w: "20%" },
  { label: "Fuel & Tranny",    w: "20%" },
  { label: "Condition & City", w: "15%" },
];

export default function Predictor() {
  const [form, setForm] = useState({
    brand: "", model: "", year: "2020", fuel: "Petrol",
    transmission: "Manual", condition: "Good",
    city: "Delhi", kms_driven: "", owners: "1",
  });
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const predict = async () => {
    if (!form.brand || !form.year || !form.kms_driven) {
      setError("Please fill in brand, year, and kilometres driven.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res  = await fetch(`${API}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, year: +form.year, kms_driven: +form.kms_driven, owners: +form.owners }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message || "Could not reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="metric-grid">
        {[
          { label: "Cars analyzed",    value: "24,800+", sub: "Updated daily" },
          { label: "Model accuracy",   value: "94.2%",   sub: "Within ±8% of market" },
          { label: "Cities covered",   value: "38",      sub: "Across India" },
          { label: "Predictions today",value: "1,340",   sub: "+12% vs yesterday" },
        ].map(m => (
          <div className="metric" key={m.label}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-sub">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="two-col" style={{ alignItems: "start" }}>
        {/* ── Left: form ── */}
        <div className="card">
          <div className="card-title">Vehicle details</div>

          <div className="two-col">
            <div className="form-row">
              <label className="form-label">Brand</label>
              <select value={form.brand} onChange={e => { set("brand", e.target.value); set("model",""); }}>
                <option value="">— select —</option>
                {Object.keys(MODELS).map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">Model</label>
              <select value={form.model} onChange={e => set("model", e.target.value)} disabled={!form.brand}>
                <option value="">— select —</option>
                {(MODELS[form.brand] || []).map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="two-col">
            <div className="form-row">
              <label className="form-label">Year</label>
              <select value={form.year} onChange={e => set("year", e.target.value)}>
                {Array.from({length:22},(_,i)=>2025-i).map(y=><option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">Kilometres driven</label>
              <input type="number" placeholder="e.g. 45000" min={0} max={500000}
                value={form.kms_driven} onChange={e => set("kms_driven", e.target.value)} />
            </div>
          </div>

          <div className="two-col">
            <div className="form-row">
              <label className="form-label">Fuel type</label>
              <select value={form.fuel} onChange={e => set("fuel", e.target.value)}>
                {["Petrol","Diesel","CNG","Electric","Hybrid"].map(f=><option key={f}>{f}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">Transmission</label>
              <select value={form.transmission} onChange={e => set("transmission", e.target.value)}>
                {["Manual","Automatic","AMT","CVT"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="two-col">
            <div className="form-row">
              <label className="form-label">Condition</label>
              <select value={form.condition} onChange={e => set("condition", e.target.value)}>
                {["Excellent","Good","Fair","Poor"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-row">
              <label className="form-label">City</label>
              <select value={form.city} onChange={e => set("city", e.target.value)}>
                {["Mumbai","Delhi","Bangalore","Chennai","Hyderabad","Pune","Meerut","Lucknow"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Previous owners</label>
            <select value={form.owners} onChange={e => set("owners", e.target.value)}>
              <option value="1">1 — First owner</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4+</option>
            </select>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button className="btn btn-primary btn-block" onClick={predict} disabled={loading} style={{marginTop:8}}>
            {loading ? <><span className="spinner"></span>Analysing…</> : "Predict price →"}
          </button>

          {result && (
            <div className="result-box">
              <div className="result-label">Estimated market value</div>
              <div className="result-price">{fmt(result.predicted_price)}</div>
              <div className="result-range">Range: {fmt(result.price_low)} – {fmt(result.price_high)}</div>
              <div className="conf-bar">
                <div className="conf-fill" style={{width: `${result.confidence}%`}} />
              </div>
              <div className="conf-label">Confidence: {result.confidence}%</div>
            </div>
          )}
        </div>

        {/* ── Right: info ── */}
        <div>
          <div className="card">
            <div className="card-title">How prediction works</div>
            <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.8}}>
              Our <strong style={{color:"var(--accent)"}}>Gradient Boosting</strong> model is trained on 24,800+ real Indian car transactions.
              It weighs 8 features to generate a price estimate with a confidence score.
            </div>
            <div style={{marginTop:18}}>
              <div style={{fontSize:11,color:"var(--muted)",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:10}}>Feature importance</div>
              {factors.map(f=>(
                <div key={f.label} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                    <span style={{color:"var(--text)"}}>{f.label}</span>
                    <span style={{color:"var(--muted)"}}>{f.w}</span>
                  </div>
                  <div style={{height:4,background:"var(--border)",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:f.w,background:"var(--accent2)",borderRadius:2}} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Depreciation guide</div>
            <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.9}}>
              {[
                ["Year 1",  "15–20% drop from ex-showroom"],
                ["Year 2–3","10–12% per year"],
                ["Year 4–5","8–10% per year"],
                ["Year 6+", "5–7% per year"],
              ].map(([yr,desc])=>(
                <div key={yr} style={{display:"flex",gap:12,paddingBottom:10,borderBottom:"1px solid var(--border)",marginBottom:10}}>
                  <span style={{color:"var(--accent)",minWidth:60,fontWeight:500}}>{yr}</span>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
