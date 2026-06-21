// Page /meilleure-saison-martinique — SEO TOFU 5000+ req/mois — traf-008

import SEOMeta from "./SEOMeta.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";

// Noms canoniques des biens pour le maillage interne SEO ("villa" = Amaryllis + Iguana uniquement).
const BIEN_NAMES = { amaryllis: "Villa Amaryllis", zandoli: "Zandoli", geko: "Géko", mabouya: "Mabouya", schoelcher: "Bellevue Schœlcher", iguana: "Villa Iguana", nogent: "Appartement Nogent-sur-Marne" };

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const BASE  = "https://villamaryllis.com";

const HERO_IMG = "https://villamaryllis.com/photos/amaryllis/01.webp";

// FAQ visible — IDENTIQUE au JSON-LD de functions/[slug].js (slug meilleure-saison-martinique).
const FAQ = [
  { q: "Quelle est la meilleure période pour aller en Martinique ?", a: "La saison sèche (« carême »), de décembre à avril, offre une mer calme, peu de pluie et une excellente visibilité. Mars est souvent considéré comme le meilleur mois." },
  { q: "Faut-il éviter la saison des pluies ?", a: "L'hivernage (juin à octobre) apporte des averses, surtout en septembre, pic de l'hivernage. Le risque cyclonique reste statistiquement faible mais existe." },
  { q: "Peut-on partir en Martinique à Noël ?", a: "Oui, décembre marque le retour de la saison sèche : c'est une période idéale pour les fêtes, mais aussi la plus demandée." },
];

// Données météo Sainte-Luce par mois (moyennes observées sur 5 ans)
const MOIS = [
  { id: "jan", label: "Jan", court: "Jan", tempAir: 27, tempMer: 26, pluie: 1, soleil: 8, vent: 4, note: "⭐⭐⭐⭐⭐", commentaire: "Saison sèche idéale. Mer calme, visibilité 25 m.", saison: "seche" },
  { id: "fev", label: "Fév", court: "Fév", tempAir: 27, tempMer: 26, pluie: 1, soleil: 9, vent: 4, note: "⭐⭐⭐⭐⭐", commentaire: "Le meilleur mois. Plages vides, mer transparente.", saison: "seche" },
  { id: "mar", label: "Mars", court: "Mar", tempAir: 28, tempMer: 26, pluie: 1, soleil: 9, vent: 4, note: "⭐⭐⭐⭐⭐", commentaire: "Excellent. Ensoleillement max, températures douces.", saison: "seche" },
  { id: "avr", label: "Avr", court: "Avr", tempAir: 29, tempMer: 27, pluie: 2, soleil: 8, vent: 3, note: "⭐⭐⭐⭐⭐", commentaire: "Fin de carême. Chaleur agréable, peu de pluie.", saison: "seche" },
  { id: "mai", label: "Mai", court: "Mai", tempAir: 30, tempMer: 28, pluie: 4, soleil: 7, vent: 3, note: "⭐⭐⭐⭐", commentaire: "Transition. Quelques averses courtes, peu de monde.", saison: "transition" },
  { id: "jun", label: "Juin", court: "Jun", tempAir: 30, tempMer: 28, pluie: 5, soleil: 7, vent: 3, note: "⭐⭐⭐", commentaire: "Début hivernage. Averses quotidiennes mais courtes.", saison: "humide" },
  { id: "jul", label: "Juil", court: "Jul", tempAir: 30, tempMer: 28, pluie: 5, soleil: 8, vent: 4, note: "⭐⭐⭐⭐", commentaire: "Été : beaucoup de soleil malgré quelques averses.", saison: "humide" },
  { id: "aou", label: "Août", court: "Aoû", tempAir: 31, tempMer: 29, pluie: 6, soleil: 7, vent: 3, note: "⭐⭐⭐", commentaire: "Chaud et humide. Risque cyclonique très faible.", saison: "humide" },
  { id: "sep", label: "Sept", court: "Sep", tempAir: 31, tempMer: 29, pluie: 7, soleil: 6, vent: 3, note: "⭐⭐", commentaire: "Pic de l'hivernage. Pluies fréquentes, éviter si possible.", saison: "humide" },
  { id: "oct", label: "Oct", court: "Oct", tempAir: 30, tempMer: 29, pluie: 7, soleil: 6, vent: 3, note: "⭐⭐", commentaire: "Encore humide. Fin de saison cyclonique officielle.", saison: "humide" },
  { id: "nov", label: "Nov", court: "Nov", tempAir: 29, tempMer: 28, pluie: 5, soleil: 7, vent: 4, note: "⭐⭐⭐", commentaire: "Amélioration progressive. Début de la transition.", saison: "transition" },
  { id: "dec", label: "Déc", court: "Déc", tempAir: 28, tempMer: 27, pluie: 2, soleil: 8, vent: 4, note: "⭐⭐⭐⭐⭐", commentaire: "Saison sèche qui revient. Idéal pour Noël et Nouvel An.", saison: "seche" },
];

