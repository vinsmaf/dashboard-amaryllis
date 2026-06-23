// BridgeVilla.jsx — le "pont" commercial entre une activité/un lieu et nos villas.
// Transforme le désir d'activité en intention de réservation directe :
//   "Organisez ces journées depuis [Villa], à X min de [lieu]."
// Lit la source unique src/data/biens.js (jamais de fait codé en dur).
// Localisation : on affiche le temps de ROUTE réel (passé en prop, validé), pas une
// distance à vol d'oiseau (trompeuse en Martinique) + un lien vers la carte /explorer.
import { getBien } from "../data/biens.js";
import Reveal from "./Reveal.jsx";

const NAVY  = "#1b2a4a";
const IVORY = "#faf5e9";
const SAND  = "#e8e0d0";
const CORAL = "#c8614a";
const MUTED = "#8a8070";
const CREAM = "#f5efe0";
const GOLD  = "#d4a017";

const L = {
  fr: { eyebrow: "Votre camp de base", book: "Réserver en direct", from: "dès", night: "/nuit",
        reviews: "avis", map: "Voir sur la carte", onSite: "sur place", drive: "en voiture" },
  en: { eyebrow: "Your home base", book: "Book direct", from: "from", night: "/night",
        reviews: "reviews", map: "View on map", onSite: "on site", drive: "by car" },
};

export default function BridgeVilla({
  villaId = "amaryllis",
  lieu,                 // nom du lieu/activité du guide (ex: "Grande Anse d'Arlet")
  tempsRoute,           // ex: "35 min" — temps de route réel ; "" ou "sur place" si Sainte-Luce
  copy,                 // phrase pont personnalisée (sinon générée)
  lang = "fr",
  theme,
  mapHref = "/explorer",
  style = {},
}) {
  const bien = getBien(villaId) || getBien("amaryllis");
  if (!bien) return null;

  const t   = { navy: NAVY, ivory: IVORY, sand: SAND, coral: CORAL, muted: MUTED, cream: CREAM, gold: GOLD, ...(theme || {}) };
  const txt = L[lang] || L.fr;
  const photo = (bien.photos && bien.photos[0]) || null;

  const onSite = !tempsRoute || /sur place|on site|0/.test(String(tempsRoute).toLowerCase());
  const distLabel = onSite
    ? txt.onSite
    : `${tempsRoute} ${txt.drive}${lieu ? ` · ${lieu}` : ""}`;

  const defaultCopy = lang === "en"
    ? `Make ${bien.nom} your home base${lieu ? ` for exploring ${lieu}` : ""} — book directly with the owner, no platform fees.`
    : `Faites de ${bien.nom} votre camp de base${lieu ? ` pour explorer ${lieu}` : ""} — réservation en direct avec le propriétaire, sans frais de plateforme.`;

  return (
    <Reveal
      as="section"
      style={{
        width: "100%", marginBottom: 56,
        background: `linear-gradient(135deg, ${t.navy} 0%, #14223d 60%, #1d2f52 100%)`,
        borderRadius: 18, overflow: "hidden",
        boxShadow: "0 10px 34px rgba(27,42,74,0.18)",
        ...style,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 0 }}>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {/* Photo villa */}
          <div style={{ position: "relative", flex: "1 1 240px", minHeight: 200 }}>
            {photo ? (
              <img
                src={photo}
                alt={bien.nom}
                loading="lazy"
                decoding="async"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            ) : (
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg,${t.navy},${t.coral})` }} />
            )}
            {/* badge distance / localisation */}
            <span style={{
              position: "absolute", left: 14, top: 14,
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 13px", borderRadius: 999,
              background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)",
              fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 12, color: t.navy,
            }}>
              <span aria-hidden="true">📍</span>{distLabel}
            </span>
          </div>

          {/* Bloc texte */}
          <div style={{ flex: "1 1 300px", padding: "26px 26px 28px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11,
              letterSpacing: "0.16em", textTransform: "uppercase",
              color: t.coral, margin: "0 0 12px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ width: 22, height: 1, background: t.coral, display: "inline-block" }} />
              {txt.eyebrow}
            </p>

            <h3 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500,
              fontSize: "clamp(22px, 3.4vw, 28px)", lineHeight: 1.18, margin: "0 0 6px",
              color: t.ivory,
            }}>{bien.nom}</h3>

            <p style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 14, lineHeight: 1.6,
              margin: "0 0 18px", color: "rgba(250,245,233,0.78)",
            }}>{copy || defaultCopy}</p>

            <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
              <a
                href={`/${bien.id}`}
                data-cta-reservation
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13,
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  color: "#fff", background: t.coral, textDecoration: "none",
                  padding: "13px 24px", borderRadius: 8,
                  boxShadow: "0 6px 20px rgba(200,97,74,0.34)",
                }}
              >{txt.book} →</a>

              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: "rgba(250,245,233,0.82)" }}>
                {txt.from}{" "}
                <strong style={{ fontWeight: 600, fontSize: 18, color: t.ivory }}>{bien.prix}€</strong>
                <span style={{ color: "rgba(250,245,233,0.6)" }}>{txt.night}</span>
              </span>

              {bien.rating != null && (
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: "rgba(250,245,233,0.82)" }}>
                  <span style={{ color: t.gold }}>★</span> {bien.rating}
                  {bien.reviews != null && <span style={{ color: "rgba(250,245,233,0.6)" }}> · {bien.reviews} {txt.reviews}</span>}
                </span>
              )}

              <a
                href={mapHref}
                style={{
                  fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12,
                  color: "rgba(250,245,233,0.7)", textDecoration: "underline", textUnderlineOffset: 3,
                }}
              >{txt.map} →</a>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
