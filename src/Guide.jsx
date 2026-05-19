// Guide Sainte-Luce Martinique — page SEO /guide

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";

const sections = [
  {
    emoji: "🏖️",
    titre: "Les plus belles plages de Sainte-Luce",
    contenu: [
      {
        nom: "Anse Corps de Garde",
        texte: "La plage emblématique de Sainte-Luce : un croissant de sable blond bordé de cocotiers, eaux turquoise calmes, idéal pour les familles. Transats, snack-bars et vue directe sur les îlets. À 7 min de la résidence Amaryllis.",
      },
      {
        nom: "Anse Gros Raisin",
        texte: "Plus sauvage et moins fréquentée, cette anse offre une eau cristalline parfaite pour le snorkeling. Accessoirement l'une des plus belles plages du sud Martinique, nichée dans la végétation tropicale.",
      },
      {
        nom: "Grande Anse d'Arlet",
        texte: "À 20 min en voiture, ce village de pêcheurs est l'un des spots les plus photographiés de l'île. Église en bord de mer, kayak, snorkeling avec des tortues — incontournable.",
      },
    ],
  },
  {
    emoji: "🍽️",
    titre: "Restaurants & bonnes adresses à Sainte-Luce",
    contenu: [
      {
        nom: "Le Ti' Sable",
        texte: "Restaurant de poisson et de fruits de mer les pieds dans le sable, face à la plage de Corps de Garde. Ambiance créole authentique, langouste grillée et accras mémorables.",
      },
      {
        nom: "Le Petibonum",
        texte: "Institution locale, réputé pour ses rhums arrangés et son poisson du jour. Vue imprenable sur la Caraïbe, terrasse en bois sous les cocotiers. Réservation conseillée.",
      },
      {
        nom: "Snack Chez Josephine",
        texte: "L'adresse locale par excellence pour un déjeuner créole copieux à petit prix — colombo de poulet, accras, boudin et jus de fruits frais. Fréquenté par les habitants, gage de qualité.",
      },
      {
        nom: "La Dunette — Sainte-Anne",
        texte: "À 15 min, ce restaurant en hauteur offre une des plus belles vues de la Martinique sur les îlets du Sud. Menu gastronomique caribéen raffiné pour les soirées spéciales.",
      },
    ],
  },
  {
    emoji: "🤿",
    titre: "Activités & excursions depuis Sainte-Luce",
    contenu: [
      {
        nom: "Plongée & snorkeling",
        texte: "Le sud de la Martinique est l'un des meilleurs spots de plongée des Antilles. Le rocher du Diamant (à 15 min) offre des plongées spectaculaires. Plusieurs clubs de plongée opèrent depuis Corps de Garde.",
      },
      {
        nom: "Visite des distilleries",
        texte: "La route des rhums passe par le sud : distillerie Trois-Rivières (Sainte-Luce), Simon et Depaz à proximité. Dégustations gratuites, visite des chais, panoramas sur les champs de canne.",
      },
      {
        nom: "Kayak & paddle",
        texte: "Location à la plage de Corps de Garde pour rejoindre les îlets voisins à la pagaie — un moment magique au lever du soleil. Comptez 15€/heure environ.",
      },
      {
        nom: "Randonnée & Nature",
        texte: "Le sentier des crêtes entre Sainte-Luce et Rivière-Pilote offre des vues à 360°. La Réserve Naturelle de la Caravelle (1h de route) et la Montagne Pelée valent le détour pour les amateurs de trail.",
      },
      {
        nom: "Catamaran dans les îlets",
        texte: "Excursion journée au départ de la marina de la Pointe du Bout ou du Marin. Snorkeling, déjeuner barbecue à bord, mouillage dans les baies préservées. Expérience incontournable en Martinique.",
      },
    ],
  },
  {
    emoji: "🚗",
    titre: "Pratique : se déplacer depuis Sainte-Luce",
    contenu: [
      {
        nom: "Location de voiture",
        texte: "Indispensable pour explorer l'île librement. Plusieurs agences à l'aéroport Aimé Césaire (Fort-de-France) et dans les villages. Budget : 40–70€/jour. Réserver à l'avance en haute saison (déc–avril).",
      },
      {
        nom: "Distances clés",
        texte: "Fort-de-France : 30 min · Le Diamant : 15 min · Les Anses d'Arlet : 20 min · Sainte-Anne : 20 min · Marin (marina) : 15 min · Aéroport : 35 min.",
      },
      {
        nom: "Scooter & vélo",
        texte: "Pour les courts trajets, location de scooters disponible à Corps de Garde. Idéal pour rejoindre les plages alentour sans chercher à se garer.",
      },
    ],
  },
  {
    emoji: "🌤️",
    titre: "Quelle période pour visiter Sainte-Luce ?",
    contenu: [
      {
        nom: "Haute saison (décembre – avril)",
        texte: "La saison sèche — le Carême. Temps ensoleillé, alizés réguliers, mer calme. Idéal pour les plages et la plongée. Réservez vos villas 3 à 6 mois à l'avance, les logements partent vite.",
      },
      {
        nom: "Basse saison (juin – novembre)",
        texte: "Saison des pluies — averses courtes et intenses, végétation luxuriante. Températures très douces. Moins de touristes, tarifs nettement plus bas. Juillet–août reste animé malgré tout.",
      },
      {
        nom: "Octobre – novembre",
        texte: "Saison cyclonique théorique : risque faible mais réel. Certains logements proposent des tarifs attractifs. La Martinique reste belle mais vérifiez les conditions météo.",
      },
    ],
  },
  {
    emoji: "🏡",
    titre: "Pourquoi louer à Sainte-Luce plutôt qu'ailleurs ?",
    contenu: [
      {
        nom: "Position idéale dans le sud",
        texte: "Sainte-Luce est à équidistance des plus beaux sites du sud : Sainte-Anne, le Diamant, les Anses d'Arlet. Vous accédez à tout sans jamais faire plus de 25 minutes de route.",
      },
      {
        nom: "Village vivant, sans le chaos touristique",
        texte: "Contrairement à Fort-de-France ou Sainte-Anne en haute saison, Sainte-Luce conserve une atmosphère de village créole authentique avec ses marchés, ses snacks locaux et ses habitants chaleureux.",
      },
      {
        nom: "Plages au calme",
        texte: "Les plages de Sainte-Luce sont moins fréquentées que celles de Sainte-Anne. On y trouve encore des coins tranquilles même en juillet-août.",
      },
    ],
  },
];

