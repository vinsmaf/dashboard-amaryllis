// GuestContactsTab — base de contacts voyageurs/locataires (table D1 guest_contacts)
// Source : scan WhatsApp + onglet "Toutes les Réservations". Admin uniquement (Bearer token).

import { useState, useEffect, useCallback, useMemo } from "react";

const STATUTS = [
  { id: "locataire",    label: "Locataire",     color: "#10b981", bg: "#0a1f16" },
  { id: "longue_duree", label: "Longue durée",  color: "#60a5fa", bg: "#0d1829" },
  { id: "prospect",     label: "Prospect",      color: "#f59e0b", bg: "#2a1f00" },
  { id: "a_confirmer",  label: "À confirmer",   color: "#a78bfa", bg: "#1c142e" },
];
const statutMeta = (s) => STATUTS.find((x) => x.id === s) || { label: s || "—", color: "#94a3b8", bg: "#1a1f29" };

function fmtDate(d) {
  if (!d) return "—";
  const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(d);
}
function fmtEur(v) {
  if (v == null || v === "") return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v) + " €";
}
// nom de famille normalisé pour détecter les doublons
function lastNameKey(nom) {
  const clean = String(nom || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\(.*?\)/g, "").replace(/[^a-z ]/g, " ").trim();
  const words = clean.split(/\s+/).filter((w) => w.length > 2 &&
    !["locataire", "client", "villa", "studio", "amaryllis", "zandoli", "geko", "mabouya",
      "iguana", "schoelcher", "nogent", "airbnb", "juillet", "aout", "fevrier", "avril",
      "janvier", "novembre", "mars", "potentiel"].includes(w));
  return words.sort().join(" ");
}

