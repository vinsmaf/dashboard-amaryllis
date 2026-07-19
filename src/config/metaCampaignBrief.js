// src/config/metaCampaignBrief.js
// Source unique du brief campagnes Meta Ads — éditer ICI pour changer copy/ciblage/budget.
// Consommé par functions/api/meta-ads-campaign.js (création via Marketing API, toujours
// status=PAUSED — jamais d'activation automatique). Brief original :
// docs/marketing/campagne-meta-ads-2026-06.md.
//
// Mise à jour 2026-07-19 — révisé avec le retour réel accumulé depuis juin (le compte a
// tourné 1-2 semaines seulement avant le hack Meta du 18/06, spend trop faible pour juger
// un intérêt/audience A1 vs A2 au niveau pub ; le signal fiable qu'on a, c'est le funnel
// ON-SITE par bien, mesuré sur tout le trafic — cf. `docs/metrics-review-H1-2026.md` et
// commits ci-dessous) :
// - Amaryllis (A1) : `date_selected → begin_checkout` ne convertissait qu'à 10,5% (vs 83%
//   sur Géko) — cause identifiée : bouton "Devis PDF" en concurrence visuelle directe avec
//   le CTA réserver, corrigé commit `096ae94` (2026-07-18). Gardé en A1 (visuel le plus
//   spectaculaire du portefeuille, ADR premium) mais le signal négatif est PRÉ-fix — à
//   confirmer sur les prochaines semaines, pas encore de données post-fix.
// - Mabouya (A2) : n'a vendu AUCUNE nuit sur 3 mois (mai-juillet) malgré du trafic réel —
//   cause : badge de disponibilité incohérent avec le calendrier (cherchait 7 nuits
//   consécutives sans lien avec le vrai séjour minimum), corrigé `5853ce4`
//   (ADR-BADGE-MINSTAY-001, 2026-07-18). Le pari initial du brief de juin ("meilleur ROAS
//   attendu") est donc plus crédible qu'avant le fix, pas moins — gardé en A2 sans
//   changement de ciblage/copy.
// - Géko : PAS dans le plan initial (A1/A2 seuls au lancement), mais son funnel on-site est
//   le meilleur des 4 biens testables (83% `date_selected → begin_checkout`, aucun bug
//   trouvé contrairement à Amaryllis/Mabouya). Promu en A3 (actif dès le lancement) — angle
//   copy/ciblage entièrement nouveau, pas encore validé par un vrai clic Meta, à traiter
//   comme un test au même titre que les 2 autres.
// - Offre Groupe : repoussée en A4 (enabled:false) — aucune donnée réelle derrière cet angle
//   (jamais lancé), alors que Géko a un vrai signal positif. Priorité au signal connu avant
//   d'ouvrir un 4e front non testé.
// - Budget relevé le 2026-07-19 (demande explicite Vincent) : 10€/j par ad set actif (haut de
//   la fourchette "5-10€/j minimum viable" du brief de juin) — 30€/j total sur A1+A2+A3
//   (~900€/mois), contre 9€/j initialement. Cohérent avec l'activation d'Advantage Audience
//   (cf. buildTargeting) : plus de budget = plus de marge pour que l'algo sorte de
//   l'apprentissage limité.

export const AD_ACCOUNT_ID = "act_853205825762332";

// Résidents des DOM = pas des touristes, exclus des audiences froides "rêve Martinique".
// Noms EXACTS vérifiés via ?debug=search&type=adgeolocation (2026-07-19) — chaque DOM est
// typé "country" côté Meta, pas "region" (d'où le 1er essai qui excluait par erreur "Petite
// Martinique", une île de Grenade sans rapport). "French Guiana" et "Réunion" (pas "La
// Réunion") sont les libellés réels Meta, pas une traduction littérale du français.
const DOM_EXCLUSIONS = ["Martinique", "Guadeloupe", "French Guiana", "Réunion", "Mayotte"];

