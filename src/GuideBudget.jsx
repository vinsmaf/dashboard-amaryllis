// Page /guide-budget-vacances-martinique — SEO TOFU budget voyage

import SEOMeta from "./SEOMeta.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import NewsletterForm from "./NewsletterForm.jsx";
import ReadingProgressBar from "./components/ReadingProgressBar.jsx";
import BridgeVilla from "./components/BridgeVilla.jsx";
import GuideHero from "./components/GuideHero.jsx";
import GuideStickyNav from "./components/GuideStickyNav.jsx";

const BIEN_NAMES = { amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko", mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana", nogent: "Appartement Nogent-sur-Marne" };

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8e0d0";
const MUTED = "#8a8070";
const GOLD  = "#d4a017";

const BASE = "https://villamaryllis.com";
const HERO_IMG = "/photos/martinique-panorama.jpg";

const POSTES = [
  {
    id: "hebergement",
    titre: "Hébergement",
    icon: "🏡",
    fourchette: "70 – 280 €/nuit",
    detail: "La Martinique est un DOM français : les prix sont proches de la métropole, parfois supérieurs en haute saison. Cela dit, un logement partagé entre 4-6 personnes revient moins cher qu'un hôtel pour chacun.",
    lignes: [
      { type: "Studio (2 pers.)", prix: "dès 70€/nuit", note: "Notre Mabouya en réservation directe — meilleur rapport qualité-prix" },
      { type: "Appartement (4 pers.)", prix: "90-130€/nuit", note: "Géko ou Schœlcher, cuisine équipée, terrasse" },
      { type: "Villa (6-8 pers.)", prix: "180-280€/nuit", note: "Piscine privée, jardin, idéal en groupe" },
      { type: "Airbnb / Booking", prix: "+15-20%", note: "Commission OTA répercutée sur le prix affiché" },
    ],
    astuce: "Réservez en direct sur villamaryllis.com : pas de commission Airbnb ni Booking, soit 15-20% d'économie.",
  },
  {
    id: "vols",
    titre: "Vols",
    icon: "✈️",
    fourchette: "300 – 600 € A/R",
    detail: "Paris CDG ou ORY vers Fort-de-France Aimé-Césaire (FDF). Vol direct ~8h30. Les prix varient énormément selon la saison et l'anticipation.",
    lignes: [
      { type: "Basse saison (mai, nov)", prix: "300-380€ A/R", note: "Meilleures offres, peu de monde" },
      { type: "Haute saison (déc-avr)", prix: "450-600€ A/R", note: "Réserver 2-3 mois à l'avance" },
      { type: "Été (juil-août)", prix: "400-550€ A/R", note: "Vacances scolaires = plein tarif" },
      { type: "Noël / Jour de l'An", prix: "500-700€ A/R", note: "Booked 4-5 mois à l'avance minimum" },
    ],
    astuce: "Configurez une alerte Google Flights. Les mardis et mercredis affichent souvent les meilleurs tarifs. Évitez le vendredi.",
  },
  {
    id: "voiture",
    titre: "Location de voiture",
    icon: "🚗",
    fourchette: "40 – 80 €/jour",
    detail: "La voiture est indispensable en Martinique. Les transports en commun (minibus) couvrent les axes principaux mais restent aléatoires. Sans voiture, les plages et sites du Sud sont difficilement accessibles.",
    lignes: [
      { type: "Citadine (2 pers.)", prix: "40-50€/j", note: "Suffisant pour 2, routes de montagne incluses" },
      { type: "Compact (4 pers.)", prix: "55-65€/j", note: "Confort correct, coffre pour les affaires de plage" },
      { type: "SUV / Grand break", prix: "70-80€/j", note: "Recommandé pour les groupes ou avec enfants" },
      { type: "Location à l'aéroport", prix: "+10-15%", note: "Pratique mais majorée — comparer Sixt/Europcar/locaux" },
    ],
    astuce: "Louez via un prestataire local martiniquais : souvent 15% moins cher qu'un loueur international, service identique.",
  },
  {
    id: "restaurants",
    titre: "Restaurants & repas",
    icon: "🍽️",
    fourchette: "8 – 40 €/repas",
    detail: "La Martinique a une culture culinaire forte (cuisine créole). Entre le lolos (restaurants de bord de route) et les tables gastronomiques, tous les budgets sont couverts. La grande surface reste l'option la plus économique.",
    lignes: [
      { type: "Lolo / ti-bo-bô", prix: "8-15€/pers", note: "Meilleure option qualité-prix, cuisine créole authentique" },
      { type: "Restaurant assis", prix: "20-35€/pers", note: "Poisson grillé, langouste, ambiance marine" },
      { type: "Table gastronomique", prix: "50-80€/pers", note: "Quelques établissements au Marin ou Fort-de-France" },
      { type: "Grande surface (Carrefour, Leader Price)", prix: "5-8€/repas", note: "Idéal pour les petits-déjeuners et pique-niques plage" },
    ],
    astuce: "Cuisinez les soirs à la villa avec les produits du marché (rhum, épices, poissons frais) : expérience créole et économies garanties.",
  },
  {
    id: "activites",
    titre: "Activités",
    icon: "🤿",
    fourchette: "0 – 80 €/activité",
    detail: "La grande force de la Martinique : les meilleures activités (plages, snorkeling, randonnées) sont gratuites ou très peu chères. Le budget activités est votre variable d'ajustement.",
    lignes: [
      { type: "Plages (Salines, Corps de Garde, Arlet)", prix: "Gratuit", note: "100% des plages publiques, accès libre" },
      { type: "Snorkeling (masque + tuba)", prix: "5-10€/j", note: "Location sur place aux grandes plages" },
      { type: "Distilleries (Trois-Rivières, Clément)", prix: "0-15€", note: "Trois-Rivières gratuite, Clément ~15€ avec musée" },
      { type: "Catamaran (demi-journée)", prix: "60-80€/pers", note: "Fonds blancs, Sainte-Anne, Diamant" },
      { type: "Canyoning Gorges de la Falaise", prix: "30-40€/pers", note: "Inclut guide + équipement" },
      { type: "Plongée bouteille", prix: "50-70€/plongée", note: "Épaves de Saint-Pierre, récifs du Sud" },
    ],
    astuce: "Les tortues d'Arlet = gratuit. Nagez juste en face de l'église. C'est l'activité phare de l'île et ça ne coûte rien.",
  },
];

