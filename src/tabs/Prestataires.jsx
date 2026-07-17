/**
 * Prestataires — extrait de src/App.jsx (refactor 2026, batch B/5).
 *
 * 2026-07-17 (I-10, prérequis) : migré de localStorage vers D1 (/api/prestataires).
 * Motif : les contacts n'existaient que dans CE navigateur (perte au moindre vidage de
 * cache, invisibles depuis une autre machine) et le backend ne les voyait pas — ce qui
 * rendait impossible toute action serveur les impliquant (concierge IA, alerte ménage
 * généralisée, interventions automatiques).
 *
 * L'ancien localStorage n'est JAMAIS supprimé : il reste un filet de sécurité, et la
 * migration est déclenchée explicitement par l'utilisateur (jamais en silence).
 */
import { useState, useEffect, useCallback } from "react";
import { PRESTATAIRES_KEY, PREST_BIEN_LABELS, PREST_CATEGORIES } from "../App.jsx";
import { adminFetch } from "../lib/apiFetch.js";

const EMPTY_FORM = { nom: "", tel: "", email: "", categorie: "menage", biens: [], notes: "" };

function readLegacyLocal() {
  try {
    const raw = JSON.parse(localStorage.getItem(PRESTATAIRES_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((c) => c?.nom) : [];
  } catch { return []; }
}

export default function Prestataires() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [legacy, setLegacy]     = useState([]);      // contacts encore dans ce navigateur
  const [migrating, setMigrating] = useState(false);
  const [migrateMsg, setMigrateMsg] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterBien, setFilterBien] = useState("all");

  const load = useCallback(async () => {
    try {
      const r = await adminFetch("/api/prestataires");
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setContacts(d.prestataires || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    setLegacy(readLegacyLocal());
  }, [load]);

  const migrate = async () => {
    setMigrating(true);
    setMigrateMsg(null);
    try {
      const r = await adminFetch("/api/prestataires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ import: legacy }),
      });
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setMigrateMsg(
        `✅ ${d.imported} contact${d.imported !== 1 ? "s" : ""} importé${d.imported !== 1 ? "s" : ""}` +
        (d.skipped ? ` · ${d.skipped} ignoré${d.skipped !== 1 ? "s" : ""} (déjà en base)` : "")
      );
      await load();
    } catch (e) {
      setMigrateMsg(`⚠️ Import échoué — ${e.message}. Tes contacts restent intacts dans ce navigateur.`);
    } finally {
      setMigrating(false);
    }
  };

  const submit = async () => {
    if (!form.nom.trim()) return;
    try {
      if (editing !== null) {
        await adminFetch(`/api/prestataires?id=${encodeURIComponent(editing)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setEditing(null);
      } else {
        await adminFetch("/api/prestataires", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const edit = (c) => {
    setForm({ nom: c.nom, tel: c.tel || "", email: c.email || "", categorie: c.categorie, biens: c.biens || [], notes: c.notes || "" });
    setEditing(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const del = async (id) => {
    if (!confirm("Supprimer ce contact ?")) return;
    try {
      await adminFetch(`/api/prestataires?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const toggleBien = (bienId) => {
    setForm(f => ({
      ...f,
      biens: f.biens.includes(bienId) ? f.biens.filter(b => b !== bienId) : [...f.biens, bienId],
    }));
  };

  const filtered = contacts.filter(c => {
    const matchSearch = !search || c.nom.toLowerCase().includes(search.toLowerCase()) || (c.tel || "").includes(search) || (c.notes || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || c.categorie === filterCat;
    const matchBien = filterBien === "all" || (c.biens || []).includes(filterBien);
    return matchSearch && matchCat && matchBien;
  });

  const MUTED = "var(--admin-muted)";
  const CARD_BG = "var(--admin-card)";
  const BORDER = "var(--admin-border)";

  const inputS = {
    background: "var(--admin-bg)", border: `1px solid ${BORDER}`, borderRadius: 8,
    color: "var(--admin-fg)", padding: "9px 12px", fontSize: 13, width: "100%",
    fontFamily: "var(--font-mono)", boxSizing: "border-box",
  };

  // Proposer la migration tant qu'il reste des contacts locaux non repris en base.
  // On compare par nom : si tous les noms locaux existent déjà en base, c'est fait.
  const baseNames = new Set(contacts.map((c) => (c.nom || "").toLowerCase().trim()));
  const notMigrated = legacy.filter((c) => !baseNames.has((c.nom || "").toLowerCase().trim()));

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: MUTED, marginBottom: 4 }}>Logistique</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--admin-fg)" }}>Carnet de prestataires</div>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(s => !s); }}
          style={{ background: "#0e3b3a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: "0.04em" }}
        >
          {showForm && editing === null ? "Annuler" : "+ Ajouter un contact"}
        </button>
      </div>

      {/* ── Bandeau migration : contacts encore prisonniers de ce navigateur ── */}
      {notMigrated.length > 0 && (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--admin-fg)", marginBottom: 4 }}>
            📦 {notMigrated.length} contact{notMigrated.length !== 1 ? "s" : ""} encore stocké{notMigrated.length !== 1 ? "s" : ""} dans ce navigateur
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>
            Ils n'existent que sur cet appareil : vider le cache ou changer de machine les perdrait,
            et le serveur ne peut pas les utiliser. Les importer les sauvegarde et permet aux
            automatisations de les joindre. <strong>Rien n'est supprimé de ce navigateur.</strong>
          </div>
          <button
            onClick={migrate}
            disabled={migrating}
            style={{ background: "#f59e0b", color: "#0f172a", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: migrating ? "wait" : "pointer" }}
          >
            {migrating ? "Import…" : `Importer les ${notMigrated.length} contacts`}
          </button>
          {migrateMsg && <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>{migrateMsg}</div>}
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 12, color: "#ef4444" }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Formulaire ajout/édition ── */}
      {showForm && (
        <div style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--admin-fg)", marginBottom: 16 }}>
            {editing !== null ? "Modifier le contact" : "Nouveau prestataire"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>NOM *</div>
              <input style={inputS} placeholder="Jean Dupont" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>CATÉGORIE</div>
              <select style={inputS} value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}>
                {PREST_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>TÉLÉPHONE</div>
              <input style={inputS} placeholder="+596 696 000 000" value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>EMAIL</div>
              <input style={inputS} placeholder="contact@prestataire.fr" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 8, fontWeight: 600, letterSpacing: "0.06em" }}>PROPRIÉTÉS CONCERNÉES</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(PREST_BIEN_LABELS).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => toggleBien(id)}
                  style={{
                    background: form.biens.includes(id) ? "#0e3b3a" : "transparent",
                    border: `1px solid ${form.biens.includes(id) ? "#0e3b3a" : BORDER}`,
                    color: form.biens.includes(id) ? "#fff" : MUTED,
                    borderRadius: 20, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600,
                  }}
                >{label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 4, fontWeight: 600, letterSpacing: "0.06em" }}>NOTES</div>
            <textarea style={{ ...inputS, height: 72, resize: "vertical" }} placeholder="Tarifs, jours disponibles, commentaires…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={submit}
              style={{ background: "#0e3b3a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >{editing !== null ? "Enregistrer" : "Ajouter"}</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} style={{ background: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 8, padding: "10px 20px", fontSize: 12, cursor: "pointer" }}>Annuler</button>
          </div>
        </div>
      )}

      {/* ── Filtres ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input style={{ ...inputS, maxWidth: 220 }} placeholder="🔍 Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={{ ...inputS, maxWidth: 160 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="all">Toutes catégories</option>
          {PREST_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <select style={{ ...inputS, maxWidth: 160 }} value={filterBien} onChange={e => setFilterBien(e.target.value)}>
          <option value="all">Toutes propriétés</option>
          {Object.entries(PREST_BIEN_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <span style={{ fontSize: 11, color: MUTED, marginLeft: "auto" }}>{filtered.length} contact{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Grille contacts ── */}
      {loading ? (
        <div style={{ textAlign: "center", color: MUTED, padding: "60px 0", fontSize: 14 }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: MUTED, padding: "60px 0", fontSize: 14 }}>
          {contacts.length === 0 ? "Aucun prestataire enregistré. Commencez par ajouter un contact." : "Aucun résultat pour ces filtres."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {filtered.map(c => {
            const cat = PREST_CATEGORIES.find(p => p.id === c.categorie);
            return (
              <div key={c.id} style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{cat?.icon || "📌"}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--admin-fg)" }}>{c.nom}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{cat?.label}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => edit(c)} title="Modifier" style={{ background: "transparent", border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>✏️</button>
                    <button onClick={() => del(c.id)} title="Supprimer" style={{ background: "transparent", border: `1px solid ${BORDER}`, color: "#ef4444", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>🗑</button>
                  </div>
                </div>

                {c.tel && (
                  <a href={`tel:${c.tel}`} style={{ display: "flex", alignItems: "center", gap: 8, color: "#0e3b3a", fontSize: 13, textDecoration: "none", marginBottom: 6 }}>
                    <span>📞</span><span style={{ fontFamily: "var(--font-mono)" }}>{c.tel}</span>
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} style={{ display: "flex", alignItems: "center", gap: 8, color: "#0e3b3a", fontSize: 13, textDecoration: "none", marginBottom: 6 }}>
                    <span>✉️</span><span style={{ fontSize: 12 }}>{c.email}</span>
                  </a>
                )}

                {c.biens && c.biens.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                    {c.biens.map(b => (
                      <span key={b} style={{ background: "rgba(14,59,58,0.08)", color: "#0e3b3a", borderRadius: 12, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>{PREST_BIEN_LABELS[b] || b}</span>
                    ))}
                  </div>
                )}

                {c.notes && (
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 8, lineHeight: 1.5, fontStyle: "italic" }}>{c.notes}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
