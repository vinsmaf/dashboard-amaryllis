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
