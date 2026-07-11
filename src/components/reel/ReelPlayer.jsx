// src/components/reel/ReelPlayer.jsx
// Lecteur de reel générique (Ken Burns + overlays 9:16).
// Consommé par ZandoliReel, MabouaReel, SchoelcherReel, NogentReel.
// Architecture RAF identique à VillaAmaryllisReel / GekoReel.

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./reel.css";
import { FlowerMark } from "./ReelOverlays.jsx";

const DURATION = 42;
const FADE     = 0.55;

function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
function easeInOut(t)   { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }
function clamp01(t)     { return Math.max(0, Math.min(1, t)); }
function lerp(a, b, t)  { return a + (b - a) * t; }
function inOutQuad(p)   { return p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p+2, 2)/2; }

function fade(t, start, fi, hold, fo) {
  const end = start + fi + hold + fo;
  if (t < start || t > end) return 0;
  if (t < start + fi)             return (t - start) / fi;
  if (t < start + fi + hold)      return 1;
  return 1 - (t - start - fi - hold) / fo;
}

function computeShot(shot, t) {
  const p = clamp01((t - shot.start) / (shot.end - shot.start));
  const e = inOutQuad(p);
  const opacity =
    t < shot.start - 0.01 || t > shot.end + 0.01 ? 0
    : t < shot.start + FADE ? (t - shot.start) / FADE
    : t > shot.end   - FADE ? (shot.end - t)   / FADE
    : 1;
  return { opacity, sc: lerp(shot.fromScale, shot.toScale, e), x: lerp(shot.fromX, shot.toX, e), y: lerp(shot.fromY, shot.toY, e) };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useImagePreload(srcs) {
  const [loaded, setLoaded]         = useState(0);
  const [firstReady, setFirstReady] = useState(false);
  useEffect(() => {
    let cancelled = false, n = 0;
    srcs.forEach((src, i) => {
      const img = new Image();
      img.src = src;
      const done = () => {
        if (cancelled) return;
        n++;
        setLoaded(n);
        if (i === 0) setFirstReady(true);
      };
      img.decode ? img.decode().then(done).catch(done) : (img.onload = img.onerror = done);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { progress: loaded / srcs.length, firstReady };
}

function useContainerScale(containerRef, mode = "width") {
  const [result, setResult] = useState(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = (rect) => {
      if (mode === "cover") {
        const s = Math.max(rect.width / 1080, rect.height / 1920);
        if (s > 0) setResult({ scale: s, offsetX: -Math.round((1080*s - rect.width)/2), offsetY: -Math.round((1920*s - rect.height)/2) });
      } else {
        const d = mode === "height" ? rect.height : rect.width;
        const T = mode === "height" ? 1920 : 1080;
        if (d > 0) setResult({ scale: d / T, offsetX: 0, offsetY: 0 });
      }
    };
    const ro = new ResizeObserver(([e]) => compute(e.contentRect));
    ro.observe(el);
    compute(el.getBoundingClientRect());
    return () => ro.disconnect();
  }, [containerRef, mode]);
  return result;
}

function useReducedMotion() {
  const [r, setR] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const h = (e) => setR(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return r;
}

// ── Overlay scenes ─────────────────────────────────────────────────────────────

function TopChrome({ t, coral, eyebrow }) {
  const vis = fade(t, 2.0, 0.6, 31.0, 0.6);
  if (vis <= 0) return null;
  return (
    <div className="rc-top" style={{ opacity: vis }}>
      <div className="rc-top-grad" />
      <div className="rc-top-row">
        <div className="rc-mark"><FlowerMark size={42} /></div>
        <div className="rc-eyebrow-wrap">
          <div className="rc-eyebrow-key">
            <span className="rc-eyebrow" style={{ color: coral }}>{eyebrow}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneHook({ t, coral, hookTitle, hookTitleSize, hookSubtitle, hookPill }) {
  if (t > 7) return null;
  const barsH    = lerp(80, 0, easeOutExpo(clamp01(t / 0.8)));
  const slideOut = t > 5.5 ? easeInOut(clamp01((t - 5.5) / 0.7)) : 0;
  const op       = 1 - slideOut;
  return (
    <div className="rc-scene">
      <div style={{ position:"absolute", top:0, left:0, right:0, background:"#000", height: barsH, zIndex:5 }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"#000", height: barsH, zIndex:5 }} />
      <div style={{ position:"absolute", inset:0, background:`rgba(0,0,0,${lerp(0.5,0.2,clamp01(t/1.5))})` }}/>

      <div style={{
        position:"absolute", top:"22%", left:0, right:0, textAlign:"center",
        fontFamily:"'Jost',sans-serif", fontWeight:300, fontSize:46, letterSpacing:"0.5em",
        textTransform:"uppercase", color:"#c9a673",
        opacity: easeOutExpo(clamp01((t-0.9)/0.6)) * op,
        transform:`translateY(${lerp(20,0,easeOutExpo(clamp01((t-0.9)/0.6)))}px)`,
      }}>
        MARTINIQUE
      </div>

      <div style={{
        position:"absolute", top:"34%", left:0, right:0, textAlign:"center",
        fontFamily:"'Jost',sans-serif", fontWeight:200, fontSize: hookTitleSize ?? 160, letterSpacing:"0.06em",
        textTransform:"uppercase", color:"#fff", lineHeight:0.88,
        textShadow:"0 8px 60px rgba(0,0,0,0.6)",
        opacity: easeOutExpo(clamp01((t-1.2)/0.7)) * op,
        transform:`translateY(${lerp(28,0,easeOutExpo(clamp01((t-1.2)/0.7)))}px)`,
      }}>
        {hookTitle}
      </div>

      <div style={{
        position:"absolute", top:"66%", left:0, right:0, textAlign:"center",
        fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:42,
        color:"rgba(255,255,255,0.9)", textShadow:"0 2px 16px rgba(0,0,0,0.6)",
        opacity: easeOutExpo(clamp01((t-1.7)/0.6)) * op,
        transform:`translateY(${lerp(20,0,easeOutExpo(clamp01((t-1.7)/0.6)))}px)`,
      }}>
        {hookSubtitle}
      </div>

      <div style={{
        position:"absolute", top:"78%", left:0, right:0, display:"flex", justifyContent:"center",
        opacity: easeOutExpo(clamp01((t-2.3)/0.6)) * op,
        transform:`translateY(${lerp(20,0,easeOutExpo(clamp01((t-2.3)/0.6)))}px)`,
      }}>
        <div style={{
          background:"rgba(196,114,84,0.92)", backdropFilter:"blur(8px)", borderRadius:999,
          padding:"14px 36px", fontFamily:"'Jost',sans-serif", fontWeight:700, fontSize:26,
          letterSpacing:"0.10em", textTransform:"uppercase", color:"#fff",
          boxShadow:`0 6px 28px ${coral}88`,
        }}>
          {hookPill ?? "✦ −15% vs Airbnb · Réservation directe"}
        </div>
      </div>
    </div>
  );
}

function SceneLowerThird({ t, ltSupra, ltTitle, ltSub, rating, ratingCount }) {
  if (t < 5.5 || t > 16) return null;
  const p    = easeOutExpo(clamp01((t - 5.5) / 0.7));
  const exit = t > 14 ? easeOutExpo(clamp01((t - 14) / 0.8)) : 0;
  const op   = p * (1 - exit);
  const rp   = easeOutExpo(clamp01((t - 7) / 0.6));
  const rop  = fade(t, 7, 0.6, 6.5, 0.8);
  return (
    <div className="rc-scene">
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.45) 0%, transparent 70%)" }}/>
      <div style={{
        position:"absolute", bottom:48, left:0, right:0,
        background:"linear-gradient(90deg, rgba(14,59,58,0.94) 0%, rgba(14,59,58,0.78) 65%, transparent 100%)",
        padding:"18px 52px 22px",
        opacity: op, transform:`translateX(${lerp(-120,0,p)}px)`,
      }}>
        <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:300, fontSize:22, letterSpacing:"0.42em", textTransform:"uppercase", color:"#c9a673", marginBottom:6 }}>
          {ltSupra}
        </div>
        <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:200, fontSize:76, letterSpacing:"0.12em", textTransform:"uppercase", color:"#fff", lineHeight:1 }}>
          {ltTitle}
        </div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:34, color:"rgba(255,255,255,0.82)", marginTop:4 }}>
          {ltSub}
        </div>
      </div>
      {rop > 0 && (
        <div style={{
          position:"absolute", top:36, right:40,
          background:"rgba(255,255,255,0.15)", backdropFilter:"blur(14px)",
          border:"1px solid rgba(255,255,255,0.3)", borderRadius:999,
          padding:"14px 28px",
          fontFamily:"'Jost',sans-serif", fontWeight:600, fontSize:30, color:"#fff",
          display:"flex", alignItems:"center", gap:10,
          opacity: rop, transform:`translateX(${lerp(60,0,rp)}px)`,
        }}>
          <span style={{color:"#c9a673",fontSize:36}}>★</span> {rating} <span style={{opacity:0.5}}>·</span> {ratingCount}
        </div>
      )}
    </div>
  );
}

