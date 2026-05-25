/* global React, Panel, KpiCard, Gauge, Spark, PBar, StatusDot, ChannelChip, BIEN_COLORS, fmt, fmtK */

/* ─────────────────────────────────────────────────────────────────
   <BienCard> — per-property card (Cockpit view)
   Status dot + name + ytd revenue + gauge + spark + occupancy bar
   ───────────────────────────────────────────────────────────────── */
function BienCard({ bien }) {
  const status = bien.cashflow > 0 && bien.occ > 50 ? "green" :
                 bien.cashflow < -500 || bien.ytd === 0 ? "red" : "yellow";
  const color = BIEN_COLORS[bien.id] || "#0ea5e9";
  return (
    <Panel style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: color }}/>
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, color: "#f1f5f9" }}>{bien.name}</span>
          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: "#64748b" }}>{bien.emoji}</span>
        </div>
        <StatusDot status={status} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Gauge pct={bien.occ} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18, color }}>{fmtK(bien.ytd)}</div>
          <div style={{ fontSize: 10, color: bien.cashflow >= 0 ? "#10b981" : "#ef4444", marginTop: 3 }}>
            CF {bien.cashflow >= 0 ? "+" : ""}{fmtK(bien.cashflow)}
          </div>
        </div>
        <Spark data={bien.revenus} color={color} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <PBar label="Occupation" pct={bien.occ} />
        <PBar label="ADR" pct={Math.min(bien.adr / 5, 100)} color="#a855f7" />
      </div>
    </Panel>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <AlertCard> — yellow / red alert with property reference
   ───────────────────────────────────────────────────────────────── */
function AlertCard({ severity = "warn", title, body, action }) {
  const colors = {
    warn: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", fg: "#fbbf24", icon: "⚠" },
    danger: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", fg: "#fca5a5", icon: "⚠" },
    info: { bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.25)", fg: "#7dd3fc", icon: "ℹ" },
  };
  const c = colors[severity];
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 10, padding: "10px 14px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ color: c.fg, fontSize: 14 }}>{c.icon}</span>
      <div style={{ flex: 1, fontFamily: "'Jost', sans-serif", fontSize: 12, lineHeight: 1.4, color: c.fg }}>
        <strong style={{ color: "#f1f5f9", fontWeight: 600 }}>{title}</strong>
        {body && <> · {body}</>}
      </div>
      {action && (
        <button style={{
          background: "transparent", border: `1px solid ${c.border}`,
          color: c.fg, borderRadius: 6, padding: "5px 12px",
          fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 500, cursor: "pointer",
        }}>{action}</button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <ReservationRow> — one reservation in a list/table
   ───────────────────────────────────────────────────────────────── */
function ReservationRow({ r }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr auto",
      gap: 14, padding: "11px 16px", alignItems: "center",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: BIEN_COLORS[r.bienId] || "#94a3b8" }}/>
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, color: "#f1f5f9" }}>{r.bien}</span>
      </div>
      <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: "#cbd5e1" }}>{r.guest}</div>
      <ChannelChip channel={r.channel} />
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#94a3b8" }}>
        {r.checkin} → {r.checkout}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 13, color: "#f1f5f9", textAlign: "right" }}>
        {fmt(r.amount)}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <TodayBanner> — the persistent header banner in Cockpit
   ───────────────────────────────────────────────────────────────── */
function TodayBanner({ ytd, monthRev, monthLabel, top, flop }) {
  return (
    <Panel padded={false} style={{ padding: "14px 18px", marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 4 }}>
            {monthLabel} · en cours
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 24, color: "#0ea5e9" }}>
            {fmtK(monthRev)}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", gap: 32, justifyContent: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.18em" }}>Top mois</div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: "#10b981", marginTop: 4, fontWeight: 600 }}>{top}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.18em" }}>Flop mois</div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>{flop}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 4 }}>YTD 2026</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 20, color: "#f1f5f9" }}>{fmtK(ytd)}</div>
        </div>
      </div>
    </Panel>
  );
}

Object.assign(window, { BienCard, AlertCard, ReservationRow, TodayBanner });
