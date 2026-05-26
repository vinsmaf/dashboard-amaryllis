// Cloudflare Pages Function — POST /api/agents-run
// Déclenche l'analyse autonome des agents via l'API Anthropic
// Appelle Claude claude-haiku-4-5 pour chaque agent, met à jour D1 (agent_actions)
// Utilisé par :
//   - Le bouton "Relancer l'analyse" dans l'admin
//   - Le Worker cron quotidien (workers/ical-sync/index.js) à 9h UTC

import { getSkillForAgent } from "./_skills.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

// ── Définition des 17 agents avec leur contexte métier ──────────────────────
const AGENTS = [
  {
    id: "juriste-compliance",
    label: "Juriste Compliance",
    emoji: "⚖️",
    prefix: "jur",
    focus: "conformité RGPD, LCEN, CGV, cookies, formulaires, mentions légales, droit de la location meublée touristique en France",
    files_hint: "MentionsLegales.jsx, PolitiqueConfidentialite.jsx, CookieBanner.jsx, index.html, PublicSite.jsx (formulaires), functions/api/contact.js",
  },
  {
    id: "architecte-reseau",
    label: "Architecte Réseau",
    emoji: "🔌",
    prefix: "arch",
    focus: "sécurité réseau, headers HTTP, CORS, rate limiting, secrets Cloudflare, Workers, webhooks, iCal sync",
    files_hint: "public/_headers, wrangler.toml, workers/ical-sync/index.js, functions/api/beds24-webhook.js, functions/api/stripe-webhook.js",
  },
  {
    id: "webmaster",
    label: "Webmaster",
    emoji: "🖥️",
    prefix: "web",
    focus: "infrastructure Cloudflare Pages, variables d'environnement, dépendances npm, endpoints API, documentation technique",
    files_hint: "package.json, wrangler.toml, functions/api/ (tous les fichiers), .dev.vars.example",
  },
  {
    id: "traffic-manager",
    label: "Traffic Manager",
    emoji: "📈",
    prefix: "traf",
    focus: "SEO technique, Google Ads, Meta Ads, performances Core Web Vitals, mots-clés, pages de destination",
    files_hint: "scripts/prerender.mjs, public/sitemap.xml, public/robots.txt, index.html, src/SEOMeta.jsx",
  },
  {
    id: "data-analyst",
    label: "Data Analyst",
    emoji: "📊",
    prefix: "data",
    focus: "tracking GA4, events analytics, cashflow propriétés, mix canal OTA vs direct, KPIs RevPAR/ADR/occupation",
    files_hint: "src/App.jsx (SEED_BIENS, REVENUS_CANAL_2025), index.html (GA4 setup, Consent Mode), PublicSite.jsx (events)",
  },
  {
    id: "revenue-manager",
    label: "Revenue Manager",
    emoji: "💡",
    prefix: "rev",
    focus: "pricing dynamique, revenue management, taux d'occupation, stratégie tarifaire OTA vs direct, Beds24",
    files_hint: "src/seedPrices.js, src/RevenueManagerPro.jsx, functions/api/beds24-rates.js, functions/api/rm-*.js",
  },
  {
    id: "developpeur-multimedia",
    label: "Dév. Multimédia",
    emoji: "🎬",
    prefix: "media",
    focus: "optimisation images WebP, galerie photos, lightbox, carousel, vidéos, sprite SVG, performance médias",
    files_hint: "public/photos/ (inventaire), src/PublicSite.jsx (galerie, lightbox), public/icons.svg",
  },
  {
    id: "photographe-da",
    label: "Photographe DA",
    emoji: "📸",
    prefix: "photo",
    focus: "direction artistique, photo de couverture, OG images, identité visuelle propriétés, besoins de shooting",
    files_hint: "scripts/prerender.mjs (OG images), public/photos/ (inventaire), src/PublicSite.jsx (HeroBrand)",
  },
  {
    id: "webdesigner",
    label: "Webdesigner",
    emoji: "🎨",
    prefix: "design",
    focus: "design system, tokens CSS, composants primitifs, cohérence visuelle, UX, dark mode, accessibilité",
    files_hint: "src/tokens.css, src/primitives.jsx, src/PublicSite.jsx (animations, composants)",
  },
  {
    id: "chef-produit-web",
    label: "Chef Produit Web",
    emoji: "🏗️",
    prefix: "cpw",
    focus: "roadmap produit, user stories, features manquantes, funnel de conversion, expérience voyageur",
    files_hint: "src/App.jsx, src/PublicSite.jsx, src/main.jsx, functions/api/",
  },
  {
    id: "community-manager",
    label: "Community Manager",
    emoji: "📱",
    prefix: "cm",
    focus: "réseaux sociaux, Instagram, Facebook, copywriting, calendrier éditorial, UGC, engagement",
    files_hint: "src/PublicSite.jsx (footer, descriptions), ~/.claude/agents/skills/community-manager-skills.md",
  },
  {
    id: "commercial-publicite",
    label: "Commercial / Pub",
    emoji: "💼",
    prefix: "pub",
    focus: "copywriting commercial, Google Ads, Meta Ads, propositions de valeur, landing pages, B2B séminaires",
    files_hint: "src/PublicSite.jsx (descriptions, CTAs, prix), scripts/prerender.mjs (meta descriptions)",
  },
  {
    id: "crm-manager",
    label: "CRM Manager",
    emoji: "📧",
    prefix: "crm",
    focus: "CRM, emails automatiques, segmentation, fidélisation, collecte données voyageurs, Brevo",
    files_hint: "functions/api/contact.js, src/GuestGuide.jsx, src/PublicSite.jsx (formulaires)",
  },
  {
    id: "consultant-ebusiness",
    label: "Consultant e-biz",
    emoji: "🚀",
    prefix: "ebiz",
    focus: "stratégie e-business, tunnel de conversion, upsells, réduction dépendance OTA, nouvelles sources revenus",
    files_hint: "src/PublicSite.jsx (tunnel réservation, Stripe), src/App.jsx (données revenus)",
  },
  {
    id: "responsable-service-client",
    label: "Service Client",
    emoji: "🤝",
    prefix: "sc",
    focus: "parcours voyageur, check-in/check-out, SLA réponse, gestion des avis, templates messages",
    files_hint: "src/PublicSite.jsx (FAQ, descriptions check-in), src/GuestGuide.jsx",
  },
  {
    id: "responsable-logistique",
    label: "Resp. Logistique",
    emoji: "🏠",
    prefix: "log",
    focus: "opérations logistiques, ménage, maintenance, prestataires, stocks, planning rotations",
    files_hint: "src/App.jsx (MenageTab), src/PublicSite.jsx (équipements BIENS)",
  },
  {
    id: "seo-content-writer",
    label: "SEO Content Writer",
    emoji: "✍️",
    prefix: "seo",
    focus: "rédaction SEO, structure contenu, mots-clés longue traîne, guides destination, maillage interne",
    files_hint: "scripts/prerender.mjs (meta data), src/GuideArlet.jsx, src/GuideDiamant.jsx, src/Faq.jsx",
  },
];

