// Page /reservation-directe-martinique — SEO pilier conversion — traf-004

import SEOMeta from "./SEOMeta.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";

// Noms canoniques des biens pour le maillage interne SEO ("villa" = Amaryllis + Iguana uniquement).
const BIEN_NAMES = { amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko", mabouya: "Studio Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana", nogent: "Appartement Nogent-sur-Marne" };
import { useState, useCallback } from "react";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const BASE  = "https://villamaryllis.com";

const HERO_IMG = "https://villamaryllis.com/photos/amaryllis/01.webp";

const css = `
  .rd-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(250,245,233,0.13); border: 1px solid rgba(250,245,233,0.25);
    border-radius: 100px; padding: 8px 16px;
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400;
    color: rgba(250,245,233,0.9); letter-spacing: 0.04em; white-space: nowrap;
    backdrop-filter: blur(6px);
  }
  .rd-badge.highlight { background: rgba(196,114,84,0.4); border-color: rgba(196,114,84,0.7); font-weight: 600; }

  .rd-compare {
    display: grid; grid-template-columns: 1fr 1fr; gap: 0;
    border: 1px solid ${SAND}; border-radius: 16px; overflow: hidden; margin-bottom: 48px;
  }
  .rd-compare-col { padding: 28px 28px 32px; }
  .rd-compare-col.ota { background: #f8f5ef; }
  .rd-compare-col.direct { background: ${NAVY}; }
  .rd-compare-col h3 {
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 600;
    letter-spacing: 0.18em; text-transform: uppercase; margin: 0 0 20px;
  }
  .rd-compare-col.ota h3 { color: ${MUTED}; }
  .rd-compare-col.direct h3 { color: ${CORAL}; }
  .rd-compare-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px; }
  .rd-compare-icon { font-size: 16px; flex-shrink: 0; line-height: 1.5; }
  .rd-compare-text { font-family: 'Jost', sans-serif; font-size: 13px; line-height: 1.6; }
  .rd-compare-col.ota .rd-compare-text { color: ${MUTED}; }
  .rd-compare-col.direct .rd-compare-text { color: rgba(250,245,233,0.8); }

  .rd-villa-card {
    background: #fff; border: 1px solid ${SAND}; border-radius: 16px; overflow: hidden;
    text-decoration: none; display: block; transition: transform 0.2s, box-shadow 0.2s;
  }
  .rd-villa-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(14,59,58,0.12); }
  .rd-villa-card img { width: 100%; height: 200px; object-fit: cover; display: block; }
  .rd-villa-card-body { padding: 18px 20px; }
  .rd-villa-card-body h3 { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 500; color: ${NAVY}; margin: 0 0 6px; }
  .rd-villa-card-body .price { font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 600; color: ${CORAL}; margin-bottom: 8px; }
  .rd-villa-card-body p { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15px; line-height: 1.6; color: ${MUTED}; margin: 0 0 12px; }
  .rd-villa-card-cta { font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${CORAL}; }

  .rd-faq-item { border-bottom: 1px solid ${SAND}; }
  .rd-faq-q {
    display: flex; justify-content: space-between; align-items: center;
    padding: 20px 0; cursor: pointer; gap: 16px;
    font-family: 'Jost', sans-serif; font-size: 15px; font-weight: 400; color: ${NAVY};
  }
  .rd-faq-q:hover { color: ${CORAL}; }
  .rd-faq-a {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: ${TEXT}; padding-bottom: 20px;
  }

  .rd-form-wrap {
    background: #fff; border: 1px solid ${SAND}; border-radius: 20px;
    padding: 48px 40px; margin-bottom: 64px; box-shadow: 0 4px 24px rgba(14,59,58,0.06);
  }
  .rd-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .rd-form-full { margin-bottom: 16px; }
  .rd-label {
    display: block; font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase; color: ${NAVY}; margin-bottom: 7px;
  }
  .rd-input, .rd-select, .rd-textarea {
    width: 100%; box-sizing: border-box;
    font-family: 'Jost', sans-serif; font-size: 14px; color: ${TEXT};
    background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 9px;
    padding: 12px 14px; outline: none; transition: border-color 0.2s;
    appearance: none;
  }
  .rd-input:focus, .rd-select:focus, .rd-textarea:focus {
    border-color: ${CORAL}; background: #fff;
  }
  .rd-textarea { resize: vertical; min-height: 100px; }
  .rd-select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237a6b5a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; cursor: pointer; }
  .rd-submit-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 15px 40px; background: ${CORAL}; color: ${IVORY};
    border: none; border-radius: 10px; cursor: pointer;
    font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 500;
    letter-spacing: 0.12em; text-transform: uppercase; transition: opacity 0.2s;
    width: 100%; margin-top: 8px;
  }
  .rd-submit-btn:hover { opacity: 0.88; }
  .rd-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .rd-success {
    text-align: center; padding: 48px 24px;
  }
  .rd-success-icon { font-size: 48px; margin-bottom: 16px; }
  .rd-required { color: ${CORAL}; }
  @media (max-width: 640px) {
    .rd-form-wrap { padding: 28px 20px; }
    .rd-form-grid { grid-template-columns: 1fr; }
  }

  .rd-trust { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 48px; }
  .rd-trust-item {
    flex: 1; min-width: 160px; background: ${CREAM}; border: 1px solid ${SAND};
    border-radius: 14px; padding: 20px 18px; text-align: center;
  }
  .rd-trust-icon { font-size: 28px; margin-bottom: 8px; }
  .rd-trust-value { font-family: 'Jost', sans-serif; font-size: 22px; font-weight: 700; color: ${NAVY}; margin-bottom: 4px; }
  .rd-trust-label { font-family: 'Jost', sans-serif; font-size: 11px; color: ${MUTED}; letter-spacing: 0.08em; }

  @media (max-width: 640px) {
    .rd-compare { grid-template-columns: 1fr; }
    .rd-compare-col { padding: 20px 18px; }
    .rd-badges { gap: 8px !important; }
    .rd-badge { font-size: 11px; padding: 7px 12px; }
  }
`;

const villas = [
  { id: "amaryllis", nom: "Villa Amaryllis", desc: "Piscine débordement, 3 ch., vue mer panoramique", prix: "dès 280€/nuit", photo: "/photos/amaryllis/01.webp" },
  { id: "iguana",    nom: "Villa Iguana",    desc: "Piscine eau salée, vue Rocher du Diamant, 3 ch.", prix: "dès 220€/nuit", photo: "/photos/iguana/01.webp" },
  { id: "mabouya",   nom: "Villa Mabouya",   desc: "Jacuzzi privatif vue mer, jardin, 2 ch.",         prix: "dès 140€/nuit", photo: "/photos/mabouya/01.webp" },
  { id: "zandoli",   nom: "Zandoli",   desc: "Piscine partagée, jardin tropical, 2 ch.",         prix: "dès 120€/nuit", photo: "/photos/zandoli/01.webp" },
  { id: "geko",      nom: "Géko",      desc: "Piscine partagée, cadre naturel, 2 ch.",           prix: "dès 120€/nuit", photo: "/photos/geko/01.webp" },
  { id: "schoelcher", nom: "Villa Schœlcher", desc: "Terrasse vue mer, piscine partagée, 2 ch.",       prix: "dès 110€/nuit", photo: "/photos/schoelcher/01.webp" },
];

const faqs = [
  {
    q: "Pourquoi réserver directement plutôt que par Airbnb ou Booking ?",
    a: "La réservation directe vous permet d'économiser en moyenne 12 à 18% de frais de service. Vous bénéficiez également d'une flexibilité accrue sur les dates, d'un contact direct avec votre hôte avant votre arrivée, et de petites attentions réservées aux réservations directes (bouteille de rhum de bienvenue, transfert, colis de bienvenue...).",
  },
  {
    q: "Comment se déroule la réservation directe ?",
    a: "Sélectionnez votre villa et vos dates sur notre site, puis procédez au paiement sécurisé via Stripe (CB, Apple Pay, Google Pay). Vous recevrez immédiatement un email de confirmation, puis une semaine avant votre arrivée un guide complet avec codes d'accès, recommandations locales et contacts d'urgence.",
  },
  {
    q: "Le paiement est-il sécurisé ?",
    a: "Oui, les paiements sont traités par Stripe — la même infrastructure utilisée par Amazon, Shopify et des millions d'entreprises. Vos données de carte ne transitent jamais sur nos serveurs. Nous acceptons les cartes Visa, Mastercard, American Express, ainsi qu'Apple Pay et Google Pay.",
  },
  {
    q: "Quelle est la politique d'annulation ?",
    a: "Annulation gratuite jusqu'à 14 jours avant l'arrivée, remboursement intégral. Entre 7 et 14 jours : remboursement de 50%. Moins de 7 jours : pas de remboursement. Des conditions plus flexibles sont possibles selon la période — contactez-nous.",
  },
  {
    q: "Y a-t-il une caution ?",
    a: "Une pré-autorisation de caution (300–500€ selon la villa) est effectuée par carte bancaire 48h avant l'arrivée. Aucun montant n'est prélevé : la pré-autorisation est libérée automatiquement 3 jours après votre départ si la villa est rendue dans son état initial.",
  },
  {
    q: "Peut-on négocier le prix pour un long séjour ?",
    a: "Absolument. Des remises automatiques s'appliquent : −5% à partir de 7 nuits, −10% à partir de 14 nuits, −15% à partir de 28 nuits. Pour des séjours encore plus longs ou des demandes spécifiques (séminaires, événements familiaux), contactez-nous directement.",
  },
];

const WA_NUMBER = "33610880772";

function ContactForm() {
  // ebiz-007 : champ budget/nuit pour qualifier les leads avant rappel
  const [form, setForm] = useState({ nom: "", email: "", bien: "", arrivee: "", depart: "", voyageurs: "2", budget: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [errMsg, setErrMsg] = useState("");

  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.email.trim()) return;
    setStatus("loading");

    // Construire le message enrichi
    const parts = [];
    if (form.bien) parts.push(`Villa souhaitée : ${form.bien}`);
    if (form.arrivee) parts.push(`Arrivée : ${form.arrivee}`);
    if (form.depart) parts.push(`Départ : ${form.depart}`);
    if (form.voyageurs) parts.push(`Voyageurs : ${form.voyageurs}`);
    if (form.budget) parts.push(`Budget/nuit : ${form.budget}`);
    if (form.message.trim()) parts.push(`\nMessage :\n${form.message.trim()}`);
    const fullMessage = parts.join("\n");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom.trim(),
          email: form.email.trim(),
          bien: form.bien || null,
          message: fullMessage,
          source: "reservation-directe",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok !== false) {
        setStatus("success");
      } else {
        setErrMsg(data.error || "Une erreur est survenue. Veuillez réessayer.");
        setStatus("error");
      }
    } catch {
      setErrMsg("Impossible de joindre le serveur. Réessayez ou contactez-nous par WhatsApp.");
      setStatus("error");
    }
  }, [form]);

  if (status === "success") {
    return (
      <div className="rd-form-wrap">
        <div className="rd-success">
          <div className="rd-success-icon">✅</div>
          <h3 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 24, letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 12px" }}>
            Demande envoyée !
          </h3>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: MUTED, maxWidth: 440, margin: "0 auto 28px" }}>
            Nous vous répondrons dans les 24 heures pour confirmer la disponibilité et vous communiquer le tarif direct.
          </p>
          <a href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Bonjour, je viens d'envoyer une demande de réservation directe sur votre site.")}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: "#25D366", color: "#fff", borderRadius: 9, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 500, letterSpacing: "0.08em" }}>
            💬 Nous contacter sur WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="rd-form-wrap">
      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: CORAL, margin: "0 0 10px" }}>Demande directe</p>
      <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: "clamp(22px, 3vw, 32px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 8px", lineHeight: 1.1 }}>
        Obtenir un devis<br />sans commission
      </h2>
      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, lineHeight: 1.75, color: MUTED, margin: "0 0 32px" }}>
        Réponse garantie sous 24 h · Tarif direct jusqu'à −18% vs Airbnb
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="rd-form-grid">
          <div>
            <label className="rd-label" htmlFor="rd-nom">Prénom & Nom <span className="rd-required">*</span></label>
            <input id="rd-nom" type="text" className="rd-input" required placeholder="Jean Dupont" value={form.nom} onChange={e => set("nom", e.target.value)} />
          </div>
          <div>
            <label className="rd-label" htmlFor="rd-email">Email <span className="rd-required">*</span></label>
            <input id="rd-email" type="email" className="rd-input" required placeholder="votre@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
          </div>
        </div>

        <div className="rd-form-full">
          <label className="rd-label" htmlFor="rd-bien">Villa souhaitée</label>
          <select id="rd-bien" className="rd-select" value={form.bien} onChange={e => set("bien", e.target.value)}>
            <option value="">Je ne sais pas encore — surprenez-moi</option>
            {villas.map(v => <option key={v.id} value={v.nom}>{v.nom} — {v.prix}</option>)}
          </select>
        </div>

        <div className="rd-form-grid">
          <div>
            <label className="rd-label" htmlFor="rd-arrivee">Date d'arrivée</label>
            <input id="rd-arrivee" type="date" className="rd-input" min={today} value={form.arrivee} onChange={e => { set("arrivee", e.target.value); if (form.depart && e.target.value >= form.depart) set("depart", ""); }} />
          </div>
          <div>
            <label className="rd-label" htmlFor="rd-depart">Date de départ</label>
            <input id="rd-depart" type="date" className="rd-input" min={form.arrivee || today} value={form.depart} onChange={e => set("depart", e.target.value)} />
          </div>
        </div>

        <div className="rd-form-full">
          <label className="rd-label" htmlFor="rd-voyageurs">Nombre de voyageurs</label>
          <select id="rd-voyageurs" className="rd-select" value={form.voyageurs} onChange={e => set("voyageurs", e.target.value)}>
            {["1","2","3","4","5","6","7","8+"].map(n => <option key={n} value={n}>{n} {n === "1" ? "voyageur" : "voyageurs"}</option>)}
          </select>
        </div>

        <div className="rd-form-full">
          <label className="rd-label" htmlFor="rd-budget">Budget par nuit (optionnel)</label>
          <select id="rd-budget" className="rd-select" value={form.budget} onChange={e => set("budget", e.target.value)}>
            <option value="">Non précisé</option>
            <option value="Moins de 100€/nuit">Moins de 100€/nuit</option>
            <option value="100–150€/nuit">100–150€/nuit</option>
            <option value="150–200€/nuit">150–200€/nuit</option>
            <option value="200–250€/nuit">200–250€/nuit</option>
            <option value="Plus de 250€/nuit">Plus de 250€/nuit</option>
          </select>
        </div>

        <div className="rd-form-full">
          <label className="rd-label" htmlFor="rd-msg">Message (questions, demandes spéciales…)</label>
          <textarea id="rd-msg" className="rd-textarea" rows={4} placeholder="Ex : Nous célébrons notre anniversaire de mariage, avez-vous des attentions particulières ? Ou : Votre villa est-elle accessible aux personnes à mobilité réduite ?" value={form.message} onChange={e => set("message", e.target.value)} />
        </div>

        {status === "error" && (
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: "#dc2626", marginBottom: 12, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
            ⚠️ {errMsg}
          </p>
        )}

        <button type="submit" className="rd-submit-btn" disabled={status === "loading" || !form.nom || !form.email}>
          {status === "loading" ? (
            <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Envoi en cours…</>
          ) : "Envoyer ma demande →"}
        </button>
        <p style={{ textAlign: "center", fontFamily: "'Jost', sans-serif", fontSize: 11, color: MUTED, margin: "14px 0 0" }}>
          🔒 Vos données ne sont jamais partagées · Réponse sous 24 h<br/>
          En envoyant, vous acceptez notre <a href="/politique-confidentialite" target="_blank" rel="noopener" style={{ color: CORAL, textDecoration: "underline" }}>politique de confidentialité</a>.
        </p>
      </form>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <div>
      {faqs.map((item, i) => (
        <div key={i} className="rd-faq-item">
          <div className="rd-faq-q" onClick={() => setOpen(open === i ? null : i)}>
            <span>{item.q}</span>
            <span style={{ fontSize: 20, color: CORAL, flexShrink: 0, transition: "transform 0.2s", transform: open === i ? "rotate(45deg)" : "none" }}>+</span>
          </div>
          {open === i && <div className="rd-faq-a">{item.a}</div>}
        </div>
      ))}
    </div>
  );
}

