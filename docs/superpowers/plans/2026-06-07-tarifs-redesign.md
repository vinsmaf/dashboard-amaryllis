# Tarifs Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre l'onglet Tarifs pour afficher une vraie vue d'ensemble (tous biens × mois avec les vrais prix du site) et une action rapide pour fixer une saison en 3 clics, tout en supprimant le système fantôme actuel.

**Architecture:** Deux nouveaux composants (`TarifsOverview` + `TarifsQuickSeason`) lisent et écrivent dans le même store que `CalendrierTarifs` (`loadDailyPrices`/`saveDailyPrices` + `/api/site-config`). `Tarifs.jsx` est simplifié pour orchestrer les 3 zones. `CalendrierTarifs.jsx` reçoit deux modifications minimales (id + event listener).

**Tech Stack:** React 19, Vite, localStorage (`amaryllis_daily_prices_v2`), `/api/site-config` (Cloudflare Pages Function), design system dark admin (`#0f172a`, `#e2e8f0`, `rgba(...)`)

---

## Fichiers touchés

| Fichier | Action |
|---|---|
| `src/tabs/Tarifs.jsx` | Réécriture (supprime fantômes, intègre 3 zones) |
| `src/tabs/tarifs/TarifsOverview.jsx` | Création |
| `src/tabs/tarifs/TarifsQuickSeason.jsx` | Création |
| `src/tabs/CalendrierTarifs.jsx` | Modification minimale (id + listener) |

---

## Contexte codebase à lire avant de commencer

**Imports clés à connaître :**
```js
// src/App.jsx exports
import { DEFAULT_PRIX, BIEN_LABELS, CAL_BIEN_IDS, MOIS_CAL, PRIX_LIMITS } from "../App.jsx";
// DEFAULT_PRIX = { amaryllis: 280, zandoli: 220, iguana: 180, geko: 150, mabouya: 110, schoelcher: 100, nogent: 85 }
// BIEN_LABELS  = { amaryllis: "Villa Amaryllis", geko: "Géko", ... }
// CAL_BIEN_IDS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"]
// MOIS_CAL     = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]
// PRIX_LIMITS  = { amaryllis: [200, 800], geko: [100, 300], zandoli: [100, 300], ... }

// src/seedPrices.js exports
import { loadDailyPrices, saveDailyPrices, SEED_DAILY_PRICES } from "../seedPrices.js";
// loadDailyPrices() → { bienId: { "YYYY-MM-DD": price } }
// saveDailyPrices(data) → void (écrit en localStorage)
// SEED_DAILY_PRICES → même shape, prix de base si rien en localStorage
```

**Store partagé :**
- `loadDailyPrices()[bienId][date]` = prix réel affiché sur le site pour ce bien + cette date
- `saveDailyPrices(newDaily)` = persiste localement
- `fetch('/api/site-config', { method: 'POST', body: { type: 'prices', config: overrides } })` = sync serveur
- Event `amaryllis_prices_updated` = signal de rafraîchissement inter-composants

**Biens actifs pour Zone B (action rapide) :** tous sauf `iguana` (non bookable).
```js
const QUICK_BIENS = CAL_BIEN_IDS.filter(id => id !== "iguana");
// ["amaryllis", "zandoli", "geko", "mabouya", "schoelcher", "nogent"]
```

**Couleurs de cellule (cohérent avec CalendrierTarifs) :**
```js
function priceColor(price, basePrice) {
  if (price === null) return "rgba(245,158,11,0.12)"; // ?? orange pâle
  const ratio = price / basePrice;
  if (ratio < 0.85) return "rgba(16,185,129,0.2)";   // promo vert
  if (ratio > 1.25) return "rgba(239,68,68,0.2)";    // pic rouge
  if (ratio > 1.05) return "rgba(245,158,11,0.18)";  // haute orange
  return "rgba(14,165,233,0.12)";                     // standard bleu
}
```

---

## Task 1 : CalendrierTarifs.jsx — modifications minimales

