// Guide Sainte-Luce Martinique — /sainte-luce-martinique — SEO P0

import SEOMeta from "./SEOMeta.jsx";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const BASE  = "https://villamaryllis.com";

const HERO_IMG = "https://villamaryllis.com/photos/iguana/01.webp";

const css = `
  .sl-hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(14,59,58,0.15) 0%, rgba(14,59,58,0.12) 40%, rgba(14,59,58,0.90) 100%);
  }
  .sl-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(250,245,233,0.13); border: 1px solid rgba(250,245,233,0.25);
    border-radius: 100px; padding: 8px 16px;
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400;
    color: rgba(250,245,233,0.9); letter-spacing: 0.04em; white-space: nowrap;
    backdrop-filter: blur(6px);
  }

  .sl-card {
    background: #fff; border: 1px solid ${SAND}; border-radius: 16px; overflow: hidden; margin-bottom: 16px;
  }
  .sl-card img { width: 100%; height: 220px; object-fit: cover; display: block; }
  .sl-card-body { padding: 24px 28px; }
  .sl-card-body h3 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 15px;
    color: ${NAVY}; margin: 0 0 8px; letter-spacing: 0.04em;
  }
  .sl-card-body p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: ${TEXT}; margin: 0;
  }

  .sl-highlight {
    background: linear-gradient(135deg, #0a2e2d 0%, #0e3b3a 60%, #163f3e 100%);
    border: 1px solid rgba(196,114,84,0.3); border-radius: 20px; overflow: hidden; margin-bottom: 64px;
  }
  .sl-highlight-head { padding: 36px 40px 28px; border-bottom: 1px solid rgba(250,245,233,0.08); }
  .sl-highlight-body { padding: 32px 40px 40px; display: flex; flex-direction: column; gap: 20px; }
  .sl-hl-item {
    background: rgba(250,245,233,0.05); border: 1px solid rgba(250,245,233,0.08);
    border-radius: 12px; padding: 22px 26px;
  }
  .sl-hl-item h4 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 13px;
    color: ${CORAL}; margin: 0 0 8px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .sl-hl-item p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: rgba(250,245,233,0.82); margin: 0;
  }

  .sl-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 48px; }
  .sl-info { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 20px 22px; }
  .sl-info-label { font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 6px; }
  .sl-info-value { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 400; color: ${NAVY}; line-height: 1.5; }

  .sl-villa-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-bottom: 48px; }
  .sl-villa-card {
    background: #fff; border: 1px solid ${SAND}; border-radius: 16px; overflow: hidden;
    text-decoration: none; display: block; transition: transform 0.2s, box-shadow 0.2s;
  }
  .sl-villa-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(14,59,58,0.12); }
  .sl-villa-card img { width: 100%; height: 180px; object-fit: cover; display: block; }
  .sl-villa-card-body { padding: 18px 20px; }
  .sl-villa-card-body h3 { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 500; color: ${NAVY}; margin: 0 0 6px; }
  .sl-villa-card-body p { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15px; line-height: 1.6; color: ${MUTED}; margin: 0 0 12px; }
  .sl-villa-card-cta { font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${CORAL}; }

  .sl-day {
    background: linear-gradient(135deg, ${CREAM} 0%, #ede5d4 100%);
    border: 1px solid ${SAND}; border-radius: 16px; padding: 32px 36px; margin-bottom: 56px;
  }
  .sl-day-steps { display: flex; flex-direction: column; gap: 0; margin-top: 20px; }
  .sl-day-step { display: flex; gap: 18px; align-items: flex-start; padding: 16px 0; border-bottom: 1px solid rgba(232,220,200,0.6); }
  .sl-day-step:last-child { border-bottom: none; padding-bottom: 0; }
  .sl-day-time { font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.15em; color: ${CORAL}; min-width: 52px; padding-top: 3px; text-transform: uppercase; }
  .sl-day-text { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px; line-height: 1.65; color: ${TEXT}; }

  .sl-section { margin-bottom: 56px; }
  .sl-section-title {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 11px;
    letter-spacing: 0.35em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 10px;
  }
  .sl-section h2 {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: clamp(26px, 4vw, 38px);
    letter-spacing: 0.06em; text-transform: uppercase; color: ${NAVY}; margin: 0 0 28px; line-height: 1.1;
  }

  .sl-resto { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 20px 24px; margin-bottom: 12px; }
  .sl-resto-name { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 500; color: ${NAVY}; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; }
  .sl-resto-tag { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: ${CORAL}; background: rgba(196,114,84,0.1); border-radius: 8px; padding: 3px 8px; }
  .sl-resto p { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; line-height: 1.7; color: ${MUTED}; margin: 0; }

  @media (max-width: 640px) {
    .sl-highlight-head, .sl-highlight-body { padding: 24px 20px; }
    .sl-hl-item { padding: 18px 18px; }
    .sl-grid2 { grid-template-columns: 1fr; }
    .sl-day { padding: 24px 20px; }
    .sl-villa-grid { grid-template-columns: 1fr 1fr; }
    .sl-badges { gap: 8px !important; }
    .sl-badge { font-size: 11px; padding: 7px 12px; }
  }
  @media (max-width: 480px) {
    .sl-villa-grid { grid-template-columns: 1fr; }
  }
`;

