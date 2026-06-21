// Partenaires.jsx — page publique « Nos partenaires & bonnes adresses » — /nos-partenaires
// Objectifs : crédibilité, infrastructure netlinking (liens partenaires ajoutés plus tard),
// recommandations d'adresses locales aux voyageurs, maillage interne vers les 7 biens.
// ⚠️ Aucune URL externe inventée : les adresses sont présentées en TEXTE (nom + 1 phrase).

import SEOMeta from "./SEOMeta.jsx";

const NAVY = "#0e3b3a", CORAL = "#c47254", GOLD = "#c9a673";
const IVORY = "#faf5e9", CREAM = "#f4ecdc", SAND = "#e0d4bc", MUTED = "#7a6b5a";
const TEXT = "#3a3530";

// Sections thématiques d'adresses recommandées (NOM en gras + 1 phrase, sans lien externe).
const SECTIONS = [
  {
    emoji: "🥃",
    titre: "Découvertes & rhum",
    intro: "Le rhum agricole AOC est l'âme de la Martinique. Voici les maisons que nous conseillons à nos voyageurs.",
    items: [
      { nom: "Maison La Mauny", url: "https://www.maisonlamauny.com", desc: "À Rivière-Pilote, la plus proche de nos logements : visite du domaine en « Ti Train » et dégustation de rhums vieux primés." },
      { nom: "Distillerie Trois-Rivières", url: "https://www.troisrivieresrhum.com", desc: "À quelques minutes, à Sainte-Luce même, l'un des domaines les plus emblématiques du Sud, avec son célèbre moulin." },
      { nom: "Habitation Clément", url: "https://www.fondation-clement.org", desc: "Au François, un parcours mêlant rhum, art contemporain et jardin botanique d'exception." },
      { nom: "Distillerie Depaz", url: "https://depaz.fr", desc: "Au pied de la Montagne Pelée à Saint-Pierre, un cadre spectaculaire pour les amateurs de rhums vieux." },
      { nom: "Distillerie Neisson", url: "https://neisson.com", desc: "Au Carbet, distillerie familiale réputée (rhums AOC médaillés), au nord près de Saint-Pierre." },
    ],
  },
  {
    emoji: "🤿",
    titre: "Mer & plongée",
    intro: "Le Sud caraïbe offre une eau calme et claire, idéale pour découvrir les fonds marins.",
    items: [
      { nom: "Clubs de plongée de Sainte-Luce", desc: "Plusieurs centres encadrent baptêmes et explorations sur les sites du Sud, accessibles dès le premier niveau." },
      { nom: "Clubs des Anses-d'Arlet", desc: "Le spot de référence pour nager avec les tortues marines, à environ 25 minutes de nos logements." },
      { nom: "Sorties bateau & catamaran", desc: "Excursions à la journée vers les fonds blancs et les îlets, avec ti-punch et baignade au programme." },
      { nom: "Location de kayaks & paddle", desc: "Sur les plages de Sainte-Luce, pour explorer la côte à votre rythme, en famille." },
    ],
  },
  {
    emoji: "🍽️",
    titre: "Saveurs créoles",
    intro: "La cuisine martiniquaise se déguste les pieds dans le sable ou sur une terrasse face au coucher de soleil.",
    items: [
      { nom: "Les tables de bord de mer de Sainte-Luce", desc: "Poisson frais du jour, langouste grillée et accras dans une ambiance décontractée, à deux pas du logement." },
      { nom: "Les snacks de plage", desc: "Pour un déjeuner sur le pouce après la baignade : boudin créole, dombré et jus de fruits frais." },
      { nom: "Les tables des Anses-d'Arlet", desc: "Cuisine créole authentique dans l'un des plus beaux villages de pêcheurs de l'île." },
      { nom: "Les marchés locaux", desc: "Épices, fruits tropicaux et confitures maison : l'occasion de cuisiner créole dans votre logement." },
    ],
  },
  {
    emoji: "🌿",
    titre: "Bien-être & services",
    intro: "Pour que votre séjour reste un moment de détente, nous nous appuyons sur des prestataires sérieux.",
    items: [
      { nom: "Conciergerie & accueil personnalisé", desc: "Remise des clés, conseils sur mesure et assistance pendant votre séjour, en toute sérénité." },
      { nom: "Massage & soins à domicile", desc: "Des praticiens se déplacent dans votre logement pour un moment de bien-être face à la mer." },
      { nom: "Chef à domicile", desc: "Un repas créole préparé sur place pour une occasion spéciale, sans quitter votre terrasse." },
      { nom: "Ménage & blanchisserie", desc: "Des prestataires locaux de confiance pour un logement impeccable du début à la fin." },
    ],
  },
  {
    emoji: "🚗",
    titre: "Mobilité",
    intro: "Une voiture est indispensable pour explorer la Martinique en toute liberté.",
    items: [
      { nom: "Loueurs de voiture locaux", desc: "Des agences indépendantes proposent des véhicules adaptés aux routes de l'île, souvent avec livraison à l'aéroport." },
      { nom: "Transferts aéroport", desc: "Pour une arrivée et un départ sans stress, des chauffeurs assurent la liaison avec Aimé Césaire." },
      { nom: "Location de scooter", desc: "Une alternative pratique pour les trajets courts et les balades le long de la côte." },
    ],
  },
];

