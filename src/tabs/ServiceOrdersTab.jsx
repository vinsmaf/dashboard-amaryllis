// Onglet admin 🛎️ Ventes — commandes de services (ventes additionnelles).
// Lit /api/service-orders (table D1 `service_orders` alimentée par stripe-webhook.js).

import { useState, useEffect, useCallback } from "react";
import { fetchJSON } from "../lib/apiFetch.js";

const fmtDate = (ts) =>
  ts ? new Date(ts * 1000).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
const fmtEur = (cents) => ((cents || 0) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const STATUS = {
  paye:     { label: "✅ Payé",     color: "#22c55e" },
  rembourse:{ label: "↩️ Remboursé", color: "#f97316" },
};

export default function ServiceOrdersTab() {
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback((showSpinner = true) => {
    if (showSpinner) setLoading(true);
    fetchJSON("/api/service-orders", { timeout: 10000 })
      .then((d) => { setOrders(d?.orders || []); setErr(null); })
      .catch((e) => { setOrders([]); if (e?.status !== 401) setErr(e?.message || "Erreur de chargement"); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    let alive = true;
    fetchJSON("/api/service-orders", { timeout: 10000 })
      .then((d) => { if (alive) { setOrders(d?.orders || []); setErr(null); } })
      .catch((e) => { if (alive) { setOrders([]); if (e?.status !== 401) setErr(e?.message || "Erreur de chargement"); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const total = orders.reduce((s, o) => s + (o.amount || 0), 0);

  return (
    <div style={{ padding: "8px 4px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>🛎️ Ventes</h2>
        <span style={{ fontSize: 12, color: "#64748b" }}>Commandes de services payées par les voyageurs (ventes additionnelles)</span>
      </div>

      {/* En-tête : total + rafraîchir */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", margin: "12px 0 16px" }}>
        <div style={{ background: "#0f172a", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 10, padding: "10px 16px" }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>Total des ventes</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#22c55e" }}>{fmtEur(total)}</div>
        </div>
        <div style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 16px" }}>
          <div style={{ fontSize: 11, color: "#64748b" }}>Commandes</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0" }}>{orders.length}</div>
        </div>
        <button onClick={load} style={{ ...chip(false), marginLeft: "auto" }}>⟳ Rafraîchir</button>
      </div>

      {loading ? (
        <div style={{ color: "#64748b", fontSize: 13 }}>Chargement…</div>
      ) : err ? (
        <div style={{ color: "#f87171", fontSize: 13, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "12px 14px" }}>
          ⚠️ Erreur de chargement : {err}. <button onClick={load} style={{ ...chip(false), marginLeft: 6 }}>Réessayer</button>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ color: "#64748b", fontSize: 14, padding: "20px 0" }}>Aucune vente pour le moment</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {orders.map((o) => {
            const st = STATUS[o.status] || { label: o.status || "—", color: "#94a3b8" };
            return (
              <div key={o.id} style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderLeft: "3px solid #22c55e", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{o.service_label || o.service_id || "Service"}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>{fmtEur(o.amount)}</span>
                  <span style={{ fontSize: 11, color: st.color, fontWeight: 600 }}>{st.label}</span>
                  <span style={{ fontSize: 10, color: "#475569", marginLeft: "auto" }}>{fmtDate(o.created_at)}</span>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                  {o.bien_nom && <span>🏠 {o.bien_nom}</span>}
                  {o.contact && <span> · 👤 {o.contact}</span>}
                  {o.email && <span> · ✉️ {o.email}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const chip = (active) => ({
  background: active ? "#2563eb" : "#1e293b", color: active ? "#fff" : "#94a3b8",
  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
});