function SceneFeatures({ t, coral, features }) {
  if (t < 12 || t > 24) return null;
  const exit = t > 22.5 ? easeOutExpo(clamp01((t - 22.5) / 0.9)) : 0;
  return (
    <div className="rc-scene">
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(270deg, rgba(14,59,58,0.72) 0%, transparent 58%)" }}/>
      {features.map((f, i) => {
        const at = 12.8 + i * 1.0;
        const p  = easeOutExpo(clamp01((t - at) / 0.55));
        if (p <= 0.01) return null;
        return (
          <div key={f.label} style={{
            position:"absolute", right:52, top: 110 + i * 120,
            background:"rgba(14,59,58,0.88)", backdropFilter:"blur(14px)",
            border:"1px solid rgba(201,166,115,0.38)", borderRadius:999,
            padding:"12px 28px",
            display:"flex", alignItems:"center", gap:14,
            fontFamily:"'Jost',sans-serif", fontWeight:500, fontSize:28, color:"#fff",
            whiteSpace:"nowrap",
            opacity: p * (1 - exit),
            transform:`translateX(${lerp(100,0,p)}px)`,
          }}>
            <span style={{fontSize:34}}>{f.icon}</span>
            <span>{f.label}</span>
            <span style={{color:"#c9a673", fontWeight:700}}>· {f.val}</span>
          </div>
        );
      })}
    </div>
  );
}

