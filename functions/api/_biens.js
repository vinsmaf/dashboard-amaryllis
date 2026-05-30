// ─────────────────────────────────────────────────────────────────────────────
// SOURCE UNIQUE DES FAITS — 7 biens Amaryllis (#8)
// Référence canonique pour les agents IA (nomenclature + équipements + capacités).
// ⚠️ Pour le SEO (functions/[slug].js / prerender.mjs / PublicSite.jsx) la migration
//    vers ce module reste à faire (footgun CLAUDE.md #1) — ici on couvre le côté AGENTS.
// ─────────────────────────────────────────────────────────────────────────────

// Seuls ces 2 biens sont des « villas » (les autres : logement/cocon/studio/appartement).
export const VILLAS = ["amaryllis", "iguana"];

export const BIENS = {
  amaryllis:  { nom: "Villa Amaryllis", type: "villa", capacite: 8, chambres: 3, prix: 280, lieu: "Sainte-Luce", equip: "piscine à débordement eau salée 4×7 m", interdit: "PAS de jacuzzi" },
  iguana:     { nom: "Villa Iguana", type: "villa", capacite: 6, chambres: 2, prix: 180, lieu: "Sainte-Luce", equip: "piscine eau salée non chlorée", interdit: "PAS de débordement, PAS de jacuzzi" },
  zandoli:    { nom: "Zandoli", type: "logement", capacite: 5, prix: 220, lieu: "Sainte-Luce", equip: "piscine privative avec cascade (eau classique)", interdit: "PAS eau salée" },
  geko:       { nom: "Géko", type: "cocon", capacite: 4, prix: 150, lieu: "Sainte-Luce", equip: "piscine privative avec cascade (eau classique)", interdit: "PAS eau salée" },
  mabouya:    { nom: "Mabouya", type: "studio", capacite: 2, prix: 110, lieu: "Sainte-Luce", equip: "jacuzzi privatif vue mer", interdit: "AUCUNE piscine" },
  schoelcher: { nom: "Bellevue", type: "appartement de standing", prix: 100, lieu: "Schœlcher", equip: "vue panoramique baie", interdit: "AUCUNE piscine, AUCUN jacuzzi" },
  nogent:     { nom: "Appartement Nogent", type: "appartement", prix: 85, lieu: "Nogent-sur-Marne", equip: "jardin + terrasse", interdit: "AUCUNE piscine, AUCUN jacuzzi" },
};

// Bloc règles géo + équipements injecté tel quel dans le prompt des agents.
// (texte historique conservé verbatim pour ne pas altérer le comportement des agents)
export const EQUIP_RULES_TEXT = `🌊 GÉOGRAPHIE — TOUS LES BIENS MARTINIQUE SONT SUR LES HAUTEURS, PAS EN BORD DE MER :
  ❌ INTERDIT : "mer entre dans la chambre", "pieds dans l'eau", "à 5m de la plage", "crique privée"
  ✅ AUTORISÉ : "vue mer panoramique", "perché sur les hauteurs", "bercé par les alizés", "horizon caraïbe"

🏊 ÉQUIPEMENTS PAR BIEN — RÈGLE STRICTE (mensonge = rejet du draft) :
  • Amaryllis : PISCINE À DÉBORDEMENT EAU SALÉE 4×7 m  → PAS de jacuzzi
  • Iguana    : PISCINE EAU SALÉE non chlorée            → PAS de débordement, PAS de jacuzzi
  • Zandoli   : PISCINE PRIVATIVE AVEC CASCADE           → eau classique, PAS eau salée
  • Géko      : PISCINE PRIVATIVE AVEC CASCADE           → eau classique, PAS eau salée
  • Mabouya   : JACUZZI PRIVATIF VUE MER                 → AUCUNE piscine
  • Bellevue  : VUE PANORAMIQUE BAIE                     → AUCUNE piscine, AUCUN jacuzzi
  • Nogent    : JARDIN + TERRASSE                        → AUCUNE piscine, AUCUN jacuzzi

📚 EXEMPLES À NE PAS REPRODUIRE :
  ❌ "Villa Amaryllis et son jacuzzi"            → Amaryllis = piscine à débordement, pas de jacuzzi
  ❌ "Géko et sa piscine eau salée"              → Géko = cascade, eau classique
  ❌ "Studio Mabouya et sa piscine"              → Mabouya = jacuzzi uniquement
  ❌ "Bellevue et sa piscine"                    → Bellevue n'a aucune piscine
  ❌ "Iguana et sa piscine à débordement"        → débordement = Amaryllis uniquement
  ❌ "Amaryllis a 4 chambres pour 10 personnes" → 3 chambres, 8 personnes max`;