// Maillage interne — les 7 biens (nomenclature stricte : « villa » = Amaryllis + Iguana uniquement).
const BIENS = [
  { id: "amaryllis", name: "Villa Amaryllis", desc: "Sainte-Luce · piscine à débordement, vue mer, jacuzzi" },
  { id: "zandoli", name: "Zandoli", desc: "Sainte-Luce · piscine à cascade, jardin tropical" },
  { id: "geko", name: "Géko", desc: "Sainte-Luce · cocon avec piscine privative" },
  { id: "mabouya", name: "Mabouya", desc: "Sainte-Luce · studio avec jacuzzi privatif vue mer" },
  { id: "schoelcher", name: "Bellevue Schœlcher", desc: "Schœlcher · vue sur la baie de Fort-de-France" },
  { id: "iguana", name: "Villa Iguana", desc: "Sainte-Luce · piscine eau salée, vue Diamant" },
  { id: "nogent", name: "Appartement Nogent-sur-Marne", desc: "Nogent-sur-Marne · bord de Marne, Paris en 20 min" },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
  .pt * { box-sizing: border-box; }
  .pt { font-family: 'Jost', sans-serif; color: ${NAVY}; background: ${IVORY}; margin: 0; }

  .pt-header { background: ${NAVY}; padding: 0 24px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 30; }
  .pt-header a { color: ${IVORY}; text-decoration: none; }
  .pt-brand { font-weight: 300; font-size: 18px; letter-spacing: .15em; text-transform: uppercase; }
  .pt-nav { display: flex; gap: 18px; }
  .pt-nav a { font-size: 12px; letter-spacing: .08em; opacity: .75; }
  .pt-nav a:hover { opacity: 1; color: ${GOLD}; }

  .pt-hero { background: linear-gradient(135deg, ${NAVY} 0%, #16524f 55%, #1d6b5f 100%); padding: 56px 24px 52px; }
  .pt-hero-inner { max-width: 760px; margin: 0 auto; }
  /* ⚠️ Scopé sous .pt-hero (spécificité 0,2,0) pour battre la règle globale
     [data-surface="site"] h1 { color: var(--fg-1) } (0,1,1) qui rendait le titre
     navy foncé invisible sur le hero vert foncé. Ne pas dé-scoper. */
  .pt-hero .pt-eyebrow { font-size: 10px; font-weight: 200; letter-spacing: .45em; text-transform: uppercase; color: ${CORAL}; margin: 0 0 16px; }
  .pt-hero .pt-h1 { font-weight: 200; font-size: clamp(28px, 5vw, 46px); line-height: 1.1; letter-spacing: .04em; color: ${IVORY}; margin: 0 0 20px; }
  .pt-hero .pt-lead { font-family: 'Cormorant Garamond', serif; font-size: 20px; line-height: 1.65; color: rgba(250,245,233,.85); margin: 0; }

  .pt-main { max-width: 760px; margin: 0 auto; padding: 48px 24px 0; }

  .pt-section { margin-bottom: 48px; }
  .pt-h2 { font-weight: 400; font-size: 24px; letter-spacing: .02em; color: ${NAVY}; margin: 0 0 8px; display: flex; align-items: center; gap: 12px; }
  .pt-section-intro { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 18px; line-height: 1.55; color: ${MUTED}; margin: 0 0 22px; padding-left: 14px; border-left: 3px solid ${CORAL}; }
  .pt-item { background: #fff; border: 1px solid ${SAND}; border-radius: 12px; padding: 18px 22px; margin-bottom: 12px; }
  .pt-item-nom { font-weight: 600; font-size: 15px; color: ${NAVY}; margin: 0 0 5px; }
  .pt-item-link { color: ${CORAL}; text-decoration: none; border-bottom: 1px solid transparent; transition: border-color .18s; }
  .pt-item-link:hover { border-bottom-color: ${CORAL}; }
  .pt-item-link span { font-size: 11px; opacity: .7; }
  .pt-item-desc { font-size: 15px; line-height: 1.6; color: ${TEXT}; margin: 0; }

  .pt-partner { background: ${CREAM}; border: 1px solid ${SAND}; border-left: 4px solid ${GOLD}; border-radius: 0 16px 16px 0; padding: 30px 30px; margin: 8px 0 48px; }
  .pt-partner-pre { font-size: 10px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: ${GOLD}; margin-bottom: 10px; }
  .pt-partner-h { font-weight: 400; font-size: 22px; color: ${NAVY}; margin: 0 0 12px; }
  .pt-partner-p { font-family: 'Cormorant Garamond', serif; font-size: 18px; line-height: 1.7; color: ${TEXT}; margin: 0 0 22px; }
  .pt-partner-btn { display: inline-block; background: ${CORAL}; color: #fff; text-decoration: none; padding: 14px 34px; border-radius: 8px; font-size: 12px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; transition: background .2s; }
  .pt-partner-btn:hover { background: #a85a3f; }

  .pt-biens { margin-bottom: 16px; }
  .pt-biens-pre { font-size: 11px; font-weight: 600; letter-spacing: .25em; text-transform: uppercase; color: ${CORAL}; margin: 0 0 18px; }
  .pt-bien { display: flex; justify-content: space-between; align-items: center; background: #fff; border: 1px solid ${SAND}; border-radius: 10px; padding: 14px 18px; margin-bottom: 10px; text-decoration: none; transition: border-color .18s; }
  .pt-bien:hover { border-color: ${CORAL}; }
  .pt-bien-name { font-weight: 500; font-size: 14px; color: ${NAVY}; margin-bottom: 2px; }
  .pt-bien-desc { font-family: 'Cormorant Garamond', serif; font-size: 14px; color: ${TEXT}; opacity: .8; }
  .pt-bien-arrow { color: ${CORAL}; font-size: 18px; flex-shrink: 0; margin-left: 12px; }

  .pt-foot-nav { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; padding: 40px 24px 8px; }
  .pt-foot-nav a { padding: 12px 22px; border: 1px solid ${SAND}; border-radius: 8px; text-decoration: none; color: ${NAVY}; font-size: 13px; letter-spacing: .06em; transition: all .18s; }
  .pt-foot-nav a:hover { border-color: ${CORAL}; color: ${CORAL}; }
  .pt-copy { text-align: center; padding: 28px 22px; margin-top: 24px; background: ${NAVY}; color: rgba(250,245,233,.45); font-size: 12px; }
  .pt-copy a { color: rgba(250,245,233,.45); text-decoration: none; }

  @media (max-width: 640px) {
    .pt-bien { flex-direction: row; }
  }
`;

export default function Partenaires() {
  return (
    <div className="pt">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <SEOMeta
        title="Nos partenaires en Martinique — Amaryllis"
        description="Nos adresses locales de confiance pour votre séjour en Martinique : rhum, plongée, tables créoles, bien-être et mobilité. Sélectionnées par vos hôtes Amaryllis."
        canonical="/nos-partenaires"
        image="https://villamaryllis.com/photos/amaryllis/01.webp"
        type="website"
      />

      {/* Header */}
      <header className="pt-header">
        <a href="/" className="pt-brand">Amaryllis</a>
        <nav className="pt-nav">
          <a href="/guide-hub">Tous les guides</a>
          <a href="/explorer">🗺️ Carte des lieux</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="pt-hero">
        <div className="pt-hero-inner">
          <p className="pt-eyebrow">Amaryllis</p>
          <h1 className="pt-h1">Nos partenaires &amp; bonnes adresses</h1>
          <p className="pt-lead">
            Parce qu'un beau séjour ne se résume pas à un toit, nous sélectionnons pour vous des
            adresses locales de confiance, testées et approuvées par nos voyageurs. Nous travaillons
            aussi avec des prestataires sérieux pour vous offrir, à chaque étape, le meilleur de la
            Martinique.
          </p>
        </div>
      </section>

      {/* Sections d'adresses */}
      <main className="pt-main">
        {SECTIONS.map((sec) => (
          <section key={sec.titre} className="pt-section">
            <h2 className="pt-h2"><span aria-hidden>{sec.emoji}</span><span>{sec.titre}</span></h2>
            <p className="pt-section-intro">{sec.intro}</p>
            {sec.items.map((it) => (
              <div key={it.nom} className="pt-item">
                <p className="pt-item-nom">
                  {it.url ? (
                    <a className="pt-item-link" href={it.url} target="_blank" rel="noopener noreferrer">
                      {it.nom} <span aria-hidden>↗</span>
                    </a>
                  ) : it.nom}
                </p>
                <p className="pt-item-desc">{it.desc}</p>
              </div>
            ))}
          </section>
        ))}

        {/* Bloc prestataire — CTA partenariat */}
        <div className="pt-partner">
          <div className="pt-partner-pre">Vous êtes un prestataire local ?</div>
          <h2 className="pt-partner-h">Devenons partenaires</h2>
          <p className="pt-partner-p">
            Vous proposez une activité, une table, un service ou une expérience qui ravirait nos
            voyageurs ? Nous aimons mettre en avant les professionnels qui partagent notre exigence.
            Recommandons-nous mutuellement : vous gagnez en visibilité auprès de nos hôtes, nos
            voyageurs profitent de votre savoir-faire, et la Martinique rayonne. Écrivez-nous, nous
            étudions chaque proposition avec attention.
          </p>
          <a className="pt-partner-btn" href="mailto:contact@villamaryllis.com?subject=Partenariat">
            Devenons partenaires
          </a>
        </div>

        {/* Maillage interne — où loger */}
        <div className="pt-biens">
          <p className="pt-biens-pre">Où loger pendant votre séjour</p>
          {BIENS.map((b) => (
            <a key={b.id} href={`/${b.id}`} className="pt-bien">
              <div>
                <div className="pt-bien-name">{b.name}</div>
                <div className="pt-bien-desc">{b.desc}</div>
              </div>
              <span className="pt-bien-arrow" aria-hidden>›</span>
            </a>
          ))}
        </div>
      </main>

      {/* Footer nav */}
      <nav className="pt-foot-nav">
        <a href="/guide-hub">Tous les guides Martinique</a>
        <a href="/explorer">Carte des lieux</a>
        <a href="/">Nos logements →</a>
      </nav>
      <div className="pt-copy">
        © {new Date().getFullYear()} Amaryllis Locations · <a href="/">villamaryllis.com</a>
      </div>
    </div>
  );
}
