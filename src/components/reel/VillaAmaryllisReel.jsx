// src/components/reel/VillaAmaryllisReel.jsx
// design-008 — Reel cinématique Villa Amaryllis (30s, format 9:16)
//
// Performance: hybride refs/RAF + state 20fps
//   - tRef          → horloge exacte (mis à jour chaque frame)
//   - imgRefs       → DOM direct pour Ken-Burns (60fps sans React)
//   - progressRef   → DOM direct pour la barre de progression
//   - dimRef        → DOM direct pour l'overlay de luminosité
//   - tState        → useState déclenché ~20fps pour les overlays React
//
// Props:
//   coral    {string}  — couleur accent (défaut: #c47254)
//   price    {string}  — prix affiché (défaut: "280")
//   hook     {string}  — phrase d'accroche ouverture
//   maxWidth {number}  — largeur max du conteneur px (défaut: 400)
//   className{string}  — classe CSS supplémentaire

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./reel.css";
import {
  FlowerMark,
  TopChrome,
  HookOverlay,
  TitleReveal,
  RatingChip,
  QuoteOverlay,
  PriceStamp,
  AmenityStrip,
  CtaPulse,
  OutroCard,
  AffordanceHint,
  UrgencyBadge,
} from "./ReelOverlays.jsx";

// ── Timeline ─────────────────────────────────────────────────────────────────
const DURATION = 30; // secondes

// Photos — utilise les WebP existants dans /public/photos/amaryllis/
// Ken-Burns: fromScale→toScale + dérive en % (fromX→toX, fromY→toY)
const SHOTS = [
  {
    src:       "/photos/amaryllis/01.webp",
    start:     0.0,  end: 4.6,
    fromScale: 1.00, toScale: 1.15,
    fromX: -1.0, toX:  1.5,
    fromY:  0.0, toY: -0.8,
    dim:       0.40,
  },
  {
    src:       "/photos/amaryllis/08.webp",
    start:     4.1,  end: 10.6,
    fromScale: 1.18, toScale: 1.00,
    fromX:  2.5, toX: -2.0,
    fromY:  0.5, toY:  0.0,
    dim:       0.22,
  },
  {
    src:       "/photos/amaryllis/05.webp",
    start:     10.1, end: 16.1,
    fromScale: 1.00, toScale: 1.12,
    fromX:  0.0, toX:  0.0,
    fromY:  1.2, toY: -1.5,
    dim:       0.20,
  },
  {
    src:       "/photos/amaryllis/11.webp",
    start:     15.6, end: 21.1,
    fromScale: 1.12, toScale: 1.00,
    fromX:  1.5, toX: -1.5,
    fromY:  0.0, toY:  1.5,
    dim:       0.22,
  },
  {
    src:       "/photos/amaryllis/02.webp",
    start:     20.6, end: 27.1,
    fromScale: 1.00, toScale: 1.16,
    fromX: -1.5, toX:  2.0,
    fromY:  0.0, toY:  0.0,
    dim:       0.28,
  },
];

const FADE = 0.55;

