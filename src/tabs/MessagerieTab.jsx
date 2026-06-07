// src/tabs/MessagerieTab.jsx
// Onglet "📧 Messagerie" — liste des destinataires + historique.
// ⚠️ Aucune opération top-level sur imports App.jsx (règle .memory/LEARNINGS.md 2026-06-07).
import { useState, useEffect, useMemo } from "react";
import EmailDrawer from "./messagerie/EmailDrawer.jsx";
import EmailComposer from "./messagerie/EmailComposer.jsx";

function formatDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return "à l'instant";
  if (diff < 3600_000) return `il y a ${Math.round(diff / 60_000)} min`;
  if (diff < 86_400_000) return `il y a ${Math.round(diff / 3600_000)} h`;
  if (diff < 7 * 86_400_000) return `il y a ${Math.round(diff / 86_400_000)} j`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function MessagerieTab() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerPrefill, setComposerPrefill] = useState({});

  useEffect(() => {
    const token = sessionStorage.getItem("ldb_tok") || localStorage.getItem("admin_token") || "";
    fetch("/api/emails-log?group=clients", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => setClients(d.clients || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handler = () => {
      const token = sessionStorage.getItem("ldb_tok") || localStorage.getItem("admin_token") || "";
      fetch("/api/emails-log?group=clients", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(r => r.json())
        .then(d => setClients(d.clients || []))
        .catch(() => {});
    };
    window.addEventListener("amaryllis_emails_log_updated", handler);
    return () => window.removeEventListener("amaryllis_emails_log_updated", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(c =>
      (c.to_email || "").toLowerCase().includes(q) ||
      (c.last_subject || "").toLowerCase().includes(q) ||
      (c.bien_id || "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>📧 Messagerie clients</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Historique de tous les emails envoyés aux voyageurs et leads</div>
        </div>
        <input
          type="text" placeholder="Rechercher email, sujet, bien…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none", minWidth: 240 }}
        />
        <button
          onClick={() => { setComposerPrefill({}); setComposerOpen(true); }}
          style={{ marginLeft: "auto", padding: "8px 14px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          ✉ Nouveau mail
        </button>
      </div>

      {loading && <div style={{ fontSize: 12, color: "#64748b" }}>Chargement des conversations…</div>}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 9, padding: "10px 14px", fontSize: 12, color: "#f87171" }}>
          Erreur : {error}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", padding: "40px 0" }}>
          Aucun email envoyé pour le moment.<br />
          <span style={{ fontSize: 11, color: "#475569", marginTop: 6, display: "inline-block" }}>
            Les emails apparaîtront ici dès qu'un envoi sera fait via le système (confirmation Stripe, pré-arrivée, etc.).
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(c => (
          <div
            key={c.to_email}
            onClick={() => setSelectedEmail(c.to_email)}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              background: "rgba(255,255,255,0.03)", borderRadius: 10, cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.04)",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
          >
            <span style={{ fontSize: 14 }}>{c.booking_id ? "🔵" : "⚪"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.to_email}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.last_subject || "—"}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {c.bien_id && (
                <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 600 }}>{c.bien_id}</div>
              )}
              <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{c.count} email{c.count > 1 ? "s" : ""} · {formatDate(c.last_sent)}</div>
            </div>
            <span style={{ fontSize: 10, color: c.last_status === "sent" ? "#10b981" : "#ef4444", fontWeight: 700 }}>
              {c.last_status === "sent" ? "✓" : "✗"}
            </span>
          </div>
        ))}
      </div>

      {selectedEmail && (
        <EmailDrawer
          toEmail={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onCompose={(email) => {
            const client = clients.find(c => c.to_email === email) || {};
            setSelectedEmail(null);
            setComposerPrefill({
              to: email,
              booking_id: client.booking_id || null,
              bien_id: client.bien_id || null,
            });
            setComposerOpen(true);
          }}
        />
      )}
      <EmailComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        defaultTo={composerPrefill.to || ""}
        defaultBookingId={composerPrefill.booking_id || null}
        defaultBienId={composerPrefill.bien_id || null}
        defaultPrenom={composerPrefill.prenom || ""}
        defaultBienNom={composerPrefill.bien_nom || ""}
      />
    </div>
  );
}
