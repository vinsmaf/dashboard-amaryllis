// Guide Sainte-Luce — hub Explorer Martinique — /guide — v2 immersif

import SEOMeta from "./SEOMeta.jsx";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const BASE  = "https://villamaryllis.com";

const HERO_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Salines_beach.jpg/960px-Salines_beach.jpg";

// Destination guides — cards visuelles
const destinations = [
  {
    href: "/guide-sainte-anne",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Salines_beach.jpg/960px-Salines_beach.jpg",
    emoji: "🏖️",
    nom: "Sainte-Anne & Les Salines",
    accroche: "La plus belle plage des Caraïbes — arrivez avant 9h",
    distance: "20 min",
    tags: ["Plage", "Kitesurf", "Catamaran"],
    must: true,
  },
  {
    href: "/guide-arlet",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Grande_Anse_d%27_Arlet_%2847001622912%29.jpg/960px-Grande_Anse_d%27_Arlet_%2847001622912%29.jpg",
    emoji: "🐢",
    nom: "Grande Anse d'Arlet",
    accroche: "Nager avec les tortues marines — garanties tôt le matin",
    distance: "25 min",
    tags: ["Tortues", "Snorkeling", "Pêcheurs"],
    must: true,
  },
  {
    href: "/guide-le-diamant",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Diamond_Rock.jpg/960px-Diamond_Rock.jpg",
    emoji: "🗿",
    nom: "Le Diamant",
    accroche: "Plongée d'exception et coucher de soleil face au Rocher",
    distance: "15 min",
    tags: ["Plongée", "Histoire", "Coucher de soleil"],
    must: false,
  },
  {
    href: "/guide-trois-ilets",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_03.jpg/960px-Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_03.jpg",
    emoji: "⚓",
    nom: "Les Trois-Îlets",
    accroche: "Musée de la Pagerie, village créole & marina face à Fort-de-France",
    distance: "35 min",
    tags: ["Culture", "Histoire", "Plages"],
    must: false,
  },
  {
    href: "/activites-sainte-luce",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Salines_beach.jpg/960px-Salines_beach.jpg",
    emoji: "🌟",
    nom: "10 activités incontournables",
    accroche: "La sélection de vos hôtes — testée et approuvée",
    distance: "Depuis la villa",
    tags: ["Excursions", "Nature", "Culture"],
    must: false,
  },
  {
    href: "/guide-proximite",
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_03.jpg/960px-Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_03.jpg",
    emoji: "📍",
    nom: "À 15 min de la villa",
    accroche: "Plages, distillerie Trois-Rivières, sentiers tropicaux",
    distance: "< 15 min",
    tags: ["Plages", "Rhum", "Randonnée"],
    must: false,
  },
];

const whySainteuce = [
  { icon: "🌐", titre: "Au centre de tout", texte: "Diamant 15 min · Salines 20 min · Arlet 25 min · Aéroport 35 min. Vous accédez à tous les sites majeurs du sud sans jamais faire plus de 25 minutes." },
  { icon: "🏘️", titre: "Village créole authentique", texte: "Pas le chaos de Fort-de-France, pas la foule de Sainte-Anne. Des marchés locaux, des snacks créoles, une atmosphère vraie." },
  { icon: "🌊", titre: "Vos plages à vous", texte: "Corps de Garde, Anse Gros Raisin, Anse du Bourg — moins fréquentées que le reste du sud. Tranquillité garantie même en juillet-août." },
];

const faqs = [
  { q: "Combien coûte la location d'une villa à Sainte-Luce ?", a: "À partir de 110€/nuit (Mabouya, jacuzzi privatif) jusqu'à 280€/nuit (Villa Amaryllis, piscine à débordement eau salée, vue mer, jacuzzi). En réservant directement, vous évitez les frais Airbnb — jusqu'à 14% d'économie." },
  { q: "Quelle villa choisir avec piscine à débordement ?", a: "La Villa Amaryllis est notre propriété phare : piscine infinity eau salée, terrasse 100m² vue Caraïbe, jacuzzi privatif, 8 personnes. Zandoli offre une piscine privée vue mer à partir de 220€/nuit pour 5 personnes." },
  { q: "Comment réserver sans passer par Airbnb ?", a: "Directement sur villamaryllis.com — sélectionnez votre logement, choisissez vos dates, payez par carte (Stripe sécurisé). Contact direct WhatsApp avec l'hôte inclus." },
  { q: "Peut-on venir avec des animaux ?", a: "Oui, la Villa Amaryllis et la Villa Iguana acceptent les animaux (supplément 40€/séjour, max 2 animaux). Mentionnez-le à la réservation." },
  { q: "Meilleure période pour visiter la Martinique ?", a: "Décembre–avril (saison sèche, alizés, mer calme) — le meilleur mais il faut réserver 3 à 6 mois à l'avance. Juillet–août reste animé. Octobre–novembre : tarifs bas mais risque cyclonique faible." },
  { q: "Y a-t-il le WiFi dans vos villas ?", a: "Oui, toutes les propriétés disposent du WiFi Starlink haut débit inclus dans le tarif. Pas de supplément." },
];

