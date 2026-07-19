// src/utils/metaCampaignBuilder.js
// Logique pure : construit les payloads Marketing API depuis le brief
// (src/config/metaCampaignBrief.js) + les intérêts/régions déjà résolus en IDs Meta.
// Aucun appel réseau ici — testable sans mock HTTP. Tout objet reste status="PAUSED" :
// l'activation (dépense réelle) est un geste séparé, jamais construit par ce module.

export function buildCampaignPayload(campaign) {
  return {
    name: campaign.name,
    objective: campaign.objective,
    status: "PAUSED",
    special_ad_categories: [],
    // false = ABO stricte : chaque ad set garde son propre budget fixe, Meta ne redistribue
    // RIEN entre eux — nécessaire pour comparer les angles A1/A2/A3 à budget égal avant de
    // passer en CBO une fois un gagnant identifié (cf. logique déjà actée dans le brief).
    // Erreur réelle rencontrée en prod sans ce champ : "Invalid parameter" (code 100,
    // subcode 4834011) — Meta l'exige explicitement dès qu'on n'utilise pas de budget au
    // niveau de la campagne.
    is_adset_budget_sharing_enabled: false,
  };
}

// Meta type ses entités géo différemment selon l'endroit (un DOM peut remonter comme
// "region" ou comme "country" selon l'API) — on range chaque exclusion résolue dans le
// bon seau plutôt que de supposer "regions" partout (supposition fausse une fois : la
// vraie Martinique remontait ailleurs, seule "Petite Martinique", île de Grenade sans
// rapport, matchait le seau "region").
const GEO_TYPE_TO_BUCKET = { region: "regions", country: "countries", city: "cities", zip: "zips" };

export function buildTargeting(adset, resolvedInterests, resolvedRegions) {
  const targeting = {
    geo_locations: { countries: adset.targeting.countries },
    age_min: adset.targeting.ageMin,
    age_max: adset.targeting.ageMax,
    // Meta exige ce champ explicitement (erreur réelle en prod sans lui : code 100,
    // subcode 1870227, "Advantage Audience Flag Required"). 0 = ciblage strict — testé à 1
    // (extension auto) d'abord, mais Meta impose alors un âge quasi-ouvert (min ≤25 ET
    // max ≥65, subcodes 1870188/1870189) qui aurait écrasé les tranches d'âge volontaires
    // par bien (30-60 Amaryllis, 28-55 Mabouya pour cibler les couples). Le budget ayant
    // été relevé à 10€/j/ad set entre-temps (haut de la fourchette viable), l'intérêt de
    // l'extension pesait moins que celui de garder ce ciblage démographique délibéré.
    targeting_automation: { advantage_audience: 0 },
  };
  if (resolvedRegions?.length) {
    const excluded = {};
    for (const r of resolvedRegions) {
      const bucket = GEO_TYPE_TO_BUCKET[r.type] || "regions";
      // "countries" veut une liste de codes ISO en TEXTE SIMPLE ("MQ"), pas des objets
      // {key,name} — contrairement à regions/cities. Erreur réelle rencontrée en prod
      // sans cette distinction : "(#100) Country Code must be a string".
      const entry = bucket === "countries" ? r.key : { key: r.key, name: r.name };
      (excluded[bucket] ||= []).push(entry);
    }
    targeting.excluded_geo_locations = excluded;
  }
  if (resolvedInterests?.length) {
    targeting.interests = resolvedInterests.map((i) => ({ id: i.id, name: i.name }));
  }
  return targeting;
}

// Normalise pour comparaison floue : minuscules + accents retirés.
export function normalizeName(s) {
  const NFD_COMBINING_MIN = 0x0300;
  const NFD_COMBINING_MAX = 0x036f;
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .split("")
    .filter((ch) => {
      const code = ch.codePointAt(0);
      return !(code >= NFD_COMBINING_MIN && code <= NFD_COMBINING_MAX);
    })
    .join("");
}

