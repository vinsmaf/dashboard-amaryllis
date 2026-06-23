// Guide Snorkeling Tortues Martinique — /guide-snorkeling-tortues-martinique

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
const GOLD  = "#d4a017";

const BASE = "https://villamaryllis.com";

const css = `
  .snk-section { margin-bottom: 60px; }
  .snk-label {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 400;
    letter-spacing: 0.32em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 10px;
  }
  .snk-section h2 {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: clamp(24px, 4vw, 36px);
    letter-spacing: 0.06em; text-transform: uppercase; color: ${NAVY}; margin: 0 0 26px; line-height: 1.1;
  }
  .snk-body {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(17px, 2vw, 19px);
    line-height: 1.82; color: ${TEXT}; max-width: 700px; margin-bottom: 28px;
  }

  .snk-highlight {
    background: linear-gradient(135deg, #0a2e2d 0%, ${NAVY} 60%, #153f3e 100%);
    border: 1px solid rgba(196,114,84,0.3); border-radius: 20px; overflow: hidden; margin-bottom: 64px;
  }
  .snk-highlight-head { padding: 36px 40px 28px; border-bottom: 1px solid rgba(250,245,233,0.08); }
  .snk-highlight-body { padding: 28px 40px 40px; display: flex; flex-direction: column; gap: 18px; }
  .snk-hl-item {
    background: rgba(250,245,233,0.05); border: 1px solid rgba(250,245,233,0.08);
    border-radius: 12px; padding: 22px 26px;
  }
  .snk-hl-item h4 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 13px;
    color: ${CORAL}; margin: 0 0 8px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .snk-hl-item p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: rgba(250,245,233,0.82); margin: 0;
  }
  .snk-hl-item .snk-distance {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.2em; color: ${GOLD}; text-transform: uppercase; margin-top: 10px;
  }

  .snk-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 32px; }
  .snk-card {
    background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 20px 22px;
  }
  .snk-card-label {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.22em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 7px;
  }
  .snk-card-value {
    font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 400; color: ${NAVY}; line-height: 1.55;
  }

  .snk-tip {
    background: ${CREAM}; border-left: 3px solid ${CORAL}; border-radius: 0 12px 12px 0;
    padding: 18px 22px; margin-bottom: 14px;
  }
  .snk-tip-title {
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase; color: ${NAVY}; margin-bottom: 6px;
  }
  .snk-tip p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; line-height: 1.7; color: ${TEXT}; margin: 0;
  }

  .snk-faq { margin-bottom: 60px; }
  .snk-faq-item {
    border-bottom: 1px solid ${SAND}; padding: 22px 0;
  }
  .snk-faq-item:first-child { border-top: 1px solid ${SAND}; }
  .snk-faq-q {
    font-family: 'Jost', sans-serif; font-size: 15px; font-weight: 400;
    color: ${NAVY}; margin-bottom: 10px; letter-spacing: 0.02em;
  }
  .snk-faq-a {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.78; color: ${TEXT}; max-width: 680px;
  }

  .snk-badge-row {
    display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 32px;
  }
  .snk-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(14,59,58,0.07); border: 1px solid rgba(14,59,58,0.15);
    border-radius: 100px; padding: 8px 16px;
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400;
    color: ${NAVY}; letter-spacing: 0.04em;
  }

  .snk-excursion {
    background: #fff; border: 1px solid ${SAND}; border-radius: 14px;
    padding: 24px 28px; margin-bottom: 14px;
  }
  .snk-excursion h4 {
    font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 500;
    color: ${NAVY}; margin: 0 0 8px; display: flex; justify-content: space-between; align-items: baseline;
  }
  .snk-excursion h4 span {
    font-size: 11px; font-weight: 600; color: ${CORAL}; letter-spacing: 0.1em;
  }
  .snk-excursion p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px;
    line-height: 1.72; color: ${MUTED}; margin: 0;
  }

  @media (max-width: 640px) {
    .snk-highlight-head, .snk-highlight-body { padding: 22px 18px; }
    .snk-hl-item { padding: 16px 16px; }
    .snk-grid2 { grid-template-columns: 1fr; }
  }
`;

