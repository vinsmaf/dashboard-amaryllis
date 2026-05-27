// Fact-checker partagé — utilisé par agents-run.js (à la création)
// et agent-drafts.js (lors de l'action "improve")
//
// Source unique de vérité pour les règles factuelles Amaryllis.
// Toute regex qui matche → erreur retournée avec raison.

export const FACT_CHECK_RULES = [
  // Biens MQ sur les hauteurs (PAS bord de mer)
  { rx: /mer (entre|coule|pénètre|s'invite) (dans|jusque)/i, reason: "Biens MQ sont sur les hauteurs, pas bord de mer" },
  { rx: /pieds dans (l['']eau|le sable|la mer)/i, reason: "Pas pieds dans l'eau — hauteurs" },
  { rx: /(à|a) \d+ ?m(ètres)? (de|du) (la|sable|plage|océan|rivage|sable)/i, reason: "Distance plage incorrecte — biens en hauteur" },
  { rx: /accès direct (à la |a la |aux )?(plage|sable|mer)/i, reason: "Pas d'accès direct plage" },
  { rx: /(plage|crique|criique) priv(ée|ative)/i, reason: "Pas de plage privée" },
  { rx: /clapotis (des |de la |du )?(vagues?|mer|oc(é|e)an)/i, reason: "Pas de clapotis audible — hauteurs" },
  { rx: /(bruit|son|chant|murmure|rugissement|écume|grondement) (des |de la |du )?(vagues?|mer|oc(é|e)an)/i, reason: "Pas de bruit de vagues audible" },
  { rx: /(vagues?) (qui (chante|caresse|berce|murmure)|comme bande-son)/i, reason: "Pas de vagues audibles" },
  { rx: /sable (chaud|fin|blanc|doré) sous (les |vos )?pieds/i, reason: "Pas de sable à proximité" },
  { rx: /(réveill(é|e)|endormi(e)?) par (les |des )?(vagues|le ressac|la mer)/i, reason: "Pas de vagues audibles" },
  { rx: /(lagon|ponton) (devant|en face|au pied)/i, reason: "Pas de lagon/ponton devant" },
  { rx: /(à |a )marée (basse|haute)/i, reason: "Aucun rapport avec la situation hauteurs" },
  // Données factuelles biens
  { rx: /4 chambres.*amaryllis|amaryllis.*4 chambres/i, reason: "Villa Amaryllis a 3 chambres (pas 4)" },
  { rx: /3 chambres.*iguana|iguana.*3 chambres/i, reason: "Villa Iguana a 2 chambres (pas 3)" },
  // Équipements piscines / jacuzzi — vérité par bien
  // Piscine à débordement : UNIQUEMENT Villa Amaryllis
  { rx: /piscine\s+(à|a)\s+d(é|e)bordement/i, reason: "Piscine à débordement uniquement pour Villa Amaryllis — vérifier le bien mentionné" },
  // Piscine avec cascade : UNIQUEMENT Zandoli et Géko
  { rx: /(piscine|cascade).*(iguana|mabouya|sch(œ|oe)lcher|nogent|bellevue|amaryllis)/i, reason: "Piscine avec cascade uniquement pour Zandoli et Géko" },
  { rx: /(iguana|mabouya|sch(œ|oe)lcher|nogent|bellevue|amaryllis).*(piscine|cascade)\s+(avec\s+)?cascade/i, reason: "Cascade uniquement pour Zandoli et Géko" },
  // Jacuzzi : UNIQUEMENT Mabouya (privatif)
  { rx: /jacuzzi\s+privati(f|ve).*(amaryllis|zandoli|iguana|geko|sch(œ|oe)lcher|nogent|bellevue)/i, reason: "Jacuzzi privatif uniquement pour Studio Mabouya" },
  { rx: /(amaryllis|zandoli|iguana|geko|sch(œ|oe)lcher|nogent|bellevue).*jacuzzi\s+privati(f|ve)/i, reason: "Jacuzzi privatif uniquement pour Studio Mabouya" },
  // Pas de piscine pour Nogent (jardin + terrasse seulement)
  { rx: /nogent.*piscine|piscine.*nogent/i, reason: "Nogent : pas de piscine — jardin et terrasse uniquement" },
];

// Vérifie un caption contre la fact-check list — retourne [erreurs] ou []
export function factCheckCaption(caption, extraRules = []) {
  if (!caption) return [];
  const errors = [];
  for (const rule of [...FACT_CHECK_RULES, ...extraRules]) {
    if (rule.rx.test(caption)) {
      const match = caption.match(rule.rx)?.[0] || "";
      errors.push({ phrase: match.slice(0, 60), reason: rule.reason });
    }
  }
  return errors;
}

// Charge les leçons apprises depuis D1 (apprentissage continu)
export async function loadLearnedLessons(db) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS agent_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern TEXT NOT NULL,
      reason TEXT NOT NULL,
      bien_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )`).run();
    const { results } = await db.prepare("SELECT pattern, reason FROM agent_lessons LIMIT 200").all();
    return (results || []).map(r => {
      try { return { rx: new RegExp(r.pattern, "i"), reason: r.reason }; }
      catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
}
