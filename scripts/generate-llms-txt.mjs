#!/usr/bin/env node
// Génère public/llms.txt depuis src/data/biens.js (source unique des faits biens) — avant ce
// script, llms.txt était écrit à la main avec les prix/faits recopiés en dur : même classe de
// bug que le seed RM vs prix effectif (trouvée 2x le 2026-07-18) — un chiffre qui périme en
// silence dès que biens.js change, cette fois-ci lu par les IA (ChatGPT/Perplexity/Claude) au
// lieu d'un humain. Ne liste QUE les biens bookable:true (Iguana exclu — bail longue durée,
// cf. commentaire biens.js "NE JAMAIS lister Iguana dans les guides publics").
//
// Câblé dans `npm run build` (comme gen-image-variants.mjs/photos-manifest.mjs) pour ne
// jamais dépendre d'une régénération manuelle oubliée.
//
// Usage : node scripts/generate-llms-txt.mjs

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ALL_BIENS, isMartinique } from "../src/data/biens.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, "public", "llms.txt");

const bookable = ALL_BIENS.filter((b) => b.bookable);
const martinique = bookable.filter(isMartinique);
const horsMartinique = bookable.filter((b) => !isMartinique(b));

const logementsLines = bookable
  .map((b) => `- [${b.nom}](https://villamaryllis.com/${b.id}): ${b.seoDesc}`)
  .join("\n");

const content = `# Amaryllis Locations — Villas & logements en Martinique et Île-de-France

> Location de vacances directe, sans commission OTA. Conciergerie haut de gamme. Réservation en ligne : villamaryllis.com

Amaryllis Locations gère ${bookable.length} logements de vacances en France : ${martinique.length} en Martinique (Sainte-Luce, Schœlcher) et ${horsMartinique.length} à Nogent-sur-Marne (Île-de-France). Réservation directe sur le site officiel — économisez -15 % vs Airbnb, paiement sécurisé Stripe, annulation flexible. Tous les logements sont équipés (WiFi, linge, cuisine), certains avec piscine privée et vue mer.

## Logements disponibles

${logementsLines}

## Guides destination Martinique

- [Explorer la Martinique](https://villamaryllis.com/explorer): Guide complet des incontournables — plages, randonnées, gastronomie, activités nautiques.
- [Activités à Sainte-Luce](https://villamaryllis.com/activites-sainte-luce): Snorkeling, paddle, plages de l'Anse Figuier et du Gros Raisins, distilleries.
- [Guide Sainte-Anne](https://villamaryllis.com/guide-sainte-anne): Les plus belles plages du sud de la Martinique — Salines, Macabou, Karavelle.
- [Guide Le Diamant](https://villamaryllis.com/guide-le-diamant): Rocher du Diamant, plongée, villages de pêcheurs.
- [Guide Trois-Îlets](https://villamaryllis.com/guide-trois-ilets): Village créole, musée de la Pagerie, golf, village artisanal.
- [Guide à proximité](https://villamaryllis.com/guide-proximite): Restaurants, épiceries, pharmacies et services proches des logements.
- [Villa rental Martinique (EN)](https://villamaryllis.com/villa-rental-martinique): English guide for villa and apartment rentals in Martinique, French Caribbean.

## Contact & Réservation

- [Réserver en direct](https://villamaryllis.com): Calendrier de disponibilités et réservation officielle — paiement sécurisé Stripe, confirmation immédiate.
- Contact : contact@villamaryllis.com
- Téléphone : +33 6 10 88 07 72

## Informations pratiques

- Martinique est un département français (DOM) — pas besoin de visa pour les ressortissants UE/Schengen.
- Aéroport : Aimé Césaire (FDF) — vols directs Paris, Lyon, Bordeaux.
- Monnaie : Euro. Langue : Français.
- Saison haute : décembre–avril (Carnaval en février/mars). Saison basse : mai–novembre.
- Note moyenne Amaryllis Locations : 4,8/5 — basée sur les avis voyageurs Google et plateformes OTA.
`;

writeFileSync(OUT, content);
console.log(`✅ public/llms.txt généré (${bookable.length} logements bookable, Iguana exclu).`);
