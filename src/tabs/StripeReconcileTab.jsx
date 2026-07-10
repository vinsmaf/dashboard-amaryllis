// src/tabs/StripeReconcileTab.jsx
// Onglet "🏦 Rapprochement Stripe" — chantier connecteurs 2026-07 (finance).
// Montre, pour chaque virement Stripe reçu sur le compte bancaire, le détail des
// transactions qui le composent (montant brut, frais, net) et rattache chaque
// paiement à une résa directe connue (D1 direct_bookings) quand c'est possible.
import { useState, useEffect } from "react";

function adminToken() {
  return sessionStorage.getItem("ldb_tok") || "";
}

function fmtEur(v) {
  if (v == null) return "—";
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + " €";
}
function fmtDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const STATUS_LABELS = {
  paid: { label: "Versé", color: "#10b981" },
  in_transit: { label: "En cours", color: "#f59e0b" },
  pending: { label: "En attente", color: "#94a3b8" },
  failed: { label: "Échoué", color: "#ef4444" },
  canceled: { label: "Annulé", color: "#ef4444" },
};

function PayoutCard({ p }) {
  const [open, setOpen] = useState(false);
  const st = STATUS_LABELS[p.status] || { label: p.status, color: "#94a3b8" };
  const feePct = p.grossFromCharges > 0 ? ((p.totalFees / p.grossFromCharges) * 100).toFixed(1) : "0.0";

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer", flexWrap: "wrap" }}
      >
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{fmtDate(p.arrivalDate)}</div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{p.chargesCount} transaction{p.chargesCount > 1 ? "s" : ""}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Brut</div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>{fmtEur(p.grossFromCharges)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Frais Stripe</div>
          <div style={{ fontSize: 13, color: "#f87171" }}>−{fmtEur(p.totalFees)} <span style={{ fontSize: 10, color: "#64748b" }}>({feePct}%)</span></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>Net viré</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#6ee7b7" }}>{fmtEur(p.amount)}</div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: st.color, background: `${st.color}18`, borderRadius: 6, padding: "3px 8px" }}>{st.label}</span>
        {p.unmatchedCount > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", background: "rgba(251,191,36,0.12)", borderRadius: 6, padding: "3px 8px" }}>
            ⚠ {p.unmatchedCount} non rattaché{p.unmatchedCount > 1 ? "s" : ""}
          </span>
        )}
        <span style={{ fontSize: 12, color: "#64748b" }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 18px 16px" }}>
          {p.transactions.length === 0 && (
            <div style={{ fontSize: 11, color: "#64748b", padding: "8px 0" }}>Aucune transaction détaillée disponible.</div>
          )}
          {p.transactions.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", flexWrap: "wrap" }}>
              <span style={{ fontSize: 9, background: "rgba(255,255,255,0.06)", color: "#94a3b8", borderRadius: 4, padding: "2px 6px", textTransform: "uppercase", flexShrink: 0 }}>{t.typeLabel}</span>
              <div style={{ flex: 1, minWidth: 140, fontSize: 12, color: "#e2e8f0" }}>
                {t.matched ? (
                  <>👤 {t.guestName || "—"} · <span style={{ color: "#a5b4fc" }}>{t.bienNom || "—"}</span></>
                ) : (
                  <span style={{ color: "#64748b" }}>{t.description || "Non rattaché à une résa directe connue"}</span>
                )}
              </div>
              <span style={{ fontSize: 11, color: "#94a3b8", width: 70, textAlign: "right" }}>{fmtEur(t.amount)}</span>
              <span style={{ fontSize: 11, color: "#f87171", width: 60, textAlign: "right" }}>{t.fee ? `−${fmtEur(t.fee)}` : "—"}</span>
              <span style={{ fontSize: 11, color: "#6ee7b7", width: 70, textAlign: "right", fontWeight: 600 }}>{fmtEur(t.net)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StripeReconcileTab() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    fetch("/api/stripe-reconcile?limit=15", { headers: { Authorization: `Bearer ${adminToken()}` } })
      .then(r => r.json())
      .then(d => {
        if (!d.ok) throw new Error(d.error || "Erreur inconnue");
        setPayouts(d.payouts || []);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const totalNet = payouts.reduce((s, p) => s + p.amount, 0);
  const totalFees = payouts.reduce((s, p) => s + p.totalFees, 0);
  const totalUnmatched = payouts.reduce((s, p) => s + p.unmatchedCount, 0);

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>🏦 Rapprochement Stripe</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Ce que Stripe vire réellement sur le compte, après frais — 15 derniers virements</div>
        </div>
        <button
          onClick={load}
          style={{ marginLeft: "auto", padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.1)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          🔄 Actualiser
        </button>
      </div>

      {!loading && !error && payouts.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Total net viré</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#6ee7b7" }}>{fmtEur(totalNet)}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Total frais Stripe</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#f87171" }}>{fmtEur(totalFees)}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Transactions non rattachées</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: totalUnmatched > 0 ? "#fbbf24" : "#475569" }}>{totalUnmatched}</div>
          </div>
        </div>
      )}

      {loading && <div style={{ fontSize: 12, color: "#64748b" }}>Chargement…</div>}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 9, padding: "10px 14px", fontSize: 12, color: "#f87171" }}>
          Erreur : {error}
        </div>
      )}
      {!loading && !error && payouts.length === 0 && (
        <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: "40px 0" }}>Aucun virement Stripe trouvé.</div>
      )}

      {payouts.map(p => <PayoutCard key={p.id} p={p} />)}
    </div>
  );
}
