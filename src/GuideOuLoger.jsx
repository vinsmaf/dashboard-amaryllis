// Guide Où loger en Martinique — /guide-ou-loger-martinique-secteur

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
  .ou-section { margin-bottom: 60px; }
  .ou-label {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 300;
    letter-spacing: 0.32em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 10px;
  }
  .ou-section h2 {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: clamp(26px, 4vw, 38px);
    letter-spacing: 0.06em; text-transform: uppercase; color: ${NAVY}; margin: 0 0 24px; line-height: 1.1;
  }
  .ou-body {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(17px, 2.2vw, 20px);
    line-height: 1.8; color: ${TEXT}; max-width: 700px; margin-bottom: 28px;
  }
  .ou-secteur {
    background: #fff; border: 1px solid ${SAND}; border-radius: 16px;
    padding: 28px 32px; margin-bottom: 16px; position: relative;
  }
  .ou-secteur-head {
    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; gap: 12px;
  }
  .ou-secteur h3 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 17px;
    color: ${NAVY}; margin: 0; letter-spacing: 0.03em;
  }
  .ou-secteur p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: ${TEXT}; margin: 0 0 14px;
  }
  .ou-badge {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase; white-space: nowrap;
    padding: 4px 10px; border-radius: 8px; flex-shrink: 0;
  }
  .ou-badge-green { background: rgba(14,59,58,0.08); color: ${NAVY}; }
  .ou-badge-coral { background: rgba(196,114,84,0.12); color: ${CORAL}; }
  .ou-badge-muted { background: rgba(138,128,112,0.1); color: ${MUTED}; }
  .ou-pros {
    display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;
  }
  .ou-pro {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 400;
    background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 100px;
    padding: 5px 12px; color: ${NAVY};
  }
  .ou-highlight {
    background: linear-gradient(135deg, #0a2e2d 0%, ${NAVY} 60%, #163f3e 100%);
    border: 1px solid rgba(196,114,84,0.3); border-radius: 20px;
    padding: 44px 48px; margin-bottom: 64px;
  }
  .ou-highlight-label {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 300;
    letter-spacing: 0.32em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 16px;
  }
  .ou-highlight h2 {
    font-family: 'Jost', sans-serif; font-weight: 200; font-size: clamp(24px, 3.5vw, 36px);
    letter-spacing: 0.08em; text-transform: uppercase; color: ${IVORY}; margin: 0 0 28px; line-height: 1.1;
  }
  .ou-hl-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  }
  .ou-hl-item {
    background: rgba(250,245,233,0.05); border: 1px solid rgba(250,245,233,0.08);
    border-radius: 12px; padding: 20px 22px;
  }
  .ou-hl-item h4 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 12px;
    color: ${CORAL}; margin: 0 0 8px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .ou-hl-item p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px;
    line-height: 1.7; color: rgba(250,245,233,0.8); margin: 0;
  }
  .ou-faq-item { border-bottom: 1px solid ${SAND}; padding: 22px 0; }
  .ou-faq-item:first-child { border-top: 1px solid ${SAND}; }
  .ou-faq-q {
    font-family: 'Jost', sans-serif; font-weight: 400; font-size: 15px;
    color: ${NAVY}; margin: 0 0 10px;
  }
  .ou-faq-a {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: ${MUTED}; margin: 0;
  }
  .ou-compare {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;
    margin-bottom: 40px;
  }
  .ou-compare-item { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 18px 20px; }
  .ou-compare-label {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.22em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 6px;
  }
  .ou-compare-value {
    font-family: 'Jost', sans-serif; font-size: 13px; color: ${NAVY}; line-height: 1.5;
  }
  @media (max-width: 640px) {
    .ou-highlight { padding: 24px 20px; }
    .ou-hl-grid { grid-template-columns: 1fr; }
    .ou-secteur { padding: 22px 20px; }
    .ou-secteur-head { flex-direction: column; }
  }
