/* global React */
const { useState: useCurtainState, useEffect: useCurtainEffect, useRef: useCurtainRef } = React;

/* ─────────────────────────────────────────────────────────────────
   <Curtain> — branded opening animation.
   Renders a full-screen navy curtain with the spinning amaryllis
   flower mark, holds for ~700ms, then lifts up out of view.
   Calls `onDone` once the lift animation finishes.

   Usage:
     const [show, setShow] = useState(true);
     {show && <Curtain onDone={() => setShow(false)} />}
   ───────────────────────────────────────────────────────────────── */
function Curtain({ onDone, holdMs = 800, liftMs = 900, tagline = "Locations d'exception" }) {
  const [lifting, setLifting] = useCurtainState(false);
  const doneRef = useCurtainRef(onDone);

  useCurtainEffect(() => {
    const t1 = setTimeout(() => setLifting(true), holdMs);
    const t2 = setTimeout(() => doneRef.current && doneRef.current(), holdMs + liftMs);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [holdMs, liftMs]);

  /* Keyframes injected once per page */
  useCurtainEffect(() => {
    if (document.getElementById("__curtain_keyframes")) return;
    const s = document.createElement("style");
    s.id = "__curtain_keyframes";
    s.textContent = `
      @keyframes curtainLift {
        0%   { transform: translateY(0); }
        100% { transform: translateY(-100%); }
      }
      @keyframes curtainFadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes curtainPetalSpin {
        from { transform: rotate(0deg) scale(1); }
        50%  { transform: rotate(180deg) scale(1.08); }
        to   { transform: rotate(360deg) scale(1); }
      }
      @keyframes curtainTextRise {
        from { opacity: 0; transform: translateY(14px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(s);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "var(--c-navy, #0e3b3a)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      animation: lifting
        ? `curtainLift ${liftMs}ms cubic-bezier(0.76, 0, 0.24, 1) forwards`
        : "curtainFadeIn 400ms ease forwards",
      pointerEvents: lifting ? "none" : "auto",
    }}>
      {/* Spinning amaryllis mark — six coral petals + gold center */}
      <div style={{
        marginBottom: 28,
        animation: "curtainPetalSpin 2.4s ease-in-out infinite",
      }}>
        <svg width="68" height="68" viewBox="-50 -50 100 100">
          {[0, 60, 120, 180, 240, 300].map(rot => (
            <g key={rot} transform={`rotate(${rot})`}>
              <path d="M 0 0 L 0 -38 L 8 -20 Z" fill="var(--c-coral, #c47254)" opacity="0.92"/>
            </g>
          ))}
          <circle cx="0" cy="0" r="4.5" fill="var(--c-gold, #c9a673)"/>
        </svg>
      </div>

      <div style={{
        fontFamily: "'Jost', sans-serif",
        fontWeight: 200,
        fontSize: "clamp(28px, 6vw, 52px)",
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: "var(--c-ivory, #faf5e9)",
        lineHeight: 1,
        marginBottom: 14,
        animation: "curtainTextRise 700ms 200ms cubic-bezier(0.23,1,0.32,1) backwards",
      }}>
        Amaryllis
      </div>

      <div style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontStyle: "italic",
        fontSize: 16,
        color: "var(--c-gold, #c9a673)",
        letterSpacing: "0.08em",
        opacity: 0.85,
        animation: "curtainTextRise 700ms 400ms cubic-bezier(0.23,1,0.32,1) backwards",
      }}>
        {tagline}
      </div>
    </div>
  );
}

Object.assign(window, { Curtain });
