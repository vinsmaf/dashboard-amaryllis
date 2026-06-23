// Guide Sainte-Luce sous la pluie — /guide-sainte-luce-jour-de-pluie

import SEOMeta from "./SEOMeta.jsx";
import BridgeVilla from "./components/BridgeVilla.jsx";
import ReadingProgressBar from "./components/ReadingProgressBar.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import NewsletterForm from "./NewsletterForm.jsx";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8e0d0";
const MUTED = "#8a8070";

const css = `
  .plui-section { margin-bottom: 56px; }
  .plui-label {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 300;
    letter-spacing: 0.32em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 10px;
  }
  .plui-section h2 {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: clamp(26px, 4vw, 38px);
    letter-spacing: 0.06em; text-transform: uppercase; color: ${NAVY}; margin: 0 0 24px; line-height: 1.1;
  }
  .plui-body {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(17px, 2.2vw, 20px);
    line-height: 1.8; color: ${TEXT}; max-width: 680px; margin-bottom: 28px;
  }
  .plui-card {
    background: #fff; border: 1px solid ${SAND}; border-radius: 14px;
    padding: 26px 30px; margin-bottom: 14px;
  }
  .plui-card h3 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 15px;
    color: ${NAVY}; margin: 0 0 10px; letter-spacing: 0.04em;
  }
  .plui-card p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: ${TEXT}; margin: 0;
  }
  .plui-card-meta {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase; color: ${CORAL};
    margin-bottom: 8px;
  }
  .plui-highlight {
    background: linear-gradient(135deg, #0a2e2d 0%, ${NAVY} 60%, #163f3e 100%);
    border: 1px solid rgba(196,114,84,0.3); border-radius: 20px;
    padding: 40px 44px; margin-bottom: 56px;
  }
  .plui-highlight h2 {
    font-family: 'Jost', sans-serif; font-weight: 200; font-size: clamp(22px, 3vw, 32px);
    letter-spacing: 0.08em; text-transform: uppercase; color: ${IVORY}; margin: 0 0 28px; line-height: 1.1;
  }
  .plui-hl-item {
    background: rgba(250,245,233,0.05); border: 1px solid rgba(250,245,233,0.08);
    border-radius: 12px; padding: 22px 26px; margin-bottom: 12px;
  }
  .plui-hl-item:last-child { margin-bottom: 0; }
  .plui-hl-item h4 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 12px;
    color: ${CORAL}; margin: 0 0 8px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .plui-hl-item p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: rgba(250,245,233,0.82); margin: 0;
  }
  .plui-faq { margin-bottom: 56px; }
  .plui-faq-item {
    border-bottom: 1px solid ${SAND}; padding: 22px 0;
  }
  .plui-faq-item:first-child { border-top: 1px solid ${SAND}; }
  .plui-faq-q {
    font-family: 'Jost', sans-serif; font-weight: 400; font-size: 15px;
    color: ${NAVY}; margin: 0 0 10px; letter-spacing: 0.02em;
  }
  .plui-faq-a {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: ${MUTED}; margin: 0;
  }
  .plui-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 48px; }
  .plui-info { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 20px 22px; }
  .plui-info-label {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.25em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 6px;
  }
  .plui-info-value {
    font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 400;
    color: ${NAVY}; line-height: 1.5;
  }
  @media (max-width: 640px) {
    .plui-highlight { padding: 24px 20px; }
    .plui-grid2 { grid-template-columns: 1fr; }
    .plui-card { padding: 20px 22px; }
  }
`;

const BIEN_NAMES = {
  amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko",
  mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana",
  nogent: "Appartement Nogent-sur-Marne"
};