const SPOTS = [
  {
    name: "Anses d'Arlet",
    tag: "LE spot mythique",
    distance: "25 min de Sainte-Luce",
    desc: "Sans conteste le meilleur spot de snorkeling pour observer les tortues marines en Martinique. Les herbiers marins tout autour du village attirent des dizaines de tortues vertes (Chelonia mydas) toute l'année. Arrivez avant 8h30 pour les voir sereinement avant les premiers groupes.",
  },
  {
    name: "Anse Corps de Garde",
    tag: "10 min de nos villas",
    distance: "10 min de Sainte-Luce",
    desc: "Le spot de snorkeling local par excellence, accessible depuis la plage sans bateau. Fonds herbiers et sableux, eaux translucides, présence régulière de tortues en début de matinée. Idéal pour les débutants grâce à une eau peu profonde et quasi sans courant.",
  },
  {
    name: "Grande Anse d'Arlet",
    tag: "Spot emblématique",
    distance: "30 min de Sainte-Luce",
    desc: "La grande plage d'Arlet avec son clocher iconique en mer et ses tortues habituées aux baigneurs. Fonds moins denses qu'aux Anses d'Arlet mais ambiance incomparable. Combinez les deux spots en une demi-journée — village et grande plage sont à 5 minutes à pied.",
  },
  {
    name: "Sainte-Luce plage du bourg",
    tag: "Sur place",
    distance: "5 min des villas",
    desc: "Moins réputé pour les tortues mais accessible à pied depuis nos villas. Quelques tortues visibles en bord de plage côté pointe, particulièrement tôt le matin. Parfait pour un bain rapide ou découvrir les poissons de récif sans préparation.",
  },
];

const CONSEILS = [
  {
    title: "Arriver avant 8h30",
    desc: "Les tortues marines sont naturellement présentes le matin avant l'afflux de baigneurs. En haute saison, les Anses d'Arlet sont bondées dès 10h — arriver tôt, c'est souvent repartir avec des dizaines de photos.",
  },
  {
    title: "Ne jamais toucher les tortues",
    desc: "Interdiction légale de toucher, poursuivre ou perturber les tortues marines protégées. Observer à distance respectable (1,5 m minimum). Les animaux stressés plongent et ne reviennent pas — restez immobile, elles s'approchent naturellement.",
  },
  {
    title: "Masque et tuba — où louer",
    desc: "Location de matériel snorkeling sur la plage des Anses d'Arlet (5–10 €/j) et chez plusieurs prestataires à Sainte-Luce. Pour les séjours d'une semaine ou plus, investir dans votre propre masque reste plus confortable.",
  },
  {
    title: "Crème solaire biodégradable",
    desc: "Obligatoire depuis l'arrêté préfectoral de 2021 : aucune crème chimique (oxybenzones, octinoxate) dans les eaux martiniquaises. Préférez les crèmes minérales (zinc) vendues dans les pharmacies locales. Les coraux vous remercient.",
  },
];

const DEBUTANTS = [
  { label: "Anse Corps de Garde", value: "Eau calme, peu profonde, entrée depuis la plage" },
  { label: "Plage de Sainte-Luce", value: "Fonds sableux, pas de courant, parfait pour les enfants" },
  { label: "Grande Anse d'Arlet", value: "Zone abritée côté gauche de la plage, eaux tranquilles" },
  { label: "Meilleure heure débutant", value: "9h–11h : lumière optimale, mer calme, eau chaude" },
  { label: "Profondeur typique", value: "1 à 4 mètres — pas besoin de savoir plonger" },
  { label: "Gilet de flottabilité", value: "Disponible à la location, recommandé pour les enfants" },
];

const EXCURSIONS = [
  {
    name: "Catamaran depuis Le Marin",
    price: "À partir de 80 €/pers",
    desc: "La sortie en mer la plus complète : catamaran full-day avec snorkeling aux Anses d'Arlet, Anse Mitan, fonds blancs. Déjeuner à bord inclus. Réservation en ligne recommandée (sold out en saison).",
  },
  {
    name: "Glass-bottom boat aux Trois-Îlets",
    price: "À partir de 25 €/pers",
    desc: "Bateau à fond transparent pour observer les fonds marins sans mouiller les pieds — idéal avec des enfants en bas âge. Circuit 1h–1h30 autour des rochers et herbiers. Départs réguliers depuis le ponton des Trois-Îlets.",
  },
  {
    name: "Sortie snorkeling privée Sainte-Luce",
    price: "À partir de 40 €/pers",
    desc: "Petit groupe (6 pers. max) avec un guide local, départ depuis Sainte-Luce. Spots de plongée de surface au programme : tortues, poissons-perroquets, raies pastenagues. Durée 2h–3h, matériel fourni.",
  },
];

