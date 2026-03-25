"use client";
import { useState, useCallback, useEffect } from "react";

// ─── Styles ───
const mono = { fontFamily: "'JetBrains Mono', monospace" };

const card = {
  background: "rgba(15, 23, 42, 0.7)",
  border: "1px solid rgba(148, 163, 184, 0.08)",
  borderRadius: "16px",
  padding: "28px",
  backdropFilter: "blur(12px)",
};

const btn = (primary) => ({
  padding: "14px 32px",
  borderRadius: "12px",
  border: primary ? "none" : "1px solid rgba(148, 163, 184, 0.15)",
  background: primary
    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
    : "rgba(30, 41, 59, 0.6)",
  color: "#fff",
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  transition: "all 0.2s",
  letterSpacing: "0.01em",
});

const inputStyle = {
  background: "rgba(15, 23, 42, 0.9)",
  border: "1px solid rgba(148, 163, 184, 0.15)",
  borderRadius: "10px",
  padding: "12px 16px",
  color: "#e2e8f0",
  fontSize: "15px",
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const sharpeRating = (s) => {
  if (s >= 3) return { label: "Excellent", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  if (s >= 2) return { label: "Very Good", color: "#3b82f6", bg: "rgba(59,130,246,0.12)" };
  if (s >= 1) return { label: "Good", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" };
  if (s >= 0) return { label: "Sub-optimal", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return { label: "Negative", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
};

const Logo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
    <div style={{ width: 38, height: 38, borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, color: "#fff", ...mono }}>σ</div>
    <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em" }}>Sigma<span style={{ color: "#a78bfa" }}>Frontier</span></span>
  </div>
);

// ─── Landing ───
const Landing = ({ onStart }) => (
  <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
    <div style={{ marginBottom: 48 }}><Logo /></div>
    <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: "100px", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.2)", fontSize: "13px", fontWeight: 500, color: "#a78bfa", marginBottom: 28 }}>Portfolio Analytics for Everyone</div>
    <h1 style={{ fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 20px", background: "linear-gradient(135deg, #e2e8f0, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Know your portfolio's<br />risk-adjusted returns</h1>
    <p style={{ fontSize: "18px", color: "#94a3b8", lineHeight: 1.65, maxWidth: 520, margin: "0 auto 40px" }}>Input your holdings. Get Sharpe Ratio data instantly. Understand how well your portfolio compensates you for the risk you're taking — no finance degree required.</p>
    <button style={btn(true)} onClick={onStart}>Analyse My Portfolio →</button>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginTop: 64, textAlign: "left" }}>
      {[["📊","Sharpe Ratio","See how much return you earn per unit of risk, for your whole portfolio and each holding."],["🔗","Correlation Matrix","Discover how your holdings move together — and whether you're truly diversified."],["📖","Plain English","Every metric explained simply. No jargon walls. Built for regular investors."]].map(([icon,title,desc],i)=>(
        <div key={i} style={{...card,padding:"24px"}}><div style={{fontSize:28,marginBottom:12}}>{icon}</div><div style={{fontWeight:600,fontSize:15,marginBottom:8}}>{title}</div><div style={{fontSize:13,color:"#94a3b8",lineHeight:1.6}}>{desc}</div></div>
      ))}
    </div>
    <p style={{ marginTop: 48, fontSize: "12px", color: "#475569", lineHeight: 1.6, maxWidth: 500, margin: "48px auto 0" }}>⚠️ This tool provides educational portfolio analytics. Not financial advice. Past performance is not indicative of future results.</p>
  </div>
);

// ─── Portfolio Input ───
const PortfolioInput = ({ onAnalyse, onBack, loading }) => {
  const [rows, setRows] = useState([{ ticker: "AAPL", amount: "5000" }, { ticker: "OXY", amount: "4000" }, { ticker: "VOO", amount: "3000" }, { ticker: "STX", amount: "2000" }, { ticker: "BND", amount: "2000" }]);
  const [error, setError] = useState("");
  const updateRow = (i, field, value) => { const next = [...rows]; next[i] = { ...next[i], [field]: field === "ticker" ? value.toUpperCase() : value }; setRows(next); };
  const addRow = () => setRows([...rows, { ticker: "", amount: "" }]);
  const removeRow = (i) => rows.length > 2 && setRows(rows.filter((_, j) => j !== i));
  const handleAnalyse = () => {
    setError("");
    const valid = rows.filter(r => r.ticker && r.amount);
    if (valid.length < 2) { setError("Please enter at least 2 holdings."); return; }
    const holdings = valid.map(r => ({ ticker: r.ticker.toUpperCase(), amount: parseFloat(r.amount) }));
    if (holdings.some(h => isNaN(h.amount) || h.amount <= 0)) { setError("All dollar amounts must be positive numbers."); return; }
    const uniqueTickers = new Set(holdings.map(h => h.ticker));
    if (uniqueTickers.size < holdings.length) { setError("Duplicate tickers found."); return; }
    onAnalyse(holdings);
  };
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}><Logo /><button style={{ ...btn(false), padding: "8px 20px", fontSize: "13px" }} onClick={onBack}>← Back</button></div>
      <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 8 }}>Enter your portfolio</h2>
      <p style={{ color: "#94a3b8", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>Add each holding with its ticker symbol and the dollar amount invested. Supports any ticker on Yahoo Finance.</p>
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: "12px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ticker</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Amount (USD)</div>
          <div></div>
        </div>
        {rows.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: "12px", marginBottom: 10 }}>
            <input style={{ ...inputStyle, ...mono, fontSize: 14 }} value={row.ticker} onChange={e => updateRow(i, "ticker", e.target.value)} placeholder="e.g. AAPL" disabled={loading} />
            <input style={{ ...inputStyle, ...mono, fontSize: 14 }} value={row.amount} onChange={e => updateRow(i, "amount", e.target.value)} placeholder="e.g. 5000" type="number" min="0" disabled={loading} />
            <button onClick={() => removeRow(i)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18, padding: 0, opacity: rows.length <= 2 ? 0.3 : 1 }} disabled={rows.length <= 2 || loading}>×</button>
          </div>
        ))}
        <button onClick={addRow} disabled={loading} style={{ background: "none", border: "1px dashed rgba(148, 163, 184, 0.2)", borderRadius: 10, padding: "10px", width: "100%", color: "#64748b", cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans', sans-serif", marginTop: 4 }}>+ Add another holding</button>
      </div>
      {error && <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, color: "#fca5a5", fontSize: 14 }}>{error}</div>}
      <button style={{ ...btn(true), width: "100%", opacity: loading ? 0.7 : 1 }} onClick={handleAnalyse} disabled={loading}>{loading ? "Fetching live data..." : "Calculate Sharpe Ratio →"}</button>
      {loading && <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>Downloading 1 year of weekly prices from Yahoo Finance. This may take a few seconds...</div>}
    </div>
  );
};