export default function GuideSainteLucePluie() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta
        title="Sainte-Luce sous la pluie — Que faire ? Activités couvertes 2026"
        description="Un jour de pluie à Sainte-Luce, Martinique ? Distilleries, musées, spas, marchés couverts : notre guide des meilleures activités à l'abri, par vos hôtes sur place."
        canonical="/guide-sainte-luce-jour-de-pluie"
        type="article"
      />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>
        <ReadingProgressBar ctaHref="/" />

        {/* HERO */}
        <div style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`,
          padding: "80px 24px 64px",
        }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <a href="/guide-hub" style={{
              color: "rgba(250,245,233,0.55)", textDecoration: "none",
              fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em",
              display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32,
            }}>← Tous les guides</a>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", margin: "0 0 16px" }}>Guide pratique · Sainte-Luce</p>
            <h1 style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 200,
              fontSize: "clamp(32px, 6vw, 58px)", letterSpacing: "0.06em",
              textTransform: "uppercase", color: IVORY, margin: "0 0 20px", lineHeight: 1.05,
            }}>
              Que faire à<br />Sainte-Luce<br />sous la pluie ?
            </h1>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(18px, 2.5vw, 22px)", lineHeight: 1.8,
              color: "rgba(250,245,233,0.75)", maxWidth: 580,
            }}>
              Les averses tropicales à Sainte-Luce sont brèves et intenses — 2 à 3 heures au maximum, souvent le matin. Après, le ciel est d'un bleu parfait. En attendant, voici nos adresses préférées à l'abri.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 96px" }}>

          {/* INTRO */}
          <div className="plui-section">
            <p className="plui-label">La bonne nouvelle</p>
            <h2>La pluie à Sainte-Luce<br />ça ne dure jamais longtemps</h2>
            <p className="plui-body">
              Contrairement aux idées reçues, la Martinique ne subit pas de longues périodes pluvieuses continues. En saison sèche (décembre à avril), les averses sont rares. En saison humide (juin à octobre), elles surviennent le matin ou en fin d'après-midi — mais elles passent vite, souvent en moins de 2 heures.
            </p>
            <p className="plui-body">
              Si la pluie s'installe malgré tout, pas de panique : l'île regorge d'activités couvertes, culturelles et gourmandes à moins de 20 minutes de Sainte-Luce. Ce guide, rédigé par vos hôtes sur place, vous donne les meilleures options.
            </p>
            <div className="plui-grid2">
              {[
                { label: "Durée moyenne d'une averse", value: "2 à 3 heures · souvent le matin" },
                { label: "Saison la plus pluvieuse", value: "Juillet – Octobre (hivernage)" },
                { label: "Distillerie la plus proche", value: "Trois-Rivières · 5 min en voiture" },
                { label: "Supermarché couvert", value: "Carrefour Rivière-Pilote · 10 min" },
              ].map(i => (
                <div key={i.label} className="plui-info">
                  <div className="plui-info-label">{i.label}</div>
                  <div className="plui-info-value">{i.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* DISTILLERIES */}
          <div className="plui-section">
            <p className="plui-label">Option n°1</p>
            <h2>Distilleries<br />&amp; rhum agricole</h2>
            <p className="plui-body">
              C'est l'activité idéale quand le ciel se couvre : les distilleries sont couvertes, climatisées, et elles vous occupent pour 2 à 3 heures facilement entre la visite et la dégustation.
            </p>

            <div className="plui-card">
              <div className="plui-card-meta">5 min · Sainte-Luce</div>
              <h3>Distillerie Trois-Rivières</h3>
              <p>La plus accessible depuis nos villas. Visite libre ou guidée du moulin à canne, des alambics en cuivre et des chais de vieillissement. Boutique excellente avec des millésimes rares et des rhums épicés. Dégustation incluse dans la visite guidée. Ouvert du lundi au samedi.</p>
            </div>

            <div className="plui-card">
              <div className="plui-card-meta">25 min · Le François</div>
              <h3>Distillerie Depaz (Saint-Pierre)</h3>
              <p>Nichée au pied de la Montagne Pelée, Depaz est la distillerie la plus spectaculaire de l'île. Le domaine colonial (château, jardin) mérite à lui seul le déplacement. Une demi-journée minimum. À combiner avec une visite de Saint-Pierre, la "Pompéi des Caraïbes".</p>
            </div>

            <div className="plui-card">
              <div className="plui-card-meta">15 min · Le Diamant</div>
              <h3>Habitation Clément (Le François)</h3>
              <p>Domaine classé, musée d'art contemporain caribéen, galeries couvertes, vaste parc botanique. Même sous la pluie, le musée intérieur vaut largement la visite. Rhums Clément en dégustation, épicerie fine créole.</p>
            </div>
          </div>

          {/* MUSÉES */}
          <div className="plui-highlight">
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Culture & patrimoine</p>
            <h2>Musées et lieux<br />historiques</h2>
            <div className="plui-hl-item">
              <h4>Musée de la Pagerie — Les Trois-Îlets (25 min)</h4>
              <p>Lieu de naissance de Joséphine de Beauharnais, future impératrice des Français. Le musée présente portraits, lettres et souvenirs de celle qui est née ici en 1763. Cadre plantation préservé, visite couverte. Comptez 1h30 sur place.</p>
            </div>
            <div className="plui-hl-item">
              <h4>Savane des Esclaves — Le Diamant (15 min)</h4>
              <p>Reconstitution d'un village esclave martiniquais du XVIIIe siècle, créée par Gilbert Larose sur ses propres terres. Visite guidée uniquement — passionnante et profondément humaine. Musée vivant, tchabia (case traditionnelle), jardin d'essences. Incontournable et souvent méconnu.</p>
            </div>
            <div className="plui-hl-item">
              <h4>Écomusée de Martinique — Anse Figuier (5 min)</h4>
              <p>À 5 minutes de nos villas, ce musée retrace l'histoire naturelle et humaine de la Martinique : collections amérindiennes, faune, flore, agriculture créole. Idéal en famille, entrée abordable, salles climatisées.</p>
            </div>
            <div className="plui-hl-item">
              <h4>Musée du Rhum — Sainte-Marie (45 min)</h4>
              <p>Pour les amateurs du terroir. Retrace l'histoire du rhum agricole martiniquais avec collections d'alambics anciens, archives, cartes. Boutique au meilleur prix de l'île. À combiner avec une visite au nord si le soleil revient.</p>
            </div>
          </div>

          {/* BIEN-ÊTRE */}
          <div className="plui-section">
            <p className="plui-label">Option n°3</p>
            <h2>Bien-être,<br />soins &amp; massages créoles</h2>
            <p className="plui-body">
              Un jour de pluie est le moment parfait pour s'offrir un soin ssslocal. La Martinique possède une vraie tradition de soins aux huiles essentielles tropicales, au cacao, à la canne à sucre.
            </p>

            <div className="plui-card">
              <div className="plui-card-meta">Sainte-Luce &amp; alentours</div>
              <h3>Soins créoles &amp; massages traditionnels</h3>
              <p>Plusieurs instituts à Sainte-Luce et Rivière-Pilote proposent des soins corps aux huiles de coco, ylang-ylang et raisinier. Demandez-nous nos adresses du moment — nos recommandations changent selon la saison et les nouvelles enseignes.</p>
            </div>

            <div className="plui-card">
              <div className="plui-card-meta">Trois-Îlets · 25 min</div>
              <h3>Spas des grands hôtels</h3>
              <p>Les hôtels Bakoua et Karibéa aux Trois-Îlets ouvrent leurs spas aux non-résidents. Bains aux huiles végétales, enveloppements au cacao, soins visage. Réservation obligatoire à l'avance. Cadre luxueux, piscine intérieure.</p>
            </div>

            <div className="plui-card">
              <div className="plui-card-meta">Sur place · Villa Amaryllis</div>
              <h3>Piscine chauffée &amp; terrasse couverte</h3>
              <p>Ne sous-estimez pas l'option "rester à la villa". La piscine chauffée reste accessible par tous les temps, la terrasse couverte vous protège de la pluie, et l'ambiance tropicale sous la pluie chaude a son charme. Avec un ti-punch préparé maison, c'est presque mieux.</p>
            </div>
          </div>

          {/* SHOPPING */}
          <div className="plui-section">
            <p className="plui-label">Option n°4</p>
            <h2>Shopping &amp; marchés<br />couverts</h2>
            <p className="plui-body">
              Les marchés couverts de la région sont des destinations à part entière : épices, rhum arrangé artisanal, vannerie, broderie, bijoux en calebasse. Une heure de marché sous la pluie = les meilleurs souvenirs du voyage.
            </p>

            <div className="plui-card">
              <div className="plui-card-meta">10 min · Rivière-Pilote</div>
              <h3>Marché couvert de Rivière-Pilote</h3>
              <p>Le marché couvert de Rivière-Pilote est l'un des plus authentiques du Sud. Étals de fruits exotiques, légumes pays (christophine, dachine, ti-nain), épices locales, rhums arrangés maison. Samedi matin = jour de marché en plein régime. Entrée entièrement couverte.</p>
            </div>

            <div className="plui-card">
              <div className="plui-card-meta">15 min · Sainte-Anne</div>
              <h3>Boutiques artisanales du bourg</h3>
              <p>Sainte-Anne concentre une belle offre d'artisanat créole : bijoux en coquillage et calebasse, madras, statuettes en bois flotté. Les boutiques du bourg sont couvertes et accessibles à pied depuis le parking central. Certains artisans travaillent sur place — fascinant à regarder.</p>
            </div>

            <div className="plui-card">
              <div className="plui-card-meta">10 min · Rivière-Pilote</div>
              <h3>Carrefour Rivière-Pilote</h3>
              <p>L'indispensable sous la pluie. Tout sous un toit : supermarché complet, boulangerie, épicerie fine Martinique, cave à rhum, rayon pharmacie/parapharmacie, espace beauté. Idéal pour faire le plein de provisions tropicales à ramener. Parking couvert, galerie commerciale.</p>
            </div>
          </div>

          {/* FAQ */}
          <div className="plui-section">
            <p className="plui-label">Vos questions</p>
            <h2>FAQ · Pluie<br />en Martinique</h2>
            <div className="plui-faq">
              {[
                {
                  q: "Peut-il pleuvoir toute la journée à Sainte-Luce ?",
                  a: "C'est possible mais rare, surtout en saison sèche (décembre-avril). En hivernage (juillet-octobre), des épisodes de 6 à 8 heures peuvent survenir. Dans ce cas, les distilleries et musées vous occupent facilement une demi-journée, et les après-midis pluvieux sont souvent suivis de soirées magnifiques.",
                },
                {
                  q: "Que faire si la pluie dure 3 jours de suite ?",
                  a: "C'est le signe d'un épisode météo marqué (parfois lié à une onde tropicale). Notre conseil : une journée distillerie + musée, une journée shopping + gastronomie locale (restaurants de la côte restent ouverts), une journée spa et sieste tropicale. La villa avec piscine chauffée et terrasse couverte est votre refuge — c'est pour ça qu'on la chauffe.",
                },
                {
                  q: "Les activités nautiques sont-elles annulées sous la pluie ?",
                  a: "Pas nécessairement. Les sorties en mer sont annulées si la mer est mauvaise (pas à cause de la pluie elle-même), mais le snorkeling et la plongée sous la pluie sont une expérience en soi — l'eau est à 27°C et la visibilité reste bonne. Les opérateurs locaux décident au matin selon les bulletins météo marine.",
                },
                {
                  q: "Y a-t-il un cinéma près de Sainte-Luce ?",
                  a: "Le cinéma le plus proche est à Rivière-Pilote ou Fort-de-France (35 min). Les films sont généralement en version française. Une bonne option pour une soirée pluvieuse prolongée.",
                },
              ].map(faq => (
                <div key={faq.q} className="plui-faq-item">
                  <p className="plui-faq-q">{faq.q}</p>
                  <p className="plui-faq-a">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <BridgeVilla
            villaId="amaryllis"
            lieu="Sainte-Luce"
            tempsRoute="sur place"
            copy="Même sous la pluie, Sainte-Luce a tout ce qu'il faut. La Villa Amaryllis avec piscine chauffée et terrasse couverte — votre refuge tropical."
          />

          <div style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`,
            borderRadius: 20, padding: "52px 40px", textAlign: "center",
          }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Réservation directe</p>
            <h2 style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 200,
              fontSize: "clamp(24px, 4vw, 38px)", letterSpacing: "0.06em",
              textTransform: "uppercase", color: IVORY, margin: "0 0 18px", lineHeight: 1.1,
            }}>
              Pluie ou soleil —<br />Sainte-Luce reste magnifique
            </h2>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18,
              lineHeight: 1.8, color: "rgba(250,245,233,0.75)",
              maxWidth: 480, margin: "0 auto 36px",
            }}>
              Réservez en direct, sans frais d'intermédiaire. Vos hôtes vous conseillent en temps réel sur les meilleures activités selon la météo du jour.
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

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-pluie-sainte-luce" />
        </div>

        <footer style={{ background: NAVY, padding: "40px 24px", textAlign: "center" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Amaryllis</a>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { href: "/", label: "Villas" },
              { href: "/guide-hub", label: "Explorer" },
              { href: "/sainte-luce-martinique", label: "Sainte-Luce" },
              { href: "/guide-le-diamant", label: "Le Diamant" },
              { href: "/activites-sainte-luce", label: "Activités" },
            ].map(l => (
              <a key={l.href} href={l.href} style={{ color: "rgba(250,245,233,0.5)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em" }}>{l.label}</a>
            ))}
          </div>
          <p style={{ color: "rgba(250,245,233,0.3)", fontFamily: "'Jost', sans-serif", fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} Résidence Amaryllis · Sainte-Luce, Martinique</p>
        </footer>

        <MaillageCluster currentSlug="guide-sainte-luce-jour-de-pluie" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
