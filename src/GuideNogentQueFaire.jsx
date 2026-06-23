// Guide Que faire à Nogent-sur-Marne — /guide-que-faire-nogent-sur-marne

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
  .nog-section { margin-bottom: 56px; }
  .nog-label {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 300;
    letter-spacing: 0.32em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 10px;
  }
  .nog-section h2 {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: clamp(26px, 4vw, 38px);
    letter-spacing: 0.06em; text-transform: uppercase; color: ${NAVY}; margin: 0 0 24px; line-height: 1.1;
  }
  .nog-body {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(17px, 2.2vw, 20px);
    line-height: 1.8; color: ${TEXT}; max-width: 700px; margin-bottom: 28px;
  }
  .nog-card {
    background: #fff; border: 1px solid ${SAND}; border-radius: 14px;
    padding: 26px 30px; margin-bottom: 14px;
  }
  .nog-card-meta {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 8px;
  }
  .nog-card h3 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 15px;
    color: ${NAVY}; margin: 0 0 10px; letter-spacing: 0.03em;
  }
  .nog-card p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: ${TEXT}; margin: 0;
  }
  .nog-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 40px; }
  .nog-info { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 18px 20px; }
  .nog-info-label {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.25em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 6px;
  }
  .nog-info-value {
    font-family: 'Jost', sans-serif; font-size: 13px; color: ${NAVY}; line-height: 1.5;
  }
  .nog-faq-item { border-bottom: 1px solid ${SAND}; padding: 22px 0; }
  .nog-faq-item:first-child { border-top: 1px solid ${SAND}; }
  .nog-faq-q {
    font-family: 'Jost', sans-serif; font-weight: 400; font-size: 15px;
    color: ${NAVY}; margin: 0 0 10px;
  }
  .nog-faq-a {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: ${MUTED}; margin: 0;
  }
  .nog-highlight {
    background: linear-gradient(135deg, #0a2e2d 0%, ${NAVY} 60%, #163f3e 100%);
    border: 1px solid rgba(196,114,84,0.3); border-radius: 20px; padding: 40px 44px; margin-bottom: 56px;
  }
  .nog-highlight h2 {
    font-family: 'Jost', sans-serif; font-weight: 200; font-size: clamp(22px, 3vw, 32px);
    letter-spacing: 0.08em; text-transform: uppercase; color: ${IVORY}; margin: 0 0 24px; line-height: 1.1;
  }
  .nog-hl-item {
    background: rgba(250,245,233,0.05); border: 1px solid rgba(250,245,233,0.08);
    border-radius: 12px; padding: 20px 24px; margin-bottom: 12px;
  }
  .nog-hl-item:last-child { margin-bottom: 0; }
  .nog-hl-item h4 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 12px;
    color: ${CORAL}; margin: 0 0 8px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .nog-hl-item p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: rgba(250,245,233,0.82); margin: 0;
  }
  @media (max-width: 640px) {
    .nog-highlight { padding: 24px 20px; }
    .nog-grid2 { grid-template-columns: 1fr; }
    .nog-card { padding: 20px 22px; }
  }