// ─── Heatmap ───
const Heatmap = ({ matrix, tickers }) => {
  const [hover, setHover] = useState(null);
  const n = tickers.length;
  const cellSize = Math.min(52, Math.floor(480 / n));
  const getCellBg = (v, isSelf) => { if (isSelf) return "rgba(15, 23, 42, 0.9)"; if (v > 0.5) return `rgba(239, 68, 68, ${0.2 + Math.min(v, 1) * 0.55})`; return `rgba(100, 116, 139, ${0.08 + Math.abs(v) * 0.25})`; };
  const getTextColor = (v, isSelf) => { if (isSelf) return "#334155"; if (v > 0.5) return "#fca5a5"; return "#64748b"; };
  const isHighlighted = (ri, ci) => hover && (ri === hover.i || ci === hover.j);
  const isActive = (ri, ci) => hover && ri === hover.i && ci === hover.j;
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "inline-block" }}>
        <div style={{ display: "flex", marginLeft: cellSize + 4 }}>
          {tickers.map((t, i) => (<div key={i} style={{ width: cellSize, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: hover && (hover.i === i || hover.j === i) ? "#fff" : "#cbd5e1", ...mono, fontWeight: 600, transform: n > 5 ? "rotate(-45deg)" : "none", transformOrigin: "center bottom", marginBottom: n > 5 ? 16 : 4, transition: "color 0.15s" }}>{t}</div>))}
        </div>
        {matrix.map((row, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: cellSize, textAlign: "right", paddingRight: 6, fontSize: 11, ...mono, fontWeight: 600, color: hover && (hover.i === i || hover.j === i) ? "#fff" : "#cbd5e1", transition: "color 0.15s" }}>{tickers[i]}</div>
            {row.map((val, j) => {
              // Only render upper triangle (j >= i)
              if (j < i) return <div key={j} style={{ width: cellSize - 2, height: cellSize - 2, margin: 1, border: "2px solid transparent" }} />;
              const active = isActive(i, j); const highlighted = isHighlighted(i, j); const isSelf = i === j; return (
              <div key={j} onMouseEnter={() => setHover({ i, j, val })} onMouseLeave={() => setHover(null)} style={{ width: cellSize - 2, height: cellSize - 2, margin: 1, borderRadius: 4, background: getCellBg(val, isSelf), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", border: active ? "2px solid #e2e8f0" : "2px solid transparent", outline: highlighted && !active ? "1px solid rgba(148, 163, 184, 0.3)" : "none", filter: hover && !highlighted ? "brightness(0.5)" : "brightness(1)", fontSize: cellSize > 40 ? 10 : 8, color: active ? "#fff" : getTextColor(val, isSelf), fontWeight: active ? 700 : 400, ...mono }}>{cellSize > 36 ? val.toFixed(2) : ""}</div>
            ); })}
          </div>
        ))}
      </div>
      {hover && <div style={{ marginTop: 12, fontSize: 13, color: "#94a3b8", ...mono, textAlign: "center" }}>{tickers[hover.i]} ↔ {tickers[hover.j]}: <span style={{ color: hover.val > 0.5 ? "#fca5a5" : "#94a3b8", fontWeight: 600 }}>{hover.val.toFixed(4)}</span>{hover.i === hover.j && <span style={{ color: "#64748b", fontStyle: "italic" }}> (self)</span>}{hover.i !== hover.j && hover.val > 0.5 && <span style={{ color: "#fca5a5", fontStyle: "italic" }}> (high correlation — less diversification)</span>}{hover.i !== hover.j && hover.val <= 0.5 && hover.val > 0.2 && <span style={{ color: "#94a3b8", fontStyle: "italic" }}> (moderate)</span>}{hover.i !== hover.j && hover.val <= 0.2 && hover.val >= -0.2 && <span style={{ color: "#94a3b8", fontStyle: "italic" }}> (low — good diversifier)</span>}{hover.i !== hover.j && hover.val < -0.2 && <span style={{ color: "#94a3b8", fontStyle: "italic" }}> (negative — excellent diversifier)</span>}</div>}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16, fontSize: 11, color: "#64748b" }}>
        <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "rgba(239, 68, 68, 0.6)", verticalAlign: "middle", marginRight: 4 }}></span>High (&gt;0.5)</span>
        <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "rgba(100, 116, 139, 0.25)", verticalAlign: "middle", marginRight: 4 }}></span>Low (≤0.5)</span>
      </div>
    </div>
  );
};