function SceneReview({ t, reviewText, reviewAuthor }) {
  if (t < 21 || t > 31) return null;
  const p    = easeOutExpo(clamp01((t - 21) / 0.9));
  const exit = t > 29.5 ? easeOutExpo(clamp01((t - 29.5) / 0.9)) : 0;
  const rp   = easeOutExpo(clamp01((t - 22) / 0.7));
  const rop  = fade(t, 22, 0.7, 6.5, 0.9);
  return (
    <div className="rc-scene">
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.44)" }}/>
      <div style={{
        position:"absolute", bottom:90, left:48,
        background:"rgba(255,255,255,0.96)", borderRadius:24, padding:"26px 32px",
        maxWidth:560, boxShadow:"0 10px 50px rgba(0,0,0,0.4)",
        opacity: p * (1 - exit), transform:`translateY(${lerp(48,0,p)}px)`,
      }}>
        <div style={{ color:"#c9a673", fontSize:34, letterSpacing:4, marginBottom:10 }}>★★★★★</div>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:30, lineHeight:1.5, color:"#0e3b3a" }}>
          "{reviewText}"
        </div>
        <div style={{ marginTop:12, fontFamily:"'Jost',sans-serif", fontWeight:600, fontSize:18, letterSpacing:"0.12em", textTransform:"uppercase", color:"#7a6b5a" }}>
          {reviewAuthor}
        </div>
      </div>
      {rop > 0 && (
        <div style={{
          position:"absolute", top:56, right:48, textAlign:"right",
          opacity: rop, transform:`translateX(${lerp(40,0,rp)}px)`,
        }}>
          <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:200, fontSize:180, color:"#fff", letterSpacing:"-0.02em", lineHeight:1, textShadow:"0 8px 40px rgba(0,0,0,0.5)" }}>{reviewStars(reviewText)}</div>
        </div>
      )}
    </div>
  );
}

function reviewStars() { return null; }

