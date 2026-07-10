// src/tabs/messagerie/EmailDrawer.jsx
// Drawer latéral : fil chronologique d'un client (tous ses emails).
// HTML rendu dans iframe sandboxed (sécurité).
import { useState, useEffect } from "react";

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function EmailDrawer({ toEmail, onClose, onCompose }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [bodyCache, setBodyCache] = useState({});

  useEffect(() => {
    if (!toEmail) return;
    setLoading(true);
    const token = sessionStorage.getItem("ldb_tok") || "";
    fetch(`/api/emails-log?to=${encodeURIComponent(toEmail)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => setEmails(d.emails || []))
      .catch(() => setEmails([]))
      .finally(() => setLoading(false));
  }, [toEmail]);

  async function loadBody(id) {
    if (bodyCache[id]) { setExpanded(id); return; }
    const token = sessionStorage.getItem("ldb_tok") || "";
    try {
      const r = await fetch(`/api/emails-log?body=1&id=${encodeURIComponent(id)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d = await r.json();
      if (d.email) {
        setBodyCache(prev => ({ ...prev, [id]: d.email.html || d.email.text || "<vide>" }));
        setExpanded(id);
      }
    } catch {}
  }

  if (!toEmail) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200,
        display: "flex", justifyContent: "flex-end",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 520, maxWidth: "100%", background: "#0f172a", color: "#e2e8f0",
          padding: "20px 24px", overflowY: "auto", boxShadow: "-4px 0 20px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b" }}>📧 Fil emails</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, wordBreak: "break-all" }}>{toEmail}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {onCompose && (
              <button onClick={() => onCompose(toEmail)}
                style={{ padding: "6px 12px", borderRadius: 7, border: "none", background: "#10b981", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                ✉ Nouveau mail
              </button>
            )}
            <button onClick={onClose}
              style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
              Fermer ✕
            </button>
          </div>
        </div>

        {loading && <div style={{ fontSize: 12, color: "#64748b" }}>Chargement…</div>}
        {!loading && emails.length === 0 && (
          <div style={{ fontSize: 12, color: "#64748b", padding: "20px 0" }}>Aucun échange avec ce voyageur.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {emails.map(e => {
            const inbound = e.direction === "in";
            return (
            <div key={e.id} style={{
              background: inbound ? "rgba(59,130,246,0.08)" : "rgba(255,255,255,0.03)",
              borderRadius: 9, padding: "10px 14px",
              border: inbound ? "1px solid rgba(59,130,246,0.25)" : "1px solid rgba(255,255,255,0.05)",
              marginLeft: inbound ? 0 : 24, marginRight: inbound ? 24 : 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, background: inbound ? "rgba(59,130,246,0.2)" : "rgba(16,185,129,0.15)", color: inbound ? "#93c5fd" : "#6ee7b7", borderRadius: 4, padding: "1px 6px", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {inbound ? "📩 Voyageur" : "📤 Vous"}
                </span>
                {!inbound && (
                  <span style={{ fontSize: 10, color: e.status === "sent" ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                    {e.status === "sent" ? "✓" : "✗"} {e.status}
                  </span>
                )}
                {e.template && (
                  <span style={{ fontSize: 9, background: "rgba(99,102,241,0.15)", color: "#a5b4fc", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
                    {e.template}
                  </span>
                )}
                <span style={{ fontSize: 10, color: "#64748b", marginLeft: "auto" }}>{formatDate(e.sent_at)}</span>
              </div>
              <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{e.subject}</div>
              <button
                onClick={() => expanded === e.id ? setExpanded(null) : loadBody(e.id)}
                style={{ marginTop: 6, padding: "3px 10px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#94a3b8", fontSize: 10, cursor: "pointer" }}
              >
                {expanded === e.id ? "▲ Masquer" : "▼ Voir le contenu"}
              </button>
              {expanded === e.id && bodyCache[e.id] && (
                <iframe
                  sandbox=""
                  srcDoc={bodyCache[e.id]}
                  style={{ width: "100%", height: 360, marginTop: 8, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, background: "#fff" }}
                />
              )}
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}
