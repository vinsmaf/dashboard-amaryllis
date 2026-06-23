// Guide Où dormir est Paris Nogent — /guide-ou-dormir-est-paris-nogent

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
  .dor-section { margin-bottom: 56px; }
  .dor-label {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 300;
    letter-spacing: 0.32em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 10px;
  }
  .dor-section h2 {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: clamp(26px, 4vw, 38px);
    letter-spacing: 0.06em; text-transform: uppercase; color: ${NAVY}; margin: 0 0 24px; line-height: 1.1;
  }
  .dor-body {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(17px, 2.2vw, 20px);
    line-height: 1.8; color: ${TEXT}; max-width: 700px; margin-bottom: 28px;
  }
  .dor-zone {
    background: #fff; border: 1px solid ${SAND}; border-radius: 14px;
    padding: 26px 30px; margin-bottom: 14px;
  }
  .dor-zone-head {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 12px; gap: 12px; flex-wrap: wrap;
  }
  .dor-zone h3 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 16px;
    color: ${NAVY}; margin: 0; letter-spacing: 0.03em;
  }
  .dor-zone p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: ${TEXT}; margin: 0 0 14px;
  }
  .dor-zone p:last-child { margin-bottom: 0; }
  .dor-tag {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 10px;
    border-radius: 8px; flex-shrink: 0;
  }
  .dor-tag-green { background: rgba(14,59,58,0.08); color: ${NAVY}; }
  .dor-tag-coral { background: rgba(196,114,84,0.12); color: ${CORAL}; }
  .dor-tag-muted { background: rgba(138,128,112,0.1); color: ${MUTED}; }
  .dor-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .dor-chip {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 400;
    background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 100px;
    padding: 5px 12px; color: ${NAVY};
  }
  .dor-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 40px; }
  .dor-stat { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 18px 20px; text-align: center; }
  .dor-stat-val {
    font-family: 'Jost', sans-serif; font-size: 26px; font-weight: 200;
    color: ${NAVY}; letter-spacing: 0.04em; display: block; margin-bottom: 4px;
  }
  .dor-stat-lbl {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.2em; text-transform: uppercase; color: ${MUTED};
  }
  .dor-notre {
    background: linear-gradient(135deg, #0a2e2d 0%, ${NAVY} 60%, #163f3e 100%);
    border: 1px solid rgba(196,114,84,0.3); border-radius: 20px;
    padding: 40px 44px; margin-bottom: 56px;
  }
  .dor-notre h2 {
    font-family: 'Jost', sans-serif; font-weight: 200; font-size: clamp(22px, 3vw, 32px);
    letter-spacing: 0.08em; text-transform: uppercase; color: ${IVORY}; margin: 0 0 24px; line-height: 1.1;
  }
  .dor-notre-item {
    background: rgba(250,245,233,0.05); border: 1px solid rgba(250,245,233,0.08);
    border-radius: 12px; padding: 20px 24px; margin-bottom: 12px;
  }
  .dor-notre-item:last-child { margin-bottom: 0; }
  .dor-notre-item h4 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 12px;
    color: ${CORAL}; margin: 0 0 8px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .dor-notre-item p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: rgba(250,245,233,0.82); margin: 0;
  }
  .dor-faq-item { border-bottom: 1px solid ${SAND}; padding: 22px 0; }
  .dor-faq-item:first-child { border-top: 1px solid ${SAND}; }
  .dor-faq-q {
    font-family: 'Jost', sans-serif; font-weight: 400; font-size: 15px;
    color: ${NAVY}; margin: 0 0 10px;
  }
  .dor-faq-a {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: ${MUTED}; margin: 0;
  }
  @media (max-width: 640px) {
    .dor-notre { padding: 24px 20px; }
    .dor-grid3 { grid-template-columns: 1fr 1fr; }
    .dor-zone { padding: 20px 22px; }
    .dor-zone-head { flex-direction: column; }
  }
  @media (max-width: 420px) {
    .dor-grid3 { grid-template-columns: 1fr; }
  }
