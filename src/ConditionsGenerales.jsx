// Page /conditions-generales — Conditions Générales de Vente (CGV)
// Amaryllis Locations — Vincent Salomon
// Obligatoire : encaissement Stripe de réservations (art. L.111-1 Code de la consommation)

import SEOMeta from "./SEOMeta.jsx";

const CORAL = "var(--c-coral)";
const NAVY  = "var(--c-navy)";
const MUTED = "var(--c-muted)";

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

function Section({ num, title, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{
        fontFamily: "'Jost', sans-serif",
        fontWeight: 600,
        fontSize: 16,
        color: NAVY,
        margin: "0 0 14px",
        paddingBottom: 10,
        borderBottom: "1px solid var(--c-sand)",
        display: "flex",
        gap: 10,
        alignItems: "baseline",
      }}>
        <span style={{ color: CORAL, fontWeight: 300, fontSize: 13 }}>Art. {num}</span>
        {title}
      </h2>
      <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 14, color: "var(--c-text)", lineHeight: 1.85 }}>
        {children}
      </div>
    </section>
  );
}

function P({ children, style }) {
  return <p style={{ margin: "0 0 12px", ...style }}>{children}</p>;
}

function Ul({ children }) {
  return <ul style={{ margin: "8px 0 12px 20px", padding: 0 }}>{children}</ul>;
}

function Li({ children }) {
  return <li style={{ marginBottom: 6 }}>{children}</li>;
}

