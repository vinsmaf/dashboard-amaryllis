// Guide Le Diamant Martinique — /guide-le-diamant — v2 immersif

import SEOMeta from "./SEOMeta.jsx";
import WikiImg from "./WikiImg.jsx";
import NewsletterForm from "./NewsletterForm.jsx";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const BASE  = "https://villamaryllis.com";

const HERO_IMG  = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Diamond_Rock.jpg/960px-Diamond_Rock.jpg";
const BEACH_IMG = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_03.jpg/960px-Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_03.jpg";
const ROCK_IMG  = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_01.jpg/960px-Rocher_du_Diamant_%28Le_Diamant%2C_Martinique%29_-_01.jpg";

const badges = [
  { icon: "🗿", label: "Site historique unique" },
  { icon: "📍", label: "15 min de Sainte-Luce" },
  { icon: "🤿", label: "Plongée d'exception" },
  { icon: "🌅", label: "Coucher de soleil" },
  { icon: "🏖️", label: "3 km de plage" },
];

const css = `
  .gd-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(250,245,233,0.13); border: 1px solid rgba(250,245,233,0.25);
    border-radius: 100px; padding: 8px 16px;
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 400;
    color: rgba(250,245,233,0.9); letter-spacing: 0.04em; white-space: nowrap;
    backdrop-filter: blur(6px);
  }
  .gd-badge.must { background: rgba(196,114,84,0.3); border-color: rgba(196,114,84,0.6); font-weight: 600; }

  .gd-must {
    background: linear-gradient(135deg, #0a2e2d 0%, #0e3b3a 60%, #163f3e 100%);
    border: 1px solid rgba(196,114,84,0.3); border-radius: 20px; overflow: hidden; margin-bottom: 64px;
  }
  .gd-must-head { padding: 36px 40px 28px; border-bottom: 1px solid rgba(250,245,233,0.08); }
  .gd-must-body { padding: 32px 40px 40px; display: flex; flex-direction: column; gap: 20px; }
  .gd-must-item {
    background: rgba(250,245,233,0.05); border: 1px solid rgba(250,245,233,0.08);
    border-radius: 12px; padding: 22px 26px;
  }
  .gd-must-item h4 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 13px;
    color: ${CORAL}; margin: 0 0 8px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .gd-must-item p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: rgba(250,245,233,0.82); margin: 0;
  }

  .gd-section { margin-bottom: 56px; }
  .gd-card { background: #fff; border: 1px solid ${SAND}; border-radius: 14px; overflow: hidden; margin-bottom: 16px; }
  .gd-card img { width: 100%; height: 240px; object-fit: cover; display: block; }
  .gd-card-body { padding: 24px 28px; }
  .gd-card-body h3 { font-family: 'Jost', sans-serif; font-weight: 500; font-size: 15px; color: ${NAVY}; margin: 0 0 10px; letter-spacing: 0.04em; }
  .gd-card-body p { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px; line-height: 1.75; color: ${TEXT}; margin: 0; }

  .gd-history {
    background: linear-gradient(135deg, #1a3a39 0%, #122f2e 100%);
    border: 1px solid rgba(250,245,233,0.1); border-radius: 16px;
    padding: 32px 36px; margin-bottom: 56px;
    display: flex; gap: 24px; align-items: flex-start;
  }
  .gd-history-icon { font-size: 40px; flex-shrink: 0; line-height: 1; }
  .gd-history p { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px; line-height: 1.8; color: rgba(250,245,233,0.78); margin: 0; }
  .gd-history strong { color: ${CORAL}; font-weight: 500; }

  .gd-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 48px; }
  .gd-info { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 20px 22px; }
  .gd-info-label { font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 6px; }
  .gd-info-value { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 400; color: ${NAVY}; line-height: 1.5; }

  @media (max-width: 640px) {
    .gd-must-head, .gd-must-body { padding: 24px 20px; }
    .gd-must-item { padding: 18px 18px; }
    .gd-grid2 { grid-template-columns: 1fr; }
    .gd-card img { height: 180px; }
    .gd-history { flex-direction: column; gap: 16px; padding: 24px 20px; }
    .gd-badges { gap: 8px !important; }
    .gd-badge { font-size: 11px; padding: 7px 12px; }
  }
`;