`;

const BIEN_NAMES = {
  amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko",
  mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana",
  nogent: "Appartement Nogent-sur-Marne"
};

export default function GuideOuLoger() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta
        title="Où loger en Martinique selon son séjour — Guide secteurs 2026"
        description="Nord, Sud, Trois-Îlets, Atlantique : quel secteur choisir pour votre séjour en Martinique ? Notre guide comparatif honnête par vos hôtes à Sainte-Luce."
        canonical="/guide-ou-loger-martinique-secteur"
        type="article"
      />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>
        <ReadingProgressBar ctaHref="/" />

        {/* HERO */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`, padding: "80px 24px 64px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <a href="/guide-hub" style={{ color: "rgba(250,245,233,0.55)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}>← Tous les guides</a>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", margin: "0 0 16px" }}>Guide · Martinique</p>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(32px, 6vw, 56px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 20px", lineHeight: 1.05 }}>
              Où loger<br />en Martinique ?
            </h1>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(18px, 2.5vw, 22px)", lineHeight: 1.8, color: "rgba(250,245,233,0.75)", maxWidth: 580 }}>
              Nord, Sud, Trois-Îlets, côte Atlantique — chaque secteur a ses atouts, ses inconvénients, et convient à des séjours différents. Guide honnête de vos hôtes à Sainte-Luce.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 96px" }}>

          {/* INTRO */}
          <div className="ou-section">
            <p className="ou-label">Comment choisir</p>
            <h2>Choisir son secteur<br />selon son séjour</h2>
            <p className="ou-body">
              La Martinique est petite (60 km du Nord au Sud) mais très contrastée selon le secteur. Se loger à Fort-de-France n'offre pas du tout la même expérience que Sainte-Anne ou Saint-Pierre. Avant tout : quel type de séjour voulez-vous ?
            </p>
            <div className="ou-compare">
              {[
                { label: "Plages &amp; baignade", value: "→ Sud : Sainte-Luce, Sainte-Anne, Diamant" },
                { label: "Randonnée &amp; nature", value: "→ Nord : Montagne Pelée, forêt tropicale" },
                { label: "Nautisme &amp; voile", value: "→ Atlantique : Le François, Le Robert" },
                { label: "Vie de village créole", value: "→ Trois-Îlets, Sainte-Luce, Sainte-Anne" },
                { label: "Affaires &amp; Fort-de-France", value: "→ FdF ou Trois-Îlets (navette)" },
                { label: "Budget maîtrisé", value: "→ Sud (hors Pointe du Bout) · meilleur rapport qualité/prix" },
              ].map(i => (
                <div key={i.label} className="ou-compare-item">
                  <div className="ou-compare-label" dangerouslySetInnerHTML={{ __html: i.label }} />
                  <div className="ou-compare-value">{i.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* LE SUD */}
          <div className="ou-section">
            <p className="ou-label">Secteur 1</p>
            <h2>Le Sud Martinique<br />Sainte-Luce · Diamant · Sainte-Anne</h2>
            <p className="ou-body">
              C'est le secteur de prédilection pour la mer, les plages, la détente. L'eau est calme côté Caraïbe, les fonds marins sont accessibles depuis le bord, et la vie de village créole est authentique.
            </p>

            <div className="ou-secteur">
              <div className="ou-secteur-head">
                <h3>Sainte-Luce</h3>
                <span className="ou-badge ou-badge-green">Notre secteur</span>
              </div>
              <p>Commune calme et authentique, idéale pour les familles et les couples cherchant à se ressourcer. Plages au niveau du village (Gros Raisins, Chaudière), distillerie Trois-Rivières à 5 minutes, Sainte-Anne à 20 minutes. Pas de "tourisme de masse" : les locaux y vivent toute l'année. Supermarché Carrefour à Rivière-Pilote (10 min).</p>
              <div className="ou-pros">
                <span className="ou-pro">Mer calme</span>
                <span className="ou-pro">Tortues en snorkeling</span>
                <span className="ou-pro">Distillerie 5 min</span>
                <span className="ou-pro">Salines 20 min</span>
                <span className="ou-pro">Authentique</span>
              </div>
            </div>

            <div className="ou-secteur">
              <div className="ou-secteur-head">
                <h3>Le Diamant</h3>
                <span className="ou-badge ou-badge-muted">15 min de Sainte-Luce</span>
              </div>
              <p>Réputé pour son rocher emblématique et ses spots de kitesurf. La plage est longue et ventée, l'eau plus agitée. Village pittoresque, bons restaurants en bord de mer. Moins d'offre d'hébergement haut de gamme mais très belles locations de particuliers.</p>
              <div className="ou-pros">
                <span className="ou-pro">Rocher du Diamant</span>
                <span className="ou-pro">Kitesurf</span>
                <span className="ou-pro">Savane des Esclaves</span>
              </div>
            </div>

            <div className="ou-secteur">
              <div className="ou-secteur-head">
                <h3>Sainte-Anne &amp; Les Salines</h3>
                <span className="ou-badge ou-badge-coral">Très touristique en été</span>
              </div>
              <p>La pointe sud de l'île, avec les plages des Salines (souvent classées parmi les plus belles des Caraïbes). Cadre exceptionnel mais très fréquenté en juillet-août. Logements plus chers, réservation longtemps à l'avance nécessaire en haute saison. Idéal pour un séjour court centré sur la plage.</p>
              <div className="ou-pros">
                <span className="ou-pro">Plages des Salines</span>
                <span className="ou-pro">Snorkeling Anse Trabaud</span>
                <span className="ou-pro">Marché artisanal</span>
              </div>
            </div>
          </div>

          {/* TROIS-ÎLETS */}
          <div className="ou-section">
            <p className="ou-label">Secteur 2</p>
            <h2>Les Trois-Îlets<br />&amp; Pointe du Bout</h2>
            <p className="ou-body">
              Le secteur le plus "resort" de Martinique : grands hôtels, marina, golf, villages créoles classés. La navette maritime vers Fort-de-France (20 min) est très pratique. Plus cher que le Sud, atmosphère plus internationale.
            </p>
            <div className="ou-secteur">
              <div className="ou-secteur-head">
                <h3>Les Trois-Îlets · Pointe du Bout</h3>
                <span className="ou-badge ou-badge-coral">Pricier</span>
              </div>
              <p>Idéal pour qui veut combiner plage, vie nocturne, accès facile à Fort-de-France et grands hôtels avec spa. Le village des Trois-Îlets est charmant (musée de la Pagerie), mais la Pointe du Bout est très touristique et les prix reflètent la demande. Bon choix pour une semaine "tout-en-un" sans voiture si vous prenez la navette.</p>
              <div className="ou-pros">
                <span className="ou-pro">Navette Fort-de-France</span>
                <span className="ou-pro">Golf</span>
                <span className="ou-pro">Marina</span>
                <span className="ou-pro">Musée Pagerie</span>
              </div>
            </div>
          </div>

          {/* FORT-DE-FRANCE */}
          <div className="ou-section">
            <p className="ou-label">Secteur 3</p>
            <h2>Fort-de-France</h2>
            <p className="ou-body">
              La capitale. Pas une destination balnéaire — mais pratique pour les voyageurs d'affaires ou ceux qui veulent explorer la Martinique en rayonnant depuis le centre. Marché couvert de la Savane, bibliothèque Schoelcher, boutiques. Pas de plage en ville — il faut rouler.
            </p>
            <div className="ou-secteur">
              <div className="ou-secteur-head">
                <h3>Fort-de-France</h3>
                <span className="ou-badge ou-badge-muted">Affaires &amp; culture</span>
              </div>
              <p>Conseil honnête de votre hôte : si vous venez en Martinique pour les plages et la nature, ne logez pas à Fort-de-France. La ville n'est pas pensée pour les touristes balnéaires. En revanche, si vous avez des réunions professionnelles ou voulez visiter l'île au départ d'un point central, c'est logique. Loyer moyen plus accessible qu'ailleurs.</p>
            </div>
          </div>

          {/* NORD */}
          <div className="ou-section">
            <p className="ou-label">Secteur 4</p>
            <h2>Le Nord —<br />Montagne, forêt, volcan</h2>
            <p className="ou-body">
              Saint-Pierre, Macouba, Basse-Pointe — le Nord est le terrain des randonneurs, des amateurs de nature profonde et des "off the beaten path". La Montagne Pelée (1 397 m), la forêt tropicale, les chutes d'eau, les plages de sable noir.
            </p>
            <div className="ou-secteur">
              <div className="ou-secteur-head">
                <h3>Nord Martinique</h3>
                <span className="ou-badge ou-badge-muted">Nature &amp; aventure</span>
              </div>
              <p>Moins d'hébergements touristiques, mais les gîtes et cases créoles y sont authentiques et bon marché. L'offre de restaurants est limitée comparée au Sud. À recommander pour un séjour randonnée, ou en complément d'une première semaine au Sud : explorez le Nord en voiture à la journée (1h depuis Sainte-Luce).</p>
              <div className="ou-pros">
                <span className="ou-pro">Montagne Pelée</span>
                <span className="ou-pro">Chutes Absalon</span>
                <span className="ou-pro">Saint-Pierre (Pompéi)</span>
                <span className="ou-pro">Jardins de Balata</span>
              </div>
            </div>
          </div>

          {/* ATLANTIQUE */}
          <div className="ou-section">
            <p className="ou-label">Secteur 5</p>
            <h2>La Côte Atlantique —<br />Le François &amp; Le Robert</h2>
            <p className="ou-body">
              La côte Est est le paradis du nautisme : eaux calmes, îlets accessibles en kayak, fonds blancs de Joséphine. Moins de plages de sable que le Sud, mais une atmosphère "Caraïbe préservée" unique.
            </p>
            <div className="ou-secteur">
              <div className="ou-secteur-head">
                <h3>Le François · Le Robert</h3>
                <span className="ou-badge ou-badge-muted">Nautisme &amp; calme</span>
              </div>
              <p>Idéal pour les familles avec enfants en bas âge (eaux peu profondes, calmes) ou les couples cherchant la tranquillité absolue. Les "fonds blancs" — bancs de sable entourés d'eau turquoise — sont accessibles uniquement en bateau. Moins d'animation touristique qu'au Sud, hébergements plus rares.</p>
              <div className="ou-pros">
                <span className="ou-pro">Fonds blancs</span>
                <span className="ou-pro">Bain de Joséphine</span>
                <span className="ou-pro">Habitation Clément</span>
              </div>
            </div>
          </div>

          {/* POURQUOI SAINTE-LUCE */}
          <div className="ou-highlight">
            <p className="ou-highlight-label">Notre recommandation</p>
            <h2>Pourquoi Sainte-Luce<br />est le meilleur choix</h2>
            <div className="ou-hl-grid">
              {[
                { title: "Centrale entre tout", desc: "À 30 min de Fort-de-France, 20 min des Salines, 1h du Nord. Le meilleur rapport accès/calme de l'île." },
                { title: "Mer calme côté Caraïbe", desc: "Contrairement à l'Atlantique (houle) ou Sainte-Anne (courants), Sainte-Luce offre une mer tranquille idéale pour la baignade en famille." },
                { title: "Distilleries &amp; culture", desc: "Trois-Rivières à 5 min. Écomusée Anse Figuier à 5 min. Savane des Esclaves à 15 min. La densité culturelle est exceptionnelle pour un village balnéaire." },
                { title: "Vraie vie créole", desc: "Pas de tourisme de masse. Les habitants vivent ici à l'année. Marchés, restaurants de pêcheurs, boulangeries créoles." },
                { title: "Tortues &amp; snorkeling", desc: "L'Anse Chaudière, à 10 min à pied de nos villas, est l'un des meilleurs spots de snorkeling spontané (tortues vertes en liberté)." },
                { title: "Prix raisonnables", desc: "Moins cher que Trois-Îlets ou Pointe du Bout, pour une qualité de logement équivalente voire supérieure." },
              ].map(i => (
                <div key={i.title} className="ou-hl-item">
                  <h4>{i.title}</h4>
                  <p dangerouslySetInnerHTML={{ __html: i.desc }} />
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="ou-section">
            <p className="ou-label">Vos questions</p>
            <h2>FAQ · Choisir<br />son secteur</h2>
            <div>
              {[
                {
                  q: "Sainte-Luce ou Sainte-Anne — où loger ?",
                  a: "Sainte-Luce si vous cherchez l'authenticité, le calme et une base centrale pour explorer l'île. Sainte-Anne si vous voulez être à 10 minutes des Salines et que vous acceptez une ambiance plus touristique (et des prix plus élevés). Pour une semaine, Sainte-Luce gagne sur le rapport qualité/vie de village/accessibilité.",
                },
                {
                  q: "Où loger pour une semaine sans voiture ?",
                  a: "C'est difficile en Martinique : la voiture est quasi indispensable. La seule exception : les Trois-Îlets, avec la navette maritime vers Fort-de-France. Mais la navette s'arrête à 19h — les soirées demanderont un taxi. Si vous louez une voiture (fortement conseillé), Sainte-Luce est la base idéale pour tout explorer.",
                },
                {
                  q: "Trois-Îlets ou Sud Martinique — lequel choisir ?",
                  a: "Trois-Îlets si vous préférez les grands hôtels avec services complets, la navette vers Fort-de-France, et un cadre plus 'resort'. Sud (Sainte-Luce, Diamant, Sainte-Anne) si vous préférez les locations de villas plus spacieuses, la plage directe, et un rythme de vie plus authentique. Les deux secteurs sont à 30 minutes l'un de l'autre.",
                },
                {
                  q: "Y a-t-il une différence entre saison sèche et saison humide selon le secteur ?",
                  a: "Oui : le Nord est plus arrosé toute l'année (forêt tropicale). Le Sud (dont Sainte-Luce) est plus sec et bénéficie de conditions météo plus stables. En saison humide (juillet-octobre), le Sud reste la meilleure option pour maximiser les journées ensoleillées.",
                },
              ].map(faq => (
                <div key={faq.q} className="ou-faq-item">
                  <p className="ou-faq-q">{faq.q}</p>
                  <p className="ou-faq-a">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <BridgeVilla
            villaId="amaryllis"
            lieu="Sainte-Luce (Sud)"
            tempsRoute=""
            copy="Sainte-Luce : le secteur le plus polyvalent du Sud. Villa Amaryllis, 8 personnes, piscine privée, plage à 5 minutes."
          />

          <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`, borderRadius: 20, padding: "52px 40px", textAlign: "center" }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Réservation directe</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 4vw, 38px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 18px", lineHeight: 1.1 }}>
              Votre villa à Sainte-Luce<br />dès 70€ la nuit
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: "rgba(250,245,233,0.75)", maxWidth: 480, margin: "0 auto 36px" }}>
              5 villas disponibles à la résidence Amaryllis — 2 à 8 personnes, piscine, vue mer. Réservez en direct, sans frais d'agence.
            </p>
            <a href="/" style={{ display: "inline-block", padding: "16px 42px", background: CORAL, color: IVORY, borderRadius: 10, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Voir les disponibilités
            </a>
          </div>

        </div>

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-ou-loger-martinique" />
        </div>

        <footer style={{ background: NAVY, padding: "40px 24px", textAlign: "center" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Amaryllis</a>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { href: "/", label: "Villas" },
              { href: "/guide-hub", label: "Explorer" },
              { href: "/sainte-luce-martinique", label: "Sainte-Luce" },
              { href: "/guide-le-diamant", label: "Le Diamant" },
              { href: "/guide-sainte-anne", label: "Sainte-Anne" },
            ].map(l => (
              <a key={l.href} href={l.href} style={{ color: "rgba(250,245,233,0.5)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em" }}>{l.label}</a>
            ))}
          </div>
          <p style={{ color: "rgba(250,245,233,0.3)", fontFamily: "'Jost', sans-serif", fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} Résidence Amaryllis · Sainte-Luce, Martinique</p>
        </footer>

        <MaillageCluster currentSlug="guide-ou-loger-martinique-secteur" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
