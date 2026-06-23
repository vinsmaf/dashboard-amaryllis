import { useState } from "react";
import { useGeo } from "../hooks/useGeo.js";

const NAVY  = "#1b2a4a";
const IVORY = "#faf5e9";
const SAND  = "#e8e0d0";
const CORAL = "#c8614a";
const MUTED = "#8a8070";
const CREAM = "#f5efe0";
const GOLD  = "#d4a017";

const GYG_BASE    = "https://www.getyourguide.com/martinique-l169136/?partner_id=DNI7ML3&q=";
const VIATOR_BASE = "https://www.viator.com";

const L = {
  fr: { eyebrow: "Réserver cette expérience", eyebrowLocal: "Disponible maintenant", book: "Réserver", bookLocal: "Réserver aujourd'hui", from: "dès", reviews: "avis", also: "Aussi sur", disc: "Lien sponsorisé · sans surcoût pour vous" },
  en: { eyebrow: "Book this experience",      eyebrowLocal: "Available now",          book: "Book now", bookLocal: "Book today",             from: "from", reviews: "reviews", also: "Also on", disc: "Sponsored link · no extra cost to you" },
};

const viatorHref = (p) => `${VIATOR_BASE}${p}?m=69894`;
const gygHref    = (q) => `${GYG_BASE}${q || "martinique"}`;

function primaryFor(act, platform) {
  const useGyg = platform === "gyg" || !act.viatorPath;
  return useGyg
    ? { href: gygHref(act.gygQ), secondLabel: "Viator", secondHref: act.viatorPath ? viatorHref(act.viatorPath) : null }
    : { href: viatorHref(act.viatorPath), secondLabel: "GetYourGuide", secondHref: gygHref(act.gygQ) };
}

function Carte({ act, t, txt, platform, big, dark, isLocal }) {
  const [imgSrc, setImgSrc] = useState(act.image);
  const [imgFail, setImgFail] = useState(false);
  const { href, secondLabel, secondHref } = primaryFor(act, platform);
  const imgH = big ? "clamp(180px, 32vw, 240px)" : 172;

  const onImgError = () => {
    if (act.fallbackImg && imgSrc !== act.fallbackImg) {
      setImgSrc(act.fallbackImg);
    } else {
      setImgFail(true);
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener noreferrer"
      style={{
        display: "flex", flexDirection: "column", height: "100%",
        textDecoration: "none", color: "inherit",
        background: dark ? "rgba(250,245,233,0.04)" : "#fff",
        border: `1px solid ${dark ? "rgba(200,97,74,0.35)" : t.sand}`,
        borderRadius: 14, overflow: "hidden",
        boxShadow: "0 2px 14px rgba(27,42,74,0.06)",
        transition: "transform .25s ease, box-shadow .25s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 10px 28px rgba(27,42,74,0.13)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 2px 14px rgba(27,42,74,0.06)";
      }}
    >
      <div style={{ position: "relative", width: "100%", height: imgH, background: t.cream, overflow: "hidden" }}>
        {!imgFail && imgSrc ? (
          <img
            src={imgSrc}
            alt={act.titre}
            loading="lazy"
            decoding="async"
            onError={onImgError}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: big ? 60 : 46,
              background: `linear-gradient(135deg, ${t.navy} 0%, ${t.coral} 100%)`,
            }}
            aria-hidden="true"
          >{act.icon || "🌴"}</div>
        )}
        {act.note != null && (
          <span style={{
            position: "absolute", left: 12, bottom: 12,
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 11px", borderRadius: 999,
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)",
            fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 12, color: t.navy,
          }}>
            <span style={{ color: GOLD }}>★</span>{act.note}
            {act.reviews != null && (
              <span style={{ color: t.muted, fontWeight: 300 }}>· {act.reviews} {txt.reviews}</span>
            )}
          </span>
        )}
      </div>

      <div style={{ padding: big ? "20px 22px 22px" : "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        <h3 style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400,
          fontSize: big ? 25 : 20, lineHeight: 1.2, margin: "0 0 6px",
          color: dark ? t.ivory : t.navy,
        }}>{act.titre}</h3>

        {act.accroche && (
          <p style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 300,
            fontSize: big ? 14 : 13, lineHeight: 1.55,
            margin: "0 0 16px", color: dark ? "rgba(250,245,233,0.7)" : t.muted,
          }}>{act.accroche}</p>
        )}

        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          {act.prix != null && (
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: dark ? "rgba(250,245,233,0.7)" : t.navy }}>
              {txt.from}{" "}
              <strong style={{ fontWeight: 600, fontSize: big ? 19 : 17, color: dark ? t.ivory : t.navy }}>{act.prix}€</strong>
            </span>
          )}
          <span style={{
            fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 12,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: "#fff", background: t.coral, borderRadius: 7,
            padding: "10px 20px", whiteSpace: "nowrap",
            boxShadow: "0 4px 14px rgba(200,97,74,0.28)",
          }}>{isLocal ? txt.bookLocal : txt.book} →</span>
        </div>

        {secondHref && (
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, marginTop: 10, color: dark ? "rgba(250,245,233,0.5)" : t.muted }}>
            {txt.also}{" "}
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(secondHref, "_blank", "noopener,noreferrer"); }}
              style={{ color: dark ? t.ivory : t.navy, textDecoration: "underline", cursor: "pointer" }}
            >{secondLabel}</span>
          </span>
        )}
      </div>
    </a>
  );
}

