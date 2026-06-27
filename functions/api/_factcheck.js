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
  // Piscine à débordement : UNIQUEMENT Villa Amaryllis (donc légitime SI le post concerne amaryllis → okFor)
  { rx: /piscine\s+(à|a)\s+d(é|e)bordement/i, reason: "Piscine à débordement uniquement pour Villa Amaryllis — vérifier le bien mentionné", okFor: ["amaryllis"] },
  // Cascade : UNIQUEMENT Zandoli et Géko (résidence partagée)
  { rx: /cascade.*(iguana|mabouya|sch(œ|oe)lcher|nogent|bellevue|amaryllis)/i, reason: "Piscine avec cascade uniquement pour Zandoli et Géko" },
  { rx: /(iguana|mabouya|sch(œ|oe)lcher|nogent|bellevue|amaryllis).*cascade/i, reason: "Cascade uniquement pour Zandoli et Géko" },
  // Piscine eau salée : Villa Amaryllis (à débordement) ET Villa Iguana (non chlorée).
  // Interdit pour les autres biens (Zandoli/Géko/Mabouya/Schœlcher/Nogent/Bellevue).
  { rx: /eau\s+sal(é|e)e.*(zandoli|g(é|e)ko|mabouya|sch(œ|oe)lcher|nogent|bellevue)/i, reason: "Piscine eau salée uniquement pour Villa Amaryllis et Villa Iguana" },
  { rx: /(zandoli|g(é|e)ko|mabouya|sch(œ|oe)lcher|nogent|bellevue).*eau\s+sal(é|e)e/i, reason: "Piscine eau salée uniquement pour Villa Amaryllis et Villa Iguana" },
  // Jacuzzi : UNIQUEMENT Mabouya (privatif)
  { rx: /jacuzzi\s+privati(f|ve).*(amaryllis|zandoli|iguana|g(é|e)ko|sch(œ|oe)lcher|nogent|bellevue)/i, reason: "Jacuzzi privatif uniquement pour Mabouya" },
  { rx: /(amaryllis|zandoli|iguana|g(é|e)ko|sch(œ|oe)lcher|nogent|bellevue).*jacuzzi\s+privati(f|ve)/i, reason: "Jacuzzi privatif uniquement pour Mabouya" },
  // Pas de piscine pour Nogent (jardin + terrasse seulement)
  { rx: /nogent.*piscine|piscine.*nogent/i, reason: "Nogent : pas de piscine — jardin et terrasse uniquement" },
  // Pas de piscine pour Bellevue (Schœlcher) — vue panoramique uniquement
  { rx: /bellevue.*piscine|piscine.*bellevue/i, reason: "Bellevue (Schœlcher) : pas de piscine — vue panoramique uniquement" },
  { rx: /sch(œ|oe)lcher.*piscine|piscine.*sch(œ|oe)lcher/i, reason: "Bellevue Schœlcher : pas de piscine — vue panoramique uniquement" },
  // Pas de piscine pour Mabouya (jacuzzi privatif uniquement)
  { rx: /mabouya.*piscine|piscine.*mabouya/i, reason: "Mabouya : pas de piscine — jacuzzi privatif uniquement" },
  // Débordement uniquement Amaryllis
  { rx: /d(é|e)bordement.*(iguana|zandoli|g(é|e)ko|mabouya|sch(œ|oe)lcher|nogent|bellevue)/i, reason: "Piscine à débordement uniquement pour Villa Amaryllis" },
  { rx: /(iguana|zandoli|g(é|e)ko|mabouya|sch(œ|oe)lcher|nogent|bellevue).*d(é|e)bordement/i, reason: "Piscine à débordement uniquement pour Villa Amaryllis" },
  // Nomenclature : seuls Amaryllis et Iguana sont des "villas".
  // Zandoli (logement), Géko (cocon), Mabouya (studio), Bellevue (appartement) ne le sont pas.
  { rx: /villa\s+(zandoli|g(é|e)ko|mabouya|bellevue)/i, reason: "Zandoli/Géko/Mabouya/Bellevue ne sont PAS des villas — écrire le nom sans « Villa »" },
  // Le mot « villa » employé pour un bien qui n'en est pas une (seules Amaryllis & Iguana = villas).
  // onlyFor les 5 biens non-villa → ne flague jamais amaryllis/iguana. Hashtags déjà strippés.
  { rx: /\bvillas?\b/i, reason: "Seules Villa Amaryllis et Villa Iguana sont des « villas » — ne pas désigner ce bien comme une villa", onlyFor: ["zandoli", "geko", "mabouya", "schoelcher", "nogent"] },
  // Nombre de chambres faux (en lettres ou chiffres). `onlyFor` : la règle ne s'applique QUE pour ce bien.
  // Villa Amaryllis = 3 chambres → « quatre/cinq/4/5 suites/chambres » est faux.
  { rx: /(quatre|cinq|six|4|5|6)\s+(suites?|chambres?)/i, reason: "Villa Amaryllis a 3 chambres — nombre de pièces faux", onlyFor: ["amaryllis"] },
];

// Vérifie un caption contre la fact-check list — retourne [erreurs] ou [].
// bienId (optionnel) : si fourni, une règle avec `okFor: [...]` incluant ce bien est ignorée
// (l'équipement est LÉGITIME pour ce bien — ex. piscine à débordement pour amaryllis).
export function factCheckCaption(caption, extraRules = [], bienId = null) {
  if (!caption) return [];
  // Les hashtags (#AmaryllisLocations, #Martinique…) sont du marketing, pas des affirmations
  // factuelles. On les retire AVANT d'appliquer les règles, sinon le nom de marque « Amaryllis »
  // présent dans tous les hashtags déclenche en boucle les règles « équipement.*amaryllis » (faux positifs).
  // Strip hashtags ET URLs (villamaryllis.com contient "villa" → faux positif sur les règles villa)
  const body = caption.replace(/#[^\s#]+/g, " ").replace(/https?:\/\/\S+/g, " ");
  const errors = [];
  for (const rule of [...FACT_CHECK_RULES, ...extraRules]) {
    if (bienId && Array.isArray(rule.okFor) && rule.okFor.includes(bienId)) continue;
    // onlyFor : règle restreinte à certains biens — ignorée pour les autres (et si bien inconnu).
    if (Array.isArray(rule.onlyFor) && (!bienId || !rule.onlyFor.includes(bienId))) continue;
    if (rule.rx.test(body)) {
      const match = body.match(rule.rx)?.[0] || "";
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
    const { results } = await db.prepare("SELECT pattern, reason, bien_id FROM agent_lessons LIMIT 200").all();
    return (results || []).map(r => {
      try {
        const rule = { rx: new RegExp(r.pattern, "i"), reason: r.reason };
        // Mot banni rattaché à UN bien → ne s'applique qu'à ce bien (onlyFor). Sinon = global.
        // Évite qu'un « villa » banni pour schoelcher bloque un post amaryllis (qui EST une villa).
        if (r.bien_id) rule.onlyFor = [r.bien_id];
        return rule;
      } catch { return null; }
    }).filter(Boolean);
  } catch { return []; }
}