const villas = [
  {
    id: "amaryllis",
    nom: "Villa Amaryllis",
    desc: "Piscine débordement, vue mer panoramique, 3 chambres",
    photo: "https://villamaryllis.com/photos/amaryllis/01.webp",
  },
  {
    id: "iguana",
    nom: "Villa Iguana",
    desc: "Piscine d'eau salée, vue Rocher du Diamant, 3 chambres",
    photo: "https://villamaryllis.com/photos/iguana/01.webp",
  },
  {
    id: "zandoli",
    nom: "Zandoli",
    desc: "Piscine partagée, jardin tropical, 2 chambres",
    photo: "https://villamaryllis.com/photos/zandoli/01.webp",
  },
  {
    id: "geko",
    nom: "Géko",
    desc: "Piscine partagée, cadre naturel, 2 chambres",
    photo: "https://villamaryllis.com/photos/geko/01.webp",
  },
  {
    id: "mabouya",
    nom: "Villa Mabouya",
    desc: "Jacuzzi privatif vue mer, jardin, 2 chambres",
    photo: "https://villamaryllis.com/photos/mabouya/01.webp",
  },
  {
    id: "schoelcher",
    nom: "Villa Schœlcher",
    desc: "Terrasse vue mer, piscine partagée, 2 chambres",
    photo: "https://villamaryllis.com/photos/schoelcher/01.webp",
  },
];