export default function EncartActivite({
  activites = [],
  variant = "card",
  lang = "fr",
  eyebrow,
  platform = "viator",
  theme,
  style = {},
}) {
  const geo = useGeo();
  const isLocal = geo?.isCaribbean === true;

  const list = (activites || []).filter(Boolean).slice(0, 2);
  if (!list.length) return null;

  const t   = { navy: NAVY, ivory: IVORY, sand: SAND, coral: CORAL, muted: MUTED, cream: CREAM, ...(theme || {}) };
  const txt = L[lang] || L.fr;
  const duo  = list.length === 2;
  const dark = variant === "navy";

  return (
    <section style={{
      width: "100%", marginBottom: 56,
      background: dark ? "linear-gradient(135deg,#0a2e2d 0%,#0e3b3a 60%,#163f3e 100%)" : t.cream,
      border: `1px solid ${dark ? "rgba(200,97,74,0.3)" : t.sand}`,
      borderRadius: 18, padding: "26px 24px 28px", ...style,
    }}>
      <p style={{
        fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11,
        letterSpacing: "0.14em", textTransform: "uppercase",
        color: t.coral, margin: "0 0 16px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ width: 22, height: 1, background: t.coral, display: "inline-block" }} />
        {eyebrow || (isLocal ? txt.eyebrowLocal : txt.eyebrow)}
        {isLocal && (
          <span style={{
            fontSize: 10, fontWeight: 500, letterSpacing: "0.06em",
            background: "rgba(200,97,74,0.15)", color: t.coral,
            border: "1px solid rgba(200,97,74,0.3)",
            borderRadius: 999, padding: "2px 8px",
          }}>📍 En Martinique</span>
        )}
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: duo ? "repeat(auto-fit, minmax(250px, 1fr))" : "1fr",
        gap: 16,
      }}>
        {list.map((act, i) => (
          <Carte key={act.key || act.viatorPath || i} act={act} t={t} txt={txt} platform={platform} big={!duo} dark={dark} isLocal={isLocal} />
        ))}
      </div>

      <p style={{
        fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10.5,
        letterSpacing: "0.04em",
        color: dark ? "rgba(250,245,233,0.45)" : t.muted,
        margin: "14px 0 0", textAlign: "right",
      }}>{txt.disc}</p>
    </section>
  );
}
