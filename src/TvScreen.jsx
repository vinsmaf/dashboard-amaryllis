import { useState, useEffect } from "react";
import QRCode from "qrcode";

/* ─── Tokens de marque Amaryllis ─────────────────────────────────── */
const BRAND = { ivory: "#faf5e9", sand: "#e0d4bc", navy: "#0e3b3a", coral: "#c47254", gold: "#c9a673" };
const DISPLAY = "'Jost', system-ui, -apple-system, sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
@keyframes tvKen { 0% { transform: scale(1.04) translate(0,0); } 100% { transform: scale(1.16) translate(-1.5%, -1.5%); } }
@keyframes tvFadeUp { 0% { opacity: 0; transform: translateY(26px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes tvFadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
@keyframes tvBar { 0% { width: 0; } 100% { width: 100%; } }
.tv-root *, .tv-root *::before, .tv-root *::after { box-sizing: border-box; }
`;

/* ─── QR (carte blanche premium) ─────────────────────────────────── */
function Qr({ value, size = 200, caption }) {
  const [src, setSrc] = useState(undefined);
  useEffect(() => {
    if (!value) return undefined;
    let alive = true;
    QRCode.toDataURL(value, { margin: 1, width: size, color: { dark: "#0e3b3a", light: "#ffffff" } })
      .then((d) => { if (alive) setSrc(d); }).catch(() => {});
    return () => { alive = false; };
  }, [value, size]);
  if (!value || !src) return null;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ background: "#fff", padding: 14, borderRadius: 22, boxShadow: "0 24px 60px rgba(0,0,0,0.45)", display: "inline-block", lineHeight: 0 }}>
        <img src={src} alt="QR code" width={size} height={size} />
      </div>
      {caption && <div style={{ marginTop: "1.4vh", fontFamily: DISPLAY, fontSize: "clamp(12px,1.15vw,18px)", letterSpacing: "0.04em", color: BRAND.ivory, opacity: 0.92 }}>{caption}</div>}
    </div>
  );
}

const SLIDE_MS = 13000;

export default function TvScreen({ slides = [], colors = {}, pid = "amaryllis" }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const accent = colors.mid || BRAND.coral;

  // Fonds photo (rotation sur 6 clichés du logement) — fallback gradient si absent.
  const photos = ["01", "02", "03", "04", "05", "06"].map((n) => `/photos/${pid}/${n}.webp`);

  useEffect(() => {
    if (paused || slides.length <= 1) return undefined;
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const s = slides[i] || {};
  const bg = photos[i % photos.length];

  /* styles */
  const eyebrow = { fontFamily: DISPLAY, fontWeight: 600, fontSize: "clamp(13px,1.25vw,21px)", letterSpacing: "0.42em", textTransform: "uppercase", color: BRAND.gold, margin: 0 };
  const h1 = { fontFamily: DISPLAY, fontWeight: 200, fontSize: "clamp(46px,7vw,124px)", lineHeight: 0.98, letterSpacing: "0.01em", color: "#fff", margin: "1.4vh 0 0", textShadow: "0 4px 40px rgba(0,0,0,0.5)" };
  const subtitle = { fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: "clamp(22px,2.7vw,46px)", color: BRAND.ivory, opacity: 0.95, margin: "2.4vh 0 0", lineHeight: 1.3 };
  const body = { fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(19px,2vw,34px)", lineHeight: 1.5, color: BRAND.ivory, opacity: 0.92, margin: "3vh 0 0", maxWidth: "34ch" };
  const signature = { fontFamily: SERIF, fontStyle: "italic", fontSize: "clamp(18px,1.7vw,30px)", color: BRAND.gold, margin: "3vh 0 0" };
  const glass = { background: "rgba(10,22,18,0.42)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 24, padding: "3vh 3vw" };
  const fieldLabel = { fontFamily: DISPLAY, fontSize: "clamp(13px,1.2vw,20px)", letterSpacing: "0.2em", textTransform: "uppercase", color: BRAND.gold, opacity: 0.85 };
  const fieldValue = { fontFamily: "ui-monospace, 'JetBrains Mono', monospace", fontWeight: 600, fontSize: "clamp(30px,4vw,68px)", color: "#fff", lineHeight: 1.1, marginTop: "0.6vh" };

  return (
    <div className="tv-root" onClick={() => setPaused((p) => !p)}
      style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#06100c", cursor: "none", fontFamily: DISPLAY }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── Fond photo Ken Burns (remonté à chaque slide via key) ── */}
      <div key={`bg-${i}`} style={{ position: "absolute", inset: 0, animation: "tvKen 22s ease-out forwards, tvFadeIn 1.2s ease both",
        backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      {/* fallback couleur si la photo manque */}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${colors.dark || BRAND.navy} 0%, #06100c 100%)`, zIndex: -1 }} />

      {/* ── Voile dégradé (lisibilité texte en bas-gauche) ── */}
      <div style={{ position: "absolute", inset: 0, background:
        "linear-gradient(105deg, rgba(6,16,12,0.92) 0%, rgba(6,16,12,0.74) 34%, rgba(6,16,12,0.30) 62%, rgba(6,16,12,0.55) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 220px 60px rgba(0,0,0,0.55)" }} />

      {/* ── Lockup marque ── */}
      <div style={{ position: "absolute", top: "5.5vh", left: "6vw", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 300, fontSize: "clamp(16px,1.5vw,24px)", letterSpacing: "0.42em", textTransform: "uppercase", color: BRAND.ivory }}>Amaryllis</span>
        <span style={{ width: "clamp(40px,5vw,90px)", height: 1, background: accent, opacity: 0.8 }} />
      </div>

      {/* ── Contenu (animé à chaque slide) ── */}
      <div key={`c-${i}`} style={{ position: "absolute", inset: 0, padding: "6vh 6vw 9vh", display: "flex", flexDirection: "column", justifyContent: "center", animation: "tvFadeUp 0.9s cubic-bezier(.2,.7,.2,1) both" }}>
        {s.eyebrow && <p style={eyebrow}>{s.eyebrow}</p>}
        <h1 style={h1}>{s.title}</h1>
        {s.subtitle && <div style={subtitle}>{s.subtitle}</div>}

        {/* WiFi : cartes glass + QR */}
        {s.id === "wifi" && (
          <div style={{ display: "flex", gap: "3vw", alignItems: "stretch", marginTop: "4vh", flexWrap: "wrap" }}>
            <div style={{ ...glass, display: "flex", flexDirection: "column", justifyContent: "center", gap: "2.4vh" }}>
              <div><div style={fieldLabel}>Réseau</div><div style={fieldValue}>{s.ssid}</div></div>
              <div><div style={fieldLabel}>Mot de passe</div><div style={fieldValue}>{s.password}</div></div>
            </div>
            <div style={{ ...glass, display: "flex", alignItems: "center" }}>
              <Qr value={s.qr} size={230} caption="Scannez pour vous connecter" />
            </div>
          </div>
        )}

        {/* Pratique */}
        {s.id === "practical" && s.checkout && (
          <div style={body}>🔴 Départ avant <b style={{ color: "#fff", fontStyle: "normal" }}>{s.checkout}</b>{s.contact?.host_name ? ` · Votre hôte : ${s.contact.host_name}` : ""}</div>
        )}

        {s.body && s.id !== "wifi" && <div style={body}>{s.body}</div>}
        {s.signature && <div style={signature}>— {s.signature}</div>}
      </div>

      {/* ── QR générique (slides guide/services/practical/rebook) ── */}
      {s.qr && s.id !== "wifi" && (
        <div style={{ position: "absolute", bottom: "8vh", right: "6vw", animation: "tvFadeIn 1.1s ease both" }}>
          <Qr value={s.qr} size={196} caption={s.qrLabel} />
        </div>
      )}

      {/* ── Barre de progression bas + pastilles ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 5, background: "rgba(255,255,255,0.12)" }}>
        {!paused && <div key={`bar-${i}`} style={{ height: "100%", background: accent, animation: `tvBar ${SLIDE_MS}ms linear both` }} />}
      </div>
      <div style={{ position: "absolute", bottom: "4vh", left: "6vw", display: "flex", gap: 11 }}>
        {slides.map((_, k) => (
          <div key={k} style={{ width: k === i ? 30 : 10, height: 10, borderRadius: 6, background: k === i ? accent : "rgba(255,255,255,0.3)", transition: "all .4s" }} />
        ))}
      </div>

      {paused && <div style={{ position: "absolute", top: "5.5vh", right: "6vw", fontFamily: DISPLAY, fontSize: "clamp(12px,1.1vw,18px)", letterSpacing: "0.2em", color: BRAND.ivory, opacity: 0.7 }}>⏸ EN PAUSE</div>}
    </div>
  );
}