function ScenePrice({ t, coral, price, voyageurs }) {
  if (t < 28.5 || t > 37) return null;
  const p    = easeOutExpo(clamp01((t - 28.5) / 1.0));
  const exit = t > 35.5 ? easeOutExpo(clamp01((t - 35.5) / 0.9)) : 0;
  const sp   = easeOutExpo(clamp01((t - 30) / 0.6));
  return (
    <div className="rc-scene">
      <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.62)" }}/>
      <div style={{
        position:"absolute", left:"50%", top:"50%",
        transform:`translate(-50%, -50%) scale(${lerp(0.82, 1, p)})`,
        opacity: p * (1 - exit),
        textAlign:"center",
        background:"rgba(14,59,58,0.90)", backdropFilter:"blur(18px)",
        border:"1px solid rgba(201,166,115,0.52)", borderRadius:28,
        padding:"44px 68px",
      }}>
        <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:200, fontSize:22, letterSpacing:"0.48em", textTransform:"uppercase", color:"#c9a673", marginBottom:8 }}>
          À partir de
        </div>
        <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:200, fontSize:180, color:"#fff", letterSpacing:"-0.02em", lineHeight:1 }}>
          {price}€
        </div>
        <div style={{ fontFamily:"'Jost',sans-serif", fontWeight:300, fontSize:32, color:"rgba(255,255,255,0.6)", letterSpacing:"0.1em" }}>
          / nuit · {voyageurs} voyageurs max
        </div>
        <div style={{
          marginTop:20, opacity: sp,
          transform:`translateY(${lerp(14,0,sp)}px)`,
          background:"rgba(16,185,129,0.18)", border:"1px solid rgba(16,185,129,0.42)",
          borderRadius:12, padding:"12px 24px",
          fontFamily:"'Jost',sans-serif", fontWeight:700, fontSize:24, color:"var(--c-success-light)", letterSpacing:"0.07em",
        }}>
          ✓ −15% · Réservez en direct et économisez
        </div>
        <div style={{
          marginTop:10, opacity: easeOutExpo(clamp01((t-30.6)/0.5)),
          fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", color:"rgba(255,255,255,0.55)", fontSize:22,
        }}>
          Annulation gratuite jusqu'à J−7
        </div>
      </div>
    </div>
  );
}

