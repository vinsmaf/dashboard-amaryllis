/* global React, Panel, BIEN_COLORS, fmtK, fmt */

/* ─────────────────────────────────────────────────────────────────
   <StackedBarChart> — pure SVG monthly revenue chart
   (Recharts in the real codebase; this is a faithful SVG mock.)
   ───────────────────────────────────────────────────────────────── */
function StackedBarChart({ data, biens, height = 200, width = 800 }) {
  const m = { top: 8, right: 12, bottom: 24, left: 38 };
  const innerW = width - m.left - m.right;
  const innerH = height - m.top - m.bottom;

  const totals = data.map(row => biens.reduce((s, b) => s + (row[b.id] || 0), 0));
  const max = Math.max(...totals) * 1.1 || 1;
  const yTicks = [0, max/4, max/2, max*3/4, max];

  const barW = innerW / data.length * 0.55;

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {/* grid lines */}
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={m.left} y1={m.top + innerH - (t/max)*innerH} x2={m.left + innerW} y2={m.top + innerH - (t/max)*innerH}
                stroke="#1e293b" strokeDasharray="3 3" />
          <text x={m.left - 6} y={m.top + innerH - (t/max)*innerH + 3} textAnchor="end" fontSize={9}
                fontFamily="JetBrains Mono, monospace" fill="#64748b">{fmtK(t)}</text>
        </g>
      ))}
      {/* bars */}
      {data.map((row, i) => {
        const x = m.left + (i + 0.5) * (innerW / data.length) - barW/2;
        let yCursor = m.top + innerH;
        return (
          <g key={i}>
            {biens.map(b => {
              const v = row[b.id] || 0;
              const h = (v / max) * innerH;
              yCursor -= h;
              return v > 0 ? (
                <rect key={b.id} x={x} y={yCursor} width={barW} height={h}
                      fill={BIEN_COLORS[b.id]} rx={1}/>
              ) : null;
            })}
            <text x={x + barW/2} y={height - 8} textAnchor="middle" fontSize={10}
                  fontFamily="Jost, sans-serif" fill="#94a3b8">{row.m}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <ChannelDonut> — pure SVG donut for Airbnb / Booking / Direct split
   ───────────────────────────────────────────────────────────────── */
function ChannelDonut({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size/2 - 8;
  const cx = size/2, cy = size/2;
  let acc = 0;
  return (
    <svg width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={12} />
      {data.map((d, i) => {
        const frac = d.value / total;
        const start = acc;
        const end = acc + frac;
        acc = end;
        const a0 = start * 2 * Math.PI - Math.PI/2;
        const a1 = end   * 2 * Math.PI - Math.PI/2;
        const large = frac > 0.5 ? 1 : 0;
        const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        return (
          <path key={i} d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`}
                fill="none" stroke={d.color} strokeWidth={12} strokeLinecap="butt"/>
        );
      })}
      <text x={cx} y={cy-2} textAnchor="middle" fontSize={11} fontFamily="Jost" fontWeight={500} fill="#64748b">Total</text>
      <text x={cx} y={cy+14} textAnchor="middle" fontSize={14} fontFamily="JetBrains Mono" fontWeight={700} fill="#f1f5f9">
        {fmtK(total)}
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <Heatmap> — saisonnalité grid (12 months × N biens)
   ───────────────────────────────────────────────────────────────── */
function Heatmap({ rows, months = ["J","F","M","A","M","J","J","A","S","O","N","D"] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: `auto repeat(${months.length}, 1fr)`, gap: 4, alignItems: "center" }}>
        <span/>
        {months.map((m, i) => (
          <div key={i} style={{ fontFamily: "'Jost'", fontSize: 9, color: "#64748b", textAlign: "center", textTransform: "uppercase", letterSpacing: 1 }}>{m}</div>
        ))}
        {rows.map(row => (
          <React.Fragment key={row.name}>
            <span style={{ fontFamily: "'Jost'", fontSize: 11, color: "#cbd5e1", fontWeight: 500, paddingRight: 10, whiteSpace: "nowrap" }}>{row.name}</span>
            {row.values.map((v, i) => {
              const t = Math.min(v / 100, 1);
              const bg = `rgba(16,185,129,${0.10 + t * 0.85})`;
              return (
                <div key={i} style={{
                  height: 24, background: bg, borderRadius: 3,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'JetBrains Mono'", fontSize: 9, color: t > 0.45 ? "#fff" : "#94a3b8", fontWeight: 600,
                }}>{Math.round(v)}</div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { StackedBarChart, ChannelDonut, Heatmap });
