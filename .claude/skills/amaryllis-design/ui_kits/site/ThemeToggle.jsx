/* global React */
const { useState: useThemeState, useEffect: useThemeEffect } = React;

/* ─────────────────────────────────────────────────────────────────
   <ThemeToggle> — pill toggle that flips [data-theme] on <html>.
   Persists to localStorage. Shows a sun/moon glyph.

   Usage:
     <ThemeToggle/>          // floating top-right
     <ThemeToggle inline/>   // inline, no positioning
   ───────────────────────────────────────────────────────────────── */
function ThemeToggle({ inline = false }) {
  const [theme, setTheme] = useThemeState(() => {
    if (typeof window === "undefined") return "light";
    return document.documentElement.dataset.theme
        || localStorage.getItem("amaryllis-theme")
        || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  useThemeEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("amaryllis-theme", theme); } catch {}
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      style={{
        position: inline ? "static" : "fixed",
        top: inline ? undefined : 22,
        right: inline ? undefined : 22,
        zIndex: 100,
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "var(--c-cream)",
        border: "1px solid var(--c-sand)",
        borderRadius: 999,
        padding: "7px 14px 7px 10px",
        color: "var(--c-navy)",
        fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 11,
        letterSpacing: "0.18em", textTransform: "uppercase",
        cursor: "pointer",
        transition: "background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)",
      }}
    >
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 20, height: 20, borderRadius: "50%",
        background: isDark ? "var(--c-gold)" : "var(--c-navy)",
        color: isDark ? "var(--c-navy)" : "var(--c-ivory)",
        fontSize: 11,
      }}>
        {isDark ? "☾" : "☀"}
      </span>
      {isDark ? "Sombre" : "Clair"}
    </button>
  );
}

Object.assign(window, { ThemeToggle });