export default function GuideReservationDirecte() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta
        title="Réservation directe Martinique — Sans frais Airbnb | Amaryllis"
        description="Réservez directement vos villas en Martinique sans frais Airbnb ni Booking. Économisez 12–18%, flexibilité maximale, paiement sécurisé. Villas piscine vue mer à Sainte-Luce."
        canonical="/reservation-directe-martinique"
        image={HERO_IMG}
        type="website"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Réservation directe villas Martinique — Résidence Amaryllis",
        "description": "Réservez sans intermédiaire vos villas en Martinique. Économisez 12–18% de frais de service. Piscine vue mer à Sainte-Luce.",
        "url": `${BASE}/reservation-directe-martinique`,
        "image": HERO_IMG,
        "mainEntity": {
          "@type": "LodgingBusiness",
          "name": "Résidence Amaryllis",
          "url": BASE,
          "image": HERO_IMG,
          "priceRange": "€€",
          "address": { "@type": "PostalAddress", "addressLocality": "Sainte-Luce", "addressRegion": "Martinique", "postalCode": "97228", "addressCountry": "MQ" },
        },
        "publisher": { "@id": `${BASE}/#organization` },
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>

        {/* NAV */}
        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase" }}>Amaryllis</a>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontSize: 12, letterSpacing: "0.08em", opacity: 0.7 }}>← Voir les villas</a>
          </div>
        </header>

        {/* HERO */}
        <div style={{ position: "relative", height: "min(85vh, 580px)", overflow: "hidden" }}>
          <img
            src={HERO_IMG}
            alt="Villa Amaryllis piscine vue mer Martinique — réservation directe"
            loading="eager"
            fetchPriority="high"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(14,59,58,0.2) 0%, rgba(14,59,58,0.85) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 32px 48px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
              <p style={{ color: CORAL, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Sans frais de service · Sans intermédiaire</p>
              <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(28px, 5.5vw, 58px)", letterSpacing: "0.04em", color: IVORY, textTransform: "uppercase", margin: "0 0 20px", lineHeight: 1.05 }}>
                Réservez directement<br /><em style={{ fontStyle: "normal", fontWeight: 400, color: CORAL }}>en Martinique</em>
              </h1>
              <div className="rd-badges" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
                <span className="rd-badge highlight">🏷 −12 à −18% vs Airbnb</span>
                <span className="rd-badge">🔒 Paiement Stripe sécurisé</span>
                <span className="rd-badge">📞 Contact direct avec l'hôte</span>
                <span className="rd-badge">🎁 Cadeaux réservation directe</span>
              </div>
              <a href="/" style={{
                display: "inline-block", padding: "15px 36px",
                background: CORAL, color: IVORY, borderRadius: 10,
                textDecoration: "none", fontFamily: "'Jost', sans-serif",
                fontSize: 14, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
              }}>
                Voir les villas & disponibilités
              </a>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 96px" }}>

          {/* TRUST */}
          <div className="rd-trust">
            {[
              { icon: "🏠", value: "6", label: "Villas à Sainte-Luce" },
              { icon: "⭐", value: "4,9/5", label: "Note moyenne voyageurs" },
              { icon: "💶", value: "−15%", label: "Économisé en réservant directement" },
              { icon: "🛡️", value: "100%", label: "Paiement sécurisé Stripe" },
            ].map(t => (
              <div key={t.label} className="rd-trust-item">
                <div className="rd-trust-icon">{t.icon}</div>
                <div className="rd-trust-value">{t.value}</div>
                <div className="rd-trust-label">{t.label}</div>
              </div>
            ))}
          </div>

          {/* COMPARATEUR */}
          <div style={{ marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>Comparatif</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: "clamp(24px, 3.5vw, 36px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 28px", lineHeight: 1.1 }}>
              Direct vs OTA<br />(Airbnb, Booking)
            </h2>
            <div className="rd-compare">
              <div className="rd-compare-col ota">
                <h3>Via Airbnb / Booking</h3>
                {[
                  { icon: "❌", text: "+12 à 18% de frais de service voyageur" },
                  { icon: "❌", text: "+3% de frais hôte répercutés" },
                  { icon: "❌", text: "Annulation soumise aux règles de la plateforme" },
                  { icon: "❌", text: "Contact hôte limité avant réservation" },
                  { icon: "❌", text: "Pas de flexibilité sur les dates" },
                  { icon: "❌", text: "Aucun geste commercial possible" },
                ].map((r, i) => (
                  <div key={i} className="rd-compare-row">
                    <span className="rd-compare-icon">{r.icon}</span>
                    <span className="rd-compare-text">{r.text}</span>
                  </div>
                ))}
              </div>
              <div className="rd-compare-col direct">
                <h3>Réservation directe</h3>
                {[
                  { icon: "✅", text: "Aucun frais de service — prix net" },
                  { icon: "✅", text: "−5% à −15% selon la durée du séjour" },
                  { icon: "✅", text: "Politique d'annulation flexible" },
                  { icon: "✅", text: "Contact direct avec votre hôte" },
                  { icon: "✅", text: "Demandes spéciales facilement accommodées" },
                  { icon: "✅", text: "Cadeaux & attentions réservés" },
                ].map((r, i) => (
                  <div key={i} className="rd-compare-row">
                    <span className="rd-compare-icon">{r.icon}</span>
                    <span className="rd-compare-text">{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* VILLAS */}
          <div style={{ marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>Nos villas</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: "clamp(24px, 3.5vw, 36px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 28px", lineHeight: 1.1 }}>
              6 villas à réserver<br />directement
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
              {villas.map(v => (
                <a key={v.id} href={`/${v.id}`} className="rd-villa-card">
                  <img src={v.photo} alt={`${v.nom} — Sainte-Luce Martinique`} loading="lazy" />
                  <div className="rd-villa-card-body">
                    <h3>{v.nom}</h3>
                    <div className="price">{v.prix}</div>
                    <p>{v.desc}</p>
                    <div className="rd-villa-card-cta">Réserver directement →</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* AVANTAGES DIRECT */}
          <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`, borderRadius: 20, padding: "48px 40px", marginBottom: 64 }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Réservation directe</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 3.5vw, 36px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 32px", lineHeight: 1.1 }}>
              Ce que vous obtenez<br />en réservant ici
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {[
                { icon: "🍾", title: "Bouteille de bienvenue", desc: "Rhum agricole ou champagne — selon la villa et votre préférence." },
                { icon: "📖", title: "Guide voyageur exclusif", desc: "Adresses locales confidentielles : plages secrètes, restaurants du marché, bonnes affaires." },
                { icon: "🚗", title: "Transfert aéroport", desc: "Disponible sur demande — tarif préférentiel réservé aux réservations directes." },
                { icon: "📞", title: "Ligne directe hôte", desc: "Numéro WhatsApp de votre hôte pour toute question avant, pendant et après le séjour." },
              ].map(a => (
                <div key={a.title} style={{ background: "rgba(250,245,233,0.06)", border: "1px solid rgba(250,245,233,0.1)", borderRadius: 12, padding: "22px 20px" }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 500, color: CORAL, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{a.title}</div>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, lineHeight: 1.7, color: "rgba(250,245,233,0.75)", margin: 0 }}>{a.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* COMMENT ÇA MARCHE */}
          <div style={{ marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>Simple & rapide</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: "clamp(24px, 3.5vw, 36px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 32px", lineHeight: 1.1 }}>
              Comment réserver<br />en 3 étapes
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { step: "01", title: "Choisissez votre villa", desc: "Consultez les 6 villas disponibles, vérifiez les disponibilités avec le calendrier intégré et sélectionnez vos dates." },
                { step: "02", title: "Paiement sécurisé", desc: "Réglez en ligne via Stripe — CB, Apple Pay ou Google Pay. Vous recevez instantanément un email de confirmation." },
                { step: "03", title: "Profitez de votre séjour", desc: "7 jours avant l'arrivée, vous recevez votre guide complet avec codes d'accès, recommandations locales et contact de votre hôte." },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 24, padding: "24px 0", borderBottom: i < 2 ? `1px solid ${SAND}` : "none" }}>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 36, fontWeight: 700, color: SAND, flexShrink: 0, lineHeight: 1 }}>{s.step}</div>
                  <div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 15, fontWeight: 500, color: NAVY, marginBottom: 8, letterSpacing: "0.03em" }}>{s.title}</div>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, lineHeight: 1.75, color: MUTED, margin: 0 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FORMULAIRE CONTACT DIRECT */}
          <ContactForm />

          {/* FAQ */}
          <div style={{ marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>Questions fréquentes</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: "clamp(24px, 3.5vw, 36px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 28px", lineHeight: 1.1 }}>
              Tout ce que vous<br />voulez savoir
            </h2>
            <FAQ />
          </div>

          {/* CTA FINAL */}
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, marginBottom: 14 }}>Prêt à réserver ?</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(26px, 4vw, 44px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 18px", lineHeight: 1.1 }}>
              Votre villa en Martinique<br />vous attend
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: MUTED, maxWidth: 480, margin: "0 auto 36px" }}>
              Réservez directement et économisez. Sans frais de service, sans intermédiaire, avec toute la flexibilité dont vous avez besoin.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/" style={{
                display: "inline-block", padding: "16px 40px",
                background: NAVY, color: IVORY, borderRadius: 10,
                textDecoration: "none", fontFamily: "'Jost', sans-serif",
                fontSize: 14, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
              }}>
                Voir les villas
              </a>
              <a href="/faq" style={{
                display: "inline-block", padding: "16px 36px",
                background: "transparent", color: NAVY, borderRadius: 10,
                textDecoration: "none", fontFamily: "'Jost', sans-serif",
                fontSize: 14, fontWeight: 400, letterSpacing: "0.1em", textTransform: "uppercase",
                border: `1px solid ${SAND}`,
              }}>
                FAQ complète
              </a>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <footer style={{ background: NAVY, padding: "40px 24px", textAlign: "center" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Amaryllis</a>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { href: "/", label: "Villas" },
              { href: "/sainte-luce-martinique", label: "Sainte-Luce" },
              { href: "/guide-hub", label: "Explorer" },
              { href: "/faq", label: "FAQ" },
              { href: "/mentions-legales", label: "Légal" },
            ].map(l => (
              <a key={l.href} href={l.href} style={{ color: "rgba(250,245,233,0.5)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em" }}>{l.label}</a>
            ))}
          </div>
          <p style={{ color: "rgba(250,245,233,0.3)", fontFamily: "'Jost', sans-serif", fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} Résidence Amaryllis · Sainte-Luce, Martinique</p>
        </footer>

        <MaillageCluster currentSlug="reservation-directe-martinique" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
