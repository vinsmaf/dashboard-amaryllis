/**
 * MessageTemplates — templates de messages voyageurs (bienvenue, check-in, etc).
 * Extrait de src/App.jsx (refactor 2026, batch B/3).
 */
import { useState } from "react";
import { useAppData } from "../AppDataContext.jsx";

export default function MessageTemplates() {
  const { biens, reservations, mob } = useAppData();
  const [tplKey, setTplKey]   = useState("welcome");
  const [resaId, setResaId]   = useState(null);
  const [copied, setCopied]   = useState(false);

  const TPLS = {
    welcome: {
      label: "🏡 Bienvenue",
      fn: (r, b) =>
`Bonjour ${r?.voyageur?.split(" ")[0] || ""},

Nous sommes ravis de vous accueillir à ${b?.nom || "notre logement"} du ${r?.checkin || "[dates]"} au ${r?.checkout || "[dates]"}.

Informations pratiques :
• Check-in à partir de 17h
• Code d'accès : [CODE]
• WiFi : [SSID] / Mot de passe : [MDP]
• Guide d'accueil : https://villamaryllis.com

N'hésitez pas à nous contacter si vous avez des questions !

Bonne route et à très bientôt,
Vincent`,
    },
    checkin: {
      label: "🔑 Rappel arrivée",
      fn: (r, b) =>
`Bonjour ${r?.voyageur?.split(" ")[0] || ""},

Votre arrivée à ${b?.nom || ""} est prévue demain.

• Check-in à partir de 17h
• Code d'accès : [CODE]
• Parking : [INFO PARKING]

Si votre heure d'arrivée change, merci de nous prévenir.

À demain !
Vincent`,
    },
    checkout: {
      label: "🚪 Rappel départ",
      fn: (r, b) =>
`Bonjour ${r?.voyageur?.split(" ")[0] || ""},

J'espère que vous passez un excellent séjour à ${b?.nom || ""} !

Petit rappel : le check-out est demain avant 12h.

• Laisser les clés sur la table d'entrée
• Fermer les volets et la porte à clé
• Vider réfrigérateur et poubelles

Merci et à bientôt !
Vincent`,
    },
    review: {
      label: "⭐ Demande d'avis",
      fn: (r, b) =>
`Bonjour ${r?.voyageur?.split(" ")[0] || ""},

Merci beaucoup pour votre séjour à ${b?.nom || ""}. C'était un vrai plaisir de vous accueillir !

Si vous avez apprécié votre séjour, un avis Airbnb nous aide énormément à faire connaître nos logements.

J'espère vous revoir bientôt !
Vincent`,
    },
    devis: {
      label: "💶 Devis direct",
      fn: (r, b) =>
`Bonjour,

Merci pour votre intérêt pour ${b?.nom || "nos logements"}.

Pour une réservation directe (sans frais Airbnb) :
• Prix : [X]€/nuit
• Ménage : [X]€
• Caution : [X]€ (remboursée sous 48h)

Réservez directement : https://villamaryllis.com/${b?.id || ""}

À votre disposition,
Vincent`,
    },
    incident: {
      label: "⚠️ Signalement incident",
      fn: (r, b) =>
`Bonjour ${r?.voyageur?.split(" ")[0] || ""},

J'ai bien pris note de votre signalement concernant ${b?.nom || "le logement"}.

Je prends cela très au sérieux et vais intervenir dès que possible.

Pouvez-vous me préciser :
1. La nature exacte du problème
2. Si vous avez des photos
3. Si cela affecte votre confort immédiatement

Je reviens vers vous dans les plus brefs délais.
Vincent`,
    },
  };

  const upcoming = reservations
    .filter(r => r.checkin >= new Date().toISOString().slice(0,10))
    .sort((a, b) => a.checkin.localeCompare(b.checkin))
    .slice(0, 15);

  const r  = resaId ? reservations.find(x => x.id === resaId) : null;
  const b  = r ? biens.find(x => x.id === r.bienId) : null;
  const tpl = TPLS[tplKey];
  const msg = tpl ? tpl.fn(r, b) : "";

  const copy = () => {
    navigator.clipboard.writeText(msg).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>
        Messages types prêts à envoyer — sélectionnez un template, choisissez une réservation (optionnel), copiez.
      </div>

      {/* Template selector */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(TPLS).map(([k, t]) => (
          <button key={k} onClick={() => setTplKey(k)} style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid", borderColor: tplKey === k ? "#0ea5e9" : "rgba(255,255,255,0.1)", background: tplKey === k ? "rgba(14,165,233,0.15)" : "transparent", color: tplKey === k ? "#0ea5e9" : "#64748b", fontSize: 11, cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Réservation selector */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 6 }}>Pré-remplir avec une réservation :</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setResaId(null)} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: !resaId ? "rgba(255,255,255,0.08)" : "transparent", color: "#94a3b8", cursor: "pointer" }}>
              Générique
            </button>
            {upcoming.slice(0, 10).map(res => {
              const bb = biens.find(x => x.id === res.bienId);
              return (
                <button key={res.id} onClick={() => setResaId(res.id)} style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: resaId === res.id ? "rgba(14,165,233,0.15)" : "transparent", color: resaId === res.id ? "#0ea5e9" : "#94a3b8", cursor: "pointer" }}>
                  {bb?.emoji} {res.voyageur?.split(" ")[0] || "?"} · {res.checkin}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Message textarea */}
      <div style={{ position: "relative" }}>
        <textarea
          readOnly value={msg}
          style={{ width: "100%", minHeight: 240, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "14px 70px 14px 14px", color: "#e2e8f0", fontSize: 12, lineHeight: 1.75, fontFamily: "system-ui,sans-serif", resize: "vertical", boxSizing: "border-box" }}
        />
        <button onClick={copy} style={{ position: "absolute", top: 10, right: 10, padding: "5px 12px", borderRadius: 8, border: "none", background: copied ? "rgba(16,185,129,0.25)" : "rgba(14,165,233,0.2)", color: copied ? "#10b981" : "#0ea5e9", fontSize: 10, cursor: "pointer", fontWeight: 700 }}>
          {copied ? "✓ Copié" : "Copier"}
        </button>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {r?.phone && (
          <a href={`https://wa.me/${r.phone.replace(/[^0-9+]/g,"")}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, padding: "7px 16px", borderRadius: 8, background: "rgba(37,211,102,0.15)", color: "#25D366", textDecoration: "none", fontWeight: 600 }}>
            📱 WhatsApp
          </a>
        )}
        <a href={`mailto:?subject=Votre séjour à ${b?.nom || "Amaryllis"}&body=${encodeURIComponent(msg)}`}
          style={{ fontSize: 11, padding: "7px 16px", borderRadius: 8, background: "rgba(14,165,233,0.1)", color: "#0ea5e9", textDecoration: "none", fontWeight: 600 }}>
          ✉️ Email
        </a>
      </div>
    </div>
  );
}
