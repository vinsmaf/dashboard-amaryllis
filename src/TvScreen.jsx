// src/TvScreen.jsx
import { useState, useEffect } from "react";
import QRCode from "qrcode";

function Qr({ value, size = 220 }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!value) return undefined;
    let alive = true;
    QRCode.toDataURL(value, { margin: 1, width: size, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(d => { if (alive) setSrc(d); }).catch(() => { if (alive) setSrc(null); });
    return () => { alive = false; };
  }, [value, size]);
  if (!value || !src) return null;
  return <img src={src} alt="QR code" width={size} height={size}
    style={{ borderRadius: 16, background: "#fff", padding: 10 }} />;
}

const SLIDE_MS = 12000;

export default function TvScreen({ slides, colors }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const { dark, mid: accent, light } = colors;

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(() => setI(p => (p + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const s = slides[i] || {};
  const wrap = {
    width: "100vw", height: "100vh", overflow: "hidden", boxSizing: "border-box",
    padding: "5vh 6vw", background: `linear-gradient(135deg, ${dark} 0%, #06100c 100%)`,
    color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif",
    display: "flex", flexDirection: "column", justifyContent: "center", cursor: "none",
  };
  const H1 = { fontSize: "clamp(34px, 5.5vw, 84px)", fontWeight: 800, lineHeight: 1.05, margin: 0, letterSpacing: "-0.02em" };
  const SUB = { fontSize: "clamp(20px, 2.4vw, 40px)", color: light, opacity: 0.9, marginTop: "2vh", fontWeight: 500 };
  const BODY = { fontSize: "clamp(18px, 2vw, 34px)", lineHeight: 1.5, marginTop: "3vh", maxWidth: "60ch", opacity: 0.95 };

  return (
    <div style={wrap} onClick={() => setPaused(p => !p)}>
      {/* bandeau marque */}
      <div style={{ position: "absolute", top: "3vh", left: "6vw", fontSize: "clamp(13px,1.3vw,20px)", letterSpacing: "0.3em", textTransform: "uppercase", color: accent, fontWeight: 700 }}>Amaryllis</div>

      <h1 style={H1}>{s.title}</h1>
      {s.subtitle && <div style={SUB}>{s.subtitle}</div>}

      {/* WiFi en grand */}
      {s.id === "wifi" && (
        <div style={{ display: "flex", gap: "5vw", alignItems: "center", marginTop: "4vh" }}>
          <div>
            <div style={{ fontSize: "clamp(16px,1.6vw,26px)", color: light, opacity: 0.7 }}>Réseau</div>
            <div style={{ fontSize: "clamp(28px,3.4vw,54px)", fontWeight: 800 }}>{s.ssid}</div>
            <div style={{ fontSize: "clamp(16px,1.6vw,26px)", color: light, opacity: 0.7, marginTop: "2vh" }}>Mot de passe</div>
            <div style={{ fontSize: "clamp(28px,3.4vw,54px)", fontWeight: 800, fontFamily: "ui-monospace, monospace" }}>{s.password}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Qr value={s.qr} size={260} />
            <div style={{ marginTop: "1.5vh", fontSize: "clamp(13px,1.3vw,20px)", opacity: 0.8 }}>Scannez pour vous connecter</div>
          </div>
        </div>
      )}

      {s.id === "practical" && s.checkout && (
        <div style={{ ...BODY }}>🔴 Départ avant <b>{s.checkout}</b>{s.contact?.host_name ? ` · Votre hôte : ${s.contact.host_name}` : ""}</div>
      )}

      {s.body && s.id !== "wifi" && <div style={BODY}>{s.body}</div>}
      {s.signature && <div style={{ ...SUB, marginTop: "3vh", fontStyle: "italic" }}>— {s.signature}</div>}

      {/* QR générique (slides guide / services / practical / rebook) */}
      {s.qr && s.id !== "wifi" && (
        <div style={{ position: "absolute", bottom: "5vh", right: "6vw", textAlign: "center" }}>
          <Qr value={s.qr} size={200} />
          {s.qrLabel && <div style={{ marginTop: "1vh", fontSize: "clamp(13px,1.3vw,20px)", opacity: 0.85 }}>{s.qrLabel}</div>}
        </div>
      )}

      {/* pastilles de progression */}
      <div style={{ position: "absolute", bottom: "5vh", left: "6vw", display: "flex", gap: 10 }}>
        {slides.map((_, k) => (
          <div key={k} style={{ width: k === i ? 34 : 12, height: 12, borderRadius: 6, background: k === i ? accent : "rgba(255,255,255,0.25)", transition: "all .3s" }} />
        ))}
      </div>
    </div>
  );
}
