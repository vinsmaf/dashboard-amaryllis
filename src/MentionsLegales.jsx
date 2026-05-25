// Page /mentions-legales — Mentions légales & politique de confidentialité
// Amaryllis Locations — Vincent Salomon

import SEOMeta from "./SEOMeta.jsx";

const CORAL = "var(--c-coral)";
const NAVY  = "var(--c-navy)";

/* ── Fleur SVG (identique header Avis / autres pages) ── */
function Fleur({ size = 32, color = CORAL }) {
  return (
    <svg width={size} height={size} viewBox="0 0 92 92" aria-hidden="true">
      <g transform="translate(46 46)" fill="none">
        {[0, 60, 120, 180, 240, 300].map((rot, i) => (
          <g key={i} transform={`rotate(${rot})`}>
            <path d="M 0 0 L 0 -38 L 8 -20 Z" fill={color} />
          </g>
        ))}
        <circle r="3" fill="var(--c-gold)" />
      </g>
    </svg>
  );
}

/* ── Section avec titre ── */
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

/* ── Ligne info ── */
function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
      <span style={{ fontWeight: 500, color: NAVY, minWidth: 180, fontSize: 13 }}>{label}</span>
      <span style={{ color: "var(--c-muted)", fontSize: 13 }}>{value}</span>
    </div>
  );
}

