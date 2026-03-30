import { useState, useEffect, useMemo } from "react";

const API = "http://localhost:5000/api";
const fmt = n => "₹" + Number(n).toLocaleString("en-IN");

const condBadge = c => {
  if (c === "Excellent") return "badge-green";
  if (c === "Good")      return "badge-amber";
  if (c === "Fair")      return "badge-amber";
  return "badge-red";
};

export default function Database() {
  const [cars, setCars]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [fBrand, setFBrand]   = useState("");
  const [fFuel,  setFFuel]    = useState("");
  const [fYear,  setFYear]    = useState("");
  const [sort,   setSort]     = useState("price-asc");
  const [page,   setPage]     = useState(1);
  const PER_PAGE = 12;

  useEffect(() => {
    fetch(`${API}/cars`)
      .then(r => r.json())
      .then(data => { setCars(data); setLoading(false); })
      .catch(() => { setError("Could not load database. Ensure backend is running."); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let d = [...cars];
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(c => `${c.brand} ${c.model} ${c.city}`.toLowerCase().includes(q));
    }
    if (fBrand) d = d.filter(c => c.brand === fBrand);
    if (fFuel)  d = d.filter(c => c.fuel  === fFuel);
    if (fYear)  d = d.filter(c => String(c.year) === fYear);
    if (sort === "price-asc")  d.sort((a,b) => a.price - b.price);
    if (sort === "price-desc") d.sort((a,b) => b.price - a.price);
    if (sort === "year-desc")  d.sort((a,b) => b.year - a.year);
    if (sort === "kms-asc")    d.sort((a,b) => a.kms_driven - b.kms_driven);
    return d;
  }, [cars, search, fBrand, fFuel, fYear, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const visible    = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const brands     = [...new Set(cars.map(c => c.brand))].sort();
  const years      = [...new Set(cars.map(c => String(c.year)))].sort((a,b)=>b-a);

  const reset = () => { setSearch(""); setFBrand(""); setFFuel(""); setFYear(""); setPage(1); };

  if (loading) return <div style={{color:"var(--muted)",padding:"48px 0",textAlign:"center"}}><span className="spinner" />Loading database…</div>;
  if (error)   return <div className="error-msg">{error}</div>;

  return (
    <>
      <div className="metric-grid">
        {[
          { label: "Total listings", value: cars.length },
          { label: "Filtered results", value: filtered.length },
          { label: "Avg price", value: "₹" + Math.round(cars.reduce((s,c)=>s+c.price,0)/cars.length).toLocaleString("en-IN") },
          { label: "Cities", value: [...new Set(cars.map(c=>c.city))].length },
        ].map(m => (
          <div className="metric" key={m.label}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">Search & filter</div>
        <div className="search-bar">
          <input type="text" placeholder="Search brand, model, city…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <button className="btn" onClick={reset}>Reset</button>
        </div>
        <div className="filter-row">
          <select value={fBrand} onChange={e=>{setFBrand(e.target.value);setPage(1);}}>
            <option value="">All brands</option>
            {brands.map(b=><option key={b}>{b}</option>)}
          </select>
          <select value={fFuel} onChange={e=>{setFFuel(e.target.value);setPage(1);}}>
            <option value="">All fuels</option>
            {["Petrol","Diesel","CNG","Electric","Hybrid"].map(f=><option key={f}>{f}</option>)}
          </select>
          <select value={fYear} onChange={e=>{setFYear(e.target.value);setPage(1);}}>
            <option value="">All years</option>
            {years.map(y=><option key={y}>{y}</option>)}
          </select>
          <select value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="year-desc">Newest first</option>
            <option value="kms-asc">Lowest mileage</option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Brand & model</th><th>Year</th><th>Fuel</th>
                <th>Kms</th><th>Owners</th><th>City</th><th>Condition</th><th>Est. price</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0
                ? <tr><td colSpan={9} style={{textAlign:"center",color:"var(--muted)",padding:"32px"}}>No results found</td></tr>
                : visible.map((c,i) => (
                  <tr key={c.id}>
                    <td style={{color:"var(--muted)"}}>{(page-1)*PER_PAGE+i+1}</td>
                    <td><strong style={{color:"var(--accent)"}}>{c.brand}</strong><br/><span style={{color:"var(--muted)",fontSize:12}}>{c.model}</span></td>
                    <td>{c.year}</td>
                    <td>{c.fuel}</td>
                    <td>{Number(c.kms_driven).toLocaleString("en-IN")}</td>
                    <td style={{color:"var(--muted)"}}>{c.owners}</td>
                    <td>{c.city}</td>
                    <td><span className={`badge ${condBadge(c.condition)}`}>{c.condition}</span></td>
                    <td style={{fontWeight:500,color:"var(--accent)"}}>{fmt(c.price)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:20,alignItems:"center"}}>
            <button className="btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Prev</button>
            <span style={{color:"var(--muted)",fontSize:12}}>Page {page} of {totalPages}</span>
            <button className="btn" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>Next →</button>
          </div>
        )}
      </div>
    </>
  );
}
