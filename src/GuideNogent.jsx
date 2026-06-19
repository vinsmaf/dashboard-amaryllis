// Guide Nogent-sur-Marne — /guide-nogent-sur-marne
// traf-012 : page SEO guide destination + maillage vers appartement Nogent

import SEOMeta from "./SEOMeta.jsx";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const BASE  = "https://villamaryllis.com";

const HERO_IMG = "https://villamaryllis.com/photos/nogent/01.webp";

const badges = [
  { icon: "🚆", label: "RER A → Paris 20 min" },
  { icon: "🌊", label: "Bords de Marne" },
  { icon: "🏙️", label: "Val-de-Marne" },
  { icon: "🌳", label: "Île-de-France verte" },
  { icon: "💼", label: "Idéal déplacements pro" },
];

const quartiers = [
  {
    emoji: "🚆",
    titre: "Nogent et Paris — 20 minutes, pas plus",
    contenu: [
      {
        nom: "RER A direct jusqu'au cœur de Paris",
        texte: "La gare de Nogent-sur-Marne (RER A) est à 10 minutes à pied de notre appartement. 20 minutes de trajet jusqu'à Châtelet-Les Halles, 22 minutes jusqu'à La Défense. Pas de voiture, pas de parking, pas de stress — la configuration idéale pour un séjour professionnel à Paris.",
      },
      {
        nom: "Les transports au quotidien",
        texte: "En plus du RER A, le bus 114 dessert l'ensemble du Val-de-Marne. Pour rejoindre les grandes gares parisiennes : Gare de Lyon en 25 min (RER A + changement Nation), Gare du Nord en 35 min. Orly est accessible en 45 minutes via le RER + OrlyBus. CDG en 1h15 via RER B.",
      },
      {
        nom: "Parking si nécessaire",
        texte: "Notre appartement dispose d'un parking sécurisé privatif — rare à cette distance de Paris. Si vous venez en voiture depuis la Province ou de l'étranger, c'est un confort non négligeable. A4 (Paris-Strasbourg) à 10 minutes, A86 à 5 minutes.",
      },
    ],
  },
  {
    emoji: "🌊",
    titre: "Les bords de Marne — l'autre visage de Nogent",
    contenu: [
      {
        nom: "La Marne à 5 minutes",
        texte: "Nogent-sur-Marne doit son nom à la rivière qui la longe. Les bords de Marne offrent des kilomètres de promenades, des guinguettes historiques (le Petit Robinson, Au Bord de l'Eau) et des spots de pêche au calme. Un dépaysement complet à 10 km de Paris.",
      },
      {
        nom: "La guinguette, institution francilienne",
        texte: "La tradition des guinguettes — ces restaurants en plein air au bord de l'eau — est née sur les bords de Marne. La Grenouillère, le Canotier, le Grand Pavois : côté planches en bois, sangria et plats du marché. En été, ambiance assurée le week-end.",
      },
      {
        nom: "Randonnées et vélo",
        texte: "Le GR14 longe la Marne depuis le Bois de Vincennes jusqu'à Champigny. À vélo, le canal de Champs-sur-Marne est praticable en famille. Les vélos en libre-service Vélib' sont disponibles à Nogent depuis 2023.",
      },
    ],
  },
  {
    emoji: "🌳",
    titre: "Le Bois de Vincennes — nature urbaine",
    contenu: [
      {
        nom: "Le plus grand espace vert de Paris",
        texte: "À 15 minutes en bus ou 25 minutes à pied depuis notre appartement, le Bois de Vincennes (995 hectares) est le poumon vert de l'est parisien. Lacs, parc floral, hippodrome, Château de Vincennes — une demi-journée de détente à côté de chez vous.",
      },
      {
        nom: "Le Parc floral de Paris",
        texte: "Intégré au Bois de Vincennes, le Parc floral accueille des concerts jazz en été (Paris Jazz Festival), des expositions et des aires de jeux pour les enfants. Entrée libre certains jours, spectacles gratuits sur l'herbe.",
      },
    ],
  },
  {
    emoji: "🍽️",
    titre: "Restaurants et marché",
    contenu: [
      {
        nom: "Le marché de Nogent — mercredi et samedi",
        texte: "Le marché place du Maréchal-de-Lattre-de-Tassigny (mercredi matin et samedi matin) regroupe une quarantaine de producteurs locaux : fromages d'Île-de-France, charcuterie artisanale, primeurs de saison. Idéal pour composer un dîner en appartement.",
      },
      {
        nom: "Restaurants incontournables",
        texte: "La Table des Saveurs (gastro, 2 rue des Coutures), Le Bistrot du Marché (brasserie traditionnelle), Les Saveurs de la Marne (poissons et fruits de mer). Nogent compte aussi plusieurs restaurants asiatiques tenus par la communauté chinoise installée de longue date.",
      },
      {
        nom: "Supermarchés et commerces",
        texte: "Carrefour Market à 5 min à pied, Monoprix à 8 min. Pour les produits du monde, le marché de la porte de Vincennes (Paris 12e) est à 15 minutes en bus — bonne sélection d'épices, de produits antillais et du Maghreb.",
      },
    ],
  },
];

