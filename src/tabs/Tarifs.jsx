/**
 * Tarifs — prix de base + périodes saisonnières + calendrier des prix.
 * Extrait de src/App.jsx (refactor 2026, batch B/3).
 */
import { useState, useEffect } from "react";
import { DEFAULT_PRIX, BIEN_LABELS, SEASONAL_KEY, SEASON_COLORS, SEASON_COLOR_LABELS, DEFAULT_SEASONS } from "../App.jsx";
import CalendrierTarifs from "./CalendrierTarifs.jsx";
import { useAppData } from "../AppDataContext.jsx";

export default function Tarifs() {
  const { reservations = [] } = useAppData();
  const [prices, setPrices] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("amaryllis_base_preview") || "{}");
      return Object.fromEntries(Object.keys(DEFAULT_PRIX).map(id => [id, (typeof stored[id] === "number" ? stored[id] : DEFAULT_PRIX[id])]));
    } catch { return { ...DEFAULT_PRIX }; }
  });
  const [saved, setSaved] = useState(false);
  const [published, setPublished] = useState(null); // null | "pub" | "err"

  // [2026-06] Le « prix de base » ne pilote plus le site public : l'accroche
  // « dès X€ » est calculée à partir des prix journaliers (source unique).
  // Cette barre reste un aperçu interne (base × saisons). On ne charge donc plus
  // base_prices depuis le serveur et on n'écrit plus dans amaryllis_prices
  // (qui appartient aux prix journaliers) → fin de la collision de clé.

  // ── Seasonal periods ──
  const [seasons, setSeasons] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SEASONAL_KEY) || "null") || DEFAULT_SEASONS; }
    catch { return DEFAULT_SEASONS; }
  });
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [editSeason, setEditSeason]   = useState(null); // null = new
  const [seasonForm, setSeasonForm] = useState({ nom: "", couleur: SEASON_COLORS[0], debut: "", fin: "", mult: 1.2, biens: Object.keys(DEFAULT_PRIX) });
  const [seasonSaved, setSeasonSaved] = useState(false);

  function saveSeasons(next) {
    setSeasons(next);
    localStorage.setItem(SEASONAL_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("amaryllis_seasons_updated", { detail: next }));
    setSeasonSaved(true);
    setTimeout(() => setSeasonSaved(false), 2000);
  }
  function openNewSeason() {
    setEditSeason(null);
    setSeasonForm({ nom: "", couleur: SEASON_COLORS[0], debut: "", fin: "", mult: 1.2, biens: Object.keys(DEFAULT_PRIX) });
    setShowSeasonForm(true);
  }
  function openEditSeason(s) {
    setEditSeason(s.id);
    setSeasonForm({ nom: s.nom, couleur: s.couleur, debut: s.debut, fin: s.fin, mult: s.mult, biens: [...s.biens] });
    setShowSeasonForm(true);
  }
  function submitSeasonForm() {
    if (!seasonForm.nom || !seasonForm.debut || !seasonForm.fin) return;
    const entry = { ...seasonForm, id: editSeason || `s_${Date.now()}` };
    const next = editSeason
      ? seasons.map(s => s.id === editSeason ? entry : s)
      : [...seasons, entry];
    saveSeasons(next);
    setShowSeasonForm(false);
  }
  function deleteSeason(id) {
    saveSeasons(seasons.filter(s => s.id !== id));
  }
  function toggleSeasonBien(bienId) {
    setSeasonForm(f => ({
      ...f,
      biens: f.biens.includes(bienId) ? f.biens.filter(b => b !== bienId) : [...f.biens, bienId],
    }));
  }

  async function save() {
    // Aperçu interne uniquement : stocké dans une clé dédiée (PAS amaryllis_prices,
    // PAS de publication serveur) → n'affecte ni les prix journaliers ni le site public.
    localStorage.setItem("amaryllis_base_preview", JSON.stringify(prices));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setPublished(null);
  }

  // helper: is a date within a season?
  const dateInSeason = (dateStr, s) => dateStr >= s.debut && dateStr <= s.fin;
  // effective price for a bien on a given date
  const effectivePrice = (bienId, dateStr) => {
    const base = prices[bienId] || 0;
    const activeSeason = seasons.find(s => s.biens.includes(bienId) && dateInSeason(dateStr, s));
    return activeSeason ? Math.round(base * activeSeason.mult) : base;
  };

  // Preview: next 7 days effective price for each bien
  const today = new Date();
  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  return (
    <div style={{ padding: "16px 0" }}>

      {/* ── Prix de base (barre compacte) ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 18px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>Prix de base — aperçu interne</div>
          <div style={{ fontSize: 11, color: "#475569" }}>N'affecte PAS le site. L'accroche « dès X€ » = min des prix journaliers (auto). Les prix facturés = le calendrier ci-dessous.</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {published === "pushing" && <span style={{ fontSize: 11, color: "#94a3b8" }}>⏳ Publication…</span>}
            {published === "pub" && <span style={{ fontSize: 11, color: "#34d399" }}>🌐 Publié en ligne (visible partout)</span>}
            {published === "err" && <span style={{ fontSize: 11, color: "#fca5a5" }}>⚠️ Sync serveur échouée — réessaie</span>}
            <button onClick={save} disabled={published === "pushing"} style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: saved ? "#10b981" : "#2563eb", color: "#fff", fontWeight: 600, fontSize: 11, cursor: published === "pushing" ? "default" : "pointer", opacity: published === "pushing" ? 0.6 : 1, transition: "background 0.25s" }}>{saved ? "✓ Enregistré & publié" : "💾 Enregistrer & publier"}</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.keys(DEFAULT_PRIX).map(id => (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "7px 10px", border: `1px solid ${prices[id] !== DEFAULT_PRIX[id] ? "#f59e0b33" : "rgba(255,255,255,0.06)"}` }}>
              <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{BIEN_LABELS[id].replace("Villa ", "").replace("T2 ", "")}</span>
              <input
                type="number" min="0" value={prices[id] ?? ""}
                onChange={e => setPrices(p => ({ ...p, [id]: parseInt(e.target.value) || 0 }))}
                style={{ width: 60, padding: "4px 6px", textAlign: "right", background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#e2e8f0", fontSize: 12, outline: "none" }}
              />
              <span style={{ fontSize: 10, color: "#475569" }}>€</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Remises automatiques ── */}
      <div style={{ background: "rgba(196,114,84,0.06)", border: "1px solid rgba(196,114,84,0.2)", borderRadius: 12, padding: "12px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 18 }}>🎁</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>Remises automatiques sur le site direct</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>7+ nuits : −5% · 14+ nuits : −10% · 28+ nuits : −15%</div>
        </div>
      </div>

      {/* ── Pricing saisonnier ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "16px 18px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 16 }}>🌊</span>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>Périodes tarifaires saisonnières</div>
          <div style={{ fontSize: 11, color: "#475569", flex: 1 }}>Multiplicateurs sur le prix de base</div>
          {seasonSaved && <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>✓ Sauvegardé</span>}
          <button
            onClick={openNewSeason}
            style={{ padding: "6px 13px", borderRadius: 7, border: "none", background: "rgba(99,102,241,0.18)", color: "#818cf8", fontWeight: 700, fontSize: 11, cursor: "pointer" }}
          >+ Ajouter</button>
        </div>

        {seasons.length === 0 && (
          <div style={{ textAlign: "center", color: "#475569", fontSize: 12, padding: "20px 0" }}>Aucune période configurée — cliquez sur « Ajouter »</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {seasons.map(s => {
            const nbBiens = s.biens.length;
            const pct = Math.round((s.mult - 1) * 100);
            const sign = pct >= 0 ? "+" : "";
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "10px 14px", border: `1px solid ${s.couleur}22`, flexWrap: "wrap" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.couleur, flexShrink: 0 }} />
                <div style={{ flex: "1 1 200px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{s.nom}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.debut} → {s.fin} · {nbBiens} bien{nbBiens > 1 ? "s" : ""}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: pct >= 0 ? "#10b981" : "#ef4444" }}>{sign}{pct}%</span>
                  <span style={{ fontSize: 10, color: "#475569" }}>× {s.mult.toFixed(2)}</span>
                </div>
                {/* Mini preview: prix pour chaque bien concerné */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {s.biens.slice(0, 4).map(bId => (
                    <span key={bId} style={{ fontSize: 10, background: `${s.couleur}22`, color: s.couleur, borderRadius: 4, padding: "2px 6px", fontWeight: 600 }}>
                      {BIEN_LABELS[bId]?.replace("Villa ","").replace("T2 ","").slice(0,8)} {Math.round((prices[bId]||0) * s.mult)}€
                    </span>
                  ))}
                  {s.biens.length > 4 && <span style={{ fontSize: 10, color: "#475569" }}>+{s.biens.length - 4}</span>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openEditSeason(s)} style={{ padding: "4px 9px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#94a3b8", fontSize: 11, cursor: "pointer" }}>✏️</button>
                  <button onClick={() => deleteSeason(s.id)} style={{ padding: "4px 9px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Aperçu 7 prochains jours ── */}
        {Object.keys(DEFAULT_PRIX).length > 0 && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>APERÇU — 7 prochains jours (€/nuit effectif)</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                <thead>
                  <tr>
                    <td style={{ padding: "4px 8px", color: "#475569", fontWeight: 700 }}>Bien</td>
                    {nextDays.map(d => {
                      const activeSeason = seasons.find(s => s.biens.some(() => true) && dateInSeason(d, s));
                      return (
                        <td key={d} style={{ padding: "4px 6px", textAlign: "center", color: activeSeason ? activeSeason.couleur : "#475569", fontWeight: activeSeason ? 700 : 400 }}>
                          {d.slice(5)}
                        </td>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(DEFAULT_PRIX).map(bId => (
                    <tr key={bId} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "4px 8px", color: "#94a3b8", whiteSpace: "nowrap" }}>{BIEN_LABELS[bId]?.replace("Villa ","").replace("T2 ","")}</td>
                      {nextDays.map(d => {
                        const ep = effectivePrice(bId, d);
                        const base = prices[bId] || 0;
                        const boosted = ep !== base;
                        const activeSeason = seasons.find(s => s.biens.includes(bId) && dateInSeason(d, s));
                        return (
                          <td key={d} style={{ padding: "4px 6px", textAlign: "center", fontWeight: boosted ? 700 : 400, color: boosted ? (activeSeason?.couleur || "#10b981") : "#475569", background: boosted ? `${activeSeason?.couleur || "#10b981"}11` : "transparent", borderRadius: 4 }}>
                            {ep}€
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Calendrier des prix (toujours visible) ── */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>Calendrier des prix</div>
      <CalendrierTarifs reservations={reservations} />

      {/* ── Modal form période saisonnière ── */}
      {showSeasonForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowSeasonForm(false)}>
          <div style={{ background: "#1e293b", borderRadius: 14, padding: 24, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 18 }}>{editSeason ? "✏️ Modifier la période" : "➕ Nouvelle période tarifaire"}</div>

            {/* Nom */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5 }}>Nom de la période</div>
              <input value={seasonForm.nom} onChange={e => setSeasonForm(f => ({ ...f, nom: e.target.value }))} placeholder="ex: Été 2026, Noël 2026…" style={{ width: "100%", padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Dates */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5 }}>Début</div>
                <input type="date" value={seasonForm.debut} onChange={e => setSeasonForm(f => ({ ...f, debut: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5 }}>Fin</div>
                <input type="date" value={seasonForm.fin} onChange={e => setSeasonForm(f => ({ ...f, fin: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Multiplicateur */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5 }}>Multiplicateur de prix — {Math.round((seasonForm.mult - 1) * 100) >= 0 ? "+" : ""}{Math.round((seasonForm.mult - 1) * 100)}% sur le prix de base</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="range" min="0.5" max="3" step="0.05" value={seasonForm.mult} onChange={e => setSeasonForm(f => ({ ...f, mult: parseFloat(e.target.value) }))} style={{ flex: 1, accentColor: seasonForm.couleur }} />
                <input type="number" min="0.5" max="3" step="0.05" value={seasonForm.mult} onChange={e => setSeasonForm(f => ({ ...f, mult: parseFloat(e.target.value) || 1 }))} style={{ width: 64, padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none", textAlign: "center" }} />
              </div>
            </div>

            {/* Couleur */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Couleur</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {SEASON_COLORS.map((c, i) => (
                  <button key={c} onClick={() => setSeasonForm(f => ({ ...f, couleur: c }))} style={{ width: 26, height: 26, borderRadius: "50%", border: `3px solid ${seasonForm.couleur === c ? "#fff" : "transparent"}`, background: c, cursor: "pointer", flexShrink: 0 }} title={SEASON_COLOR_LABELS[i]} />
                ))}
              </div>
            </div>

            {/* Biens concernés */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Biens concernés ({seasonForm.biens.length}/{Object.keys(DEFAULT_PRIX).length})</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.keys(DEFAULT_PRIX).map(bId => {
                  const active = seasonForm.biens.includes(bId);
                  return (
                    <button key={bId} onClick={() => toggleSeasonBien(bId)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${active ? seasonForm.couleur : "rgba(255,255,255,0.1)"}`, background: active ? `${seasonForm.couleur}22` : "transparent", color: active ? seasonForm.couleur : "#64748b", fontSize: 11, fontWeight: active ? 700 : 400, cursor: "pointer" }}>
                      {BIEN_LABELS[bId]?.replace("Villa ","").replace("T2 ","") || bId}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowSeasonForm(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Annuler</button>
              <button onClick={submitSeasonForm} disabled={!seasonForm.nom || !seasonForm.debut || !seasonForm.fin} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: (!seasonForm.nom || !seasonForm.debut || !seasonForm.fin) ? "#334155" : seasonForm.couleur, color: "#fff", fontSize: 12, fontWeight: 700, cursor: (!seasonForm.nom || !seasonForm.debut || !seasonForm.fin) ? "not-allowed" : "pointer" }}>
                {editSeason ? "Modifier" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