const faqs = [
  {
    q: "Combien coûte la location d'une villa à Sainte-Luce Martinique ?",
    a: "Nos villas à Sainte-Luce sont disponibles à partir de 110€/nuit (studio avec jacuzzi privatif) jusqu'à 280€/nuit pour la Villa Amaryllis avec piscine à débordement et vue mer. En réservant directement sur notre site, vous évitez les frais de service Airbnb (jusqu'à 14% du prix).",
  },
  {
    q: "Quelle villa choisir avec piscine à débordement en Martinique ?",
    a: "La Villa Amaryllis est notre propriété phare : piscine à débordement eau salée, terrasse de 100m² face à la Caraïbe, jacuzzi privatif. Pour un budget plus accessible, Zandoli dispose d'une piscine privée avec vue mer à 220€/nuit.",
  },
  {
    q: "Comment réserver une villa en Martinique sans passer par Airbnb ?",
    a: "Directement sur villamaryllis.com ! Sélectionnez votre logement, choisissez vos dates et payez de façon sécurisée par carte bancaire (Stripe). Vous économisez les frais de service Airbnb et vous avez un contact direct avec l'hôte.",
  },
  {
    q: "Peut-on venir avec des animaux dans vos villas ?",
    a: "Oui, certaines de nos propriétés acceptent les animaux de compagnie (Villa Amaryllis, Villa Iguana). Mentionnez-le lors de votre réservation pour que nous puissions tout préparer.",
  },
  {
    q: "Y a-t-il un aéroport proche de Sainte-Luce ?",
    a: "L'aéroport Aimé Césaire de Fort-de-France (Lamentin) est à 35 minutes de Sainte-Luce. Location de voiture recommandée à l'arrivée pour explorer librement le sud de l'île.",
  },
  {
    q: "Vos logements sont-ils climatisés ?",
    a: "Oui, toutes nos villas et appartements sont climatisés et disposent du WiFi Starlink haut débit. La plupart bénéficient également d'une ventilation naturelle grâce aux alizés.",
  },
];