export default function GuideSainteLuce() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta
        title="Sainte-Luce Martinique — Villas & Activités | Amaryllis"
        description="Tout sur Sainte-Luce, Martinique : plages, restaurants, activités, transports. Louez une villa avec piscine vue mer à Sainte-Luce dès 120€/nuit."
        canonical="/sainte-luce-martinique"
        image={HERO_IMG}
        type="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "TouristDestination",
        "name": "Sainte-Luce, Martinique",
        "description": "Commune balnéaire du Sud Martinique, réputée pour ses plages de sable blanc, ses eaux turquoise et ses fonds marins exceptionnels.",
        "url": `${BASE}/sainte-luce-martinique`,
        "image": HERO_IMG,
        "touristType": ["Families", "Couples", "Divers"],
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "14.4697",
          "longitude": "-60.9228",
        },
        "containsPlace": [
          { "@type": "Beach", "name": "Plage du Gros Raisins" },
          { "@type": "Beach", "name": "Plage de Bois Jolan" },
          { "@type": "LodgingBusiness", "name": "Résidence Amaryllis", "url": BASE },
        ],
        "publisher": { "@id": `${BASE}/#organization` },
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>

        {/* NAV */}
        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase" }}>Amaryllis</a>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <a href="/guide-hub" style={{ color: IVORY, textDecoration: "none", fontSize: 12, letterSpacing: "0.08em", opacity: 0.6 }}>Explorer Martinique</a>
              <a href="/" style={{ color: IVORY, textDecoration: "none", fontSize: 12, letterSpacing: "0.08em", opacity: 0.7 }}>← Voir les villas</a>
            </div>
          </div>
        </header>

        {/* HERO */}
        <div style={{ position: "relative", height: "min(90vh, 620px)", overflow: "hidden" }}>
          <img
            src={HERO_IMG}
            alt="Vue mer depuis les villas Amaryllis à Sainte-Luce, Martinique"
            loading="eager"
            fetchPriority="high"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }}
          />
          <div className="sl-hero-overlay" />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 32px 48px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
              <p style={{ color: CORAL, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Sud Martinique · Guide de destination</p>
              <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(32px, 6vw, 64px)", letterSpacing: "0.04em", color: IVORY, textTransform: "uppercase", margin: "0 0 20px", lineHeight: 1.05 }}>
                Sainte-Luce<br /><em style={{ fontStyle: "normal", fontWeight: 400, color: CORAL }}>Martinique</em>
              </h1>
              <div className="sl-badges" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
                {[
                  { icon: "🏖️", label: "Plages de sable blanc" },
                  { icon: "🤿", label: "Snorkeling & fonds marins" },
                  { icon: "🌊", label: "Spot surf & kitesurf" },
                  { icon: "🦈", label: "Baignade avec les tortues" },
                  { icon: "🍹", label: "Ti' Punch & poisson grillé" },
                ].map(b => (
                  <span key={b.label} className="sl-badge">{b.icon} {b.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 96px" }}>

          {/* INTRO */}
          <div className="sl-section">
            <p className="sl-section-title">La commune</p>
            <h2>Le Sud Martinique<br />dans toute sa splendeur</h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(18px, 2.5vw, 22px)", lineHeight: 1.8, color: TEXT, maxWidth: 700, marginBottom: 32 }}>
              Sainte-Luce est l'une des communes les plus prisées du sud de la Martinique. Nichée entre les falaises verdoyantes et la mer des Caraïbes, elle réunit plages de sable blanc, fonds marins d'exception et douceur de vivre créole — à seulement 30 minutes de Fort-de-France.
            </p>
            <div className="sl-grid2">
              {[
                { label: "Distance de Fort-de-France", value: "30 km — 35 min en voiture" },
                { label: "Distance de l'aéroport", value: "Aimé Césaire — 25 min" },
                { label: "Plages emblématiques", value: "Gros Raisins · Bois Jolan · Anse Figuier" },
                { label: "Eau", value: "26–29°C toute l'année · visibilité 15–25 m" },
                { label: "Meilleure saison", value: "Déc – Avr (saison sèche) · Jul – Août (été)" },
                { label: "Pourquoi Sainte-Luce", value: "Calme, nature préservée, mer turquoise" },
              ].map(item => (
                <div key={item.label} className="sl-info">
                  <div className="sl-info-label">{item.label}</div>
                  <div className="sl-info-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* VILLAS */}
          <div className="sl-section">
            <p className="sl-section-title">Résidence Amaryllis</p>
            <h2>6 villas à Sainte-Luce<br />avec piscine & vue mer</h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: TEXT, maxWidth: 680, marginBottom: 32 }}>
              Toutes nos villas sont situées à Sainte-Luce, au sein de la résidence Amaryllis — en hauteur, face à la mer des Caraïbes. Chaque propriété dispose d'une piscine ou jacuzzi privatif, d'une terrasse vue mer et d'un jardin tropical.
            </p>
            <div className="sl-villa-grid">
              {villas.map(v => (
                <a key={v.id} href={`/${v.id}`} className="sl-villa-card">
                  <img src={v.photo} alt={`${v.nom} — villa à Sainte-Luce Martinique`} loading="lazy" />
                  <div className="sl-villa-card-body">
                    <h3>{v.nom}</h3>
                    <p>{v.desc}</p>
                    <div className="sl-villa-card-cta">Voir la villa →</div>
                  </div>
                </a>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <a href="/" style={{
                display: "inline-block", padding: "14px 36px",
                background: NAVY, color: IVORY, borderRadius: 10,
                textDecoration: "none", fontFamily: "'Jost', sans-serif",
                fontSize: 13, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                Voir toutes les disponibilités
              </a>
            </div>
          </div>

          {/* PLAGES */}
          <div className="sl-highlight">
            <div className="sl-highlight-head">
              <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Incontournables</p>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 3vw, 32px)", letterSpacing: "0.08em", textTransform: "uppercase", color: IVORY, margin: 0, lineHeight: 1.1 }}>
                Les plages de<br />Sainte-Luce
              </h2>
            </div>
            <div className="sl-highlight-body">
              {[
                {
                  name: "Plage du Gros Raisins",
                  desc: "La plus grande plage de Sainte-Luce. Eaux turquoise, sable fin, palmiers. Idéale pour les familles avec enfants — eau calme et peu profonde côté lagon.",
                },
                {
                  name: "Anse Chaudière",
                  desc: "Petite crique sauvage accessible en 10 minutes à pied. Snorkeling exceptionnel avec tortues marines et poissons multicolores. Arrivez tôt pour être seul.",
                },
                {
                  name: "Plage de Bois Jolan",
                  desc: "Plage longue et ventée, prisée des kitesurfeurs. Cocotiers, rouleaux réguliers, ambiance plus sauvage. À 5 km de la résidence.",
                },
                {
                  name: "Anse Figuier",
                  desc: "Plage atypique avec son écomusée tout proche. Fond marin sablonneux, eaux calmes, cadre verdoyant. Très appréciée en semaine.",
                },
              ].map(item => (
                <div key={item.name} className="sl-hl-item">
                  <h4>{item.name}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIVITÉS */}
          <div className="sl-section">
            <p className="sl-section-title">À faire</p>
            <h2>Activités à Sainte-Luce<br />&amp; alentours</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 32 }}>
              {[
                { icon: "🤿", title: "Snorkeling", desc: "Chausey, Chaudière — tortues, poissons-perroquets, coraux" },
                { icon: "🚤", title: "Excursion en mer", desc: "Catamarans au départ de Sainte-Luce — Rocher du Diamant, Sainte-Anne" },
                { icon: "🌊", title: "Surf & kitesurf", desc: "Bois Jolan — spot régulier, école locale, location de matériel" },
                { icon: "🚴", title: "Randonnée & VTT", desc: "Mornes et forêts de Sainte-Luce — circuits balisés, vue panoramique" },
                { icon: "🐢", title: "Plongée sous-marine", desc: "Sites remarquables à 5 min en bateau, visibilité jusqu'à 25 m" },
                { icon: "🏛️", title: "Écomusée de Martinique", desc: "Histoire et culture créole, à Anse Figuier, à 5 min en voiture" },
              ].map(a => (
                <div key={a.title} className="sl-info" style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{a.icon}</span>
                  <div>
                    <div className="sl-info-label">{a.title}</div>
                    <div className="sl-info-value">{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* JOURNÉE IDÉALE */}
          <div className="sl-day">
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 8px" }}>Itinéraire</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: "clamp(20px, 3vw, 28px)", letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, margin: "0 0 6px" }}>
              Une journée parfaite<br />à Sainte-Luce
            </h2>
            <div className="sl-day-steps">
              {[
                { time: "7h30", text: "Café sur la terrasse de la villa — vue sur la mer des Caraïbes au lever du soleil." },
                { time: "9h00", text: "Descente à la plage du Gros Raisins avant l'arrivée des familles. Snorkeling à Chaudière — tortues garanties." },
                { time: "12h30", text: "Déjeuner chez Mano Beach : Ti' Punch, accras de morue, poisson grillé au bois, vue sur la mer." },
                { time: "15h00", text: "Excursion en catamaran vers le Rocher du Diamant ou retour à la piscine de la villa." },
                { time: "18h00", text: "Apéro coucher de soleil sur la terrasse — le ciel vire au corail sur la mer des Caraïbes." },
                { time: "20h00", text: "Dîner au village de Sainte-Luce : La Petite Auberge ou Chez Mano en soirée, cuisine créole authentique." },
              ].map(s => (
                <div key={s.time} className="sl-day-step">
                  <div className="sl-day-time">{s.time}</div>
                  <div className="sl-day-text">{s.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RESTAURANTS */}
          <div className="sl-section">
            <p className="sl-section-title">Gastronomie</p>
            <h2>Où manger<br />à Sainte-Luce</h2>
            {[
              {
                name: "Mano Beach",
                tag: "Incontournable",
                desc: "Le spot plage numéro un à Sainte-Luce. Les pieds dans le sable, poisson du jour grillé, homard, langouste. Réservation conseillée en haute saison.",
              },
              {
                name: "La Petite Auberge",
                tag: "Créole authentique",
                desc: "Cuisine traditionnelle martiniquaise dans un cadre colonial chaleureux. Colombo de poulet, gratin de christophine, rhum agricole.",
              },
              {
                name: "Ti'Kajou",
                tag: "Vue mer",
                desc: "Bar-restaurant en surplomb de la mer. Spécialités de la mer, tapas créoles, cocktails maison. Idéal pour l'apéritif coucher de soleil.",
              },
              {
                name: "Chez Mano",
                tag: "Local",
                desc: "Adresse familiale très appréciée des locaux. Portions généreuses, prix raisonnables, accueil chaleureux. Le vrai goût de la Martinique.",
              },
            ].map(r => (
              <div key={r.name} className="sl-resto">
                <div className="sl-resto-name">
                  <span>{r.name}</span>
                  <span className="sl-resto-tag">{r.tag}</span>
                </div>
                <p>{r.desc}</p>
              </div>
            ))}
          </div>

          {/* PRATIQUE */}
          <div className="sl-section">
            <p className="sl-section-title">Infos pratiques</p>
            <h2>Venir à Sainte-Luce</h2>
            <div className="sl-grid2">
              {[
                { label: "Aéroport", value: "Aimé Césaire (FDF) — 25 min en voiture depuis Sainte-Luce" },
                { label: "Voiture", value: "Indispensable — location dès 35€/jour sur place ou à l'aéroport" },
                { label: "Taxi / transfert", value: "Taxi depuis FDF : ~50€. Service transfert privé disponible via la résidence." },
                { label: "Supermarché", value: "Leader Price et Carrefour Market à 5 min — bien approvisionnés" },
                { label: "Pharmacie & santé", value: "Pharmacie au bourg. Hôpital de Rivière-Pilote à 15 min." },
                { label: "Sécurité", value: "Commune très calme — famille et couples bienvenus" },
              ].map(item => (
                <div key={item.label} className="sl-info">
                  <div className="sl-info-label">{item.label}</div>
                  <div className="sl-info-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ALENTOURS */}
          <div className="sl-section">
            <p className="sl-section-title">Excursions depuis Sainte-Luce</p>
            <h2>Explorer le Sud<br />Martinique</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { dest: "Le Diamant", km: "12 km · 15 min", desc: "Rocher du Diamant, plage sauvage face à l'îlot, kitesurf et restaurant les pieds dans l'eau.", link: "/guide-le-diamant" },
                { dest: "Sainte-Anne", km: "18 km · 20 min", desc: "Les Salines, plus belle plage des Caraïbes, marché artisanal, catamaran vers les îlets.", link: "/guide-sainte-anne" },
                { dest: "Les Trois-Îlets", km: "22 km · 25 min", desc: "Village créole classé, musée de la Pagerie (Joséphine Bonaparte), golf, hippodrome.", link: "/guide-trois-ilets" },
                { dest: "L'Anse à l'Âne", km: "8 km · 10 min", desc: "Plage abritée, catamarans vers Fort-de-France, ambiance village, trésor discret du Sud.", link: "/guide-arlet" },
              ].map(e => (
                <a key={e.dest} href={e.link} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "18px 22px", textDecoration: "none", display: "block", transition: "box-shadow 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 500, color: NAVY }}>{e.dest}</span>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: CORAL, fontWeight: 600 }}>{e.km}</span>
                  </div>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, lineHeight: 1.65, color: MUTED, margin: 0 }}>{e.desc}</p>
                </a>
              ))}
            </div>
          </div>

          {/* CTA FINAL */}
          <div style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`,
            borderRadius: 20, padding: "52px 40px", textAlign: "center",
          }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Réservation directe</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 4vw, 40px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 18px", lineHeight: 1.1 }}>
              Séjournez à Sainte-Luce<br />dans nos villas vue mer
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: "rgba(250,245,233,0.75)", maxWidth: 480, margin: "0 auto 36px" }}>
              Piscine à débordement ou jacuzzi privatif, terrasse face à la mer des Caraïbes, jardin tropical — à partir de 120€ la nuit.
            </p>
            <a href="/" style={{
              display: "inline-block", padding: "16px 42px",
              background: CORAL, color: IVORY, borderRadius: 10,
              textDecoration: "none", fontFamily: "'Jost', sans-serif",
              fontSize: 14, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
            }}>
              Voir les disponibilités
            </a>
          </div>

        </div>

        {/* FOOTER */}
        <footer style={{ background: NAVY, padding: "40px 24px", textAlign: "center" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Amaryllis</a>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { href: "/", label: "Villas" },
              { href: "/guide-hub", label: "Explorer" },
              { href: "/guide-le-diamant", label: "Le Diamant" },
              { href: "/guide-sainte-anne", label: "Sainte-Anne" },
              { href: "/activites-sainte-luce", label: "Activités" },
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