`;

const BIEN_NAMES = {
  amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko",
  mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana",
  nogent: "Appartement Nogent-sur-Marne"
};

export default function GuideNogentDormir() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta
        title="Où dormir à l'est de Paris — Nogent-sur-Marne et alternatives 2026"
        description="Alternatives aux hôtels intra-muros : Nogent-sur-Marne, Vincennes, Saint-Maur-des-Fossés. Calme, nature et RER A à moins de 20 minutes du centre de Paris."
        canonical="/guide-ou-dormir-est-paris-nogent"
        type="article"
      />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>
        <ReadingProgressBar ctaHref="/" />

        {/* HERO */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`, padding: "80px 24px 64px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <a href="/guide-hub" style={{ color: "rgba(250,245,233,0.55)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}>← Tous les guides</a>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", margin: "0 0 16px" }}>Guide · Est parisien</p>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(32px, 6vw, 54px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 20px", lineHeight: 1.05 }}>
              Où dormir à<br />l'est de Paris
            </h1>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(18px, 2.5vw, 22px)", lineHeight: 1.8, color: "rgba(250,245,233,0.75)", maxWidth: 600 }}>
              Moins cher qu'intra-muros, plus calme, avec de la nature : Nogent-sur-Marne, Vincennes, Saint-Maur. Paris en 18 minutes. Notre guide des meilleures alternatives à l'hôtel parisien classique.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 96px" }}>

          {/* INTRO */}
          <div className="dor-section">
            <p className="dor-label">Pourquoi l'est parisien</p>
            <h2>Dormir à l'est de Paris —<br />le bon calcul</h2>
            <p className="dor-body">
              Loger intra-muros à Paris coûte cher, les logements sont petits, le bruit est permanent et le stationnement impossible. L'est parisien (Val-de-Marne) propose autre chose : de l'espace, du calme, de la verdure, et un accès au centre de Paris en 18 minutes par le RER A — pour un prix au mètre carré deux à trois fois moindre.
            </p>
            <div className="dor-grid3">
              {[
                { val: "18 min", lbl: "Paris-Nation en RER A" },
                { val: "−40%", lbl: "Vs hôtel intra-muros" },
                { val: "930 ha", lbl: "Bois de Vincennes" },
              ].map(s => (
                <div key={s.lbl} className="dor-stat">
                  <span className="dor-stat-val">{s.val}</span>
                  <span className="dor-stat-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* NOGENT */}
          <div className="dor-section">
            <p className="dor-label">Option n°1</p>
            <h2>Nogent-sur-Marne —<br />notre choix premier</h2>
            <p className="dor-body">
              Classée "Ville d'art et d'histoire", Nogent est posée sur les bords de Marne à 12 km de Notre-Dame. C'est la ville qui combine le mieux nature, patrimoine et accès ferroviaire direct à Paris.
            </p>

            <div className="dor-zone">
              <div className="dor-zone-head">
                <h3>Nogent-sur-Marne</h3>
                <span className="dor-tag dor-tag-green">Meilleur rapport global</span>
              </div>
              <p>Guinguettes légendaires en bord de Marne, promenade fluviale, Musée des Années 30 (à Boulogne, 30 min), marché plein air mercredi et samedi, RER A direct Paris-Nation (18 min). Vie de quartier authentique avec ses commerces en centre-ville, pas de zone touristique saturée.</p>
              <p>Le Château de Vincennes est à 5 minutes en voiture, le Bois de Vincennes à 10 minutes. Pour un séjour "calme et connecté à Paris", Nogent est imbattable.</p>
              <div className="dor-chips">
                <span className="dor-chip">RER A direct Paris</span>
                <span className="dor-chip">Bords de Marne</span>
                <span className="dor-chip">Guinguettes</span>
                <span className="dor-chip">Vie de village</span>
                <span className="dor-chip">Château Vincennes 5 min</span>
              </div>
            </div>
          </div>

          {/* VINCENNES */}
          <div className="dor-section">
            <p className="dor-label">Option n°2</p>
            <h2>Vincennes —<br />le plus urbain de l'est</h2>

            <div className="dor-zone">
              <div className="dor-zone-head">
                <h3>Vincennes</h3>
                <span className="dor-tag dor-tag-coral">Un peu plus cher</span>
              </div>
              <p>Vincennes est la ville la plus dense et la plus animée de la première couronne est. Directement connectée à Paris par le RER A (arrêt Vincennes) et la ligne 1 du métro, elle offre une ambiance plus urbaine que Nogent avec ses rues commerçantes, ses restaurants et sa vie de quartier bien développée.</p>
              <p>L'atout majeur : le Château de Vincennes (médiéval, remarquablement préservé) et la porte d'entrée principale du Bois de Vincennes et du Zoo de Paris. Logements moins spacieux qu'à Nogent, mais idéaux pour 2 personnes.</p>
              <div className="dor-chips">
                <span className="dor-chip">Métro ligne 1</span>
                <span className="dor-chip">RER A</span>
                <span className="dor-chip">Château médiéval</span>
                <span className="dor-chip">Zoo Paris</span>
              </div>
            </div>
          </div>

          {/* ALTERNATIVES */}
          <div className="dor-section">
            <p className="dor-label">Autres options</p>
            <h2>Saint-Maur-des-Fossés<br />&amp; Joinville-le-Pont</h2>

            <div className="dor-zone">
              <div className="dor-zone-head">
                <h3>Saint-Maur-des-Fossés</h3>
                <span className="dor-tag dor-tag-muted">Résidentiel &amp; calme</span>
              </div>
              <p>Grande commune résidentielle en méandre de Marne. Beaucoup d'espace vert, maisons avec jardin, bords de rivière agréables. RER A (3 gares : La Varenne-Chennevières, Saint-Maur-Créteil, Champigny) permet de rejoindre Paris en 20-25 minutes. Idéal pour les familles voulant un logement avec extérieur.</p>
              <div className="dor-chips">
                <span className="dor-chip">RER A</span>
                <span className="dor-chip">Bords de Marne</span>
                <span className="dor-chip">Résidentiel calme</span>
              </div>
            </div>

            <div className="dor-zone">
              <div className="dor-zone-head">
                <h3>Joinville-le-Pont</h3>
                <span className="dor-tag dor-tag-muted">Guinguettes &amp; convivialité</span>
              </div>
              <p>Joinville est le cœur historique des guinguettes de la Marne. Chez Gégène (la guinguette mythique) y est installée depuis 1918. Village animé les week-ends de printemps et d'été, avec une ambiance festive et populaire. Logements moins nombreux que Nogent, mais l'expérience bord de Marne y est maximale.</p>
              <div className="dor-chips">
                <span className="dor-chip">Chez Gégène</span>
                <span className="dor-chip">Guinguettes emblématiques</span>
                <span className="dor-chip">Bals musette</span>
              </div>
            </div>
          </div>

          {/* NOTRE APPART */}
          <div className="dor-notre">
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Notre appartement</p>
            <h2>L'appartement Nogent —<br />au bord de la Marne</h2>
            <div className="dor-notre-item">
              <h4>Situation</h4>
              <p>Directement sur les bords de la Marne, à 5 minutes à pied des guinguettes et du centre-ville de Nogent. Calme absolu, vue sur la rivière, quartier résidentiel préservé.</p>
            </div>
            <div className="dor-notre-item">
              <h4>Accès Paris</h4>
              <p>Gare RER A Nogent-sur-Marne à 8 minutes à pied. Paris-Nation en 18 minutes, Châtelet en 22 minutes, La Défense en 35 minutes. Connexion directe à toutes les lignes de métro depuis Nation.</p>
            </div>
            <div className="dor-notre-item">
              <h4>Pourquoi réserver en direct</h4>
              <p>Dès 90€ la nuit en réservation directe, sans frais de plateforme. Vos hôtes vous répondent directement pour les questions sur le quartier, les guinguettes, le stationnement ou l'accès. Flexibilité maximale sur les horaires d'arrivée et de départ.</p>
            </div>
          </div>

          {/* FAQ */}
          <div className="dor-section">
            <p className="dor-label">Vos questions</p>
            <h2>FAQ · Dormir<br />à l'est de Paris</h2>
            <div>
              {[
                {
                  q: "Combien de temps pour rejoindre Paris depuis Nogent ?",
                  a: "18 minutes depuis la gare de Nogent-sur-Marne jusqu'à Paris-Nation en RER A (départs toutes les 10-15 min). Nation est le nœud central de l'Est parisien — lignes 1, 2, 6, 9 et RER A. Comptez 25 minutes porte-à-porte pour rejoindre le Marais ou le centre de Paris.",
                },
                {
                  q: "La voiture est-elle nécessaire pour loger à Nogent ?",
                  a: "Non. Nogent fonctionne très bien sans voiture : le centre est à pied, la gare RER est à 8 minutes, les commerces sont dans le quartier. La voiture n'est utile que pour explorer les environs (Fontainebleau, Versailles) ou pour aller directement à l'aéroport Charles-de-Gaulle (45 min). Stationnement gratuit disponible à l'appartement.",
                },
                {
                  q: "Quel est le prix moyen d'une nuit à Nogent vs Paris intra-muros ?",
                  a: "Un appartement confortable à Nogent coûte 80-120€ la nuit. Le même standard à Paris intra-muros (arrondissements centraux) dépasse facilement 150-200€ pour une qualité similaire, voire inférieure (appartements plus petits, bruyants). L'est parisien offre objectivement le meilleur rapport qualité/prix pour visiter Paris.",
                },
              ].map(faq => (
                <div key={faq.q} className="dor-faq-item">
                  <p className="dor-faq-q">{faq.q}</p>
                  <p className="dor-faq-a">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <BridgeVilla
            villaId="nogent"
            lieu="Paris"
            tempsRoute="18 min"
            copy="Paris en 18 minutes en RER — Appartement Nogent, bord de Marne, dès 90€/nuit en réservation directe."
          />

          <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`, borderRadius: 20, padding: "52px 40px", textAlign: "center" }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Réservation directe</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 4vw, 38px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 18px", lineHeight: 1.1 }}>
              Paris à 18 min —<br />sans sacrifier le calme
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: "rgba(250,245,233,0.75)", maxWidth: 480, margin: "0 auto 36px" }}>
              Appartement Nogent-sur-Marne, bord de Marne, calme garanti. Dès 90€/nuit en direct sans frais de plateforme.
            </p>
            <a href="/nogent" style={{ display: "inline-block", padding: "16px 42px", background: CORAL, color: IVORY, borderRadius: 10, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Voir l'appartement
            </a>
          </div>

        </div>

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-ou-dormir-est-paris" />
        </div>

        <footer style={{ background: NAVY, padding: "40px 24px", textAlign: "center" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Amaryllis</a>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { href: "/nogent", label: "Appartement Nogent" },
              { href: "/guide-que-faire-nogent-sur-marne", label: "Que faire à Nogent" },
              { href: "/guide-nogent-guinguettes-bord-de-marne", label: "Guinguettes" },
              { href: "/guide-hub", label: "Tous les guides" },
            ].map(l => (
              <a key={l.href} href={l.href} style={{ color: "rgba(250,245,233,0.5)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em" }}>{l.label}</a>
            ))}
          </div>
          <p style={{ color: "rgba(250,245,233,0.3)", fontFamily: "'Jost', sans-serif", fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} Amaryllis Locations · Nogent-sur-Marne</p>
        </footer>

        <MaillageCluster currentSlug="guide-ou-dormir-est-paris-nogent" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