const BUDGETS = [
  {
    profil: "Économique",
    emoji: "💡",
    couleur: "#16a34a",
    total: "~100 €/j",
    hebergement: "70€ (studio 2 pers., partagé)",
    repas: "15€ (lolos + grande surface)",
    voiture: "20€ (partagée entre 2)",
    activites: "5€ (plages gratuites, 1 masque)",
    note: "Possible si vous cuisinez le matin, visez les lolos le midi, et profitez des plages gratuites l'après-midi.",
  },
  {
    profil: "Confort",
    emoji: "✅",
    couleur: CORAL,
    total: "~170 €/j",
    hebergement: "100€ (appartement 4 pers., partagé)",
    repas: "35€ (1 resto assis + grande surface)",
    voiture: "28€ (compact 4 pers., partagée)",
    activites: "20€ (snorkeling + 1 distillerie)",
    note: "Le budget le plus courant. Bonne expérience, confort acceptable, 1-2 activités payantes par semaine.",
  },
  {
    profil: "Luxe",
    emoji: "⭐",
    couleur: GOLD,
    total: "~280 €/j",
    hebergement: "140€ (villa avec piscine, 8 pers., partagé)",
    repas: "60€ (restaurants, terrasse mer)",
    voiture: "35€ (SUV, partagé)",
    activites: "55€ (catamaran + plongée)",
    note: "Toutes les activités premium, repas en terrasse vue mer chaque soir, villa avec piscine. Martinique à son meilleur.",
  },
];

