// ─────────────────────────────────────────────────────────────────────────────
// SOURCE UNIQUE DES FAITS — 7 biens Amaryllis (#8)
// Référence canonique pour les agents IA (nomenclature + équipements + capacités).
// ⚠️ Pour le SEO (functions/[slug].js / prerender.mjs / PublicSite.jsx) la migration
//    vers ce module reste à faire (footgun CLAUDE.md #1) — ici on couvre le côté AGENTS.
// ─────────────────────────────────────────────────────────────────────────────

// Consomme la source canonique (src/data/biens.js) pour les faits cœur des 7 biens,
// et conserve localement le texte de grounding LLM (equip/interdit) injecté dans les prompts.
// Interface inchangée pour agents-run.js : nom/type/capacite/chambres/prix/lieu/equip/interdit.
import { BIENS as CANON, VILLAS as CANON_VILLAS } from "../../src/data/biens.js";

// Seuls ces 2 biens sont des « villas » (les autres : logement/cocon/studio/appartement).
export const VILLAS = CANON_VILLAS;

// Texte de grounding LLM (équipements autorisés / interdits) — conservé verbatim ici.
const GROUNDING = {
  amaryllis:  { equip: "piscine à débordement eau salée 4×7 m", interdit: "PAS de jacuzzi" },
  iguana:     { equip: "piscine eau salée non chlorée", interdit: "PAS de débordement, PAS de jacuzzi" },
  zandoli:    { equip: "piscine privative avec cascade (eau classique)", interdit: "PAS eau salée" },
  geko:       { equip: "piscine privative avec cascade (eau classique)", interdit: "PAS eau salée" },
  mabouya:    { equip: "jacuzzi privatif vue mer", interdit: "AUCUNE piscine" },
  schoelcher: { equip: "vue panoramique baie", interdit: "AUCUNE piscine, AUCUN jacuzzi" },
  nogent:     { equip: "jardin + terrasse", interdit: "AUCUNE piscine, AUCUN jacuzzi" },
};

export const BIENS = Object.fromEntries(Object.values(CANON).map(b => [b.id, {
  nom: b.nom, type: b.type, capacite: b.capacite, chambres: b.chambres,
  prix: b.prix, lieu: b.lieu, ...GROUNDING[b.id],
}]));

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
  ❌ "Mabouya et sa piscine"              → Mabouya = jacuzzi uniquement
  ❌ "Bellevue et sa piscine"                    → Bellevue n'a aucune piscine
  ❌ "Iguana et sa piscine à débordement"        → débordement = Amaryllis uniquement
  ❌ "Amaryllis a 4 chambres pour 10 personnes" → 3 chambres, 8 personnes max`;
