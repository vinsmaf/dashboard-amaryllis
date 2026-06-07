// src/tabs/tarifs/TarifsQuickSeason.jsx
// Action rapide : fixer un prix sur une période pour un ou plusieurs biens.
// Géko + Zandoli toujours groupés. Écrit dans le même store que CalendrierTarifs.
// ⚠️ Règle critique (cf. .memory/LEARNINGS.md 2026-06-07) : pas d'opération
// top-level sur imports d'App.jsx — tout est wrappé avec || ou différé.
import { useState, useEffect, useMemo } from "react";
import { BIEN_LABELS, PRIX_LIMITS } from "../../App.jsx";
import { loadDailyPrices, saveDailyPrices } from "../../seedPrices.js";

// Groupes d'affichage : Géko+Zandoli = un seul bouton. iguana absent (non bookable).
// Constante littérale safe — aucun import App.jsx au top-level.
const BIEN_GROUPS = [
  { id: "amaryllis",    label: "Amaryllis",         ids: ["amaryllis"] },
  { id: "geko-zandoli", label: "Géko + Zandoli 🔗", ids: ["geko", "zandoli"] },
  { id: "mabouya",      label: "Mabouya",            ids: ["mabouya"] },
  { id: "schoelcher",   label: "Schœlcher",          ids: ["schoelcher"] },
  { id: "nogent",       label: "Nogent",             ids: ["nogent"] },
];

function loadSaisons() {
  try { return JSON.parse(localStorage.getItem("saisons_config") || "null") || []; } catch { return []; }
}

function datesBetween(debut, fin) {
  const dates = [];
  const cur = new Date(debut + "T12:00:00Z");
  const end = new Date(fin + "T12:00:00Z");
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

async function pushToServer(daily) {
  try {
    const overrides = {};
    for (const [bienId, dates] of Object.entries(daily)) {
      for (const [date, price] of Object.entries(dates)) {
        if (!overrides[bienId]) overrides[bienId] = {};
        overrides[bienId][date] = price;
      }
    }
    await fetch("/api/site-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "prices", config: overrides }),
    });
  } catch {}
}

export default function TarifsQuickSeason() {
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [prix, setPrix] = useState("");
  const [applying, setApplying] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [saisons, setSaisons] = useState(loadSaisons);
  const [open, setOpen] = useState(true);

  // ⚠️ DANS le composant — les imports App.jsx sont sûrs ici (post-évaluation)
  const labels = BIEN_LABELS || {};
  const prixLimits = PRIX_LIMITS || {};

  useEffect(() => {
    const refresh = () => setSaisons(loadSaisons());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  function toggleGroup(groupId) {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
    setConfirmation(null);
  }

  function applySaisonRaccourci(s) {
    setDebut(s.debut || "");
    setFin(s.fin || "");
  }

  const selectedBienIds = useMemo(() => {
    return [...selectedGroups].flatMap(gid =>
      BIEN_GROUPS.find(g => g.id === gid)?.ids ?? []
    );
  }, [selectedGroups]);

  const prixInt = parseInt(prix, 10);
  const prixValid = !isNaN(prixInt) && prixInt > 0;
  const dateValid = debut && fin && debut <= fin;
  const selectionValid = selectedGroups.size > 0;
  const canApply = prixValid && dateValid && selectionValid;

  const warnings = selectedBienIds
    .map(id => {
      const limits = prixLimits[id];
      const pMin = limits ? limits[0] : 0;
      return prixValid && prixInt < pMin ? `${labels[id] || id}: min ${pMin}€` : null;
    })
    .filter(Boolean);

  async function applyQuick() {
    if (!canApply) return;
    setApplying(true);
    const dates = datesBetween(debut, fin);
    const daily = loadDailyPrices();
    let totalDates = 0;
    for (const bienId of selectedBienIds) {
      if (!daily[bienId]) daily[bienId] = {};
      for (const date of dates) {
        daily[bienId][date] = prixInt;
        totalDates++;
      }
    }
    saveDailyPrices(daily);
    window.dispatchEvent(new Event("amaryllis_prices_updated"));
    setTimeout(() => pushToServer(daily), 100);
    setConfirmation({ count: totalDates, biens: selectedBienIds.length });
    setApplying(false);
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: open ? 16 : 0 }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontSize: 16 }}>⚡</span>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>Fixer un prix pour une période</div>
        <div style={{ fontSize: 11, color: "#475569", flex: 1 }}>Pour un ou plusieurs biens en une fois</div>
        <span style={{ fontSize: 12, color: "#475569" }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 8 }}>Biens</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {BIEN_GROUPS.map(g => {
                const active = selectedGroups.has(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGroup(g.id)}
                    style={{
                      padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: active ? 700 : 400,
                      background: active ? "#0ea5e9" : "rgba(255,255,255,0.06)",
                      color: active ? "#fff" : "#64748b",
                      transition: "background 0.15s, color 0.15s",
                    }}
                  >{g.label}</button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 8 }}>Période</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <input type="date" value={debut} onChange={e => { setDebut(e.target.value); setConfirmation(null); }}
                style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none" }} />
              <span style={{ color: "#475569", fontSize: 12 }}>→</span>
              <input type="date" value={fin} min={debut} onChange={e => { setFin(e.target.value); setConfirmation(null); }}
                style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none" }} />
              {saisons.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {saisons.map(s => (
                    <button key={s.id} onClick={() => applySaisonRaccourci(s)}
                      style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${s.color || "#6366f1"}44`, background: `${s.color || "#6366f1"}11`, color: s.color || "#a5b4fc", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 8 }}>Prix / nuit</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number" value={prix} min="1" max="9999"
                  onChange={e => { setPrix(e.target.value); setConfirmation(null); }}
                  placeholder="ex: 280"
                  style={{ width: 90, padding: "7px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 13, fontWeight: 700, outline: "none" }}
                />
                <span style={{ fontSize: 12, color: "#475569" }}>€</span>
              </div>
            </div>

            <button
              onClick={applyQuick}
              disabled={!canApply || applying}
              style={{
                padding: "9px 22px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 700, cursor: canApply ? "pointer" : "not-allowed",
                background: canApply ? "#6366f1" : "#1e293b",
                color: canApply ? "#fff" : "#334155",
                transition: "background 0.15s",
              }}
            >
              {applying ? "…" : `⚡ Appliquer${dateValid ? ` · ${datesBetween(debut, fin).length} nuits` : ""}`}
            </button>
          </div>

          {warnings.length > 0 && (
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600, marginBottom: 4 }}>⚠️ Prix sous plancher pour :</div>
              {warnings.map(w => <div key={w} style={{ fontSize: 11, color: "#fbbf24" }}>{w}</div>)}
              <div style={{ fontSize: 10, color: "#78716c", marginTop: 4 }}>Le prix sera tout de même appliqué.</div>
            </div>
          )}

          {confirmation && (
            <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#10b981", fontWeight: 600 }}>
              ✓ {confirmation.count} dates mises à jour pour {confirmation.biens} bien{confirmation.biens > 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
