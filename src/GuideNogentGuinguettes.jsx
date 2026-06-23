// Guide Guinguettes bord de Marne — /guide-nogent-guinguettes-bord-de-marne

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
  .gui-section { margin-bottom: 56px; }
  .gui-label {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 300;
    letter-spacing: 0.32em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 10px;
  }
  .gui-section h2 {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: clamp(26px, 4vw, 38px);
    letter-spacing: 0.06em; text-transform: uppercase; color: ${NAVY}; margin: 0 0 24px; line-height: 1.1;
  }
  .gui-body {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(17px, 2.2vw, 20px);
    line-height: 1.8; color: ${TEXT}; max-width: 700px; margin-bottom: 28px;
  }
  .gui-card {
    background: #fff; border: 1px solid ${SAND}; border-radius: 16px;
    padding: 28px 32px; margin-bottom: 16px;
  }
  .gui-card-meta {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 8px;
  }
  .gui-card h3 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 16px;
    color: ${NAVY}; margin: 0 0 10px; letter-spacing: 0.03em;
  }
  .gui-card p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: ${TEXT}; margin: 0 0 10px;
  }
  .gui-card p:last-child { margin-bottom: 0; }
  .gui-badge {
    display: inline-block; font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 9px;
    border-radius: 8px; background: rgba(196,114,84,0.1); color: ${CORAL}; margin-top: 6px;
  }
  .gui-highlight {
    background: linear-gradient(135deg, #0a2e2d 0%, ${NAVY} 60%, #163f3e 100%);
    border: 1px solid rgba(196,114,84,0.3); border-radius: 20px;
    padding: 44px 48px; margin-bottom: 60px;
  }
  .gui-highlight h2 {
    font-family: 'Jost', sans-serif; font-weight: 200; font-size: clamp(22px, 3vw, 34px);
    letter-spacing: 0.08em; text-transform: uppercase; color: ${IVORY}; margin: 0 0 28px; line-height: 1.1;
  }
  .gui-hl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .gui-hl-item {
    background: rgba(250,245,233,0.05); border: 1px solid rgba(250,245,233,0.08);
    border-radius: 12px; padding: 20px 22px;
  }
  .gui-hl-item h4 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 12px;
    color: ${CORAL}; margin: 0 0 8px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .gui-hl-item p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px;
    line-height: 1.7; color: rgba(250,245,233,0.82); margin: 0;
  }
  .gui-cal {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 48px;
  }
  .gui-cal-item {
    background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 10px;
    padding: 14px 16px; text-align: center;
  }
  .gui-cal-month {
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 600;
    color: ${NAVY}; letter-spacing: 0.06em; margin-bottom: 6px;
  }
  .gui-cal-desc {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 14px;
    line-height: 1.5; color: ${MUTED};
  }
  .gui-cal-dot {
    width: 8px; height: 8px; border-radius: 50%;
    margin: 6px auto 0; background: ${CORAL}; opacity: 0.4;
  }
  .gui-cal-dot.active { opacity: 1; }
  .gui-faq-item { border-bottom: 1px solid ${SAND}; padding: 22px 0; }
  .gui-faq-item:first-child { border-top: 1px solid ${SAND}; }
  .gui-faq-q {
    font-family: 'Jost', sans-serif; font-weight: 400; font-size: 15px;
    color: ${NAVY}; margin: 0 0 10px;
  }
  .gui-faq-a {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: ${MUTED}; margin: 0;
  }
  @media (max-width: 640px) {
    .gui-highlight { padding: 24px 20px; }
    .gui-hl-grid { grid-template-columns: 1fr; }
    .gui-cal { grid-template-columns: 1fr 1fr; }
    .gui-card { padding: 22px 20px; }
  }
