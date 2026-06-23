// ProgrammeSejour.jsx — timeline éditoriale "Le séjour idéal" (Jour 1 / 2 / 3).
// Rend un programme jour-par-jour pour rendre le guide concret et désirable.
// Données fournies par le contenu généré (workflow guides-contenu-vendeur) :
//   jours = [{ jour:"Jour 1", titre, matin, apresMidi, soir? }, ...]
// Cohérent visuellement avec EncartActivite / BridgeVilla. Animé au scroll.
import Reveal from "./Reveal.jsx";

const NAVY  = "#1b2a4a";
const IVORY = "#faf5e9";
const SAND  = "#e8e0d0";
const CORAL = "#c8614a";
const MUTED = "#8a8070";
const CREAM = "#f5efe0";

const L = {
  fr: { eyebrow: "Le séjour idéal", morning: "Matin", afternoon: "Après-midi", evening: "Soirée" },
  en: { eyebrow: "The perfect stay", morning: "Morning", afternoon: "Afternoon", evening: "Evening" },
};

function Moment({ label, text, t }) {
  if (!text) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{
        fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 10.5,
        letterSpacing: "0.12em", textTransform: "uppercase", color: t.coral,
        display: "block", marginBottom: 2,
      }}>{label}</span>
      <span style={{
        fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 14.5, lineHeight: 1.6,
        color: "#3a3530",
      }}>{text}</span>
    </div>
  );
}

export default function ProgrammeSejour({
  jours = [],
  titre,
  lang = "fr",
  theme,
  style = {},
}) {
  const list = (jours || []).filter(Boolean);
  if (!list.length) return null;

  const t   = { navy: NAVY, ivory: IVORY, sand: SAND, coral: CORAL, muted: MUTED, cream: CREAM, ...(theme || {}) };
  const txt = L[lang] || L.fr;

  return (
    <section style={{ width: "100%", marginBottom: 56, ...style }}>
      <p style={{
        fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11,
        letterSpacing: "0.16em", textTransform: "uppercase", color: t.coral,
        margin: "0 0 18px", display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ width: 22, height: 1, background: t.coral, display: "inline-block" }} />
        {titre || txt.eyebrow}
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${list.length > 1 ? "240px" : "100%"}, 1fr))`,
        gap: 16,
      }}>
        {list.map((d, i) => (
          <Reveal
            key={i}
            delay={i * 90}
            style={{
              background: t.cream,
              border: `1px solid ${t.sand}`,
              borderRadius: 14, padding: "20px 22px 18px",
              display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
              <span style={{
                fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: "#fff", background: t.coral, borderRadius: 6, padding: "4px 10px",
              }}>{d.jour}</span>
              {d.titre && (
                <h3 style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500,
                  fontSize: 21, lineHeight: 1.15, margin: 0, color: t.navy,
                }}>{d.titre}</h3>
              )}
            </div>
            <Moment label={txt.morning} text={d.matin} t={t} />
            <Moment label={txt.afternoon} text={d.apresMidi} t={t} />
            <Moment label={txt.evening} text={d.soir} t={t} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
