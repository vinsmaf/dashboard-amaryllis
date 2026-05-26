// Page Linktree-style /links — destination de "lien en bio" Instagram
import React, { useEffect } from "react";

const BIENS = [
  { id: "amaryllis",  emoji: "🌺", nom: "Villa Amaryllis",  sub: "Sainte-Luce · 8 pers · vue mer 180°" },
  { id: "zandoli",    emoji: "🌴", nom: "Zandoli",          sub: "Sainte-Luce · 5 pers · jardin tropical" },
  { id: "iguana",     emoji: "🌋", nom: "Villa Iguana",     sub: "Sainte-Luce · 6 pers · vue Rocher du Diamant" },
  { id: "geko",       emoji: "🍃", nom: "Géko",             sub: "Sainte-Luce · 4 pers · jardin fleuri" },
  { id: "mabouya",    emoji: "♨️", nom: "Studio Mabouya",   sub: "Sainte-Luce · 2 pers · jacuzzi privatif" },
  { id: "schoelcher", emoji: "🌅", nom: "Bellevue",         sub: "Schœlcher · 2 pers · vue baie Fort-de-France" },
  { id: "nogent",     emoji: "🌳", nom: "Appt Nogent",      sub: "Nogent-sur-Marne · 2 pers · bord de Marne" },
];

const EXTRAS = [
  { label: "🏝️ Tous nos hébergements", href: "/" },
  { label: "📖 Guide Sainte-Luce",      href: "/sainte-luce-martinique" },
  { label: "🎯 Pourquoi réserver direct", href: "/reservation-directe-martinique" },
  { label: "📅 Quand partir en Martinique", href: "/meilleure-saison-martinique" },
];

export default function Links() {
  useEffect(() => {
    document.title = "Amaryllis Locations · Liens utiles";
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #faf5e9 0%, #f4ead6 100%)",
      padding: "40px 16px",
      fontFamily: "var(--font-sans, system-ui)",
    }}>
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg,#c47254,#e91e8c)",
            margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 38, boxShadow: "0 8px 30px rgba(196,114,84,0.3)",
          }}>🌺</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#0e3b3a", margin: 0, fontFamily: "var(--font-serif, Georgia, serif)" }}>
            Amaryllis Locations
          </h1>
          <p style={{ fontSize: 13, color: "#5a5450", marginTop: 6, marginBottom: 0 }}>
            7 hébergements d'exception · Martinique & Paris
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, fontSize: 11, color: "#857c75", flexWrap: "wrap" }}>
            <span>⭐ 4,8★ moyenne</span>
            <span>·</span>
            <span>97+ avis</span>
            <span>·</span>
            <span>🎯 Réservation directe</span>
          </div>
        </div>

        {/* Biens (carte par bien) */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#857c75", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, paddingLeft: 4 }}>
            Découvrir un logement
          </div>
          {BIENS.map(b => (
            <a key={b.id} href={`/${b.id}`} style={{
              display: "block",
              padding: "14px 18px",
              marginBottom: 10,
              background: "#fff",
              borderRadius: 14,
              textDecoration: "none",
              color: "#0e3b3a",
              boxShadow: "0 2px 12px rgba(14,59,58,0.06)",
              border: "1px solid rgba(14,59,58,0.06)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(14,59,58,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(14,59,58,0.06)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 28 }}>{b.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{b.nom}</div>
                  <div style={{ fontSize: 11, color: "#857c75", marginTop: 2 }}>{b.sub}</div>
                </div>
                <span style={{ fontSize: 18, color: "#c47254" }}>→</span>
              </div>
            </a>
          ))}
        </div>

        {/* Extras */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#857c75", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, paddingLeft: 4 }}>
            Guides & informations
          </div>
          {EXTRAS.map((e, i) => (
            <a key={i} href={e.href} style={{
              display: "block",
              padding: "12px 18px",
              marginBottom: 8,
              background: "rgba(255,255,255,0.6)",
              borderRadius: 12,
              textDecoration: "none",
              color: "#0e3b3a",
              fontSize: 13,
              fontWeight: 500,
              border: "1px solid rgba(14,59,58,0.08)",
            }}>{e.label}</a>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 32, fontSize: 10, color: "#857c75" }}>
          <a href="https://www.instagram.com/amaryllislocations" style={{ color: "#c47254", textDecoration: "none", marginRight: 12 }}>📸 Instagram</a>
          <a href="https://www.facebook.com/amaryllislocations" style={{ color: "#c47254", textDecoration: "none" }}>📘 Facebook</a>
          <div style={{ marginTop: 8 }}>villamaryllis.com</div>
        </div>
      </div>
    </div>
  );
}
