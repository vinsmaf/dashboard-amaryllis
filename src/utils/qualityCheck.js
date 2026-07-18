// Contrôle qualité aléatoire — logique pure (testée par qualityCheck.test.js).
//
// Chaque semaine, un bien est tiré au sort pour un spot-check qualité (indépendant du
// check-in/check-out systématique de docs/checklist-etat-des-lieux.md — ici, aucun séjour
// n'est en cours, c'est un contrôle-surprise). Réutilise la table `maintenance` existante
// (category='qualite', déjà dans son enum) plutôt qu'une nouvelle table.

export const CHECKLIST_ITEMS = [
  "Piscine/jacuzzi : eau claire, pH contrôlé",
  "Climatisation : filtre propre, test froid OK",
  "Wifi/TV : connexion testée",
  "Linge/consommables : stock ≥ minimum (3 sets/chambre, produits accueil)",
  "Propreté générale (sol, plans de travail, sanitaires)",
  "Extérieur/jardin entretenu, pas de nuisibles",
  "Détecteur de fumée présent, témoin actif",
  "Photos avant/après à jour dans le dossier bien",
];

export function formatChecklistNotes(items = CHECKLIST_ITEMS) {
  return "Contrôle qualité aléatoire — à vérifier sur place :\n" + items.map((it) => `☐ ${it}`).join("\n");
}

/**
 * Biens éligibles au tirage : bookable uniquement (exclut Iguana, bail long — cf. biens.js),
 * et pas déjà en cours (`a_planifier`/`planifie`) ni contrôlé depuis moins de `cooldownDays`.
 * `recentQualityChecks` : lignes `maintenance` category='qualite' { bien_id, status, created_at (epoch sec) }.
 */
export function eligibleBiensForCheck(biens, recentQualityChecks, { cooldownDays = 21, nowSec } = {}) {
  const now = nowSec ?? Math.floor(Date.now() / 1000);
  const cooldownSec = cooldownDays * 86400;
  const excluded = new Set();
  for (const c of recentQualityChecks || []) {
    if (!c?.bien_id) continue;
    if (c.status === "a_planifier" || c.status === "planifie") { excluded.add(c.bien_id); continue; }
    if (c.status === "fait" && c.created_at != null && now - c.created_at < cooldownSec) excluded.add(c.bien_id);
  }
  return (biens || []).filter((b) => b.bookable && !excluded.has(b.id)).map((b) => b.id);
}

/** Tire un bien au hasard parmi les éligibles (null si aucun). Le hasard est injectable pour les tests. */
export function pickBienForCheck(eligibleIds, rng = Math.random) {
  if (!eligibleIds || eligibleIds.length === 0) return null;
  return eligibleIds[Math.floor(rng() * eligibleIds.length)];
}
