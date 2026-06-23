// Guide Location de voiture en Martinique — /location-voiture-martinique-pas-cher
// SEO : "location voiture Martinique pas cher", "louer voiture Martinique 2026"
// Affiliate : DiscoverCars a_aid=vinsmaf — aussi soumis au contest DiscoverCars Q2 2026

import SEOMeta from "./SEOMeta.jsx";
import LienAffilie from "./components/LienAffilie.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import NewsletterForm from "./NewsletterForm.jsx";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const TEXT  = "#2c2c2c";

const tips = [
  {
    emoji: "📅",
    titre: "Réserver à l'avance",
    corps: "C'est la règle d'or. En haute saison (juillet-août, décembre-janvier), les véhicules partent 3 à 6 semaines avant. Réserver 4 semaines à l'avance vous économise en moyenne 30 à 40 % par rapport à la réservation de dernière minute au comptoir de l'aéroport.",
    highlight: "−30 à −40 % en réservant 4 semaines avant",
  },
  {
    emoji: "🔍",
    titre: "Comparer les loueurs",
    corps: "Europcar, Sixt, Hertz, Budget et Avis sont tous présents à l'aéroport Aimé-Césaire. Les prix varient du simple au double pour le même véhicule. Utiliser un comparateur vous évite de faire le tour des comptoirs à l'arrivée — quand vous êtes fatigué du vol et pressé de rejoindre votre hébergement.",
    highlight: null,
    cta: true,
  },
  {
    emoji: "🚗",
    titre: "Choisir une voiture automatique",
    cors: "Les routes de Martinique sont étroites et les ronds-points nombreux. Une boîte automatique est fortement recommandée, surtout si vous n'avez pas l'habitude de conduire en ville. Elle coûte légèrement plus cher, mais évite bien des stress — particulièrement dans les embouteillages de Fort-de-France.",
    corps: "Les routes de Martinique sont étroites et les ronds-points nombreux. Une boîte automatique est fortement recommandée, surtout si vous n'avez pas l'habitude de conduire en ville. Elle coûte légèrement plus cher, mais évite bien des stress — particulièrement dans les embouteillages de Fort-de-France.",
    highlight: "Boîte automatique = moins de stress en ville",
  },
  {
    emoji: "🛡️",
    titre: "Prendre la couverture intégrale (SCDW)",
    corps: "Les routes de montagne, les dos-d'âne discrets et les parkings étroits font des accrochages un risque réel. La franchise de base peut atteindre 1 500 € à 2 000 €. La couverture intégrale (SCDW / Full Protection) supprime cette franchise pour environ 10 à 15 €/jour supplémentaires. Sur un séjour d'une semaine, c'est une sérénité qui vaut le prix.",
    highlight: "Franchise jusqu'à 2 000 € sans couverture intégrale",
  },
  {
    emoji: "✈️",
    titre: "Récupérer à l'aéroport",
    corps: "Les comptoirs de location sont situés directement dans le hall des arrivées de l'aéroport Aimé-Césaire (FDF). C'est pratique, mais les tarifs incluent parfois un supplément aéroport. Comparez avec les agences en ville si vous avez un transfert prévu à l'arrivée — mais la plupart du temps, l'aéroport reste la meilleure option pour la flexibilité.",
    highlight: null,
  },
  {
    emoji: "📏",
    titre: "Prendre un véhicule compact",
    corps: "Inutile de louer un SUV XXL pour la Martinique. Les petites citadines ou les compactes (Peugeot 208, Renault Clio, Toyota Yaris) passent partout et consomment moins. Les routes de campagne du Sud, notamment autour de Sainte-Luce, sont parfois très étroites. Un gabarit réduit vous évitera des manœuvres stressantes.",
    highlight: "Compact = moins cher + passe partout",
  },
  {
    emoji: "⏰",
    titre: "Éviter les heures de pointe à Fort-de-France",
    corps: "Le centre de Fort-de-France est congestoinné entre 7h-9h et 16h-18h30. Si vous devez y passer, prévoyez le matin avant 7h ou après 19h. Le reste de l'île — le Sud particulièrement — est fluide en dehors de ces créneaux. La route entre l'aéroport et Sainte-Luce (vers nos villas) ne prend que 20 minutes hors embouteillages.",
    highlight: null,
  },
  {
    emoji: "💳",
    titre: "Vérifier votre carte bancaire",
    corps: "Certaines cartes Visa Premier ou Mastercard Gold incluent une assurance location de voiture. Vérifiez les conditions avant de départ : si votre carte couvre la franchise, vous pouvez vous passer de la couverture intégrale du loueur et économiser 70 à 100 € sur une semaine. Attention : la couverture carte exclut souvent les dommages aux pneus, vitres et dessous de caisse.",
    highlight: "Carte Visa Premier/Gold = assurance incluse possible",
  },
];

