/**
 * CpaCanalTab — data-052 « Combien me coûte une réservation par canal, tout compris ? »
 *
 * Par canal (Airbnb / Booking / Direct) :
 *   - CA brut, commission OTA (taux PAR BIEN via commissionTaux), coût Stripe (direct),
 *     coût marketing (saisie paramétrable, défaut 0, persisté en localStorage),
 *     CPA = (commission + stripe + marketing) / nb résas, net réel, marge %.
 *   - Encart « seuil de rentabilité Ads » : tant que le CPA d'une campagne reste
 *     sous la commission Airbnb évitée (ADR moyen × taux Airbnb), la pub est rentable.
 *
 * Réutilise src/config/canauxCommissions.js (commissionTaux per-bien, FRAIS_STRIPE).
 * Source data = reservations de useAppData (iCal + Beds24), même normalisation que
 * CanalLivePerf (Pilotage.jsx).
 */
import { useMemo, useState, useEffect } from "react";
import { useAppData } from "../AppDataContext.jsx";
import { commissionTaux, airbnbComm, FRAIS_STRIPE, COMMISSIONS_CANAL } from "../config/canauxCommissions.js";

const MKT_KEY = "amaryllis_cpa_marketing_v1";

const normalize = (c) => {
  if (!c) return "autre";
  const l = c.toLowerCase();
  if (l.includes("airbnb")) return "airbnb";
  if (l.includes("booking")) return "booking";
  if (l.includes("direct")) return "direct";
  if (l.includes("beds24")) return "beds24";
  return "autre";
};
const nightsOf = (r) => {
  if (!r.checkin || !r.checkout) return 0;
  const ci = new Date(r.checkin + "T12:00:00Z");
  const co = new Date(r.checkout + "T12:00:00Z");
  return Math.max(1, Math.round((co - ci) / 86400000));
};

const CONF = {
  airbnb:  { label: "Airbnb",      color: "#FF5A5F" },
  booking: { label: "Booking.com", color: "#0ea5e9" },
  direct:  { label: "Direct",      color: "#10b981" },
  beds24:  { label: "Beds24",      color: "#a855f7" },
  autre:   { label: "Autre",       color: "#64748b" },
};

const card = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 10,
  padding: "12px 14px",
};

function loadMkt() {
  try {
    const raw = JSON.parse(localStorage.getItem(MKT_KEY) || "{}");
    return { direct: 0, airbnb: 0, booking: 0, ...raw };
  } catch {
    return { direct: 0, airbnb: 0, booking: 0 };
  }
}