`;

const BIEN_NAMES = {
  amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko",
  mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana",
  nogent: "Appartement Nogent-sur-Marne"
};

export default function GuideNogentGuinguettes() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta
        title="Guinguettes bord de Marne — Nogent, Joinville, guide 2026"
        description="Histoire des guinguettes, meilleures adresses à Nogent-sur-Marne et Joinville-le-Pont, promenades en barque, bases nautiques et calendrier des événements bord de Marne."
        canonical="/guide-nogent-guinguettes-bord-de-marne"
        type="article"
      />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>
        <ReadingProgressBar ctaHref="/" />

        {/* HERO */}
        <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`, padding: "80px 24px 64px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <a href="/guide-hub" style={{ color: "rgba(250,245,233,0.55)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}>← Tous les guides</a>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", margin: "0 0 16px" }}>Guide · Bords de Marne</p>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(32px, 6vw, 56px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 20px", lineHeight: 1.05 }}>
              Guinguettes<br />bord de Marne
            </h1>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(18px, 2.5vw, 22px)", lineHeight: 1.8, color: "rgba(250,245,233,0.75)", maxWidth: 580 }}>
              Depuis le XIXe siècle, les bords de Marne à Nogent et Joinville sont le lieu de villégiature favori des Parisiens. Renoir les a peints. Le musette y a battu son plein. La tradition est vivante.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 96px" }}>

          {/* HISTOIRE */}
          <div className="gui-section">
            <p className="gui-label">Histoire</p>
            <h2>Une tradition depuis<br />le XIXe siècle</h2>
            <p className="gui-body">
              La guinguette est une institution française née sur les bords de Marne, à l'époque où les Parisiens prenaient le train de la Bastille (aujourd'hui la Coulée Verte) pour venir danser, pêcher et manger à la friture le dimanche. Le XIXe siècle voit l'éclosion d'une centaine d'établissements entre Nogent et Joinville.
            </p>
            <p className="gui-body">
              Auguste Renoir immortalise cette tradition dans ses toiles des années 1870-1880 — "La Grenouillère", "Le Déjeuner des canotiers" et de nombreuses scènes de bals en plein air peintes précisément sur les bords de la Marne. Guy de Maupassant décrit la même atmosphère dans ses nouvelles. Ce moment de joie populaire, simple et en plein air, est l'un des visages les plus authentiques de la France d'avant-guerre.
            </p>
            <p className="gui-body">
              Aujourd'hui, quelques établissements maintiennent vivante cette tradition : bals le week-end, accordéon, fritures de carpe, moules marinières et vin blanc sur des tables de bois sous les platanes.
            </p>
          </div>

          {/* GUINGUETTES */}
          <div className="gui-section">
            <p className="gui-label">Les adresses</p>
            <h2>Meilleures guinguettes<br />Nogent &amp; Joinville</h2>

            <div className="gui-card">
              <div className="gui-card-meta">Depuis 1918 · Joinville-le-Pont</div>
              <h3>Chez Gégène</h3>
              <p>La guinguette mère. Fondée en 1918 par Eugène Dejoie — "Gégène" de son surnom — cette institution est inscrite à l'inventaire du patrimoine culturel immatériel de la France. Bals musette chaque week-end de mai à septembre, accordéon live, ambiance rétro totalement authentique.</p>
              <p>Spécialités maison : fritures de chevesne et de perche, moules marinières à la bière, andouillette grillée, vin blanc Muscadet en pichet. Tables en bois sous les platanes, pieds dans le sable en bord de Marne. Arrivez à l'ouverture le dimanche — les tables partent vite.</p>
              <span className="gui-badge">Réservation conseillée</span>
            </div>

            <div className="gui-card">
              <div className="gui-card-meta">Nogent-sur-Marne</div>
              <h3>La Balançoire</h3>
              <p>Guinguette contemporaine installée sur les quais de Nogent, dans l'esprit des anciennes maisons de plaisance de la Marne. Terrasse en bois sur pilotis dominant la rivière, cocktails artisanaux, karaoké le vendredi, concerts de jazz et de variété le samedi. Cuisine de saison, plats à partager.</p>
              <p>L'adresse favorite des 25-40 ans de l'est parisien. Cadre plus moderne que Chez Gégène, mais fidèle à l'esprit "bords de Marne" — l'eau au premier plan, les platanes, la bonne humeur.</p>
            </div>

            <div className="gui-card">
              <div className="gui-card-meta">Joinville &amp; Nogent</div>
              <h3>Guinguettes éphémères de l'été</h3>
              <p>Chaque été (juin à septembre), plusieurs guinguettes pop-up s'installent sur les quais de Nogent et de Joinville. Bars flottants, podiums de bal, food-trucks de cuisine francilienne. L'Office de tourisme du Val-de-Marne publie le calendrier actualisé chaque année en mai. À surveiller depuis notre appartement — certaines sont à 5 minutes à pied.</p>
            </div>
          </div>

          {/* NAUTISME */}
          <div className="gui-highlight">
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Sur l'eau</p>
            <h2>Promenades en barque<br />&amp; activités nautiques</h2>
            <div className="gui-hl-grid">
              {[
                {
                  title: "Location de barques et canoës",
                  desc: "Plusieurs points de location de barques à rames et de canoës sur les bords de Marne à Nogent et Joinville (mai à septembre). Tarifs à l'heure, pas besoin de permis. Idéal en famille — la Marne est un fleuve navigable paisible.",
                },
                {
                  title: "Base nautique de Joinville",
                  desc: "La base nautique de Joinville propose des cours d'aviron, de kayak et de canoë-polo. Stages enfants et adultes, activités à la journée ou à la demi-journée. Réservation en ligne ou sur place.",
                },
                {
                  title: "Promenades en péniche",
                  desc: "Des compagnies proposent des croisières fluviales depuis les quais de Nogent vers Charenton ou Alfortville. Déjeuner ou apéro dînatoire à bord, commentaires sur les bords de Marne historiques.",
                },
                {
                  title: "Pêche bord de Marne",
                  desc: "La Marne est réputée pour ses ablettes, carpes, brèmes et brochets. Les bords de Nogent et Joinville sont jalonnés de pêcheurs dès l'aube le week-end. Carte pêche en ligne, fournitures dans les commerces du quartier.",
                },
              ].map(i => (
                <div key={i.title} className="gui-hl-item">
                  <h4>{i.title}</h4>
                  <p>{i.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CALENDRIER */}
          <div className="gui-section">
            <p className="gui-label">Quand y aller</p>
            <h2>Calendrier des<br />guinguettes &amp; événements</h2>
            <p className="gui-body">
              La pleine saison des guinguettes s'étend de juin à août. Mais chaque mois a sa saveur propre.
            </p>
            <div className="gui-cal">
              {[
                { month: "Janvier – Avril", desc: "Hors saison. Promenades hivernales, tables vides, Marne majestueuse.", active: false },
                { month: "Mai", desc: "Ouverture de saison. Bals le week-end, températures agréables, peu de monde.", active: true },
                { month: "Juin", desc: "Pleine montée en régime. Événements Fête de la Musique (21 juin). Concerts en plein air.", active: true },
                { month: "Juillet – Août", desc: "Haute saison. Guinguettes pleines, bals chaque week-end, pop-ups sur les quais. Réserver.", active: true },
                { month: "Septembre", desc: "Fin de saison idéale : moins de monde, lumière automnale sur la Marne, prix plus doux.", active: true },
                { month: "Octobre – Décembre", desc: "Les guinguettes ferment. Promenades dans les feuilles mortes. Marché de Noël fin novembre.", active: false },
              ].map(c => (
                <div key={c.month} className="gui-cal-item">
                  <div className="gui-cal-month">{c.month}</div>
                  <div className="gui-cal-desc">{c.desc}</div>
                  <div className={`gui-cal-dot${c.active ? " active" : ""}`} />
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, color: MUTED, fontStyle: "italic" }}>
              Conseil : le meilleur moment pour les guinguettes de la Marne est un dimanche de juin ou septembre — foule modérée, lumière belle, terrasses ouvertes.
            </p>
          </div>

          {/* FAQ */}
          <div className="gui-section">
            <p className="gui-label">Vos questions</p>
            <h2>FAQ · Guinguettes<br />bord de Marne</h2>
            <div>
              {[
                {
                  q: "Faut-il réserver pour Chez Gégène ?",
                  a: "Oui, en été (juillet-août) et le dimanche, la réservation est fortement conseillée — surtout si vous êtes plus de 4. Les tables se remplissent dès l'ouverture. En semaine ou en basse saison (mai, septembre), vous pouvez généralement vous présenter sans réservation.",
                },
                {
                  q: "Y a-t-il des concerts dans les guinguettes ?",
                  a: "Oui — Chez Gégène propose des bals avec accordéon chaque week-end de mai à septembre (le dimanche après-midi notamment). La Balançoire à Nogent organise des concerts de jazz et de variété le samedi soir. Le calendrier complet est publié sur les pages Facebook et Instagram des établissements.",
                },
                {
                  q: "Peut-on louer une barque à Nogent sans permis ?",
                  a: "Oui. La location de barques à rames et de canoës ne nécessite pas de permis bateau. Plusieurs loueurs opèrent sur les quais de Nogent et Joinville de mai à septembre. Tarif indicatif : 15-20€/heure. Les enfants doivent porter un gilet de sauvetage fourni par le loueur.",
                },
              ].map(faq => (
                <div key={faq.q} className="gui-faq-item">
                  <p className="gui-faq-q">{faq.q}</p>
                  <p className="gui-faq-a">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <BridgeVilla
            villaId="nogent"
            lieu="les guinguettes de la Marne"
            tempsRoute="5 min à pied"
            copy="Les guinguettes à 5 minutes à pied — Appartement Nogent, au bord de la Marne, réservation directe."
          />

          <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`, borderRadius: 20, padding: "52px 40px", textAlign: "center" }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Réservation directe</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 4vw, 38px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 18px", lineHeight: 1.1 }}>
              Dormir à 5 min<br />des guinguettes
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: "rgba(250,245,233,0.75)", maxWidth: 480, margin: "0 auto 36px" }}>
              Appartement Nogent-sur-Marne, bord de Marne, guinguettes et promenades à deux pas. Paris en 18 min. Réservation directe dès 90€/nuit.
            </p>
            <a href="/nogent" style={{ display: "inline-block", padding: "16px 42px", background: CORAL, color: IVORY, borderRadius: 10, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Voir l'appartement
            </a>
          </div>

        </div>

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-nogent-guinguettes" />
        </div>

        <footer style={{ background: NAVY, padding: "40px 24px", textAlign: "center" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Amaryllis</a>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { href: "/nogent", label: "Appartement Nogent" },
              { href: "/guide-que-faire-nogent-sur-marne", label: "Que faire à Nogent" },
              { href: "/guide-ou-dormir-est-paris-nogent", label: "Où dormir à l'est" },
              { href: "/guide-hub", label: "Tous les guides" },
            ].map(l => (
              <a key={l.href} href={l.href} style={{ color: "rgba(250,245,233,0.5)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em" }}>{l.label}</a>
            ))}
          </div>
          <p style={{ color: "rgba(250,245,233,0.3)", fontFamily: "'Jost', sans-serif", fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} Amaryllis Locations · Nogent-sur-Marne</p>
        </footer>

        <MaillageCluster currentSlug="guide-nogent-guinguettes-bord-de-marne" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