export const CAMPAIGNS = {
  c1_tofu: {
    name: "C1 — TOFU Découverte",
    objective: "OUTCOME_TRAFFIC",
    adsets: [
      {
        key: "a1_amaryllis",
        name: "A1 — Villa Amaryllis, le rêve premium",
        enabled: true,
        dailyBudgetCents: 1000, // 10€/j (relevé 2026-07-19, était 3€/j)
        targeting: {
          countries: ["FR"],
          excludedRegions: DOM_EXCLUSIONS,
          ageMin: 30,
          ageMax: 60,
          // Vérifiés un par un via ?debug=search (2026-07-19) — "Antilles françaises",
          // "Voyage de luxe" et "Villa (hébergement)" ne matchent AUCUN intérêt Meta (recherche
          // vide) ; "Caraïbes" matchait à tort "Airline" (Meta n'indexe pas bien le français ici,
          // "Caribbean" fonctionne) ; "Plongée avec tuba" ne matche rien mais "Snorkeling" oui.
          interests: [
            "Martinique", "Caribbean", "Vacances", "Location de vacances",
            "Tourisme", "Plage", "Snorkeling",
          ],
        },
        creative: {
          landingUrl: "https://villamaryllis.com/amaryllis",
          imageUrl: "https://villamaryllis.com/photos/amaryllis/01.webp",
          primaryText: "Une villa privée, une piscine, et la Martinique pour horizon. À vous seuls, jusqu'à 8. Réservez en direct — sans frais Airbnb. ☀️",
          title: "Votre villa privée en Martinique",
          description: "4,79★ · 97 avis vérifiés",
          cta: "LEARN_MORE",
        },
      },
      {
        key: "a2_mabouya",
        name: "A2 — Studio Mabouya, parenthèse à deux",
        enabled: true,
        dailyBudgetCents: 1000, // 10€/j (relevé 2026-07-19, était 3€/j)
        targeting: {
          countries: ["FR"],
          excludedRegions: DOM_EXCLUSIONS,
          ageMin: 28,
          ageMax: 55,
          // "Lune de miel", "Voyage de noces", "Week-end en amoureux" : aucun match Meta
          // (même en anglais "Honeymoon" — résultats hors-sujet). L'angle romantique reste
          // bien couvert par Romantisme/Couples/Jacuzzi, vérifiés.
          interests: [
            "Romantisme", "Couples", "Jacuzzi", "Martinique", "Caribbean",
          ],
        },
        creative: {
          landingUrl: "https://villamaryllis.com/mabouya",
          imageUrl: "https://villamaryllis.com/photos/mabouya/13.webp",
          primaryText: "Un jacuzzi privatif, un jardin, et juste vous deux. La parenthèse romantique se vit en Martinique. Dès 82 €/nuit, en direct. 💛",
          title: "Parenthèse à deux en Martinique",
          description: "Jardin & jacuzzi privatif",
          cta: "LEARN_MORE",
        },
      },
      {
        key: "a3_geko",
        name: "A3 — Géko, évasion express Sud Martinique",
        enabled: true, // promu — meilleur funnel on-site des biens testables (83%, cf. note en tête de fichier)
        dailyBudgetCents: 1000, // 10€/j (relevé 2026-07-19, était 3€/j)
        targeting: {
          countries: ["FR"],
          excludedRegions: DOM_EXCLUSIONS,
          ageMin: 25,
          ageMax: 60,
          interests: [
            "Martinique", "Caribbean", "Vacances", "Location de vacances", "Tourisme", "Plage",
          ],
        },
        creative: {
          landingUrl: "https://villamaryllis.com/geko",
          imageUrl: "https://villamaryllis.com/photos/geko/01.webp",
          primaryText: "Un cocon avec piscine à cascade, sur les hauteurs de Sainte-Luce. L'évasion express en Martinique. Dès 110 €/nuit, en direct.",
          title: "Évasion express en Martinique",
          description: "Piscine à cascade · dès 110 €/nuit",
          cta: "LEARN_MORE",
        },
      },
      {
        key: "a4_groupe",
        name: "A4 — Offre Groupe, toute la tribu",
        enabled: false, // aucune donnée réelle derrière cet angle (jamais lancé) — après A1/A2/A3, pas avant
        dailyBudgetCents: 1000, // 10€/j (relevé 2026-07-19, était 3€/j)
        targeting: {
          countries: ["FR"],
          excludedRegions: DOM_EXCLUSIONS,
          ageMin: 30,
          ageMax: 55,
          // Désactivée (enabled:false) mais vérifiée quand même pour qu'elle soit prête si
          // activée plus tard. "Vacances en famille"/"Voyage en groupe"/"Grande famille" ne
          // matchent rien (même en anglais direct) ; "Réunion de famille"→"Family reunion" OK.
          interests: [
            "Martinique", "Family reunion", "Family", "Vacances",
          ],
        },
        creative: {
          landingUrl: "https://villamaryllis.com/location-groupe-sainte-luce",
          imageUrl: "https://villamaryllis.com/photos/amaryllis/02.webp",
          primaryText: "Toute la tribu, une seule adresse. Réunissez jusqu'à 11 proches dans une résidence privée à Sainte-Luce. Un seul paiement. ☀️",
          title: "Toute la tribu en Martinique",
          description: "Piscines & jacuzzi privés",
          cta: "LEARN_MORE",
        },
      },
    ],
  },
  // Bloquée tant que le tracking Purchase+value n'est pas reconfirmé après la coupure du
  // compte — cf. .memory/BLOCKERS.md. Aucun adset défini pour l'instant : à cadrer une fois
  // le check fait, pas avant (une audience de retargeting sur un signal cassé cible dans le vide).
  c2_retargeting: {
    name: "C2 — Retargeting",
    objective: "OUTCOME_SALES",
    adsets: [],
  },
};

export function getCampaign(key) {
  return CAMPAIGNS[key] || null;
}
