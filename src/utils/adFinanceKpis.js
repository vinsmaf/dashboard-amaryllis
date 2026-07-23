// src/utils/adFinanceKpis.js — Les 3 NIVEAUX DE MESURE d'une campagne (doctrine Vincent, 2026-07-23).
//
//   NIVEAU 1 · PLATEFORME (ROAS, CPA, CTR, lus dans Meta/Google)
//     → rapide, peu précis. Sert au pilotage quotidien : « la campagne A bat-elle la campagne B ? ».
//     → NE JAMAIS en tirer une décision business : la plateforme s'auto-attribue ses résultats.
//
//   NIVEAU 2 · FINANCE (MER d'acquisition, CAC blended, coût par nouveau client, LTV/CAC)
//     → plus lent, mais c'est la réalité COMPTABLE : est-ce que l'investissement est rentable ?
//     → c'est ICI que se prennent les arbitrages business (ça touche au P&L).
//
//   NIVEAU 3 · DÉCLARATIF (questionnaire post-achat « comment nous avez-vous connu ? »)
//     → dit quel levier génère RÉELLEMENT les nouveaux clients, indépendamment des plateformes.
//     → c'est ce qui permet d'arbitrer l'allocation entre Google / Meta / TikTok / bouche-à-oreille.
//
// Le niveau 2 se calcule depuis NOTRE base (D1), jamais depuis une plateforme.

export const MEASUREMENT_TIERS = {
  plateforme: {
    rang: 1,
    metriques: ["roas", "cpa", "ctr", "cpm"],
    usage: "Pilotage quotidien des campagnes (A vs B). Rapide.",
    fiabilite: "faible — auto-attribué par la plateforme",
    decision_business: false,
  },
  finance: {
    rang: 2,
    metriques: ["acquisitionMer", "blendedCac", "coutParNouveauClient", "ltv", "ltvSurCac"],
    usage: "Arbitrage business : l'investissement pub est-il rentable ? Touche au P&L.",
    fiabilite: "élevée — issu de nos propres encaissements",
    decision_business: true,
  },
  declaratif: {
    rang: 3,
    metriques: ["partDeclareeParCanal"],
    usage: "Allocation du budget entre canaux : d'où viennent VRAIMENT les nouveaux clients.",
    fiabilite: "moyenne — déclaratif, mais non biaisé par les plateformes",
    decision_business: true,
  },
};

function round(n, d = 2) {
  if (!Number.isFinite(n)) return null;
  return Number(n.toFixed(d));
}

function ratio(num, den, d = 2) {
  if (!den || den <= 0) return null;
  return round(num / den, d);
}