export default function Guide() {
  return (
    <>
      {/* JSON-LD FAQ */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "FAQPage",
            "mainEntity": faqs.map(f => ({
              "@type": "Question",
              "name": f.q,
              "acceptedAnswer": { "@type": "Answer", "text": f.a },
            })),
          },
          {
            "@type": "Article",
            "@id": "https://villamaryllis.com/guide",
            "headline": "Guide Sainte-Luce Martinique : plages, restaurants et activités",
            "description": "Tout ce qu'il faut savoir pour visiter Sainte-Luce en Martinique : les meilleures plages, restaurants créoles, activités et conseils pratiques.",
            "url": "https://villamaryllis.com/guide",
            "image": "https://villamaryllis.com/photos/amaryllis/01.webp",
            "author": { "@id": "https://villamaryllis.com/#organization" },
            "publisher": { "@id": "https://villamaryllis.com/#organization" },
          },
        ],
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>

        {/* Header nav */}
        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Amaryllis
            </a>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontSize: 13, letterSpacing: "0.08em", opacity: 0.7 }}>
              ← Voir nos villas
            </a>
          </div>
        </header>

        {/* Hero */}
        <div style={{ background: NAVY, padding: "64px 24px 48px", textAlign: "center" }}>
          <p style={{ color: CORAL, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 16 }}>Guide de voyage</p>
          <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(28px, 5vw, 52px)", letterSpacing: "0.05em", color: IVORY, textTransform: "uppercase", margin: "0 0 20px" }}>
            Sainte-Luce, Martinique
          </h1>
          <p style={{ color: "rgba(250,245,233,0.7)", fontSize: 17, maxWidth: 600, margin: "0 auto", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Plages, restaurants, activités et conseils pratiques pour profiter pleinement de cette perle du sud martiniquais.
          </p>
        </div>

        {/* Contenu */}
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>

          {sections.map((section, si) => (
            <div key={si} style={{ marginBottom: 64 }}>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 24, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
                <span>{section.emoji}</span>
                <span>{section.titre}</span>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {section.contenu.map((item, ii) => (
                  <div key={ii} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 10, padding: "24px 28px" }}>
                    <h3 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 15, color: NAVY, margin: "0 0 10px", letterSpacing: "0.04em" }}>
                      {item.nom}
                    </h3>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, lineHeight: 1.75, color: TEXT, margin: 0 }}>
                      {item.texte}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* CTA villas */}
          <div style={{ background: NAVY, borderRadius: 16, padding: "40px 32px", textAlign: "center", marginBottom: 64 }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 12 }}>Séjour en Martinique</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", color: IVORY, textTransform: "uppercase", margin: "0 0 16px" }}>
              Loger à Sainte-Luce
            </h2>
            <p style={{ color: "rgba(250,245,233,0.65)", fontSize: 15, maxWidth: 500, margin: "0 auto 28px", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Villas avec piscine à débordement, vue mer et jacuzzi privatif. Réservez directement sans frais de service.
            </p>
            <a href="/" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "14px 32px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Voir toutes les villas
            </a>
          </div>

          {/* Guides voisins */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 64 }}>
            <a href="/guide-le-diamant" style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "24px 28px", textDecoration: "none", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🗿</div>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: NAVY, marginBottom: 6 }}>Guide Le Diamant</div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, color: TEXT, opacity: 0.8 }}>Rocher mythique, plongée, plages · 15 min</div>
            </a>
            <a href="/guide-sainte-anne" style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "24px 28px", textDecoration: "none", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏖️</div>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: NAVY, marginBottom: 6 }}>Guide Sainte-Anne</div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, color: TEXT, opacity: 0.8 }}>Les Salines, kitesurf, catamaran · 20 min</div>
            </a>
            <a href="/activites-sainte-luce" style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "24px 28px", textDecoration: "none", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🌟</div>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: NAVY, marginBottom: 6 }}>10 activités incontournables</div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, color: TEXT, opacity: 0.8 }}>Sélection de vos hôtes</div>
            </a>
            <a href="/guide-proximite" style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "24px 28px", textDecoration: "none", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📍</div>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: NAVY, marginBottom: 6 }}>À proximité de la villa</div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, color: TEXT, opacity: 0.8 }}>Plages, forêt, distillerie · &lt; 15 min</div>
            </a>
            <a href="/guide-arlet" style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "24px 28px", textDecoration: "none", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🐢</div>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: NAVY, marginBottom: 6 }}>Guide Grande Anse d'Arlet</div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, color: TEXT, opacity: 0.8 }}>Tortues, snorkeling, village de pêcheurs · 25 min</div>
            </a>
          </div>

          {/* FAQ */}
          <div>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 24, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 28 }}>
              ❓ Questions fréquentes
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {faqs.map((faq, i) => (
                <details key={i} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 10, padding: "0" }}>
                  <summary style={{ padding: "20px 24px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 15, color: NAVY, letterSpacing: "0.03em", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {faq.q}
                    <span style={{ color: CORAL, flexShrink: 0, marginLeft: 12 }}>+</span>
                  </summary>
                  <p style={{ margin: 0, padding: "0 24px 20px", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, lineHeight: 1.75, color: TEXT }}>
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: NAVY, padding: "24px", textAlign: "center" }}>
          <p style={{ color: "rgba(250,245,233,0.4)", fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} Amaryllis Locations · <a href="/" style={{ color: "rgba(250,245,233,0.4)", textDecoration: "none" }}>villamaryllis.com</a>
          </p>
        </div>
      </div>
    </>
  );
}
