import { useState } from "react";
import Predictor from "./components/Predictor";
import Database from "./components/Database";
import Trends from "./components/Trends";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("predict");

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-logo">
          <span className="logo-icon">◈</span> AutoVal Pro
        </div>
        <div className="nav-tabs">
          {[
            { id: "predict",  label: "Price Predictor" },
            { id: "database", label: "Car Database"    },
            { id: "trends",   label: "Market Trends"   },
          ].map(t => (
            <button
              key={t.id}
              className={`tab ${page === t.id ? "active" : ""}`}
              onClick={() => setPage(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="main">
        {page === "predict"  && <Predictor />}
        {page === "database" && <Database />}
        {page === "trends"   && <Trends />}
      </main>
    </div>
  );
}
