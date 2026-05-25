/* global React */
const { useState, useEffect } = React;

/* ─────────────────────────────────────────────────────────────────
   TOKENS — mirrored from colors_and_type.css.
   Components consume these CSS vars; values listed here for reference.
   ───────────────────────────────────────────────────────────────── */
const SITE_TOKENS_REFERENCE = {
  IVORY: "#faf5e9", CREAM: "#f4ecdc", SAND: "#e0d4bc",
  NAVY: "#0e3b3a", CORAL: "#c47254", GOLD: "#c9a673",
  TEXT: "#0e3b3a", MUTED: "#7a6b5a",
};

/* ─────────────────────────────────────────────────────────────────
   <Eyebrow> — small uppercase coral pre-title
   ───────────────────────────────────────────────────────────────── */
function Eyebrow({ children, color = "coral", tracking = "0.45em", style }) {
  return (
    <div
      style={{
        fontFamily: "'Jost', sans-serif",
        fontWeight: 200,
        fontSize: 10,
        letterSpacing: tracking,
        textTransform: "uppercase",
        color: color === "coral" ? "var(--c-coral)" : color === "muted" ? "var(--c-muted)" : "var(--c-navy)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <Display> — thin uppercase Jost in 4 scales (xl, lg, md, sm)
   ───────────────────────────────────────────────────────────────── */
function Display({ size = "lg", as: As = "h2", color, children, style }) {
  const scales = {
    xl: { font: 200, sz: "clamp(34px, 6vw, 64px)", ls: "0.14em" },
    lg: { font: 200, sz: "clamp(24px, 3vw, 38px)", ls: "0.12em" },
    md: { font: 200, sz: 22,                       ls: "0.1em"  },
    sm: { font: 500, sz: 17,                       ls: "0.02em" },
  };
  const s = scales[size];
  return (
    <As style={{
      fontFamily: "'Jost', sans-serif",
      fontWeight: s.font,
      fontSize: s.sz,
      letterSpacing: s.ls,
      textTransform: size === "sm" ? "none" : "uppercase",
      color: color || "var(--c-navy)",
      lineHeight: 1.1,
      margin: 0,
      ...style,
    }}>
      {children}
    </As>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <Editorial> — Cormorant Garamond italic paragraph
   ───────────────────────────────────────────────────────────────── */
function Editorial({ size = "md", italic = true, color, children, style }) {
  const sizes = { sm: 14, md: 17, lg: 22 };
  return (
    <p style={{
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      fontStyle: italic ? "italic" : "normal",
      fontWeight: 400,
      fontSize: sizes[size],
      lineHeight: 1.8,
      color: color || "var(--c-text)",
      margin: 0,
      ...style,
    }}>
      {children}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <Button> — primary (coral), secondary (navy), ghost
   ───────────────────────────────────────────────────────────────── */
function Button({ variant = "primary", size = "md", children, onClick, href, style }) {
  const base = {
    fontFamily: "'Jost', sans-serif",
    fontWeight: variant === "primary" ? 600 : 400,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    border: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    whiteSpace: "nowrap",
    transition: "transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), background var(--dur-fast)",
  };
  const sizes = {
    sm: { padding: "8px 16px", fontSize: 11, borderRadius: 5 },
    md: { padding: "12px 28px", fontSize: 12, borderRadius: 6 },
    lg: { padding: "16px 40px", fontSize: 13, borderRadius: 6 },
  };
  const variants = {
    primary: { background: "var(--c-coral)", color: "#fff", boxShadow: "var(--shadow-cta)" },
    secondary: { background: "var(--c-navy)", color: "var(--c-ivory)" },
    ghost: { background: "transparent", color: "var(--c-navy)", border: `1px solid var(--c-sand)`, fontWeight: 300 },
    onDark: { background: "transparent", color: "var(--c-ivory)", border: `1px solid rgba(250,245,233,0.3)`, fontWeight: 400 },
  };
  const props = { onClick, style: { ...base, ...sizes[size], ...variants[variant], ...style } };
  return href ? <a href={href} {...props}>{children}</a> : <button {...props}>{children}</button>;
}

/* ─────────────────────────────────────────────────────────────────
   <Chip> — pill amenity/rating/feature tag
   ───────────────────────────────────────────────────────────────── */
function Chip({ children, variant = "default", style }) {
  const variants = {
    default: { background: "var(--c-cream)", border: "1px solid var(--c-sand)", color: "var(--c-text)" },
    onPhoto: { background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", color: "#fff", border: "none" },
    success: { background: "rgba(16,163,74,0.12)", border: "1px solid rgba(16,163,74,0.3)", color: "#16a34a" },
  };
  const isPill = variant === "onPhoto" || variant === "success";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: isPill ? "5px 14px" : "6px 14px",
      borderRadius: isPill ? 999 : 4,
      fontFamily: "'Jost', sans-serif",
      fontWeight: variant === "success" ? 700 : 300,
      fontSize: variant === "success" ? 10 : 12,
      letterSpacing: variant === "success" ? "0.08em" : "0.04em",
      textTransform: variant === "success" ? "uppercase" : "none",
      ...variants[variant],
      ...style,
    }}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <RatingBadge> — ★ 4,94 · 33 avis
   ───────────────────────────────────────────────────────────────── */
function RatingBadge({ rating, count, dark = false, style }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 12px",
      borderRadius: 999,
      background: dark ? "rgba(255,255,255,0.15)" : "rgba(14,59,58,0.06)",
      backdropFilter: dark ? "blur(6px)" : "none",
      fontFamily: "'Jost', sans-serif",
      fontWeight: 500, fontSize: 12,
      color: dark ? "#fff" : "var(--c-navy)",
      ...style,
    }}>
      <span style={{ color: "var(--c-gold)" }}>★</span>{rating} · {count} avis
    </span>
  );
}

Object.assign(window, { Eyebrow, Display, Editorial, Button, Chip, RatingBadge });