const faqs = [
  {
    q: "Combien coûte une location de voiture en Martinique ?",
    r: "Comptez 35 à 60 €/jour pour une compacte en basse saison, 55 à 90 €/jour en haute saison (juillet-août, Noël-Nouvel An). Les prix varient beaucoup selon le loueur et l'avance de réservation — un comparateur comme DiscoverCars permet de trouver les meilleures offres en temps réel.",
  },
  {
    q: "Faut-il vraiment une voiture en Martinique ?",
    r: "Oui, sauf si vous ne prévoyez pas de sortir de votre hébergement. Les transports en commun (taxis collectifs « tchos-tchos ») couvrent les axes principaux mais avec des fréquences irrégulières et peu pratiques pour les plages. Une voiture est indispensable pour visiter les Salines, Arlet, le Rocher du Diamant ou les distilleries.",
  },
  {
    q: "Peut-on conduire sans permis international en Martinique ?",
    r: "Oui. La Martinique est un département français — le permis de conduire européen suffit. Les ressortissants non-européens peuvent généralement conduire avec leur permis national + un permis international (vérifiez selon votre pays).",
  },
  {
    q: "Où récupérer la voiture à l'aéroport ?",
    r: "Les comptoirs de location (Europcar, Sixt, Hertz, Budget, Avis, Jumbo Car) sont directement dans le hall des arrivées de l'aéroport Aimé-Césaire Lamentin (FDF). Pas de navette nécessaire.",
  },
  {
    q: "Quelle est la meilleure période pour louer une voiture moins cher ?",
    r: "Les basses saisons (mai-juin et septembre-octobre) offrent les meilleurs tarifs — parfois 40 % moins chers qu'en août. Évitez les semaines autour de Noël, du Jour de l'An et du Carnaval (février-mars) qui voient les prix s'envoler.",
  },
];