const FAQ = [
  {
    q: "Les tortues sont-elles garanties ?",
    a: "Aucun opérateur honnête ne peut le garantir, mais les Anses d'Arlet offrent les meilleures probabilités de toute la Martinique. Statistiquement, les visiteurs qui arrivent avant 9h observent des tortues dans 90 % des cas. En dehors de la saison sèche (février–avril), les eaux sont légèrement moins claires mais les tortues restent présentes.",
  },
  {
    q: "Quelle est la meilleure heure pour le snorkeling ?",
    a: "Le matin entre 7h30 et 10h : lumière optimale, mer plate, eau claire, tortues actives en surface pour se réchauffer. L'après-midi, la mer se lève souvent et la visibilité diminue avec le trafic maritime.",
  },
  {
    q: "Snorkeling avec des enfants — à partir de quel âge ?",
    a: "Dès 5–6 ans avec un adulte, aux spots calmes comme Corps de Garde ou la Grande Anse d'Arlet côté abrité. Prévoir des brassards ou un gilet de flottabilité. Les enfants adorent — les tortues sont aussi grandes qu'eux, c'est inoubliable.",
  },
  {
    q: "Faut-il une bouteille de plongée ?",
    a: "Non — le snorkeling se pratique en surface avec masque et tuba uniquement. Les tortues remontent régulièrement respirer à la surface, parfois à quelques mètres de vous. La plongée bouteille (scuba diving) offre des expériences différentes mais n'est pas nécessaire pour voir les tortues.",
  },
];

