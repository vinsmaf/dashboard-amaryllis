// Page /politique-confidentialite — Politique de confidentialité & cookies
// Amaryllis Locations — Vincent Salomon

import SEOMeta from "./SEOMeta.jsx";

const CORAL = "var(--c-coral)";
const NAVY  = "var(--c-navy)";

function Fleur({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 92 92" aria-hidden="true">
      <g transform="translate(46 46)" fill="none">
        {[0, 60, 120, 180, 240, 300].map((rot, i) => (
          <g key={i} transform={`rotate(${rot})`}>
            <path d="M 0 0 L 0 -38 L 8 -20 Z" fill={CORAL} />
          </g>
        ))}
        <circle r="3" fill="var(--c-gold)" />
      </g>
    </svg>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{
        fontFamily: "'Jost', sans-serif",
        fontWeight: 600,
        fontSize: 13,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: CORAL,
        marginBottom: 14,
        marginTop: 0,
      }}>
        {title}
      </h2>
      <div style={{
        fontFamily: "'Jost', sans-serif",
        fontWeight: 300,
        fontSize: 14,
        lineHeight: 1.8,
        color: "var(--c-muted)",
      }}>
        {children}
      </div>
    </section>
  );
}

function TableRow({ cells, header }) {
  const Tag = header ? "th" : "td";
  return (
    <tr>
      {cells.map((c, i) => (
        <Tag key={i} style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--c-sand)",
          fontFamily: "'Jost', sans-serif",
          fontSize: 13,
          fontWeight: header ? 600 : 300,
          color: header ? NAVY : "var(--c-muted)",
          textAlign: "left",
          verticalAlign: "top",
        }}>
          {c}
        </Tag>
      ))}
    </tr>
  );
}