const FAQ = [
  { q: "La Martinique est-elle chère ?", a: "Relativement oui, car c'est un DOM français avec des prix proches de la métropole (parfois supérieurs sur les produits importés). Mais les plages, randonnées et marchés locaux sont gratuits — ce qui compense si vous jouez bien le jeu." },
  { q: "Peut-on vivre avec 80€/j en Martinique ?", a: "C'est serré mais possible pour une personne seule : hébergement en studio partagé à 35€/nuit (par tête), repas lolos 10€, moitié d'une voiture 20€. Les plages sont gratuites. Évitez les activités payantes et cuisinez le matin." },
  { q: "Quand sont les prix les moins chers ?", a: "Mai, juin début, et novembre : basse saison touristique. Les vols baissent de 100-200€ et les hébergements de 20-30%. La météo est plus capricieuse (quelques averses) mais les journées restent belles." },
  { q: "Est-ce qu'un groupe de 6 peut y aller pas cher ?", a: "Oui — à 6 dans une villa à 180€/nuit, chaque personne paie 30€ d'hébergement. Ajoutez une voiture partagée (10€/pers/j) : le séjour devient très abordable, avec plus de confort qu'un hôtel." },
  { q: "Faut-il réserver longtemps à l'avance ?", a: "En haute saison (déc-avr, juil-août) : 2-3 mois minimum pour les vols et les villas avec piscine. En basse saison, 3-4 semaines suffisent. Les loitures s'épuisent vite à l'aéroport — réservez avant." },
];

const css = `
  .gb-section-label {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: ${CORAL};
    margin-bottom: 10px;
  }
  .gb-h2 {
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    font-size: clamp(26px, 4vw, 38px);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${NAVY};
    margin: 0 0 32px;
    line-height: 1.1;
  }
  .gb-poste {
    background: ${CREAM};
    border: 1px solid ${SAND};
    border-radius: 16px;
    padding: 28px 32px;
    margin-bottom: 24px;
  }
  .gb-poste-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 18px;
  }
  .gb-poste-icon {
    font-size: 32px;
    line-height: 1;
    flex-shrink: 0;
  }
  .gb-poste-title {
    font-family: 'Jost', sans-serif;
    font-size: 18px;
    font-weight: 500;
    color: ${NAVY};
    margin: 0 0 4px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .gb-poste-range {
    font-family: 'Jost', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: ${CORAL};
  }
  .gb-poste-desc {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 17px;
    line-height: 1.75;
    color: ${TEXT};
    margin: 0 0 20px;
  }
  .gb-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }
  .gb-table th {
    font-family: 'Jost', sans-serif;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: ${MUTED};
    padding: 8px 12px;
    text-align: left;
    background: rgba(14,59,58,0.04);
    border-bottom: 1px solid ${SAND};
  }
  .gb-table td {
    font-family: 'Jost', sans-serif;
    font-size: 13px;
    color: ${TEXT};
    padding: 10px 12px;
    border-bottom: 1px solid rgba(232,224,208,0.6);
    vertical-align: top;
    line-height: 1.4;
  }
  .gb-table tr:last-child td { border-bottom: none; }
  .gb-table .prix { font-weight: 600; color: ${NAVY}; white-space: nowrap; }
  .gb-table .note { font-size: 11px; color: ${MUTED}; }
  .gb-astuce {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: rgba(196,114,84,0.07);
    border: 1px solid rgba(196,114,84,0.2);
    border-radius: 8px;
    padding: 12px 16px;
  }
  .gb-astuce-text {
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    color: ${NAVY};
    line-height: 1.55;
    font-style: italic;
  }
  .gb-budget-card {
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid ${SAND};
  }
  .gb-budget-header {
    padding: 20px 24px;
  }
  .gb-budget-label {
    font-family: 'Jost', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .gb-budget-total {
    font-family: 'Jost', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: ${NAVY};
    margin-bottom: 2px;
  }
  .gb-budget-body {
    background: ${CREAM};
    padding: 16px 20px;
  }
  .gb-budget-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid rgba(232,224,208,0.5);
  }
  .gb-budget-row:last-child { border-bottom: none; }
  .gb-budget-cat {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    color: ${MUTED};
  }
  .gb-budget-val {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: ${NAVY};
  }
  .gb-budget-note {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 13px;
    color: ${MUTED};
    line-height: 1.55;
    padding: 10px 20px 16px;
    background: ${CREAM};
    font-style: italic;
  }
  @media (max-width: 680px) {
    .gb-poste { padding: 20px 18px; }
    .gb-table th, .gb-table td { padding: 8px 8px; font-size: 11px; }
  }
`;

