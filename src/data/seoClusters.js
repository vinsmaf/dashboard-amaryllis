// src/data/seoClusters.js
// Source unique de vérité du maillage interne SEO (hub & spoke).
// slug d'une page → son cluster. Sert MaillageCluster + cohérence des liens.
// Nomenclature : "villa" = Amaryllis + Iguana uniquement.

export const HUBS = {
  "sainte-luce":   { slug: "sainte-luce-martinique",  label: "Sainte-Luce, Sud Martinique" },
  "diamant":       { slug: "guide-le-diamant",        label: "Le Diamant & nature" },
  "sejour":        { slug: "guide-hub",               label: "Organiser son séjour" },
  "nogent":        { slug: "guide-nogent-sur-marne",  label: "Nogent-sur-Marne" },
};

export const CLUSTER_GUIDES = {
  "sainte-luce": [
    "plus-belles-plages-sud-martinique",
    "activites-sainte-luce",
    "guide-distilleries-martinique",
    "guide-gastronomie-martinique",
    "meilleure-saison-martinique",
  ],
  "diamant": [
    "guide-plongee-martinique",
    "guide-randonnees-martinique",
    "guide-sainte-anne",
    "guide-arlet",
  ],
  "sejour": [
    "meilleure-saison-martinique",
    "reservation-directe-martinique",
    "guide-trois-ilets",
    "guide-saint-pierre-martinique",
    "guide-francois-martinique",
  ],
  "nogent": [],
};

export const CLUSTER_BIENS = {
  "sainte-luce": ["amaryllis", "zandoli", "geko", "mabouya"],
  "diamant":     ["iguana"],
  "sejour":      ["amaryllis", "zandoli", "geko", "mabouya", "schoelcher", "iguana"],
  "nogent":      ["nogent"],
};

const _guideToCluster = {};
for (const [cluster, slugs] of Object.entries(CLUSTER_GUIDES)) {
  for (const s of slugs) (_guideToCluster[s] ||= cluster);
}
const _bienToCluster = { amaryllis: "sainte-luce", zandoli: "sainte-luce", geko: "sainte-luce", mabouya: "sainte-luce", schoelcher: "sejour", iguana: "diamant", nogent: "nogent" };

export function clusterForGuide(slug) { return _guideToCluster[slug] || "sejour"; }
export function clusterForBien(id)   { return _bienToCluster[id]   || "sejour"; }

export const GUIDE_LABELS = {
  "plus-belles-plages-sud-martinique": "Les plus belles plages du Sud",
  "activites-sainte-luce": "Que faire à Sainte-Luce",
  "guide-distilleries-martinique": "Distilleries & rhum AOC",
  "guide-gastronomie-martinique": "Gastronomie créole",
  "meilleure-saison-martinique": "Quand partir en Martinique",
  "guide-plongee-martinique": "Plongée & snorkeling",
  "guide-randonnees-martinique": "Randonnées du Sud",
  "guide-sainte-anne": "Sainte-Anne & les Salines",
  "guide-arlet": "Anses-d'Arlet",
  "reservation-directe-martinique": "Réserver en direct (sans frais)",
  "guide-trois-ilets": "Les Trois-Îlets",
  "guide-saint-pierre-martinique": "Saint-Pierre & la Pelée",
  "guide-francois-martinique": "Le François & fonds blancs",
};
