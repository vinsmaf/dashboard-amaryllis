// src/components/reel/ReelOverlays.jsx
// Overlay fragments for the Villa Amaryllis reel.
// Ported from design_handoff_villa_reel/reel-overlays.jsx (Babel-at-runtime prototype)
// → converted to ES module, no global window assignments.

import { useMemo, useCallback } from "react";

// ── Easing primitives ────────────────────────────────────────────────────────
export const ease = {
  outExpo:  (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOut:    (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
};

// Fade in → hold → fade out; returns 0‥1 visibility
export function fade(t, start, fadeIn, hold, fadeOut) {
  const end = start + fadeIn + hold + fadeOut;
  if (t < start || t > end) return 0;
  if (t < start + fadeIn)         return (t - start) / fadeIn;
  if (t < start + fadeIn + hold)  return 1;
  return 1 - (t - start - fadeIn - hold) / fadeOut;
}

// ── Amaryllis flower mark (inline SVG, brand logo) ───────────────────────────
export function FlowerMark({
  size  = 32,
  coral = "#c47254",
  cream = "#f5e8c6",
  navy  = "#0e3b3a",
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" aria-hidden="true">
      <circle cx="110" cy="110" r="100" fill={cream} />
      <rect x="10" y="118" width="200" height="92" fill={navy} opacity="0.08" />
      <line x1="10" y1="118" x2="210" y2="118" stroke={navy} strokeWidth="0.8" />
      <g transform="translate(110,50) scale(0.55)">
        {[0, 60, 120, 180, 240, 300].map(r => (
          <g key={r} transform={`rotate(${r})`}>
            <ellipse cx="0" cy="-22" rx="11" ry="22" fill={coral} />
          </g>
        ))}
        <circle r="7" fill={cream} />
        <circle r="2" fill={navy} />
      </g>
      <circle cx="110" cy="110" r="102" fill="none" stroke={navy} strokeWidth="1.5" />
    </svg>
  );
}

// ── Brand chrome: top gradient + mark + rotating eyebrow ────────────────────
export function TopChrome({ t, coral }) {
  const vis = fade(t, 2.0, 0.6, 24.5, 0.4);
  const eyebrow = useMemo(() => {
    if (t < 10.5)  return "MARTINIQUE · SAINTE-LUCE";
    if (t < 18.5)  return "VILLA · 3 SUITES · OCÉAN";
    return "RÉSERVATION DIRECTE";
  }, [t]);
  if (vis <= 0) return null;
  return (
    <div className="rc-top" style={{ opacity: vis }}>
      <div className="rc-top-grad" />
      <div className="rc-top-row">
        <div className="rc-mark">
          <FlowerMark size={42} coral={coral} cream="#f5e8c6" navy="#0e3b3a" />
        </div>
        <div className="rc-eyebrow-wrap">
          <div className="rc-eyebrow-key" key={eyebrow}>
            <span className="rc-eyebrow" style={{ color: coral }}>{eyebrow}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HOOK: editorial italic at the very start ─────────────────────────────────
export function HookOverlay({ t, copy }) {
  const vis = fade(t, 0.1, 0.5, 1.5, 0.6);
  const blur = (1 - vis) * 8;
  const ty   = (1 - ease.outExpo(Math.min(1, t / 0.8))) * 28;
  if (vis <= 0) return null;
  return (
    <div
      className="rc-hook"
      style={{ opacity: vis, filter: `blur(${blur}px)`, transform: `translateY(${ty}px)` }}
    >
      <div className="rc-hook-stamp">— LA VILLA EN MOUVEMENT —</div>
      <div className="rc-hook-line">{copy}</div>
    </div>
  );
}

// ── BIG TITLE reveal during segment 1 ───────────────────────────────────────
export function TitleReveal({
  t,
  text = "VILLA AMARYLLIS",
  sub  = "Sainte-Luce · Martinique",
}) {
  const start   = 4.0;
  const vis     = fade(t, start, 0.6, 5.0, 0.6);
  const letters = text.split("");
  // Durée totale du stagger normalisée à 600ms quelle que soit la longueur
  const STAGGER_TOTAL = 0.6; // secondes
  if (vis <= 0) return null;
  return (
    <div className="rc-title-wrap" style={{ opacity: vis }}>
      <div className="rc-title-eyebrow">— LOCATION D'EXCEPTION —</div>
      <h2 className="rc-title">
        {letters.map((c, i) => {
          const delay = (i / letters.length) * STAGGER_TOTAL;
          const local = Math.max(0, Math.min(1, (t - start - 0.2 - delay) / 0.5));
          const e = ease.outExpo(local);
          return (
            <span
              key={i}
              style={{
                display:    "inline-block",
                opacity:    e,
                transform:  `translateY(${(1 - e) * 32}px)`,
                whiteSpace: c === " " ? "pre" : "normal",
              }}
            >
              {c}
            </span>
          );
        })}
      </h2>
      <div className="rc-title-sub">{sub}</div>
    </div>
  );
}

// ── RATING CHIP slides in during segment 1 ──────────────────────────────────
export function RatingChip({ t, coral }) {
  const start = 7.2;
  const vis   = fade(t, start, 0.5, 2.6, 0.6);
  if (vis <= 0) return null;
  const local = Math.max(0, Math.min(1, (t - start) / 0.6));
  const tx    = (1 - ease.outExpo(local)) * 60;
  return (
    <div
      className="rc-rating"
      style={{ opacity: vis, transform: `translateX(${tx}px)` }}
    >
      <span className="rc-star" style={{ color: "#c9a673" }}>★</span>
      <span className="rc-rating-num">4,94</span>
      <span className="rc-rating-dot">·</span>
      <span className="rc-rating-count">33 avis</span>
    </div>
  );
}

// ── EDITORIAL QUOTE during segment 2 ────────────────────────────────────────
export function QuoteOverlay({ t, coral }) {
  const start = 11.5;
  const vis   = fade(t, start, 0.7, 3.0, 0.7);
  if (vis <= 0) return null;
  const local = Math.max(0, Math.min(1, (t - start) / 1.2));
  const ty    = (1 - ease.outExpo(local)) * 24;
  return (
    <div
      className="rc-quote"
      style={{ opacity: vis, transform: `translateY(${ty}px)` }}
    >
      <div className="rc-quote-rule" style={{ background: coral }} />
      <div className="rc-quote-text">
        <em>Bercée par les alizés</em>
        <br />
        <em>et le parfum des fleurs</em>
        <br />
        <em>tropicales…</em>
      </div>
    </div>
  );
}

// ── PRICE STAMP during segment 2 ────────────────────────────────────────────
export function PriceStamp({ t, coral, price }) {
  const start = 15.5;
  const vis   = fade(t, start, 0.5, 2.4, 0.6);
  if (vis <= 0) return null;
  const local = Math.max(0, Math.min(1, (t - start) / 0.7));
  const e = ease.outExpo(local);
  return (
    <div
      className="rc-price"
      style={{ opacity: vis, transform: `scale(${0.85 + e * 0.15})` }}
    >
      <div className="rc-price-eye">À PARTIR DE</div>
      <div className="rc-price-amount" style={{ color: coral }}>
        <span className="rc-price-num">{price}</span>
        <span className="rc-price-cur">€</span>
      </div>
      <div className="rc-price-unit">/ nuit · jusqu'à 6 voyageurs</div>
    </div>
  );
}

// ── AMENITY STRIP during segment 3 ──────────────────────────────────────────
export function AmenityStrip({ t }) {
  const start = 19.8;
  const vis   = fade(t, start, 0.6, 3.6, 0.6);
  if (vis <= 0) return null;
  const items = ["PISCINE À DÉBORDEMENT", "VUE OCÉAN", "3 SUITES"];
  return (
    <div className="rc-amen" style={{ opacity: vis }}>
      {items.map((it, i) => {
        const local = Math.max(0, Math.min(1, (t - start - 0.2 - i * 0.18) / 0.5));
        const e = ease.outExpo(local);
        return (
          <div
            key={it}
            className="rc-amen-line"
            style={{ opacity: e, transform: `translateX(${(1 - e) * -28}px)` }}
          >
            <span className="rc-amen-tick">✕</span>
            <span>{it}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── CTA PULSE during segment 3 — bouton cliquable ───────────────────────────
export function CtaPulse({ t, coral, ctaLabel = "RÉSERVER EN DIRECT", onClick }) {
  const start = 23.5;

  // ⚠️ useCallback AVANT tout return conditionnel (règles hooks React)
  const handleCta = useCallback((e) => {
    e.stopPropagation();
    if (onClick) { onClick(); return; }
    const target = document.getElementById("booking-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollBy({ top: 600, behavior: "smooth" });
    }
  }, [onClick]);

  const vis   = fade(t, start, 0.5, 2.8, 0.5);
  if (vis <= 0) return null;
  const local = Math.max(0, Math.min(1, (t - start) / 0.6));
  const ty    = (1 - ease.outExpo(local)) * 30;
  const pulse = 0.6 + 0.4 * Math.sin((t - start) * 4);

  return (
    <div
      className="rc-cta-wrap"
      style={{ opacity: vis, transform: `translateY(${ty}px)` }}
    >
      <button
        className="rc-cta"
        data-no-toggle
        onClick={handleCta}
        style={{
          background:  coral,
          boxShadow:   `0 ${10 + pulse * 8}px ${28 + pulse * 18}px ${coral}66, inset 0 1px 0 rgba(255,255,255,0.25)`,
          border:      "none",
          cursor:      "pointer",
        }}
      >
        {ctaLabel}
        <span className="rc-cta-arrow">→</span>
      </button>
      <div className="rc-cta-trust">
        Jusqu'à 300€ économisés · Propriétaire joignable en 1h
      </div>
    </div>
  );
}

// ── OUTRO CARD: navy avec logo + URL + boutons ───────────────────────────────
export function OutroCard({ t, coral, onReplay, onCta }) {
  const start = 26.3;

  // ⚠️ useCallback AVANT tout return conditionnel (règles hooks React)
  const handleReserver = useCallback((ev) => {
    ev.stopPropagation();
    if (onCta) { onCta(); return; }
    const target = document.getElementById("booking-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollBy({ top: 600, behavior: "smooth" });
    }
  }, [onCta]);

  const handleReplay = useCallback((ev) => {
    ev.stopPropagation();
    if (onReplay) onReplay();
  }, [onReplay]);

  const vis   = fade(t, start, 0.5, 3.0, 0.2);
  if (vis <= 0) return null;
  const local = Math.max(0, Math.min(1, (t - start) / 0.8));
  const e = ease.outExpo(local);

  return (
    <div className="rc-outro" style={{ opacity: vis }}>
      <div className="rc-outro-bg" />
      <div
        className="rc-outro-stack"
        style={{ transform: `translateY(${(1 - e) * 24}px)` }}
      >
        <div className="rc-outro-mark">
          <FlowerMark size={120} coral={coral} />
        </div>
        <div className="rc-outro-eye" style={{ color: coral }}>
          LOCATIONS D'EXCEPTION
        </div>
        <div className="rc-outro-name">VILLA AMARYLLIS</div>
        <div className="rc-outro-italic">Sainte-Luce · Martinique</div>
        <div className="rc-outro-rule" />
        <div className="rc-outro-url">villamaryllis.com</div>
        <div className="rc-outro-trust">
          Vous parlez directement au propriétaire
        </div>

        {/* Boutons outro */}
        <div className="rc-outro-actions">
          <button
            className="rc-outro-btn rc-outro-btn--primary"
            data-no-toggle
            onClick={handleReserver}
            style={{ background: coral, borderColor: coral }}
          >
            Réserver →
          </button>
          <button
            className="rc-outro-btn rc-outro-btn--ghost"
            data-no-toggle
            onClick={handleReplay}
          >
            ↺ Revoir
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AFFORDANCE HINT — tap pour interagir, visible 0→3s ───────────────────────
// Icon-only : fonctionne sur mobile ET desktop (pas de "Touchez")
export function AffordanceHint({ t, playing }) {
  // Visible uniquement les 3 premières secondes, uniquement si en lecture
  const vis = playing ? fade(t, 0.5, 0.6, 1.8, 0.8) : 0;
  if (vis <= 0) return null;
  return (
    <div
      className="rc-afford"
      style={{ opacity: vis }}
      data-no-toggle
    >
      <div className="rc-afford-ring" />
      {/* SVG pause icon — neutre mobile/desktop */}
      <svg
        className="rc-afford-icon"
        width="48" height="48" viewBox="0 0 48 48"
        fill="none" aria-hidden="true"
      >
        <rect x="11" y="10" width="10" height="28" rx="3" fill="rgba(255,255,255,0.82)" />
        <rect x="27" y="10" width="10" height="28" rx="3" fill="rgba(255,255,255,0.82)" />
      </svg>
    </div>
  );
}

// ── URGENCY BADGE — signal de tension avant CTA ─────────────────────────────
// Visible pendant le segment CTA, légèrement avant le bouton
export function UrgencyBadge({ t, coral }) {
  const start = 22.6;
  const vis   = fade(t, start, 0.4, 3.0, 0.5);
  if (vis <= 0) return null;
  const local = Math.max(0, Math.min(1, (t - start) / 0.5));
  const tx    = (1 - ease.outExpo(local)) * -40;

  // Signal dynamique crédible — basé sur le comportement réel des réservations
  const month = new Date().getMonth(); // 0-indexed
  const urgency =
    month >= 5 && month <= 7  ? "Juillet-août se réservent dès janvier"
    : month >= 11 || month <= 0 ? "Fêtes : vérifiez vos dates maintenant"
    : month >= 1 && month <= 2  ? "Carnaval — réservez tôt"
    : "Haute saison réservée des mois à l'avance";

  return (
    <div
      className="rc-urgency"
      style={{ opacity: vis, transform: `translateX(${tx}px)` }}
    >
      <span className="rc-urgency-dot" style={{ background: coral }} />
      <span className="rc-urgency-text">{urgency}</span>
    </div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────
// Note: le composant React n'est plus utilisé (DOM direct via ref dans le parent)
// Conservé pour compatibilité si besoin.
export function ProgressBar({ progress, coral }) {
  return (
    <div className="rc-progress">
      <div
        className="rc-progress-fill"
        style={{ width: `${progress * 100}%`, background: coral }}
      />
    </div>
  );
}