// ── Modèles Groq — rotation pour maximiser les appels parallèles ─────────────
// Chaque modèle a sa propre bucket de rate limit → on peut les appeler simultanément
// UNIQUEMENT modèles ACTIFS vérifiés (pas de modèles décommissionnés)
const GROQ_MODELS = [
  { model: "llama-3.3-70b-versatile",                   tier: "high"   }, // ✅ confirmé actif
  { model: "llama-3.1-8b-instant",                      tier: "fast"   }, // ✅ confirmé actif
  { model: "meta-llama/llama-4-scout-17b-16e-instruct", tier: "high"   }, // ✅ confirmé actif
  { model: "llama3-70b-8192",                           tier: "high"   }, // llama3 classic 70b
  { model: "llama3-8b-8192",                            tier: "mid"    }, // llama3 classic 8b
  { model: "llama-3.2-11b-vision-preview",              tier: "mid"    }, // vision + text
  { model: "llama-3.2-3b-preview",                      tier: "fast"   }, // mini rapide
];

// Attribution agent → modèle (modèles ACTIFS Groq, vérifiés mai 2026)
// llama-3.2-*-vision-preview est décommissionné → supprimé partout.
// llama-3.3-70b a un TPM bas, réservé à community-manager (drafts).
// Distribution équilibrée pour éviter rate limits 429.
const AGENT_MODELS = {
  // ─── llama-3.3-70b-versatile (slow but smart) : 1 agent seulement ────────
  "community-manager":          "llama-3.3-70b-versatile",                   // drafts sociaux + reviews
  // ─── llama-4-scout (8 agents) — analyses générales ──────────────────────
  "juriste-compliance":         "meta-llama/llama-4-scout-17b-16e-instruct",
  "revenue-manager":            "meta-llama/llama-4-scout-17b-16e-instruct",
  "traffic-manager":            "meta-llama/llama-4-scout-17b-16e-instruct",
  "chef-produit-web":           "meta-llama/llama-4-scout-17b-16e-instruct",
  "commercial-publicite":       "meta-llama/llama-4-scout-17b-16e-instruct",
  "consultant-ebusiness":       "meta-llama/llama-4-scout-17b-16e-instruct",
  "developpeur-multimedia":     "meta-llama/llama-4-scout-17b-16e-instruct",
  "photographe-da":             "meta-llama/llama-4-scout-17b-16e-instruct",
  // ─── llama-3.1-8b-instant (8 agents) — agents rapides ───────────────────
  "webdesigner":                "llama-3.1-8b-instant",
  "webmaster":                  "llama-3.1-8b-instant",
  "data-analyst":               "llama-3.1-8b-instant",
  "architecte-reseau":          "llama-3.1-8b-instant",
  "crm-manager":                "llama-3.1-8b-instant",
  "responsable-service-client": "llama-3.1-8b-instant",
  "responsable-logistique":     "llama-3.1-8b-instant",
  "seo-content-writer":         "llama-3.1-8b-instant",
};