function SceneCTA({ t, coral, onCta }) {
  if (t < 34.5) return null;
  const p    = easeInOut(clamp01((t - 34.5) / 1.3));
  const bars = lerp(0, 90, easeOutExpo(clamp01((t - 34.5) / 1.0)));

  const handleCta = (e) => {
    e.stopPropagation();
    if (onCta) { onCta(); return; }
    const target = document.getElementById("booking-section");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    else window.scrollBy({ top: 600, behavior: "smooth" });
  };

  return (
    <div className="rc-scene">
      <div style={{ position:"absolute", inset:0, background:`rgba(0,0,0,${lerp(0.52,0.84,p)})` }}/>
      <div style={{ position:"absolute", top:0, left:0, right:0, background:"#000", height: bars }}/>
      <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"#000", height: bars }}/>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:28, opacity: p }}>
        <div style={{
          fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:40, color:"#c9a673",
          opacity: easeOutExpo(clamp01((t-35.3)/0.7)),
          transform:`translateY(${lerp(24,0,easeOutExpo(clamp01((t-35.3)/0.7)))}px)`,
        }}>
          — Réservez en direct
        </div>
        <div style={{
          fontFamily:"'Jost',sans-serif", fontWeight:200, fontSize:100, letterSpacing:"0.14em",
          textTransform:"uppercase", color:"#fff", textAlign:"center", lineHeight:1,
          opacity: easeOutExpo(clamp01((t-35.8)/0.7)),
          transform:`translateY(${lerp(24,0,easeOutExpo(clamp01((t-35.8)/0.7)))}px)`,
        }}>
          AMARYLLIS<br/>LOCATIONS
        </div>
        <div style={{
          fontFamily:"'Jost',sans-serif", fontWeight:300, fontSize:36, letterSpacing:"0.28em",
          textTransform:"uppercase", color: coral,
          textShadow:`0 3px 16px ${coral}80`,
          opacity: easeOutExpo(clamp01((t-36.3)/0.6)),
        }}>
          villamaryllis.com
        </div>
        <button
          data-no-toggle
          onClick={handleCta}
          style={{
            background: coral, color:"#fff", padding:"20px 60px", borderRadius:999, border:"none",
            fontFamily:"'Jost',sans-serif", fontWeight:700, fontSize:28, letterSpacing:"0.10em",
            textTransform:"uppercase", cursor:"pointer",
            boxShadow:`0 8px 40px ${coral}88`,
            opacity: easeOutExpo(clamp01((t-36.8)/0.5)),
            transform:`translateY(${lerp(20,0,easeOutExpo(clamp01((t-36.8)/0.5)))}px)`,
          }}
        >
          Réserver → −15% direct
        </button>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ReelPlayer({
  shots,
  coral       = "#c47254",
  price       = "90",
  voyageurs   = "2",
  eyebrow     = "MARTINIQUE · SAINTE-LUCE",
  hookTitle   = "BIEN",
  hookTitleSize,
  hookSubtitle= "",
  hookPill,
  ltSupra     = "Logement · Martinique",
  ltTitle     = "BIEN",
  ltSub       = "",
  rating      = "4,8",
  ratingCount = "20 avis",
  features    = [],
  reviewText  = "",
  reviewAuthor= "",
  ariaLabel   = "Reel",
  maxWidth    = 400,
  fillHeight  = false,
  onCta,
  className   = "",
}) {
  const STAGE_W = 1080, STAGE_H = 1920;
  const containerRef  = useRef(null);
  const scaleResult   = useContainerScale(containerRef, fillHeight ? "cover" : "width");
  const scale         = scaleResult?.scale ?? null;
  const coverOffsetX  = scaleResult?.offsetX ?? 0;
  const coverOffsetY  = scaleResult?.offsetY ?? 0;
  const reducedMotion = useReducedMotion();

  const imgRefs     = useRef([]);
  const progressRef = useRef(null);
  const dimRef      = useRef(null);
  const tRef        = useRef(0);
  const frameCount  = useRef(0);
  const playingRef  = useRef(true);
  const rafRef      = useRef(null);
  const lastRef     = useRef(performance.now());
  const applyDOMRef = useRef(null);
  const tickRef     = useRef(null);
  const visibleRef  = useRef(true);

  const [tState, setTState]   = useState(0);
  const [playing, setPlaying] = useState(true);

  const photoSrcs = useMemo(() => shots.map(s => s.src), [shots]);
  const { progress: loadProgress, firstReady } = useImagePreload(photoSrcs);
  const ready = firstReady;

  useEffect(() => { playingRef.current = playing; }, [playing]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const ioStop = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) {
        visibleRef.current = false;
        imgRefs.current.forEach(img => { if (img) img.style.willChange = "auto"; });
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      }
    }, { threshold: 0 });
    const ioStart = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        visibleRef.current = true;
        imgRefs.current.forEach(img => { if (img) img.style.willChange = "transform, opacity"; });
        if (!rafRef.current && tickRef.current) {
          lastRef.current = performance.now();
          rafRef.current = requestAnimationFrame(tickRef.current);
        }
      }
    }, { threshold: 0.15 });
    ioStop.observe(el);
    ioStart.observe(el);
    return () => { ioStop.disconnect(); ioStart.disconnect(); };
  }, []);

  applyDOMRef.current = (t) => {
    shots.forEach((shot, i) => {
      const el = imgRefs.current[i];
      if (!el) return;
      const { opacity, sc, x, y } = computeShot(shot, t);
      el.style.opacity   = opacity;
      el.style.transform = `translate(-50%, -50%) scale(${sc}) translate(${x}%, ${y}%)`;
      el.style.zIndex    = opacity > 0 ? 2 : 1;
    });
    if (dimRef.current) {
      let d = shots[0]?.dim ?? 0.3;
      for (const s of shots) if (t >= s.start && t < s.end) { d = s.dim; break; }
      dimRef.current.style.opacity = d;
    }
    if (progressRef.current) progressRef.current.style.width = `${(t / DURATION) * 100}%`;
  };

  useEffect(() => {
    if (!ready || reducedMotion) return;
    lastRef.current = performance.now();
    const tick = (now) => {
      if (!playingRef.current) { lastRef.current = now; rafRef.current = requestAnimationFrame(tick); return; }
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      let next = tRef.current + dt;
      if (next >= DURATION) next = 0;
      tRef.current = next;
      applyDOMRef.current(next);
      frameCount.current++;
      if (frameCount.current % 3 === 0) setTState(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    tickRef.current = tick;
    rafRef.current = requestAnimationFrame(tick);
    return () => { tickRef.current = null; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [ready, reducedMotion]);

  const onStageTap = useCallback((e) => {
    if (e.target.closest("button, a, [data-no-toggle]")) return;
    setPlaying(p => !p);
  }, []);

  const containerH = scale != null ? Math.round(STAGE_H * scale) : 0;
  const pageStyle = fillHeight
    ? { height:"100%", width:"100%", position:"relative", overflow:"hidden", borderRadius:16 }
    : { width:"100%", maxWidth, margin:"0 auto", height: scale != null ? containerH : undefined,
        aspectRatio: scale != null ? undefined : "9/16", position:"relative", overflow:"hidden", borderRadius:16 };

  if (reducedMotion) {
    return (
      <div className={`rc-page ${className}`} style={{ ...pageStyle, background:"var(--c-void)" }} aria-label={ariaLabel}>
        <img src={shots[0]?.src} alt={ariaLabel} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"32px 24px", fontFamily:"'Jost',sans-serif", color:"#faf5e9", textAlign:"center" }}>
          <div style={{ fontWeight:200, fontSize:28, letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:8 }}>{hookTitle}</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontSize:18, opacity:0.85 }}>{hookSubtitle}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rc-page ${className}`} style={pageStyle} aria-label={ariaLabel}>
      <div ref={containerRef} style={{ position:"absolute", inset:0, pointerEvents:"none" }} />

      {scale != null && (
        <div
          className="rc-stage"
          style={{ width:STAGE_W, height:STAGE_H, transform:`scale(${scale})`, transformOrigin:"top left",
            position:"absolute", top:coverOffsetY, left:coverOffsetX, willChange: playing ? "transform" : "auto" }}
          onClick={onStageTap}
          aria-hidden="true"
        >
          <div className="rc-photo-bed">
            {shots.map((shot, i) => (
              <img key={shot.src + i} ref={el => { imgRefs.current[i] = el; }} src={shot.src} alt=""
                className="rc-photo"
                style={{ opacity:0, transform:`translate(-50%,-50%) scale(${shot.fromScale}) translate(${shot.fromX}%,${shot.fromY}%)`, zIndex: i===0 ? 2 : 1 }} />
            ))}
            <div ref={dimRef} className="rc-video-dim" style={{ opacity: shots[0]?.dim ?? 0.3 }} />
            <div className="rc-video-vignette" />
          </div>
          <div className="rc-mask-top" />
          <div className="rc-mask-bottom" />

          <TopChrome       t={tState} coral={coral} eyebrow={eyebrow} />
          <SceneHook       t={tState} coral={coral} hookTitle={hookTitle} hookTitleSize={hookTitleSize} hookSubtitle={hookSubtitle} hookPill={hookPill} />
          <SceneLowerThird t={tState} ltSupra={ltSupra} ltTitle={ltTitle} ltSub={ltSub} rating={rating} ratingCount={ratingCount} />
          <SceneFeatures   t={tState} coral={coral} features={features} />
          <SceneReview     t={tState} reviewText={reviewText} reviewAuthor={reviewAuthor} />
          <ScenePrice      t={tState} coral={coral} price={price} voyageurs={voyageurs} />
          <SceneCTA        t={tState} coral={coral} onCta={onCta} />

          <div className="rc-progress">
            <div ref={progressRef} className="rc-progress-fill" style={{ width:"0%", background: coral }} />
          </div>

          {!playing && ready && (
            <div className="rc-paused"><div className="rc-paused-icon">▶</div></div>
          )}

          {!ready && (
            <div className="rc-loading">
              <div className="rc-loading-bg" />
              <div className="rc-loading-stack">
                <div className="rc-loading-mark"><FlowerMark size={120} /></div>
                <div className="rc-loading-eye">{hookTitle}</div>
                <div className="rc-loading-bar">
                  <div className="rc-loading-fill" style={{ width:`${loadProgress*100}%`, background: coral }} />
                </div>
                <div className="rc-loading-italic">— préchargement du reel —</div>
              </div>
            </div>
          )}
        </div>
      )}

      {scale == null && (
        <div style={{ position:"absolute", inset:0,
          background:"radial-gradient(ellipse at top, rgba(14,59,58,0.95) 0%, rgba(5,14,16,1) 100%)",
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <FlowerMark size={80} />
        </div>
      )}
    </div>
  );
}
