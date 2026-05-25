/**
 * Amaryllis — <Curtain>
 * Animation d'ouverture : rideau navy + fleur amaryllis qui tourne, puis lève.
 *
 * Props:
 *   onDone    — callback appelé quand le rideau a fini de monter
 *   holdMs    — durée d'affichage avant le lever (défaut 700ms)
 *   liftMs    — durée du lever (défaut 900ms)
 *   tagline   — tagline sous le titre (défaut "Locations d'exception")
 */
import { useState, useEffect, useRef } from "react";

const KEYFRAMES_ID = "__amaryllis_curtain_kf";

function injectKeyframes() {
  if (document.getElementById(KEYFRAMES_ID)) return;
  const s = document.createElement("style");
  s.id = KEYFRAMES_ID;
  s.textContent = `
    @keyframes curtainLift    { 0%   { transform:translateY(0);    } 100% { transform:translateY(-100%); } }
    @keyframes curtainFadeIn  { from { opacity:0; }                  to   { opacity:1; }                   }
    @keyframes curtainPetalSpin {
      from { transform:rotate(0deg)   scale(1);    }
      50%  { transform:rotate(180deg) scale(1.08); }
      to   { transform:rotate(360deg) scale(1);    }
    }
    @keyframes curtainTextRise {
      from { opacity:0; transform:translateY(14px); }
      to   { opacity:1; transform:translateY(0);    }
    }
  `;
  document.head.appendChild(s);
}

export function Curtain({
  onDone,
  holdMs  = 700,
  liftMs  = 900,
  tagline = "Locations d'exception",
}) {
  const [lifting, setLifting] = useState(false);
  const doneRef = useRef(onDone);
  useEffect(() => { doneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    injectKeyframes();
    const t1 = setTimeout(() => setLifting(true), holdMs);
    const t2 = setTimeout(() => doneRef.current?.(), holdMs + liftMs);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [holdMs, liftMs]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "var(--c-navy, #0e3b3a)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      animation: lifting
        ? `curtainLift ${liftMs}ms cubic-bezier(0.76,0,0.24,1) forwards`
        : "curtainFadeIn 400ms ease forwards",
      pointerEvents: lifting ? "none" : "auto",
    }}>
      {/* Fleur amaryllis tournante */}
      <div style={{ marginBottom: 24, animation: "curtainPetalSpin 2.5s ease-in-out infinite" }}>
        <svg width="64" height="64" viewBox="-50 -50 100 100">
          {[0, 60, 120, 180, 240, 300].map(rot => (
            <g key={rot} transform={`rotate(${rot})`}>
              <path d="M 0 0 L 0 -38 L 8 -20 Z" fill="var(--c-coral, #c47254)" opacity="0.9" />
            </g>
          ))}
          <circle cx="0" cy="0" r="4" fill="var(--c-gold, #c9a673)" />
        </svg>
      </div>

      <div style={{
        fontFamily: "'Jost', sans-serif",
        fontWeight: 200,
        fontSize: "clamp(24px, 6vw, 48px)",
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: "var(--c-ivory, #faf5e9)",
        lineHeight: 1,
        marginBottom: 10,
        animation: "curtainTextRise 700ms 200ms cubic-bezier(0.23,1,0.32,1) backwards",
      }}>
        Amaryllis
      </div>

      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontStyle: "italic",
        fontSize: 15,
        color: "var(--c-gold, #c9a673)",
        letterSpacing: "0.08em",
        opacity: 0.8,
        animation: "curtainTextRise 700ms 400ms cubic-bezier(0.23,1,0.32,1) backwards",
      }}>
        {tagline}
      </div>
    </div>
  );
}