// Un résultat de recherche floue Meta peut renvoyer un match plausible mais faux
// (ex. "Caraïbes" → "Airline", "Martinique" → "Petite Martinique" — île de Grenade).
// Deux modes : "exact" (comparaison stricte, pour les lieux — la précision géo compte)
// et "loose" (chevauchement de mots ≥4 lettres, pour les intérêts — assez strict pour
// rejeter "Caraïbes"/"Airline" qui ne partagent aucun mot, assez souple pour accepter
// des libellés reformulés par Meta).
export function isPlausibleMatch(query, candidateName, mode = "loose") {
  const q = normalizeName(query);
  const c = normalizeName(candidateName);
  if (!q || !c) return false;
  if (mode === "exact") {
    return q.replace(/[^a-z0-9]/g, "") === c.replace(/[^a-z0-9]/g, "");
  }
  const words = (s) => new Set(s.split(/[^a-z0-9]+/).filter((w) => w.length >= 4));
  const wq = words(q);
  const wc = words(c);
  for (const w of wq) if (wc.has(w)) return true;
  return false;
}

// Choisit le meilleur candidat parmi une liste de résultats de recherche Meta — le
// premier dont le nom passe le test de plausibilité, jamais juste le premier résultat
// brut (ce qui a produit les faux positifs ci-dessus).
export function pickBestMatch(query, candidates, mode = "loose") {
  return (candidates || []).find((c) => isPlausibleMatch(query, c.name, mode)) || null;
}

export function buildAdSetPayload(adset, campaignId, targeting) {
  return {
    name: adset.name,
    campaign_id: campaignId,
    daily_budget: adset.dailyBudgetCents,
    billing_event: "IMPRESSIONS",
    optimization_goal: "LANDING_PAGE_VIEWS",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    status: "PAUSED",
    targeting,
  };
}

export function buildCreativePayload(adset, pageId) {
  const cr = adset.creative;
  // Plusieurs images → carrousel Meta (child_attachments) ; une seule → image simple.
  // Chaque photo est déjà publique sur villamaryllis.com, donc `picture` (URL) suffit —
  // pas besoin d'uploader un image_hash. L'ordre du tableau est l'ordre des cartes :
  // `multi_share_optimized:false` empêche Meta de le réordonner (on garde le fil narratif
  // accroche → variété choisi à la main).
  const images = Array.isArray(cr.images) && cr.images.length ? cr.images : [cr.imageUrl];
  const link_data = {
    message: cr.primaryText,
    link: cr.landingUrl,
    call_to_action: { type: cr.cta, value: { link: cr.landingUrl } },
  };
  if (images.length > 1) {
    link_data.child_attachments = images.map((picture) => ({
      link: cr.landingUrl,
      picture,
      name: cr.title,
      description: cr.description,
    }));
    link_data.multi_share_optimized = false;
    link_data.multi_share_end_card = false;
  } else {
    link_data.name = cr.title;
    link_data.description = cr.description;
    link_data.picture = images[0];
  }
  return {
    name: `${adset.name} — créa`,
    object_story_spec: { page_id: pageId, link_data },
  };
}

export function buildAdPayload(adset, adsetId, creativeId) {
  return {
    name: `${adset.name} — annonce`,
    adset_id: adsetId,
    creative: { creative_id: creativeId },
    status: "PAUSED",
  };
}

// Un intérêt/une région demandé dans le brief mais jamais résolu par Meta (nom introuvable,
// renommé, faute de frappe) doit BLOQUER la création plutôt que produire un ciblage tronqué
// sans que personne ne s'en aperçoive.
export function checkResolution(requestedNames, resolvedList) {
  const resolvedNames = new Set((resolvedList || []).map((r) => r.matchedName));
  const missing = (requestedNames || []).filter((n) => !resolvedNames.has(n));
  return { complete: missing.length === 0, missing };
}