`;

const BIEN_NAMES = {
  amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko",
  mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana",
  nogent: "Appartement Nogent-sur-Marne"
};

export default function GuideNogentQueFaire() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta
        title="Que faire à Nogent-sur-Marne — Guide 2026"
        description="Guinguettes, bord de Marne, Bois de Vincennes, Château de Vincennes, patrimoine des années 30 : notre guide complet de Nogent-sur-Marne et ses environs immédiats."
        canonical="/guide-que-faire-nogent-sur-marne"
        type="article"
      />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>
        <ReadingProgressBar ctaHref="/" />

        {/* HERO */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`, padding: "80px 24px 64px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <a href="/guide-hub" style={{ color: "rgba(250,245,233,0.55)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}>← Tous les guides</a>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", margin: "0 0 16px" }}>Guide · Nogent-sur-Marne</p>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(32px, 6vw, 56px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 20px", lineHeight: 1.05 }}>
              Que faire à<br />Nogent-sur-Marne
            </h1>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(18px, 2.5vw, 22px)", lineHeight: 1.8, color: "rgba(250,245,233,0.75)", maxWidth: 580 }}>
              Ville d'art et d'histoire sur les bords de Marne, à 10 minutes du périphérique — guinguettes, patrimoine, forêt et marché. Tout ce qu'il faut savoir avant votre séjour.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 96px" }}>

          {/* INTRO */}
          <div className="nog-section">
            <p className="nog-label">La ville</p>
            <h2>Nogent-sur-Marne,<br />la belle de l'Est parisien</h2>
            <p className="nog-body">
              Nogent-sur-Marne est l'une des villes les plus agréables de la petite couronne parisienne. Posée au bord de la Marne, à moins de 15 km de Notre-Dame-de-Paris, elle bénéficie d'un cadre de verdure exceptionnel pour une ville aussi proche de la capitale — avec le Bois de Vincennes à deux pas et ses célèbres guinguettes en bord de rivière.
            </p>
            <p className="nog-body">
              Classée "Ville d'art et d'histoire", Nogent concentre sur quelques kilomètres carrés : un musée dédié aux Années 30, une architecture Art Déco préservée, des rives aménagées pour la promenade et le nautisme, et une vie commerçante de centre-ville vivante autour de la rue du Marché.
            </p>
            <div className="nog-grid2">
              {[
                { label: "Distance Paris-Nation", value: "18 min en RER A" },
                { label: "Distance Vincennes", value: "5 min en voiture · 20 min à pied" },
                { label: "Bois de Vincennes", value: "Forêt de 930 ha · Zoo · Hippodrome" },
                { label: "Guinguettes Marne", value: "Mai à septembre · concerts le week-end" },
              ].map(i => (
                <div key={i.label} className="nog-info">
                  <div className="nog-info-label">{i.label}</div>
                  <div className="nog-info-value">{i.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* GUINGUETTES */}
          <div className="nog-section">
            <p className="nog-label">Incontournable</p>
            <h2>Guinguettes &amp; bords<br />de Marne</h2>
            <p className="nog-body">
              C'est la raison principale pour laquelle Nogent est connue. Depuis le XIXe siècle, les bords de Marne attirent les Parisiens en quête d'air frais, de bals populaires et de déjeuners en plein air. Renoir y a peint certaines de ses toiles les plus célèbres. La tradition est intacte.
            </p>

            <div className="nog-card">
              <div className="nog-card-meta">Emblématique · Joinville-le-Pont</div>
              <h3>Chez Gégène</h3>
              <p>La guinguette la plus célèbre de la Marne, fondée en 1918 par Eugène Dejoie — dit "Gégène". Bals musette, accordéon, bancs de bois sous les platanes, fritures et moules au bord de l'eau. Ouverte le week-end de mai à septembre. Réservation conseillée en été.</p>
            </div>

            <div className="nog-card">
              <div className="nog-card-meta">Nogent-sur-Marne</div>
              <h3>Terrasses et promenades bord de Marne</h3>
              <p>Nogent possède ses propres terrasses en bord de Marne : le quai de la Marne est piétonnier en saison, avec des guinguettes éphémères, des stands de pêche et des scènes de bal en plein air. L'ambiance est plus locale et moins touristique qu'à Joinville.</p>
            </div>

            <div className="nog-card">
              <div className="nog-card-meta">Toute saison</div>
              <h3>Promenade des bords de Marne</h3>
              <p>Le tour des bords de Marne à pied ou en vélo (15 km balisés depuis Nogent jusqu'à Joinville et Saint-Maur) est la promenade emblématique de la région. Pergolas, jardins flottants, hérons cendrés, grèbes et canards accompagnent le chemin. Accessible depuis notre appartement en 5 minutes à pied.</p>
            </div>
          </div>

          {/* PATRIMOINE */}
          <div className="nog-highlight">
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Ville d'art &amp; d'histoire</p>
            <h2>Patrimoine &amp;<br />culture à Nogent</h2>
            <div className="nog-hl-item">
              <h4>Musée des Années 30 — Boulogne-Billancourt (30 min)</h4>
              <p>Le plus grand musée consacré à l'art des années 1920-1940 en France. Collections de sculptures, meubles, peintures et objets de l'entre-deux-guerres. L'architecture du bâtiment lui-même est une œuvre Art Déco. Accès RER depuis Nogent en 30 minutes.</p>
            </div>
            <div className="nog-hl-item">
              <h4>Château de Vincennes — 5 min</h4>
              <p>Le château royal médiéval le mieux conservé d'Île-de-France : donjon de 52 m, douves, tours, Sainte-Chapelle gothique. À 5 minutes de voiture depuis notre appartement. Visites guidées disponibles, expo temporaires régulières. Incontournable pour les amateurs d'histoire.</p>
            </div>
            <div className="nog-hl-item">
              <h4>Architecture Art Déco de Nogent</h4>
              <p>Nogent est classée "Ville d'art et d'histoire" pour son patrimoine architectural des années 1920-1940 : villas en briques, verrières, ferronneries Art Déco. Un circuit pédestre guidé (disponible à l'Office de tourisme) permet de découvrir les 30 plus belles façades du centre-ville.</p>
            </div>
          </div>

          {/* SHOPPING */}
          <div className="nog-section">
            <p className="nog-label">Commerce &amp; marché</p>
            <h2>Shopping &amp;<br />marché plein air</h2>

            <div className="nog-card">
              <div className="nog-card-meta">Mercredi &amp; samedi matin</div>
              <h3>Marché de Nogent-sur-Marne</h3>
              <p>Le marché plein air se tient deux fois par semaine sur la place centrale. Producteurs locaux, fromagers, maraîchers franciliens, poissonniers. Le samedi matin est le plus animé — ambiance village en pleine banlieue parisienne. Une adresse pour les amateurs de bons produits.</p>
            </div>

            <div className="nog-card">
              <div className="nog-card-meta">Toute la semaine</div>
              <h3>Rue du Marché &amp; commerces du centre</h3>
              <p>Nogent possède un vrai centre-ville commerçant à pied : boulangeries artisanales, épiceries fines, librairies, boutiques de créateurs locaux. La rue du Marché et les rues adjacentes permettent de faire toutes ses courses sans voiture. Idéal pour composer un pique-nique à apporter au bord de la Marne.</p>
            </div>
          </div>

          {/* BOIS DE VINCENNES */}
          <div className="nog-section">
            <p className="nog-label">Nature à 10 minutes</p>
            <h2>Parc de Vincennes<br />&amp; Bois de Vincennes</h2>
            <p className="nog-body">
              Le Bois de Vincennes est le "poumon vert" de l'Est parisien — 930 hectares de forêt, étangs, pelouses, allées cavalières. À 10 minutes de l'appartement en voiture ou 20 minutes à vélo.
            </p>

            <div className="nog-card">
              <div className="nog-card-meta">930 ha · Toute l'année</div>
              <h3>Bois de Vincennes</h3>
              <p>Forêt, lacs (Daumesnil, Saint-Mandé, Gravelle), pistes cyclables, sentiers de course. En famille : aires de jeux, guignol, manège. Pour les sportifs : circuits de footing balisés, terrains de basket, terrain de pétanque. Idéal pour une sortie matinale ou une après-midi en plein air.</p>
            </div>

            <div className="nog-card">
              <div className="nog-card-meta">Zoo de Vincennes</div>
              <h3>Parc Zoologique de Paris</h3>
              <p>L'un des plus grands parcs zoologiques d'Europe, rénové en 2014. 180 espèces, 2000 animaux, biozones reproduisant les habitats naturels (Sahel, Patagonie, Madagascar…). À 15 minutes à pied du château de Vincennes. Idéal avec des enfants ou des passionnés de biodiversité.</p>
            </div>

            <div className="nog-card">
              <div className="nog-card-meta">Hippodrome de Vincennes</div>
              <h3>Hippodrome &amp; Pelouse de Reuilly</h3>
              <p>L'hippodrome de Vincennes est l'une des références mondiales des courses de trot. Événements ouverts au public de septembre à mai. La Pelouse de Reuilly, adjacent, est un espace de pique-nique très prisé des familles est-parisiennes en été.</p>
            </div>
          </div>

          {/* FAQ */}
          <div className="nog-section">
            <p className="nog-label">Vos questions</p>
            <h2>FAQ · Nogent-sur-Marne</h2>
            <div>
              {[
                {
                  q: "Combien de temps pour rejoindre Paris depuis Nogent ?",
                  a: "18 minutes en RER A depuis la gare de Nogent-sur-Marne jusqu'à Nation (ligne directe). Nation est connectée à presque toutes les lignes de métro. Comptez 25 minutes porte-à-porte pour rejoindre le cœur de Paris.",
                },
                {
                  q: "Y a-t-il besoin d'une voiture pour visiter Nogent et les environs ?",
                  a: "Non pour le centre de Nogent et les bords de Marne — tout est accessible à pied depuis notre appartement. Pour le Château de Vincennes ou le Zoo, le RER A + RER/Métro est très pratique. La voiture n'est utile que pour explorer plus loin (Fontainebleau, Provins, Versailles).",
                },
                {
                  q: "Les guinguettes sont-elles ouvertes toute l'année ?",
                  a: "Non — la saison des guinguettes en bord de Marne s'étend de mai à septembre, avec une activité maximum de juin à août. Chez Gégène (la plus emblématique) est ouverte le week-end de mai à fin septembre. Hors saison, les bords de Marne sont magnifiques pour une promenade, mais les terrasses sont fermées.",
                },
              ].map(faq => (
                <div key={faq.q} className="nog-faq-item">
                  <p className="nog-faq-q">{faq.q}</p>
                  <p className="nog-faq-a">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <BridgeVilla
            villaId="nogent"
            lieu="Nogent-sur-Marne"
            tempsRoute="sur place"
            copy="Dormir en bord de Marne — Appartement Nogent, à 5 minutes à pied des guinguettes et du centre-ville."
          />

          <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`, borderRadius: 20, padding: "52px 40px", textAlign: "center" }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Réservation directe</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 4vw, 38px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 18px", lineHeight: 1.1 }}>
              Séjourner au bord<br />de la Marne
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: "rgba(250,245,233,0.75)", maxWidth: 480, margin: "0 auto 36px" }}>
              Appartement Nogent-sur-Marne — calme, guinguettes à 5 min, Paris en 18 min. Réservation directe dès 90€/nuit.
            </p>
            <a href="/nogent" style={{ display: "inline-block", padding: "16px 42px", background: CORAL, color: IVORY, borderRadius: 10, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Voir l'appartement
            </a>
          </div>

        </div>

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-nogent-que-faire" />
        </div>

        <footer style={{ background: NAVY, padding: "40px 24px", textAlign: "center" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Amaryllis</a>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { href: "/nogent", label: "Appartement Nogent" },
              { href: "/guide-hub", label: "Tous les guides" },
              { href: "/guide-ou-dormir-est-paris-nogent", label: "Où dormir à l'est" },
              { href: "/guide-nogent-guinguettes-bord-de-marne", label: "Guinguettes" },
            ].map(l => (
              <a key={l.href} href={l.href} style={{ color: "rgba(250,245,233,0.5)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em" }}>{l.label}</a>
            ))}
          </div>
          <p style={{ color: "rgba(250,245,233,0.3)", fontFamily: "'Jost', sans-serif", fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} Amaryllis Locations · Nogent-sur-Marne</p>
        </footer>

        <MaillageCluster currentSlug="guide-que-faire-nogent-sur-marne" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
