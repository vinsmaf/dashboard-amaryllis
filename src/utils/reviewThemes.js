// Codage thématique des avis voyageurs (voyageur-002 → alimente voyageur-003,
// rapport trimestriel "Voix du voyageur"). Logique pure : taxonomie fixe +
// construction du prompt de codage batché + parsing défensif de la réponse LLM.
// L'appel LLM et la persistance D1 restent dans functions/api/voyageur-feedback.js.

// Taxonomie FIXE (7 thèmes) — un avis peut recevoir plusieurs thèmes, ou aucun.
export const THEMES = {
  logement:    "le logement lui-même (confort, propreté, équipement, literie, décoration)",
  localisation: "l'emplacement, le quartier, la vue, les distances/accès",
  piscine:     "la piscine (privative ou partagée)",
  accueil:     "l'accueil, la réactivité, la relation avec l'hôte/l'équipe",
  prix:        "le rapport qualité-prix, un jugement explicite sur le tarif",
  reco:        "une recommandation explicite (reviendrait, conseille à d'autres) — PAS juste une note positive générale",
  frictions:   "un problème, une gêne, une déception mentionnée (même mineure dans un avis globalement positif)",
};
export const THEME_KEYS = Object.keys(THEMES);

// Construit le prompt LLM pour un LOT d'avis (batch — réduit le nombre d'appels).
// `reviews` : [{ id, bienNom, rating, text }]
export function buildThemeCodingPrompt(reviews) {
  const taxo = THEME_KEYS.map(k => `- "${k}" : ${THEMES[k]}`).join("\n");
  const system = [
    "Tu codes thématiquement des avis voyageurs pour une conciergerie de locations en Martinique.",
    "Taxonomie FIXE (n'utilise QUE ces clés, jamais d'autre) :",
    taxo,
    "Pour chaque avis, renvoie les thèmes RÉELLEMENT présents dans le texte (0 à plusieurs) — ne force jamais un thème absent.",
    `Réponds UNIQUEMENT avec un tableau JSON : [{"id": "...", "themes": ["...", "..."]}]`,
  ].join("\n");

  const user = reviews.map(r =>
    `id=${r.id} | bien=${r.bienNom} | note=${r.rating}★\navis: "${(r.text || "").slice(0, 500)}"`
  ).join("\n\n");

  return {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
}

// Parse défensivement la réponse LLM : extrait le 1er tableau JSON, valide que
// chaque id existe bien dans le lot envoyé et que chaque thème ⊆ THEME_KEYS
// (rejette silencieusement tout thème halluciné hors taxonomie).
export function parseThemeCodingResponse(text, validIds) {
  const idSet = new Set(validIds);
  const m = /\[[\s\S]*\]/.exec(text || "");
  if (!m) return [];
  let parsed;
  try { parsed = JSON.parse(m[0]); } catch { return []; }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter(row => row && idSet.has(row.id))
    .map(row => ({
      id: row.id,
      themes: Array.isArray(row.themes) ? row.themes.filter(t => THEME_KEYS.includes(t)) : [],
    }));
}