export default function ConditionsGenerales() {
  const dateMAJ = "24 mai 2026";

  return (
    <>
      <SEOMeta
        title="Conditions Générales de Vente — Amaryllis Locations"
        description="CGV de villamaryllis.com : réservation, annulation, caution, responsabilités. Applicable à toutes les locations Amaryllis en Martinique et Île-de-France."
        canonical="/conditions-generales"
        image="https://villamaryllis.com/photos/amaryllis/01.webp"
        noindex={false}
      />

      <div style={{
        background: "var(--c-ivory)",
        minHeight: "100vh",
        fontFamily: "'Jost', system-ui, -apple-system, sans-serif",
      }}>
        {/* Header */}
        <div style={{ background: NAVY, padding: "56px 24px 48px", textAlign: "center" }}>
          <Fleur size={40} color={CORAL} />
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 400,
            fontSize: "clamp(28px, 5vw, 42px)",
            color: "var(--c-ivory)",
            margin: "16px 0 8px",
            letterSpacing: "0.04em",
          }}>
            Conditions Générales de Vente
          </h1>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: "rgba(250,245,233,0.5)", letterSpacing: "0.08em" }}>
            Amaryllis Locations · En vigueur depuis le {dateMAJ}
          </p>
        </div>

        {/* Contenu */}
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px 80px" }}>

          {/* Préambule */}
          <div style={{
            background: "var(--c-cream)",
            border: "1px solid var(--c-sand)",
            borderRadius: 10,
            padding: "20px 24px",
            marginBottom: 40,
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            fontSize: 13,
            color: MUTED,
            lineHeight: 1.7,
          }}>
            Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent toute réservation effectuée directement via le site <strong style={{ color: NAVY }}>villamaryllis.com</strong> et s'appliquent entre Amaryllis Locations (ci-après « le Propriétaire ») et toute personne procédant à une réservation (ci-après « le Voyageur »). Toute réservation implique l'acceptation sans réserve des présentes CGV.
          </div>

          <Section num="1" title="Identité du prestataire">
            <P><strong>Amaryllis Locations</strong><br />
            Propriétaire individuel — Vincent Salomon<br />
            Adresse : disponible sur demande à contact@villamaryllis.com<br />
            Email : <a href="mailto:contact@villamaryllis.com" style={{ color: CORAL }}>contact@villamaryllis.com</a><br />
            Téléphone / WhatsApp : <a href="tel:+33610880772" style={{ color: CORAL }}>+33 6 10 88 07 72</a><br />
            Site : <a href="https://villamaryllis.com" style={{ color: CORAL }}>villamaryllis.com</a>
            </P>
          </Section>

          <Section num="2" title="Propriétés concernées">
            <P>Les présentes CGV s'appliquent à l'ensemble des hébergements proposés par Amaryllis Locations :</P>
            <Ul>
              <Li><strong>Villa Amaryllis</strong> — Sainte-Luce, Martinique (97228)</Li>
              <Li><strong>Zandoli</strong> — Sainte-Luce, Martinique (97228)</Li>
              <Li><strong>Géko</strong> — Sainte-Luce, Martinique (97228)</Li>
              <Li><strong>Mabouya</strong> — Sainte-Luce, Martinique (97228)</Li>
              <Li><strong>Bellevue Schœlcher</strong> — Schœlcher, Martinique (97228)</Li>
              <Li><strong>Villa Iguana</strong> — Sainte-Luce, Martinique (97228) — location longue durée uniquement</Li>
              <Li><strong>Appartement Nogent</strong> — Nogent-sur-Marne, Île-de-France (94130)</Li>
            </Ul>
          </Section>

          <Section num="3" title="Formation du contrat de location">
            <P>La réservation est constituée des étapes suivantes :</P>
            <Ul>
              <Li>Le Voyageur sélectionne les dates, complète le formulaire de réservation et procède au paiement en ligne via Stripe (paiement par carte bancaire sécurisé).</Li>
              <Li>Le paiement est débité immédiatement lors de la confirmation de réservation.</Li>
              <Li>Le Propriétaire envoie une confirmation de réservation par email dans les 24h ouvrables.</Li>
              <Li>Le contrat de location est formé au moment de la confirmation par le Propriétaire.</Li>
            </Ul>
            <P>En cas d'indisponibilité, le Propriétaire remboursera intégralement les sommes perçues dans un délai de 5 jours ouvrés.</P>
          </Section>

          <Section num="4" title="Prix et paiement">
            <P>Les prix sont indiqués en euros (€), toutes taxes comprises. Ils comprennent :</P>
            <Ul>
              <Li>Le loyer pour la durée du séjour</Li>
              <Li>Les charges locatives courantes (eau, électricité dans les limites d'un usage normal, Wi-Fi)</Li>
              <Li>Le linge de maison (draps, serviettes) selon les propriétés</Li>
            </Ul>
            <P>Ne sont pas inclus : le ménage de fin de séjour (forfait indiqué à la réservation) et les consommations exceptionnelles.</P>
            <P><strong>Taxe de séjour :</strong> La taxe de séjour instituée par la commune du bien (Sainte-Luce, Schœlcher ou Nogent-sur-Marne) est due par le Voyageur conformément au Code général des collectivités territoriales. Pour les réservations via les plateformes (Airbnb, Booking.com), elle est collectée et reversée directement par celles-ci. Pour les <strong>réservations en direct</strong>, elle est facturée séparément, indiquée dans le récapitulatif de réservation, et reversée à la commune par le Propriétaire.</P>
            <P><strong>Moyen de paiement :</strong> Carte bancaire via Stripe (Visa, Mastercard, American Express). Les données de paiement sont traitées exclusivement par Stripe Inc. et ne sont pas stockées par Amaryllis Locations.</P>
            <P><strong>Acompte et solde :</strong> Pour les réservations en direct, un <strong>acompte de 40 %</strong> du montant total est prélevé à la réservation pour la confirmer. Le <strong>solde de 60 %</strong> est prélevé automatiquement <strong>au plus tard 30 jours avant l'arrivée</strong>. Pour une réservation effectuée à moins de 30 jours de l'arrivée, la totalité est due immédiatement. À défaut de paiement du solde à l'échéance, la réservation peut être considérée comme annulée et l'acompte conservé (cf. conditions d'annulation).</P>
          </Section>

          <Section num="5" title="Caution (dépôt de garantie)">
            <P>Une caution peut être demandée en sus du loyer. Elle prend la forme d'une <strong>pré-autorisation bancaire</strong> (empreinte CB) via Stripe :</P>
            <Ul>
              <Li>Aucun débit n'est effectué au moment de la réservation : les fonds sont simplement bloqués, puis libérés.</Li>
              <Li>En validant votre réservation, <strong>vous autorisez Amaryllis Locations à enregistrer votre carte et à effectuer cette pré-autorisation de caution automatiquement quelques jours avant votre arrivée</strong> (généralement 2 à 3 jours avant), sans nouvelle action de votre part. Vous en êtes informé(e) par email.</Li>
              <Li>La pré-autorisation est levée automatiquement dans un délai de <strong>3 jours après le départ</strong> du Voyageur, en l'absence de dommages constatés.</Li>
              <Li>En cas de dommages, le Propriétaire notifie le Voyageur par email dans les 3 jours suivant le départ, avec justificatifs, et procède au débit correspondant dans la limite du montant pré-autorisé.</Li>
              <Li>Tout litige relatif à la caution doit être soumis par écrit dans un délai de 8 jours suivant la notification.</Li>
            </Ul>
            <P>Le montant de la caution est précisé dans le récapitulatif de réservation.</P>
          </Section>

          <Section num="6" title="Conditions d'annulation">
            <P><strong>Politique d'annulation standard (hors offres spéciales) :</strong></P>
            <Ul>
              <Li><strong>Annulation ≥ 30 jours avant l'arrivée :</strong> remboursement intégral.</Li>
              <Li><strong>Annulation entre 15 et 29 jours avant l'arrivée :</strong> remboursement de 50 % du montant total.</Li>
              <Li><strong>Annulation &lt; 15 jours avant l'arrivée :</strong> aucun remboursement.</Li>
            </Ul>
            <P><strong>Cas de force majeure :</strong> En cas d'événement imprévisible, irrésistible et extérieur (catastrophe naturelle, fermeture administrative, épidémie reconnue par les autorités) rendant le séjour impossible, le Propriétaire proposera au choix du Voyageur : un report du séjour ou un avoir valable 12 mois.</P>
            <P>Toute annulation doit être notifiée par écrit à <a href="mailto:contact@villamaryllis.com" style={{ color: CORAL }}>contact@villamaryllis.com</a>. La date de réception de l'email fait foi.</P>
            <P><strong>Droit de rétractation :</strong> Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation de 14 jours ne s'applique pas aux prestations d'hébergement pour une date ou période déterminée.</P>
          </Section>

          <Section num="7" title="Obligations du Voyageur">
            <Ul>
              <Li>Respecter le règlement intérieur de chaque propriété (remis à l'arrivée et disponible sur demande).</Li>
              <Li>Ne pas dépasser la capacité maximale d'accueil indiquée.</Li>
              <Li>Informer immédiatement le Propriétaire de tout dommage survenu pendant le séjour.</Li>
              <Li>Restituer l'hébergement dans l'état dans lequel il a été trouvé à l'arrivée.</Li>
              <Li>Ne pas sous-louer ou céder la location sans accord écrit préalable du Propriétaire.</Li>
              <Li>Respecter la tranquillité du voisinage (règlement de nuit applicable).</Li>
            </Ul>
          </Section>

          <Section num="8" title="Obligations du Propriétaire">
            <Ul>
              <Li>Mettre à disposition l'hébergement dans l'état décrit sur le site, propre et en bon état de fonctionnement.</Li>
              <Li>Fournir les équipements mentionnés dans la description de chaque propriété.</Li>
              <Li>Assurer la disponibilité du logement aux dates réservées.</Li>
              <Li>Répondre aux sollicitations du Voyageur dans un délai raisonnable.</Li>
            </Ul>
          </Section>

          <Section num="9" title="Responsabilités">
            <P><strong>Responsabilité du Propriétaire :</strong> La responsabilité du Propriétaire ne saurait être engagée en cas de panne d'équipements non essentiels (piscine, jacuzzi, climatisation) pour lesquels il s'engage à tout mettre en œuvre pour remédier au dysfonctionnement dans les meilleurs délais. En cas d'impossibilité de séjour imputable au Propriétaire, le remboursement intégral est garanti.</P>
            <P><strong>Responsabilité du Voyageur :</strong> Le Voyageur est responsable de tout dommage causé à l'hébergement ou à ses équipements pendant la durée du séjour. Les dommages sont à la charge du Voyageur à hauteur du montant de la caution, sans préjudice de dommages-intérêts supplémentaires en cas de préjudice excédant ce montant.</P>
          </Section>

          <Section num="10" title="Animaux de compagnie">
            <P>Les animaux de compagnie ne sont pas acceptés dans nos propriétés, sauf accord écrit préalable et explicite du Propriétaire. Tout manquement à cette règle entraîne la résiliation immédiate du contrat sans remboursement et la retenue de la caution.</P>
          </Section>

          <Section num="11" title="Arrivée et départ">
            <P><strong>Arrivée (check-in) :</strong> à partir de <strong>17h00</strong>. Un arrangement anticipé peut être convenu sous réserve de disponibilité.<br />
            <strong>Départ (check-out) :</strong> avant <strong>12h00</strong>. Un départ tardif peut être accordé sur demande, sous réserve de disponibilité.</P>
            <P>Les modalités d'accès (codes, boîte à clés) sont communiquées par email ou WhatsApp dans les 24h précédant l'arrivée.</P>
          </Section>

          <Section num="12" title="Protection des données personnelles">
            <P>Les données collectées lors de la réservation (nom, email, téléphone) sont utilisées exclusivement pour la gestion du séjour et ne sont pas cédées à des tiers. Le Voyageur dispose d'un droit d'accès, de rectification et de suppression à : <a href="mailto:contact@villamaryllis.com" style={{ color: CORAL }}>contact@villamaryllis.com</a>.</P>
            <P>Les données sont conservées <strong>3 ans</strong> après le dernier contact (relation client) et <strong>10 ans</strong> pour les pièces comptables (art. L.123-22 du Code de commerce). Sous-traitants : Stripe (paiement), Beds24 (réservations), Cloudflare (hébergement), Google Workspace. En cas de désaccord, le Voyageur peut introduire une réclamation auprès de la <strong>CNIL</strong>.</P>
            <P>Pour plus d'informations : <a href="/politique-confidentialite" style={{ color: CORAL }}>politique de confidentialité</a>.</P>
          </Section>

          <Section num="13" title="Droit applicable et litiges">
            <P>Les présentes CGV sont régies par le droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, le litige sera soumis :</P>
            <Ul>
              <Li>Pour les propriétés en Martinique : au Tribunal judiciaire de Fort-de-France.</Li>
              <Li>Pour l'appartement de Nogent-sur-Marne : au Tribunal judiciaire de Créteil.</Li>
            </Ul>
            <P><strong>Médiation :</strong> Conformément aux articles L.612-1 et suivants du Code de la consommation, le Voyageur peut recourir gratuitement à un médiateur de la consommation. Coordonnées disponibles sur : <a href="https://www.economie.gouv.fr/mediation-conso" target="_blank" rel="noopener noreferrer" style={{ color: CORAL }}>economie.gouv.fr/mediation-conso</a>.</P>
          </Section>

          <Section num="14" title="Modification des CGV">
            <P>Le Propriétaire se réserve le droit de modifier les présentes CGV à tout moment. Les CGV applicables sont celles en vigueur à la date de la réservation. La version actuellement applicable est datée du <strong>{dateMAJ}</strong>.</P>
          </Section>

          {/* Footer de page */}
          <div style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: "1px solid var(--c-sand)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            fontSize: 12,
            color: MUTED,
          }}>
            <span>Amaryllis Locations · CGV en vigueur depuis le {dateMAJ}</span>
            <div style={{ display: "flex", gap: 16 }}>
              <a href="/mentions-legales" style={{ color: MUTED, textDecoration: "none" }}>Mentions légales</a>
              <a href="/politique-confidentialite" style={{ color: MUTED, textDecoration: "none" }}>Confidentialité</a>
              <a href="/" style={{ color: CORAL, textDecoration: "none" }}>← Retour</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
