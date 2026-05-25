// Bandeau cookies — Consent Mode v2 (Google Analytics)
// Affiché sur toutes les pages tant que le visiteur n'a pas fait son choix.
// Stockage : localStorage["amaryllis-cookie-consent"] = "granted" | "denied"
import { useState, useEffect } from "react";

const STORAGE_KEY = "amaryllis-cookie-consent";
const CORAL = "var(--c-coral)";

const EXPIRY_DAYS = 395; // CNIL : 13 mois max

function grantConsent() {
  if (window.gtag) {
    window.gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "granted",          // active le remarketing GA4/Google Ads
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
  }
  try {
    localStorage.setItem(STORAGE_KEY, "granted");
    localStorage.setItem(STORAGE_KEY + "_ts", String(Date.now()));
  } catch {}
}

function denyConsent() {
  if (window.gtag) {
    window.gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
  try {
    localStorage.setItem(STORAGE_KEY, "denied");
    localStorage.setItem(STORAGE_KEY + "_ts", String(Date.now()));
  } catch {}
}

function isExpired() {
  try {
    const ts = parseInt(localStorage.getItem(STORAGE_KEY + "_ts") || "0", 10);
    return ts > 0 && Date.now() - ts > EXPIRY_DAYS * 86400 * 1000;
  } catch { return false; }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Consentement expiré (> 13 mois CNIL) → redemander
      if (stored && isExpired()) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY + "_ts");
        setVisible(true);
        return;
      }
      if (stored === "granted") {
        // Réactiver le consentement pour les visites suivantes
        grantConsent();
        return;
      }
      if (stored === "denied") return;
      // Aucun choix enregistré → afficher le bandeau
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function handleAccept() {
    grantConsent();
    setVisible(false);
  }

  function handleDeny() {
    denyConsent();
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#072626",
        borderTop: "1px solid rgba(250,245,233,0.1)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        flexWrap: "wrap",
        boxShadow: "0 -4px 32px rgba(0,0,0,0.25)",
        animation: "slideUp 0.3s ease",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Texte */}
      <div style={{ flex: "1 1 320px", maxWidth: 620 }}>
        <p style={{
          fontFamily: "'Jost', sans-serif",
          fontWeight: 400,
          fontSize: 13,
          color: "rgba(250,245,233,0.85)",
          lineHeight: 1.6,
          margin: 0,
        }}>
          Nous utilisons des cookies d'analyse (Google Analytics) pour mesurer l'audience de notre site et améliorer votre expérience.
          Ces données sont anonymisées. En continuant sans accepter, aucun cookie non essentiel ne sera déposé.{" "}
          <a href="/politique-confidentialite" style={{ color: CORAL, textDecoration: "underline", fontSize: 12 }}>
            En savoir plus
          </a>
        </p>
      </div>

      {/* Boutons */}
      <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
        <button
          onClick={handleDeny}
          style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(250,245,233,0.5)",
            background: "transparent",
            border: "1px solid rgba(250,245,233,0.15)",
            borderRadius: 6,
            padding: "9px 18px",
            cursor: "pointer",
            transition: "border-color 0.2s, color 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.35)"; e.currentTarget.style.color = "rgba(250,245,233,0.75)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(250,245,233,0.15)"; e.currentTarget.style.color = "rgba(250,245,233,0.5)"; }}
        >
          Continuer sans accepter
        </button>
        <button
          onClick={handleAccept}
          style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#fff",
            background: "var(--c-coral)",
            border: "none",
            borderRadius: 6,
            padding: "9px 20px",
            cursor: "pointer",
            transition: "opacity 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          Accepter les cookies
        </button>
      </div>
    </div>
  );
}