/* ── Composant principal ── */
export default function MentionsLegales() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--c-ivory)", color: NAVY }}>
      <SEOMeta
        title="Mentions légales — Amaryllis Locations"
        description="Mentions légales du site villamaryllis.com — éditeur, hébergement, propriété intellectuelle, données personnelles et politique de confidentialité."
        canonical="/mentions-legales"
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
          <Fleur size={28} color={CORAL} />
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
            Informations légales
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
            fontSize: "clamp(28px, 5vw, 42px)",
            color: NAVY,
            margin: "0 0 16px",
            lineHeight: 1.15,
          }}>
            Mentions légales
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
            Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l'Économie Numérique (LCEN), nous vous informons de l'identité des différents intervenants dans le cadre de la réalisation et du suivi de ce site.
          </p>
        </div>

        {/* Séparateur */}
        <div style={{ height: 1, background: "var(--c-sand)", marginBottom: 48 }} />

        {/* 1. Éditeur */}
        <Section title="1. Éditeur du site">
          <InfoRow label="Responsable de publication" value="Salomon Vincent" />
          <InfoRow label="Adresse" value="97228 Sainte-Luce, Martinique, France" />
          <InfoRow label="Email" value="contact@villamaryllis.com" />
          <InfoRow label="Téléphone" value="+33 6 10 88 07 72" />
          <InfoRow label="Activité" value="Location de meublés de tourisme (particulier)" />
          <p style={{ marginTop: 14 }}>
            Ce site est exploité à titre personnel. L'éditeur agit en qualité de particulier proposant des locations saisonnières de courte durée.
          </p>
        </Section>

        {/* 2. Hébergeur */}
        <Section title="2. Hébergement">
          <InfoRow label="Hébergeur" value="Cloudflare Pages" />
          <InfoRow label="Société" value="Cloudflare, Inc." />
          <InfoRow label="Adresse" value="101 Townsend St, San Francisco, CA 94107, États-Unis" />
          <InfoRow label="Site web" value="cloudflare.com" />
          <p style={{ marginTop: 14 }}>
            Les fonctions serveur (proxy API) sont exécutées via Cloudflare Workers déployés dans l'infrastructure Cloudflare.
          </p>
        </Section>

        {/* 3. Propriété intellectuelle */}
        <Section title="3. Propriété intellectuelle">
          <p>
            L'ensemble du contenu de ce site — textes, photographies, logo, identité visuelle — est la propriété exclusive de Vincent Salomon ou de ses contributeurs et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
          </p>
          <p style={{ marginTop: 12 }}>
            Toute reproduction, représentation, modification, publication ou transmission, totale ou partielle, du contenu de ce site, par quelque procédé que ce soit, est interdite sans autorisation préalable écrite.
          </p>
        </Section>

        {/* 4. Données personnelles */}
        <Section title="4. Données personnelles & cookies">
          <p>
            <strong style={{ fontWeight: 600, color: NAVY }}>Données collectées</strong><br />
            Lors de l'utilisation du formulaire de contact, les informations suivantes sont collectées : nom, adresse e-mail, message. Ces données sont utilisées exclusivement pour répondre à votre demande et ne sont pas transmises à des tiers.
          </p>
          <p style={{ marginTop: 14 }}>
            <strong style={{ fontWeight: 600, color: NAVY }}>Durée de conservation</strong><br />
            Les données de contact sont conservées le temps nécessaire au traitement de votre demande, et au maximum 12 mois.
          </p>
          <p style={{ marginTop: 14 }}>
            <strong style={{ fontWeight: 600, color: NAVY }}>Services tiers</strong><br />
            Ce site fait appel aux services suivants, susceptibles de traiter des données techniques (adresse IP) :
          </p>
          <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
            <li><strong style={{ fontWeight: 500, color: NAVY }}>Cloudflare</strong> — hébergement et protection DDoS (États-Unis) · <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" style={{ color: CORAL }}>politique de confidentialité</a></li>
            <li><strong style={{ fontWeight: 500, color: NAVY }}>Google Places API</strong> — affichage des avis Google · <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: CORAL }}>politique de confidentialité</a></li>
            <li><strong style={{ fontWeight: 500, color: NAVY }}>Stripe</strong> — paiement sécurisé en ligne (États-Unis) · <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer" style={{ color: CORAL }}>politique de confidentialité</a></li>
            <li><strong style={{ fontWeight: 500, color: NAVY }}>Google Analytics</strong> — mesure d'audience anonymisée · <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: CORAL }}>politique de confidentialité</a></li>
          </ul>
          <p style={{ marginTop: 14 }}>
            <strong style={{ fontWeight: 600, color: NAVY }}>Cookies</strong><br />
            Ce site utilise des cookies techniques nécessaires à son bon fonctionnement (préférences de langue, thème) et des cookies d'analyse d'audience (Google Analytics) collectant des données anonymisées. Aucun cookie publicitaire n'est déposé.
          </p>
          <p style={{ marginTop: 14 }}>
            <strong style={{ fontWeight: 600, color: NAVY }}>Vos droits</strong><br />
            Conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679), vous disposez d'un droit d'accès, de rectification, d'effacement et d'opposition aux données vous concernant. Pour exercer ces droits, contactez-nous à <a href="mailto:contact@villamaryllis.com" style={{ color: CORAL }}>contact@villamaryllis.com</a>. Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: CORAL }}>CNIL</a>.
          </p>
        </Section>

        {/* 5. Responsabilité */}
        <Section title="5. Limitation de responsabilité">
          <p>
            Les informations contenues sur ce site sont fournies à titre indicatif. Les prix, disponibilités et caractéristiques des logements sont susceptibles d'évoluer. L'éditeur ne saurait être tenu responsable des erreurs ou omissions, ni de l'utilisation faite des informations présentées.
          </p>
          <p style={{ marginTop: 12 }}>
            Les liens hypertextes présents sur ce site vers d'autres sites internet ne sauraient engager la responsabilité de l'éditeur quant au contenu de ces sites.
          </p>
        </Section>

        {/* 6. Droit applicable */}
        <Section title="6. Droit applicable">
          <p>
            Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront compétents.
          </p>
          <p style={{ marginTop: 12, fontSize: 12, color: "var(--c-muted)", fontStyle: "italic" }}>
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
      }}>
        © Amaryllis Locations 2026 · <a href="/" style={{ color: "var(--c-muted)", textDecoration: "none" }}>villamaryllis.com</a>
        {" · "}
        <a href="/politique-confidentialite" style={{ color: "var(--c-muted)", textDecoration: "none" }}>Politique de confidentialité</a>
      </footer>

    </div>
  );
}