const css = `
  .guide-hub-dest {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px;
    margin-bottom: 72px;
  }
  .guide-hub-card {
    position: relative; border-radius: 18px; overflow: hidden;
    text-decoration: none; display: block;
    box-shadow: 0 4px 20px rgba(14,59,58,0.1);
    transition: transform 0.25s, box-shadow 0.25s;
  }
  .guide-hub-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(14,59,58,0.18); }
  .guide-hub-card img { width: 100%; height: 220px; object-fit: cover; display: block; }
  .guide-hub-card .overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 30%, rgba(14,59,58,0.92) 100%);
  }
  .guide-hub-card .card-content {
    position: absolute; bottom: 0; left: 0; right: 0; padding: 20px 22px;
  }
  .guide-hub-card .card-dist {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.2em; text-transform: uppercase; color: ${CORAL};
    margin-bottom: 6px;
  }
  .guide-hub-card .card-nom {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: 19px;
    letter-spacing: 0.06em; text-transform: uppercase; color: #faf5e9;
    margin-bottom: 6px; line-height: 1.2;
  }
  .guide-hub-card .card-accroche {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15px;
    color: rgba(250,245,233,0.75); line-height: 1.45; margin-bottom: 12px;
  }
  .guide-hub-card .card-tags {
    display: flex; gap: 6px; flex-wrap: wrap;
  }
  .guide-hub-card .tag {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 500;
    letter-spacing: 0.08em; color: rgba(250,245,233,0.7);
    background: rgba(250,245,233,0.12); border: 1px solid rgba(250,245,233,0.2);
    border-radius: 100px; padding: 3px 10px;
  }
  .guide-hub-card .must-ribbon {
    position: absolute; top: 16px; left: 16px;
    background: ${CORAL}; color: #fff;
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 700;
    letter-spacing: 0.15em; text-transform: uppercase;
    padding: 5px 12px; border-radius: 100px;
  }

  .guide-why { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 72px; }
  .guide-why-item { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 16px; padding: 28px 26px; }
  .guide-why-icon { font-size: 28px; margin-bottom: 12px; }
  .guide-why-titre { font-family: 'Jost', sans-serif; font-weight: 500; font-size: 15px; color: ${NAVY}; margin-bottom: 10px; letter-spacing: 0.03em; }
  .guide-why-texte { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; line-height: 1.7; color: ${TEXT}; }

  @media (max-width: 720px) {
    .guide-hub-dest { grid-template-columns: 1fr; }
    .guide-hub-card img { height: 200px; }
    .guide-why { grid-template-columns: 1fr; }
  }
`;