export default function GuideBudget() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta
        title="Budget vacances Martinique 2026 — Combien prévoir ? Guide complet"
        description="Hébergement, voiture, restos, activités : notre guide budget pour partir en Martinique. Tableau récapitulatif par profil voyageur (économique à confort)."
        canonical="/guide-budget-vacances-martinique"
        image={HERO_IMG}
        type="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Budget vacances Martinique 2026 — Combien prévoir ?",
        "description": "Hébergement, vols, voiture, restaurants, activités : guide budget complet pour la Martinique avec tableau par profil voyageur.",
        "url": `${BASE}/guide-budget-vacances-martinique`,
        "image": HERO_IMG,
        "author": { "@type": "Organization", "name": "Résidence Amaryllis", "url": BASE },
        "publisher": { "@id": `${BASE}/#organization` },
        "datePublished": "2026-01-01",
        "dateModified": "2026-06-01",
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>
        <ReadingProgressBar ctaHref="/" />
        <GuideStickyNav
          links={[
            { label: "Postes", href: "#postes" },
            { label: "Tableau", href: "#tableau" },
          ]}
        />

        <GuideHero
          img={HERO_IMG}
          alt="Plage Martinique — budget vacances"
          eyebrow="Guide pratique · Budget · 2026"
          title="Combien coûte un séjour en Martinique ?"
          subtitle="Chiffres réels, postes de dépenses détaillés, tableau par profil. Par des hôtes qui vivent ici."
          badges={[]}
          navBack={{ href: "/guide-hub", label: "Tous les guides" }}
        />

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 96px" }}>

          {/* INTRO */}
          <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`, borderRadius: 16, padding: "32px 36px", marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, margin: "0 0 10px" }}>Ce qu'il faut savoir d'abord</p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(17px, 2.3vw, 21px)", lineHeight: 1.75, color: IVORY, margin: "0 0 20px" }}>
              La Martinique est un <strong style={{ color: CORAL }}>DOM français</strong> : on paie en euros, les prix sont proches de la métropole (voire supérieurs sur les produits importés). Mais les meilleures choses de l'île — plages, snorkeling avec les tortues, marchés locaux, randonnées — sont <strong style={{ color: CORAL }}>gratuites ou très bon marché</strong>. Un séjour maîtrisé est tout à fait possible.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "Budget serré", val: "~100€/j", note: "(1 pers., tout inclus hors vol)" },
                { label: "Budget confort", val: "~170€/j", note: "(1 pers., tout inclus hors vol)" },
                { label: "Budget luxe", val: "~280€/j", note: "(1 pers., tout inclus hors vol)" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(250,245,233,0.07)", border: "1px solid rgba(250,245,233,0.12)", borderRadius: 10, padding: "14px 20px" }}>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250,245,233,0.5)", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 18, fontWeight: 700, color: CORAL, marginBottom: 2 }}>{s.val}</div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, color: "rgba(250,245,233,0.4)" }}>{s.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* POSTES DE DÉPENSES */}
          <div id="postes" style={{ marginBottom: 16 }}>
            <p className="gb-section-label">Postes de dépenses</p>
            <h2 className="gb-h2">Détail par poste<br />avec chiffres réels</h2>
          </div>

          {POSTES.map(p => (
            <div key={p.id} className="gb-poste">
              <div className="gb-poste-header">
                <span className="gb-poste-icon">{p.icon}</span>
                <div>
                  <div className="gb-poste-title">{p.titre}</div>
                  <div className="gb-poste-range">{p.fourchette}</div>
                </div>
              </div>
              <p className="gb-poste-desc">{p.detail}</p>
              <table className="gb-table">
                <thead>
                  <tr>
                    <th>Option</th>
                    <th>Prix</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {p.lignes.map((l, i) => (
                    <tr key={i}>
                      <td>{l.type}</td>
                      <td className="prix">{l.prix}</td>
                      <td className="note">{l.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="gb-astuce">
                <span style={{ fontSize: 16 }}>💡</span>
                <p className="gb-astuce-text">{p.astuce}</p>
              </div>
            </div>
          ))}

          {/* TABLEAU RÉCAPITULATIF */}
          <div id="tableau" style={{ marginBottom: 64, marginTop: 64 }}>
            <p className="gb-section-label">Récapitulatif</p>
            <h2 className="gb-h2">Budget par profil<br />tout inclus (hors vol)</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {BUDGETS.map(b => (
                <div key={b.profil} className="gb-budget-card">
                  <div className="gb-budget-header" style={{ background: `${b.couleur}15`, borderBottom: `2px solid ${b.couleur}` }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{b.emoji}</div>
                    <div className="gb-budget-label" style={{ color: b.couleur }}>{b.profil}</div>
                    <div className="gb-budget-total">{b.total}</div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, color: MUTED }}>par personne / jour</div>
                  </div>
                  <div className="gb-budget-body">
                    {[
                      { cat: "Hébergement", val: b.hebergement },
                      { cat: "Repas", val: b.repas },
                      { cat: "Voiture", val: b.voiture },
                      { cat: "Activités", val: b.activites },
                    ].map(r => (
                      <div key={r.cat} className="gb-budget-row">
                        <span className="gb-budget-cat">{r.cat}</span>
                        <span className="gb-budget-val">{r.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="gb-budget-note">{b.note}</div>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: MUTED, marginTop: 12, fontStyle: "italic" }}>
              Estimations basées sur les observations 2025-2026 · Hors vols · Calculs pour 1 personne en groupe (hébergement et voiture partagés)
            </p>
          </div>

          {/* ASTUCES ÉCONOMIES */}
          <div style={{ marginBottom: 64 }}>
            <p className="gb-section-label">Pour aller plus loin</p>
            <h2 className="gb-h2">5 astuces pour<br />réduire la note</h2>
            <div>
              {[
                { num: "01", titre: "Réservez en direct, sans commission", texte: "Airbnb et Booking prennent 15-20% de frais de service — répercutés sur le prix affiché. Réserver directement sur villamaryllis.com vous économise cette commission, à service identique (voire supérieur : vous avez un contact humain)." },
                { num: "02", titre: "Faites vos courses en grande surface", texte: "Un Carrefour ou Leader Price est présent dans toutes les grandes communes. Petit-déjeuner à la villa, pique-nique à la plage : 5-8€/pers vs 20€ minimum au restaurant. Gardez le restaurant pour le midi ou le soir uniquement." },
                { num: "03", titre: "Voyagez en basse saison", texte: "Mai, juin début ou novembre : vols 150-200€ moins chers, hébergements à -25%. La météo est capricieuse mais pas dramatique — et les plages sont désertes. Certains voyageurs préfèrent ouvertement la basse saison." },
                { num: "04", titre: "Partagez voiture et villa en groupe", texte: "À 4 ou 6 personnes, une villa à 180€/nuit revient à 30€/pers. Une voiture à 55€/j partagée = 14€/pers. Le calcul change radicalement. La Martinique est idéale pour les voyages en groupe." },
                { num: "05", titre: "Priorisez les activités gratuites", texte: "Les tortues d'Arlet, les Salines, la plage du Corps de Garde, la forêt de Montravail, les marchés — les meilleures expériences de Martinique ne coûtent rien. Réservez les sorties payantes (catamaran, plongée) pour 1 ou 2 temps forts." },
              ].map(a => (
                <div key={a.num} style={{ display: "flex", gap: 24, paddingBottom: 24, marginBottom: 24, borderBottom: `1px solid ${SAND}` }}>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 32, fontWeight: 700, color: `${CORAL}30`, lineHeight: 1, flexShrink: 0, minWidth: 48 }}>{a.num}</div>
                  <div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 600, color: NAVY, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>{a.titre}</div>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, lineHeight: 1.75, color: TEXT, margin: 0 }}>{a.texte}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, marginBottom: 14 }}>Meilleur rapport qualité-prix</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 4vw, 42px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 16px", lineHeight: 1.1 }}>
              Réservez en direct<br />et économisez 15-20%
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: MUTED, maxWidth: 480, margin: "0 auto 32px" }}>
              Studio Mabouya dès 70€/nuit · Appartements à partir de 90€ · Villas avec piscine dès 180€ — pas de frais Airbnb ni Booking.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/" style={{
                display: "inline-block", padding: "15px 40px",
                background: NAVY, color: IVORY, borderRadius: 10,
                textDecoration: "none", fontFamily: "'Jost', sans-serif",
                fontSize: 13, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
              }}>
                Voir les disponibilités
              </a>
              <a href="/guide-itineraire-une-semaine-sud-martinique" style={{
                display: "inline-block", padding: "15px 32px",
                background: "transparent", color: NAVY, borderRadius: 10,
                textDecoration: "none", fontFamily: "'Jost', sans-serif",
                fontSize: 13, fontWeight: 400, letterSpacing: "0.1em", textTransform: "uppercase",
                border: `1px solid ${SAND}`,
              }}>
                Itinéraire 7 jours
              </a>
            </div>
          </div>

        </div>

        <BridgeVilla
          villaId="mabouya"
          lieu="la Martinique"
          tempsRoute=""
          copy="Le studio Mabouya dès 70€/nuit en réservation directe — sans commission Airbnb ni Booking, le meilleur rapport qualité-prix à Sainte-Luce."
        />

        {/* FAQ */}
        <section style={{ maxWidth: 760, margin: "48px auto", padding: "0 24px" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: 30, color: NAVY, textAlign: "center", margin: "0 0 24px" }}>Questions fréquentes</h2>
          {FAQ.map((f, i) => (
            <details key={i} style={{ borderTop: `1px solid ${SAND}`, padding: "14px 0" }}>
              <summary style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 15, color: NAVY, cursor: "pointer" }}>{f.q}</summary>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 14, color: MUTED, lineHeight: 1.6, margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </section>

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-budget" />
        </div>

        <footer style={{ background: NAVY, padding: "40px 24px", textAlign: "center" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Amaryllis</a>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { href: "/", label: "Villas" },
              { href: "/sainte-luce-martinique", label: "Sainte-Luce" },
              { href: "/meilleure-saison-martinique", label: "Quand partir" },
              { href: "/guide-itineraire-une-semaine-sud-martinique", label: "Itinéraire 7j" },
              { href: "/activites-sainte-luce", label: "Activités" },
              { href: "/guide-hub", label: "Explorer" },
            ].map(l => (
              <a key={l.href} href={l.href} style={{ color: "rgba(250,245,233,0.5)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em" }}>{l.label}</a>
            ))}
          </div>
          <p style={{ color: "rgba(250,245,233,0.3)", fontFamily: "'Jost', sans-serif", fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} Résidence Amaryllis · Sainte-Luce, Martinique</p>
        </footer>

        <MaillageCluster currentSlug="guide-budget-vacances-martinique" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
