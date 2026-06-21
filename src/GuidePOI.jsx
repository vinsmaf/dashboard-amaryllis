// GuidePOI.jsx — template data-driven pour les guides "lieux cultes" de Martinique
// Le guide affiché est déterminé par window.location.pathname (matché sur GUIDES_POI).
// Contenu : src/data/guidesPoi.js (rédigé par l'agent seo-content-writer).

import SEOMeta from "./SEOMeta.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import { GUIDES_POI } from "./data/guidesPoi.js";
import { GUIDE_PHOTOS } from "./data/guidePhotos.js";

const BIEN_NAMES = { amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko", mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana", nogent: "Appartement Nogent-sur-Marne" };

const NAVY = "#0e3b3a", CORAL = "#c47254", GOLD = "#c9a673";
const IVORY = "#faf5e9", CREAM = "#f4ecdc", SAND = "#e0d4bc", MUTED = "#7a6b5a";

// Emoji + zone par lieu (cohérent avec /explorer)
const META = {
  "cap110": { emoji: "🗽", zone: "Sud" }, "le-marin": { emoji: "⛵", zone: "Sud" },
  "savane-esclaves": { emoji: "🛖", zone: "Sud" }, "pointe-bout": { emoji: "🛥️", zone: "Sud" },
  "balata": { emoji: "🌺", zone: "Centre" }, "clement": { emoji: "🏛️", zone: "Centre" },
  "fort-de-france": { emoji: "🏰", zone: "Centre" }, "caravelle": { emoji: "🥾", zone: "Centre" },
  "montagne-pelee": { emoji: "🌋", zone: "Nord" }, "depaz": { emoji: "🥃", zone: "Nord" },
  "gorges-falaise": { emoji: "🏞️", zone: "Nord" }, "anse-couleuvre": { emoji: "🏝️", zone: "Nord" },
  "grand-riviere": { emoji: "🌊", zone: "Nord" }, "carbet": { emoji: "🎨", zone: "Nord" },
};