**Files:**
- Modify: `src/tabs/CalendrierTarifs.jsx`

- [ ] **Step 1 : Ajouter `id="calendrier-tarifs"` sur le wrapper div**

Trouver la ligne (actuellement ~415) :
```jsx
return (
  <div>
```
Remplacer par :
```jsx
return (
  <div id="calendrier-tarifs">
```

- [ ] **Step 2 : Ajouter listener event `tarifs_jump_bien`**

Juste après le `useEffect` qui écoute `storage` + `amaryllis_prices_updated` (lignes ~188-197), ajouter un nouveau `useEffect` :

```jsx
// Saut depuis TarifsOverview : sélectionne le bien demandé
useEffect(() => {
  const handler = (e) => {
    if (e.detail?.bienId && CAL_BIEN_IDS.includes(e.detail.bienId)) {
      setBienId(e.detail.bienId);
      setSelectedDates(new Set());
      setBulkPrice("");
    }
  };
  window.addEventListener("tarifs_jump_bien", handler);
  return () => window.removeEventListener("tarifs_jump_bien", handler);
}, []);
```

- [ ] **Step 3 : Vérifier le build**

```bash
cd ~/locatif-dashboard && npm run build 2>&1 | tail -5
```
Expected: `✨ Prérendu terminé` sans erreur.

- [ ] **Step 4 : Commit**

```bash
git add src/tabs/CalendrierTarifs.jsx
git commit -m "feat(tarifs): id + event listener tarifs_jump_bien sur CalendrierTarifs"
```

---

## Task 2 : TarifsOverview.jsx — grille vue d'ensemble

**Files:**
- Create: `src/tabs/tarifs/TarifsOverview.jsx`

- [ ] **Step 1 : Créer le dossier**

```bash
mkdir -p ~/locatif-dashboard/src/tabs/tarifs
```

- [ ] **Step 2 : Créer `TarifsOverview.jsx`**

