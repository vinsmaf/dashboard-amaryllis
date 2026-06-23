// Guide Se Déplacer Martinique Sud — /guide-se-deplacer-martinique-sud

import SEOMeta from "./SEOMeta.jsx";
import BridgeVilla from "./components/BridgeVilla.jsx";
import ReadingProgressBar from "./components/ReadingProgressBar.jsx";
import MaillageCluster from "./components/seo/MaillageCluster.jsx";
import NewsletterForm from "./NewsletterForm.jsx";
import LienAffilie from "./components/LienAffilie.jsx";

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
  .sdp-section { margin-bottom: 60px; }
  .sdp-label {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 400;
    letter-spacing: 0.32em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 10px;
  }
  .sdp-section h2 {
    font-family: 'Jost', sans-serif; font-weight: 300; font-size: clamp(24px, 4vw, 36px);
    letter-spacing: 0.06em; text-transform: uppercase; color: ${NAVY}; margin: 0 0 26px; line-height: 1.1;
  }
  .sdp-body {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: clamp(17px, 2vw, 19px);
    line-height: 1.82; color: ${TEXT}; max-width: 700px; margin-bottom: 28px;
  }

  .sdp-highlight {
    background: linear-gradient(135deg, #0a2e2d 0%, ${NAVY} 60%, #153f3e 100%);
    border: 1px solid rgba(196,114,84,0.3); border-radius: 20px; overflow: hidden; margin-bottom: 64px;
  }
  .sdp-highlight-head { padding: 36px 40px 28px; border-bottom: 1px solid rgba(250,245,233,0.08); }
  .sdp-highlight-body { padding: 28px 40px 40px; display: flex; flex-direction: column; gap: 18px; }
  .sdp-hl-item {
    background: rgba(250,245,233,0.05); border: 1px solid rgba(250,245,233,0.08);
    border-radius: 12px; padding: 22px 26px;
  }
  .sdp-hl-item h4 {
    font-family: 'Jost', sans-serif; font-weight: 500; font-size: 13px;
    color: ${CORAL}; margin: 0 0 8px; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .sdp-hl-item p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.75; color: rgba(250,245,233,0.82); margin: 0;
  }
  .sdp-hl-price {
    display: inline-block; font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600;
    color: ${GOLD}; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 10px;
  }

  .sdp-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 32px; }
  .sdp-card {
    background: ${CREAM}; border: 1px solid ${SAND}; border-radius: 12px; padding: 20px 22px;
  }
  .sdp-card-label {
    font-family: 'Jost', sans-serif; font-size: 10px; font-weight: 600;
    letter-spacing: 0.22em; text-transform: uppercase; color: ${CORAL}; margin-bottom: 7px;
  }
  .sdp-card-value {
    font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 400; color: ${NAVY}; line-height: 1.55;
  }

  .sdp-tip {
    background: ${CREAM}; border-left: 3px solid ${CORAL}; border-radius: 0 12px 12px 0;
    padding: 18px 22px; margin-bottom: 14px;
  }
  .sdp-tip-title {
    font-family: 'Jost', sans-serif; font-size: 12px; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase; color: ${NAVY}; margin-bottom: 6px;
  }
  .sdp-tip p {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px; line-height: 1.7; color: ${TEXT}; margin: 0;
  }

  .sdp-faq { margin-bottom: 60px; }
  .sdp-faq-item { border-bottom: 1px solid ${SAND}; padding: 22px 0; }
  .sdp-faq-item:first-child { border-top: 1px solid ${SAND}; }
  .sdp-faq-q {
    font-family: 'Jost', sans-serif; font-size: 15px; font-weight: 400;
    color: ${NAVY}; margin-bottom: 10px; letter-spacing: 0.02em;
  }
  .sdp-faq-a {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px;
    line-height: 1.78; color: ${TEXT}; max-width: 680px;
  }

  .sdp-distance-row {
    background: #fff; border: 1px solid ${SAND}; border-radius: 14px;
    padding: 18px 24px; margin-bottom: 12px; display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
  }
  .sdp-distance-dest {
    font-family: 'Jost', sans-serif; font-size: 14px; font-weight: 500; color: ${NAVY};
  }
  .sdp-distance-meta {
    font-family: 'Jost', sans-serif; font-size: 11px; font-weight: 600;
    color: ${CORAL}; letter-spacing: 0.1em; white-space: nowrap;
  }
  .sdp-distance-note {
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 15px;
    color: ${MUTED}; line-height: 1.5; margin-top: 4px;
  }

  .sdp-warning {
    background: rgba(212,160,23,0.1); border: 1px solid rgba(212,160,23,0.3);
    border-radius: 12px; padding: 18px 22px; margin-bottom: 28px;
    font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16px;
    line-height: 1.7; color: ${TEXT};
  }
  .sdp-warning strong { color: ${NAVY}; font-style: normal; }

  .sdp-link {
    color: ${CORAL}; text-decoration: none; border-bottom: 1px solid rgba(196,114,84,0.35);
    font-family: 'Jost', sans-serif; font-size: 13px; font-weight: 400; letter-spacing: 0.04em;
  }
  .sdp-link:hover { border-bottom-color: ${CORAL}; }

  @media (max-width: 640px) {
    .sdp-highlight-head, .sdp-highlight-body { padding: 22px 18px; }
    .sdp-hl-item { padding: 16px 16px; }
    .sdp-grid2 { grid-template-columns: 1fr; }
    .sdp-distance-row { flex-direction: column; align-items: flex-start; gap: 6px; }
  }
