/**
 * Cautions — extrait de src/App.jsx (refactor 2026, batch B/5).
 */
import { useState, useEffect } from "react";
import { BIENS_CAUTION } from "../App.jsx";

export default function Cautions() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [actionMsg, setActionMsg] = useState({});
  const [captureAmounts, setCaptureAmounts] = useState({});

  // ── Formulaire création ──
  const defaultBien = BIENS_CAUTION[0];
  const [form, setForm] = useState({ bienId: defaultBien.id, voyageur: "", email: "", checkin: "", checkout: "", amount: String(defaultBien.depot) });
  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState(null);

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const createCaution = async () => {
    if (!form.checkout || !form.amount) return;
    setCreating(true);
    setCreatedLink(null);
    try {
      const res = await fetch("/api/caution-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Erreur API");
      setCreatedLink(data.url);
    } catch (e) {
      alert("Erreur : " + e.message);
    }
    setCreating(false);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/manage-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (sessionStorage.getItem("ldb_tok") || "") },
        body: JSON.stringify({ action: "list" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Erreur API");
      setDeposits(data.data || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const doAction = async (id, action, amount) => {
    setActionLoading(prev => ({ ...prev, [id]: action }));
    setActionMsg(prev => ({ ...prev, [id]: null }));
    try {
      const body = { action, paymentIntentId: id };
      if (action === "capture" && amount) body.amount = parseFloat(amount);
      const res = await fetch("/api/manage-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (sessionStorage.getItem("ldb_tok") || "") },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setActionMsg(prev => ({ ...prev, [id]: action === "capture" ? "✓ Débité" : "✓ Libéré" }));
      setTimeout(() => load(), 1500);
    } catch (e) {
      setActionMsg(prev => ({ ...prev, [id]: "Erreur : " + e.message }));
    }
    setActionLoading(prev => ({ ...prev, [id]: null }));
  };

  const fmtEur = v => (v / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const fmtDate = ts => new Date(ts * 1000).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const card = { background: "#1e293b", borderRadius: 12, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.06)" };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: "#f1f5f9" }}>🔒 Cautions voyageurs</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>Pré-autorisation CB · Libération automatique J+3 après départ · Débiter en cas de dommage</p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: loading ? "#334155" : "#0ea5e9", color: "#fff", cursor: loading ? "default" : "pointer", fontSize: 13, fontWeight: 600 }}>
          {loading ? "⏳…" : "🔄 Rafraîchir"}
        </button>
      </div>

      {/* ── Formulaire création caution ── */}
      <div style={{ background: "#1e293b", borderRadius: 12, padding: "20px 24px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 14 }}>+ Nouvelle caution</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10, marginBottom: 14 }}>
          <select value={form.bienId} onChange={e => { setF("bienId", e.target.value); const b = BIENS_CAUTION.find(x => x.id === e.target.value); if (b) setF("amount", String(b.depot)); }}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12 }}>
            {BIENS_CAUTION.map(b => <option key={b.id} value={b.id}>{b.nom}</option>)}
          </select>
          <input placeholder="Nom voyageur" value={form.voyageur} onChange={e => setF("voyageur", e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12 }} />
          <input type="email" placeholder="Email voyageur" value={form.email} onChange={e => setF("email", e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12 }} />
          <input type="date" placeholder="Arrivée" value={form.checkin} onChange={e => setF("checkin", e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12 }} />
          <input type="date" placeholder="Départ" value={form.checkout} onChange={e => setF("checkout", e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12 }} />
          <input type="number" placeholder="Montant (€)" value={form.amount} onChange={e => setF("amount", e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12 }} />
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={createCaution} disabled={creating || !form.checkout || !form.amount}
            style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: creating ? "#334155" : "#6366f1", color: "#fff", cursor: creating ? "default" : "pointer", fontSize: 13, fontWeight: 600 }}>
            {creating ? "⏳ Génération…" : "🔗 Générer lien Stripe"}
          </button>
          {createdLink && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <a href={createdLink} target="_blank" rel="noopener noreferrer"
                style={{ color: "#a78bfa", fontSize: 12, wordBreak: "break-all", maxWidth: 340 }}>{createdLink}</a>
              <button onClick={() => { navigator.clipboard.writeText(createdLink); }}
                style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #6366f1", background: "transparent", color: "#a78bfa", cursor: "pointer", fontSize: 11, whiteSpace: "nowrap" }}>
                📋 Copier
              </button>
            </div>
          )}
        </div>
        {createdLink && (
          <div style={{ marginTop: 10, fontSize: 11, color: "#64748b" }}>
            ✉️ Envoyer ce lien au voyageur via Airbnb ou SMS · Expire dans 72h · Carte bloquée mais non débitée
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: "#1e1215", border: "1px solid #ef4444", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#fca5a5", fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {!loading && deposits.length === 0 && !error && (
        <div style={{ ...card, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔓</div>
          <div style={{ color: "#94a3b8", fontSize: 14 }}>Aucun dépôt en attente</div>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 6 }}>Les dépôts prélevés ou libérés n'apparaissent plus ici</div>
        </div>
      )}

      {deposits.map(d => {
        const m = d.metadata || {};
        const amt = d.amount;
        const busy = actionLoading[d.id];
        const msg = actionMsg[d.id];
        const captureVal = captureAmounts[d.id] ?? "";
        return (
          <div key={d.id} style={{ ...card, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 15, marginBottom: 4 }}>
                  {m.voyageur || "—"} · <span style={{ color: "#f59e0b" }}>{fmtEur(amt)}</span>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>
                  {m.bienId || "—"} · {m.checkin ? `${m.checkin} → ${m.checkout}` : ""}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {m.email || ""} · Créé le {fmtDate(d.created)} · <code style={{ color: "#475569", fontSize: 10 }}>{d.id}</code>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {msg && (
                  <span style={{ fontSize: 12, color: msg.startsWith("✓") ? "#10b981" : "#ef4444", fontWeight: 600 }}>{msg}</span>
                )}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="number"
                    placeholder={`Montant max ${(amt / 100).toFixed(0)} €`}
                    value={captureVal}
                    onChange={e => setCaptureAmounts(prev => ({ ...prev, [d.id]: e.target.value }))}
                    style={{ width: 130, padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12 }}
                  />
                  <button
                    onClick={() => doAction(d.id, "capture", captureVal || (amt / 100))}
                    disabled={!!busy}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: busy === "capture" ? "#334155" : "#ef4444", color: "#fff", cursor: busy ? "default" : "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {busy === "capture" ? "⏳…" : "💳 Débiter"}
                  </button>
                  <button
                    onClick={() => doAction(d.id, "cancel")}
                    disabled={!!busy}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.4)", background: "transparent", color: "#10b981", cursor: busy ? "default" : "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {busy === "cancel" ? "⏳…" : "🔓 Libérer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
