// Cloudflare Pages Function — GET /confidentialite
// Page de politique de confidentialité — requise pour la soumission App Review Meta.

const HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Politique de confidentialité — Amaryllis Locations</title>
<style>
  body{font-family:Georgia,serif;max-width:760px;margin:0 auto;padding:2rem 1.5rem;color:#1a1a1a;line-height:1.75}
  h1{font-size:1.6rem;margin-bottom:.25rem}
  h2{font-size:1.15rem;margin-top:2rem;border-bottom:1px solid #e0ddd8;padding-bottom:.4rem}
  a{color:#1a4a7a}
  .back{display:inline-block;margin-bottom:1.5rem;font-family:sans-serif;font-size:.9rem;color:#555;text-decoration:none}
  .back:hover{color:#1a4a7a}
  footer{margin-top:3rem;font-size:.85rem;color:#777;border-top:1px solid #e0ddd8;padding-top:1rem;font-family:sans-serif}
</style>
</head>
<body>
<a class="back" href="/">← Retour au site</a>
<h1>Politique de confidentialité</h1>
<p><strong>Dernière mise à jour :</strong> juin 2026</p>

<h2>1. Responsable du traitement</h2>
<p>
  <strong>Amaryllis Locations</strong>, exploitée par Vincent Salomon.<br>
  Adresse : Martinique, France (DOM).<br>
  Contact : <a href="mailto:contact@villamaryllis.com">contact@villamaryllis.com</a>
</p>

<h2>2. Données collectées et finalités</h2>

<h3>2.1 Cookies et analytics</h3>
<p>Avec votre consentement (bannière cookies), nous utilisons :</p>
<ul>
  <li><strong>Google Analytics 4 (GA4)</strong> — mesure d'audience (pages vues, sessions, provenance des visiteurs). Données anonymisées, conservées 14 mois. <a href="https://policies.google.com/privacy" target="_blank">Politique Google</a>.</li>
  <li><strong>Meta Pixel</strong> — mesure de l'efficacité de nos publicités Facebook/Instagram. Données transmises à Meta Platforms Ireland Ltd. <a href="https://www.facebook.com/privacy/policy/" target="_blank">Politique Meta</a>.</li>
</ul>
<p>Sans votre consentement, aucun cookie de suivi n'est déposé.</p>

<h3>2.2 Formulaire de contact</h3>
<p>Nom, adresse e-mail, message — utilisés uniquement pour répondre à votre demande. Conservés 3 ans maximum.</p>

<h3>2.3 Réservations directes</h3>
<p>Nom, prénom, e-mail, téléphone, dates de séjour, montant payé — nécessaires à l'exécution du contrat de location. Conservés 5 ans (obligation comptable). Paiement traité par Stripe, Inc. (PCI-DSS) — nous ne stockons jamais vos données bancaires.</p>

<h3>2.4 Commentaires sur Facebook et Instagram</h3>
<p>
  Notre page Facebook (<strong>Amaryllis Location</strong>) et notre compte Instagram (<strong>@amaryllislocations</strong>) utilisent un outil automatisé pour détecter les commentaires de personnes recherchant une location saisonnière en Martinique. Lorsqu'un tel commentaire est identifié :
</p>
<ul>
  <li>Nous lisons le contenu public du commentaire (texte visible de tous).</li>
  <li>Nous pouvons y répondre publiquement avec un message d'accueil et le lien vers notre site.</li>
  <li>Nous pouvons envoyer <strong>un seul</strong> message privé contenant notre lien de réservation.</li>
</ul>
<p>
  Nous n'accédons qu'à nos propres surfaces (notre page et notre compte). Nous ne collectons pas de données personnelles au-delà du commentaire public. Vous pouvez supprimer votre commentaire à tout moment pour mettre fin à ce traitement.
  <br>Base légale : intérêt légitime (prospection commerciale auprès de personnes ayant manifesté un intérêt).
</p>

<h2>3. Partage des données</h2>
<p>Nous ne vendons pas vos données. Elles sont partagées uniquement avec :</p>
<ul>
  <li>Nos prestataires techniques (Cloudflare, Stripe, Resend, Google, Meta) dans le cadre de leurs conditions d'utilisation respectives.</li>
  <li>Nos partenaires opérationnels (conciergerie locale pour la remise des clés) dans la limite du strict nécessaire.</li>
</ul>

<h2>4. Vos droits (RGPD)</h2>
<p>Vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition et de portabilité de vos données. Pour exercer ces droits, contactez-nous à <a href="mailto:contact@villamaryllis.com">contact@villamaryllis.com</a>. Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank">CNIL</a>.</p>

<h2>5. Sécurité et hébergement</h2>
<p>Le site est hébergé par <strong>Cloudflare, Inc.</strong> (infrastructure mondiale, certifiée SOC 2). Les communications sont chiffrées via HTTPS/TLS. Les données de réservation sont stockées dans une base Cloudflare D1 (région UE).</p>

<h2>6. Cookies — gestion de votre consentement</h2>
<p>Vous pouvez modifier votre choix à tout moment en cliquant sur "Paramètres cookies" en bas de page, ou en effaçant les cookies de votre navigateur.</p>

<footer>
  © 2024-2026 Amaryllis Locations — <a href="/">villamaryllis.com</a><br>
  Politique de confidentialité — Mentions légales
</footer>
</body>
</html>`;

export async function onRequestGet() {
  return new Response(HTML, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