export default function GuestContactsTab({ token }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState("");
  const [fStatut, setFStatut]   = useState("");
  const [fBien, setFBien]       = useState("");
  const [fSource, setFSource]   = useState("");
  const [q, setQ]               = useState("");
  const [showDupes, setShowDupes] = useState(false);
  const [editing, setEditing]   = useState(null); // id en cours d'édition notes
  const [editNote, setEditNote] = useState("");
  const [busy, setBusy]         = useState(false);

  const tok = token || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("ldb_tok") : "") || "";
  const auth = { Authorization: "Bearer " + tok };

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch("/api/guest-contacts?limit=1000", { headers: auth });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Erreur " + r.status);
      setContacts(d.contacts || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [tok]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  // groupes de doublons potentiels : on ne groupe que sur un nom COMPLET (≥2 mots
  // significatifs), sinon un simple prénom partagé crée des faux positifs.
  const dupeGroups = useMemo(() => {
    const map = {};
    contacts.forEach((c) => {
      const k = lastNameKey(c.nom);
      if (!k || k.split(" ").length < 2) return;
      (map[k] = map[k] || []).push(c);
    });
    return Object.entries(map).filter(([, arr]) => arr.length > 1).map(([k, arr]) => ({ key: k, arr }));
  }, [contacts]);
  const dupeIds = useMemo(() => new Set(dupeGroups.flatMap((g) => g.arr.map((c) => c.id))), [dupeGroups]);

  const biens = useMemo(() => [...new Set(contacts.map((c) => c.bien).filter(Boolean))].sort(), [contacts]);

  const filtered = useMemo(() => {
    let list = contacts;
    if (showDupes) list = list.filter((c) => dupeIds.has(c.id));
    if (fStatut) list = list.filter((c) => c.statut === fStatut);
    if (fBien)   list = list.filter((c) => c.bien === fBien);
    if (fSource) list = list.filter((c) => c.source === fSource);
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((c) => [c.nom, c.telephone, c.email, c.notes].some((v) => (v || "").toLowerCase().includes(s)));
    }
    return [...list].sort((a, b) => String(a.nom).localeCompare(String(b.nom), "fr"));
  }, [contacts, fStatut, fBien, fSource, q, showDupes, dupeIds]);

  async function patchStatut(c, statut) {
    setBusy(true);
    try {
      await fetch(`/api/guest-contacts?id=${c.id}`, {
        method: "PATCH", headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, statut } : x)));
    } finally { setBusy(false); }
  }
  async function saveNote(c) {
    setBusy(true);
    try {
      await fetch(`/api/guest-contacts?id=${c.id}`, {
        method: "PATCH", headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editNote }),
      });
      setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, notes: editNote } : x)));
      setEditing(null);
    } finally { setBusy(false); }
  }
  async function remove(c) {
    if (!confirm(`Supprimer "${c.nom}" ?`)) return;
    setBusy(true);
    try {
      await fetch(`/api/guest-contacts?id=${c.id}`, { method: "DELETE", headers: auth });
      setContacts((prev) => prev.filter((x) => x.id !== c.id));
    } finally { setBusy(false); }
  }
  async function merge(keep, drop) {
    if (!confirm(`Fusionner "${drop.nom}" dans "${keep.nom}" ?\n"${keep.nom}" est conservé, ses champs vides seront comblés, puis "${drop.nom}" supprimé.`)) return;
    setBusy(true);
    try {
      const r = await fetch("/api/guest-contacts?action=merge", {
        method: "POST", headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ keepId: keep.id, dropId: drop.id }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Erreur fusion");
      await load();
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  }

  const counts = useMemo(() => {
    const by = {};
    contacts.forEach((c) => { by[c.statut] = (by[c.statut] || 0) + 1; });
    return by;
  }, [contacts]);

  const inp = { background: "#0f1420", border: "1px solid #2a3344", color: "#e2e8f0",
    borderRadius: 6, padding: "6px 10px", fontSize: 13, fontFamily: "inherit" };
  const th = { textAlign: "left", padding: "8px 10px", fontSize: 10, fontWeight: 700,
    letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748b", borderBottom: "1px solid #1e2738" };
  const td = { padding: "8px 10px", fontSize: 13, color: "#cbd5e1", borderBottom: "1px solid #141b28", verticalAlign: "top" };

  return (
    <div style={{ padding: "4px 2px", color: "#e2e8f0" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>👥 Contacts voyageurs</h2>
        <span style={{ fontSize: 13, color: "#64748b" }}>{contacts.length} contacts</span>
        {STATUTS.map((s) => counts[s.id] ? (
          <span key={s.id} style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{counts[s.id]} {s.label.toLowerCase()}</span>
        ) : null)}
      </div>

      {/* filtres */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
        <input style={{ ...inp, minWidth: 220 }} placeholder="Rechercher nom / tél / email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select style={inp} value={fStatut} onChange={(e) => setFStatut(e.target.value)}>
          <option value="">Tous statuts</option>
          {STATUTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select style={inp} value={fBien} onChange={(e) => setFBien(e.target.value)}>
          <option value="">Tous biens</option>
          {biens.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select style={inp} value={fSource} onChange={(e) => setFSource(e.target.value)}>
          <option value="">Toutes sources</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="sheet">Sheet</option>
        </select>
        <button onClick={() => setShowDupes((v) => !v)} style={{ ...inp, cursor: "pointer",
          background: showDupes ? "#3b1d1d" : "#0f1420", borderColor: showDupes ? "#ef4444" : "#2a3344",
          color: showDupes ? "#fca5a5" : "#e2e8f0" }}>
          {showDupes ? "✓ " : ""}Doublons potentiels{dupeGroups.length ? ` (${dupeGroups.length})` : ""}
        </button>
        <button onClick={load} style={{ ...inp, cursor: "pointer" }}>↻ Recharger</button>
      </div>

      {err && <div style={{ color: "#fca5a5", marginBottom: 10 }}>⚠️ {err}</div>}
      {loading ? <div style={{ color: "#64748b" }}>Chargement…</div> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
            <thead>
              <tr>
                <th style={th}>Nom</th><th style={th}>Téléphone</th><th style={th}>Email</th>
                <th style={th}>Bien</th><th style={th}>Séjour</th><th style={th}>Montant</th>
                <th style={th}>Canal</th><th style={th}>Statut</th><th style={th}>Source</th>
                <th style={th}>Notes</th><th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const dup = dupeIds.has(c.id);
                const others = dup ? dupeGroups.find((g) => g.arr.some((x) => x.id === c.id)).arr.filter((x) => x.id !== c.id) : [];
                const sm = statutMeta(c.statut);
                return (
                  <tr key={c.id} style={{ background: dup ? "rgba(239,68,68,0.05)" : "transparent" }}>
                    <td style={{ ...td, fontWeight: 600, color: "#f1f5f9" }}>
                      {dup && <span title="Doublon potentiel" style={{ marginRight: 5 }}>🔗</span>}{c.nom}
                    </td>
                    <td style={{ ...td, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{c.telephone || "—"}</td>
                    <td style={td}>{c.email || "—"}</td>
                    <td style={td}>{c.bien || "—"}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{c.date_arrivee ? `${fmtDate(c.date_arrivee)}→${fmtDate(c.date_depart)}` : "—"}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtEur(c.montant_eur)}</td>
                    <td style={td}>{c.canal || "—"}</td>
                    <td style={td}>
                      <select value={c.statut} disabled={busy} onChange={(e) => patchStatut(c, e.target.value)}
                        style={{ ...inp, padding: "3px 6px", fontSize: 11, color: sm.color, background: sm.bg, borderColor: sm.color + "44" }}>
                        {STATUTS.map((s) => <option key={s.id} value={s.id} style={{ color: "#e2e8f0", background: "#0f1420" }}>{s.label}</option>)}
                      </select>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: 10, color: c.source?.includes("sheet") ? "#34d399" : "#818cf8" }}>{c.source}</span>
                    </td>
                    <td style={{ ...td, maxWidth: 240 }}>
                      {editing === c.id ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <input style={{ ...inp, fontSize: 11, flex: 1 }} value={editNote} onChange={(e) => setEditNote(e.target.value)} />
                          <button style={{ ...inp, padding: "2px 8px", cursor: "pointer" }} disabled={busy} onClick={() => saveNote(c)}>✓</button>
                        </div>
                      ) : (
                        <span onClick={() => { setEditing(c.id); setEditNote(c.notes || ""); }}
                          style={{ cursor: "pointer", fontSize: 11, color: "#94a3b8", display: "block" }} title="Cliquer pour éditer">
                          {c.notes || <em style={{ color: "#475569" }}>+ note</em>}
                        </span>
                      )}
                    </td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>
                      {dup && others.map((o) => (
                        <button key={o.id} disabled={busy} onClick={() => merge(c, o)} title={`Fusionner "${o.nom}" dans "${c.nom}"`}
                          style={{ ...inp, padding: "2px 7px", fontSize: 10, cursor: "pointer", marginRight: 4, color: "#fca5a5", borderColor: "#ef444455" }}>
                          ⬅ fusion #{o.id}
                        </button>
                      ))}
                      <button disabled={busy} onClick={() => remove(c)} title="Supprimer"
                        style={{ ...inp, padding: "2px 7px", fontSize: 11, cursor: "pointer", color: "#94a3b8" }}>🗑</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!filtered.length && <div style={{ color: "#64748b", padding: 20, textAlign: "center" }}>Aucun contact.</div>}
        </div>
      )}
      {showDupes && (
        <p style={{ fontSize: 11, color: "#64748b", marginTop: 10 }}>
          🔗 = même nom de famille détecté. Le bouton <strong style={{ color: "#fca5a5" }}>⬅ fusion</strong> fusionne l'autre contact <em>dans</em> la ligne courante (champs vides comblés, notes concaténées). Vérifie que c'est bien la même personne avant de fusionner.
        </p>
      )}
    </div>
  );
}