export default function GuideLocationVoiture() {
  return (
    <>
      <SEOMeta
        title="Location de voiture en Martinique : économiser en 2026 — Guide complet"
        description="Comment louer une voiture en Martinique au meilleur prix en 2026 : nos 8 conseils pour payer moins, quelle assurance choisir, où comparer les loueurs. Guide des hôtes locaux."
        canonical="https://villamaryllis.com/location-voiture-martinique-pas-cher"
        ogImage="https://villamaryllis.com/og/guide-voiture.jpg"
      />

      {/* ── Hero ── */}
      <div style={{ background: NAVY, minHeight: "44vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "72px 24px 56px", position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🚗</div>
        <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(250,245,233,0.5)", marginBottom: 18 }}>
          GUIDE DES HÔTES · AMARYLLIS LOCATIONS
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 6vw, 58px)", fontWeight: 300, color: IVORY, margin: "0 0 20px", lineHeight: 1.15, maxWidth: 720 }}>
          Location de voiture<br /><em style={{ color: CORAL }}>en Martinique</em>
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: "clamp(14px, 2vw, 17px)", color: "rgba(250,245,233,0.75)", maxWidth: 560, lineHeight: 1.7, margin: "0 auto 36px" }}>
          8 conseils pour payer moins en 2026 — de la réservation à la restitution.
          Guide rédigé par vos hôtes locaux, basés à Sainte-Luce depuis toujours.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 36 }}>
          {["📅 Réserver à l'avance", "🔍 Comparer les loueurs", "🛡️ Bonne assurance", "🚗 Boîte auto"].map(b => (
            <span key={b} style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: "rgba(250,245,233,0.7)", background: "rgba(250,245,233,0.08)", border: "1px solid rgba(250,245,233,0.12)", borderRadius: 20, padding: "6px 14px" }}>{b}</span>
          ))}
        </div>
        <LienAffilie partenaire="discoverCars" utmContent="guide-voiture-hero" style={{ display: "inline-flex" }}>
          Comparer les offres maintenant →
        </LienAffilie>
      </div>

      {/* ── Intro ── */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 0" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(18px, 2.5vw, 22px)", color: TEXT, lineHeight: 1.8, marginBottom: 24 }}>
          En Martinique, <strong>la voiture n'est pas un luxe — c'est une nécessité.</strong> Les plages les plus belles (Les Salines, Anse Mabouya, Grande Anse), les distilleries mythiques (Trois-Rivières, Depaz), les spots de snorkeling aux tortues (Anses d'Arlet) : aucun n'est accessible sans roues.
        </p>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 15, color: MUTED, lineHeight: 1.75, marginBottom: 0 }}>
          Mais entre un loueur et l'autre, les écarts de prix peuvent atteindre 50 % pour le même véhicule. Et les pièges (franchises élevées, réservation de dernière minute, mauvais choix de couverture) coûtent cher. Voici ce que nous conseillons à tous nos voyageurs avant leur arrivée.
        </p>
      </div>

      {/* ── 8 conseils ── */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 400, color: NAVY, marginBottom: 40 }}>
          8 conseils pour payer moins
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {tips.map((tip, i) => (
            <div key={i} style={{ borderLeft: `3px solid ${i === 1 ? CORAL : SAND}`, paddingLeft: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{tip.emoji}</span>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: NAVY, margin: 0 }}>
                  {i + 1}. {tip.titre}
                </h3>
              </div>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 14, color: TEXT, lineHeight: 1.75, margin: "0 0 12px" }}>
                {tip.corps}
              </p>
              {tip.highlight && (
                <div style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 8, padding: "8px 14px", display: "inline-block", fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 500, color: NAVY, letterSpacing: "0.04em" }}>
                  💡 {tip.highlight}
                </div>
              )}
              {tip.cta && (
                <div style={{ marginTop: 14 }}>
                  <LienAffilie partenaire="discoverCars" utmContent="guide-voiture-conseil2">
                    Comparer les loueurs en Martinique →
                  </LienAffilie>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA central ── */}
      <div style={{ background: NAVY, margin: "0 auto", maxWidth: "100%", padding: "56px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 300, color: IVORY, marginBottom: 16, lineHeight: 1.3 }}>
            Comparez tous les loueurs<br /><em style={{ color: CORAL }}>en 30 secondes</em>
          </div>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 14, color: "rgba(250,245,233,0.7)", marginBottom: 28, lineHeight: 1.7 }}>
            Europcar, Sixt, Hertz, Budget, Avis — tous les loueurs présents à l'aéroport FDF. Meilleurs prix garantis. Annulation gratuite sur la plupart des offres.
          </p>
          <LienAffilie partenaire="discoverCars" utmContent="guide-voiture-cta-central" style={{ display: "inline-flex" }}>
            Voir les offres disponibles →
          </LienAffilie>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 400, color: NAVY, marginBottom: 36 }}>
          Questions fréquentes
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${SAND}`, paddingBottom: 24 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 500, color: NAVY, marginBottom: 10 }}>
                {faq.q}
              </h3>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 14, color: TEXT, lineHeight: 1.75, margin: 0 }}>
                {faq.r}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Encart hôtes ── */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 56px" }}>
        <div style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 16, padding: "32px 28px" }}>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: MUTED, marginBottom: 12 }}>
            LE CONSEIL DE VOS HÔTES
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, color: NAVY, lineHeight: 1.7, marginBottom: 16 }}>
            "Nous recommandons systématiquement à nos voyageurs de réserver leur voiture en même temps que leur logement. C'est le moyen le plus simple d'économiser 30 à 40 % — et d'éviter de se retrouver sans voiture à l'aéroport en août."
          </p>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: MUTED, margin: "0 0 20px" }}>
            — L'équipe Amaryllis Locations · Sainte-Luce, Martinique
          </p>
          <LienAffilie partenaire="discoverCars" utmContent="guide-voiture-encart-hotes">
            Comparer les offres de location →
          </LienAffilie>
        </div>
      </div>

      {/* ── Maillage interne ── */}
      <div style={{ background: CREAM, padding: "40px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: MUTED, marginBottom: 20 }}>
            PENDANT VOTRE SÉJOUR
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {[
              ["🏖️ Anses d'Arlet", "/guide-arlet"],
              ["🗿 Le Diamant", "/guide-le-diamant"],
              ["🌊 Plages de Sainte-Anne", "/guide-sainte-anne"],
              ["🌿 Distilleries", "/guide-distilleries-martinique"],
              ["🤿 Plongée", "/guide-plongee-martinique"],
              ["🗺️ Tout explorer", "/guide-hub"],
            ].map(([label, href]) => (
              <a key={href} href={href} style={{ display: "block", background: "#fff", border: `1px solid ${SAND}`, borderRadius: 10, padding: "12px 16px", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 13, color: NAVY, fontWeight: 400, transition: "border-color 0.2s" }}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Nos logements ── */}
      <MaillageCluster
        titre="Vos villas à Sainte-Luce"
        intro="Location de voiture réservée — maintenant choisissez votre logement. Nos 6 biens en Martinique, à partir de 70 €/nuit."
        biens={["amaryllis", "zandoli", "geko", "mabouya"]}
      />

      {/* ── Newsletter ── */}
      <NewsletterForm context="guide-voiture" />

      {/* ── Footer nav ── */}
      <div style={{ background: NAVY, padding: "32px 24px", textAlign: "center" }}>
        <a href="/" style={{ fontFamily: "'Jost', sans-serif", fontSize: 12, color: "rgba(250,245,233,0.5)", textDecoration: "none", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          ← Retour à l'accueil
        </a>
      </div>
    </>
  );
}