const SAISON_COLORS = { seche: "#16a34a", humide: "#dc2626", transition: "#d97706" };
const SAISON_LABELS = { seche: "Saison sèche", humide: "Saison des pluies", transition: "Transition" };

const css = `
  .ms-bar-bg { background: ${SAND}; border-radius: 4px; height: 6px; margin-top: 4px; overflow: hidden; }
  .ms-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }

  .ms-month-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
    margin-bottom: 48px;
  }
  .ms-month-card {
    border-radius: 10px; padding: 10px 8px; text-align: center;
    border: 1px solid ${SAND}; cursor: default;
  }
  .ms-month-card.seche   { background: rgba(22,163,74,0.07); border-color: rgba(22,163,74,0.25); }
  .ms-month-card.humide  { background: rgba(220,38,38,0.05); border-color: rgba(220,38,38,0.18); }
  .ms-month-card.transition { background: rgba(217,119,6,0.07); border-color: rgba(217,119,6,0.25); }

  .ms-month-label { font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; color: ${NAVY}; margin-bottom: 6px; }
  .ms-month-temp  { font-family: 'Jost', sans-serif; font-size: 16px; font-weight: 700; color: ${NAVY}; margin-bottom: 2px; }
  .ms-month-mer   { font-family: 'Jost', sans-serif; font-size: 10px; color: ${MUTED}; margin-bottom: 4px; }
  .ms-month-note  { font-size: 9px; line-height: 1; }

  .ms-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 48px; }
  .ms-detail-card { background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 14px; padding: 24px 24px; }
  .ms-detail-card h3 { font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 600; color: ${NAVY}; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 8px; }
  .ms-detail-card .period { font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 500; margin-bottom: 10px; }
  .ms-detail-card p { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px; line-height: 1.75; color: ${TEXT}; margin: 0; }

  .ms-activity { display: flex; align-items: flex-start; gap: 12px; padding: 16px 0; border-bottom: 1px solid ${SAND}; }
  .ms-activity:last-child { border-bottom: none; padding-bottom: 0; }
  .ms-activity-icon { font-size: 24px; flex-shrink: 0; line-height: 1; }
  .ms-activity-name { font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 500; color: ${NAVY}; margin-bottom: 4px; }
  .ms-activity-text { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; line-height: 1.65; color: ${MUTED}; }
  .ms-activity-best { font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #16a34a; background: rgba(22,163,74,0.1); border-radius: 6px; padding: 2px 7px; display: inline-block; }

  .ms-section-title { font-family: 'Jost', sans-serif; font-size: 11px; letter-spacing: 0.35em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 10px; }
  .ms-h2 { font-family: 'Jost', sans-serif; font-weight: 300; font-size: clamp(26px, 4vw, 38px); letter-spacing: 0.06em; text-transform: uppercase; color: ${NAVY}; margin: 0 0 28px; line-height: 1.1; }

  @media (max-width: 640px) {
    .ms-month-grid { grid-template-columns: repeat(4, 1fr); }
    .ms-detail-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 400px) {
    .ms-month-grid { grid-template-columns: repeat(3, 1fr); }
  }
`;

