// GuideHero.jsx — Hero fullscreen pour les guides avec parallax image.
// Remplace le bloc hero statique (height: min(90vh, 620px)) par un effet
// immersif 100vh + déplacement parallax au scroll.
// SSR-safe, iOS-safe, RAF-throttlé, willChange géré dynamiquement.
import { useEffect, useRef } from "react";

const CORAL = "#c8614a";
const IVORY = "#faf5e9";

export default function GuideHero({
  img,
  alt = "",
  eyebrow,
  title,
  subtitle,
  badges = [],
  ctaHref = "/",
  lang = "fr",
  navLogo = "/",
  navBack = null, // { href, label }
}) {
  const imgRef = useRef(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    // Désactiver le parallax sur iOS Safari (position:fixed + transform = bugs scroll)
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isIOS) return;

    let raf = 0;
    let willChangeActive = false;
    let stopTimer = null;

    const setWillChange = (active) => {
      if (active === willChangeActive) return;
      willChangeActive = active;
      el.style.willChange = active ? "transform" : "auto";
    };

    const onScroll = () => {
      if (stopTimer) clearTimeout(stopTimer);
      setWillChange(true);

      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const scrollY = window.scrollY || window.pageYOffset;
        el.style.transform = `translateY(${scrollY * 0.35}px)`;
      });

      stopTimer = setTimeout(() => {
        setWillChange(false);
        stopTimer = null;
      }, 300);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
      if (stopTimer) clearTimeout(stopTimer);
    };
  }, []);

  return (
    <section
      style={{
        position: "relative",
        height: "100vh",
        minHeight: 600,
        overflow: "hidden",
      }}
    >
      {/* Image parallax — surdimensionnée pour le déplacement */}
      <img
        ref={imgRef}
        src={img}
        alt={alt}
        style={{
          position: "absolute",
          top: "-15%",
          left: 0,
          width: "100%",
          height: "130%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* Gradient overlay — fort en haut (nav lisible) + fort en bas (texte lisible) */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(14,59,58,0.65) 0%, rgba(14,59,58,0.05) 30%, rgba(14,59,58,0.05) 55%, rgba(14,59,58,0.92) 100%)",
        }}
      />

      {/* Nav transparente overlayée — disparaît après hero, sticky nav prend le relais */}
      <nav
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "20px clamp(20px,5vw,48px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <a
          href={navLogo}
          style={{
            color: IVORY,
            textDecoration: "none",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            fontSize: 18,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Amaryllis
        </a>
        {navBack && (
          <a
            href={navBack.href}
            style={{
              color: IVORY,
              textDecoration: "none",
              fontFamily: "'Jost', sans-serif",
              fontWeight: 300,
              fontSize: 12,
              letterSpacing: "0.08em",
              opacity: 0.75,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
              <path d="M5 1 L1 5 L5 9M1 5 h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {navBack.label}
          </a>
        )}
      </nav>

      {/* Contenu texte en bas */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 clamp(20px,5vw,48px) clamp(40px,8vh,80px)",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
          {eyebrow && (
            <p
              style={{
                color: CORAL,
                fontFamily: "'Jost', sans-serif",
                fontWeight: 300,
                fontSize: 11,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              {eyebrow}
            </p>
          )}

          {title && (
            <h1
              style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 200,
                fontSize: "clamp(36px,7.5vw,76px)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color: IVORY,
                lineHeight: 1.04,
                margin: "0 0 18px",
              }}
            >
              {title}
            </h1>
          )}

          {subtitle && (
            <p
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 400,
                fontStyle: "italic",
                fontSize: "clamp(17px,2.5vw,21px)",
                color: `rgba(250,245,233,0.88)`,
                lineHeight: 1.65,
                maxWidth: 560,
                margin: "0 0 26px",
              }}
            >
              {subtitle}
            </p>
          )}

          {badges.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {badges.map((b, i) => (
                <span
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.13)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    color: IVORY,
                    border: "1px solid rgba(255,255,255,0.2)",
                    padding: "7px 16px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 400,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {b.icon && <span aria-hidden="true">{b.icon}</span>}
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator centré en bas */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 28,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          animation: "guideHeroBounce 2.2s ease-in-out infinite",
        }}
      >
        <span
          style={{
            color: `rgba(250,245,233,0.6)`,
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            fontSize: 10,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
          }}
        >
          {lang === "en" ? "Explore" : "Découvrir"}
        </span>
        <svg
          width="20"
          height="12"
          viewBox="0 0 20 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 2 L10 10 L18 2"
            stroke="rgba(250,245,233,0.6)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <style>{`
        @keyframes guideHeroBounce {
          0%, 100% { transform: translateX(-50%) translateY(0px); opacity: 0.7; }
          50% { transform: translateX(-50%) translateY(8px); opacity: 1; }
        }
      `}</style>
    </section>
  );
}
