/* global React */
const { useState: usePrimitivesState } = React;

/* ─────────────────────────────────────────────────────────────────
   Admin primitives — dense, dark-slate UI building blocks
   ───────────────────────────────────────────────────────────────── */

/* number/euro formatters used throughout the admin */
const fmt   = v => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v) + " €";
const fmtK  = v => v >= 1000 ? (v/1000).toFixed(1) + "k€" : Math.round(v) + "€";

/* per-bien identity colors — exactly mirrored from src/App.jsx */
const BIEN_COLORS = {
  nogent: "#0ea5e9", amaryllis: "#10b981", iguana: "#6366f1",
  geko:   "#f59e0b", zandoli:   "#3b82f6", mabouya:"#ec4899",
  schoelcher: "#8b5cf6",
};

/* booking channels */
const CHANNEL_COLORS = { airbnb: "#FF5A5F", booking: "#0ea5e9", direct: "#10b981", autre: "#a855f7" };

/* ─────────────────────────────────────────────────────────────────
   <Panel> — translucent slate card surface
   ───────────────────────────────────────────────────────────────── */
function Panel({ children, padded = true, style }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: padded ? 16 : 0,
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <KpiCard> — label + big mono value + sub
   ───────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, color = "#f1f5f9" }) {
  return (
    <Panel padded style={{ padding: "12px 14px" }}>
      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 22, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>{sub}</div>}
    </Panel>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <Gauge> — circular SVG occupancy meter (52px default)
   ───────────────────────────────────────────────────────────────── */
function Gauge({ pct = 0, size = 52 }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(Math.max(pct, 0) / 100, 1) * circ;
  const color = pct >= 70 ? "#10b981" : pct >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2+4} textAnchor="middle" fill={color} fontSize={10} fontWeight="700" fontFamily="Jost, sans-serif">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <Spark> — micro line chart, last point colored by trend
   ───────────────────────────────────────────────────────────────── */
function Spark({ data = [], color = "#0ea5e9", w = 68, h = 26 }) {
  const valid = data.filter(v => v > 0);
  if (valid.length < 2) return <div style={{ width: w, height: h }} />;
  const mn = Math.min(...valid), mx = Math.max(...valid), rng = mx - mn || 1;
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = v > 0 ? h - ((v - mn) / rng) * (h - 4) - 2 : h;
    return `${x},${y}`;
  }).join(" ");
  const last = valid[valid.length-1], prev = valid[valid.length-2];
  const trend = last >= prev ? "#10b981" : "#ef4444";
  const lastY = h - ((last - mn) / rng) * (h - 4) - 2;
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" opacity={0.6}/>
      <circle cx={w-2} cy={lastY} r={2.5} fill={trend}/>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <PBar> — labelled progress bar
   ───────────────────────────────────────────────────────────────── */
function PBar({ pct, label, color }) {
  const c = color || (pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#0ea5e9");
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b", marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: c, fontWeight: 600 }}>{Math.round(Math.min(pct, 999))}%</span>
      </div>
      <div style={{ height: 5, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: c, borderRadius: 3, transition: "width 0.5s" }}/>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <ChannelDot>, <StatusDot> — identity pills
   ───────────────────────────────────────────────────────────────── */
function StatusDot({ status = "green" }) {
  const colors = { green: "#10b981", yellow: "#f59e0b", red: "#ef4444" };
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[status], display: "inline-block" }}/>;
}

function ChannelChip({ channel, value }) {
  const color = CHANNEL_COLORS[channel];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: `rgba(${hexToRgb(color)},0.15)`,
      border: `1px solid rgba(${hexToRgb(color)},0.3)`,
      color, borderRadius: 4, padding: "3px 9px",
      fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 600,
      textTransform: "capitalize",
    }}>
      {channel}{value !== undefined && <span style={{ color: "#94a3b8", fontWeight: 400 }}>· {value}</span>}
    </span>
  );
}
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

/* ─────────────────────────────────────────────────────────────────
   <Tabs> — top-level dashboard tab strip
   ───────────────────────────────────────────────────────────────── */
function Tabs({ tabs, active, onSelect }) {
  return (
    <div style={{
      display: "flex", gap: 4, background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: 6,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id)} style={{
          flex: 1, textAlign: "center", padding: "8px 12px",
          fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 11,
          color: active === t.id ? "#fff" : "#94a3b8",
          background: active === t.id ? "linear-gradient(135deg,#0ea5e9,#6366f1)" : "transparent",
          border: "none", borderRadius: 8, cursor: "pointer",
          letterSpacing: 0.02,
        }}>
          <span style={{ marginRight: 5 }}>{t.emoji}</span>{t.label}
        </button>
      ))}
    </div>
  );
}

Object.assign(window, {
  Panel, KpiCard, Gauge, Spark, PBar, StatusDot, ChannelChip, Tabs,
  BIEN_COLORS, CHANNEL_COLORS, fmt, fmtK, hexToRgb,
});
