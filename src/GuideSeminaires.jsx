// Page /seminaires — Offre séminaires B2B — ebiz-003 / pub-005
// Cible : DRH, dirigeants PME, event planners — Martinique

import SEOMeta from "./SEOMeta.jsx";
import { useState } from "react";
import NewsletterForm from "./NewsletterForm.jsx";

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
  .sem-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(250,245,233,0.13); border: 1px solid rgba(250,245,233,0.25);
    border-radius: 100px; padding: 8px 16px;
    font-family: 'Jost', sans-serif; font-size: 12px;
    color: rgba(250,245,233,0.9); letter-spacing: 0.04em; white-space: nowrap;
  }
  .sem-package {
    border: 1px solid ${SAND}; border-radius: 18px; overflow: hidden; margin-bottom: 20px;
    transition: box-shadow 0.2s;
  }
  .sem-package:hover { box-shadow: 0 12px 36px rgba(14,59,58,0.1); }
  .sem-package.featured { border-color: rgba(196,114,84,0.5); }
  .sem-package-head { padding: 28px 32px 20px; background: ${CREAM}; }
  .sem-package.featured .sem-package-head { background: linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%); }
  .sem-package-name {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600;
    letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 8px;
  }
  .sem-package.featured .sem-package-name { color: ${CORAL}; }
  .sem-package:not(.featured) .sem-package-name { color: ${MUTED}; }
  .sem-package-price {
    font-family: 'Jost', sans-serif; font-size: 36px; font-weight: 700; line-height: 1; margin-bottom: 4px;
  }
  .sem-package.featured .sem-package-price { color: ${IVORY}; }
  .sem-package:not(.featured) .sem-package-price { color: ${NAVY}; }
  .sem-package-sub { font-family: 'Jost', sans-serif; font-size: 12px; color: ${MUTED}; }
  .sem-package.featured .sem-package-sub { color: rgba(250,245,233,0.6); }
  .sem-package-body { padding: 24px 32px 28px; }
  .sem-feature { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; }
  .sem-feature-icon { font-size: 16px; flex-shrink: 0; line-height: 1.5; }
  .sem-feature-text { font-family: 'Jost', sans-serif; font-size: 13px; color: ${TEXT}; line-height: 1.5; }

  .sem-step { display: flex; gap: 20px; padding: 24px 0; border-bottom: 1px solid ${SAND}; align-items: flex-start; }
  .sem-step:last-child { border-bottom: none; padding-bottom: 0; }
  .sem-step-num { font-family: 'Jost', sans-serif; font-size: 32px; font-weight: 800; color: ${SAND}; flex-shrink: 0; line-height: 1; width: 48px; }
  .sem-step-title { font-family: 'Jost', sans-serif; font-size: 15px; font-weight: 500; color: ${NAVY}; margin-bottom: 6px; }
  .sem-step-text { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px; line-height: 1.7; color: ${MUTED}; }

  .sem-form-field { margin-bottom: 16px; }
  .sem-form-label { display: block; font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: ${MUTED}; margin-bottom: 6px; }
  .sem-form-input {
    width: 100%; box-sizing: border-box;
    border: 1px solid ${SAND}; border-radius: 8px; padding: 12px 14px;
    font-family: 'Jost', sans-serif; font-size: 14px; color: ${NAVY};
    background: #fff; outline: none; transition: border-color 0.15s;
  }
  .sem-form-input:focus { border-color: ${NAVY}; }
  .sem-form-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

  @media (max-width: 640px) {
    .sem-package-head, .sem-package-body { padding-left: 20px; padding-right: 20px; }
    .sem-badges { gap: 8px !important; }
    .sem-badge { font-size: 11px; padding: 7px 12px; }
    .sem-form-2col { grid-template-columns: 1fr; }
    .sem-package-price { font-size: 28px; }
  }