// Fallback : si un modèle échoue avec rate limit persistant, on bascule sur
// llama-4-scout (le plus robuste observé).
const FALLBACK_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// ── Récupère l'historique D1 d'un agent (limite 40 derniers pour context) ─
async function fetchAgentHistory(db, agentId) {
  try {
    const { results } = await db.prepare(
      "SELECT id, action, status, notes FROM agent_actions WHERE agent = ? ORDER BY updated_at DESC LIMIT 40"
    ).bind(agentId).all();
    return (results || []).reverse(); // ordre chronologique pour le prompt
  } catch {
    return [];
  }
}

// ── Récupère les drafts récents (anti-répétition 14j) ──────────────────────
async function fetchRecentDrafts(db, agentId, days = 14) {
  try {
    const cutoff = Math.floor(Date.now() / 1000) - days * 86400;
    const { results } = await db.prepare(
      "SELECT id, type, payload, created_at FROM agent_drafts WHERE agent = ? AND created_at > ? ORDER BY created_at DESC LIMIT 20"
    ).bind(agentId, cutoff).all();
    return results || [];
  } catch {
    return [];
  }
}

// Extrait les biens déjà mentionnés dans les drafts récents
function extractDraftedProperties(drafts) {
  const propIds = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];
  const counts = Object.fromEntries(propIds.map(id => [id, 0]));
  for (const d of drafts) {
    try {
      const p = typeof d.payload === "string" ? JSON.parse(d.payload) : d.payload;
      const text = `${p.caption || ""} ${p.imageUrl || ""}`.toLowerCase();
      for (const id of propIds) {
        if (text.includes(`/${id}/`) || text.includes(id)) counts[id]++;
      }
    } catch {}
  }
  return counts;
}

// ── Agents capables de produire des drafts (contenu à publier) ───────────────
// Ces agents génèrent en plus des actions, des brouillons à approuver et publier.
const DRAFT_CAPABLE = {
  "community-manager": {
    types: ["social_post"],
    instructions: `Tu peux aussi générer des BROUILLONS de posts pour Instagram + Facebook.
Le compte Instagram est un page-backed (PBIA), donc un seul post va sur les 2 plateformes.

📐 STRUCTURE OBLIGATOIRE d'une caption (dans cet ordre exact) :
  1️⃣ Hook accrocheur (1 ligne, emoji en début)
  2️⃣ Description sensorielle du bien (3-5 lignes, max 150 mots)
  3️⃣ Bénéfice voyageur clair (1 ligne)
  4️⃣ Call-to-action avec URL → "Réservez sur https://villamaryllis.com/{bienId} ⤴️"
  5️⃣ Hashtags (8-12 mix : 3 marque + 3 destination + 2 type + 2 audience)

🔗 URLs réservation (toujours inclure dans la CTA) :
  - Amaryllis  → https://villamaryllis.com/amaryllis
  - Zandoli    → https://villamaryllis.com/zandoli
  - Iguana     → https://villamaryllis.com/iguana
  - Géko       → https://villamaryllis.com/geko
  - Mabouya    → https://villamaryllis.com/mabouya
  - Schœlcher  → https://villamaryllis.com/schoelcher
  - Nogent     → https://villamaryllis.com/nogent

#️⃣ STRATÉGIE HASHTAGS (8-12 obligatoires, varie selon bien/saison) :
  Marque    : #AmaryllisLocations #VillaAmaryllis #VillamaryllisCom
  Lieu MQ   : #Martinique #Caraïbes #SainteLuce #LeDiamant #Schoelcher #Antilles #VueMer
  Lieu IDF  : #Nogent #ParisEst #VincennesParis
  Type      : #LocationVacances #VillaPiscine #StayMartinique #VacanceHaut​DeGamme
  Audience  : #FamilleVacances #Couple #Honeymoon #SéjourLuxe #VoyageZen #SlowTravel

🖼️ URLs IMAGES (uniquement format .webp, numéros 01 à 12) :
  - https://villamaryllis.com/photos/amaryllis/01.webp
  - https://villamaryllis.com/photos/zandoli/01.webp
  - https://villamaryllis.com/photos/iguana/01.webp
  - https://villamaryllis.com/photos/geko/01.webp
  - https://villamaryllis.com/photos/mabouya/01.webp
  - https://villamaryllis.com/photos/schoelcher/01.webp
  - https://villamaryllis.com/photos/nogent/01.webp

Style : chaleureux, sensoriel, formel ("vous"), max 200 mots TOTAL.

⚠️ Avant de finaliser un draft, vérifie mentalement :
  ✓ CTA avec URL complète ? (sinon perte de conversions = ❌ retraffic)
  ✓ 8-12 hashtags stratégiques ? (sinon faible portée = ❌ SEO/social)
  ✓ Image .webp valide ? (sinon broken = ❌ qualité)
Ces 3 points sont validés par les agents traffic-manager + seo-content-writer.`,
  },
  "crm-manager": {
    types: ["email_campaign"],
    instructions: `Tu peux générer des BROUILLONS d'emails (newsletter, retour voyageur, demande d'avis, offre).`,
  },
};