const PRATIQUE_LABELS = {
  acces: "🚗 Accès", duree: "⏱️ Durée", tarif: "🎟️ Tarif",
  meilleurMoment: "🌤️ Meilleur moment", conseil: "💡 Conseil d'initié",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
  .gp * { box-sizing: border-box; }
  .gp { font-family: 'Jost', sans-serif; color: ${NAVY}; background: ${IVORY}; margin: 0; }
  .gp-header { background: ${NAVY}; padding: 0 24px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 30; }
  .gp-header a { color: ${IVORY}; text-decoration: none; }
  .gp-brand { font-weight: 300; font-size: 18px; letter-spacing: .15em; text-transform: uppercase; }
  .gp-nav { display: flex; gap: 18px; }
  .gp-nav a { font-size: 12px; letter-spacing: .08em; opacity: .75; }
  .gp-nav a:hover { opacity: 1; color: ${GOLD}; }

  .gp-hero { position: relative; min-height: 360px; display: flex; align-items: flex-end; overflow: hidden;
    background: linear-gradient(135deg, ${NAVY} 0%, #16524f 55%, #1d6b5f 100%); }
  .gp-hero-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .55; z-index: 1; }
  .gp-hero-emoji { position: absolute; right: 4%; top: 50%; transform: translateY(-50%); font-size: 200px; opacity: .14; z-index: 1; }
  .gp-hero::after { content: ""; position: absolute; inset: 0; z-index: 2;
    background: linear-gradient(0deg, rgba(14,59,58,.92) 0%, rgba(14,59,58,.45) 60%, rgba(14,59,58,.25) 100%); }
  .gp-hero-inner { position: relative; z-index: 3; max-width: 960px; margin: 0 auto; width: 100%; padding: 48px 24px 40px; }
  .gp-zone { display: inline-block; background: ${CORAL}; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; padding: 5px 14px; border-radius: 999px; margin-bottom: 16px; }
  .gp-hero .gp-h1 { font-family: 'Jost', sans-serif; font-weight: 300; font-size: clamp(28px, 5vw, 46px); line-height: 1.1; color: ${IVORY} !important; margin: 0; letter-spacing: .01em; text-shadow: 0 2px 16px rgba(0,0,0,.45); }

  .gp-main { max-width: 760px; margin: 0 auto; padding: 44px 24px 0; }
  .gp-intro { font-family: 'Cormorant Garamond', serif; font-size: 21px; line-height: 1.6; color: ${NAVY}; margin: 0 0 40px; }
  .gp-section { margin-bottom: 36px; }
  .gp-h2 { font-weight: 400; font-size: 22px; letter-spacing: .02em; color: ${NAVY}; margin: 0 0 12px; padding-left: 14px; border-left: 3px solid ${CORAL}; }
  .gp-body { font-size: 16px; line-height: 1.75; color: #3a3530; margin: 0; }

  .gp-villas { background: ${CREAM}; border: 1px solid ${SAND}; border-left: 4px solid ${GOLD}; border-radius: 0 12px 12px 0; padding: 22px 26px; margin: 8px 0 44px; }
  .gp-villas-pre { font-size: 10px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: ${GOLD}; margin-bottom: 8px; }
  .gp-villas-txt { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 18px; line-height: 1.55; color: ${NAVY}; }

  .gp-pratique { background: ${NAVY}; border-radius: 16px; padding: 28px 30px; margin-bottom: 44px; }
  .gp-pratique-title { color: ${GOLD}; font-size: 11px; font-weight: 600; letter-spacing: .24em; text-transform: uppercase; margin-bottom: 18px; }
  .gp-pratique-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 28px; }
  .gp-pi-label { font-size: 11px; font-weight: 600; letter-spacing: .1em; color: ${GOLD}; margin-bottom: 4px; }
  .gp-pi-value { font-size: 14px; line-height: 1.5; color: ${IVORY}; opacity: .92; }

  .gp-faq { margin-bottom: 48px; }
  .gp-faq-title { font-weight: 300; font-size: 26px; text-align: center; color: ${NAVY}; margin: 0 0 24px; }
  .gp-faq-item { border-bottom: 1px solid ${SAND}; padding: 16px 0; }
  .gp-faq-q { font-weight: 500; font-size: 16px; color: ${NAVY}; margin: 0 0 6px; }
  .gp-faq-a { font-size: 15px; line-height: 1.65; color: ${MUTED}; margin: 0; }

  .gp-cta { background: linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%); padding: 52px 24px; text-align: center; }
  .gp-cta-pre { color: ${CORAL}; font-size: 10px; font-weight: 600; letter-spacing: .3em; text-transform: uppercase; margin-bottom: 12px; }
  .gp-cta-h { font-family: 'Jost', sans-serif; font-weight: 200; font-size: clamp(22px, 4vw, 32px); color: ${IVORY}; margin: 0 0 22px; letter-spacing: .04em; }
  .gp-cta-btn { display: inline-block; background: ${CORAL}; color: #fff; text-decoration: none; padding: 15px 38px; border-radius: 9px; font-size: 13px; font-weight: 500; letter-spacing: .12em; text-transform: uppercase; transition: background .2s; }
  .gp-cta-btn:hover { background: #a85a3f; }

  .gp-foot-nav { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; padding: 32px 24px; background: ${IVORY}; }
  .gp-foot-nav a { padding: 12px 22px; border: 1px solid ${SAND}; border-radius: 8px; text-decoration: none; color: ${NAVY}; font-size: 13px; letter-spacing: .06em; transition: all .18s; }
  .gp-foot-nav a:hover { border-color: ${CORAL}; color: ${CORAL}; }
  .gp-copy { text-align: center; padding: 22px; background: ${NAVY}; color: rgba(250,245,233,.45); font-size: 12px; }
  .gp-copy a { color: rgba(250,245,233,.45); text-decoration: none; }

  @media (max-width: 640px) {
    .gp-pratique-grid { grid-template-columns: 1fr; }
    .gp-hero-emoji { font-size: 120px; right: -10px; }
  }
`;

export default function GuidePOI() {
  const path = typeof window !== "undefined" ? window.location.pathname.replace(/\/$/, "") : "";
  const guide = GUIDES_POI.find(g => g.slug === path) || GUIDES_POI[0];
  const meta = META[guide.id] || { emoji: "📍", zone: "" };

  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: (guide.faq || []).map(f => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const photo = guide.photo || GUIDE_PHOTOS[guide.id] || "";

  return (
    <div className="gp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <SEOMeta
        title={guide.metaTitle}
        description={guide.metaDescription}
        canonical={guide.slug}
        image={photo || "https://villamaryllis.com/photos/amaryllis/01.webp"}
        type="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* Header */}
      <header className="gp-header">
        <a href="/" className="gp-brand">Amaryllis</a>
        <nav className="gp-nav">
          <a href="/explorer">🗺️ Carte des lieux</a>
          <a href="/guide-hub">Tous les guides</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="gp-hero">
        {photo && <img className="gp-hero-img" src={photo} alt={guide.h1} onError={e => { e.currentTarget.style.display = "none"; }} />}
        <span className="gp-hero-emoji" aria-hidden>{meta.emoji}</span>
        <div className="gp-hero-inner">
          {meta.zone && <span className="gp-zone">{meta.zone} · Martinique</span>}
          <h1 className="gp-h1">{guide.h1}</h1>
        </div>
      </section>

      {/* Contenu */}
      <main className="gp-main">
        <p className="gp-intro">{guide.intro}</p>

        {(guide.sections || []).map((s, i) => (
          <div key={i} className="gp-section">
            <h2 className="gp-h2">{s.h2}</h2>
            <p className="gp-body">{s.body}</p>
          </div>
        ))}

        {guide.depuisNosVillas && (
          <div className="gp-villas">
            <div className="gp-villas-pre">Depuis nos villas</div>
            <div className="gp-villas-txt">{guide.depuisNosVillas}</div>
          </div>
        )}

        {guide.pratique && (
          <div className="gp-pratique">
            <div className="gp-pratique-title">Infos pratiques</div>
            <div className="gp-pratique-grid">
              {Object.entries(PRATIQUE_LABELS).map(([k, label]) =>
                guide.pratique[k] ? (
                  <div key={k}>
                    <div className="gp-pi-label">{label}</div>
                    <div className="gp-pi-value">{guide.pratique[k]}</div>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}

        {guide.faq?.length > 0 && (
          <div className="gp-faq">
            <h2 className="gp-faq-title">Questions fréquentes</h2>
            {guide.faq.map((f, i) => (
              <div key={i} className="gp-faq-item">
                <p className="gp-faq-q">{f.q}</p>
                <p className="gp-faq-a">{f.a}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <MaillageCluster currentSlug={(guide.slug || "").replace(/^\//, "")} bienNames={BIEN_NAMES} />

      {/* CTA */}
      <section className="gp-cta">
        <div className="gp-cta-pre">Votre séjour en Martinique</div>
        <h2 className="gp-cta-h">Posez vos valises dans l'une de nos villas</h2>
        <a className="gp-cta-btn" href="/" data-cta-reservation>{guide.ctaLabel || "Découvrir nos villas"}</a>
      </section>

      {/* Footer nav */}
      <nav className="gp-foot-nav">
        <a href="/explorer">← Retour à la carte des lieux</a>
        <a href="/guide-hub">Tous les guides Martinique</a>
        <a href="/">Nos villas →</a>
      </nav>
      <div className="gp-copy">
        © {new Date().getFullYear()} Amaryllis Locations · <a href="/">villamaryllis.com</a>
      </div>
    </div>
  );
}
