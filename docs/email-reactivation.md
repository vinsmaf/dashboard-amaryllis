# Email de réactivation — Amaryllis Locations

Segment : voyageurs sans réservation depuis 12 mois ou plus.
Code promo : `RETOUR10` (−10% sur la prochaine réservation directe).

---

## VERSION FR

### Objets — variantes A/B/C

| Variante | Objet |
|---|---|
| A | {{prenom}}, la Martinique vous attend encore |
| B | Votre villa préférée est libre cet été |
| C | Un an déjà — et si vous reveniez à Sainte-Luce ? |

> **Recommandation de test :** A/B sur les 40 % premiers envois, gagnant sur les 60 % restants. C est un wildcard à tester si la base est segmentée par saison.

### Préheader

> Une offre réservée à nos anciens voyageurs — −10% avec le code RETOUR10, valable jusqu'au [date limite].

---

### Corps HTML — Brevo-ready

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Amaryllis Locations</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f5f0e8; font-family: Georgia, 'Times New Roman', serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #1a2744; padding: 32px 40px; text-align: center; }
    .header img { height: 40px; }
    .hero { background-color: #1a2744; padding: 0 40px 40px; text-align: center; }
    .hero-eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #c4a882; margin: 0 0 16px; }
    .hero-title { font-size: 32px; line-height: 1.25; color: #f5f0e8; margin: 0 0 20px; font-style: italic; }
    .hero-lead { font-size: 16px; line-height: 1.7; color: #c4c8d4; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .body { padding: 48px 40px; }
    .body p { font-size: 16px; line-height: 1.8; color: #2c3e50; margin: 0 0 20px; }
    .body p.salutation { font-size: 18px; font-style: italic; color: #1a2744; }
    .promo-box { background-color: #f5f0e8; border-left: 3px solid #c4a882; padding: 24px 28px; margin: 32px 0; }
    .promo-box p { margin: 0 0 8px; font-size: 15px; color: #2c3e50; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .promo-box p:last-child { margin: 0; }
    .promo-code { font-size: 22px; font-weight: bold; letter-spacing: 3px; color: #1a2744; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .cta-block { text-align: center; margin: 40px 0; }
    .cta-button { display: inline-block; background-color: #c4a882; color: #1a2744; text-decoration: none; padding: 16px 36px; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; }
    .property-note { font-size: 14px; font-style: italic; color: #6b7280; font-family: 'Helvetica Neue', Arial, sans-serif; text-align: center; margin-top: 12px; }
    .divider { border: none; border-top: 1px solid #e8e0d4; margin: 32px 0; }
    .signature { font-size: 15px; line-height: 1.8; color: #2c3e50; }
    .signature .name { font-weight: 600; color: #1a2744; }
    .footer { background-color: #f5f0e8; padding: 28px 40px; }
    .footer p { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #9ca3af; margin: 0 0 6px; text-align: center; line-height: 1.6; }
    .footer a { color: #9ca3af; text-decoration: underline; }

    @media (max-width: 480px) {
      .header, .hero, .body, .footer { padding-left: 24px; padding-right: 24px; }
      .hero-title { font-size: 26px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- En-tête -->
    <div class="header">
      <!-- Remplacer par le logo SVG Amaryllis en blanc -->
      <span style="font-family:'Helvetica Neue',Arial,sans-serif; font-size:18px; letter-spacing:3px; text-transform:uppercase; color:#f5f0e8; font-weight:300;">AMARYLLIS</span>
    </div>

    <!-- Hero -->
    <div class="hero">
      <p class="hero-eyebrow">Locations d'exception · Martinique</p>
      <h1 class="hero-title">La Martinique n'a pas oublié votre passage.</h1>
      <p class="hero-lead">Nous non plus.</p>
    </div>

    <!-- Corps -->
    <div class="body">

      <p class="salutation">Cher(e) {{prenom}},</p>

      <!-- Bloc personnalisé si {{bien_precedent}} connu — voir §Notes de personnalisation -->
      <!-- VARIANTE A : bien_precedent connu -->
      <!--
      <p>
        Cela fait bientôt un an que vous avez quitté {{bien_precedent}}.
        Les alizés soufflent toujours, le jardin est en fleurs, et les couchers de soleil
        sur la baie de Sainte-Luce sont — croyez-le — encore plus beaux qu'à votre souvenir.
      </p>
      -->

      <!-- VARIANTE B : bien_precedent inconnu (fallback générique) -->
      <p>
        Cela fait bientôt un an que vous avez quitté nos rivages martiniquais.
        Les alizés soufflent toujours, le jardin est en fleurs, et les couchers de soleil
        sur la baie de Sainte-Luce sont — croyez-le — encore plus beaux qu'à votre souvenir.
      </p>

      <p>
        Votre séjour du {{date_dernier_sejour}} nous a laissé un excellent souvenir.
        Nous espérons qu'il vous a laissé le même — et peut-être l'envie de prolonger l'histoire.
      </p>

      <!-- Offre retour -->
      <div class="promo-box">
        <p>Pour vous, une offre réservée aux anciens voyageurs :</p>
        <p class="promo-code">RETOUR10</p>
        <p>−10% sur votre prochaine réservation directe sur villamaryllis.com.</p>
        <p>Code valable jusqu'au [date_limite] · Non cumulable avec d'autres promotions.</p>
      </div>

      <p>
        Toutes nos villas sont disponibles à la réservation directe — sans frais de service,
        avec notre équipe joignable en moins d'une heure. Exactement comme lors de votre premier séjour.
      </p>

      <!-- CTA -->
      <div class="cta-block">
        <a href="https://villamaryllis.com?utm_source=brevo&utm_medium=email&utm_campaign=reactivation_12m&utm_content=cta_main" class="cta-button">
          Revoir mes villas favorites &rarr;
        </a>
        <p class="property-note">villamaryllis.com · Réservation directe, sans frais de service</p>
      </div>

      <hr class="divider" />

      <!-- Signature -->
      <div class="signature">
        <p>À très bientôt, nous l'espérons sincèrement.</p>
        <p>
          <span class="name">L'équipe Amaryllis Locations</span><br />
          Sainte-Luce, Martinique<br />
          WhatsApp · 9h–22h
        </p>
      </div>

    </div>

    <!-- Pied de page -->
    <div class="footer">
      <p>
        Vous recevez cet email car vous avez séjourné dans l'une de nos propriétés.<br />
        <a href="{{unsubscribe}}">Se désabonner</a> · <a href="https://villamaryllis.com/mentions-legales">Mentions légales</a>
      </p>
      <p>© 2026 Amaryllis Locations · Sainte-Luce, Martinique</p>
    </div>

  </div>
</body>
</html>
```

---

## VERSION EN

### Subject lines — A/B/C variants

| Variant | Subject |
|---|---|
| A | {{prenom}}, Martinique is still waiting for you |
| B | Your favourite villa has dates available |
| C | A year on — time to come back to Sainte-Luce? |

### Preheader

> An exclusive offer for our returning guests — 10% off with code RETOUR10, valid until [expiry date].

---

### HTML body — Brevo-ready

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Amaryllis Locations</title>
  <style>
    /* Same CSS as FR version — omitted for brevity. Copy identically. */
    body { margin: 0; padding: 0; background-color: #f5f0e8; font-family: Georgia, 'Times New Roman', serif; }
    .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #1a2744; padding: 32px 40px; text-align: center; }
    .hero { background-color: #1a2744; padding: 0 40px 40px; text-align: center; }
    .hero-eyebrow { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #c4a882; margin: 0 0 16px; }
    .hero-title { font-size: 32px; line-height: 1.25; color: #f5f0e8; margin: 0 0 20px; font-style: italic; }
    .hero-lead { font-size: 16px; line-height: 1.7; color: #c4c8d4; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .body { padding: 48px 40px; }
    .body p { font-size: 16px; line-height: 1.8; color: #2c3e50; margin: 0 0 20px; }
    .body p.salutation { font-size: 18px; font-style: italic; color: #1a2744; }
    .promo-box { background-color: #f5f0e8; border-left: 3px solid #c4a882; padding: 24px 28px; margin: 32px 0; }
    .promo-box p { margin: 0 0 8px; font-size: 15px; color: #2c3e50; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .promo-box p:last-child { margin: 0; }
    .promo-code { font-size: 22px; font-weight: bold; letter-spacing: 3px; color: #1a2744; font-family: 'Helvetica Neue', Arial, sans-serif; }
    .cta-block { text-align: center; margin: 40px 0; }
    .cta-button { display: inline-block; background-color: #c4a882; color: #1a2744; text-decoration: none; padding: 16px 36px; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; }
    .property-note { font-size: 14px; font-style: italic; color: #6b7280; font-family: 'Helvetica Neue', Arial, sans-serif; text-align: center; margin-top: 12px; }
    .divider { border: none; border-top: 1px solid #e8e0d4; margin: 32px 0; }
    .signature { font-size: 15px; line-height: 1.8; color: #2c3e50; }
    .signature .name { font-weight: 600; color: #1a2744; }
    .footer { background-color: #f5f0e8; padding: 28px 40px; }
    .footer p { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #9ca3af; margin: 0 0 6px; text-align: center; line-height: 1.6; }
    .footer a { color: #9ca3af; text-decoration: underline; }
    @media (max-width: 480px) {
      .header, .hero, .body, .footer { padding-left: 24px; padding-right: 24px; }
      .hero-title { font-size: 26px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">

    <!-- Header -->
    <div class="header">
      <span style="font-family:'Helvetica Neue',Arial,sans-serif; font-size:18px; letter-spacing:3px; text-transform:uppercase; color:#f5f0e8; font-weight:300;">AMARYLLIS</span>
    </div>

    <!-- Hero -->
    <div class="hero">
      <p class="hero-eyebrow">Exceptional rentals · Martinique</p>
      <h1 class="hero-title">Martinique hasn't forgotten you.</h1>
      <p class="hero-lead">Neither have we.</p>
    </div>

    <!-- Body -->
    <div class="body">

      <p class="salutation">Dear {{prenom}},</p>

      <!-- Personalised block if {{bien_precedent}} is known — see §Personalisation notes -->
      <!-- VARIANT A : bien_precedent known -->
      <!--
      <p>
        It's been nearly a year since you left {{bien_precedent}}.
        The trade winds are still blowing, the garden is in bloom, and the sunsets
        over Sainte-Luce bay are — trust us — even more beautiful than you remember.
      </p>
      -->

      <!-- VARIANT B : bien_precedent unknown (generic fallback) -->
      <p>
        It's been nearly a year since you left our shores in Martinique.
        The trade winds are still blowing, the garden is in bloom, and the sunsets
        over Sainte-Luce bay are — trust us — even more beautiful than you remember.
      </p>

      <p>
        Your stay on {{date_dernier_sejour}} left us with a wonderful memory.
        We hope it left you with the same — and perhaps the wish to return.
      </p>

      <!-- Return offer -->
      <div class="promo-box">
        <p>For you, an offer reserved for returning guests:</p>
        <p class="promo-code">RETOUR10</p>
        <p>10% off your next direct booking at villamaryllis.com.</p>
        <p>Valid until [expiry date] · Cannot be combined with other offers.</p>
      </div>

      <p>
        All our villas are available for direct booking — no service fee,
        with our team reachable within the hour. Just like your first stay.
      </p>

      <!-- CTA -->
      <div class="cta-block">
        <a href="https://villamaryllis.com?utm_source=brevo&utm_medium=email&utm_campaign=reactivation_12m_en&utm_content=cta_main" class="cta-button">
          See my favourite villas &rarr;
        </a>
        <p class="property-note">villamaryllis.com · Direct booking, no service fee</p>
      </div>

      <hr class="divider" />

      <!-- Signature -->
      <div class="signature">
        <p>We hope to welcome you back very soon.</p>
        <p>
          <span class="name">The Amaryllis Locations team</span><br />
          Sainte-Luce, Martinique<br />
          WhatsApp · 9am–10pm
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div class="footer">
      <p>
        You are receiving this email because you have stayed in one of our properties.<br />
        <a href="{{unsubscribe}}">Unsubscribe</a> · <a href="https://villamaryllis.com/mentions-legales">Legal</a>
      </p>
      <p>© 2026 Amaryllis Locations · Sainte-Luce, Martinique</p>
    </div>

  </div>
</body>
</html>
```

---

## PARAMÈTRES BREVO

### Segment

Créer un segment dynamique dans Brevo avec les conditions suivantes :

```
Contacts où :
  - Tag = "voyageur_direct"
  - ET date_dernier_sejour < [aujourd'hui − 12 mois]
  - ET date_dernier_sejour ≥ [aujourd'hui − 36 mois]   ← exclure les contacts très anciens (données potentiellement obsolètes)
  - ET statut_abonnement = "abonné" (RGPD)
  - ET email_valide = true
```

Champ personnalisé à créer dans Brevo :
- `date_dernier_sejour` (type : date)
- `bien_precedent` (type : texte)
- `prenom` (type : texte) — probablement déjà présent

### Heure d'envoi optimale

| Cible | Jour | Heure |
|---|---|---|
| Segment FR (métropole) | Mardi ou jeudi | 10h00 heure de Paris |
| Segment EN (international) | Mardi | 08h00 UTC |

Éviter : vendredi après-midi, week-end, jours fériés FR.
Le mardi est le jour de taux d'ouverture le plus élevé selon les benchmarks Brevo pour le secteur tourisme/loisirs (source : Brevo Email Benchmarks 2024).

### Fréquence et relance

```
Envoi 1 : J0 — email réactivation complet avec offre RETOUR10
Envoi 2 : J+14 — relance courte si non-ouverture (voir ci-dessous)
             Si ouverture sans clic → pas de relance (contact intéressé mais pas prêt)
             Si ouverture + clic → supprimer de la séquence (contact réengagé, passer en nurturing)
```

Aucun 3e envoi. Deux contacts non répondants = contact froid à laisser tranquille pendant 6 mois minimum.

**Relance J+14 (objet court, ton neutre) :**

- FR : `Une dernière chose, {{prenom}}`  
  Préheader : `Votre code RETOUR10 est encore valable — mais pas indéfiniment.`
- EN : `One last thought, {{prenom}}`  
  Préheader : `Your RETOUR10 code is still active — but not for long.`

Corps : 3 lignes maximum. Rappel de l'offre, CTA identique. Pas de nouveau discours.

### Tags à appliquer dans Brevo

| Tag | Moment d'application |
|---|---|
| `reactivation_envoye` | À l'envoi J0 |
| `reactivation_ouvert` | Si ouverture (tracking Brevo) |
| `reactivation_cliqué` | Si clic sur le CTA |
| `reactivation_converti` | Manuellement ou via webhook Stripe/Beds24 si réservation suivie |
| `reactivation_inactif` | Après J+14 sans réponse — pour exclure des prochaines campagnes pendant 6 mois |

Automatisation Brevo recommandée : créer un scénario d'automatisation sur l'événement "contact entre dans le segment 12 mois" pour déclencher l'envoi sans action manuelle.

---

## NOTES DE PERSONNALISATION

### Logique `{{bien_precedent}}`

Le champ `bien_precedent` contient le nom canonique de la villa (voir `voice.md §12`). Il permet d'adapter le paragraphe d'accroche de façon ciblée.

**Correspondance nom canonique → formule évocatrice :**

| `bien_precedent` | Formule à insérer dans le paragraphe d'accroche |
|---|---|
| `Villa Amaryllis` | *Cela fait bientôt un an que vous avez quitté Villa Amaryllis et sa piscine perchée au-dessus des collines.* |
| `Zandoli` | *Cela fait bientôt un an que vous avez quitté Zandoli et ses nuits bercées par les grenouilles des jardins.* |
| `Villa Iguana` | *Cela fait bientôt un an que vous avez quitté Villa Iguana et la douceur de son espace familial en bord de nature.* |
| `Géko` | *Cela fait bientôt un an que vous avez quitté Géko et sa terrasse suspendue au-dessus de la végétation tropicale.* |
| `Mabouya` | *Cela fait bientôt un an que vous avez quitté Mabouya et sa lumière dorée du matin.* |
| `T2 Schœlcher` | *Cela fait bientôt un an que vous avez quitté votre appartement à Schœlcher, entre mer et ville.* |
| `Aux Portes de Paris` | *Cela fait bientôt un an que vous avez quitté votre appartement aux portes de Paris, avec la Marne pour horizon.* |
| *(vide / inconnu)* | Utiliser le paragraphe générique "nos rivages martiniquais" (voir corps email). |

**Implémentation Brevo :** utiliser les blocs conditionnels Brevo (syntaxe Jinja2 dans les templates drag-and-drop avancés) :

```
{% if contact.bien_precedent == "Villa Amaryllis" %}
  Cela fait bientôt un an que vous avez quitté Villa Amaryllis…
{% elif contact.bien_precedent == "Zandoli" %}
  Cela fait bientôt un an que vous avez quitté Zandoli…
{% else %}
  Cela fait bientôt un an que vous avez quitté nos rivages martiniquais…
{% endif %}
```

**Note sur Nogent :** si `bien_precedent = "Aux Portes de Paris"`, supprimer toute référence à la Martinique dans le héro et ajuster le sous-titre : `Locations d'exception · Île-de-France`. Le corps reste valable tel quel puisqu'il ne mentionne pas Sainte-Luce dans la variante générique.

### Format `{{date_dernier_sejour}}`

Formater en FR : `15 juin 2024` (pas de zéro initial, mois en toutes lettres).
Formater en EN : `15 June 2024`.
Si la date est inconnue, supprimer la phrase entière plutôt que d'afficher une variable vide.

### Source des données

Les champs `bien_precedent` et `date_dernier_sejour` doivent être poussés vers Brevo depuis :
- **Réservations directes Stripe/Beds24** : disponibles nativement (propriété + dates).
- **Réservations Airbnb** : email du voyageur inconnu — ces contacts ne peuvent pas être intégrés à Brevo sans capture post-séjour via le guide bienvenue (`/bienvenue/{token}`).

Action recommandée : à chaque nouvelle réservation directe confirmée via `/api/stripe-webhook`, appeler l'API Brevo pour créer ou mettre à jour le contact avec ces deux champs.