`;

const PACKAGES = [
  {
    id: "weekend",
    name: "Week-end séminaire",
    price: "1 960",
    unit: "€ HT / 2 nuits · tarif location villa",
    featured: false,
    note: "2 nuits × tarif groupe",
    features: [
      { icon: "🏠", text: "Villa Amaryllis en exclusivité totale (3 chambres, 8 couchages)" },
      { icon: "🏊", text: "Piscine à débordement + jacuzzi privatif" },
      { icon: "🌅", text: "Terrasse 100 m² vue mer des Caraïbes" },
      { icon: "🍳", text: "Cuisine entièrement équipée (libre accès)" },
      { icon: "📶", text: "Wifi Starlink haut débit + grand écran TV + paperboard" },
      { icon: "🔒", text: "Accès autonome 24h/24 — arrivée flexible" },
    ],
  },
  {
    id: "semaine",
    name: "Séminaire 3 nuits",
    price: "2 940",
    unit: "€ HT / 3 nuits · tarif location villa",
    featured: true,
    badge: "⭐ Recommandé",
    note: "3 nuits × tarif groupe",
    features: [
      { icon: "🏠", text: "Villa Amaryllis en exclusivité totale (3 chambres, 8 couchages)" },
      { icon: "🏊", text: "Piscine à débordement + jacuzzi privatif" },
      { icon: "🌅", text: "Terrasse 100 m² vue mer + espace de travail intérieur" },
      { icon: "🍳", text: "Cuisine entièrement équipée (libre accès)" },
      { icon: "📶", text: "Wifi Starlink haut débit + grand écran + paperboard" },
      { icon: "🔒", text: "Accès autonome 24h/24 — check-in/out flexibles" },
      { icon: "📞", text: "Hôte disponible pour conseils locaux et organisation" },
    ],
  },
  {
    id: "sur-mesure",
    name: "Sur mesure",
    price: "Sur devis",
    unit: "Durée et configuration au choix",
    featured: false,
    features: [
      { icon: "🏠", text: "1 à 3 villas selon la taille du groupe (jusqu'à ~18 pers.)" },
      { icon: "📅", text: "Durée flexible : week-end, semaine entière, jours ouvrés" },
      { icon: "📋", text: "Devis détaillé sous 24h selon vos dates et besoins" },
    ],
  },
];

function DevisForm() {
  const [form, setForm] = useState({ nom: "", email: "", societe: "", tel: "", participants: "", dates: "", message: "", pack: "premium" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        nom: form.nom,
        email: form.email,
        message: `[SÉMINAIRE B2B]\nSociété : ${form.societe}\nTél : ${form.tel}\nParticipants : ${form.participants}\nDates souhaitées : ${form.dates}\nPackage : ${form.pack}\n\n${form.message}`,
        bien: "amaryllis",
      };
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) setSent(true);
    } catch {}
    setLoading(false);
  }

  if (sent) return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
      <h3 style={{ fontFamily: "'Jost', sans-serif", fontSize: 20, fontWeight: 500, color: NAVY, marginBottom: 12 }}>Demande envoyée !</h3>
      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.7, color: MUTED }}>
        Nous vous répondons sous 24h avec une proposition détaillée.
      </p>
    </div>
  );

  return (
    <form onSubmit={submit}>
      <div className="sem-form-2col">
        <div className="sem-form-field">
          <label className="sem-form-label">Votre nom *</label>
          <input className="sem-form-input" required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Marie Dupont" />
        </div>
        <div className="sem-form-field">
          <label className="sem-form-label">Société *</label>
          <input className="sem-form-input" required value={form.societe} onChange={e => setForm(f => ({ ...f, societe: e.target.value }))} placeholder="Acme Corp" />
        </div>
      </div>
      <div className="sem-form-2col">
        <div className="sem-form-field">
          <label className="sem-form-label">Email professionnel *</label>
          <input className="sem-form-input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="marie@acme.fr" />
        </div>
        <div className="sem-form-field">
          <label className="sem-form-label">Téléphone</label>
          <input className="sem-form-input" value={form.tel} onChange={e => setForm(f => ({ ...f, tel: e.target.value }))} placeholder="+33 6 00 00 00 00" />
        </div>
      </div>
      <div className="sem-form-2col">
        <div className="sem-form-field">
          <label className="sem-form-label">Nombre de participants *</label>
          <input className="sem-form-input" required value={form.participants} onChange={e => setForm(f => ({ ...f, participants: e.target.value }))} placeholder="Ex : 6 personnes" />
        </div>
        <div className="sem-form-field">
          <label className="sem-form-label">Dates souhaitées</label>
          <input className="sem-form-input" value={form.dates} onChange={e => setForm(f => ({ ...f, dates: e.target.value }))} placeholder="Ex : semaine du 10 mars 2026" />
        </div>
      </div>
      <div className="sem-form-field">
        <label className="sem-form-label">Package souhaité</label>
        <select className="sem-form-input" value={form.pack} onChange={e => setForm(f => ({ ...f, pack: e.target.value }))}>
          <option value="essentiel">Séminaire Essentiel — 2 nuits / 2 900€ HT</option>
          <option value="premium">Séminaire Premium — 3 nuits / 4 200€ HT ⭐</option>
          <option value="sur-mesure">Sur mesure — à définir ensemble</option>
        </select>
      </div>
      <div className="sem-form-field">
        <label className="sem-form-label">Précisions, besoins spécifiques</label>
        <textarea className="sem-form-input" rows={4} style={{ resize: "vertical" }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Programme souhaité, équipements spécifiques, activités, régimes alimentaires..." />
      </div>
      <button type="submit" disabled={loading} style={{
        width: "100%", padding: "16px", background: NAVY, color: IVORY,
        border: "none", borderRadius: 10, cursor: loading ? "wait" : "pointer",
        fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 500,
        letterSpacing: "0.12em", textTransform: "uppercase",
        transition: "opacity 0.15s", opacity: loading ? 0.7 : 1,
      }}>
        {loading ? "Envoi…" : "Demander un devis gratuit →"}
      </button>
      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: MUTED, textAlign: "center", marginTop: 12 }}>
        Réponse sous 24h · Aucun engagement<br/>
        En envoyant, vous acceptez notre <a href="/politique-confidentialite" target="_blank" rel="noopener" style={{ color: CORAL, textDecoration: "underline" }}>politique de confidentialité</a>.
      </p>
    </form>
  );
}

export default function GuideSeminaires() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta
        title="Séminaires Martinique — Villa vue mer | Amaryllis"
        description="Louez la Villa Amaryllis pour votre séminaire en Martinique. Exclusivité totale, piscine débordement, terrasse 100m² vue mer, Wifi Starlink. Dès 1 960€ HT / 2 nuits."
        canonical="/seminaires"
        image={HERO_IMG}
        type="website"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "EventVenue",
        "name": "Villa Amaryllis — Séminaires & Team Building",
        "description": "Villa exclusive avec piscine débordement et terrasse 100m² vue mer des Caraïbes. Idéale pour séminaires d'entreprise et team building en Martinique.",
        "url": `${BASE}/seminaires`,
        "image": HERO_IMG,
        "address": { "@type": "PostalAddress", "addressLocality": "Sainte-Luce", "addressRegion": "Martinique", "postalCode": "97228", "addressCountry": "MQ" },
        "geo": { "@type": "GeoCoordinates", "latitude": "14.4732", "longitude": "-60.9196" },
        "amenityFeature": [
          { "@type": "LocationFeatureSpecification", "name": "Piscine à débordement", "value": true },
          { "@type": "LocationFeatureSpecification", "name": "Wifi haut débit", "value": true },
          { "@type": "LocationFeatureSpecification", "name": "Capacité d'accueil", "value": "8 personnes" },
        ],
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
        <div style={{ position: "relative", height: "min(82vh, 560px)", overflow: "hidden" }}>
          <img
            src={HERO_IMG}
            alt="Villa Amaryllis — séminaire d'entreprise en Martinique vue mer"
            loading="eager" fetchPriority="high"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(14,59,58,0.15) 0%, rgba(14,59,58,0.88) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 32px 48px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
              <p style={{ color: CORAL, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Séminaires B2B · Martinique · Villa exclusive</p>
              <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(28px, 5.5vw, 58px)", letterSpacing: "0.04em", color: IVORY, textTransform: "uppercase", margin: "0 0 20px", lineHeight: 1.05 }}>
                Votre séminaire<br /><em style={{ fontStyle: "normal", fontWeight: 400, color: CORAL }}>face aux Caraïbes</em>
              </h1>
              <div className="sem-badges" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
                <span className="sem-badge">🏠 Villa exclusive 3 chambres</span>
                <span className="sem-badge">🏊 Piscine débordement</span>
                <span className="sem-badge">👥 Jusqu'à 8 participants</span>
                <span className="sem-badge">🌅 Terrasse 100m² vue mer</span>
                <span className="sem-badge">📶 Wifi Starlink</span>
              </div>
              <a href="#devis" style={{
                display: "inline-block", padding: "15px 36px",
                background: CORAL, color: IVORY, borderRadius: 10,
                textDecoration: "none", fontFamily: "'Jost', sans-serif",
                fontSize: 13, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
              }}>
                Demander un devis →
              </a>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 96px" }}>

          {/* ARGUMENT CENTRAL */}
          <div style={{ marginBottom: 64, maxWidth: 720 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>Pourquoi ici</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: "clamp(26px, 4vw, 40px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 24px", lineHeight: 1.1 }}>
              Un cadre qui change<br />la dynamique d'équipe
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(18px, 2.5vw, 21px)", lineHeight: 1.8, color: TEXT, marginBottom: 20 }}>
              Les salles de conférence aseptisées n'inspirent personne. La Villa Amaryllis offre le contraire : une terrasse de 100 m² face à la mer des Caraïbes, une piscine à débordement, un jardin tropical — un cadre qui change la dynamique d'un groupe.
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: MUTED }}>
              Vous gérez votre programme, nous mettons à votre disposition la villa en exclusivité. Plages, restaurants, prestataires locaux — tout est à deux pas. Vous nous contactez pour les recommandations, on vous répond.
            </p>
          </div>

          {/* CHIFFRES */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 64 }}>
            {[
              { val: "100 m²", label: "Terrasse vue mer", icon: "🌅" },
              { val: "3", label: "Chambres exclusives", icon: "🛏️" },
              { val: "8", label: "Participants max", icon: "👥" },
              { val: "30 min", label: "De l'aéroport", icon: "✈️" },
              { val: "4,9/5", label: "Note Airbnb", icon: "⭐" },
              { val: "100%", label: "Exclusivité garantie", icon: "🔒" },
            ].map(s => (
              <div key={s.label} style={{ flex: "1 1 130px", background: CREAM, border: `1px solid ${SAND}`, borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{s.val}</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: MUTED, letterSpacing: "0.06em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* PACKAGES */}
          <div style={{ marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>Offres</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: "clamp(26px, 4vw, 38px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 28px", lineHeight: 1.1 }}>
              Packages clé en main
            </h2>
            {PACKAGES.map(pkg => (
              <div key={pkg.id} className={`sem-package${pkg.featured ? " featured" : ""}`}>
                <div className="sem-package-head">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div className="sem-package-name">{pkg.name}</div>
                      <div className="sem-package-price">{pkg.price}<span style={{ fontSize: 16, fontWeight: 400 }}>€</span></div>
                      <div className="sem-package-sub">{pkg.unit}</div>
                    </div>
                    {pkg.badge && (
                      <span style={{ background: CORAL, color: IVORY, borderRadius: 20, padding: "4px 12px", fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", flexShrink: 0 }}>
                        {pkg.badge}
                      </span>
                    )}
                  </div>
                </div>
                <div className="sem-package-body">
                  {pkg.features.map((f, i) => (
                    <div key={i} className="sem-feature">
                      <span className="sem-feature-icon">{f.icon}</span>
                      <span className="sem-feature-text">{f.text}</span>
                    </div>
                  ))}
                  <a href="#devis" style={{
                    display: "inline-block", marginTop: 20, padding: "12px 28px",
                    background: pkg.featured ? CORAL : NAVY, color: IVORY,
                    borderRadius: 8, textDecoration: "none",
                    fontFamily: "'Jost', sans-serif", fontSize: 13,
                    fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
                  }}>
                    Demander ce devis →
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* COMMENT ÇA MARCHE */}
          <div style={{ marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>Organisation</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: "clamp(26px, 4vw, 38px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 28px", lineHeight: 1.1 }}>
              Simple et rapide
            </h2>
            <div>
              {[
                { titre: "Vous envoyez votre demande", texte: "Formulaire ci-dessous ou email direct. On vous répond sous 24h avec les disponibilités et le tarif exact pour vos dates et la taille de votre groupe." },
                { titre: "On réserve ensemble", texte: "Contrat de location clair, acompte à la réservation, solde à l'arrivée. Facturation HT disponible pour prise en charge entreprise." },
                { titre: "Vous arrivez, la villa est prête", texte: "Accès autonome par boîte à clé, villa nettoyée et équipée. On reste disponibles par WhatsApp pour vos questions sur place — restaurants, prestataires, bons plans." },
                { titre: "Vous repartez avec votre facture", texte: "Facture HT avec TVA récupérable. Peut être classée en frais de séminaire / formation selon votre comptabilité." },
              ].map((s, i) => (
                <div key={i} className="sem-step">
                  <div className="sem-step-num">0{i + 1}</div>
                  <div>
                    <div className="sem-step-title">{s.titre}</div>
                    <div className="sem-step-text">{s.texte}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIVITÉS À PROXIMITÉ */}
          <div style={{ background: `linear-gradient(135deg, #0a2e2d 0%, ${NAVY} 60%, #163f3e 100%)`, borderRadius: 20, padding: "44px 40px", marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, margin: "0 0 12px" }}>Environnement</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 3.5vw, 34px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 8px", lineHeight: 1.1 }}>
              Ce qui vous attend<br />à deux pas
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, lineHeight: 1.7, color: "rgba(250,245,233,0.6)", marginBottom: 24 }}>
              Activités disponibles à proximité — organisation et prestataires à votre charge, ou sur devis séparé sur demande.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {[
                { icon: "🤿", title: "Snorkeling", desc: "Tortues marines — plage à 10 min à pied" },
                { icon: "🚤", title: "Catamaran", desc: "Sorties en mer au départ de Sainte-Luce" },
                { icon: "🍳", title: "Cuisine créole", desc: "Restaurants & marchés locaux à proximité" },
                { icon: "🧘", title: "Yoga & bien-être", desc: "Terrasse 100m² idéale, vue mer" },
                { icon: "🏄", title: "Kitesurf", desc: "Bois Jolan à 5 km — spot régulier" },
                { icon: "🌿", title: "Randonnée", desc: "Forêt de Montravail, vue panoramique" },
              ].map(a => (
                <div key={a.title} style={{ background: "rgba(250,245,233,0.06)", border: "1px solid rgba(250,245,233,0.1)", borderRadius: 12, padding: "18px 16px" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{a.icon}</div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 600, color: CORAL, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{a.title}</div>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, lineHeight: 1.6, color: "rgba(250,245,233,0.7)", margin: 0 }}>{a.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FORMULAIRE DEVIS */}
          <div id="devis" style={{ scrollMarginTop: 80 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", color: CORAL, marginBottom: 10 }}>Devis gratuit</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: "clamp(26px, 4vw, 38px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 8px", lineHeight: 1.1 }}>
              Parlons de votre projet
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, lineHeight: 1.7, color: MUTED, marginBottom: 32 }}>
              Réponse sous 24h avec une proposition chiffrée adaptée à votre groupe et vos dates.
            </p>
            <div style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 18, padding: "36px 36px" }}>
              <DevisForm />
            </div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: MUTED, textAlign: "center", marginTop: 16 }}>
              Ou contactez-nous directement : <a href="mailto:contact@villamaryllis.com" style={{ color: NAVY, fontWeight: 600 }}>contact@villamaryllis.com</a>
            </p>
          </div>

        </div>

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-seminaires" />
        </div>

        {/* FOOTER */}
        <footer style={{ background: NAVY, padding: "40px 24px", textAlign: "center" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Amaryllis</a>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { href: "/", label: "Villas" },
              { href: "/amaryllis", label: "Villa Amaryllis" },
              { href: "/reservation-directe-martinique", label: "Réservation directe" },
              { href: "/sainte-luce-martinique", label: "Sainte-Luce" },
              { href: "/faq", label: "FAQ" },
            ].map(l => (
              <a key={l.href} href={l.href} style={{ color: "rgba(250,245,233,0.5)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em" }}>{l.label}</a>
            ))}
          </div>
          <p style={{ color: "rgba(250,245,233,0.3)", fontFamily: "'Jost', sans-serif", fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} Résidence Amaryllis · Sainte-Luce, Martinique</p>
        </footer>

      </div>
    </>
  );
}