// ─── Sector Alerts ───
const SectorAlerts = ({ sectorData, sectorLoading }) => {
  const [expanded, setExpanded] = useState({});

  const toggleExpanded = (ticker) => {
    setExpanded((prev) => ({ ...prev, [ticker]: !prev[ticker] }));
  };

  // Loading state
  if (sectorLoading) {
    return (
      <div style={{ ...card, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Sector Comparison</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0" }}>
          <div style={{
            width: 20, height: 20, border: "2px solid rgba(99, 102, 241, 0.3)",
            borderTop: "2px solid #6366f1", borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
          <span style={{ fontSize: 14, color: "#94a3b8" }}>
            Loading sector benchmarks — comparing your holdings against top stocks in each sector...
          </span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error or no data
  if (!sectorData || sectorData.error) {
    return (
      <div style={{ ...card, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Sector Comparison</h3>
        <p style={{ fontSize: 14, color: "#64748b" }}>Sector comparison data could not be loaded. This does not affect your portfolio analysis above.</p>
      </div>
    );
  }

  const { alerts, passing, skipped } = sectorData;

  return (
    <div style={{ ...card, marginBottom: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, marginTop: 0 }}>Sector Comparison</h3>
      <p style={{ fontSize: 13, color: "#64748b", marginTop: 0, marginBottom: 20, lineHeight: 1.6 }}>
        Each holding is compared against the top 10 stocks by market cap in its sector. Holdings are flagged if their Sharpe Ratio falls below the sector average.
      </p>

      {/* All clear message */}
      {alerts.length === 0 && (
        <div style={{
          padding: "16px 20px", borderRadius: 12,
          background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.15)",
          display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
        }}>
          <span style={{ fontSize: 20 }}>✓</span>
          <span style={{ fontSize: 14, color: "#22c55e", fontWeight: 500 }}>
            All your holdings perform at or above their sector average.
          </span>
        </div>
      )}

      {/* Passing holdings summary */}
      {passing && passing.length > 0 && (
        <div style={{ marginBottom: alerts.length > 0 ? 20 : 0 }}>
          {passing.map((p, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", borderRadius: 10, marginBottom: 6,
              background: "rgba(34, 197, 94, 0.04)", border: "1px solid rgba(34, 197, 94, 0.08)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span>
                <span style={{ fontWeight: 600, fontSize: 14, ...mono }}>{p.ticker}</span>
                <span style={{ fontSize: 13, color: "#64748b" }}>{p.sector}</span>
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", ...mono }}>
                <span style={{ color: "#22c55e", fontWeight: 600 }}>{p.holdingSharpe.toFixed(2)}</span>
                <span style={{ color: "#64748b" }}> vs sector avg </span>
                <span>{p.sectorAvgSharpe.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alert cards */}
      {alerts.map((alert, idx) => (
        <div key={idx} style={{
          marginBottom: 16, borderRadius: 12, overflow: "hidden",
          background: "rgba(239, 68, 68, 0.04)", border: "1px solid rgba(239, 68, 68, 0.12)",
        }}>
          {/* Alert header */}
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ fontWeight: 700, fontSize: 15, ...mono }}>{alert.ticker}</span>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>— Below sector average</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "#64748b", padding: "4px 10px", borderRadius: 6, background: "rgba(30, 41, 59, 0.5)" }}>{alert.name}</span>
              <span style={{ fontSize: 12, color: "#64748b", padding: "4px 10px", borderRadius: 6, background: "rgba(30, 41, 59, 0.5)" }}>{alert.sector}</span>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239, 68, 68, 0.06)" }}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Your Sharpe</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444", ...mono }}>{alert.holdingSharpe.toFixed(2)}</div>
              </div>
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(148, 163, 184, 0.04)" }}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Sector Avg</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#94a3b8", ...mono }}>{alert.sectorAvgSharpe.toFixed(2)}</div>
              </div>
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239, 68, 68, 0.06)" }}>
                <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Gap</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444", ...mono }}>{alert.gap.toFixed(2)}</div>
              </div>
            </div>

            {/* Outperformers */}
            {alert.outperformers.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 10 }}>
                  {alert.outperformers.length} of {alert.totalComparisons} top {alert.sector} stocks outperform this holding:
                </div>
                {alert.outperformers.map((comp, ci) => (
                  <div key={ci} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 12px", borderRadius: 8, marginBottom: 4,
                    background: "rgba(34, 197, 94, 0.04)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, ...mono }}>{comp.ticker}</span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{comp.name}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#22c55e", ...mono }}>{comp.annualizedSharpe.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Underperformers — collapsible */}
            {alert.underperformers.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => toggleExpanded(alert.ticker)}
                  style={{
                    background: "none", border: "none", color: "#64748b",
                    cursor: "pointer", padding: "6px 0", fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif", display: "flex",
                    alignItems: "center", gap: 6,
                  }}
                >
                  <span style={{
                    transform: expanded[alert.ticker] ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "transform 0.2s", display: "inline-block", fontSize: 12,
                  }}>▸</span>
                  Show remaining {alert.underperformers.length} stocks with lower Sharpe
                </button>
                {expanded[alert.ticker] && (
                  <div style={{ marginTop: 6 }}>
                    {alert.underperformers.map((comp, ci) => (
                      <div key={ci} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "8px 12px", borderRadius: 8, marginBottom: 4,
                        background: "rgba(30, 41, 59, 0.3)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 500, fontSize: 13, ...mono, color: "#94a3b8" }}>{comp.ticker}</span>
                          <span style={{ fontSize: 12, color: "#475569" }}>{comp.name}</span>
                        </div>
                        <span style={{ fontSize: 13, color: "#64748b", ...mono }}>{comp.annualizedSharpe.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Skipped tickers */}
      {skipped && skipped.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
          <strong style={{ color: "#94a3b8" }}>Not compared:</strong>{" "}
          {skipped.map((s) => `${s.ticker} (${s.reason})`).join(", ")}
        </div>
      )}
    </div>
  );
};

// ─── Sector Exposure Pie Chart ───
const SECTOR_COLORS = {
  Technology: "#6366f1",
  "Financial Services": "#3b82f6",
  Healthcare: "#22c55e",
  "Consumer Cyclical": "#f59e0b",
  "Consumer Defensive": "#a78bfa",
  Industrials: "#64748b",
  Energy: "#ef4444",
  Utilities: "#14b8a6",
  "Real Estate": "#ec4899",
  "Communication Services": "#8b5cf6",
  "Basic Materials": "#f97316",
  "Fixed Income": "#06b6d4",
  Commodities: "#eab308",
  International: "#10b981",
  Other: "#475569",
};

const SectorExposure = ({ sectorData, sectorLoading }) => {
  const [hoverSlice, setHoverSlice] = useState(null);

  if (sectorLoading) {
    return (
      <div style={{ ...card, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>Sector Exposure</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0" }}>
          <div style={{
            width: 20, height: 20, border: "2px solid rgba(99, 102, 241, 0.3)",
            borderTop: "2px solid #6366f1", borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
          <span style={{ fontSize: 14, color: "#94a3b8" }}>Calculating sector exposure...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!sectorData || sectorData.error || !sectorData.exposure || sectorData.exposure.length === 0) {
    return null;
  }

  const { exposure, missingSectors, etfBreakdownUsed } = sectorData;

  // Build SVG pie chart
  const cx = 140, cy = 140, r = 120, innerR = 70;
  let cumulativeAngle = -Math.PI / 2; // start from top
  const slices = exposure.map((item, i) => {
    const angle = (item.percentage / 100) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(startAngle);
    const iy1 = cy + innerR * Math.sin(startAngle);
    const ix2 = cx + innerR * Math.cos(endAngle);
    const iy2 = cy + innerR * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const path = item.percentage >= 99.9
      ? `M ${cx},${cy - r} A ${r},${r} 0 1,1 ${cx - 0.01},${cy - r} L ${cx - 0.01},${cy - innerR} A ${innerR},${innerR} 0 1,0 ${cx},${cy - innerR} Z`
      : `M ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} L ${ix2},${iy2} A ${innerR},${innerR} 0 ${largeArc},0 ${ix1},${iy1} Z`;

    const color = SECTOR_COLORS[item.sector] || "#475569";

    return { ...item, path, color, index: i };
  });

  return (
    <div style={{ ...card, marginBottom: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, marginTop: 0 }}>Sector Exposure</h3>
      <p style={{ fontSize: 13, color: "#64748b", marginTop: 0, marginBottom: 20, lineHeight: 1.6 }}>
        Breakdown of your portfolio by sector. Hover over the chart to see details.
      </p>

      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        {/* Donut Chart */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width="280" height="280" viewBox="0 0 280 280">
            {slices.map((slice) => (
              <path
                key={slice.index}
                d={slice.path}
                fill={slice.color}
                opacity={hoverSlice === null ? 0.85 : hoverSlice === slice.index ? 1 : 0.35}
                stroke="rgba(10, 14, 26, 0.8)"
                strokeWidth="2"
                style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                onMouseEnter={() => setHoverSlice(slice.index)}
                onMouseLeave={() => setHoverSlice(null)}
              />
            ))}
            {/* Dark center background */}
            <circle cx={cx} cy={cy} r={innerR - 2} fill="rgba(10, 14, 26, 0.85)" />
            {/* Center label on hover */}
            {hoverSlice !== null && (
              <>
                <text x={cx} y={cy - 10} textAnchor="middle" fill="#e2e8f0"
                  fontSize="14" fontFamily="DM Sans, sans-serif" fontWeight="600">
                  {slices[hoverSlice].sector}
                </text>
                <text x={cx} y={cy + 18} textAnchor="middle" fill={slices[hoverSlice].color}
                  fontSize="24" fontFamily="JetBrains Mono, monospace" fontWeight="700">
                  {slices[hoverSlice].percentage.toFixed(1)}%
                </text>
              </>
            )}
            {hoverSlice === null && (
              <text x={cx} y={cy + 5} textAnchor="middle" fill="#64748b"
                fontSize="13" fontFamily="DM Sans, sans-serif">
                Hover to explore
              </text>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, minWidth: 200 }}>
          {slices.map((slice) => (
            <div
              key={slice.index}
              onMouseEnter={() => setHoverSlice(slice.index)}
              onMouseLeave={() => setHoverSlice(null)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 10px", borderRadius: 6, marginBottom: 3,
                cursor: "pointer", transition: "background 0.15s",
                background: hoverSlice === slice.index ? "rgba(148, 163, 184, 0.08)" : "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: 2, flexShrink: 0,
                  background: slice.color,
                }} />
                <span style={{ fontSize: 13, color: hoverSlice === slice.index ? "#e2e8f0" : "#94a3b8" }}>
                  {slice.sector}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: hoverSlice === slice.index ? "#e2e8f0" : "#64748b", ...mono }}>
                {slice.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Missing sectors checklist */}
      {missingSectors && missingSectors.length > 0 && (
        <div style={{
          padding: "14px 18px", borderRadius: 10, marginBottom: 16,
          background: "rgba(148, 163, 184, 0.04)", border: "1px solid rgba(148, 163, 184, 0.08)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 10 }}>
            No exposure to:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {missingSectors.map((sector, i) => (
              <span key={i} style={{
                fontSize: 12, padding: "4px 10px", borderRadius: 6,
                background: "rgba(30, 41, 59, 0.5)", color: "#64748b",
              }}>
                {sector}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ETF breakdown disclaimer */}
      {etfBreakdownUsed && etfBreakdownUsed.length > 0 && (
        <div style={{ fontSize: 11, color: "#475569", marginBottom: 8, lineHeight: 1.6 }}>
          📊 ETFs broken down into estimated sector constituents: {etfBreakdownUsed.join(", ")}. Actual allocations may vary slightly.
        </div>
      )}

      {/* General disclaimer */}
      <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
        Consider whether heavy exposure to any single sector aligns with your risk tolerance.
      </div>
    </div>
  );
};

// ─── AI Analysis ───
const AIAnalysis = ({ results, sectorData, sectorLoading }) => {
  const [analysis, setAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [requested, setRequested] = useState(false);

  const handleAnalyse = async () => {
    setAiLoading(true);
    setAiError("");
    setRequested(true);
    try {
      const res = await fetch("/api/ai-analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioData: results,
          sectorData: sectorData,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "AI analysis failed.");
      } else {
        setAnalysis(data.analysis);
      }
    } catch {
      setAiError("Network error — could not reach AI service.");
    }
    setAiLoading(false);
  };

  // Simple markdown-like bold rendering: **text** → <strong>text</strong>
  const renderText = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1
        ? <strong key={i} style={{ color: "#e2e8f0" }}>{part}</strong>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <div style={{ ...card, marginBottom: 24, borderLeft: "3px solid #8b5cf6" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: analysis ? 16 : 0 }}>
        <span style={{ fontSize: 22 }}>🤖</span>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 4px" }}>AI Portfolio Analysis</h3>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
            Get a plain-English breakdown of your portfolio's strengths, risks, and areas to explore.
          </p>
        </div>
        {!analysis && !aiLoading && (
          <button
            onClick={handleAnalyse}
            disabled={sectorLoading}
            style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: sectorLoading
                ? "rgba(139, 92, 246, 0.3)"
                : "linear-gradient(135deg, #8b5cf6, #6366f1)",
              color: "#fff", fontSize: 14, fontWeight: 600, cursor: sectorLoading ? "default" : "pointer",
              fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
              opacity: sectorLoading ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            {sectorLoading ? "Waiting for sector data..." : "Analyse"}
          </button>
        )}
      </div>

      {/* Loading state */}
      {aiLoading && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0" }}>
          <div style={{
            width: 20, height: 20, border: "2px solid rgba(139, 92, 246, 0.3)",
            borderTop: "2px solid #8b5cf6", borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
          <span style={{ fontSize: 14, color: "#94a3b8" }}>
            Claude is analysing your portfolio...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error state */}
      {aiError && (
        <div style={{
          marginTop: 12, padding: "12px 16px", borderRadius: 10,
          background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)",
          color: "#fca5a5", fontSize: 14,
        }}>
          {aiError}
          <button
            onClick={handleAnalyse}
            style={{
              marginLeft: 12, padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(239, 68, 68, 0.3)",
              background: "transparent", color: "#fca5a5", fontSize: 12, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Analysis result */}
      {analysis && (
        <div>
          <div style={{
            padding: "18px 22px", borderRadius: 12,
            background: "rgba(139, 92, 246, 0.04)", border: "1px solid rgba(139, 92, 246, 0.1)",
            fontSize: 14, color: "#94a3b8", lineHeight: 1.8,
          }}>
            {analysis.split("\n").map((line, i) => {
              if (line.trim() === "") return <br key={i} />;
              return <p key={i} style={{ margin: "0 0 8px" }}>{renderText(line)}</p>;
            })}
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
              Powered by Claude (Anthropic). This is educational analysis, not financial advice.
            </div>
            <button
              onClick={handleAnalyse}
              style={{
                padding: "6px 14px", borderRadius: 6,
                border: "1px solid rgba(148, 163, 184, 0.15)",
                background: "rgba(30, 41, 59, 0.6)", color: "#94a3b8",
                fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                flexShrink: 0,
              }}
            >
              Re-analyse
            </button>
          </div>
        </div>
      )}

      {/* Not yet requested — subtle hint */}
      {!requested && !aiLoading && (
        <div style={{ fontSize: 11, color: "#475569", marginTop: 8 }}>
          Uses Claude AI to interpret your portfolio data. Costs nothing. No data is stored.
        </div>
      )}
    </div>
  );
};

// ─── Dashboard ───
const Dashboard = ({ results, onBack }) => {
  const [showMethodology, setShowMethodology] = useState(false);
  const [showSharpeDetail, setShowSharpeDetail] = useState(false);
  const [sectorData, setSectorData] = useState(null);
  const [sectorLoading, setSectorLoading] = useState(true);
  const rating = sharpeRating(results.portfolioSharpeAnnualized);

  // Background fetch sector comparisons after dashboard loads
  useEffect(() => {
    let cancelled = false;
    async function fetchSectors() {
      try {
        const res = await fetch("/api/sectors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            holdings: results.securityMetrics.map((s) => ({
              ticker: s.ticker,
              name: s.name,
              amount: s.amount,
              annualizedSharpe: s.annualizedSharpe,
            })),
            rfAnnual: results.rfAnnual,
          }),
        });
        const data = await res.json();
        if (!cancelled) {
          if (!res.ok) setSectorData({ alerts: [], passing: [], skipped: [], exposure: [], missingSectors: [], etfBreakdownUsed: [], error: true });
          else setSectorData(data);
        }
      } catch {
        if (!cancelled) setSectorData({ alerts: [], passing: [], skipped: [], exposure: [], missingSectors: [], etfBreakdownUsed: [], error: true });
      }
      if (!cancelled) setSectorLoading(false);
    }
    fetchSectors();
    return () => { cancelled = true; };
  }, [results]);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}><Logo /><button style={{ ...btn(false), padding: "8px 20px", fontSize: "13px" }} onClick={onBack}>← New Analysis</button></div>

      {/* 1. What is Sharpe Ratio — Collapsible */}
      <div style={{ ...card, marginBottom: 24, borderLeft: "3px solid #6366f1" }}>
        <button onClick={() => setShowSharpeDetail(!showSharpeDetail)} style={{ background: "none", border: "none", color: "#e2e8f0", cursor: "pointer", padding: 0, width: "100%", textAlign: "left", fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>💡</span>
            <div style={{ flex: 1 }}><h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 4px" }}>What is the Sharpe Ratio?</h3><p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>Measures how much return you earn for each unit of risk. Higher = better risk-adjusted performance.</p></div>
            <span style={{ transform: showSharpeDetail ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block", fontSize: 16, color: "#64748b" }}>▸</span>
          </div>
        </button>
        {showSharpeDetail && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, margin: "0 0 16px" }}>Imagine two investments that both returned 10% last year. But one had wild swings while the other grew steadily. The steady one is better — same reward, less risk. The Sharpe Ratio captures this: <strong style={{ color: "#e2e8f0" }}>how much return per unit of risk?</strong></p>
            <div style={{ background: "rgba(99, 102, 241, 0.08)", borderRadius: 12, padding: "20px 24px", marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>The Formula</div>
              <div style={{ ...mono, fontSize: 20, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>Sharpe = <span style={{ color: "#22c55e" }}>(Rₚ − Rf)</span> / <span style={{ color: "#f59e0b" }}>σₚ</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, maxWidth: 500, margin: "0 auto" }}>
                <div style={{ padding: "10px", borderRadius: 8, background: "rgba(34, 197, 94, 0.08)" }}><div style={{ ...mono, fontSize: 16, color: "#22c55e", fontWeight: 600, marginBottom: 4 }}>Rₚ</div><div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>Portfolio average return</div></div>
                <div style={{ padding: "10px", borderRadius: 8, background: "rgba(148, 163, 184, 0.06)" }}><div style={{ ...mono, fontSize: 16, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>Rf</div><div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>Risk-free rate (Treasury bills)</div></div>
                <div style={{ padding: "10px", borderRadius: 8, background: "rgba(245, 158, 11, 0.08)" }}><div style={{ ...mono, fontSize: 16, color: "#f59e0b", fontWeight: 600, marginBottom: 4 }}>σₚ</div><div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>Portfolio volatility (risk)</div></div>
              </div>
            </div>
            <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, margin: "0 0 12px" }}>The numerator <span style={{ color: "#22c55e", ...mono, fontSize: 13 }}>(Rₚ − Rf)</span> is your <strong style={{ color: "#e2e8f0" }}>excess return</strong> — how much more you earned than risk-free bonds. The denominator <span style={{ color: "#f59e0b", ...mono, fontSize: 13 }}>σₚ</span> is <strong style={{ color: "#e2e8f0" }}>volatility</strong> — how bumpy the ride was.</p>
            <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8, margin: "0 0 16px" }}>A Sharpe of 1.0 = 1% excess return per 1% volatility. Below 1.0 = possibly not enough reward for the risk. Above 2.0 = strong risk-adjusted performance.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, padding: "10px 14px", borderRadius: 8, background: "rgba(30, 41, 59, 0.5)" }}><strong style={{ color: "#a78bfa" }}>For each security:</strong> How well it compensates you for its individual risk.</div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7, padding: "10px 14px", borderRadius: 8, background: "rgba(30, 41, 59, 0.5)" }}><strong style={{ color: "#a78bfa" }}>For the portfolio:</strong> Factors in correlations, which can lower overall risk through diversification.</div>
            </div>
            <div style={{ marginTop: 16, padding: "14px 18px", borderRadius: 10, background: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.1)" }}>
              <strong style={{ color: "#f59e0b" }}>Quick Reference</strong><br /><span style={mono}>{"< 1.0"}</span>: Sub-optimal — <span style={mono}>1.0–1.99</span>: Good — <span style={mono}>2.0–2.99</span>: Very Good — <span style={mono}>{"≥ 3.0"}</span>: Excellent
            </div>
          </div>
        )}
      </div>

      {/* 2. Portfolio Sharpe */}
      <div style={{ ...card, textAlign: "center", marginBottom: 24, background: `linear-gradient(135deg, rgba(15, 23, 42, 0.9), ${rating.bg})`, border: `1px solid ${rating.color}22` }}>
        <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Portfolio Sharpe Ratio (Annualised)</div>
        <div style={{ fontSize: 64, fontWeight: 700, ...mono, color: rating.color, lineHeight: 1 }}>{results.portfolioSharpeAnnualized.toFixed(2)}</div>
        <div style={{ display: "inline-block", marginTop: 16, padding: "6px 16px", borderRadius: 100, background: rating.bg, color: rating.color, fontSize: 14, fontWeight: 600 }}>{rating.label}</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 16, lineHeight: 1.7, maxWidth: 520, margin: "16px auto 0" }}>{results.portfolioSharpeAnnualized >= 1 ? "Your portfolio earns a reasonable excess return relative to the risk you're bearing." : "Your portfolio's excess return is low relative to its volatility."}</div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 12 }}>Rating benchmarks sourced from <a href="https://corporatefinanceinstitute.com/resources/career-map/sell-side/risk-management/sharpe-ratio-definition-formula/" target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1", textDecoration: "none", borderBottom: "1px solid rgba(99, 102, 241, 0.3)" }}>Corporate Finance Institute</a></div>
      </div>

      {/* 3. Dashboard stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[["Total Value",`$${results.totalValue.toLocaleString()}`,"#e2e8f0"],["Avg Weekly Return",`${results.portfolioAvgReturn.toFixed(3)}%`,results.portfolioAvgReturn>=0?"#22c55e":"#ef4444"],["Weekly Risk (σ)",`${results.portfolioStdDev.toFixed(3)}%`,"#f59e0b"],["Risk-Free Rate",`${(results.rfAnnual*100).toFixed(2)}% / yr`,"#64748b"],["Weekly Rf",`${results.rfWeekly.toFixed(4)}%`,"#64748b"],["Holdings",`${results.tickers.length} securities`,"#a78bfa"]].map(([label,value,color],i)=>(
          <div key={i} style={{...card,padding:"18px 22px"}}><div style={{fontSize:11,color:"#64748b",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{label}</div><div style={{fontSize:20,fontWeight:700,...mono,color}}>{value}</div></div>
        ))}
      </div>

      {/* 4. Individual Securities */}
      <div style={{ ...card, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, marginTop: 0 }}>Individual Security Analysis</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.1)" }}>
              {["Ticker","Name","Weight","Avg Return / wk","Risk (σ) / wk","Sharpe (Ann.)"].map((h,i)=>(<th key={i} style={{textAlign:i<2?"left":"right",padding:"10px 12px",fontSize:11,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</th>))}
            </tr></thead>
            <tbody>{[...results.securityMetrics].sort((a,b)=>b.annualizedSharpe-a.annualizedSharpe).map((sec,i)=>{return(
              <tr key={i} style={{borderBottom:"1px solid rgba(148, 163, 184, 0.05)"}}>
                <td style={{padding:"12px",fontWeight:600,...mono}}>{sec.ticker}</td>
                <td style={{padding:"12px",color:"#94a3b8"}}>{sec.name}</td>
                <td style={{padding:"12px",textAlign:"right",...mono}}>{(sec.weight*100).toFixed(1)}%</td>
                <td style={{padding:"12px",textAlign:"right",...mono,color:sec.avgWeeklyReturn>=0?"#22c55e":"#ef4444"}}>{sec.avgWeeklyReturn>=0?"+":""}{sec.avgWeeklyReturn.toFixed(3)}%</td>
                <td style={{padding:"12px",textAlign:"right",...mono,color:"#f59e0b"}}>{sec.weeklyStdDev.toFixed(3)}%</td>
                <td style={{padding:"12px",textAlign:"right",...mono,fontWeight:600,color:"#e2e8f0"}}>{sec.annualizedSharpe.toFixed(2)}</td>
              </tr>);})}</tbody>
          </table>
        </div>
        <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(99, 102, 241, 0.06)", fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
          <strong style={{ color: "#a78bfa" }}>How to read this table:</strong><br />
          <strong style={{ color: "#e2e8f0" }}>Avg Return / wk</strong> — average percentage the stock moves per week.<br />
          <strong style={{ color: "#e2e8f0" }}>Risk (σ) / wk</strong> — how much returns scatter around the average. Higher = more risk.<br />
          <strong style={{ color: "#e2e8f0" }}>Sharpe (Ann.)</strong> — annualised excess return per unit of risk.
        </div>
      </div>

      {/* 5. Sector Alerts */}
      <SectorAlerts sectorData={sectorData} sectorLoading={sectorLoading} />

      {/* 6. Sector Exposure */}
      <SectorExposure sectorData={sectorData} sectorLoading={sectorLoading} />

      {/* 7. AI Analysis */}
      <AIAnalysis results={results} sectorData={sectorData} sectorLoading={sectorLoading} />

      {/* 8. Allocation */}
      <div style={{ ...card, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, marginTop: 0 }}>Portfolio Allocation</h3>
        {[...results.securityMetrics].sort((a,b)=>b.weight-a.weight).map((sec,i)=>{const colors=["#6366f1","#8b5cf6","#a78bfa","#22c55e","#f59e0b","#ef4444","#3b82f6","#ec4899","#14b8a6","#f97316"];return(
          <div key={i} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13}}><span style={{...mono,fontWeight:500}}>{sec.ticker}</span><span style={{...mono,color:"#94a3b8"}}>{(sec.weight*100).toFixed(1)}% · ${sec.amount.toLocaleString()}</span></div>
            <div style={{height:8,borderRadius:4,background:"rgba(30, 41, 59, 0.8)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,background:colors[i%colors.length],width:`${sec.weight*100}%`,transition:"width 0.6s ease"}} /></div>
          </div>);})}
      </div>

      {/* 9. Correlation */}
      <div style={{ ...card, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, marginTop: 0 }}>Correlation Matrix</h3>
        <p style={{ fontSize: 13, color: "#64748b", marginTop: 0, marginBottom: 20, lineHeight: 1.6 }}>Shows how each pair of holdings moves relative to each other. Red cells (&gt;0.5) = less diversification.</p>
        <Heatmap matrix={results.corrMatrix} tickers={results.tickers} />
      </div>

      {/* 10. Methodology */}
      <div style={{ ...card, marginBottom: 24 }}>
        <button onClick={() => setShowMethodology(!showMethodology)} style={{ background: "none", border: "none", color: "#e2e8f0", fontSize: 18, fontWeight: 700, cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
          <span style={{ transform: showMethodology ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>▸</span>Methodology & Formulas
        </button>
        {showMethodology && (
          <div style={{ marginTop: 20, fontSize: 14, color: "#94a3b8", lineHeight: 1.8 }}>
            <div style={{ marginBottom: 18 }}><strong style={{ color: "#e2e8f0" }}>Data</strong><br />Live 52-week historical weekly closing prices from Yahoo Finance. Weekly returns = (close − prev_close) / prev_close × 100.{results.dataPoints && <span> Using {results.dataPoints} data points.</span>}</div>
            <div style={{ marginBottom: 18 }}><strong style={{ color: "#e2e8f0" }}>Risk-Free Rate</strong><br />Live 13-week US Treasury bill yield (^IRX): {(results.rfAnnual * 100).toFixed(2)}% annual.<br /><span style={mono}>Weekly Rf = (1 + Rf_annual)^(1/52) − 1 = {results.rfWeekly.toFixed(4)}%</span></div>
            <div style={{ marginBottom: 18 }}><strong style={{ color: "#e2e8f0" }}>Average Weekly Return (μ)</strong><br /><span style={mono}>μ = Σ(weekly returns) / n</span></div>
            <div style={{ marginBottom: 18 }}><strong style={{ color: "#e2e8f0" }}>Volatility (σ)</strong><br /><span style={mono}>σ = √[ Σ(xᵢ − μ)² / (n − 1) ]</span> — sample standard deviation</div>
            <div style={{ marginBottom: 18 }}><strong style={{ color: "#e2e8f0" }}>Correlation (ρ)</strong><br /><span style={mono}>ρ(x,y) = Σ(xᵢ−μₓ)(yᵢ−μᵧ) / √[Σ(xᵢ−μₓ)² · Σ(yᵢ−μᵧ)²]</span></div>
            <div style={{ marginBottom: 18 }}><strong style={{ color: "#e2e8f0" }}>Portfolio Standard Deviation</strong><br /><span style={mono}>σₚ = √(wᵀ · Σ · w)</span> — using covariance matrix</div>
            <div style={{ marginBottom: 18 }}><strong style={{ color: "#e2e8f0" }}>Sharpe Ratio</strong><br /><span style={mono}>Weekly: SR = (μₚ − Rf_weekly) / σₚ</span><br /><span style={mono}>Annualised: SR_annual = SR_weekly × √52</span></div>
            <div style={{ marginBottom: 18 }}><strong style={{ color: "#e2e8f0" }}>Sector Comparison</strong><br />Each holding is compared against the top 10 stocks by market cap in its Yahoo Finance sector. Holdings whose annualised Sharpe falls below the sector average of these 10 stocks are flagged. ETFs are excluded as they span multiple sectors.</div>
            <div style={{ marginBottom: 18 }}><strong style={{ color: "#e2e8f0" }}>Sector Exposure</strong><br />Individual stocks are assigned to their Yahoo Finance sector. ETFs are broken down into approximate sector constituents using published allocation data from the ETF providers. Bond ETFs are categorised as Fixed Income, commodity ETFs as Commodities, and international ETFs as International. The "No exposure to" checklist covers the 11 core equity sectors only.</div>
            <div style={{ marginBottom: 18 }}><strong style={{ color: "#e2e8f0" }}>AI Analysis</strong><br />Uses Claude (by Anthropic) to generate a plain-English interpretation of your portfolio data. All computed metrics (Sharpe ratios, correlations, sector exposure, flags) are sent to the AI as context. No personal data is stored. The AI is instructed not to give buy/sell recommendations — it provides educational analysis only.</div>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", fontSize: 12, color: "#475569", lineHeight: 1.7, padding: "20px", maxWidth: 560, margin: "0 auto" }}>⚠️ Educational portfolio analytics only. Not financial advice. Past performance ≠ future results. Data from Yahoo Finance.</div>
    </div>
  );
};

// ─── Main App ───
export default function SigmaFrontier() {
  const [screen, setScreen] = useState("landing");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const handleAnalyse = useCallback(async (holdings) => {
    setLoading(true); setApiError("");
    try {
      const res = await fetch("/api/analyse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ holdings }) });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error || "Something went wrong."); setLoading(false); return; }
      setResults(data); setScreen("dashboard");
    } catch (err) { setApiError("Network error — check your connection and try again."); }
    setLoading(false);
  }, []);
  return (
    <div>
      {screen === "landing" && <Landing onStart={() => setScreen("input")} />}
      {screen === "input" && <div><PortfolioInput onAnalyse={handleAnalyse} onBack={() => setScreen("landing")} loading={loading} />{apiError && <div style={{ maxWidth: 680, margin: "-8px auto 0", padding: "0 24px" }}><div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 12, padding: "14px 18px", color: "#fca5a5", fontSize: 14 }}>{apiError}</div></div>}</div>}
      {screen === "dashboard" && results && <Dashboard results={results} onBack={() => setScreen("input")} />}
    </div>
  );
}