export default function GuideMeilleureSaison() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <SEOMeta
        title="Meilleure saison Martinique — Quand partir ? | Amaryllis"
        description="Quand partir en Martinique ? Mois par mois : météo, température mer, pluies, activités. Avis d'un hôte local de Sainte-Luce. Saison sèche déc–avr vs hivernage juin–oct."
        canonical="/meilleure-saison-martinique"
        image={HERO_IMG}
        type="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Meilleure saison pour aller en Martinique — Guide mois par mois",
        "description": "Quand partir en Martinique ? Météo, températures, activités et conseils d'un hôte local de Sainte-Luce.",
        "url": `${BASE}/meilleure-saison-martinique`,
        "image": HERO_IMG,
        "author": { "@type": "Organization", "name": "Résidence Amaryllis", "url": BASE },
        "publisher": { "@id": `${BASE}/#organization` },
        "datePublished": "2025-01-01",
        "dateModified": "2025-09-01",
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>

        {/* NAV */}
        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase" }}>Amaryllis</a>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <a href="/guide-hub" style={{ color: IVORY, textDecoration: "none", fontSize: 12, letterSpacing: "0.08em", opacity: 0.6 }}>Explorer</a>
              <a href="/sainte-luce-martinique" style={{ color: IVORY, textDecoration: "none", fontSize: 12, letterSpacing: "0.08em", opacity: 0.7 }}>← Sainte-Luce</a>
            </div>
          </div>
        </header>

        {/* HERO */}
        <div style={{ position: "relative", height: "min(80vh, 540px)", overflow: "hidden" }}>
          <img
            src={HERO_IMG}
            alt="Martinique soleil et mer — meilleure saison pour partir"
            loading="eager"
            fetchPriority="high"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 35%" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(14,59,58,0.1) 0%, rgba(14,59,58,0.88) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 32px 48px" }}>
            <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
              <p style={{ color: CORAL, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Guide météo · Point de vue hôte local</p>
              <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(30px, 5.5vw, 58px)", letterSpacing: "0.04em", color: IVORY, textTransform: "uppercase", margin: "0 0 16px", lineHeight: 1.05 }}>
                Quand partir<br /><em style={{ fontStyle: "normal", fontWeight: 400, color: CORAL }}>en Martinique ?</em>
              </h1>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.7, color: "rgba(250,245,233,0.8)", maxWidth: 560, margin: 0 }}>
                En 5 ans d'hébergement à Sainte-Luce, voici ce qu'on observe vraiment — mois par mois.
              </p>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "72px 24px 96px" }}>

          {/* RÉPONSE COURTE */}
          <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`, borderRadius: 16, padding: "32px 36px", marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, margin: "0 0 10px" }}>La réponse courte</p>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(18px, 2.5vw, 22px)", lineHeight: 1.75, color: IVORY, margin: "0 0 20px" }}>
              <strong style={{ color: CORAL }}>Décembre à avril</strong> est la meilleure période — saison sèche, mer calme, soleil garanti. <strong style={{ color: CORAL }}>Juillet et août</strong> sont excellents aussi (vacances d'été, mer chaude, quelques averses courtes). <strong style={{ color: CORAL }}>Septembre et octobre</strong> sont à éviter : hivernage intense, pluies fréquentes.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "Top saison", val: "Déc → Avr", color: "#16a34a" },
                { label: "Bon choix", val: "Juil → Août", color: CORAL },
                { label: "À éviter", val: "Sep → Oct", color: "#dc2626" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(250,245,233,0.07)", border: "1px solid rgba(250,245,233,0.12)", borderRadius: 10, padding: "12px 18px" }}>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250,245,233,0.5)", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 16, fontWeight: 700, color: s.color }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CALENDRIER MOIS PAR MOIS */}
          <div style={{ marginBottom: 56 }}>
            <p className="ms-section-title">Calendrier météo</p>
            <h2 className="ms-h2">Les 12 mois<br />en un coup d'œil</h2>

            {/* Légende saisons */}
            <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
              {Object.entries(SAISON_LABELS).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: SAISON_COLORS[k] }} />
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: MUTED, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="ms-month-grid">
              {MOIS.map(m => (
                <div key={m.id} className={`ms-month-card ${m.saison}`}>
                  <div className="ms-month-label">{m.court}</div>
                  <div className="ms-month-temp">{m.tempAir}°</div>
                  <div className="ms-month-mer">🌊 {m.tempMer}°</div>
                  <div className="ms-month-note">{m.note.split("⭐").filter(Boolean).map((_, i) => "⭐").join("")}</div>
                </div>
              ))}
            </div>
          </div>

          {/* DÉTAIL SAISONS */}
          <div style={{ marginBottom: 64 }}>
            <p className="ms-section-title">Les deux saisons</p>
            <h2 className="ms-h2">Carême vs Hivernage<br />ce qu'il faut savoir</h2>
            <div className="ms-detail-grid">
              <div className="ms-detail-card">
                <h3 style={{ color: "#16a34a" }}>☀️ Saison sèche</h3>
                <div className="period" style={{ color: "#16a34a" }}>Décembre → Avril (5 mois)</div>
                <p>C'est le Carême martiniquais. Soleil quasi-permanent, températures douces (26–28°C), mer calme et limpide. La visibilité sous l'eau atteint 20–25 mètres. Les plages sont magnifiques. Les prix sont plus élevés — mais chaque journée vaut l'investissement.</p>
                <div style={{ marginTop: 16 }}>
                  {[
                    { label: "Ensoleillement", val: 8.5, max: 10, color: "#f59e0b" },
                    { label: "Risque de pluie", val: 1.5, max: 10, color: "#3b82f6" },
                    { label: "Mer calme", val: 9, max: 10, color: "#06b6d4" },
                  ].map(b => (
                    <div key={b.label} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: MUTED }}>{b.label}</span>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 600, color: NAVY }}>{Math.round(b.val * 10)}%</span>
                      </div>
                      <div className="ms-bar-bg"><div className="ms-bar-fill" style={{ width: `${b.val / b.max * 100}%`, background: b.color }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ms-detail-card">
                <h3 style={{ color: "#dc2626" }}>🌧️ Saison des pluies</h3>
                <div className="period" style={{ color: "#dc2626" }}>Juin → Novembre (6 mois)</div>
                <p>L'hivernage est chaud (29–31°C) et humide. Les averses sont souvent courtes mais intenses. Juillet et août restent très fréquentés (vacances scolaires) avec un bon ensoleillement. Septembre–octobre sont les mois les plus compliqués — risque cyclonique, pluies fréquentes.</p>
                <div style={{ marginTop: 16 }}>
                  {[
                    { label: "Ensoleillement", val: 6.5, max: 10, color: "#f59e0b" },
                    { label: "Risque de pluie", val: 7, max: 10, color: "#3b82f6" },
                    { label: "Mer calme", val: 6, max: 10, color: "#06b6d4" },
                  ].map(b => (
                    <div key={b.label} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: MUTED }}>{b.label}</span>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 600, color: NAVY }}>{Math.round(b.val * 10)}%</span>
                      </div>
                      <div className="ms-bar-bg"><div className="ms-bar-fill" style={{ width: `${b.val / b.max * 100}%`, background: b.color }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TABLEAU DÉTAILLÉ */}
          <div style={{ marginBottom: 64 }}>
            <p className="ms-section-title">Détail mois par mois</p>
            <h2 className="ms-h2">Ce qu'on observe<br />depuis Sainte-Luce</h2>
            <div style={{ border: `1px solid ${SAND}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "80px 60px 60px auto", padding: "12px 20px", background: NAVY, gap: 8 }}>
                {["Mois", "Air", "Mer", "Conditions"].map(h => (
                  <div key={h} style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250,245,233,0.5)", fontWeight: 600 }}>{h}</div>
                ))}
              </div>
              {MOIS.map((m, i) => (
                <div key={m.id} style={{
                  display: "grid", gridTemplateColumns: "80px 60px 60px auto",
                  padding: "14px 20px", gap: 8,
                  background: i % 2 === 0 ? CREAM : "#fff",
                  borderBottom: i < MOIS.length - 1 ? `1px solid ${SAND}` : "none",
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 600, color: NAVY }}>{m.label}</div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: SAISON_COLORS[m.saison] }}>{SAISON_LABELS[m.saison]}</div>
                  </div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 700, color: NAVY }}>{m.tempAir}°C</div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 700, color: "#0ea5e9" }}>{m.tempMer}°C</div>
                  <div>
                    <div style={{ fontSize: 11, marginBottom: 2 }}>{Array.from({ length: Math.round(m.soleil) }, (_, i) => i < Math.round(m.soleil) ? "⭐" : "").slice(0, 5).join("")}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 14, color: MUTED, lineHeight: 1.4 }}>{m.commentaire}</div>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: MUTED, marginTop: 10, fontStyle: "italic" }}>
              ⭐ = soleil · Données basées sur les observations de la Résidence Amaryllis, Sainte-Luce 2020–2025
            </p>
          </div>

          {/* PAR ACTIVITÉ */}
          <div style={{ marginBottom: 64 }}>
            <p className="ms-section-title">Selon vos envies</p>
            <h2 className="ms-h2">La meilleure saison<br />selon l'activité</h2>
            <div>
              {[
                { icon: "🤿", name: "Snorkeling & plongée", best: "Déc – Avr", text: "Visibilité maximale (20–25 m), mer calme, tortues actives. En hivernage, la visibilité baisse et les courants sont plus forts." },
                { icon: "🏖️", name: "Plage & baignade", best: "Toute l'année", text: "L'eau est toujours chaude (26–29°C). En saison sèche les plages sont plus propres et la mer plus calme. En été les enfants adorent." },
                { icon: "🌊", name: "Surf & kitesurf", best: "Nov – Avr", text: "Les alizés soufflent bien de novembre à avril. Bois Jolan est idéal en saison sèche — vents réguliers, spot accessible." },
                { icon: "🚤", name: "Catamaran & sorties en mer", best: "Déc – Avr", text: "Mer calme, conditions parfaites pour les excursions vers le Rocher du Diamant ou Sainte-Anne. En hivernage les sorties peuvent être annulées." },
                { icon: "🦋", name: "Nature & randonnée", best: "Juil – Août", text: "La végétation est luxuriante après les premières pluies. Les mornes sont verdoyants, les fleurs omniprésentes. Idéal pour la forêt de Montravail." },
                { icon: "💰", name: "Budget & prix bas", best: "Mai – Juin · Sep – Nov", text: "Hors haute saison, les prix de nos villas sont inférieurs de 20–30%. C'est le bon plan pour les petits budgets — avec un peu de météo capricieuse." },
              ].map(a => (
                <div key={a.name} className="ms-activity">
                  <span className="ms-activity-icon">{a.icon}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                      <div className="ms-activity-name">{a.name}</div>
                      <span className="ms-activity-best">{a.best}</span>
                    </div>
                    <div className="ms-activity-text">{a.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CONSEIL HÔTE */}
          <div style={{ background: `linear-gradient(135deg, #0a2e2d 0%, ${NAVY} 60%, #163f3e 100%)`, border: `1px solid rgba(196,114,84,0.3)`, borderRadius: 20, padding: "44px 40px", marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, margin: "0 0 12px" }}>Notre avis d'hôte local</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 3.5vw, 34px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 20px", lineHeight: 1.1 }}>
              Ce qu'on n'écrit pas<br />dans les guides
            </h2>
            {[
              { titre: "Février est notre mois préféré", texte: "Peu de touristes, soleil permanent, plages désertes le matin. Si vous avez la liberté de partir en février — faites-le sans hésiter." },
              { titre: "Juillet–août sont sous-estimés", texte: "Les averses tropicales sont courtes — 20 minutes, puis le soleil revient. L'eau est à 28–29°C, la végétation est somptueuse. C'est bien plus agréable qu'un août sur la Côte d'Azur." },
              { titre: "Septembre est vraiment difficile", texte: "On vous le dit honnêtement : c'est le mois où nos locataires déçus sont les plus nombreux. Pluies quotidiennes, mer parfois grise. Évitez si c'est possible." },
              { titre: "Les prix basse saison valent le détour", texte: "En mai ou novembre, nos villas sont 25–30% moins chères. La météo est imparfaite mais le rapport qualité-prix est imbattable. Et il y a toujours de belles journées." },
            ].map((c, i) => (
              <div key={i} style={{ background: "rgba(250,245,233,0.05)", border: "1px solid rgba(250,245,233,0.08)", borderRadius: 12, padding: "20px 24px", marginBottom: 12 }}>
                <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 13, fontWeight: 500, color: CORAL, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>{c.titre}</div>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, lineHeight: 1.75, color: "rgba(250,245,233,0.82)", margin: 0 }}>{c.texte}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CORAL, marginBottom: 14 }}>Villas disponibles</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(24px, 4vw, 42px)", letterSpacing: "0.06em", textTransform: "uppercase", color: NAVY, margin: "0 0 16px", lineHeight: 1.1 }}>
              Réservez selon<br />votre saison idéale
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: MUTED, maxWidth: 480, margin: "0 auto 32px" }}>
              Piscine vue mer, jardin tropical, accès direct aux plages de Sainte-Luce — disponibles toute l'année.
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
              <a href="/sainte-luce-martinique" style={{
                display: "inline-block", padding: "15px 32px",
                background: "transparent", color: NAVY, borderRadius: 10,
                textDecoration: "none", fontFamily: "'Jost', sans-serif",
                fontSize: 13, fontWeight: 400, letterSpacing: "0.1em", textTransform: "uppercase",
                border: `1px solid ${SAND}`,
              }}>
                Découvrir Sainte-Luce
              </a>
            </div>
          </div>

        </div>

        {/* FAQ visible (cohérence avec le JSON-LD) */}
        <section style={{ maxWidth: 760, margin: "48px auto", padding: "0 24px" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontSize: 30, color: NAVY, textAlign: "center", margin: "0 0 24px" }}>Questions fréquentes</h2>
          {FAQ.map((f, i) => (
            <details key={i} style={{ borderTop: `1px solid ${SAND}`, padding: "14px 0" }}>
              <summary style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 15, color: NAVY, cursor: "pointer" }}>{f.q}</summary>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 14, color: MUTED, lineHeight: 1.6, margin: "10px 0 0" }}>{f.a}</p>
            </details>
          ))}
        </section>

        {/* FOOTER */}
        <footer style={{ background: NAVY, padding: "40px 24px", textAlign: "center" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Amaryllis</a>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { href: "/", label: "Villas" },
              { href: "/sainte-luce-martinique", label: "Sainte-Luce" },
              { href: "/reservation-directe-martinique", label: "Réservation directe" },
              { href: "/guide-hub", label: "Explorer" },
              { href: "/guide-sainte-anne", label: "Les Salines" },
              { href: "/activites-sainte-luce", label: "Activités" },
            ].map(l => (
              <a key={l.href} href={l.href} style={{ color: "rgba(250,245,233,0.5)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em" }}>{l.label}</a>
            ))}
          </div>
          <p style={{ color: "rgba(250,245,233,0.3)", fontFamily: "'Jost', sans-serif", fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} Résidence Amaryllis · Sainte-Luce, Martinique</p>
        </footer>

        <MaillageCluster currentSlug="meilleure-saison-martinique" bienNames={BIEN_NAMES} />
      </div>
    </>
  );
}