export default function PolitiqueConfidentialite() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--c-ivory)", color: NAVY }}>
      <SEOMeta
        title="Politique de confidentialité & cookies — Amaryllis Locations"
        description="Politique de confidentialité de villamaryllis.com : données collectées, cookies, durées de conservation, transferts hors UE et exercice de vos droits RGPD."
        canonical="/politique-confidentialite"
      />

      {/* ── Header ── */}
      <header style={{
        background: NAVY,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <Fleur size={28} />
          <div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 13, letterSpacing: "0.55em", color: "var(--c-ivory)", textTransform: "uppercase" }}>AMARYLLIS</div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 8, color: "rgba(250,245,233,0.4)", letterSpacing: "0.35em", textTransform: "uppercase", marginTop: 1 }}>LOCATIONS D'EXCEPTION</div>
          </div>
        </a>
        <a href="/" style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 11,
          fontWeight: 300,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(250,245,233,0.5)",
          textDecoration: "none",
        }}>
          ← Retour
        </a>
      </header>

      {/* ── Contenu ── */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 80px" }}>

        {/* Titre */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            fontSize: 9,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: CORAL,
            marginBottom: 12,
          }}>
            RGPD · Règlement UE 2016/679
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            fontSize: "clamp(28px, 5vw, 42px)",
            color: NAVY,
            margin: "0 0 16px",
            lineHeight: 1.15,
          }}>
            Politique de confidentialité
          </h1>
          <p style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            fontSize: 14,
            color: "var(--c-muted)",
            lineHeight: 1.7,
            maxWidth: 560,
            margin: 0,
          }}>
            Cette politique explique quelles données sont collectées lors de votre navigation sur <strong style={{ fontWeight: 500 }}>villamaryllis.com</strong>, comment elles sont utilisées, et comment exercer vos droits.
          </p>
        </div>

        <div style={{ height: 1, background: "var(--c-sand)", marginBottom: 48 }} />

        {/* 1. Responsable */}
        <Section title="1. Responsable du traitement">
          <p>
            <strong style={{ fontWeight: 600, color: NAVY }}>Vincent Salomon</strong><br />
            97228 Sainte-Luce, Martinique, France<br />
            Email : <a href="mailto:contact@villamaryllis.com" style={{ color: CORAL }}>contact@villamaryllis.com</a><br />
            Tél. : +33 6 10 88 07 72
          </p>
        </Section>

        {/* 2. Données collectées */}
        <Section title="2. Données collectées et finalités">
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
            <thead>
              <TableRow header cells={["Source", "Données", "Finalité", "Base légale"]} />
            </thead>
            <tbody>
              <TableRow cells={["Formulaire de contact", "Nom, email, message", "Répondre à votre demande", "Intérêt légitime"]} />
              <TableRow cells={["Réservation directe", "Nom, email, dates de séjour", "Gestion de la réservation et paiement", "Exécution du contrat"]} />
              <TableRow cells={["Cookies analytics", "Pages visitées, durée, source (anonymisé)", "Améliorer le site et mesurer l'audience", "Consentement"]} />
              <TableRow cells={["Logs serveur (Cloudflare)", "Adresse IP (masquée), navigateur, heure", "Sécurité et détection d'attaques", "Intérêt légitime"]} />
            </tbody>
          </table>
        </Section>

        {/* 2bis. Données réseaux sociaux (Meta) — requis pour l'App Review Meta */}
        <div id="donnees-reseaux-sociaux">
        <Section title="2 bis. Données issues de Facebook & Instagram (Meta)">
          <p style={{ marginBottom: 14 }}>
            Lorsque vous commentez l'une de nos publications sur notre <strong style={{ fontWeight: 600, color: NAVY }}>page Facebook « Amaryllis Location »</strong> ou notre <strong style={{ fontWeight: 600, color: NAVY }}>compte Instagram @amaryllislocations</strong>, ou que vous nous envoyez un message via ces plateformes, nous traitons les données suivantes via l'API officielle de Meta :
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
            <thead>
              <TableRow header cells={["Source", "Données", "Finalité", "Base légale"]} />
            </thead>
            <tbody>
              <TableRow cells={["Commentaire FB / Instagram", "Nom public, identifiant, texte du commentaire", "Identifier une demande de location et y répondre", "Intérêt légitime"]} />
              <TableRow cells={["Message privé (Messenger / DM IG)", "Nom public, contenu du message", "Vous répondre et vous orienter vers la réservation", "Exécution de mesures précontractuelles"]} />
            </tbody>
          </table>
          <ul style={{ paddingLeft: 20, lineHeight: 2.0, marginTop: 14 }}>
            <li>Nous accédons <strong style={{ fontWeight: 500, color: NAVY }}>uniquement</strong> aux interactions sur <strong style={{ fontWeight: 500, color: NAVY }}>nos propres</strong> contenus (notre page et notre compte). Nous ne lisons aucune page, groupe ou compte tiers.</li>
            <li>Aucune donnée n'est vendue ni partagée à des fins publicitaires.</li>
            <li>Conservation : <strong style={{ fontWeight: 500, color: NAVY }}>12 mois</strong> maximum après le dernier échange.</li>
          </ul>
        </Section>
        </div>

        {/* 2ter. Suppression des données — Data Deletion Instructions (requis Meta) */}
        <div id="suppression-donnees">
        <Section title="2 ter. Suppression de vos données (Facebook / Instagram)">
          <p>
            Vous pouvez à tout moment demander la suppression des données vous concernant que nous aurions collectées via Facebook ou Instagram :
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 2.2, marginTop: 10 }}>
            <li>Par email à <a href="mailto:contact@villamaryllis.com?subject=Suppression%20de%20mes%20donn%C3%A9es" style={{ color: CORAL }}>contact@villamaryllis.com</a> avec l'objet « Suppression de mes données ».</li>
            <li>Indiquez votre nom d'utilisateur Facebook ou Instagram afin que nous puissions identifier vos données.</li>
            <li>Nous traitons la demande et confirmons la suppression sous <strong style={{ fontWeight: 500, color: NAVY }}>30 jours</strong>.</li>
          </ul>
        </Section>
        </div>

        {/* 3. Cookies */}
        <Section title="3. Cookies et traceurs">
          <p style={{ marginBottom: 16 }}>
            Nous utilisons le <strong style={{ fontWeight: 600, color: NAVY }}>Consent Mode v2 de Google</strong> : les cookies d'analyse sont bloqués par défaut et ne sont activés qu'après votre accord explicite.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <TableRow header cells={["Nom", "Type", "Finalité", "Durée"]} />
            </thead>
            <tbody>
              <TableRow cells={["amaryllis-cookie-consent", "Essentiel (localStorage)", "Mémoriser votre choix de cookies", "Indéfinie (local)"]} />
              <TableRow cells={["amaryllis-theme", "Essentiel (localStorage)", "Mémoriser le thème clair/sombre", "Indéfinie (local)"]} />
              <TableRow cells={["amaryllis-lang", "Essentiel (localStorage)", "Mémoriser la langue choisie", "Indéfinie (local)"]} />
              <TableRow cells={["_ga, _ga_*", "Analytics (Google)", "Mesure d'audience anonymisée — uniquement si consentement accordé", "13 mois"]} />
            </tbody>
          </table>
          <p style={{ marginTop: 14 }}>
            Vous pouvez modifier votre choix à tout moment en{" "}
            <button
              onClick={() => { try { localStorage.removeItem("amaryllis-cookie-consent"); window.location.reload(); } catch {} }}
              style={{ background: "none", border: "none", padding: 0, color: CORAL, textDecoration: "underline", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontSize: 14, fontWeight: 300 }}
            >
              réinitialisant vos préférences cookies
            </button>
            {" "}(le bandeau réapparaîtra).
          </p>
        </Section>

        {/* 4. Durée de conservation */}
        <Section title="4. Durée de conservation">
          <ul style={{ paddingLeft: 20, lineHeight: 2.2 }}>
            <li>Données de contact : <strong style={{ fontWeight: 500, color: NAVY }}>12 mois</strong> maximum après la fin des échanges</li>
            <li>Données de réservation : <strong style={{ fontWeight: 500, color: NAVY }}>5 ans</strong> (obligation comptable)</li>
            <li>Données analytics (GA) : <strong style={{ fontWeight: 500, color: NAVY }}>13 mois</strong></li>
            <li>Logs Cloudflare : <strong style={{ fontWeight: 500, color: NAVY }}>30 jours</strong> maximum</li>
          </ul>
        </Section>

        {/* 5. Transferts hors UE */}
        <Section title="5. Transferts hors Union européenne">
          <p>Certains de nos prestataires sont établis aux États-Unis. Ces transferts sont encadrés par des garanties appropriées :</p>
          <ul style={{ paddingLeft: 20, lineHeight: 2.2, marginTop: 10 }}>
            <li><strong style={{ fontWeight: 500, color: NAVY }}>Cloudflare, Inc.</strong> — Clauses Contractuelles Types (SCCs) · <a href="https://www.cloudflare.com/gdpr/introduction/" target="_blank" rel="noopener noreferrer" style={{ color: CORAL }}>détails</a></li>
            <li><strong style={{ fontWeight: 500, color: NAVY }}>Google LLC</strong> (Analytics, Places API) — Clauses Contractuelles Types · <a href="https://business.safety.google/gdpr/" target="_blank" rel="noopener noreferrer" style={{ color: CORAL }}>détails</a></li>
            <li><strong style={{ fontWeight: 500, color: NAVY }}>Stripe, Inc.</strong> — Clauses Contractuelles Types · <a href="https://stripe.com/fr/legal/dpa" target="_blank" rel="noopener noreferrer" style={{ color: CORAL }}>détails</a></li>
            <li><strong style={{ fontWeight: 500, color: NAVY }}>Beds24 Ltd</strong> (gestion des réservations, Nogent-sur-Marne) — Contrat de sous-traitance · <a href="https://www.beds24.com/dataprocessingagreement.html" target="_blank" rel="noopener noreferrer" style={{ color: CORAL }}>détails</a></li>
          </ul>
        </Section>

        {/* 6. Vos droits */}
        <Section title="6. Vos droits">
          <p>Conformément au RGPD (Règlement UE 2016/679), vous disposez des droits suivants :</p>
          <ul style={{ paddingLeft: 20, lineHeight: 2.2, marginTop: 10 }}>
            <li><strong style={{ fontWeight: 500, color: NAVY }}>Droit d'accès</strong> — connaître les données vous concernant</li>
            <li><strong style={{ fontWeight: 500, color: NAVY }}>Droit de rectification</strong> — corriger des données inexactes</li>
            <li><strong style={{ fontWeight: 500, color: NAVY }}>Droit à l'effacement</strong> — demander la suppression de vos données</li>
            <li><strong style={{ fontWeight: 500, color: NAVY }}>Droit d'opposition</strong> — s'opposer au traitement fondé sur l'intérêt légitime</li>
            <li><strong style={{ fontWeight: 500, color: NAVY }}>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
            <li><strong style={{ fontWeight: 500, color: NAVY }}>Droit de retrait du consentement</strong> — à tout moment pour les cookies analytics</li>
          </ul>
          <p style={{ marginTop: 16 }}>
            Pour exercer ces droits : <a href="mailto:contact@villamaryllis.com" style={{ color: CORAL }}>contact@villamaryllis.com</a><br />
            En cas de réclamation non résolue, vous pouvez saisir la{" "}
            <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" style={{ color: CORAL }}>
              CNIL
            </a>{" "}
            (Commission Nationale de l'Informatique et des Libertés).
          </p>
        </Section>

        {/* 7. Modification */}
        <Section title="7. Modification de cette politique">
          <p>
            Cette politique peut être mise à jour pour refléter des changements légaux ou techniques. La date de mise à jour est indiquée en bas de page. Nous vous invitons à la consulter régulièrement.
          </p>
          <p style={{ marginTop: 12, fontSize: 12, fontStyle: "italic" }}>
            Dernière mise à jour : mai 2026
          </p>
        </Section>

      </main>

      {/* ── Footer minimal ── */}
      <footer style={{
        borderTop: "1px solid var(--c-sand)",
        padding: "20px 24px",
        textAlign: "center",
        fontFamily: "'Jost', sans-serif",
        fontSize: 11,
        color: "var(--c-muted)",
        display: "flex",
        justifyContent: "center",
        gap: 20,
        flexWrap: "wrap",
      }}>
        <span>© Amaryllis Locations 2026</span>
        <a href="/mentions-legales" style={{ color: "var(--c-muted)", textDecoration: "none" }}>Mentions légales</a>
        <a href="/" style={{ color: "var(--c-muted)", textDecoration: "none" }}>villamaryllis.com</a>
      </footer>

    </div>
  );
}