// ── Prompt template pour chaque agent ────────────────────────────────────────
function buildPrompt(agent, history = [], memories = [], recentDrafts = []) {
  // Sépare l'historique par statut pour donner du contexte à l'agent
  const done    = history.filter(h => h.status === "fait");
  const blocked = history.filter(h => h.status === "bloqué");
  const planned = history.filter(h => h.status === "a-planifier");
  const pending = history.filter(h => h.status === "backlog" || h.status === "en-cours");

  // Calcule le prochain numéro d'ID disponible
  const maxNum = history.reduce((max, h) => {
    const n = parseInt(h.id.split("-").pop(), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const nextId = maxNum + 1;

  // Formate une section de l'historique
  const fmt = (items) => items.map(h =>
    `  • [${h.id}] ${h.action}${h.notes ? ` (note: ${h.notes})` : ""}`
  ).join("\n") || "  (aucune)";

  const historySection = history.length === 0 ? "" : `
HISTORIQUE DE TES ANALYSES PRÉCÉDENTES :
${done.length    ? `\n✅ DÉJÀ FAIT (${done.length}) — ne pas re-proposer :\n${fmt(done)}` : ""}
${blocked.length ? `\n🚫 BLOQUÉ (${blocked.length}) — éviter ou proposer une alternative :\n${fmt(blocked)}` : ""}
${planned.length ? `\n📅 À PLANIFIER (${planned.length}) — déjà identifié, ne pas dupliquer :\n${fmt(planned)}` : ""}
${pending.length ? `\n⏳ EN ATTENTE (${pending.length}) — déjà dans le backlog, ne pas dupliquer :\n${fmt(pending)}` : ""}

IMPORTANT : Tes nouvelles actions doivent compléter ce travail, pas le répéter.
Les IDs déjà utilisés vont jusqu'à ${agent.prefix}-${String(maxNum).padStart(3, "0")}.
Commence tes nouveaux IDs à ${agent.prefix}-${String(nextId).padStart(3, "0")}.
`;

  const memorySection = memories.length > 0 ? `
MÉMOIRE DE TES RUNS PRÉCÉDENTS :
${memories.map(m => `  • ${m.key}: ${m.value}`).join('\n')}
` : `
MÉMOIRE DE TES RUNS PRÉCÉDENTS :
  (première analyse)
`;

  // ── Skill métier injecté (manuel d'opération de l'agent) ────────────────
  const skill = getSkillForAgent(agent.id);
  const skillSection = skill ? `
═══════════════════════════════════════════════════════════════
📖 TON MANUEL D'OPÉRATION (à respecter strictement)
═══════════════════════════════════════════════════════════════
${skill}
═══════════════════════════════════════════════════════════════
` : "";

  return `Tu es l'agent "${agent.label}" (${agent.emoji}) d'Amaryllis Locations, plateforme de location de 7 propriétés premium en Martinique et Île-de-France (villamaryllis.com).

TON DOMAINE D'EXPERTISE : ${agent.focus}

FICHIERS CLÉS à analyser : ${agent.files_hint}
${skillSection}${memorySection}${historySection}
MISSION : Identifie les actions concrètes NOUVELLES à réaliser dans ton domaine. Tiens compte de ce qui a déjà été fait ou identifié pour approfondir ton analyse et aller plus loin.

📋 DONNÉES CANONIQUES PROPRIÉTÉS (NE JAMAIS INVENTER) :
• Villa Amaryllis (Sainte-Luce) : 280€/nuit · 8 pers · 3 chambres · 3,5 SDB · 4,94★
• Zandoli (Sainte-Luce) : 220€/nuit · 5 pers · 2 chambres · 1 SDB · 4,5★
• Villa Iguana (Sainte-Luce) : 180€/nuit · 6 pers · 2 chambres · 1 SDB · 4,75★
• Géko (Sainte-Luce) : 150€/nuit · 4 pers · 1 chambre · 1 SDB · 4,83★
• Studio Mabouya (Sainte-Luce) : 110€/nuit · 2 pers · 1 chambre · 1 SDB · 4,55★
• Bellevue (Schœlcher) : 100€/nuit · 2 pers · 1 chambre · 1 SDB · 4,8★
• Appt Nogent-sur-Marne (IDF) : 85€/nuit · 2 pers · 1 chambre · 1 SDB
⚠️ Si tu n'es pas sûr d'un chiffre, reste vague ("plusieurs chambres") plutôt que d'inventer.

${DRAFT_CAPABLE[agent.id] && recentDrafts.length > 0 ? `
🔁 ANTI-RÉPÉTITION (drafts des 14 derniers jours pour cet agent) :
${(() => {
  const counts = extractDraftedProperties(recentDrafts);
  const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
  const used = sorted.filter(([_,c]) => c > 0);
  const unused = sorted.filter(([_,c]) => c === 0).map(([id]) => id);
  let txt = used.length > 0
    ? `  Biens déjà postés : ${used.map(([id,c]) => `${id} (${c}×)`).join(", ")}`
    : "  (aucun bien posté récemment)";
  if (unused.length > 0) txt += `\n  ⭐ PRIORITÉ : choisis un bien NON-POSTÉ → ${unused.join(", ")}`;
  // Captions récentes pour éviter répétition d'angle
  const recentCaptions = recentDrafts.slice(0, 5).map((d, i) => {
    try {
      const p = typeof d.payload === "string" ? JSON.parse(d.payload) : d.payload;
      const hook = (p.caption || "").split("\n")[0].slice(0, 80);
      return `  ${i+1}. "${hook}..."`;
    } catch { return ""; }
  }).filter(Boolean).join("\n");
  if (recentCaptions) txt += `\n  📜 Hooks récents (NE PAS recopier le style) :\n${recentCaptions}`;
  return txt;
})()}
` : ""}
${DRAFT_CAPABLE[agent.id] ? `\n🚀 CAPACITÉ SPÉCIALE : Tu peux générer des BROUILLONS de contenu publiable.
${DRAFT_CAPABLE[agent.id].instructions}

${agent.id === "community-manager" ? `
═══════════════════════════════════════════════════════════════
📐 STRUCTURE OBLIGATOIRE D'UNE CAPTION (5 blocs, lignes vides entre)
═══════════════════════════════════════════════════════════════
Bloc 1 — HOOK accrocheur (≤ 12 mots, image sensorielle ou chiffre)
        Ex: "Six heures du matin. La mer entre dans la chambre."

Bloc 2 — DESCRIPTION (3-5 lignes, sensoriel : vue/son/ambiance, max 150 mots)
        Ex: "À la Villa Amaryllis, les rideaux ne servent presque à rien. On les laisse ouverts. Et c'est l'horizon qui vous réveille — pas une alarme."

Bloc 3 — BÉNÉFICE clair (1 ligne, ce que le voyageur gagne)
        Ex: "Pour des vacances où le temps s'arrête vraiment."

Bloc 4 — CTA explicite avec URL COMPLÈTE
        Format: "Réservez sur https://villamaryllis.com/{bienId} ⤴️"

Bloc 5 — HASHTAGS (5-9 stratégiques, mix marque + lieu + audience)
        Ex: "#AmaryllisLocations #Martinique #SainteLuce #VillaPiscine #SlowTravel #Caraïbes #Honeymoon"

🚨 INTERDIT : cascade emojis, "opportunité unique", "n'hésitez pas", "découvrez sans plus attendre"

EXEMPLE DE CAPTION PARFAITE (à imiter, pas copier) :
"""
Six heures du matin. La mer entre dans la chambre.

À la Villa Amaryllis, les rideaux ne servent presque à rien. On les laisse ouverts. Et c'est l'horizon qui vous réveille — pas une alarme.

Quatre chambres, une piscine privée, et le silence d'une crique de Sainte-Luce. C'est tout. C'est beaucoup.

Pour des vacances où le temps s'arrête vraiment.

Réservez sur https://villamaryllis.com/amaryllis ⤴️

#AmaryllisLocations #Martinique #SainteLuce #VillaPiscine #SlowTravel #Caraïbes #Honeymoon
"""
═══════════════════════════════════════════════════════════════
` : ""}
` : ""}
Retourne un JSON strict avec cette structure :
{
  "actions": [
    {
      "id": "${agent.prefix}-NNN",
      "agent": "${agent.id}",
      "agent_label": "${agent.label}",
      "agent_emoji": "${agent.emoji}",
      "category": "une parmi: securite|legal|performance|seo|tracking|business|conversion|ux|ops|crm|content|ads|doc|technique|bug",
      "action": "Description précise et actionnable de ce qui doit être fait (max 150 caractères)",
      "priority": "critique|haute|moyenne|basse",
      "effort": "durée estimée (30min|1h|2h|4h|8h|ext pour externe)",
      "status": "backlog"
    }
  ]${DRAFT_CAPABLE[agent.id] ? `,
  "drafts": [
    {
      "type": "${DRAFT_CAPABLE[agent.id].types.join("|")}",
      "rationale": "Pourquoi ce contenu, maintenant (max 200 caractères)",
      "preview": "Aperçu court pour l'admin (max 80 caractères)",
      "payload": ${agent.id === "community-manager"
        ? `{
        "caption": "Texte du post avec hook, description sensorielle, bénéfice, CTA villamaryllis.com/{bienId} et 5-9 hashtags. NE RECOPIE PAS l'exemple, invente un caption original pour le bien choisi.",
        "imageUrl": "https://villamaryllis.com/photos/{bienId}/01.webp à /12.webp",
        "channels": ["ig","fb"]
      }`
        : '{ "to": "vinsmaf@hotmail.com", "subject": "Sujet", "html": "<html>contenu</html>" }'
      }
    }
  ]` : ""}
}

Règles :
- Maximum 6 actions NOUVELLES (les plus importantes non encore traitées)
- Priorité "critique" = risque légal, sécurité, perte revenus significative
- Priorité "haute" = impact business direct mesurable
- "ext" pour effort = ressources externes nécessaires (photographe, agence, etc.)
- IDs format: ${agent.prefix}-${String(nextId).padStart(3, "0")}, ${agent.prefix}-${String(nextId + 1).padStart(3, "0")}, etc.${DRAFT_CAPABLE[agent.id] ? `
- Maximum 2 drafts par run (les plus pertinents pour cette semaine)
- Les drafts seront approuvés par l'humain avant publication réelle` : ""}
- Retourne UNIQUEMENT le JSON, aucun texte avant ou après`;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return json({ error: "POST only" }, 405);

  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) return json({ error: "GROQ_API_KEY not configured in Cloudflare Pages env vars" }, 503);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  const body = await request.json().catch(() => ({}));
  // agents peut être "all" ou un tableau d'IDs d'agents spécifiques
  const targetAgents = body.agents === "all" || !body.agents
    ? AGENTS
    : AGENTS.filter(a => body.agents.includes(a.id));

  if (!targetAgents.length) return json({ error: "No matching agents found" }, 400);

  const now = Math.floor(Date.now() / 1000);

  // ── Fonction d'appel Groq pour un agent donné ─────────────────────────────
  async function runAgent(agent) {
    try {
      // Historique D1 + mémoires de l'agent + drafts récents (anti-répétition)
      const history = await fetchAgentHistory(db, agent.id);
      const recentDrafts = DRAFT_CAPABLE[agent.id] ? await fetchRecentDrafts(db, agent.id, 14) : [];
      let memories = [];
      try {
        const { results: mems } = await db.prepare(
          "SELECT key, value FROM agent_memory WHERE agent = ? ORDER BY created_at DESC LIMIT 10"
        ).bind(agent.id).all();
        memories = mems || [];
      } catch {}

      // Modèle assigné à cet agent (bucket de rate limit distinct)
      const model = AGENT_MODELS[agent.id] || "llama-3.3-70b-versatile";

      const groqBody = JSON.stringify({
        model,
        max_tokens: 2048,  // augmenté pour drafts détaillés + multi-réponses
        temperature: 0.3,
        messages: [{ role: "user", content: buildPrompt(agent, history, memories, recentDrafts) }],
      });

      // Retry auto sur 429/400 + fallback model sur rate limit persistant
      let res, attempt = 0;
      let activeModel = model;
      let activeBody = groqBody;
      while (attempt < 5) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 22000);
        try {
          res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: activeBody,
            signal: ctrl.signal,
          });
        } finally {
          clearTimeout(timer);
        }
        if (res.status === 200) break;
        // 400 non-rate = vraie erreur, on stop
        if (res.status === 400) {
          const errText = await res.clone().text().catch(() => "");
          const isRateOrDecommissioned = errText.includes("rate") || errText.includes("token")
                                       || errText.includes("decommissioned");
          if (!isRateOrDecommissioned) break;
          // Si modèle décommissionné, basculer immédiatement sur fallback
          if (errText.includes("decommissioned") && activeModel !== FALLBACK_MODEL) {
            activeModel = FALLBACK_MODEL;
            activeBody = JSON.stringify({ ...JSON.parse(groqBody), model: activeModel });
            attempt++;
            continue;
          }
        }
        // 429 ou 400 rate : retry après backoff
        if (res.status !== 429 && res.status !== 400) break;
        attempt++;
        // Après 3 retries échoués, bascule sur le modèle de fallback
        if (attempt >= 3 && activeModel !== FALLBACK_MODEL) {
          activeModel = FALLBACK_MODEL;
          activeBody = JSON.stringify({ ...JSON.parse(groqBody), model: activeModel });
        }
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        return { agent: agent.id, model: activeModel, error: `Groq ${res.status}`, detail: errBody.slice(0, 100) };
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";

      // Parser le JSON
      let parsed;
      try {
        const match = text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(match ? match[0] : text);
      } catch {
        return { agent: agent.id, model: activeModel, error: "JSON parse failed", raw: text.slice(0, 200) };
      }

      const actions = parsed.actions || [];
      const drafts  = parsed.drafts || [];
      let inserted = 0, updated = 0, draftsCreated = 0;

      // ── Insertion des drafts (si l'agent en a généré) ────────────────────
      if (drafts.length > 0 && DRAFT_CAPABLE[agent.id]) {
        // S'assurer que la table existe (auto-init) avec colonne reviews
        try {
          await db.prepare(`CREATE TABLE IF NOT EXISTS agent_drafts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent TEXT NOT NULL, agent_label TEXT, agent_emoji TEXT,
            type TEXT NOT NULL, payload TEXT NOT NULL, rationale TEXT, preview TEXT,
            status TEXT NOT NULL DEFAULT 'pending', result TEXT, reviews TEXT,
            created_at INTEGER NOT NULL DEFAULT (unixepoch()),
            updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
            approved_at INTEGER, published_at INTEGER
          )`).run();
          // Migration : ajouter la colonne reviews si manquante
          try { await db.prepare(`ALTER TABLE agent_drafts ADD COLUMN reviews TEXT`).run(); } catch {}
        } catch {}

        for (const draft of drafts.slice(0, 2)) {
          if (!draft.type || !draft.payload) continue;
          if (!DRAFT_CAPABLE[agent.id].types.includes(draft.type)) continue;

          // ── Validation par agents spécialisés (traffic-manager + seo) ──
          let reviews = null;
          if (draft.type === "social_post") {
            try {
              const validatorPrompt = `Tu es un panel de 2 agents experts d'Amaryllis Locations (7 villas premium en Martinique + Nogent) qui review un draft de post social et le RÉÉCRIT s'il n'est pas parfait.

EXPERTS :
- traffic-manager : SEO, CTAs, hashtags, conversions
- seo-content-writer : qualité rédactionnelle, lisibilité, mots-clés longue traîne

DRAFT À VALIDER :
Caption : """${draft.payload.caption || ""}"""
ImageUrl : ${draft.payload.imageUrl || "(aucune)"}
Channels : ${(draft.payload.channels || []).join(", ")}

🎯 STRUCTURE OBLIGATOIRE (5 blocs distincts, séparés par lignes vides) :
1️⃣ HOOK accrocheur (1 ligne, ≤ 12 mots, image sensorielle ou question/chiffre)
2️⃣ DESCRIPTION sensorielle (3-5 lignes, max 150 mots, mention vue/son/ambiance)
3️⃣ BÉNÉFICE clair (1 ligne — ce que le voyageur gagne)
4️⃣ CTA explicite avec URL complète "Réservez sur https://villamaryllis.com/{bienId} ⤴️"
5️⃣ HASHTAGS (5-9 stratégiques, mix marque + lieu MQ/IDF + audience)

VOICE Amaryllis : "vous" formel, ton chaleureux, JAMAIS publicitaire, jamais "opportunité unique", jamais cascade d'emojis 🌴☀️🏖️🌊✨

EXEMPLE DE PERFECTION (caption Villa Amaryllis 9/10) :
"""
Six heures du matin. La mer entre dans la chambre.

À la Villa Amaryllis, les rideaux ne servent presque à rien. On les laisse ouverts. Et c'est l'horizon qui vous réveille — pas une alarme.

Quatre chambres, une piscine privée, et le silence d'une crique de Sainte-Luce. C'est tout. C'est beaucoup.

Pour des vacances où le temps s'arrête vraiment.

Réservez sur https://villamaryllis.com/amaryllis ⤴️

#AmaryllisLocations #Martinique #SainteLuce #VillaPiscine #SlowTravel #Caraïbes #Honeymoon
"""

🚨 RÈGLE ABSOLUE : Tu DOIS TOUJOURS fournir improved_blocks (sauf si verdict=reject).
   Même si le draft est à 80/100, fournis la version optimisée à 95/100.
   Chaque bloc va dans son propre champ JSON. Le serveur les concaténera avec \\n\\n.

Retourne UNIQUEMENT un JSON :
{
  "score": 0-100,
  "verdict": "approve" si score≥85 | "needs_edits" si 50-84 | "reject" si <50,
  "traffic_manager": { "note": 0-10, "feedback": "1-2 phrases concrètes" },
  "seo_writer": { "note": 0-10, "feedback": "1-2 phrases concrètes" },
  "improved_blocks": {
    "hook": "Hook accrocheur ≤ 12 mots, sensoriel/chiffre/question",
    "description": "3-5 lignes sensorielles (vue/son/ambiance), max 150 mots",
    "benefice": "1 ligne : ce que le voyageur gagne concrètement",
    "cta": "Réservez sur https://villamaryllis.com/{bienId} ⤴️",
    "hashtags": "#AmaryllisLocations #Martinique #... (5-9 hashtags séparés par espace)"
  }
}

Si verdict=reject : "improved_blocks": null`;

              const valRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify({
                  model: "llama-3.3-70b-versatile",  // modèle plus puissant pour réécrire
                  max_tokens: 1500, temperature: 0.4,  // un peu de créativité pour la réécriture
                  messages: [{ role: "user", content: validatorPrompt }],
                }),
              });
              if (valRes.ok) {
                const valData = await valRes.json();
                const valText = valData.choices?.[0]?.message?.content || "";
                const match = valText.match(/\{[\s\S]*\}/);
                if (match) {
                  const parsed = JSON.parse(match[0]);
                  reviews = JSON.stringify(parsed);
                  // Reconstruire le caption depuis les 5 blocs (concatène avec lignes vides)
                  if (parsed.improved_blocks && parsed.verdict !== "reject") {
                    const b = parsed.improved_blocks;
                    const blocks = [b.hook, b.description, b.benefice, b.cta, b.hashtags]
                      .filter(x => x && typeof x === "string" && x.trim())
                      .map(x => x.trim());
                    if (blocks.length >= 3) {
                      draft.payload.caption = blocks.join("\n\n");
                    }
                  } else if (parsed.improved_caption && parsed.verdict !== "reject") {
                    // Fallback rétro-compat si le modèle utilise l'ancien format
                    draft.payload.caption = parsed.improved_caption;
                  }
                }
              }
            } catch (e) { /* validation optionnelle, on continue sans */ }

            // ── Fallback heuristique : si caption toujours flat, on aère ──
            // Insère des sauts de ligne aux points naturels : avant "Réservez", avant "#"
            const cap = draft.payload.caption || "";
            const hasNewlines = cap.includes("\n\n");
            if (!hasNewlines && cap.length > 100) {
              let formatted = cap;
              // Espace double avant le CTA "Réservez sur"
              formatted = formatted.replace(/\s*(Réservez sur\s+https?:\/\/)/i, "\n\n$1");
              // Espace double avant le premier hashtag
              formatted = formatted.replace(/\s+(#\w+)/, "\n\n$1");
              // Espace double après les 2 premières phrases (hook + intro)
              const sentences = formatted.split(/(?<=[.!?])\s+/);
              if (sentences.length >= 4) {
                // Insère un saut après la 1ère phrase (hook) si pas déjà fait
                if (!sentences[0].includes("\n")) {
                  sentences[0] = sentences[0] + "\n\n";
                }
                formatted = sentences.join(" ").replace(/\n\n\s+/g, "\n\n");
              }
              draft.payload.caption = formatted;
            }
          }

          try {
            await db.prepare(`
              INSERT INTO agent_drafts
                (agent, agent_label, agent_emoji, type, payload, rationale, preview, reviews, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
            `).bind(
              agent.id, agent.label, agent.emoji,
              draft.type, JSON.stringify(draft.payload),
              draft.rationale || null, draft.preview || null,
              reviews, now, now
            ).run();
            draftsCreated++;
          } catch (e) {}
        }
      }

      // Upsert dans D1
      for (const row of actions) {
        if (!row.id || !row.action) continue;
        const existing = await db.prepare("SELECT id, status FROM agent_actions WHERE id = ?").bind(row.id).first();
        if (existing) {
          const keepStatus = ["fait", "bloqué", "a-planifier", "en-cours"].includes(existing.status);
          await db.prepare(`
            UPDATE agent_actions SET action=?, priority=?, effort=?, category=?,
            last_analyzed=?, updated_at=? ${keepStatus ? "" : ", status='backlog'"}
            WHERE id=?
          `).bind(row.action, row.priority || "moyenne", row.effort || "?", row.category || "autre", now, now, row.id).run();
          updated++;
        } else {
          await db.prepare(`
            INSERT OR IGNORE INTO agent_actions
              (id, agent, agent_label, agent_emoji, category, action, priority, effort, status, last_analyzed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'backlog', ?, ?, ?)
          `).bind(row.id, row.agent || agent.id, row.agent_label || agent.label, row.agent_emoji || agent.emoji,
                 row.category || "autre", row.action, row.priority || "moyenne", row.effort || "?",
                 now, now, now).run();
          inserted++;
        }
      }

      // Mémoire : stocker les observations clés
      if (actions.length > 0) {
        const topAction = [...actions].sort((a, b) => {
          const p = { critique: 0, haute: 1, moyenne: 2, basse: 3 };
          return (p[a.priority] ?? 3) - (p[b.priority] ?? 3);
        })[0];
        if (topAction.priority === "critique" || topAction.priority === "haute") {
          await db.prepare(`
            INSERT INTO agent_memory (agent, key, value) VALUES (?,?,?)
            ON CONFLICT(agent, key) DO UPDATE SET value=excluded.value, created_at=unixepoch()
          `).bind(agent.id, "last_top_action", JSON.stringify({
            action: topAction.action, priority: topAction.priority,
            category: topAction.category, model, ts: now,
          })).run().catch(() => {});
        }
        await db.prepare(`
          INSERT INTO agent_memory (agent, key, value) VALUES (?,?,?)
          ON CONFLICT(agent, key) DO UPDATE SET value=excluded.value, created_at=unixepoch()
        `).bind(agent.id, "last_run_count", String(actions.length)).run().catch(() => {});

        // Mémoire : modèle utilisé (pour suivi)
        await db.prepare(`
          INSERT INTO agent_memory (agent, key, value) VALUES (?,?,?)
          ON CONFLICT(agent, key) DO UPDATE SET value=excluded.value, created_at=unixepoch()
        `).bind(agent.id, "model", model).run().catch(() => {});
      }

      return { agent: agent.id, model: activeModel, ok: true, inserted, updated, drafts: draftsCreated, actions: actions.length, context_size: history.length };
    } catch (e) {
      return { agent: agent.id, error: e.message };
    }
  }

  // ── Exécution en VAGUES de 4 agents pour éviter rate limits Groq ─────────
  // 17 agents lancés simultanément = 400/429 sur les buckets saturés.
  // Vagues séquentielles de 4 = équilibre throughput / rate limits.
  const WAVE_SIZE = 4;
  const results = [];
  for (let i = 0; i < targetAgents.length; i += WAVE_SIZE) {
    const wave = targetAgents.slice(i, i + WAVE_SIZE);
    const waveResults = await Promise.all(wave.map(agent => runAgent(agent)));
    results.push(...waveResults);
    // Petit délai entre les vagues (sauf la dernière) pour décharger les buckets
    if (i + WAVE_SIZE < targetAgents.length) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  const ok = results.filter(r => r.ok).length;
  const errors = results.filter(r => r.error).length;
  return json({ ok: true, agents_run: targetAgents.length, ok_count: ok, error_count: errors, results });
}
