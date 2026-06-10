// Onglet admin — Conversations WhatsApp voyageurs
// Lit depuis /api/whatsapp-conversations (D1 whatsapp_conversations)
import { useState, useEffect, useCallback } from "react";

const BIENS = ["amaryllis","zandoli","geko","mabouya","schoelcher","iguana","nogent"];

export default function WhatsAppTab() {
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterBien, setFilterBien] = useState("");
  const [selected, setSelected] = useState(null);
  const token = sessionStorage.getItem("admin_token") || "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (filterBien) params.set("bien", filterBien);
      const r = await fetch(`/api/whatsapp-conversations?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "Erreur");
      setConvs(d.conversations || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token, filterBien]);

  useEffect(() => { load(); }, [load]);

  const fmt = (ts) => ts ? new Date(ts * 1000).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

  const s = {
    wrap: { padding: "20px", color: "#e2e8f0", fontFamily: "system-ui,sans-serif" },
    h1: { fontSize: 20, fontWeight: 700, marginBottom: 16, color: "#f8fafc", display: "flex", alignItems: "center", gap: 10 },
    toolbar: { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" },
    select: { background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0", padding: "6px 10px", fontSize: 13 },
    btn: { background: "#2563eb", border: "none", borderRadius: 6, color: "#fff", padding: "6px 14px", cursor: "pointer", fontSize: 13 },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase" },
    td: { padding: "10px", borderBottom: "1px solid #1e293b", fontSize: 13 },
    row: (i) => ({ cursor: "pointer", background: i % 2 === 0 ? "transparent" : "#0f172a" }),
    chip: (ok) => ({
      display: "inline-block", padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 600,
      background: ok ? "#14532d" : "#7f1d1d", color: ok ? "#86efac" : "#fca5a5",
    }),
    drawer: {
      position: "fixed", top: 0, right: 0, width: 420, height: "100vh",
      background: "#0f172a", borderLeft: "1px solid #334155", padding: 24,
      overflowY: "auto", zIndex: 1000, color: "#e2e8f0",
    },
    close: { background: "#334155", border: "none", borderRadius: 6, color: "#e2e8f0", padding: "4px 10px", cursor: "pointer", float: "right", marginBottom: 12 },
    bubble: (isBien) => ({
      background: isBien ? "#1e3a5f" : "#1e293b",
      borderRadius: 10, padding: "10px 14px", margin: "8px 0",
      maxWidth: "85%", alignSelf: isBien ? "flex-start" : "flex-end",
      fontSize: 13, lineHeight: 1.6,
    }),
  };

  return (
    <div style={s.wrap}>
      <div style={s.h1}>
        <span>💬</span> Conversations WhatsApp
        <span style={{ fontSize: 13, fontWeight: 400, color: "#64748b" }}>({convs.length} messages)</span>
      </div>

      <div style={s.toolbar}>
        <select style={s.select} value={filterBien} onChange={e => setFilterBien(e.target.value)}>
          <option value="">Tous les biens</option>
          {BIENS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <button style={s.btn} onClick={load}>↻ Actualiser</button>
      </div>

      {error && <div style={{ color: "#fca5a5", marginBottom: 12 }}>⚠️ {error}</div>}
      {loading && <div style={{ color: "#64748b" }}>Chargement…</div>}

      {!loading && (
        <table style={s.table}>
          <thead>
            <tr>
              {["Date","Numéro","Bien","Message","Statut"].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {convs.map((c, i) => (
              <tr key={c.id} style={s.row(i)} onClick={() => setSelected(c)}>
                <td style={s.td}>{fmt(c.created_at)}</td>
                <td style={{ ...s.td, color: "#38bdf8", fontFamily: "monospace" }}>{c.from_wa}</td>
                <td style={{ ...s.td, color: "#a78bfa" }}>{c.bien || "—"}</td>
                <td style={{ ...s.td, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.user_msg}</td>
                <td style={s.td}><span style={s.chip(c.ok)}>{ c.ok ? "✓ envoyé" : "✗ erreur" }</span></td>
              </tr>
            ))}
            {convs.length === 0 && !loading && (
              <tr><td colSpan={5} style={{ ...s.td, textAlign: "center", color: "#64748b" }}>
                Aucune conversation — le bot WhatsApp est prêt mais n'a pas encore reçu de message.
              </td></tr>
            )}
          </tbody>
        </table>
      )}

      {selected && (
        <div style={s.drawer}>
          <button style={s.close} onClick={() => setSelected(null)}>✕</button>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Conversation</div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
            {selected.from_wa} · {selected.bien} · {fmt(selected.created_at)}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={s.bubble(false)}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>👤 Voyageur</div>
              {selected.user_msg}
            </div>
            <div style={s.bubble(true)}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>🤖 Bot ({selected.provider || "—"})</div>
              {selected.bot_reply}
            </div>
          </div>
          {!selected.ok && <div style={{ color: "#fca5a5", fontSize: 12, marginTop: 12 }}>⚠️ Envoi WhatsApp échoué</div>}
        </div>
      )}
    </div>
  );
}
