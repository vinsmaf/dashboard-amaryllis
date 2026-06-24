/**
 * Amaryllis Design System — Primitives
 * Portage du ui_kit/site/Primitives.jsx + ThemeToggle.jsx vers ES modules Vite.
 * Consomme les tokens CSS de src/tokens.css (--c-*, --font-*, etc.)
 */
import { useState, useEffect } from "react";
// Manifeste des largeurs réellement générées par image (scripts/gen-image-variants.mjs).
// Évite que srcset propose un -1200w.webp inexistant (→ 404 = SPA HTML 200 = image cassée).
import IMAGE_VARIANTS from "./data/imageVariants.json";

// ── <Eyebrow> — petit titre en majuscules corail ───────────────────────────
export function Eyebrow({ children, color = "coral", tracking = "0.45em", style }) {
  return (
    <div style={{
      fontFamily: "'Jost', sans-serif",
      fontWeight: 200,
      fontSize: 10,
      letterSpacing: tracking,
      textTransform: "uppercase",
      color: color === "coral" ? "var(--c-coral)" : color === "muted" ? "var(--c-muted)" : "var(--c-navy)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── <Display> — titre display fin en 4 tailles (xl, lg, md, sm) ──────────
// Uses --font-display token (Jost, thin/light weight, all-caps, large tracking)
export function Display({ size = "lg", as: As = "h2", color, children, style }) {
  const scales = {
    xl: { font: 200, sz: "clamp(34px, 6vw, 64px)", ls: "0.14em" },
    lg: { font: 200, sz: "clamp(24px, 3vw, 38px)", ls: "0.12em" },
    md: { font: 200, sz: 22,                        ls: "0.1em"  },
    sm: { font: 500, sz: 17,                        ls: "0.02em" },
  };
  const s = scales[size];
  return (
    <As style={{
      fontFamily: "var(--font-display, 'Jost', sans-serif)",
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

// ── <Editorial> — Cormorant Garamond italique ─────────────────────────────
// Uses --font-serif token (Cormorant Garamond, long-form copy / subheadings)
export function Editorial({ size = "md", italic = true, color, children, style }) {
  const sizes = { sm: 14, md: 17, lg: 22 };
  return (
    <p style={{
      fontFamily: "var(--font-serif, 'Cormorant Garamond', Georgia, serif)",
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

// ── <Button> — primary (corail), secondary (navy), ghost, onDark ──────────
export function Button({ variant = "primary", size = "md", children, onClick, href, style, ...rest }) {
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
    transition: "transform var(--dur-fast, 150ms) var(--ease-out, ease), box-shadow var(--dur-fast, 150ms) var(--ease-out, ease), background var(--dur-fast, 150ms)",
  };
  const sizes = {
    sm: { padding: "8px 16px",  fontSize: 11, borderRadius: 5 },
    md: { padding: "12px 28px", fontSize: 12, borderRadius: 6 },
    lg: { padding: "16px 40px", fontSize: 13, borderRadius: 6 },
  };
  const variants = {
    primary:   { background: "var(--c-coral)", color: "#fff", boxShadow: "var(--shadow-cta, 0 4px 18px rgba(196,114,84,0.3))" },
    secondary: { background: "var(--c-navy)", color: "var(--c-ivory)" },
    ghost:     { background: "transparent", color: "var(--c-navy)", border: "1px solid var(--c-sand)", fontWeight: 300 },
    onDark:    { background: "transparent", color: "var(--c-ivory)", border: "1px solid rgba(250,245,233,0.3)", fontWeight: 400 },
  };
  const props = { onClick, style: { ...base, ...sizes[size], ...variants[variant], ...style }, ...rest };
  return href ? <a href={href} {...props}>{children}</a> : <button {...props}>{children}</button>;
}

// ── <Chip> — pill amenity / rating / feature tag ──────────────────────────
export function Chip({ children, variant = "default", style }) {
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

// ── <RatingBadge> — ★ 4,94 · 33 avis ────────────────────────────────────
export function RatingBadge({ rating, count, dark = false, style }) {
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

// ── <Icon> — sprite SVG /icons.svg#id ────────────────────────────────────
export function Icon({ name, size = 20, color, style }) {
  return (
    <svg width={size} height={size} style={{ color: color || "currentColor", flexShrink: 0, ...style }}>
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}

// ── <ThemeToggle> — bascule mode clair/sombre ────────────────────────────
export function ThemeToggle({ inline = false }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    return document.body.dataset.theme
      || localStorage.getItem("amaryllis-theme")
      || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  });

  useEffect(() => {
    // Poser data-theme sur <body> (qui porte déjà data-surface="site")
    // pour que le sélecteur CSS [data-surface="site"][data-theme="dark"] matche.
    document.body.dataset.theme = theme;
    // Garder aussi sur <html> pour la compatibilité (scrollbar OS, etc.)
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
        transition: "background var(--dur-base, 250ms) var(--ease-out, ease), color var(--dur-base, 250ms) var(--ease-out, ease)",
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

// ── <StateTile> — état vide / succès / erreur / warning branded ──
// variant: "empty" | "success" | "warn" | "danger" | "loading"
// Utilise Jost + Cormorant + tokens CSS.
export function StateTile({ variant = "empty", icon, eyebrow, title, body, action, onAction, style }) {
  const variants = {
    empty:   { bg: "var(--c-cream, #f4ecdc)",             border: "var(--c-sand, #e0d4bc)",              iconBg: "var(--c-ivory, #faf5e9)",    iconColor: "var(--c-coral, #c47254)",  eyeColor: "var(--c-coral, #c47254)"  },
    success: { bg: "rgba(16,163,74,0.08)",                border: "rgba(16,163,74,0.25)",                iconBg: "#fff",                        iconColor: "#16a34a",                  eyeColor: "#16a34a"                  },
    warn:    { bg: "rgba(245,158,11,0.06)",               border: "rgba(245,158,11,0.25)",               iconBg: "#fff",                        iconColor: "#d97706",                  eyeColor: "#d97706"                  },
    danger:  { bg: "rgba(239,68,68,0.05)",               border: "rgba(239,68,68,0.25)",                iconBg: "#fff",                        iconColor: "#ef4444",                  eyeColor: "#ef4444"                  },
    loading: { bg: "var(--c-ivory, #faf5e9)",             border: "var(--c-sand, #e0d4bc)",              iconBg: "var(--c-ivory, #faf5e9)",    iconColor: "var(--c-coral, #c47254)",  eyeColor: "var(--c-coral, #c47254)"  },
  };
  const v = variants[variant] || variants.empty;
  const defaultIcon = { empty: "∅", success: "✓", warn: "🔒", danger: "⚠", loading: null }[variant];
  const displayIcon = icon ?? defaultIcon;

  return (
    <div style={{
      background: v.bg, border: `1px solid ${v.border}`, borderRadius: 14,
      padding: "28px 22px", textAlign: "center",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      ...style,
    }}>
      {/* Icon circle */}
      {variant === "loading" ? (
        <div style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FlowMark size={32} />
        </div>
      ) : displayIcon && (
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: v.iconBg, color: v.iconColor,
          border: `1px solid ${v.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 22,
        }}>
          {displayIcon}
        </div>
      )}

      {/* Eyebrow */}
      {eyebrow && (
        <div style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 9,
          letterSpacing: "0.38em", textTransform: "uppercase", color: v.eyeColor,
        }}>{eyebrow}</div>
      )}

      {/* Title */}
      {title && (
        <div style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 19,
          letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--c-navy, #0e3b3a)",
          lineHeight: 1.15,
        }}>{title}</div>
      )}

      {/* Body */}
      {body && (
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontStyle: "italic", fontWeight: 400,
          fontSize: 14, lineHeight: 1.5,
          color: "var(--c-text, #0e3b3a)", margin: 0, maxWidth: 240,
        }}>{body}</p>
      )}

      {/* CTA */}
      {action && (
        <button
          onClick={onAction}
          style={{
            marginTop: 6,
            background: variant === "empty" ? "var(--c-coral, #c47254)" : "var(--c-navy, #0e3b3a)",
            color: "var(--c-ivory, #faf5e9)", border: "none",
            padding: "10px 22px", borderRadius: 6,
            fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 10,
            letterSpacing: "0.12em", textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: variant === "empty" ? "0 4px 14px rgba(196,114,84,0.3)" : "none",
          }}
        >{action}</button>
      )}
    </div>
  );
}

// ── <FlowMark> — spinner fleur amaryllis (6 pétales SVG) ─────────
// Usage : <FlowMark size={40} /> ou <FlowMark size={24} color="#fff" />
export function FlowMark({ size = 40, color = "var(--c-coral, #c47254)", gold = "var(--c-gold, #c9a673)", style }) {
  const id = "__amaryllis_flowmark_kf";
  if (typeof document !== "undefined" && !document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `@keyframes amaryllisSpin { from { transform:rotate(0deg) scale(1); } 50% { transform:rotate(180deg) scale(1.08); } to { transform:rotate(360deg) scale(1); } }`;
    document.head.appendChild(s);
  }
  return (
    <svg
      width={size} height={size} viewBox="-50 -50 100 100"
      style={{ animation: "amaryllisSpin 2s ease-in-out infinite", flexShrink: 0, ...style }}
      aria-label="Chargement…" role="img"
    >
      {[0, 60, 120, 180, 240, 300].map(rot => (
        <g key={rot} transform={`rotate(${rot})`}>
          <path d="M 0 0 L 0 -38 L 8 -20 Z" fill={color} opacity="0.92" />
        </g>
      ))}
      <circle cx="0" cy="0" r="4.5" fill={gold} />
    </svg>
  );
}

// ── cfImg() — Cloudflare Image Resizing URL helper ───────────────
// Transforme /photos/... en URL CDN redimensionnée.
// Les URLs externes (http/https) sont retournées telles quelles.
// media-008 : quality configurable (défaut 85, hero=90, thumbnail=75)
// web-010 : Cloudflare Image Resizing n'étant pas actif (404), on sert des
// variantes statiques pré-générées au build (scripts/gen-image-variants.mjs) :
//   /photos/x/06.webp + largeur → /photos/x/06-800w.webp
// Largeurs disponibles : 480/800/1200 (on prend la plus proche ≥ demandée).
// ⚠️ PAS de 1600 : gen-image-variants.mjs utilise withoutEnlargement, donc -1600w
// n'est généré que pour les rares originaux ≥1600px. Pour tous les autres,
// /photos/.../XX-1600w.webp renvoie la SPA (HTML) en HTTP 200 → sur écran large/retina
// la hero pioche ce candidat et reçoit du HTML au lieu d'une image = photo cassée.
const _VARIANT_WIDTHS = [480, 800, 1200];
// Largeurs disponibles pour une image : depuis le manifeste si connu, sinon défaut.
function variantWidths(src) {
  return IMAGE_VARIANTS[src] || _VARIANT_WIDTHS;
}
export function cfImg(src, w, quality = 85) { // quality conservé pour compat d'appel
  if (!src || src.startsWith("http")) return src;
  if (!/\.webp$/i.test(src)) return src;
  if (/-\d+w\.webp$/i.test(src)) return src; // déjà une variante
  const widths = variantWidths(src);
  const target = widths.find(x => x >= w) || widths[widths.length - 1];
  return src.replace(/\.webp$/i, `-${target}w.webp`);
}

// ── Shimmer keyframes injection (once, lazy) ─────────────────────
let _shimmerInjected = false;
function injectShimmerOnce() {
  if (_shimmerInjected || typeof document === "undefined") return;
  _shimmerInjected = true;
  const s = document.createElement("style");
  s.textContent = `@keyframes rimgShimmer{from{background-position:200% 0}to{background-position:-200% 0}}`;
  document.head.appendChild(s);
}

// ── <RImg> — Responsive Image avec srcset Cloudflare ─────────────
// Génère automatiquement srcset + sizes pour les images /photos/...
// Les URLs externes sont rendues avec un <img> simple (pas de transformation).
// quality: 90 pour hero (1600w), 75 pour thumbnails (480w), 85 pour le reste
// media-007 : blur-up shimmer pendant le chargement (sauf images hero fetchPriority="high")
export function RImg({ src, alt, sizes = "100vw", className, style, loading = "lazy", fetchPriority }) {
  // Pour les images hero (fetchPriority="high"), pas de shimmer — elles chargent immédiatement
  const isHero = fetchPriority === "high";
  const [loaded, setLoaded] = useState(isHero);

  if (!src || src.startsWith("http")) {
    return <img src={src} alt={alt} className={className} style={style} loading={loading} fetchPriority={fetchPriority} />;
  }

  if (!isHero) injectShimmerOnce();

  // srcset bâti UNIQUEMENT à partir des largeurs réellement générées (manifeste) → aucun candidat 404.
  const widths = variantWidths(src);
  const srcset = widths.map(w => `${cfImg(src, w)} ${w}w`).join(", ");

  const shimmerStyle = loaded ? {} : {
    background: "linear-gradient(90deg,var(--c-sand,#e0d4bc) 25%,var(--c-cream,#f4ecdc) 50%,var(--c-sand,#e0d4bc) 75%)",
    backgroundSize: "400% 100%",
    animation: "rimgShimmer 1.4s ease-in-out infinite",
  };

  return (
    <img
      src={cfImg(src, 800)}
      srcSet={srcset}
      sizes={sizes}
      alt={alt}
      className={className}
      onLoad={() => setLoaded(true)}
      onError={(e) => {
        // Filet de sécurité : tout candidat qui échoue → on retombe sur l'original plein format
        // (qui existe toujours), sans srcset. Évite la photo cassée (ex. variante manquante).
        setLoaded(true);
        if (e.currentTarget.getAttribute("src") !== src) {
          e.currentTarget.removeAttribute("srcset");
          e.currentTarget.src = src;
        }
      }}
      style={{
        ...shimmerStyle,
        ...style,
        opacity: loaded ? (style?.opacity ?? 1) : 0,
        transition: `opacity 0.45s ease`,
      }}
      loading={loading}
      fetchPriority={fetchPriority}
    />
  );
}

// ── <FAQAccordion> — item FAQ expandable au clic ─────────────────
// Gestion d'état locale (chaque item s'ouvre indépendamment).
// Pour un comportement radio (un seul ouvert à la fois), gérer `open`
// depuis le parent et passer open/onToggle en props.
export function FAQAccordion({ q, a, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--c-sand, #e0d4bc)" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", textAlign: "left",
          background: "none", border: "none", cursor: "pointer",
          padding: "20px 0",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
        }}
      >
        <span style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 15,
          color: "var(--c-navy, #0e3b3a)", letterSpacing: "0.02em", lineHeight: 1.4,
        }}>{q}</span>
        <span style={{
          color: "var(--c-coral, #c47254)", fontSize: 18, flexShrink: 0,
          transition: "transform 0.3s ease",
          transform: open ? "rotate(45deg)" : "rotate(0)",
        }}>+</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 22 }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: "italic", fontWeight: 400,
            fontSize: 17, lineHeight: 1.8,
            color: "var(--c-text, #0e3b3a)", margin: 0,
          }}>{a}</p>
        </div>
      )}
    </div>
  );
}

// ── <SubTabBar> — barre de sous-onglets admin réutilisable ───────────────────
export function SubTabBar({ tabs, active, onChange, accent = "#0ea5e9", style }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", ...style }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: "6px 14px",
            borderRadius: 20,
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            background: active === t.id ? accent : "rgba(255,255,255,0.06)",
            color: active === t.id ? "#fff" : "#94a3b8",
            transition: "background .15s, color .15s",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