export default function GuideSnorkeling() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <ReadingProgressBar ctaHref="/" />
      <SEOMeta
        title="Snorkeling avec les tortues en Martinique — Meilleurs spots 2026"
        description="Où voir les tortues marines en Martinique : Anses d'Arlet, Corps de Garde, Grande Anse. Nos conseils depuis Sainte-Luce pour un snorkeling inoubliable."
        canonical="/guide-snorkeling-tortues-martinique"
        type="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Snorkeling avec les tortues en Martinique — Meilleurs spots 2026",
        "author": { "@type": "Organization", "name": "Amaryllis Locations", "url": BASE },
        "publisher": { "@type": "Organization", "name": "Amaryllis Locations", "url": BASE },
        "url": `${BASE}/guide-snorkeling-tortues-martinique`,
        "inLanguage": "fr",
        "description": "Guide complet du snorkeling en Martinique : meilleurs spots pour nager avec les tortues, conseils pratiques, spots débutants, excursions en mer.",
      }) }} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>

        {/* HERO */}
        <div style={{
          background: `linear-gradient(to bottom, rgba(14,59,58,0.18) 0%, rgba(14,59,58,0.10) 40%, rgba(14,59,58,0.88) 100%), ${NAVY}`,
          minHeight: 460, display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: "80px 24px 56px",
        }}>
          <div style={{ maxWidth: 860, margin: "0 auto", width: "100%" }}>
            <a href="/guide-hub" style={{ color: "rgba(250,245,233,0.55)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 28 }}>
              ← Tous les guides
            </a>
            <p style={{ color: CORAL, fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", margin: "0 0 12px" }}>Guide · Martinique</p>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(30px, 5vw, 52px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 20px", lineHeight: 1.05 }}>
              Snorkeling<br />avec les tortues
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[
                { icon: "🐢", label: "Tortues marines garanties" },
                { icon: "🤿", label: "Spots débutants & expert" },
                { icon: "🌊", label: "Eaux turquoise Caraïbes" },
                { icon: "📍", label: "25 min de Sainte-Luce" },
              ].map(b => (
                <div key={b.label} style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  background: "rgba(250,245,233,0.12)", border: "1px solid rgba(250,245,233,0.22)",
                  borderRadius: 100, padding: "8px 16px",
                  fontFamily: "'Jost', sans-serif", fontSize: 12, color: "rgba(250,245,233,0.9)", letterSpacing: "0.04em",
                  backdropFilter: "blur(6px)",
                }}>
                  <span>{b.icon}</span> {b.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 96px" }}>

          {/* INTRO */}
          <div className="snk-section">
            <p className="snk-label">Introduction</p>
            <h2>La Martinique,<br />paradis du snorkeling</h2>
            <p className="snk-body">
              La Martinique est l'une des rares destinations au monde où vous pouvez observer des tortues marines à l'état sauvage depuis la plage, sans équipement spécifique autre qu'un masque et un tuba. Les eaux cristallines du sud de l'île — température 26–28 °C toute l'année, visibilité souvent supérieure à 20 mètres — abritent d'importantes populations de tortues vertes (<em>Chelonia mydas</em>) et de tortues imbriquées (<em>Eretmochelys imbricata</em>), deux espèces protégées par la loi depuis 1991.
            </p>
            <p className="snk-body">
              Les herbiers marins qui s'étendent le long de la côte sud — entre Sainte-Luce, Les Anses d'Arlet et Sainte-Anne — constituent leur terrain d'alimentation favori. C'est ici que vous les trouverez, imperturbables, broutant les herbiers à quelques mètres à peine sous la surface.
            </p>
            <div className="snk-badge-row">
              <div className="snk-badge">🌡️ Eau 26–28 °C toute l'année</div>
              <div className="snk-badge">👁️ Visibilité 15–25 m</div>
              <div className="snk-badge">🐢 Tortues vertes & imbriquées</div>
              <div className="snk-badge">⚖️ Espèces protégées depuis 1991</div>
            </div>
          </div>

          {/* SPOTS */}
          <div className="snk-highlight">
            <div className="snk-highlight-head">
              <p style={{ color: CORAL, fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Meilleurs spots</p>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 3vw, 32px)", letterSpacing: "0.08em", textTransform: "uppercase", color: IVORY, margin: 0, lineHeight: 1.1 }}>
                Où nager avec<br />les tortues
              </h2>
            </div>
            <div className="snk-highlight-body">
              {SPOTS.map(s => (
                <div key={s.name} className="snk-hl-item">
                  <h4>{s.name} <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 400, color: "rgba(250,245,233,0.45)", letterSpacing: "0.08em", textTransform: "none", marginLeft: 6 }}>{s.tag}</span></h4>
                  <p>{s.desc}</p>
                  <div className="snk-distance">📍 {s.distance}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CONSEILS PRATIQUES */}
          <div className="snk-section">
            <p className="snk-label">Conseils pratiques</p>
            <h2>Préparer<br />sa sortie snorkeling</h2>
            {CONSEILS.map(c => (
              <div key={c.title} className="snk-tip">
                <div className="snk-tip-title">{c.title}</div>
                <p>{c.desc}</p>
              </div>
            ))}
          </div>

          {/* DÉBUTANTS */}
          <div className="snk-section">
            <p className="snk-label">Débutants & familles</p>
            <h2>Snorkeling<br />pour les premiers pas</h2>
            <p className="snk-body">
              Pas besoin d'être un nageur aguerri pour profiter du snorkeling martiniquais. Plusieurs spots sont parfaitement adaptés aux débutants, aux personnes peu à l'aise dans l'eau et aux enfants — eaux calmes, peu profondes, sans courant, avec une faune sous-marine tout aussi généreuse.
            </p>
            <div className="snk-grid2">
              {DEBUTANTS.map(d => (
                <div key={d.label} className="snk-card">
                  <div className="snk-card-label">{d.label}</div>
                  <div className="snk-card-value">{d.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* EXCURSIONS */}
          <div className="snk-section">
            <p className="snk-label">Excursions organisées</p>
            <h2>Partir avec<br />un guide</h2>
            <p className="snk-body">
              Pour une expérience complète et sécurisée, plusieurs opérateurs proposent des sorties snorkeling encadrées depuis les ports du sud Martinique. Ces excursions combinent généralement plusieurs spots, incluent le matériel et l'expertise d'un moniteur diplômé.
            </p>
            {EXCURSIONS.map(e => (
              <div key={e.name} className="snk-excursion">
                <h4>{e.name} <span>{e.price}</span></h4>
                <p>{e.desc}</p>
              </div>
            ))}
          </div>

          {/* DEPUIS NOS VILLAS */}
          <div className="snk-section">
            <p className="snk-label">Votre camp de base</p>
            <h2>Depuis Sainte-Luce :<br />tout à portée</h2>
            <p className="snk-body">
              Depuis la résidence Amaryllis à Sainte-Luce, tous les grands spots de snorkeling du sud Martinique sont accessibles en moins de 30 minutes. Le spot de Corps de Garde est à 10 minutes à pied ou en voiture. Les Anses d'Arlet — le graal des tortues — se font en 25 minutes par une route côtière spectaculaire. Aucune logistique complexe, aucune nuit supplémentaire à payer : votre villa est votre point de départ idéal.
            </p>
            <div className="snk-grid2">
              {[
                { label: "Anse Corps de Garde", value: "10 min — spot local, tortues tôt le matin" },
                { label: "Anses d'Arlet", value: "25 min — LE spot mythique des tortues" },
                { label: "Grande Anse d'Arlet", value: "30 min — clocher iconique, eaux tranquilles" },
                { label: "Le Marin", value: "25 min — départ catamarans & excursions" },
                { label: "Sainte-Anne / Les Salines", value: "15 min — snorkeling côté atlantique" },
                { label: "Trois-Îlets", value: "30 min — glass-bottom boat, idéal avec enfants" },
              ].map(d => (
                <div key={d.label} className="snk-card">
                  <div className="snk-card-label">{d.label}</div>
                  <div className="snk-card-value">{d.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="snk-section snk-faq">
            <p className="snk-label">Questions fréquentes</p>
            <h2>Ce que vous<br />nous demandez souvent</h2>
            {FAQ.map(f => (
              <div key={f.q} className="snk-faq-item">
                <div className="snk-faq-q">{f.q}</div>
                <div className="snk-faq-a">{f.a}</div>
              </div>
            ))}
          </div>

          <BridgeVilla
            villaId="amaryllis"
            lieu="Anses d'Arlet (spot tortues)"
            tempsRoute="25 min"
            copy="Depuis la Villa Amaryllis, les tortues des Anses d'Arlet sont à 25 minutes — votre camp de base idéal."
          />

          {/* CTA FINAL */}
          <div style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`,
            borderRadius: 20, padding: "52px 40px", textAlign: "center", marginTop: 64,
          }}>
            <p style={{ color: CORAL, fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Réservation directe</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 4vw, 38px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 18px", lineHeight: 1.1 }}>
              Dormez à 25 minutes<br />des tortues marines
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: "rgba(250,245,233,0.75)", maxWidth: 480, margin: "0 auto 36px" }}>
              Piscine à débordement, vue mer Caraïbes, jardin tropical — et les meilleurs spots de snorkeling de l'île à moins d'une demi-heure.
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
          <NewsletterForm source="guide-snorkeling-tortues" />
        </div>

        <footer style={{ background: NAVY, padding: "40px 24px", textAlign: "center" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Amaryllis</a>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { href: "/", label: "Villas" },
              { href: "/guide-hub", label: "Explorer" },
              { href: "/sainte-luce-martinique", label: "Sainte-Luce" },
              { href: "/guide-se-deplacer-martinique-sud", label: "Se déplacer" },
              { href: "/activites-sainte-luce", label: "Activités" },
              { href: "/faq", label: "FAQ" },
            ].map(l => (
              <a key={l.href} href={l.href} style={{ color: "rgba(250,245,233,0.5)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em" }}>{l.label}</a>
            ))}
          </div>
          <p style={{ color: "rgba(250,245,233,0.3)", fontFamily: "'Jost', sans-serif", fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} Résidence Amaryllis · Sainte-Luce, Martinique</p>
        </footer>

        <MaillageCluster currentSlug="guide-snorkeling-tortues-martinique" />
      </div>
    </>
  );
}
