// Source unique des partenaires affiliés.
// ⚠️ Mettre à jour les URL une fois les comptes affiliés créés :
//   DiscoverCars : discovercars.com/affiliates → remplacer l'URL par la version avec a_aid=<ID>
//   GetYourGuide : partners.getyourguide.com  → même chose avec partner_id=<ID>
// Tout lien affilié doit porter rel="sponsored" (obligation Google).

export const PARTENAIRES = {
  discoverCars: {
    nom: "DiscoverCars",
    url: "https://www.discovercars.com/fr/martinique?a_aid=vinsmaf",
    label: "Comparer et réserver →",
    description: "Comparez tous les loueurs, meilleurs prix garantis",
    actif: true,
  },
  getYourGuide: {
    nom: "GetYourGuide",
    url: "https://www.getyourguide.com/martinique-l169136/?partner_id=DNI7ML3",
    label: "Voir les excursions →",
    description: "Excursions, plongée, catamarans en Martinique",
    actif: true,
  },
  viator: {
    nom: "Viator",
    url: "https://www.viator.com/Martinique/d4316-ttd?pid=P00306913&mcid=42383&medium=link",
    label: "Voir sur Viator →",
    description: "24 excursions Martinique — catamarans, randonnées, rhum, dauphins",
    actif: true,
  },
};
