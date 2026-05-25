/* global React, Panel, BIEN_COLORS, ChannelChip, fmt, fmtK */

/* ─────────────────────────────────────────────────────────────────
   <GanttRow> — one property's reservation strip across the month
   ───────────────────────────────────────────────────────────────── */
function GanttRow({ bien, reservations, daysInMonth = 31 }) {
  const color = BIEN_COLORS[bien.id] || "#94a3b8";
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "140px 1fr",
      gap: 14, alignItems: "center",
      padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: color }}/>
        <span style={{ fontFamily: "'Jost'", fontWeight: 500, fontSize: 12, color: "#f1f5f9" }}>{bien.name}</span>
        <span style={{ fontFamily: "'Jost'", fontSize: 10, color: "#64748b" }}>{bien.emoji}</span>
      </div>
      <div style={{ position: "relative", height: 28, background: "rgba(255,255,255,0.02)", borderRadius: 4 }}>
        {/* day grid */}
        {Array.from({length: daysInMonth}, (_, i) => (
          <div key={i} style={{
            position: "absolute", top: 0, bottom: 0,
            left: `${(i / daysInMonth) * 100}%`,
            width: `${(1 / daysInMonth) * 100}%`,
            borderRight: i < daysInMonth - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
          }}/>
        ))}
        {reservations.map((r, i) => {
          const left = ((r.startDay - 1) / daysInMonth) * 100;
          const width = (((r.endDay - r.startDay)) / daysInMonth) * 100;
          return (
            <div key={i} style={{
              position: "absolute", top: 4, bottom: 4,
              left: `${left}%`, width: `${width}%`,
              background: `rgba(${r.channel === "airbnb" ? "255,90,95" : r.channel === "booking" ? "14,165,233" : "16,185,129"},0.85)`,
              borderRadius: 4, padding: "0 8px",
              display: "flex", alignItems: "center",
              fontFamily: "'Jost', sans-serif", fontSize: 10, color: "#fff", fontWeight: 600,
              overflow: "hidden",
            }}>{r.guest}</div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <DayBanner> — "Today" check-ins/outs list
   ───────────────────────────────────────────────────────────────── */
function DayBanner({ checkins = [], checkouts = [] }) {
  return (
    <Panel style={{ padding: 16, marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <div>
          <div style={{ fontFamily: "'Jost'", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#10b981", fontWeight: 600, marginBottom: 10 }}>
            Check-ins aujourd'hui · {checkins.length}
          </div>
          {checkins.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: BIEN_COLORS[c.bienId] }}/>
              <span style={{ fontFamily: "'Jost'", fontSize: 12, color: "#f1f5f9", fontWeight: 500, flex: 1 }}>{c.bien}</span>
              <span style={{ fontFamily: "'Jost'", fontSize: 11, color: "#94a3b8" }}>{c.guest} · {c.nights}n</span>
              <ChannelChip channel={c.channel}/>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: "'Jost'", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#f59e0b", fontWeight: 600, marginBottom: 10 }}>
            Check-outs aujourd'hui · {checkouts.length}
          </div>
          {checkouts.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: BIEN_COLORS[c.bienId] }}/>
              <span style={{ fontFamily: "'Jost'", fontSize: 12, color: "#f1f5f9", fontWeight: 500, flex: 1 }}>{c.bien}</span>
              <span style={{ fontFamily: "'Jost'", fontSize: 11, color: "#94a3b8" }}>{c.guest}</span>
              <span style={{ fontFamily: "'Jost'", fontSize: 11, color: c.menage ? "#10b981" : "#f59e0b" }}>{c.menage ? "✓ Ménage" : "⏳ Ménage"}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

Object.assign(window, { GanttRow, DayBanner });
