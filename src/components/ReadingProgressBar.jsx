// ReadingProgressBar.jsx — barre de progression de lecture (sticky en haut)
// + CTA réservation flottant qui apparaît après un début de lecture.
// Léger, sans dépendance, SSR-safe (rendu à 0% côté serveur).
// Objectif business : garder un CTA réservation directe toujours accessible
// pendant la lecture du guide (désintermédiation OTA).
// Usage : <ReadingProgressBar /> tout en haut du composant guide.
import { useEffect, useState } from "react";

const CORAL = "#c8614a";
const NAVY  = "#1b2a4a";

export default function ReadingProgressBar({
  color = CORAL,
  cta = "Réserver une villa",
  ctaHref = "/",
  showCtaAfter = 0.12, // fraction de scroll avant l'apparition du CTA
  theme,
}) {
  const [pct, setPct] = useState(0);
  const c = { coral: color, navy: NAVY, ...(theme || {}) };

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const doc = document.documentElement;
        const max = (doc.scrollHeight - doc.clientHeight) || 1;
        const ratio = Math.min(1, Math.max(0, (window.scrollY || doc.scrollTop) / max));
        setPct(ratio);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const ctaVisible = pct >= showCtaAfter && pct < 0.985;

  return (
    <>
      {/* Barre de progression */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: 3,
          zIndex: 60, background: "transparent", pointerEvents: "none",
        }}
      >
        <div
          style={{
            height: "100%", width: `${(pct * 100).toFixed(2)}%`,
            background: `linear-gradient(90deg, ${c.coral} 0%, ${c.navy} 100%)`,
            transition: "width .12s linear",
          }}
        />
      </div>

      {/* CTA réservation flottant */}
      <a
        href={ctaHref}
        data-cta-reservation
        style={{
          position: "fixed", right: 18, bottom: 18, zIndex: 59,
          display: "inline-flex", alignItems: "center", gap: 8,
          fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13,
          letterSpacing: "0.06em", textTransform: "uppercase",
          color: "#fff", background: c.coral, textDecoration: "none",
          padding: "13px 22px", borderRadius: 999,
          boxShadow: "0 8px 26px rgba(200,97,74,0.42)",
          opacity: ctaVisible ? 1 : 0,
          transform: ctaVisible ? "translateY(0)" : "translateY(16px)",
          pointerEvents: ctaVisible ? "auto" : "none",
          transition: "opacity .3s ease, transform .3s ease",
        }}
      >
        {cta} →
      </a>
    </>
  );
}