export default function GuideDiamant() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
<SEOMeta title="Le Diamant Martinique — Rocher & plongée | Amaryllis" description="Guide complet du Diamant depuis Sainte-Luce (15 min). Plonger autour du Rocher historique, HMS Diamond Rock, plages sauvages — le must absolu du Sud Martinique." canonical="/guide-le-diamant" image="https://villamaryllis.com/photos/amaryllis/01.webp" type="article" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Guide Le Diamant Martinique : rocher, plongée et coucher de soleil",
        "description": "Le Rocher du Diamant — site historique unique, plongée d'exception, 3 km de plage dorée et coucher de soleil inoubliable. À 15 min de Sainte-Luce.",
        "url": `${BASE}/guide-le-diamant`,
        "image": HERO_IMG,
        "author": { "@id": `${BASE}/#organization` },
        "publisher": { "@id": `${BASE}/#organization` },
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>

        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase" }}>Amaryllis</a>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <a href="/guide-hub" style={{ color: IVORY, textDecoration: "none", fontSize: 12, letterSpacing: "0.08em", opacity: 0.6 }}>Explorer Martinique</a>
              <a href="/guide-hub" style={{ color: IVORY, textDecoration: "none", fontSize: 12, letterSpacing: "0.08em", opacity: 0.7 }}>← Tous les guides</a>
            </div>
          </div>
        </header>

        {/* HERO */}
        <div style={{ position: "relative", height: "min(90vh, 620px)", overflow: "hidden" }}>
          <WikiImg src={HERO_IMG} alt="Rocher du Diamant, Martinique"
            loading="eager" fetchPriority="high"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 45%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(14,59,58,0.25) 0%, rgba(14,59,58,0.1) 35%, rgba(14,59,58,0.9) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 32px 48px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
              <p style={{ color: CORAL, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Guide de voyage · Résidence Amaryllis</p>
              <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(32px, 6vw, 64px)", letterSpacing: "0.04em", color: IVORY, textTransform: "uppercase", margin: "0 0 20px", lineHeight: 1.05 }}>
                Le Rocher<br />du Diamant
              </h1>
              <p style={{ color: "rgba(250,245,233,0.9)", fontSize: "clamp(16px, 2.5vw, 20px)", maxWidth: 580, margin: "0 0 28px", lineHeight: 1.6, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Le seul rocher jamais enrôlé dans la Royal Navy. Aujourd'hui, le meilleur spot de plongée de la Martinique. À 15 minutes de nos villas.
              </p>
              <div className="gd-badges" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {badges.map(b => (
                  <span key={b.label} className={`gd-badge${b.icon === "🗿" ? " must" : ""}`}>
                    <span>{b.icon}</span>{b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: "0 auto", padding: "56px 24px 80px" }}>

          {/* MUST ABSOLU */}
          <div className="gd-must">
            <div className="gd-must-head">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <span style={{ fontSize: 32 }}>🗿</span>
                <span style={{ background: CORAL, color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 100 }}>Must absolu</span>
              </div>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 4vw, 34px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 14px", lineHeight: 1.15 }}>
                Plonger autour du Rocher
              </h2>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 19, lineHeight: 1.65, color: "rgba(250,245,233,0.75)", margin: 0, fontStyle: "italic" }}>
                Classé parmi les dix meilleurs spots de plongée des Caraïbes — et tout ça à 15 minutes de la villa.
              </p>
            </div>
            <div className="gd-must-body">
              {[
                { titre: "Ce que vous verrez", texte: "Tombants vertigineux à 40 m couverts de gorgones multicolores, grottes sous-marines peuplées de langoustes, tortues marines qui remontent respirer à la surface, bancs de barracudas et de carangues, raies pastenagues sur le fond de sable. Les coraux sont en état exceptionnel, protégés par l'absence de pollution côtière." },
                { titre: "Pour tous les niveaux", texte: "Plusieurs clubs de plongée au Diamant proposent des baptêmes (à partir de 8 ans, ~55€) et des plongées encadrées pour niveaux 1 à 3. Les sites autour du rocher varient de 8 m (idéal débutants) à 40 m (niveau 2+). En snorkeling, la face nord du rocher est accessible depuis un zodiac — visibilité 15-20 m garantie." },
                { titre: "Le coucher de soleil depuis la plage", texte: "Même si vous ne plongez pas, venez à 17h30. Installez-vous sur la grande plage de sable dorée, commandez un ti-punch au Belem, et regardez le soleil descendre derrière le Rocher. La silhouette de 175 m vire à l'orange, puis au rouge. C'est l'une des images les plus puissantes de la Martinique — et c'est gratuit." },
              ].map(item => (
                <div key={item.titre} className="gd-must-item">
                  <h4>{item.titre}</h4>
                  <p>{item.texte}</p>
                </div>
              ))}
            </div>
          </div>

          {/* HISTOIRE */}
          <div className="gd-history">
            <div className="gd-history-icon">⚓</div>
            <p>En <strong>1804</strong>, les Britanniques s'emparent de ce rocher volcanique de 175 m et le baptisent <strong>HMS Diamond Rock</strong> — seul rocher jamais enrôlé officiellement comme navire de guerre dans la Royal Navy. Ils y installent des canons pour contrôler le détroit et harcèlent la flotte française pendant 17 mois. <strong>Villeneuve</strong>, commandant de la flotte napoléonienne, met 3 jours et 2 000 hommes pour le reprendre en 1805 — quelques mois avant Trafalgar.</p>
          </div>

          {/* PLAGES */}
          <div className="gd-section">
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <span>🏖️</span><span>Les plages du Diamant</span>
            </h2>
            {[
              { nom: "Grande Plage du Diamant — 3 km face au Rocher", img: BEACH_IMG, texte: "La plus longue plage de Martinique. Sable fin doré, vue directe sur le rocher à 1 km. Attention aux courants en bord de mer par fort vent — la plage est exposée à la houle. Idéale pour les promenades au lever du soleil et les photos en fin d'après-midi quand la lumière est rasante." },
              { nom: "Vue panoramique depuis la côte", img: ROCK_IMG, texte: "Depuis la route côtière, plusieurs belvédères permettent de photographier le Rocher avec la mer en premier plan. Le meilleur est à l'entrée ouest du bourg, vers 18h quand le ciel vire à l'orange." },
              { nom: "Anse Cafard — Mémorial de l'esclavage", img: null, texte: "Au nord du bourg, 20 statues de pierre blanche commémorent le naufrage d'un navire négrier en 1830. Site solennel et poignant, vue panoramique sur le rocher. Un moment de recueillement qui complète bien la journée." },
            ].map(item => (
              <div key={item.nom} className="gd-card">
                {item.img && <WikiImg src={item.img} alt={item.nom} loading="lazy" />}
                <div className="gd-card-body">
                  <h3>{item.nom}</h3>
                  <p>{item.texte}</p>
                </div>
              </div>
            ))}
          </div>

          {/* OÙ MANGER */}
          <div className="gd-section">
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
              <span>🍽️</span><span>Où manger</span>
            </h2>
            {[
              { nom: "Le Belem — les pieds dans le sable", texte: "Face au rocher, la table la plus mythique du Diamant. Poissons et langoustes frais du jour, ti-punch artisanal, ambiance créole décontractée. Arrivez pour le coucher de soleil — vous ne repartirez pas avant 21h." },
              { nom: "Marché local du samedi matin", texte: "Tous les samedis, le marché du bourg propose légumes créoles, épices, rhums artisanaux et pâtisseries locales. Une heure d'immersion authentique dans la vie martiniquaise — avant d'aller plonger." },
            ].map(item => (
              <div key={item.nom} className="gd-card">
                <div className="gd-card-body">
                  <h3>{item.nom}</h3>
                  <p>{item.texte}</p>
                </div>
              </div>
            ))}
          </div>

          {/* INFOS PRATIQUES */}
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 22, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 20 }}>
            🗓️ Infos pratiques
          </h2>
          <div className="gd-grid2">
            {[
              { label: "Depuis Sainte-Luce", value: "15 min — N6 vers Rivière-Pilote puis côte caraïbe" },
              { label: "Plongée", value: "Baptême ~55€ · Plongée encadrée ~50€ · Clubs sur la plage" },
              { label: "Meilleur moment", value: "Matin pour la plongée · 17h30 pour le coucher de soleil" },
              { label: "Combiner", value: "Diamant le matin + Sainte-Anne ou Arlet l'après-midi" },
            ].map(item => (
              <div key={item.label} className="gd-info">
                <div className="gd-info-label">{item.label}</div>
                <div className="gd-info-value">{item.value}</div>
              </div>
            ))}
          </div>

          {/* MAILLAGE VILLAS */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: CORAL, margin: "0 0 16px" }}>Villas idéalement situées</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "iguana",    name: "Villa Iguana",    desc: "Vue directe sur le Rocher du Diamant · Piscine eau salée · Location longue durée" },
                { id: "amaryllis", name: "Villa Amaryllis", desc: "Piscine à débordement · Vue océan · Jacuzzi · À partir de 280€/nuit" },
                { id: "mabouya",   name: "Mabouya",         desc: "Vue mer panoramique · Jacuzzi privatif · À partir de 70€/nuit" },
                { id: "zandoli",   name: "Zandoli",         desc: "Piscine privée · Vue mer · 5 personnes · À partir de 110€/nuit" },
              ].map(v => (
                <a key={v.id} href={`/${v.id}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", border: `1px solid ${SAND}`, borderRadius: 10, padding: "14px 18px", textDecoration: "none" }}>
                  <div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: NAVY, marginBottom: 2 }}>{v.name}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13, color: TEXT, opacity: 0.75 }}>{v.desc}</div>
                  </div>
                  <span style={{ color: CORAL, fontSize: 18, flexShrink: 0, marginLeft: 12 }}>›</span>
                </a>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ background: NAVY, borderRadius: 20, padding: "44px 36px", textAlign: "center", marginBottom: 40 }}>
            <p style={{ color: CORAL, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 12 }}>Base idéale</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", color: IVORY, textTransform: "uppercase", margin: "0 0 16px" }}>Séjourner à Sainte-Luce</h2>
            <p style={{ color: "rgba(250,245,233,0.65)", fontSize: 15, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Le Diamant à 15 min, Les Salines à 20 min, Arlet à 25 min. Piscine privée, vue mer, réservation directe sans frais.
            </p>
            <a href="/" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "15px 36px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.12em", textTransform: "uppercase" }}>Voir toutes nos villas</a>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/guide-hub"            style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>← Guide Sainte-Luce</a>
            <a href="/guide-sainte-anne" style={{ padding: "12px 24px", border: `1px solid ${SAND}`, borderRadius: 8, textDecoration: "none", color: NAVY, fontSize: 13, letterSpacing: "0.08em" }}>Guide Sainte-Anne →</a>
          </div>
        </div>

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="guide-le-diamant" />
        </div>

        <div style={{ background: NAVY, padding: "24px", textAlign: "center" }}>
          <p style={{ color: "rgba(250,245,233,0.4)", fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} Amaryllis Locations · <a href="/" style={{ color: "rgba(250,245,233,0.4)", textDecoration: "none" }}>villamaryllis.com</a>
            {" · "}
            <span style={{ fontSize: 11, opacity: 0.7 }}>Photos © Wikimedia Commons (CC BY-SA)</span>
          </p>
        </div>
      </div>
    </>
  );
}
