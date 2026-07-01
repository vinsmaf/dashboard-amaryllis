// src/utils/loyaltyTiers.js
// Programme de fidélité — paliers Bronze/Argent/Or (validé par Vincent 2026-07-01).
// Calcul PUR à partir des champs déjà chargés côté client (même pattern que
// segmentOf() dans CrmTab.jsx) — aucun appel réseau, aucune remise appliquée
// automatiquement : ce module ne fait qu'informer, le barème reste manuel
// (RM advisory, comme crm-lifecycle.js).
//
// Iguana est exclu (bail longue durée Joël Bailleul, pas un client court séjour —
// cf RM-19 / editorial-calendar.js DEFAULT_EXCLUDED_BIENS) : un client dont TOUS
// les séjours connus sont sur Iguana n'a pas de palier.

const IGUANA_ONLY_BIEN = "iguana";

export const TIER_DEFS = [
  {
    id: "or",
    seuil: 3,
    label: "Or",
    emoji: "🥇",
    color: "#f59e0b",
    avantage: "-10% + surclassement gratuit si disponible + accès prioritaire haute saison",
  },
  {
    id: "argent",
    seuil: 2,
    label: "Argent",
    emoji: "🥈",
    color: "#94a3b8",
    avantage: "-5% sur la prochaine résa directe + accès prioritaire haute saison",
  },
  {
    id: "bronze",
    seuil: 1,
    label: "Bronze",
    emoji: "🥉",
    color: "#b45309",
    avantage: "Bienvenue dans le programme — newsletter + offres à venir",
  },
];

/** Parse le champ `biens` de crm_clients (JSON string, array, ou fallback CSV). */
export function parseBiensField(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [String(p)];
  } catch {
    return String(raw).split(/[,;]/).map(s => s.trim()).filter(Boolean);
  }
}

/**
 * Détermine le palier fidélité d'un client. Retourne `null` si aucun palier
 * (0 séjour, ou uniquement des séjours Iguana = bail longue durée).
 * `client` : { nb_sejours, biens } — biens accepte JSON string ou array.
 */
export function computeTier(client) {
  const biens = parseBiensField(client?.biens);
  const isIguanaOnly = biens.length > 0 && biens.every(b => b === IGUANA_ONLY_BIEN);
  if (isIguanaOnly) return null;

  const n = client?.nb_sejours || 0;
  return TIER_DEFS.find(t => n >= t.seuil) || null;
}