const cssStyles = `
  .ng-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
  .ng-card { background: #fff; border: 1px solid ${SAND}; border-radius: 12px; padding: 22px 20px; }
  .ng-pi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .ng-pi-item { background: #fff; border: 1px solid ${SAND}; border-radius: 10px; padding: 16px; }
  @media (max-width: 640px) {
    .ng-grid { grid-template-columns: 1fr; }
    .ng-pi-grid { grid-template-columns: 1fr; }
  }
`;

export default function GuideNogent() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <SEOMeta
        title="Nogent-sur-Marne — Guide complet | Amaryllis Locations"
        description="Nogent-sur-Marne à 20 min de Paris : bords de Marne, guinguettes, Bois de Vincennes, marché, restaurants. Notre appartement au bord de la Marne, parking privatif, RER A direct."
        canonical="/guide-nogent-sur-marne"
        image={HERO_IMG}
        type="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Nogent-sur-Marne : guide complet pour votre séjour",
        "description": "Nogent-sur-Marne à 20 min de Paris via le RER A : bords de Marne, guinguettes, Bois de Vincennes, marché et restaurants. Guide pratique Amaryllis Locations.",
        "url": `${BASE}/guide-nogent-sur-marne`,
        "image": HERO_IMG,
        "author": { "@id": `${BASE}/#organization` },
        "publisher": { "@id": `${BASE}/#organization` },
      })}} />
      {/* FAQPage JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Comment aller de Nogent-sur-Marne à Paris ?", "acceptedAnswer": { "@type": "Answer", "text": "Par le RER A : 20 minutes jusqu'à Châtelet-Les Halles, 22 minutes jusqu'à La Défense. La gare RER de Nogent-sur-Marne est à 10 minutes à pied de notre appartement." } },
          { "@type": "Question", "name": "Y a-t-il un parking à Nogent-sur-Marne ?", "acceptedAnswer": { "@type": "Answer", "text": "Notre appartement dispose d'un parking sécurisé privatif inclus dans la location — un avantage rare à cette distance de Paris." } },
          { "@type": "Question", "name": "Que faire à Nogent-sur-Marne ?", "acceptedAnswer": { "@type": "Answer", "text": "Promenade sur les bords de Marne, guinguettes historiques, marché du samedi matin, Bois de Vincennes (15 min en bus), Château de Vincennes, Parc floral de Paris. Et à 20 min : tout Paris." } },
        ],
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>

        {/* ── HEADER ── */}
        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase" }}>Amaryllis</a>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <a href="/nogent" style={{ color: IVORY, textDecoration: "none", fontSize: 12, letterSpacing: "0.08em", opacity: 0.7 }}>Notre appartement Nogent</a>
              <a href="/" style={{ color: IVORY, textDecoration: "none", fontSize: 12, letterSpacing: "0.08em", opacity: 0.7 }}>← Accueil</a>
            </div>
          </div>
        </header>

        {/* ── HERO ── */}
        <div style={{ position: "relative", height: "min(55vw, 480px)", background: NAVY, overflow: "hidden" }}>
          <img
            src={HERO_IMG}
            alt="Appartement Nogent-sur-Marne — bords de Marne"
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }}
            fetchPriority="high"
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,20,20,0.85) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "32px 28px", maxWidth: 960, margin: "0 auto" }}>
            <p style={{ color: CORAL, fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, letterSpacing: "0.45em", textTransform: "uppercase", margin: "0 0 12px" }}>
              Île-de-France · Val-de-Marne
            </p>
            <h1 style={{ color: IVORY, fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(28px, 4vw, 52px)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px", lineHeight: 1.05 }}>
              Nogent-sur-Marne<br />
              <em style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontWeight: 400, letterSpacing: 0, textTransform: "none", color: "rgba(250,245,233,0.75)", fontSize: "0.8em" }}>
                Paris à 20 minutes, la Marne à 5
              </em>
            </h1>
            {/* Badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {badges.map(b => (
                <span key={b.label} style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "6px 14px", color: IVORY, fontSize: 12, fontFamily: "'Jost', sans-serif", fontWeight: 300, letterSpacing: "0.04em" }}>
                  {b.icon} {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── ACCROCHE ── */}
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 28px 36px" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 21, fontStyle: "italic", lineHeight: 1.75, color: NAVY, margin: 0 }}>
            Nogent-sur-Marne est l'une des adresses les plus pratiques de la première couronne parisienne : 20 minutes du centre de Paris par le RER A, bords de Marne authentiques, marché de producteurs et Bois de Vincennes à portée de vélo. Un cadre de ville à taille humaine, à deux pas de tout.
          </p>
        </div>

        {/* ── SECTIONS ── */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 28px 60px" }}>

          {quartiers.map((q, qi) => (
            <div key={qi} style={{ marginBottom: 56 }}>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(20px, 2.8vw, 28px)", letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, margin: "0 0 24px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>{q.emoji}</span>
                {q.titre}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {q.contenu.map((c, ci) => (
                  <div key={ci} className="ng-card">
                    <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: CORAL, letterSpacing: "0.04em", margin: "0 0 8px" }}>{c.nom}</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, lineHeight: 1.75, color: TEXT, margin: 0 }}>{c.texte}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ── 3 EXPÉRIENCES INÉDITES (seo-032) ── */}
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 8 }}>
            ✨ Que faire à Nogent — 3 expériences inédites
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, color: MUTED, lineHeight: 1.7, marginBottom: 24 }}>
            Ce que la plupart des touristes ne font pas — et que nos locataires adorent.
          </p>
          {[
            {
              emoji: "🚣",
              titre: "Stand-up paddle et canoë sur la Marne",
              texte: "La base nautique de Nogent (Quai du Port, 5 min à pied) propose la location de paddles, canoës et pédalos en saison (avril–septembre). Une heure sur la Marne le matin, avant que les guinguettes ouvrent, pour voir Nogent d'un autre angle. Aucune expérience requise, initiation enfants disponible. Coût : environ 15–20€/heure.",
            },
            {
              emoji: "🏰",
              titre: "Château de Vincennes — le Versailles méconnu",
              texte: "Le Château de Vincennes (XIVe siècle) est à 20 minutes en bus depuis notre appartement, à l'entrée du Bois. Moins fréquenté que Versailles, le donjon royal (le plus haut de France à 52 mètres) et la Sainte-Chapelle gothique méritent 2 heures. Idéal un dimanche matin avant les foules. Tarif plein 11€, gratuit moins de 26 ans UE.",
            },
            {
              emoji: "🎵",
              titre: "Soirée au Théâtre de Nogent",
              texte: "Le Théâtre de Nogent (ancienne salle du Cinématographe rénovée, rue du Théâtre) accueille des concerts, spectacles de stand-up et comédies musicales de qualité — dans une salle à taille humaine, sans les files d'attente parisiennes. La programmation septembre–juin est disponible sur theatre-nogent.fr. Billets dès 15€ pour les résidents du Val-de-Marne.",
            },
          ].map((item, i) => (
            <div key={i} className="ng-card" style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 15, color: CORAL, margin: "0 0 8px" }}>{item.emoji} {item.titre}</p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, lineHeight: 1.75, color: TEXT, margin: 0 }}>{item.texte}</p>
            </div>
          ))}

          {/* ── LOUER À NOGENT — 2 CONSEILS PRATIQUES (seo-033) ── */}
          <div style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 16, padding: "32px 28px", margin: "32px 0" }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: CORAL, margin: "0 0 8px" }}>Location appartement à Nogent-sur-Marne</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 20, letterSpacing: "0.06em", color: NAVY, margin: "0 0 20px" }}>2 conseils pour bien louer</h2>
            {[
              {
                num: "01",
                titre: "Réservez en direct — jusqu'à 15% d'économie",
                texte: "Les grandes plateformes (Airbnb, Booking.com) ajoutent 8 à 15% de frais de service sur le montant affiché. En réservant directement sur villamaryllis.com, vous payez le prix net sans commission. Le contact est direct avec le propriétaire (WhatsApp réponse < 2h), les conditions d'annulation sont transparentes et le paiement est sécurisé par Stripe.",
              },
              {
                num: "02",
                titre: "Séjours longue durée — tarifs négociés sur demande",
                texte: "Vous restez une semaine ou plus ? Les séjours de 7 nuits ou plus donnent droit à une remise automatique de 10%. Pour les séjours professionnels de 30 jours ou plus (missions, formations, stages), contactez-nous directement — des tarifs mensuels sont disponibles, bien en dessous du prix de location habituelle. Idéal pour les consultants en mission sur Paris.",
              },
            ].map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 20, marginBottom: i === 0 ? 20 : 0 }}>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 700, fontSize: 28, color: SAND, lineHeight: 1, minWidth: 36 }}>{c.num}</div>
                <div>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: NAVY, margin: "0 0 6px" }}>{c.titre}</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, lineHeight: 1.7, color: TEXT, margin: 0 }}>{c.texte}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── INFOS PRATIQUES ── */}
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 20 }}>
            🗓️ Infos pratiques
          </h2>
          <div className="ng-pi-grid" style={{ marginBottom: 48 }}>
            {[
              { label: "RER A → Châtelet", value: "20 min · direct" },
              { label: "RER A → La Défense", value: "22 min · direct" },
              { label: "Parking", value: "Privatif sécurisé inclus" },
              { label: "Orly", value: "45 min via RER + OrlyBus" },
              { label: "CDG", value: "1h15 via RER A + B" },
              { label: "Bois de Vincennes", value: "15 min en bus" },
              { label: "Marché", value: "Mer. et Sam. matin — place de la mairie" },
              { label: "Vélib'", value: "Stations disponibles depuis 2023" },
            ].map(item => (
              <div key={item.label} className="ng-pi-item">
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: MUTED, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 14, color: NAVY }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* ── CTA appartement ── */}
          <div style={{ background: NAVY, borderRadius: 20, padding: "44px 36px", textAlign: "center", marginBottom: 40 }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 12 }}>Notre adresse à Nogent</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", color: IVORY, textTransform: "uppercase", margin: "0 0 12px" }}>
              Appartement aux Portes de Paris
            </h2>
            <p style={{ color: "rgba(250,245,233,0.65)", fontSize: 15, maxWidth: 480, margin: "0 auto 24px", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Studio élégant, bord de Marne, jardin privé, parking sécurisé. Idéal pour les séjours professionnels ou les week-ends parisiens. À partir de 90€/nuit.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/nogent" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "14px 32px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Voir l'appartement →
              </a>
              <a href="https://wa.me/33610880772" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: "#25D366", color: "#fff", textDecoration: "none", padding: "14px 32px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                WhatsApp
              </a>
            </div>
          </div>

          {/* ── Maillage Martinique ── */}
          <div style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 16, padding: "32px 28px", marginBottom: 40 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: CORAL, margin: "0 0 16px" }}>Vous préférez le soleil ?</p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, lineHeight: 1.7, color: TEXT, margin: "0 0 20px" }}>
              Nous gérons aussi des villas avec piscine à débordement et vue mer en Martinique — à 20 minutes des plages de Sainte-Luce, des tortues d'Arlet et des Salines.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[
                { id: "amaryllis", name: "Villa Amaryllis", desc: "Piscine débordement · Vue mer · 280€/nuit" },
                { id: "mabouya",   name: "Mabouya",         desc: "Jacuzzi privatif · Romantique · 70€/nuit" },
                { id: "zandoli",   name: "Zandoli",         desc: "Piscine privée · Famille · 110€/nuit" },
              ].map(v => (
                <a key={v.id} href={`/${v.id}`} style={{ display: "flex", flexDirection: "column", background: "#fff", border: `1px solid ${SAND}`, borderRadius: 10, padding: "12px 16px", textDecoration: "none", minWidth: 180 }}>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: NAVY, marginBottom: 2 }}>{v.name}</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13, color: MUTED }}>{v.desc}</span>
                </a>
              ))}
            </div>
          </div>

          {/* ── Nav bas de page ── */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/" style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>← Toutes nos villas</a>
            <a href="/guide-hub" style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>Guides Martinique</a>
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