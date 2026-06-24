// LeadsTab — leads entrants du formulaire de contact (table D1 `contacts`)
// Admin uniquement. Statuts : nouveau · répondu · archivé.

import { useState, useEffect, useCallback } from "react";

const STATUTS = [
  { id: "nouveau",  label: "Nouveau",  color: "#f59e0b", bg: "#2a1f00" },
  { id: "répondu",  label: "Répondu",  color: "#10b981", bg: "#0a1f16" },
  { id: "archivé",  label: "Archivé",  color: "#475569", bg: "#151a24" },
];
const sm = (s) => STATUTS.find((x) => x.id === s) || { label: s, color: "#94a3b8", bg: "#151a24" };

function fmtDate(ts) {
  if (!ts) return "—";
  const d = new Date(typeof ts === "number" && ts < 1e12 ? ts * 1000 : ts);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function LeadsTab({ token }) {
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");
  const [fStatus, setFStatus] = useState("");
  const [q, setQ]             = useState("");
  const [editing, setEditing] = useState(null);
  const [editNote, setEditNote] = useState("");
  const [busy, setBusy]       = useState(false);

  const tok = token || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("ldb_tok") : "") || "";
  const auth = { Authorization: "Bearer " + tok };

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch("/api/contacts?limit=500", { headers: auth });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Erreur " + r.status);
      setLeads(d.contacts || d.leads || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [tok]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const filtered = leads
    .filter((l) => !fStatus || l.status === fStatus)
    .filter((l) => !q || [l.nom, l.email, l.message, l.bien].some((v) => (v || "").toLowerCase().includes(q.toLowerCase())));

  async function patch(id, payload) {
    setBusy(true);
    try {
      await fetch(`/api/contacts?id=${id}`, {
        method: "PATCH", headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setLeads((prev) => prev.map((x) => x.id === id ? { ...x, ...payload } : x));
    } finally { setBusy(false); }
  }

  const inp = { background: "#0f1420", border: "1px solid #2a3344", color: "#e2e8f0",
    borderRadius: 6, padding: "6px 10px", fontSize: 13, fontFamily: "inherit" };
  const th = { textAlign: "left", padding: "8px 10px", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748b",
    borderBottom: "1px solid #1e2738" };
  const td = { padding: "10px 10px", fontSize: 13, color: "#cbd5e1",
    borderBottom: "1px solid #141b28", verticalAlign: "top" };

  const counts = leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {});

  return (
    <div style={{ padding: "4px 2px", color: "#e2e8f0" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>📬 Leads</h2>
        <span style={{ fontSize: 13, color: "#64748b" }}>{leads.length} messages</span>
        {STATUTS.map((s) => counts[s.id] ? (
          <span key={s.id} style={{ fontSize: 11, fontWeight: 700, color: s.color }}>
            {counts[s.id]} {s.label.toLowerCase()}
          </span>
        ) : null)}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input style={{ ...inp, minWidth: 220 }} placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select style={inp} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">Tous statuts</option>
          {STATUTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button onClick={load} style={{ ...inp, cursor: "pointer" }}>↻</button>
      </div>

      {err && <div style={{ color: "#fca5a5", marginBottom: 10 }}>⚠️ {err}</div>}
      {loading ? <div style={{ color: "#64748b" }}>Chargement…</div> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={th}>Date</th>
                <th style={th}>Nom</th>
                <th style={th}>Email</th>
                <th style={th}>Bien</th>
                <th style={th}>Message</th>
                <th style={th}>Notes</th>
                <th style={th}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const s = sm(l.status);
                return (
                  <tr key={l.id} style={{ background: l.status === "nouveau" ? "rgba(245,158,11,0.04)" : "transparent" }}>
                    <td style={{ ...td, whiteSpace: "nowrap", fontSize: 11, color: "#64748b" }}>{fmtDate(l.created_at)}</td>
                    <td style={{ ...td, fontWeight: 600, color: "#f1f5f9" }}>{l.nom}</td>
                    <td style={td}>
                      <a href={`mailto:${l.email}`} style={{ color: "#60a5fa", textDecoration: "none" }}>{l.email}</a>
                    </td>
                    <td style={{ ...td, fontSize: 12 }}>{l.bien || "—"}</td>
                    <td style={{ ...td, maxWidth: 320, fontSize: 12, color: "#94a3b8", whiteSpace: "pre-wrap" }}>{l.message}</td>
                    <td style={{ ...td, maxWidth: 200 }}>
                      {editing === l.id ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <input style={{ ...inp, fontSize: 11, flex: 1 }} value={editNote}
                            onChange={(e) => setEditNote(e.target.value)} />
                          <button style={{ ...inp, padding: "2px 8px", cursor: "pointer" }}
                            disabled={busy} onClick={() => { patch(l.id, { notes: editNote }); setEditing(null); }}>✓</button>
                        </div>
                      ) : (
                        <span onClick={() => { setEditing(l.id); setEditNote(l.notes || ""); }}
                          style={{ cursor: "pointer", fontSize: 11, color: "#94a3b8", display: "block" }}
                          title="Cliquer pour éditer">
                          {l.notes || <em style={{ color: "#475569" }}>+ note</em>}
                        </span>
                      )}
                    </td>
                    <td style={td}>
                      <select value={l.status} disabled={busy} onChange={(e) => patch(l.id, { status: e.target.value })}
                        style={{ ...inp, padding: "3px 6px", fontSize: 11, color: s.color, background: s.bg, borderColor: s.color + "44" }}>
                        {STATUTS.map((sx) => <option key={sx.id} value={sx.id}
                          style={{ color: "#e2e8f0", background: "#0f1420" }}>{sx.label}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && <div style={{ color: "#64748b", padding: 20, textAlign: "center" }}>Aucun lead.</div>}
        </div>
      )}
    </div>
  );
}