export default function CpaCanalTab() {
  const { reservations = [], mob } = useAppData();
  const [mkt, setMkt] = useState(loadMkt);

  useEffect(() => {
    try { localStorage.setItem(MKT_KEY, JSON.stringify(mkt)); } catch { /* noop */ }
  }, [mkt]);

  const setMktCanal = (canal, val) => {
    const n = Math.max(0, Math.round(Number(val) || 0));
    setMkt((m) => ({ ...m, [canal]: n }));
  };

  const rows = useMemo(() => {
    const agg = {};
    reservations.forEach((r) => {
      if (!r.montant || r.montant <= 0 || !r.checkin || !r.checkout) return;
      const canal = normalize(r.canal);
      if (!agg[canal]) agg[canal] = { canal, brut: 0, count: 0, nights: 0, commission: 0 };
      agg[canal].brut += r.montant;
      agg[canal].count += 1;
      agg[canal].nights += nightsOf(r);
      agg[canal].commission += r.montant * commissionTaux(canal, r.bienId); // per-bien Airbnb
    });
    return Object.values(agg)
      .map((s) => {
        const conf = CONF[s.canal] || CONF.autre;
        const commission = Math.round(s.commission);
        const stripe = s.canal === "direct" ? Math.round(s.brut * FRAIS_STRIPE) : 0;
        const mktCost = Math.round(Number(mkt[s.canal]) || 0);
        const coutAcq = commission + stripe + mktCost;
        const net = s.brut - coutAcq;
        const adr = s.nights > 0 ? Math.round(s.brut / s.nights) : 0;
        const cpa = s.count ? Math.round(coutAcq / s.count) : 0;
        const cpaMkt = s.count ? Math.round(mktCost / s.count) : 0;
        const marge = s.brut ? Math.round((net / s.brut) * 100) : 0;
        return { ...s, ...conf, commission, stripe, mktCost, coutAcq, net, adr, cpa, cpaMkt, marge };
      })
      .sort((a, b) => b.brut - a.brut);
  }, [reservations, mkt]);

  const tBrut = rows.reduce((s, r) => s + r.brut, 0);
  const tMkt = rows.reduce((s, r) => s + r.mktCost, 0);
  const tComm = rows.reduce((s, r) => s + r.commission, 0);
  const tStripe = rows.reduce((s, r) => s + r.stripe, 0);
  const tNet = rows.reduce((s, r) => s + r.net, 0);
  const tCount = rows.reduce((s, r) => s + r.count, 0);
  const cpaMoyen = tCount ? Math.round((tComm + tStripe + tMkt) / tCount) : 0;

  // Seuil de rentabilité Ads pour le canal direct :
  // une résa directe "évite" la commission Airbnb (ADR moyen × taux Airbnb du bien-vitrine).
  // Taux Airbnb de référence = Villa Amaryllis (frais hôte simplifié, 15%).
  const airbnbTaux = airbnbComm("amaryllis");
  const directRow = rows.find((r) => r.canal === "direct");
  const adrRef = directRow && directRow.nights
    ? Math.round(directRow.brut / directRow.nights)
    : 0;
  // panier moyen direct (ADR × nuits moyennes) plutôt que par nuit isolée
  const panierDirect = directRow && directRow.count
    ? Math.round(directRow.brut / directRow.count)
    : 0;
  const seuilAds = panierDirect ? Math.round(panierDirect * airbnbTaux) : 0;

  if (rows.length === 0) {
    return (
      <div style={{ color: "#475569", fontSize: 12, padding: 16 }}>
        Aucune réservation — synchronisez iCal / Beds24.
      </div>
    );
  }

  return (
    <div>
      {/* En-tête KPI */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "CPA moyen pondéré", value: `${cpaMoyen}€`, color: "#f59e0b" },
          { label: "Coût marketing", value: `${(tMkt / 1000).toFixed(1)}k€`, color: "#ef4444" },
          { label: "% CA en commissions", value: tBrut ? `${Math.round((tComm / tBrut) * 100)}%` : "—", color: "#a855f7" },
          { label: "Net global", value: `${(tNet / 1000).toFixed(1)}k€`, color: "#10b981" },
        ].map((k) => (
          <div key={k.label} style={card}>
            <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color, fontFamily: "var(--font-mono)" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Saisie coût marketing par canal */}
      <div style={{ ...card, marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          Budget marketing par canal (€, cumul) · saisie manuelle
        </div>
        <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(1,1fr)" : "repeat(3,1fr)", gap: 10 }}>
          {["direct", "airbnb", "booking"].map((canal) => (
            <label key={canal} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: CONF[canal].color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#cbd5e1", minWidth: 60 }}>{CONF[canal].label}</span>
              <input
                type="number"
                min="0"
                step="10"
                value={mkt[canal] ?? 0}
                onChange={(e) => setMktCanal(canal, e.target.value)}
                style={{
                  flex: 1, minWidth: 0, background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
                  padding: "6px 8px", color: "#e2e8f0", fontSize: 13,
                  fontFamily: "var(--font-mono)",
                }}
              />
              <span style={{ fontSize: 11, color: "#475569" }}>€</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tableau par canal */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rows.map((r) => (
          <div key={r.canal} style={{ ...card, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0" }}>{r.label}</span>
              <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto" }}>{r.count} résa · CPA {r.cpa}€</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(3,1fr)" : "repeat(6,1fr)", gap: 8 }}>
              {[
                { l: "CA brut", v: `${r.brut.toLocaleString("fr-FR")}€`, c: "#e2e8f0" },
                { l: "Commission", v: r.commission ? `-${r.commission.toLocaleString("fr-FR")}€` : "0€", c: r.commission ? "#f87171" : "#64748b" },
                { l: r.canal === "direct" ? "Stripe" : "—", v: r.stripe ? `-${r.stripe.toLocaleString("fr-FR")}€` : "0€", c: r.stripe ? "#f87171" : "#64748b" },
                { l: "Marketing", v: r.mktCost ? `-${r.mktCost.toLocaleString("fr-FR")}€` : "0€", c: r.mktCost ? "#f87171" : "#64748b" },
                { l: "CPA mkt", v: `${r.cpaMkt}€`, c: "#f59e0b" },
                { l: "Marge", v: `${r.marge}%`, c: r.marge >= 80 ? "#10b981" : "#f59e0b" },
              ].map((k, i) => (
                <div key={k.l + i}>
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{k.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: k.c, fontFamily: "var(--font-mono)" }}>{k.v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
              <div style={{ height: 3, width: `${tBrut > 0 ? Math.round((r.brut / tBrut) * 100) : 0}%`, background: r.color, borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 9, color: "#475569", marginTop: 3 }}>
              Net réel {r.net.toLocaleString("fr-FR")}€ · {tBrut > 0 ? Math.round((r.brut / tBrut) * 100) : 0}% du CA
            </div>
          </div>
        ))}
      </div>

      {/* Encart seuil de rentabilité Ads */}
      <div style={{ ...card, marginTop: 14, borderColor: "rgba(16,185,129,0.3)" }}>
        <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700, marginBottom: 4 }}>🎯 Seuil de rentabilité Ads (canal direct)</div>
        <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
          Tant que le CPA d'une campagne Google/Meta reste sous{" "}
          <strong style={{ color: "#10b981" }}>{seuilAds}€</strong> par réservation directe, la pub est rentable :
          elle coûte moins que la commission Airbnb évitée ({Math.round(airbnbTaux * 100)}% du panier direct moyen
          de {panierDirect.toLocaleString("fr-FR")}€).
          {adrRef > 0 && (
            <> ADR direct moyen : {adrRef}€/nuit.</>
          )}
        </div>
      </div>

      <div style={{ fontSize: 9, color: "#334155", marginTop: 10 }}>
        Commissions paramétrables dans src/config/canauxCommissions.js (Airbnb 3% / 15% par bien · Booking {Math.round((COMMISSIONS_CANAL.booking.taux) * 100)}% · Stripe {Math.round(FRAIS_STRIPE * 100)}% sur direct).
        Budget marketing saisi manuellement (persisté localement). CPA = (commission + Stripe + marketing) / nb résas.
      </div>
    </div>
  );
}