`;

const FAQ = [
  {
    q: "Doit-on absolument louer une voiture en Martinique ?",
    a: "Dans le sud Martinique, la voiture reste indispensable pour explorer librement. Le réseau de bus (Mozaïk) dessert très mal la région de Sainte-Luce, et les taxis représentent un budget important à la journée. Pour un séjour de plus de 3 nuits avec visite des plages et des villages, louer une voiture est de loin l'option la plus pratique et la moins chère.",
  },
  {
    q: "Le GPS fonctionne bien en Martinique ?",
    a: "Oui — Google Maps et Waze fonctionnent parfaitement dans tout le sud de l'île. Pensez à télécharger la carte hors-ligne avant de partir de France si votre forfait roaming est limité. Quelques routes de montagne peuvent perdre le signal brièvement, mais dans le sud c'est rare.",
  },
  {
    q: "Le stationnement est-il payant à Martinique ?",
    a: "Dans les villages touristiques (Les Anses d'Arlet, Sainte-Anne en haute saison) des parkings payants ont été instaurés (2–4 €/j). Fort-de-France dispose de parkings à étages. Hors centres-bourgs, le stationnement reste largement gratuit le long des plages et des sites naturels.",
  },
  {
    q: "Comment éviter les embouteillages aux heures de pointe ?",
    a: "Évitez Fort-de-France et la zone centre entre 7h30–9h et 16h30–18h30, en particulier le Lamentin et la route de l'aéroport. Dans le sud, les axes Sainte-Luce / Le Marin / Les Salines restent fluides quasi toute la journée. Sainte-Anne le week-end en haute saison peut bloquer sur 1–2 km côté parking Salines.",
  },
];

export default function GuideSeDeplacer() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <ReadingProgressBar ctaHref="/" />
      <SEOMeta
        title="Se déplacer dans le Sud Martinique — Location voiture, taxis, bus 2026"
        description="Voiture, taxi, bus, taxi-boat : tous les moyens pour se déplacer dans le Sud Martinique. Distances depuis Sainte-Luce, conseils depuis l'aéroport."
        canonical="/guide-se-deplacer-martinique-sud"
        type="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "Se déplacer dans le Sud Martinique — Location voiture, taxis, bus 2026",
        "author": { "@type": "Organization", "name": "Amaryllis Locations", "url": BASE },
        "publisher": { "@type": "Organization", "name": "Amaryllis Locations", "url": BASE },
        "url": `${BASE}/guide-se-deplacer-martinique-sud`,
        "inLanguage": "fr",
        "description": "Guide complet des transports dans le sud Martinique : location de voiture, taxis réglementés, taxi-boat, bus Mozaïk, scooter — distances et tarifs depuis Sainte-Luce.",
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
            <p style={{ color: CORAL, fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", margin: "0 0 12px" }}>Guide pratique · Sud Martinique</p>
            <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(28px, 5vw, 50px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 20px", lineHeight: 1.05 }}>
              Se déplacer<br />dans le Sud
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[
                { icon: "🚗", label: "Location voiture 40–80 €/j" },
                { icon: "✈️", label: "Aéroport à 40 min" },
                { icon: "⛵", label: "Taxi-boat disponible" },
                { icon: "🗺️", label: "GPS + Google Maps fiables" },
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
          <div className="sdp-section">
            <p className="sdp-label">Vue d'ensemble</p>
            <h2>La voiture reste<br />incontournable</h2>
            <p className="sdp-body">
              Se déplacer dans le sud de la Martinique est simple à une condition : avoir une voiture. Le réseau de transport en commun (bus Mozaïk, TCSP) dessert correctement Fort-de-France et quelques axes nord–sud, mais il reste très insuffisant pour explorer les plages, villages et sites naturels du sud. Pour un séjour à Sainte-Luce, louer une voiture est la décision la plus intelligente que vous puissiez prendre.
            </p>
            <p className="sdp-body">
              La bonne nouvelle : les routes martiniquaises sont bien entretenues, la signalisation est claire (normes françaises), le GPS fonctionne partout, et les distances entre les principaux sites du sud sont courtes — comptez rarement plus de 40 minutes pour rejoindre n'importe quelle plage ou restaurant depuis Sainte-Luce.
            </p>
            <div className="sdp-warning">
              <strong>Bon à savoir :</strong> le permis de conduire français (ou européen) est valable en Martinique. Les règles du code de la route sont identiques à celles de la métropole. La conduite à droite, les ronds-points et les priorités vous seront familiers.
            </div>
          </div>

          {/* LOCATION VOITURE */}
          <div className="sdp-highlight">
            <div className="sdp-highlight-head">
              <p style={{ color: CORAL, fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 12px" }}>Option principale</p>
              <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 3vw, 32px)", letterSpacing: "0.08em", textTransform: "uppercase", color: IVORY, margin: 0, lineHeight: 1.1 }}>
                Location de voiture<br />en Martinique
              </h2>
            </div>
            <div className="sdp-highlight-body">
              <div className="sdp-hl-item">
                <h4>Prix moyens</h4>
                <p>Citadine (Peugeot 208, Clio) : 40–55 €/jour. SUV ou monospace : 65–80 €/jour. Les tarifs grimpent fortement sans réservation à l'avance, surtout en juillet–août et pendant les vacances de Noël.</p>
                <span className="sdp-hl-price">💡 Réserver au moins 3 semaines avant le départ</span>
              </div>
              <div className="sdp-hl-item">
                <h4>Où réserver</h4>
                <p>Comparez tous les loueurs de l'aéroport Aimé Césaire (Europcar, Avis, Hertz…) en une recherche avec <LienAffilie partenaire="discoverCars" utmContent="guide-sedeplacer-ou-reserver" showDisclosure={false} style={{ display: "inline" }}>DiscoverCars</LienAffilie>. Réserver à l'avance coûte 20–30 % moins cher que sur place.</p>
                <a href="/location-voiture-martinique-pas-cher" style={{ display: "inline-block", marginTop: 12, color: CORAL, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Guide complet → location voiture Martinique pas cher
                </a>
              </div>
              <div className="sdp-hl-item">
                <h4>Conseils pratiques</h4>
                <p>Vérifiez que votre carte bancaire (Visa/Mastercard Premier) couvre l'assurance collision — cela évite de payer la franchise supplémentaire à la location. Prenez des photos du véhicule avant de partir depuis l'agence.</p>
              </div>
              <div className="sdp-hl-item">
                <h4>Carburant</h4>
                <p>Stations Shell, Total et Système U répandues dans le sud. Prix légèrement supérieurs à la métropole (~1,85 €/L en 2026 pour le sans-plomb 95). Évitez de rendre le véhicule le réservoir quasi-vide — les agences facturent le plein à prix majoré.</p>
              </div>
            </div>
          </div>

          {/* AÉROPORT */}
          <div className="sdp-section">
            <p className="sdp-label">Arrivée</p>
            <h2>Depuis l'aéroport<br />jusqu'à Sainte-Luce</h2>
            <p className="sdp-body">
              L'aéroport international Aimé Césaire est situé au Lamentin, dans le centre de l'île — à 40 minutes en voiture de Sainte-Luce par la route nationale N5 (direction Le Marin). La route est simple et bien signalée, sans péage. Comptez 35–45 minutes selon la circulation (évitez les heures de pointe 7h30–9h et 16h30–18h30 si possible).
            </p>
            <div className="sdp-grid2">
              {[
                { label: "Distance aéroport → Sainte-Luce", value: "37 km — 40 min environ" },
                { label: "Route principale", value: "N5 direction Le Marin — signalisation claire" },
                { label: "Récupération voiture", value: "Agences au terminal d'arrivée + navette Hertz/Europcar" },
                { label: "Taxi depuis l'aéroport", value: "Tarif fixe réglementé : ~50–55 € vers Sainte-Luce" },
                { label: "Heure de pointe à éviter", value: "7h30–9h et 16h30–18h30 (axe Lamentin)" },
                { label: "GPS recommandé", value: "Google Maps ou Waze — télécharger hors-ligne" },
              ].map(d => (
                <div key={d.label} className="sdp-card">
                  <div className="sdp-card-label">{d.label}</div>
                  <div className="sdp-card-value">{d.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* TAXIS */}
          <div className="sdp-section">
            <p className="sdp-label">Transports à la demande</p>
            <h2>Taxis & VTC<br />dans le sud</h2>
            <p className="sdp-body">
              Les taxis réglementés fonctionnent à des tarifs préfectoraux affichés dans les véhicules. Pas de négociation — les prix sont fixés par kilométrage et heure. Pour les trajets ponctuels (aéroport, soirée au restaurant) c'est une option confortable ; pour les déplacements quotidiens, le budget monte vite.
            </p>
            {[
              {
                title: "Taxis réglementés",
                desc: "Reconnaissables au panneau lumineux blanc. Tarif de base ~3 €, puis ~1,20 €/km en journée. Majorations la nuit et les dimanches. Aéroport → Sainte-Luce : environ 50–55 €. Réservation par téléphone recommandée (pas d'application officielle).",
              },
              {
                title: "Tarifs indicatifs courtes distances",
                desc: "Sainte-Luce → Le Diamant : ~25 €. Sainte-Luce → Sainte-Anne : ~30 €. Sainte-Luce → Marin : ~20 €. Tarifs approximatifs en journée — augmentent de 30 % après 20h et le dimanche.",
              },
              {
                title: "Uber & VTC",
                desc: "Uber est présent en Martinique mais avec une offre réduite dans le sud. L'attente peut être longue hors Fort-de-France. En alternative, plusieurs chauffeurs VTC indépendants proposent des transferts depuis l'aéroport — demandez à votre hôte de recommandation avant d'arriver.",
              },
            ].map(t => (
              <div key={t.title} className="sdp-tip">
                <div className="sdp-tip-title">{t.title}</div>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>

          {/* TAXI-BOAT */}
          <div className="sdp-section">
            <p className="sdp-label">Voie maritime</p>
            <h2>Taxi-boat &<br />navettes maritimes</h2>
            <p className="sdp-body">
              La Martinique dispose d'un réseau de navettes maritimes souvent ignoré des touristes — pourtant, c'est l'un des moyens les plus agréables de se déplacer entre la côte Caraïbe et Fort-de-France, ou de rejoindre des sites depuis la mer.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              {[
                {
                  dest: "Trois-Îlets ↔ Fort-de-France",
                  km: "30 min · 10 €/pers. env.",
                  desc: "La traversée la plus populaire : bateaux toutes les 30 min depuis le ponton des Trois-Îlets. Vue magnifique sur la baie de Fort-de-France. Beaucoup plus rapide que la route (évite le tour par Le Lamentin).",
                },
                {
                  dest: "Le Marin — départs excursions",
                  km: "25 min de Sainte-Luce",
                  desc: "Le port du Marin est le hub principal pour les catamaran day-trips, excursions fonds blancs, catamarans vers les Anses d'Arlet. Départs tôt le matin (7h30–8h30). Réservation à l'avance fortement conseillée en haute saison.",
                },
                {
                  dest: "Anse Mitan ↔ Fort-de-France",
                  km: "20 min · 7 €/pers. env.",
                  desc: "Alternative aux Trois-Îlets pour rejoindre Fort-de-France par la mer. Départs fréquents depuis la jetée d'Anse Mitan. Parking gratuit à proximité.",
                },
              ].map(e => (
                <a key={e.dest} href="#" onClick={e => e.preventDefault()} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "18px 22px", textDecoration: "none", display: "block" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 500, color: NAVY }}>{e.dest}</span>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: CORAL, fontWeight: 600 }}>{e.km}</span>
                  </div>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, lineHeight: 1.65, color: MUTED, margin: 0 }}>{e.desc}</p>
                </a>
              ))}
            </div>
          </div>

          {/* BUS */}
          <div className="sdp-section">
            <p className="sdp-label">Transports collectifs</p>
            <h2>Bus Mozaïk<br />& TCSP</h2>
            <p className="sdp-body">
              Le réseau Mozaïk (anciennement Kar'Aïbe) est le bus interurbain de la Martinique. Le TCSP (Transport en Commun en Site Propre) est un bus rapide sur voie dédiée reliant Le Lamentin au centre de Fort-de-France. Dans le <strong>sud de l'île</strong>, l'offre reste très limitée : quelques lignes desservent Rivière-Pilote, Le Marin et ponctuellement Sainte-Anne, mais les fréquences sont faibles et les horaires peu adaptés aux visiteurs.
            </p>
            {[
              {
                title: "Ligne 6 (Sainte-Luce / Le Marin / Fort-de-France)",
                desc: "La principale ligne utile depuis Sainte-Luce. Quelques passages par jour en semaine. Utile pour rejoindre Fort-de-France sans voiture, peu pratique pour les excursions qui nécessitent des horaires flexibles.",
              },
              {
                title: "Tarifs & tickets",
                desc: "Tarif unique : 1,50 € le trajet (carte à puce rechargeable disponible dans les points de vente Mozaïk). Paiement en espèces possible dans le bus. Enfants de moins de 5 ans : gratuit.",
              },
              {
                title: "TCSP (Fort-de-France)",
                desc: "Bus rapide sur 14 km entre Le Lamentin et Fort-de-France. Fréquence : toutes les 10 min en heure de pointe. Utile si vous visitez Fort-de-France depuis l'aéroport sans voiture. Hors de portée pour le sud de l'île.",
              },
            ].map(t => (
              <div key={t.title} className="sdp-tip">
                <div className="sdp-tip-title">{t.title}</div>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>

          {/* VÉLO / SCOOTER */}
          <div className="sdp-section">
            <p className="sdp-label">Alternatives douces</p>
            <h2>Vélo & scooter —<br />pour initiés</h2>
            <p className="sdp-body">
              La Martinique est vallonnée : la topographie accidentée rend le vélo classique difficile, sauf sur les portions côtières. Les vélos électriques (VAE) commencent à se démocratiser et permettent de gravir les côtes plus facilement. Le scooter est populaire chez les locaux mais demande une bonne maîtrise — les routes peuvent être étroites et la circulation imprévisible aux heures de pointe.
            </p>
            <div className="sdp-grid2">
              {[
                { label: "Scooter 125cc", value: "Location ~35–50 €/j · Permis A1 ou B requis (ancienneté 2 ans)" },
                { label: "Vélo électrique (VAE)", value: "Quelques loueurs à Sainte-Luce et Le Marin · ~25–35 €/j" },
                { label: "Terrain conseillé", value: "Côte plate (Sainte-Luce bourg / Gros Raisins) — évitez les hauteurs" },
                { label: "Équipement obligatoire", value: "Casque fourni par le loueur · gilet recommandé · hydratation" },
              ].map(d => (
                <div key={d.label} className="sdp-card">
                  <div className="sdp-card-label">{d.label}</div>
                  <div className="sdp-card-value">{d.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* DISTANCES DEPUIS VILLAS */}
          <div className="sdp-section">
            <p className="sdp-label">Distances depuis nos villas</p>
            <h2>Sainte-Luce :<br />tout est proche</h2>
            <p className="sdp-body">
              La résidence Amaryllis à Sainte-Luce est idéalement placée au cœur du sud Martinique — à équidistance des principaux sites touristiques et à 40 minutes seulement de l'aéroport. Une fois votre voiture récupérée, vous êtes libres.
            </p>
            {[
              { dest: "Aéroport Aimé Césaire (Lamentin)", time: "40 min", note: "Via N5 — route directe, bien signalée" },
              { dest: "Anses d'Arlet (tortues marines)", time: "25 min", note: "Route côtière panoramique" },
              { dest: "Rocher du Diamant", time: "20 min", note: "Via Le Diamant — route rapide" },
              { dest: "Les Salines (plus belle plage)", time: "15 min", note: "Via Sainte-Anne" },
              { dest: "Le Marin (port, catamarans)", time: "25 min", note: "Via la D9" },
              { dest: "Sainte-Anne (village & marché)", time: "20 min", note: "Via le bord de mer" },
              { dest: "Trois-Îlets (musée Joséphine)", time: "35 min", note: "Via le Diamant et l'Anse à l'Âne" },
              { dest: "Fort-de-France (centre-ville)", time: "40 min", note: "Via N5 puis pont de la Rivière Salée" },
            ].map(d => (
              <div key={d.dest} className="sdp-distance-row">
                <div>
                  <div className="sdp-distance-dest">{d.dest}</div>
                  <div className="sdp-distance-note">{d.note}</div>
                </div>
                <div className="sdp-distance-meta">{d.time}</div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="sdp-section sdp-faq">
            <p className="sdp-label">Questions fréquentes</p>
            <h2>Ce que vous<br />nous demandez souvent</h2>
            {FAQ.map(f => (
              <div key={f.q} className="sdp-faq-item">
                <div className="sdp-faq-q">{f.q}</div>
                <div className="sdp-faq-a">{f.a}</div>
              </div>
            ))}
          </div>

          <BridgeVilla
            villaId="amaryllis"
            lieu="le Sud Martinique"
            tempsRoute=""
            copy="Voiture récupérée — maintenant votre base à Sainte-Luce. Toutes les plages du Sud sont à moins de 40 minutes."
          />

          {/* CTA FINAL */}
          <div style={{
            background: `linear-gradient(135deg, ${NAVY} 0%, #163f3e 100%)`,
            borderRadius: 20, padding: "52px 40px", textAlign: "center", marginTop: 64,
          }}>
            <p style={{ color: CORAL, fontFamily: "'Jost', sans-serif", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", margin: "0 0 14px" }}>Réservation directe</p>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(22px, 4vw, 38px)", letterSpacing: "0.06em", textTransform: "uppercase", color: IVORY, margin: "0 0 18px", lineHeight: 1.1 }}>
              Votre villa à Sainte-Luce<br />porte d'entrée du Sud
            </h2>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, lineHeight: 1.8, color: "rgba(250,245,233,0.75)", maxWidth: 480, margin: "0 auto 36px" }}>
              Aéroport à 40 min, Anses d'Arlet à 25 min, Les Salines à 15 min — et une piscine à débordement pour attendre le coucher de soleil.
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
          <NewsletterForm source="guide-se-deplacer-martinique" />
        </div>

        <footer style={{ background: NAVY, padding: "40px 24px", textAlign: "center" }}>
          <a href="/" style={{ color: IVORY, textDecoration: "none", fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 20, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 20 }}>Amaryllis</a>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
            {[
              { href: "/", label: "Villas" },
              { href: "/guide-hub", label: "Explorer" },
              { href: "/sainte-luce-martinique", label: "Sainte-Luce" },
              { href: "/guide-snorkeling-tortues-martinique", label: "Snorkeling" },
              { href: "/location-voiture-martinique-pas-cher", label: "Location voiture" },
              { href: "/faq", label: "FAQ" },
            ].map(l => (
              <a key={l.href} href={l.href} style={{ color: "rgba(250,245,233,0.5)", textDecoration: "none", fontFamily: "'Jost', sans-serif", fontSize: 12, letterSpacing: "0.08em" }}>{l.label}</a>
            ))}
          </div>
          <p style={{ color: "rgba(250,245,233,0.3)", fontFamily: "'Jost', sans-serif", fontSize: 11, margin: 0 }}>© {new Date().getFullYear()} Résidence Amaryllis · Sainte-Luce, Martinique</p>
        </footer>

        <MaillageCluster currentSlug="guide-se-deplacer-martinique-sud" />
      </div>
    </>
  );
}