export default function Guide() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
<SEOMeta title="Explorer le Sud Martinique — Guides de destination depuis Sainte-Luce | Amaryllis" description="Les Salines, les tortues d'Arlet, le Rocher du Diamant — tous à moins de 25 min de nos villas à Sainte-Luce. Guides immersifs pour explorer le Sud Martinique." canonical="/guide" image="https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Salines_beach.jpg/960px-Salines_beach.jpg" type="website" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "FAQPage",
            "mainEntity": faqs.map(f => ({
              "@type": "Question", "name": f.q,
              "acceptedAnswer": { "@type": "Answer", "text": f.a },
            })),
          },
          {
            "@type": "Article",
            "headline": "Explorer le Sud Martinique — Guide de voyage depuis Sainte-Luce",
            "description": "Les Salines, les tortues d'Arlet, la plongée au Diamant — le guide complet du sud de la Martinique depuis nos villas à Sainte-Luce.",
            "url": `${BASE}/guide`,
            "image": HERO_IMG,
            "author": { "@id": `${BASE}/#organization` },
            "publisher": { "@id": `${BASE}/#organization` },
          },
        ],
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>

        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase" }}>Amaryllis</a>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontSize: 12, letterSpacing: "0.08em", opacity: 0.7 }}>← Voir nos villas</a>
          </div>
        </header>

        {/* HERO */}
        <div style={{ position: "relative", height: "min(70vh, 500px)", overflow: "hidden" }}>
          <img src={HERO_IMG} alt="Le sud de la Martinique vu depuis la mer"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 35%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(14,59,58,0.3) 0%, rgba(14,59,58,0.85) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 32px 52px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
              <p style={{ color: CORAL, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Résidence Amaryllis · Sainte-Luce</p>
              <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(30px, 6vw, 60px)", letterSpacing: "0.05em", color: IVORY, textTransform: "uppercase", margin: "0 0 18px", lineHeight: 1.05 }}>
                Explorer<br />le Sud Martinique
              </h1>
              <p style={{ color: "rgba(250,245,233,0.85)", fontSize: "clamp(16px, 2.2vw, 19px)", maxWidth: 560, margin: 0, lineHeight: 1.65, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Les Salines. Les tortues d'Arlet. Le Rocher du Diamant. Tous à moins de 25 minutes de nos villas.
              </p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px 80px" }}>

          {/* GUIDES — cartes visuelles */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, margin: "0 0 8px" }}>À explorer</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 32, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, margin: "0 0 36px" }}>Nos guides de destination</h2>
          </div>

          <div className="guide-hub-dest">
            {destinations.map(d => (
              <a key={d.href} href={d.href} className="guide-hub-card">
                <img src={d.img} alt={d.nom} loading="lazy" />
                <div className="overlay" />
                {d.must && <div className="must-ribbon">Incontournable</div>}
                <div className="card-content">
                  <div className="card-dist">{d.emoji} · {d.distance}</div>
                  <div className="card-nom">{d.nom}</div>
                  <div className="card-accroche">{d.accroche}</div>
                  <div className="card-tags">
                    {d.tags.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* CTA CARTE INTERACTIVE */}
          <div style={{ background: "linear-gradient(135deg, #0a2e2d 0%, #1a2b4a 100%)", borderRadius: 16, padding: "28px 32px", marginBottom: 64, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div>
              <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", margin: "0 0 6px", fontFamily: "'Jost', sans-serif" }}>Nouveau</p>
              <p style={{ color: IVORY, fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 20, letterSpacing: "0.05em", margin: "0 0 6px" }}>🗺️ Carte interactive du Sud Martinique</p>
              <p style={{ color: "rgba(250,245,233,0.6)", fontSize: 13, margin: 0, fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>Filtrez par activité · Explorez les destinations sur la carte</p>
            </div>
            <a href="/explorer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: CORAL, color: "white", textDecoration: "none", padding: "12px 26px", borderRadius: 100, fontSize: 13, fontWeight: 600, fontFamily: "'Jost', sans-serif", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
              Ouvrir la carte →
            </a>
          </div>

          {/* POURQUOI SAINTE-LUCE */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, margin: "0 0 8px" }}>Votre base</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 32, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, margin: "0 0 32px" }}>Pourquoi Sainte-Luce ?</h2>
          </div>
          <div className="guide-why">
            {whySainteuce.map(w => (
              <div key={w.titre} className="guide-why-item">
                <div className="guide-why-icon">{w.icon}</div>
                <div className="guide-why-titre">{w.titre}</div>
                <div className="guide-why-texte">{w.texte}</div>
              </div>
            ))}
          </div>

          {/* INFOS MARTINIQUE */}
          <div style={{ background: "linear-gradient(135deg, #0a2e2d 0%, #0e3b3a 100%)", borderRadius: 20, padding: "40px 36px", marginBottom: 72 }}>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 26, letterSpacing: "0.08em", textTransform: "uppercase", color: IVORY, margin: "0 0 28px" }}>
              🌴 Savoir avant de partir
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {[
                { label: "Aéroport", value: "Fort-de-France (FDF) — vols directs Paris (8h), Miami (4h)" },
                { label: "Voiture", value: "Indispensable — location 40–70€/jour, réservez à l'avance" },
                { label: "Meilleure saison", value: "Déc–Avr (sec, alizés, mer calme) · Réservez 3–6 mois avant" },
                { label: "Monnaie & langue", value: "Euro (€) · Français · Créole martiniquais" },
              ].map(item => (
                <div key={item.label} style={{ background: "rgba(250,245,233,0.06)", border: "1px solid rgba(250,245,233,0.1)", borderRadius: 12, padding: "18px 20px" }}>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: CORAL, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, color: "rgba(250,245,233,0.8)", lineHeight: 1.5 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ background: NAVY, borderRadius: 20, padding: "44px 36px", textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 12 }}>Réservation directe · Sans frais</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", color: IVORY, textTransform: "uppercase", margin: "0 0 16px" }}>Nos villas à Sainte-Luce</h2>
            <p style={{ color: "rgba(250,245,233,0.65)", fontSize: 15, maxWidth: 460, margin: "0 auto 28px", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Piscine privée, vue mer, jacuzzi. À partir de 110€/nuit. Économisez jusqu'à 14% vs Airbnb.
            </p>
            <a href="/" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "15px 36px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase" }}>Voir les disponibilités</a>
          </div>

          {/* FAQ */}
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 24, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 24 }}>
            Questions fréquentes
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            {faqs.map((faq, i) => (
              <details key={i} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12 }}>
                <summary style={{ padding: "20px 24px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: NAVY, letterSpacing: "0.03em", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {faq.q}<span style={{ color: CORAL, flexShrink: 0, marginLeft: 12, fontSize: 18 }}>+</span>
                </summary>
                <p style={{ margin: 0, padding: "0 24px 20px", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, lineHeight: 1.75, color: TEXT }}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div style={{ background: NAVY, padding: "24px", textAlign: "center" }}>
          <p style={{ color: "rgba(250,245,233,0.4)", fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} Amaryllis Locations · <a href="/" style={{ color: "rgba(250,245,233,0.4)", textDecoration: "none" }}>villamaryllis.com</a>
          </p>
        </div>
      </div>
    </>
  );
}
