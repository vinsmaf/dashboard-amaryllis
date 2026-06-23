// GuideStickyNav.jsx — Mini-navigation sticky pour les guides.
// Apparaît après le hero (85% de 100vh) et disparaît avant le footer.
// Highlighte l'ancre active au scroll, CTA réserver à droite.
// SSR-safe, RAF-throttlé, scroll passif.
// z-index 58 — sous la ReadingProgressBar (60) et son CTA (59).
import { useEffect, useState } from "react";

const CORAL = "#c8614a";
const NAVY  = "#1b2a4a";

export default function GuideStickyNav({
  links = [],
  ctaHref = "/",
  lang = "fr",
}) {
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    let raf = 0;

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;

        const scrollY = window.scrollY || window.pageYOffset;
        const viewportHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;

        // Visible entre 85% du hero et 200px avant le footer
        const shouldBeVisible =
          scrollY > viewportHeight * 0.85 &&
          scrollY < docHeight - viewportHeight - 200;

        setVisible(shouldBeVisible);

        // Trouver l'ancre active : section dont le top <= 64px et le bottom > 64px
        let found = null;
        for (const link of links) {
          const id = link.href.replace(/^#/, "");
          const el = document.getElementById(id);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.top <= 64 && rect.bottom > 64) {
            found = link.href;
            break;
          }
        }
        setActiveId(found);
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
  }, [links]);

  return (
    <nav
      aria-label={lang === "en" ? "Guide navigation" : "Navigation du guide"}
      style={{
        position: "fixed",
        top: 3, // sous la barre ReadingProgressBar (height: 3px)
        left: 0,
        right: 0,
        zIndex: 58,
        background: "rgba(250,245,233,0.96)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid #e8e0d0",
        height: 44,
        display: "flex",
        alignItems: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-44px)",
        transition: "opacity 0.28s ease, transform 0.28s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
          maxWidth: 880,
          margin: "0 auto",
          width: "100%",
          padding: "0 16px",
        }}
      >
        {/* Masquer la scrollbar webkit */}
        <style>{`
          nav[data-guide-sticky-nav] div::-webkit-scrollbar { display: none; }
        `}</style>

        {links.map((link) => {
          const isActive = activeId === link.href;
          return (
            <a
              key={link.href}
              href={link.href}
              style={{
                padding: "0 14px",
                height: 44,
                display: "inline-flex",
                alignItems: "center",
                fontFamily: "'Jost', sans-serif",
                fontWeight: isActive ? 600 : 400,
                fontSize: 11,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: isActive ? CORAL : `rgba(27,42,74,0.7)`,
                textDecoration: "none",
                borderBottom: isActive
                  ? `2px solid ${CORAL}`
                  : "2px solid transparent",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "color 0.2s",
                boxSizing: "border-box",
              }}
            >
              {link.label}
            </a>
          );
        })}

        {/* CTA Réserver — poussé à droite */}
        <a
          href={ctaHref}
          style={{
            marginLeft: "auto",
            flexShrink: 0,
            padding: "7px 16px",
            background: CORAL,
            color: "#fff",
            fontFamily: "'Jost', sans-serif",
            fontWeight: 600,
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
            borderRadius: 6,
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {lang === "en" ? "Book →" : "Réserver →"}
        </a>
      </div>
    </nav>
  );
}
