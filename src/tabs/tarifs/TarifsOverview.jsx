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