// inOutQuad easing
function inOutQuad(p) {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

// ── Image preloader avec img.decode() ────────────────────────────────────────
function useImagePreload(srcs) {
  const [loaded, setLoaded] = useState(0);
  const [firstReady, setFirstReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let n = 0;
    srcs.forEach((src, i) => {
      const img = new Image();
      img.src = src;
      const done = () => {
        if (cancelled) return;
        n++;
        setLoaded(n);
        if (i === 0) setFirstReady(true); // slide 0 prête → on peut révéler
      };
      // img.decode() garantit que le GPU est prêt avant d'afficher
      img.decode ? img.decode().then(done).catch(done) : (img.onload = img.onerror = done);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { progress: loaded / srcs.length, firstReady };
}

// ── Container-aware scale (ResizeObserver) ────────────────────────────────────
// mode "width"  → scale = width / 1080   (défaut, pour positionnement standard)
// mode "cover"  → scale = max(w/1080, h/1920), centre le stage — aucun bord noir
// Retourne toujours { scale, offsetX, offsetY } ou null.
function useContainerScale(containerRef, mode = "width") {
  const [result, setResult] = useState(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = (rect) => {
      if (mode === "cover") {
        const sw = rect.width  / 1080;
        const sh = rect.height / 1920;
        const s  = Math.max(sw, sh);
        if (s > 0) setResult({
          scale:   s,
          offsetX: -Math.round((1080 * s - rect.width)  / 2),
          offsetY: -Math.round((1920 * s - rect.height) / 2),
        });
      } else {
        const dim    = mode === "height" ? rect.height : rect.width;
        const target = mode === "height" ? 1920 : 1080;
        if (dim > 0) setResult({ scale: dim / target, offsetX: 0, offsetY: 0 });
      }
    };
    const ro = new ResizeObserver(([entry]) => compute(entry.contentRect));
    ro.observe(el);
    compute(el.getBoundingClientRect());
    return () => ro.disconnect();
  }, [containerRef, mode]);
  return result; // { scale, offsetX, offsetY } | null
}

// ── prefers-reduced-motion ───────────────────────────────────────────────────
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ── Calcul Ken-Burns pour un shot à l'instant t ──────────────────────────────
function computeShot(shot, t) {
  const p = Math.max(0, Math.min(1, (t - shot.start) / (shot.end - shot.start)));
  const e = inOutQuad(p);
  const opacity =
    t < shot.start - 0.01 || t > shot.end + 0.01 ? 0
    : t < shot.start + FADE ? Math.max(0, (t - shot.start) / FADE)
    : t > shot.end   - FADE ? Math.max(0, (shot.end - t) / FADE)
    : 1;
  const sc = shot.fromScale + (shot.toScale - shot.fromScale) * e;
  const x  = shot.fromX    + (shot.toX    - shot.fromX)    * e;
  const y  = shot.fromY    + (shot.toY    - shot.fromY)    * e;
  return { opacity, sc, x, y };
}

// ── VillaAmaryllisReel ────────────────────────────────────────────────────────
export default function VillaAmaryllisReel({
  coral      = "#c47254",
  price      = "280",
  hook       = "Le seul endroit où la piscine surplombe l'Atlantique.",
  ctaLabel   = "RÉSERVER EN DIRECT",
  maxWidth   = 400,
  fillHeight = false,             // ← true : scale sur hauteur (colonne droite hero)
  onCta,                          // ← callback CTA / OutroCard "Réserver"
  titleText  = "VILLA AMARYLLIS", // ← titre affiché dans le reel
  titleSub   = "Sainte-Luce · Martinique",
  className  = "",
}) {
  const STAGE_W = 1080;
  const STAGE_H = 1920;

  const containerRef  = useRef(null);
  const scaleResult   = useContainerScale(containerRef, fillHeight ? "cover" : "width");
  const scale         = scaleResult?.scale ?? null;
  const coverOffsetX  = scaleResult?.offsetX ?? 0;
  const coverOffsetY  = scaleResult?.offsetY ?? 0;
  const reducedMotion = useReducedMotion();

  // ── Refs pour mises à jour DOM directes (60fps sans React) ─────────────────
  const imgRefs         = useRef([]);      // refs sur chaque <img>
  const progressRef     = useRef(null);    // ref sur .rc-progress-fill
  const dimRef          = useRef(null);    // ref sur .rc-video-dim
  const tRef            = useRef(0);       // horloge exacte
  const frameCount      = useRef(0);       // compteur frames pour throttle overlays
  const playingRef      = useRef(true);    // état de lecture synchrone
  const rafRef          = useRef(null);
  const lastRef         = useRef(performance.now());
  // Stocké en ref (utilise uniquement des refs → jamais en deps array, jamais de TDZ)
  const applyFrameDOMRef = useRef(null);

  // ── State React (overlays, loading, playing pour UI) ───────────────────────
  const [tState, setTState]       = useState(0);    // ~20fps pour overlays
  const [playing, setPlaying]     = useState(true);
  const [replayKey, setReplayKey] = useState(0);    // déclenche replay depuis OutroCard

  // Preload
  const photoSrcs    = useMemo(() => SHOTS.map(s => s.src), []);
  const { progress: loadProgress, firstReady } = useImagePreload(photoSrcs);
  // Révèle le reel dès la 1re image décodée (slide 0) ; les 4 autres préchargent
  // derrière et sont prêtes avant leur slide. Évite le bloc noir « préchargement »
  // sur cache froid (≈1-2 Mo à charger avant le 1er pixel auparavant).
  const ready        = firstReady;

  // Sync playingRef avec state playing
  useEffect(() => { playingRef.current = playing; }, [playing]);

  // ── IntersectionObserver — stoppe le RAF + libère will-change hors viewport ──
  // Hysteresis : start à 0.15 (>15% visible), stop à 0 (complètement hors viewport).
  // Évite le jank de démarrage/arrêt rapide quand l'utilisateur scrolle en zone limite.
  const visibleRef = useRef(true);
  const tickRef = useRef(null); // référence stable vers la fonction tick, partagée avec l'IO
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    // Observer "stop" : fire quand le reel disparaît complètement du viewport
    const ioStop = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          visibleRef.current = false;
          imgRefs.current.forEach(img => { if (img) img.style.willChange = "auto"; });
          // Arrêt réel du RAF — économise CPU/batterie hors viewport
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
        }
      },
      { threshold: 0 }
    );

    // Observer "start" : fire quand au moins 15% du reel est visible
    const ioStart = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          visibleRef.current = true;
          imgRefs.current.forEach(img => { if (img) img.style.willChange = "transform, opacity"; });
          // Redémarre le RAF seulement s'il est vraiment stoppé et que le reel est prêt
          if (!rafRef.current && tickRef.current) {
            lastRef.current = performance.now();
            rafRef.current = requestAnimationFrame(tickRef.current);
          }
        }
      },
      { threshold: 0.15 }
    );

    ioStop.observe(el);
    ioStart.observe(el);
    return () => { ioStop.disconnect(); ioStart.disconnect(); };
  }, []);

  // ── Fonction de mise à jour DOM directe ─────────────────────────────────────
  // Réassignée à chaque render (sans coût : utilise uniquement des refs stables).
  // Stockée dans un ref pour éviter tout TDZ et supprimer la dépendance des useEffect.
  applyFrameDOMRef.current = (t) => {
    // Photos Ken-Burns
    SHOTS.forEach((shot, i) => {
      const el = imgRefs.current[i];
      if (!el) return;
      const { opacity, sc, x, y } = computeShot(shot, t);
      el.style.opacity   = opacity;
      el.style.transform = `translate(-50%, -50%) scale(${sc}) translate(${x}%, ${y}%)`;
      el.style.zIndex    = opacity > 0 ? 2 : 1;
    });

    // Dim overlay
    if (dimRef.current) {
      let activeDim = SHOTS[0].dim;
      for (const s of SHOTS) {
        if (t >= s.start && t < s.end) { activeDim = s.dim; break; }
      }
      dimRef.current.style.opacity = activeDim;
    }

    // Barre de progression
    if (progressRef.current) {
      progressRef.current.style.width = `${(t / DURATION) * 100}%`;
    }
  };

  // ── RAF clock ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || reducedMotion) return;

    lastRef.current = performance.now();

    const tick = (now) => {
      if (!playingRef.current) {
        // Pause utilisateur : maintient la boucle mais ne fait rien
        lastRef.current = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      // visibleRef.current = false → le RAF est stoppé par l'IO, on ne doit pas arriver ici
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;

      let next = tRef.current + dt;
      if (next >= DURATION) next = 0;
      tRef.current = next;

      // Mise à jour DOM directe (60fps)
      applyFrameDOMRef.current(next);

      // Mise à jour React overlays (~20fps — 1 frame sur 3)
      frameCount.current++;
      if (frameCount.current % 3 === 0) {
        setTState(next);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    // Expose tick via ref pour que l'IO puisse redémarrer le RAF
    tickRef.current = tick;

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      tickRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, reducedMotion]);

  // ── Debug helpers (dev only) ─────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.__reelSetT = (t) => {
      tRef.current = t;
      applyFrameDOMRef.current(t);
      setTState(t);
    };
    window.__reelSetPlaying = (v) => {
      setPlaying(v);
    };
    return () => {
      delete window.__reelSetT;
      delete window.__reelSetPlaying;
    };
  }, []);

  // ── Replay depuis OutroCard ──────────────────────────────────────────────────
  const handleReplay = useCallback(() => {
    tRef.current = 0;
    frameCount.current = 0;
    applyFrameDOMRef.current(0);
    setTState(0);
    setPlaying(true);
    setReplayKey(k => k + 1);
  }, []);

  // ── Tap pour pause/lecture ──────────────────────────────────────────────────
  const onStageTap = useCallback((e) => {
    if (e.target.closest("button, a, [data-no-toggle]")) return;
    setPlaying(p => !p);
  }, []);

  // ── Sizes ───────────────────────────────────────────────────────────────────
  const containerW = scale != null ? Math.round(STAGE_W * scale) : 0;
  const containerH = scale != null ? Math.round(STAGE_H * scale) : 0;

  // ── prefers-reduced-motion: static first photo ──────────────────────────────
  if (reducedMotion) {
    const staticStyle = fillHeight
      ? { width: "100%", height: "100%", borderRadius: 16, overflow: "hidden", position: "relative", background: "#050608" }
      : { width: "100%", maxWidth, margin: "0 auto", aspectRatio: "9/16", borderRadius: 16, overflow: "hidden", position: "relative", background: "#050608" };
    return (
      <div className={`rc-page ${className}`} style={staticStyle} aria-label="Villa Amaryllis">
        <img
          src={SHOTS[0].src}
          alt="Villa Amaryllis — Sainte-Luce, Martinique"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "32px 24px", fontFamily: "'Jost', sans-serif",
          color: "#faf5e9", textAlign: "center",
        }}>
          <div style={{ fontWeight: 200, fontSize: 28, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
            {titleText}
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: 18, opacity: 0.85 }}>
            {titleSub}
          </div>
        </div>
      </div>
    );
  }

  // ── Styles du conteneur selon le mode ────────────────────────────────────────
  const pageStyle = fillHeight
    ? {
        // cover : remplit width+height exactement, comme object-fit:cover — aucun bord noir
        height:      "100%",
        width:       "100%",
        position:    "relative",
        overflow:    "hidden",
        borderRadius: 16,
      }
    : {
        // mode standard : largeur d'abord, hauteur calculée
        width:       "100%",
        maxWidth,
        margin:      "0 auto",
        height:      scale != null ? containerH : undefined,
        aspectRatio: scale != null ? undefined : "9/16",
        position:    "relative",
        overflow:    "hidden",
        borderRadius: 16,
      };

  return (
    <div
      className={`rc-page ${className}`}
      style={pageStyle}
      aria-label="Reel Villa Amaryllis"
    >
      {/* ── Container measure ref (invisible) ── */}
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />

      {/* ── Scaled stage ── */}
      {scale != null && (
        <div
          className="rc-stage"
          style={{
            width:           STAGE_W,
            height:          STAGE_H,
            transform:       `scale(${scale})`,
            transformOrigin: "top left",
            position:        "absolute",
            top:             coverOffsetY,
            left:            coverOffsetX,
            // Indique au GPU de ne pas anticiper les optimisations quand en pause
            willChange:      playing ? "transform" : "auto",
          }}
          onClick={onStageTap}
          aria-hidden="true"
        >
          {/* Photo bed avec Ken-Burns (mis à jour directement via DOM refs) */}
          <div className="rc-photo-bed">
            {SHOTS.map((shot, i) => (
              <img
                key={shot.src + i}
                ref={el => { imgRefs.current[i] = el; }}
                src={shot.src}
                alt=""
                className="rc-photo"
                style={{
                  opacity:   0,
                  transform: `translate(-50%, -50%) scale(${shot.fromScale}) translate(${shot.fromX}%, ${shot.fromY}%)`,
                  zIndex:    i === 0 ? 2 : 1,
                }}
              />
            ))}
            <div
              ref={dimRef}
              className="rc-video-dim"
              style={{ opacity: SHOTS[0].dim }}
            />
            <div className="rc-video-vignette" />
          </div>

          {/* Edge gradient masks */}
          <div className="rc-mask-top" />
          <div className="rc-mask-bottom" />

          {/* Brand chrome */}
          <TopChrome t={tState} coral={coral} />

          {/* Overlays timeline — tState (~20fps) */}
          <HookOverlay  t={tState} copy={hook} />
          <TitleReveal  t={tState} text={titleText} sub={titleSub} />
          <RatingChip   t={tState} coral={coral} />
          <QuoteOverlay t={tState} coral={coral} />
          <PriceStamp   t={tState} coral={coral} price={price} />
          <AmenityStrip t={tState} />
          <UrgencyBadge t={tState} coral={coral} />
          <CtaPulse     t={tState} coral={coral} ctaLabel={ctaLabel} onClick={onCta} />
          <OutroCard    t={tState} coral={coral} onReplay={handleReplay} onCta={onCta} />

          {/* Tap affordance (hint visible les 3 premières secondes) */}
          <AffordanceHint t={tState} playing={playing} />

          {/* Barre de progression (DOM direct via ref) */}
          <div className="rc-progress">
            <div
              ref={progressRef}
              className="rc-progress-fill"
              style={{ width: "0%", background: coral }}
            />
          </div>

          {/* Indicateur pause */}
          {!playing && ready && (
            <div className="rc-paused">
              <div className="rc-paused-icon">▶</div>
            </div>
          )}

          {/* Splash de chargement */}
          {!ready && (
            <div className="rc-loading">
              <div className="rc-loading-bg" />
              <div className="rc-loading-stack">
                <div className="rc-loading-mark">
                  <FlowerMark size={120} coral={coral} />
                </div>
                <div className="rc-loading-eye">VILLA AMARYLLIS</div>
                <div className="rc-loading-bar">
                  <div
                    className="rc-loading-fill"
                    style={{ width: `${loadProgress * 100}%`, background: coral }}
                  />
                </div>
                <div className="rc-loading-italic">— préchargement du reel —</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Skeleton pendant mesure ResizeObserver */}
      {scale == null && (
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at top, rgba(14,59,58,0.95) 0%, rgba(5,14,16,1) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FlowerMark size={80} coral={coral} />
        </div>
      )}
    </div>
  );
}
