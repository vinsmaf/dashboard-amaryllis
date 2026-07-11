// src/tabs/MessagerieTab.jsx
// Onglet "📧 Messagerie" — liste des destinataires + historique.
// ⚠️ Aucune opération top-level sur imports App.jsx (règle .memory/LEARNINGS.md 2026-06-07).
import { useState, useEffect, useMemo } from "react";
import EmailDrawer from "./messagerie/EmailDrawer.jsx";
import EmailComposer from "./messagerie/EmailComposer.jsx";
import BulkEmailModal from "./messagerie/BulkEmailModal.jsx";
import EmailTemplatesModal from "./messagerie/EmailTemplatesModal.jsx";

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

function adminToken() {
  return sessionStorage.getItem("ldb_tok") || "";
}

export default function MessagerieTab() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerPrefill, setComposerPrefill] = useState({});
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [gmail, setGmail] = useState({ checked: false, connected: false, accountEmail: null });
  const [gmailSyncing, setGmailSyncing] = useState(false);
  const [gmailBanner, setGmailBanner] = useState(null);

  const reloadClients = () => {
    fetch("/api/emails-log?group=clients", { headers: { Authorization: `Bearer ${adminToken()}` } })
      .then(r => r.json())
      .then(d => setClients(d.clients || []))
      .catch(() => {});
  };

  // Statut de connexion Gmail (bouton "Connecter Gmail" / "✓ connecté")
  useEffect(() => {
    fetch("/api/gmail-sync?status=1", { headers: { Authorization: `Bearer ${adminToken()}` } })
      .then(r => r.json())
      .then(d => setGmail({ checked: true, connected: !!d.connected, accountEmail: d.accountEmail || null }))
      .catch(() => setGmail({ checked: true, connected: false, accountEmail: null }));
  }, []);

  // Retour du flow OAuth (?gmail_oauth=ok|error&provider=gmail dans l'URL après redirection /admin)
  // Ne réagit que si provider=gmail (ou absent, rétro-compat) — le callback OAuth est
  // partagé avec MenageTab (provider=calendar), qui gère son propre effet.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("gmail_oauth");
    const provider = params.get("provider") || "gmail";
    if (!status || provider !== "gmail") return;
    if (status === "ok") {
      const account = params.get("account");
      setGmailBanner({ type: "ok", text: `Gmail connecté${account ? ` (${account})` : ""} ✓` });
      setGmail(g => ({ ...g, connected: true, accountEmail: account || g.accountEmail }));
    } else {
      setGmailBanner({ type: "error", text: `Connexion Gmail échouée : ${params.get("reason") || "erreur inconnue"}` });
    }
    params.delete("gmail_oauth"); params.delete("account"); params.delete("reason"); params.delete("provider");
    const rest = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (rest ? `?${rest}` : ""));
  }, []);

  function connectGmail() {
    window.location.href = `/api/gmail-oauth-start?provider=gmail&token=${encodeURIComponent(adminToken())}`;
  }

  async function syncGmailNow() {
    setGmailSyncing(true);
    try {
      const r = await fetch("/api/gmail-sync", { headers: { Authorization: `Bearer ${adminToken()}` } });
      const d = await r.json();
      if (d.connected === false) {
        setGmailBanner({ type: "error", text: "Gmail non connecté." });
      } else {
        setGmailBanner({ type: "ok", text: `Sync ✓ — ${d.imported ?? 0} nouveau(x) message(s)` });
        reloadClients();
      }
    } catch (e) {
      setGmailBanner({ type: "error", text: `Erreur sync : ${e.message}` });
    }
    setGmailSyncing(false);
  }

  useEffect(() => {
    const token = sessionStorage.getItem("ldb_tok") || "";
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
      const token = sessionStorage.getItem("ldb_tok") || "";
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
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {gmail.checked && (
            gmail.connected ? (
              <>
                <span style={{ fontSize: 11, color: "var(--c-success-light)", fontWeight: 600, whiteSpace: "nowrap" }}>
                  ✓ Gmail connecté{gmail.accountEmail ? ` (${gmail.accountEmail})` : ""}
                </span>
                <button
                  onClick={syncGmailNow}
                  disabled={gmailSyncing}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(110,231,183,0.3)", background: "rgba(16,185,129,0.08)", color: "var(--c-success-light)", fontSize: 12, fontWeight: 700, cursor: gmailSyncing ? "default" : "pointer", whiteSpace: "nowrap" }}
                >
                  {gmailSyncing ? "⏳ Sync…" : "🔄 Sync"}
                </button>
              </>
            ) : (
              <button
                onClick={connectGmail}
                style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)", color: "#fca5a5", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                📩 Connecter Gmail
              </button>
            )
          )}
          <button
            onClick={() => setTemplatesOpen(true)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.3)", background: "rgba(148,163,184,0.08)", color: "#cbd5e1", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            🖋️ Modèles auto
          </button>
          <button
            onClick={() => setBulkOpen(true)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.1)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            📤 Envoi groupé
          </button>
          <button
            onClick={() => { setComposerPrefill({}); setComposerOpen(true); }}
            style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            ✉ Nouveau mail
          </button>
        </div>
      </div>

      {gmailBanner && (
        <div
          onClick={() => setGmailBanner(null)}
          style={{
            marginBottom: 12, padding: "8px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer",
            background: gmailBanner.type === "ok" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            border: `1px solid ${gmailBanner.type === "ok" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
            color: gmailBanner.type === "ok" ? "var(--c-success-light)" : "#f87171",
          }}
        >
          {gmailBanner.text} <span style={{ opacity: 0.6 }}>(clic pour fermer)</span>
        </div>
      )}

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
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 6 }}>
                {c.to_email}
                {c.has_unread_reply && (
                  <span style={{ fontSize: 9, background: "rgba(59,130,246,0.2)", color: "#93c5fd", borderRadius: 4, padding: "1px 6px", fontWeight: 700, textTransform: "uppercase", flexShrink: 0 }}>
                    📩 a répondu
                  </span>
                )}
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
            {c.last_direction === "in" ? (
              <span style={{ fontSize: 10, color: "#93c5fd", fontWeight: 700 }}>📩</span>
            ) : (
              <span style={{ fontSize: 10, color: c.last_status === "sent" ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                {c.last_status === "sent" ? "✓" : "✗"}
              </span>
            )}
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
      <BulkEmailModal isOpen={bulkOpen} onClose={() => setBulkOpen(false)} />
      <EmailTemplatesModal isOpen={templatesOpen} onClose={() => setTemplatesOpen(false)} />
    </div>
  );
}