// NIVEAU 2 — KPIs financiers. Tout vient de nos encaissements, aucune attribution plateforme.
//   adSpend            : dépense pub totale (Meta + Google) sur la fenêtre
//   newCustomers       : nombre de clients dont c'est la 1re résa sur la fenêtre (TOUS canaux)
//   newCustomerRevenue : revenu de ces résas
//   lifetimeRevenue    : revenu total historique des clients directs
//   lifetimeCustomers  : nombre de clients directs uniques (historique)
export function financeKpis({ adSpend = 0, newCustomers = 0, newCustomerRevenue = 0, lifetimeRevenue = 0, lifetimeCustomers = 0 } = {}) {
  const spend = Number(adSpend) || 0;

  // CAC BLENDED : dépense pub / TOUS les nouveaux clients (y compris organiques). Volontairement
  // « blended » : un CAC par canal supposerait une attribution fiable — c'est précisément ce qu'on
  // ne veut pas croire. Pour ventiler par canal, il faut le niveau 3 (déclaratif).
  // Sans dépense pub, il n'existe pas de « coût d'acquisition par la pub » : null, pas 0 —
  // un 0 ferait ressortir un canal inactif comme le plus performant à tout tri croissant.
  const blendedCac = spend > 0 ? ratio(spend, newCustomers) : null;
  const mer = ratio(newCustomerRevenue, spend);
  const ltv = ratio(lifetimeRevenue, lifetimeCustomers);
  const ltvSurCac = ltv != null && blendedCac ? round(ltv / blendedCac) : null;

  // ⚠️ L'ordre compte : un LTV/CAC flatteur ne doit JAMAIS masquer un MER sous 1. Le MER dit
  // que la trésorerie sort plus vite qu'elle ne rentre ; la LTV n'est qu'une moyenne historique,
  // donc une promesse. On tranche d'abord sur l'encaissé, la LTV ne fait que nuancer.
  const cashNegatif = mer != null && mer < 1;
  const ltvSolide = ltvSurCac != null && ltvSurCac >= 3;

  let verdict, note;
  if (spend <= 0) {
    verdict = "no_spend";
    note = "Aucune dépense pub sur la fenêtre — rien à rentabiliser.";
  } else if (!newCustomers) {
    verdict = "aucun_nouveau_client";
    note = `${round(spend)} € dépensés, 0 nouveau client sur la fenêtre. La pub ne produit pas d'acquisition mesurable.`;
  } else if (cashNegatif && ltvSolide) {
    verdict = "payback_differe";
    note = `Trésorerie négative à l'acquisition (MER ${mer}) mais LTV/CAC ${ltvSurCac} : rentable seulement si les clients reviennent comme par le passé. Tenable uniquement avec de la trésorerie d'avance.`;
  } else if (cashNegatif) {
    verdict = "non_rentable";
    note = `Un nouveau client coûte ${blendedCac} € pour un MER de ${mer} — la pub détruit de la valeur sur cette fenêtre.`;
  } else if (ltvSolide) {
    verdict = "rentable";
    note = `Un nouveau client coûte ${blendedCac} € et vaut ${ltv} € sur sa durée de vie (LTV/CAC ${ltvSurCac}). Marge pour investir davantage.`;
  } else {
    verdict = "viable";
    note = `Le revenu des nouveaux clients couvre la dépense (MER ${mer ?? "?"}), mais LTV/CAC ${ltvSurCac ?? "?"} reste sous 3 — pas de marge pour scaler agressivement.`;
  }

  return {
    adSpend: round(spend),
    newCustomers,
    newCustomerRevenue: round(newCustomerRevenue),
    blendedCac,
    acquisitionMer: mer,
    ltv,
    ltvSurCac,
    verdict,
    note,
  };
}

// NIVEAU 3 — agrège les réponses « comment nous avez-vous connu ? ».
// `rows` : [{ source: "google"|"instagram"|..., count }] ou [{ source }] bruts.
export function declaredAttribution(rows = []) {
  const counts = new Map();
  let total = 0;
  for (const r of rows) {
    const src = String(r?.source || "").trim().toLowerCase();
    if (!src) continue;
    const n = Number(r.count ?? 1) || 0;
    if (n <= 0) continue;
    counts.set(src, (counts.get(src) || 0) + n);
    total += n;
  }
  const canaux = [...counts.entries()]
    .map(([source, count]) => ({ source, count, part: ratio(count * 100, total, 1) }))
    .sort((a, b) => b.count - a.count);

  // En dessous de ce nombre de réponses, la ventilation n'est pas un signal — le dire plutôt
  // que de laisser lire des pourcentages sur 3 réponses comme s'ils étaient significatifs.
  const MIN_REPONSES = 20;
  return {
    total,
    canaux,
    exploitable: total >= MIN_REPONSES,
    note: total >= MIN_REPONSES
      ? `${total} réponses — ventilation exploitable pour arbitrer le budget entre canaux.`
      : `${total} réponse(s) seulement (seuil ${MIN_REPONSES}) — trop peu pour arbitrer, continuer à collecter.`,
  };
}

// Confronte ce que la plateforme s'attribue à ce que les clients déclarent. Un écart fort
// signale que le budget est alloué sur une fiction — c'est tout l'intérêt du niveau 3.
export function compareAttributions(declared, platformShareByChannel = {}) {
  if (!declared?.exploitable) {
    return { comparable: false, note: "Pas assez de réponses déclaratives pour confronter les plateformes." };
  }
  const ecarts = declared.canaux.map((c) => {
    const platform = platformShareByChannel[c.source];
    return {
      source: c.source,
      partDeclaree: c.part,
      partPlateforme: typeof platform === "number" ? round(platform, 1) : null,
      ecart: typeof platform === "number" ? round(c.part - platform, 1) : null,
    };
  });
  const surestime = ecarts.filter((e) => e.ecart != null && e.ecart <= -15).map((e) => e.source);
  const sousestime = ecarts.filter((e) => e.ecart != null && e.ecart >= 15).map((e) => e.source);
  return {
    comparable: true,
    ecarts,
    surestimes_par_les_plateformes: surestime,
    sousestimes_par_les_plateformes: sousestime,
  };
}
