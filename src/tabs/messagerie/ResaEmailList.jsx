// src/tabs/messagerie/ResaEmailList.jsx
// Panneau compact intégré dans le détail d'une réservation Planning.
// Liste les emails envoyés à cette résa (par booking_id si dispo, sinon par email).
// Clic sur un email → ouvre EmailDrawer.
import { useState, useEffect } from "react";
import EmailDrawer from "./EmailDrawer.jsx";
import EmailComposer from "./EmailComposer.jsx";

function formatDateShort(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export default function ResaEmailList({ bookingId, email }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    if (!bookingId && !email) { setLoading(false); return; }
    const token = sessionStorage.getItem("ldb_tok") || "";
    const query = bookingId
      ? `booking_id=${encodeURIComponent(bookingId)}`
      : `to=${encodeURIComponent(email)}`;
    fetch(`/api/emails-log?${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => setEmails(d.emails || []))
      .catch(() => setEmails([]))
      .finally(() => setLoading(false));
  }, [bookingId, email]);

  if (loading) {
    return <div style={{ fontSize: 11, color: "#64748b", padding: "8px 0" }}>📧 Chargement emails…</div>;
  }
  if (emails.length === 0) {
    return (
      <div style={{ fontSize: 11, color: "#475569", padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 7, border: "1px dashed rgba(255,255,255,0.06)" }}>
        📧 Aucun email envoyé pour cette résa
      </div>
    );
  }

  return (
    <>
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>📧 Emails envoyés ({emails.length})</span>
          {email && (
            <button
              onClick={() => setDrawerOpen(true)}
              style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 5, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#94a3b8", fontSize: 10, cursor: "pointer" }}
            >
              Voir tout →
            </button>
          )}
          {email && (
            <button onClick={() => setComposerOpen(true)}
              style={{ padding: "2px 8px", borderRadius: 5, border: "none", background: "#10b981", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
              ✉ Nouveau
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 180, overflowY: "auto" }}>
          {emails.slice(0, 6).map(e => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#94a3b8", padding: "3px 0" }}>
              <span style={{ fontSize: 9, color: e.status === "sent" ? "#10b981" : "#ef4444" }}>
                {e.status === "sent" ? "✓" : "✗"}
              </span>
              <span style={{ fontSize: 9, color: "#64748b", minWidth: 38 }}>{formatDateShort(e.sent_at)}</span>
              {e.template && (
                <span style={{ fontSize: 9, background: "rgba(99,102,241,0.15)", color: "#a5b4fc", borderRadius: 3, padding: "0 5px" }}>
                  {e.template}
                </span>
              )}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{e.subject}</span>
            </div>
          ))}
        </div>
      </div>
      {drawerOpen && email && (
        <EmailDrawer toEmail={email} onClose={() => setDrawerOpen(false)} />
      )}
      {composerOpen && email && (
        <EmailComposer
          isOpen={composerOpen}
          onClose={() => setComposerOpen(false)}
          defaultTo={email}
          defaultBookingId={bookingId}
        />
      )}
    </>
  );
}
