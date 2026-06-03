// src/data/biens.js
// SOURCE DE VÉRITÉ des faits cœur des 7 biens (phase 1 — chantier source unique).
// Pur (aucune dépendance React/JSX/DOM/import.meta) → importable par React, par les
// Cloudflare Pages Functions et par le script prerender (Node).
// Nomenclature : "villa" = Amaryllis + Iguana UNIQUEMENT. Iguana = bookable:false (longue durée).
// rating/reviews : valeurs alignées sur ce que le site public montre déjà (src/PublicSite.jsx),
// la source vue par les clients (pure unification, zéro changement visible). Les anciennes valeurs
// divergentes de functions/[slug].js (iguana 4.92/25) et prerender (iguana 42 avis) étaient
// minoritaires/incohérentes. ⚠️ Les vrais chiffres d'avis restent à confirmer par Vincent.

export const BIENS = {
  amaryllis: {
    id: "amaryllis", nom: "Villa Amaryllis", type: "villa",
    prix: 280, capacite: 8, chambres: 3, lieu: "Sainte-Luce", postal: "97228",
    coords: { lat: 14.4732, lng: -60.9196 }, rating: 4.94, reviews: 33, bookable: true,
    photos: ["/photos/amaryllis/01.webp","/photos/amaryllis/02.webp","/photos/amaryllis/03.webp","/photos/amaryllis/04.webp","/photos/amaryllis/05.webp","/photos/amaryllis/06.webp","/photos/amaryllis/07.webp","/photos/amaryllis/08.webp"],
    seoTitle: "Villa Amaryllis Sainte-Luce — piscine vue mer Martinique",
    seoDesc: "Villa Amaryllis à Sainte-Luce : piscine à débordement, vue Caraïbes 180°, 3 chambres, 8 personnes. Dès 280€/nuit en direct, sans frais Airbnb.",
  },
  zandoli: {
    id: "zandoli", nom: "Zandoli", type: "logement",
    prix: 220, capacite: 5, chambres: 2, lieu: "Sainte-Luce", postal: "97228",
    coords: { lat: 14.4725, lng: -60.9201 }, rating: 4.5, reviews: 16, bookable: true,
    photos: ["/photos/zandoli/01.webp","/photos/zandoli/02.webp","/photos/zandoli/03.webp","/photos/zandoli/04.webp"],
    seoTitle: "Zandoli Sainte-Luce — logement piscine cascade Martinique",
    seoDesc: "Zandoli à Sainte-Luce : piscine privative à cascade, mezzanine, jardin tropical. 5 personnes. Dès 220€/nuit en réservation directe.",
  },
  iguana: {
    id: "iguana", nom: "Villa Iguana", type: "villa",
    prix: 180, capacite: 6, chambres: 2, lieu: "Sainte-Luce", postal: "97228",
    coords: { lat: 14.4718, lng: -60.9188 }, rating: 4.75, reviews: 4, bookable: false,
    photos: ["/photos/iguana/01.webp","/photos/iguana/02.webp","/photos/iguana/03.webp","/photos/iguana/04.webp"],
    seoTitle: "Villa Iguana Martinique — vue Rocher du Diamant",
    seoDesc: "Villa Iguana à Sainte-Luce : piscine eau salée, vue panoramique sur le Rocher du Diamant. 6 personnes. Réservation directe propriétaire.",
  },
  geko: {
    id: "geko", nom: "Géko", type: "cocon",
    prix: 150, capacite: 4, chambres: 1, lieu: "Sainte-Luce", postal: "97228",
    coords: { lat: 14.4729, lng: -60.9194 }, rating: 4.83, reviews: 24, bookable: true,
    photos: ["/photos/geko/01.webp","/photos/geko/02.webp","/photos/geko/03.webp","/photos/geko/04.webp"],
    seoTitle: "Géko Sainte-Luce — cocon piscine cascade Martinique",
    seoDesc: "Cocon Géko à Sainte-Luce : piscine privative à cascade, jardin tropical, sur les hauteurs. 4 personnes. Dès 150€/nuit en réservation directe.",
  },
  mabouya: {
    id: "mabouya", nom: "Studio Mabouya", type: "studio",
    prix: 110, capacite: 2, chambres: 1, lieu: "Sainte-Luce", postal: "97228",
    coords: { lat: 14.4741, lng: -60.9209 }, rating: 4.55, reviews: 11, bookable: true,
    photos: ["/photos/mabouya/01.webp","/photos/mabouya/02.webp","/photos/mabouya/03.webp","/photos/mabouya/04.webp"],
    seoTitle: "Studio Mabouya Martinique — jacuzzi privatif vue mer",
    seoDesc: "Studio Mabouya à Sainte-Luce : seul jacuzzi privatif vue mer de la résidence. Idéal couple, terrasse privée, plages à 5 min. Dès 110€/nuit.",
  },
  schoelcher: {
    id: "schoelcher", nom: "Bellevue Schœlcher", type: "appartement de standing",
    prix: 100, capacite: 2, chambres: 1, lieu: "Schœlcher", postal: "97233",
    coords: { lat: 14.6121, lng: -61.0887 }, rating: 4.8, reviews: 30, bookable: true,
    photos: ["/photos/schoelcher/01.webp","/photos/schoelcher/02.webp","/photos/schoelcher/03.webp","/photos/schoelcher/04.webp"],
    seoTitle: "Bellevue Schœlcher — appart vue baie Fort-de-France",
    seoDesc: "Appartement Bellevue à Schœlcher : vue sur la baie de Fort-de-France, 2 personnes, à 10 min du centre. Réservation directe dès 100€/nuit.",
  },
  nogent: {
    id: "nogent", nom: "Appartement Nogent-sur-Marne", type: "appartement",
    prix: 85, capacite: 2, chambres: 1, lieu: "Nogent-sur-Marne", postal: "94130",
    coords: { lat: 48.8374, lng: 2.4836 }, rating: 4.8, reviews: 18, bookable: true,
    photos: ["/photos/nogent/01.webp","/photos/nogent/02.webp","/photos/nogent/03.webp","/photos/nogent/04.webp","/photos/nogent/05.webp","/photos/nogent/06.webp"],
    seoTitle: "Appart Nogent-sur-Marne — bord de Marne, Paris 20 min",
    seoDesc: "Appartement de standing à Nogent-sur-Marne : jardin privatif, home cinéma, bord de Marne. RER A, Paris en 20 min. Dès 85€/nuit en direct.",
  },
};

export const ALL_BIENS = Object.values(BIENS);
export const VILLAS = ALL_BIENS.filter(b => b.type === "villa").map(b => b.id); // ["amaryllis","iguana"]
export const isMartinique = (b) => b.lieu !== "Nogent-sur-Marne";
export function getBien(id) { return BIENS[id] || null; }