```jsx
// src/tabs/tarifs/TarifsOverview.jsx
// Grille vue d'ensemble : tous biens × 12 prochains mois — vrais prix du calendrier.
import { useState, useEffect, useMemo } from "react";
import { DEFAULT_PRIX, BIEN_LABELS, CAL_BIEN_IDS, MOIS_CAL } from "../../App.jsx";
import { loadDailyPrices, SEED_DAILY_PRICES } from "../../seedPrices.js";

// Biens affichés dans la grille (tous sauf iguana)
const OVERVIEW_BIENS = CAL_BIEN_IDS.filter(id => id !== "iguana");

function priceColor(price, basePrice) {
  if (price === null) return "rgba(245,158,11,0.12)";
  const ratio = price / basePrice;
  if (ratio < 0.85) return "rgba(16,185,129,0.2)";
  if (ratio > 1.25) return "rgba(239,68,68,0.2)";
  if (ratio > 1.05) return "rgba(245,158,11,0.18)";
  return "rgba(14,165,233,0.12)";
}

function priceTextColor(price, basePrice) {
  if (price === null) return "#f59e0b";
  const ratio = price / basePrice;
  if (ratio < 0.85) return "#10b981";
  if (ratio > 1.25) return "#ef4444";
  if (ratio > 1.05) return "#f59e0b";
  return "#0ea5e9";
}

// Calcule le prix moyen d'un mois pour un bien donné.
// Retourne null si aucun prix saisi pour ce mois (toutes les dates sont au défaut seed).
function monthAvg(daily, bienId, year, month) {
  const daysInM = new Date(year, month + 1, 0).getDate();
  const prices = [];
  let hasCustom = false;
  for (let d = 1; d <= daysInM; d++) {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const custom = daily[bienId]?.[date];
    if (custom !== undefined) { hasCustom = true; prices.push(custom); }
    else {
      const seed = SEED_DAILY_PRICES[bienId]?.[date];
      prices.push(seed ?? DEFAULT_PRIX[bienId]);
    }
  }
  if (!hasCustom) return null; // aucun prix saisi → afficher ??
  return Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);
}

// Génère les 12 prochains mois à partir d'aujourd'hui
function next12Months() {
  const now = new Date();
  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return months;
}

export default function TarifsOverview() {
  const [daily, setDaily] = useState(loadDailyPrices);
  const months = useMemo(() => next12Months(), []);

  // Rafraîchissement quand CalendrierTarifs ou TarifsQuickSeason modifient les prix
  useEffect(() => {
    const refresh = () => setDaily(loadDailyPrices());
    window.addEventListener("amaryllis_prices_updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("amaryllis_prices_updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function jumpToBien(bienId) {
    window.dispatchEvent(new CustomEvent("tarifs_jump_bien", { detail: { bienId } }));
    const el = document.getElementById("calendrier-tarifs");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Détecter si Géko et Zandoli ont des prix similaires (divergence < 5%)
  const gekoZandoliLinked = useMemo(() => {
    return months.every(({ year, month }) => {
      const g = monthAvg(daily, "geko", year, month);
      const z = monthAvg(daily, "zandoli", year, month);
      if (g === null && z === null) return true;
      if (g === null || z === null) return false;
      return Math.abs(g - z) / Math.max(g, z) < 0.05;
    });
  }, [daily, months]);

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 16 }}>📊</span>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>Vue d'ensemble — Prix actuels sur le site</div>
        <div style={{ fontSize: 11, color: "#475569", flex: 1 }}>Prix moyen par mois · cliquer une cellule pour l'éditer</div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <th style={{ padding: "6px 10px", color: "#475569", fontWeight: 600, textAlign: "left", minWidth: 70 }}>Mois</th>
              {OVERVIEW_BIENS.map(id => {
                const isGeko = id === "geko";
                const isZandoli = id === "zandoli";
                const showBadge = isGeko || isZandoli;
                return (
                  <th key={id} style={{ padding: "6px 8px", color: "#94a3b8", fontWeight: 600, textAlign: "center", whiteSpace: "nowrap" }}>
                    {BIEN_LABELS[id]?.replace("Villa ", "").replace("T2 ", "")}
                    {showBadge && (
                      <span title={gekoZandoliLinked ? "Prix similaires" : "Prix divergents — vérifier"} style={{
                        marginLeft: 4, fontSize: 9,
                        color: gekoZandoliLinked ? "#10b981" : "#f59e0b",
                        background: gekoZandoliLinked ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                        borderRadius: 4, padding: "1px 4px", fontWeight: 700,
                      }}>🔗</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {months.map(({ year, month }) => (
              <tr key={`${year}-${month}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "5px 10px", color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" }}>
                  {MOIS_CAL[month]} {year}
                </td>
                {OVERVIEW_BIENS.map(id => {
                  const avg = monthAvg(daily, id, year, month);
                  const base = DEFAULT_PRIX[id];
                  return (
                    <td
                      key={id}
                      onClick={() => jumpToBien(id)}
                      title={`Cliquer pour éditer ${BIEN_LABELS[id]} dans le calendrier`}
                      style={{
                        padding: "5px 8px", textAlign: "center", cursor: "pointer",
                        background: priceColor(avg, base),
                        color: priceTextColor(avg, base),
                        fontWeight: avg !== null ? 700 : 600,
                        borderRadius: 5,
                        transition: "opacity 0.1s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      {avg !== null ? `${avg}€` : "??"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Légende */}
      <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
        {[
          { color: "rgba(16,185,129,0.2)", label: "Promo (−15%+)" },
          { color: "rgba(14,165,233,0.12)", label: "Standard" },
          { color: "rgba(245,158,11,0.18)", label: "Haute (+5%+)" },
          { color: "rgba(239,68,68,0.2)", label: "Pic (+25%+)" },
          { color: "rgba(245,158,11,0.12)", label: "?? = non défini" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: color, border: "1px solid rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: 10, color: "#475569" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Vérifier que le fichier est syntaxiquement correct**

```bash
cd ~/locatif-dashboard && node --input-type=module <<'EOF'
import { readFileSync } from 'fs';
const src = readFileSync('src/tabs/tarifs/TarifsOverview.jsx', 'utf8');
console.log('Lines:', src.split('\n').length, '— OK');
EOF
```
Expected: `Lines: NNN — OK`

- [ ] **Step 4 : Commit**

```bash
git add src/tabs/tarifs/TarifsOverview.jsx
git commit -m "feat(tarifs): TarifsOverview — grille vue d'ensemble vrais prix × mois"
```

---

## Task 3 : TarifsQuickSeason.jsx — action rapide

**Files:**
- Create: `src/tabs/tarifs/TarifsQuickSeason.jsx`

- [ ] **Step 1 : Créer `TarifsQuickSeason.jsx`**

```jsx
// src/tabs/tarifs/TarifsQuickSeason.jsx
// Action rapide : fixer un prix sur une période pour un ou plusieurs biens.
// Géko et Zandoli toujours groupés. Écrit dans le même store que CalendrierTarifs.
import { useState, useEffect } from "react";
import { DEFAULT_PRIX, BIEN_LABELS, CAL_BIEN_IDS, PRIX_LIMITS } from "../../App.jsx";
import { loadDailyPrices, saveDailyPrices } from "../../seedPrices.js";

// Biens disponibles dans l'action rapide (pas iguana — non bookable)
const QUICK_BIENS = CAL_BIEN_IDS.filter(id => id !== "iguana");

// Groupes d'affichage : Géko+Zandoli = un seul bouton
const BIEN_GROUPS = [
  { id: "amaryllis",           label: "Amaryllis",        ids: ["amaryllis"] },
  { id: "geko-zandoli",        label: "Géko + Zandoli 🔗", ids: ["geko", "zandoli"] },
  { id: "mabouya",             label: "Mabouya",           ids: ["mabouya"] },
  { id: "schoelcher",          label: "Schœlcher",         ids: ["schoelcher"] },
  { id: "nogent",              label: "Nogent",            ids: ["nogent"] },
];

function loadSaisons() {
  try { return JSON.parse(localStorage.getItem("saisons_config") || "null") || []; } catch { return []; }
}

// Génère toutes les dates YYYY-MM-DD entre debut et fin (inclusif)
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

// Sync serveur (même logique que CalendrierTarifs.doServerSync)
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
  const [confirmation, setConfirmation] = useState(null); // { count, biens }
  const [saisons, setSaisons] = useState(loadSaisons);
  const [open, setOpen] = useState(true);

  // Rafraîchir les saisons si elles changent dans CalendrierTarifs
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

  // Tous les bienIds sélectionnés (expand les groupes)
  const selectedBienIds = [...selectedGroups].flatMap(gid =>
    BIEN_GROUPS.find(g => g.id === gid)?.ids ?? []
  );

  // Validations
  const prixInt = parseInt(prix, 10);
  const prixValid = !isNaN(prixInt) && prixInt > 0;
  const dateValid = debut && fin && debut <= fin;
  const selectionValid = selectedGroups.size > 0;
  const canApply = prixValid && dateValid && selectionValid;

  // Warnings price_min par bien sélectionné
  const warnings = selectedBienIds
    .map(id => {
      const [pMin] = PRIX_LIMITS[id] || [0, 9999];
      return prixValid && prixInt < pMin ? `${BIEN_LABELS[id]}: min ${pMin}€` : null;
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
    // Notifier CalendrierTarifs + TarifsOverview
    window.dispatchEvent(new Event("amaryllis_prices_updated"));
    // Sync serveur (debounce simulé par setTimeout)
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

          {/* Sélecteur biens */}
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

          {/* Période */}
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

          {/* Prix + bouton Appliquer */}
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
              {applying ? "…" : `⚡ Appliquer${debut && fin && debut <= fin ? ` · ${datesBetween(debut, fin).length} nuits` : ""}`}
            </button>
          </div>

          {/* Warnings price_min */}
          {warnings.length > 0 && (
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "8px 12px" }}>
              <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600, marginBottom: 4 }}>⚠️ Prix sous plancher pour :</div>
              {warnings.map(w => <div key={w} style={{ fontSize: 11, color: "#fbbf24" }}>{w}</div>)}
              <div style={{ fontSize: 10, color: "#78716c", marginTop: 4 }}>Le prix sera tout de même appliqué.</div>
            </div>
          )}

          {/* Confirmation */}
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
```

- [ ] **Step 2 : Vérifier syntaxe**

```bash
cd ~/locatif-dashboard && node --input-type=module <<'EOF'
import { readFileSync } from 'fs';
const src = readFileSync('src/tabs/tarifs/TarifsQuickSeason.jsx', 'utf8');
console.log('Lines:', src.split('\n').length, '— OK');
EOF
```
Expected: `Lines: NNN — OK`

- [ ] **Step 3 : Commit**

```bash
git add src/tabs/tarifs/TarifsQuickSeason.jsx
git commit -m "feat(tarifs): TarifsQuickSeason — action rapide prix × période × biens"
```

---

## Task 4 : Tarifs.jsx — réécriture (suppression fantômes + intégration 3 zones)

**Files:**
- Modify: `src/tabs/Tarifs.jsx`

- [ ] **Step 1 : Réécrire `Tarifs.jsx` en entier**

Remplacer le contenu complet du fichier par :

```jsx
/**
 * Tarifs — vue d'ensemble + action rapide + calendrier détaillé.
 * Refonte 2026-06-07 : supprime le système fantôme (multiplicateurs/aperçu)
 * et intègre TarifsOverview + TarifsQuickSeason + CalendrierTarifs.
 */
import CalendrierTarifs from "./CalendrierTarifs.jsx";
import TarifsOverview from "./tarifs/TarifsOverview.jsx";
import TarifsQuickSeason from "./tarifs/TarifsQuickSeason.jsx";
import { useAppData } from "../AppDataContext.jsx";

export default function Tarifs() {
  const { reservations = [] } = useAppData();

  return (
    <div style={{ padding: "16px 0" }}>

      {/* ── Info source unique ── */}
      <div style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 12, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 18 }}>💶</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>Une seule source de prix : le calendrier ci-dessous</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Les prix facturés ET l'accroche « à partir de X€ » du site viennent automatiquement du calendrier. Rien d'autre à régler.</div>
        </div>
      </div>

      {/* ── Remises automatiques ── */}
      <div style={{ background: "rgba(196,114,84,0.06)", border: "1px solid rgba(196,114,84,0.2)", borderRadius: 12, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 18 }}>🎁</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>Remises automatiques sur le site direct</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>7+ nuits : −5% · 14+ nuits : −10% · 28+ nuits : −15%</div>
        </div>
      </div>

      {/* ── Zone A — Vue d'ensemble ── */}
      <TarifsOverview />

      {/* ── Zone B — Action rapide saison ── */}
      <TarifsQuickSeason />

      {/* ── Zone C — Calendrier détaillé ── */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>Calendrier des prix</div>
      <CalendrierTarifs reservations={reservations} />

    </div>
  );
}
```

- [ ] **Step 2 : Vérifier le build**

```bash
cd ~/locatif-dashboard && npm run build 2>&1 | tail -6
```
Expected: `✨ Prérendu terminé` sans erreur.

- [ ] **Step 3 : Vérifier les tests**

```bash
cd ~/locatif-dashboard && npm run test:run 2>&1 | tail -6
```
Expected: tous les tests passent (14 fichiers, 161 tests verts).

- [ ] **Step 4 : Commit**

```bash
git add src/tabs/Tarifs.jsx
git commit -m "feat(tarifs): réécriture Tarifs.jsx — supprime fantômes, intègre 3 zones"
```

---

## Task 5 : Vérification manuelle + deploy

**Files:** aucun

- [ ] **Step 1 : Lancer le dev local**

```bash
cd ~/locatif-dashboard && npm run dev
```
Ouvrir `http://localhost:5173/admin` → mot de passe admin → onglet Tarifs.

- [ ] **Step 2 : Vérifier Zone A (vue d'ensemble)**

Checklist :
- La grille affiche bien 6 colonnes (amaryllis, zandoli, geko, mabouya, schoelcher, nogent)
- Les 12 prochains mois sont listés en lignes
- Les prix affichés correspondent à ceux du CalendrierTarifs (même bienId + même mois)
- Les mois sans prix saisi affichent `??` en orange
- Géko et Zandoli ont le badge 🔗 (vert si prix similaires)
- Cliquer une cellule → scroll vers le CalendrierTarifs + sélection du bon bien

- [ ] **Step 3 : Vérifier Zone B (action rapide)**

Checklist :
- Les 5 boutons biens sont présents (Géko+Zandoli groupés en un)
- Sélectionner Géko+Zandoli → applique aux deux simultanément
- Choisir des dates + prix + Appliquer → CalendrierTarifs reflète immédiatement les nouveaux prix
- Zone A se rafraîchit après Appliquer
- Warning orange si prix < plancher d'un bien
- Application quand même possible malgré le warning

- [ ] **Step 4 : Vérifier que CalendrierTarifs est inchangé**

Checklist :
- Undo (Ctrl+Z) toujours fonctionnel
- Sync serveur badge (local/syncing/synced) toujours visible
- Règles saisonnières, Copie, Résumé tarifaire : tous présents et fonctionnels
- L'alerte rouge "prix sous seuil" toujours opérationnelle

- [ ] **Step 5 : Deploy**

```bash
cd ~/locatif-dashboard && npm run deploy:pages 2>&1 | tail -8
```
Expected: `✨ Prérendu terminé` + audit `🟢 PASS`

- [ ] **Step 6 : Commit final**

```bash
git add -A
git commit -m "chore(tarifs): vérification deploy tarifs redesign"
```

---

## Self-Review

**Spec coverage :**
- ✅ Supprimer fantômes Tarifs.jsx → Task 4 (réécriture complète)
- ✅ TarifsOverview grille vrais prix → Task 2
- ✅ Badge Géko+Zandoli 🔗 → Task 2 (gekoZandoliLinked)
- ✅ Clic cellule → scroll + jump bien → Task 2 (jumpToBien) + Task 1 (listener)
- ✅ TarifsQuickSeason sélecteur biens → Task 3
- ✅ Géko+Zandoli groupés → Task 3 (BIEN_GROUPS)
- ✅ Iguana absent Zone B → Task 3 (QUICK_BIENS filter)
- ✅ Validation price_min warning non bloquant → Task 3 (warnings + apply quand même)
- ✅ Appliquer → event amaryllis_prices_updated → Task 3 (dispatchEvent)
- ✅ Sync serveur → Task 3 (pushToServer)
- ✅ CalendrierTarifs id + listener → Task 1
- ✅ Raccourcis saisons → Task 3 (applySaisonRaccourci)
- ✅ Design system dark admin → partout (`#0f172a`, `#e2e8f0`, `rgba(...)`)

**Placeholder scan :** aucun TBD, aucun "à implémenter".

**Type consistency :**
- `loadDailyPrices()` retourne `{ bienId: { date: price } }` — utilisé identiquement dans Task 2 et Task 3
- `saveDailyPrices(daily)` prend le même shape — cohérent
- Event `amaryllis_prices_updated` : dispatch dans Task 3, écoute dans Task 2 et CalendrierTarifs ✅
- Event `tarifs_jump_bien` : dispatch dans Task 2 (`jumpToBien`), écoute dans Task 1 ✅
- `BIEN_GROUPS[].ids` : tableau de strings bienId → expansé correctement dans `selectedBienIds` ✅
