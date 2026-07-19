// src/utils/adBudgetAgent.js
// Logique pure de l'agent budget pub (brique 2, ADVISORY). Aucun appel réseau, aucune
// exécution : ce module CALCULE et RECOMMANDE, il n'engage jamais une dépense (règle absolue).
//
// Modèle (playbook RM-08 + atelier acquisition, retrouvé 2026-07-19) :
//   CAC plafond par bien = 50% de la commission Booking NETTE évitée par réservation.
// C'est le maximum que Google/Meta peut dépenser pour gagner une résa directe sans payer
// plus cher que la commission qu'on évite. Deux modes :
//   - PLANIFICATION (sans perfs) : combien on PEUT dépenser par bien → "vision budget".
//   - ARBITRAGE (avec perfs) : CAC réel (spend÷résas) vs plafond → scaler/tenir/couper.

import { ALL_BIENS } from "../data/biens.js";

// Hypothèses par défaut, toutes surchargeable via opts (documentées, pas magiques) :
export const DEFAULTS = {
  avgNights: 4, // panier moyen ≈ prix/nuit × nuits ; grossier mais suffisant pour un plafond
  bookingRate: 0.16, // commission Booking ~15-18% (référence haute vs Airbnb host-fee ~3%)
  stripeRate: 0.015, // frais Stripe payés sur le direct (à retrancher de l'économie)
  safety: 0.5, // RM-08 : ne dépenser que 50% de la commission évitée (marge de sécurité)
  // €, sous ce seuil un canal payant ne peut pas acquérir une RÉSA (pas un clic) de façon
  // rentable — le coût réel d'acquisition d'une réservation en Google/Meta est structurellement
  // ≥30€. Aligne le verdict sur RM-08 (paid seulement sur les gros tickets Amaryllis/Zandoli/
  // Géko ; zéro sur Mabouya/Bellevue/Nogent, dont la commission évitée est trop mince).
  minViableCac: 30,
};

// CAC plafond (€ arrondi) pour un bien : 50% de la commission Booking nette évitée par résa.
export function cacCeiling(bien, opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  const basket = (bien.prix || 0) * o.avgNights;
  const netAvoided = basket * (o.bookingRate - o.stripeRate); // commission Booking évitée − Stripe payé sur le direct
  return Math.round(netAvoided * o.safety);
}

// Plan par bien : CAC plafond + si le bien vaut de la pub payante (plafond ≥ seuil viable).
// RM-08 : Mabouya/Bellevue/Nogent trop mince → zéro paid dédié.
export function planByBien(opts = {}) {
  const o = { ...DEFAULTS, ...opts };
  return ALL_BIENS
    .filter((b) => b.bookable !== false) // Iguana (bail long) exclue
    .map((b) => {
      const ceiling = cacCeiling(b, o);
      return {
        id: b.id,
        nom: b.nom,
        prix: b.prix,
        cacCeiling: ceiling,
        worthPaid: ceiling >= o.minViableCac,
        reason: ceiling >= o.minViableCac
          ? `Panier ~${Math.round((b.prix || 0) * o.avgNights)}€ → ${ceiling}€ de CAC absorbable`
          : `Commission évitée trop mince (~${ceiling}€) → pas de pub payante dédiée`,
      };
    })
    .sort((a, b) => b.cacCeiling - a.cacCeiling);
}

// Répartit un budget mensuel entre les seuls biens "worthPaid", pondéré par leur CAC plafond
// (plafond élevé = absorbe plus de dépense rentablement). Les biens non-worthPaid reçoivent 0.
export function allocateBudget(monthlyMax, opts = {}) {
  const all = planByBien(opts);
  const eligible = all.filter((p) => p.worthPaid);
  const totalWeight = eligible.reduce((s, p) => s + p.cacCeiling, 0);
  const allocation = all.map((p) => ({
    ...p,
    monthlyBudget: p.worthPaid && totalWeight ? Math.round((p.cacCeiling / totalWeight) * monthlyMax) : 0,
  }));
  return {
    monthlyMax,
    allocation,
    eligibleBiens: eligible.map((p) => p.id),
    skippedBiens: all.filter((p) => !p.worthPaid).map((p) => p.id),
  };
}

// ARBITRAGE : verdict d'une campagne/ad set face au CAC plafond de son bien.
// canComputeRoas vient du bloc `health` de meta-ads-insights : si le tracking conversion ne
// remonte pas, on NE JUGE PAS la rentabilité (on laisse collecter), on ne coupe pas à l'aveugle.
export function evaluateAdset(perf, ceiling, canComputeRoas) {
  const spend = perf.spend || 0;
  const purchases = perf.purchases || 0;
  if (!canComputeRoas || purchases === 0) {
    return {
      verdict: spend > 0 ? "collecting" : "idle",
      realCac: null,
      ceiling,
      note: spend > 0
        ? "Dépense en cours mais 0 conversion trackée — laisser collecter, ne pas juger la rentabilité."
        : "Pas de dépense sur la fenêtre.",
    };
  }
  const realCac = Math.round(spend / purchases);
  let verdict, note;
  if (realCac <= ceiling * 0.7) { verdict = "scale"; note = `CAC réel ${realCac}€ largement sous le plafond ${ceiling}€ → augmenter le budget.`; }
  else if (realCac <= ceiling) { verdict = "hold"; note = `CAC réel ${realCac}€ sous le plafond ${ceiling}€ → rentable, maintenir.`; }
  else { verdict = "cut"; note = `CAC réel ${realCac}€ AU-DESSUS du plafond ${ceiling}€ → réduire ou couper (on paie plus cher que la commission évitée).`; }
  return { verdict, realCac, ceiling, margin: ceiling - realCac, note };
}

// EXÉCUTION (brique 3) : traduit un verdict + l'état live d'un ad set en action concrète.
// Pure, testable, aucun appel réseau. Garde-fou dur encodé ICI (pas seulement en doc) :
//   - "cut" sur un ad set ACTIF → pause (jamais de suppression, toujours réversible).
//   - "scale" sur un ad set ACTIF → +20% de budget, plafonné au budget mensuel/30 du bien.
//   - Tout le reste (hold/idle/collecting/unmapped, ou ad set non-ACTIF) → aucune action.
// Il n'existe VOLONTAIREMENT aucune branche qui retourne "resume"/"activate" : activer un ad
// set en pause déclenche une dépense NOUVELLE (règle absolue jamais contournable) — cette
// fonction ne peut structurellement pas le faire, quel que soit le verdict en entrée.
export function planExecutionAction({ verdict, isActive, currentBudgetCents, perBienDailyCeilingCents }) {
  if (!isActive) {
    return { action: "none", note: "Ad set non actif — rien à ajuster (l'activation reste un geste manuel)." };
  }
  if (verdict === "cut") {
    return { action: "pause", note: "CAC au-dessus du plafond → mise en pause défensive." };
  }
  if (verdict === "scale" && currentBudgetCents != null && perBienDailyCeilingCents != null) {
    const proposed = Math.round(currentBudgetCents * 1.2);
    const capped = Math.min(proposed, perBienDailyCeilingCents);
    if (capped <= currentBudgetCents) {
      return { action: "none", note: "Déjà au plafond du bien — pas d'augmentation possible." };
    }
    return {
      action: "increase_budget",
      newBudgetCents: capped,
      note: `Budget augmenté de ${currentBudgetCents}c à ${capped}c (plafond bien ${perBienDailyCeilingCents}c).`,
    };
  }
  return { action: "none", note: "Verdict ne déclenche aucune action (hold/idle/collecting/unmapped)." };
}
