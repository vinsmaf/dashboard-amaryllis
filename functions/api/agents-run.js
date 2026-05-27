// Cloudflare Pages Function — POST /api/agents-run
// Déclenche l'analyse autonome des agents via l'API Anthropic
// Appelle Claude claude-haiku-4-5 pour chaque agent, met à jour D1 (agent_actions)
// Utilisé par :
//   - Le bouton "Relancer l'analyse" dans l'admin
//   - Le Worker cron quotidien (workers/ical-sync/index.js) à 9h UTC

import { getSkillForAgent } from "./_skills.js";
import { callLLM } from "./_llm.js";
import { factCheckCaption, loadLearnedLessons } from "./_factcheck.js";

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

// Tier de modèle par agent (multi-provider via callLLM)
// fast   = llama-3.1-8b ou équivalent (analyses rapides, peu d'enjeu créatif)
// medium = llama-4-scout / mistral-medium (équilibre qualité/vitesse)
// smart  = llama-3.3-70b / mistral-large (raisonnement + créativité)
const AGENT_TIERS = {
  // smart — drafts à forte valeur créative
  "community-manager":          "smart",
  "crm-manager":                "smart",
  // medium — analyses business avec contexte riche
  "revenue-manager":            "medium",
  "juriste-compliance":         "medium",
  "traffic-manager":            "medium",
  "chef-produit-web":           "medium",
  "commercial-publicite":       "medium",
  "consultant-ebusiness":       "medium",
  "seo-content-writer":         "medium",
  "developpeur-multimedia":     "medium",
  "photographe-da":             "medium",
  // fast — analyses techniques ou opérationnelles routinières
  "webdesigner":                "fast",
  "webmaster":                  "fast",
  "data-analyst":               "fast",
  "architecte-reseau":          "fast",
  "responsable-service-client": "fast",
  "responsable-logistique":     "fast",
};

// Provider préféré par agent (cascade vers les autres si échec)
// Distribution équilibrée pour éviter saturation d'un seul provider.
const AGENT_PREFERRED_PROVIDER = {
  // Groq (8 agents) — rapide, free tier généreux
  "juriste-compliance":         "groq",
  "revenue-manager":            "groq",
  "traffic-manager":            "groq",
  "chef-produit-web":           "groq",
  "commercial-publicite":       "groq",
  "consultant-ebusiness":       "groq",
  "responsable-service-client": "groq",
  "webdesigner":                "groq",
  // Cloudflare AI (5 agents) — bucket séparé, latence faible
  "community-manager":          "cloudflare",
  "crm-manager":                "cloudflare",
  "seo-content-writer":         "cloudflare",
  "developpeur-multimedia":     "cloudflare",
  "photographe-da":             "cloudflare",
  // Cerebras (2 agents) — ultra-rapide pour analyses simples
  "webmaster":                  "cerebras",
  "data-analyst":               "cerebras",
  // Mistral (2 agents) — FR-native pour contenu opérationnel
  "architecte-reseau":          "mistral",
  "responsable-logistique":     "mistral",
};

// ── Récupère l'historique D1 d'un agent ────────────────────────────────────
// Stratégie : tout l'historique non-faits (max 80) + les 40 faits les plus récents.
// L'agent voit toujours les bloqué/a-planifier/backlog ; les "fait" sont
// trimés pour économiser des tokens.
async function fetchAgentHistory(db, agentId) {
  try {
    const { results: nonDone } = await db.prepare(
      "SELECT id, action, status, notes FROM agent_actions WHERE agent = ? AND status != 'fait' ORDER BY updated_at DESC LIMIT 80"
    ).bind(agentId).all();
    const { results: done } = await db.prepare(
      "SELECT id, action, status, notes FROM agent_actions WHERE agent = ? AND status = 'fait' ORDER BY updated_at DESC LIMIT 40"
    ).bind(agentId).all();
    return [...(nonDone || []), ...(done || [])].reverse();
  } catch {
    return [];
  }
}

// ── Dédup sémantique : un nouveau action est-il proche d'un existant ? ───
// Normalise sans accents/ponctuation, lowercase, retire stopwords courants.
const STOPWORDS = new Set([
  "le","la","les","un","une","des","du","de","au","aux","pour","par","sur","dans","avec","sans","sous","plus","vers","mais","car",
  "et","ou","ni","ne","pas","est","sont","ont","fait","faire","mettre","place","sites","site","pages","page"
]);

function normalizeForCompare(text) {
  return (text || "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keywordsSet(text) {
  const normalized = normalizeForCompare(text);
  return new Set(normalized.split(" ").filter(w => w.length >= 4 && !STOPWORDS.has(w)));
}

async function findSimilarExistingAction(db, agentId, actionText) {
  try {
    // Élargi : 500 entries, exclure seulement "fait"
    const { results } = await db.prepare(
      "SELECT id, action, status FROM agent_actions WHERE agent = ? AND status != 'fait' LIMIT 500"
    ).bind(agentId).all();
    const newKey      = normalizeForCompare(actionText);
    const newPrefix50 = newKey.slice(0, 50);
    const newKwSet    = keywordsSet(actionText);

    if (!newKey || newKey.length < 15) return null;
    if (newKwSet.size < 3) return null;

    const newPrefix70 = newKey.slice(0, 70); // plus précis : inclut le bien
    for (const row of (results || [])) {
      const existKey      = normalizeForCompare(row.action);
      const existPrefix50 = existKey.slice(0, 50);
      const existPrefix70 = existKey.slice(0, 70);
      // Match 1 : 70 premiers chars identiques (inclut le bien dans la plupart des cas)
      if (existPrefix70 === newPrefix70 && newPrefix70.length >= 50) return row;
      // Match 2 : 50 premiers chars identiques (verbe + objet généraux) + Jaccard fort sur le reste
      if (existPrefix50 === newPrefix50) {
        // On vérifie que le SUFFIXE (après les 50 premiers chars) est aussi similaire
        const newSuffix    = newKey.slice(50);
        const existSuffix  = existKey.slice(50);
        const newSuffWords = new Set(newSuffix.split(" ").filter(w => w.length >= 4 && !STOPWORDS.has(w)));
        const exiSuffWords = new Set(existSuffix.split(" ").filter(w => w.length >= 4 && !STOPWORDS.has(w)));
        if (newSuffWords.size === 0 && exiSuffWords.size === 0) return row; // mêmes 50 chars + suffixes vides
        const sufInter = [...newSuffWords].filter(w => exiSuffWords.has(w)).length;
        const sufUnion = new Set([...newSuffWords, ...exiSuffWords]).size;
        if (sufUnion >= 2 && sufInter / sufUnion >= 0.6) return row; // suffixe partagé à 60%+
      }
      // Match 3 : Jaccard 70%+ sur tous les mots significatifs (sécurité)
      const existKwSet = keywordsSet(row.action);
      if (existKwSet.size < 3) continue;
      const inter = [...newKwSet].filter(w => existKwSet.has(w)).length;
      const union = new Set([...newKwSet, ...existKwSet]).size;
      if (union > 5 && inter / union >= 0.70) return row;
    }
    return null;
  } catch { return null; }
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
    types: [],
    instructions: `Tu génères UNIQUEMENT des actions d'analyse texte (recommandations, audits, idées de segmentation). NE GÉNÈRE AUCUN BROUILLON d'email automatique tant que la base voyageurs D1 n'est pas câblée — les envois aveugles à des adresses test ne sont pas tolérés.`,
  },
};

// ── Prompt template pour chaque agent ────────────────────────────────────────
function buildPrompt(agent, history = [], memories = [], recentDrafts = [], brief = "") {
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

  // ── BRIEF PRIORITAIRE (si calendrier éditorial) ─────────────────────────
  // Quand un brief est présent, on court-circuite history+memories+recentDrafts
  // pour que le modèle ne soit pas distrait. Le bien demandé est martelé.
  if (brief) {
    // Extraction du bien_id pour répétition forcée
    const bienMatch  = brief.match(/bien[=:\s]+([a-z]+)/i);
    const photoMatch = brief.match(/photo[=:\s]+(https?:\/\/[^\s,)]+)/i);
    const ctaMatch   = brief.match(/cta[=:\s"]+([^",)]+)/i);
    const themeMatch = brief.match(/th[èe]me[=:\s]+([a-z]+)/i);
    const bienId    = bienMatch ? bienMatch[1] : "?";
    const photoUrl  = photoMatch ? photoMatch[1] : "?";

    return `🚨🚨🚨 CONSIGNE ABSOLUE 🚨🚨🚨

Tu es l'agent community-manager d'Amaryllis Locations.
TU DOIS générer EXACTEMENT 1 draft social_post pour le bien : **${bienId.toUpperCase()}**

❌ INTERDIT de générer pour un autre bien. ❌
❌ Ignore TOUT historique d'agent : tu te concentres sur CE bien uniquement. ❌

Brief complet du calendrier éditorial :
${brief}

═══════════════════════════════════════════════════════════════
📋 DONNÉES CANONIQUES pour ${bienId.toUpperCase()} (utilise-les) :
${bienId === "amaryllis"  ? "  Villa Amaryllis, Sainte-Luce — 8 pers · 3 chambres · 4,94★ · sur les HAUTEURS, vue mer 180°, alizés, PISCINE À DÉBORDEMENT (la seule du portfolio)" : ""}
${bienId === "zandoli"    ? "  Zandoli, Sainte-Luce (résidence Amaryllis) — 5 pers · 2 chambres · 4,5★ · cocon tropical, mezzanine, jardin, PISCINE AVEC CASCADE (partagée résidence)" : ""}
${bienId === "iguana"     ? "  Villa Iguana, Sainte-Luce — 6 pers · 2 chambres · 4,75★ · vue Rocher du Diamant, PISCINE EAU SALÉE (la seule de la résidence, non chlorée)" : ""}
${bienId === "geko"       ? "  Géko, Sainte-Luce (résidence Amaryllis hauteurs) — 4 pers · 1 chambre · 4,83★ · jardin tropical, PISCINE AVEC CASCADE (partagée résidence)" : ""}
${bienId === "mabouya"    ? "  Studio Mabouya (résidence Amaryllis hauteurs) — 2 pers · 1 chambre · 4,55★ · JACUZZI privatif terrasse avec VUE mer (pas de piscine, pas pieds dans l'eau)" : ""}
${bienId === "schoelcher" ? "  Bellevue, Schœlcher (hauteurs) — 2 pers · 1 chambre · 4,8★ · vue baie Fort-de-France + Trois-Îlets (pas de piscine)" : ""}
${bienId === "nogent"     ? "  Appt Nogent-sur-Marne — 2 pers · 1 chambre · jardin + terrasse · bord de Marne, RER A 20min Paris" : ""}

🚫 GÉOGRAPHIE — INTERDIT :
  - "mer entre dans la chambre", "pieds dans l'eau", "à Xm de la plage"
  - "clapotis des vagues", "bruit/chant/murmure/rugissement/écume des vagues"
  - "vagues qui chantent/caressent/bercent/murmurent"
  - "sable chaud sous les pieds", "réveillé par les vagues", "lagon devant"
  - "plage privée", "crique privée", "ponton devant"

🚫 ÉQUIPEMENTS — INTERDIT (mensonge factuel) :
  - "piscine à débordement" UNIQUEMENT pour Villa Amaryllis (PAS pour les autres)
  - "piscine avec cascade" UNIQUEMENT pour Zandoli et Géko (partagée résidence)
  - "piscine eau salée" UNIQUEMENT pour Villa Iguana (seule de la résidence)
  - Pas de "piscine" pour Mabouya, Schœlcher, Nogent
  - "jacuzzi privatif" UNIQUEMENT pour Mabouya (PAS pour les autres)
  - "jardin et terrasse" pour Nogent (pas de piscine, pas de jacuzzi)

✅ AUTORISÉ pour les biens hauteurs :
  - "vue mer panoramique", "perché sur les hauteurs", "bercé par les alizés"
  - "horizon caraïbe", "vue 180° sur la baie", "bruissement des palmiers"
  - "parfum des fleurs tropicales", "chant des oiseaux"

═══════════════════════════════════════════════════════════════
Image à utiliser : ${photoUrl}

Retourne UN SEUL JSON :
{
  "actions": [],
  "drafts": [{
    "type": "social_post",
    "rationale": "Pourquoi ce post pour ${bienId} maintenant (max 200 caractères)",
    "preview": "Aperçu court (max 80 caractères)",
    "payload": {
      "caption": "Texte du post 150-200 mots, structure : hook → description sensorielle → bénéfice → CTA https://villamaryllis.com/${bienId} → 6-9 hashtags. NE MENTIONNE QUE ${bienId.toUpperCase()}, jamais un autre bien.",
      "imageUrl": "${photoUrl}",
      "channels": ["ig","fb"]
    }
  }]
}

⚠️ Si tu génères pour un autre bien que ${bienId}, ta réponse sera rejetée.
⚠️ Retourne UNIQUEMENT le JSON, aucun texte avant ou après.`;
  }

  return `Tu es l'agent "${agent.label}" (${agent.emoji}) d'Amaryllis Locations, plateforme de location de 7 propriétés premium en Martinique et Île-de-France (villamaryllis.com).

TON DOMAINE D'EXPERTISE : ${agent.focus}

FICHIERS CLÉS à analyser : ${agent.files_hint}
${skillSection}${memorySection}${historySection}
MISSION : Identifie les actions concrètes NOUVELLES à réaliser dans ton domaine. Tiens compte de ce qui a déjà été fait ou identifié pour approfondir ton analyse et aller plus loin.

📋 DONNÉES CANONIQUES PROPRIÉTÉS (NE JAMAIS INVENTER) :
• Villa Amaryllis (Sainte-Luce, sur les hauteurs) : 280€/nuit · 8 pers · 3 chambres · 3,5 SDB · 4,94★ · vue mer 180° depuis les hauteurs (PAS bord de mer)
• Zandoli (Sainte-Luce, résidence Amaryllis hauteurs) : 220€/nuit · 5 pers · 2 chambres · 1 SDB · 4,5★ · cocon tropical
• Villa Iguana (Sainte-Luce, résidence hauteurs) : 180€/nuit · 6 pers · 2 chambres · 1 SDB · 4,75★ · vue Rocher du Diamant
• Géko (Sainte-Luce, résidence Amaryllis hauteurs) : 150€/nuit · 4 pers · 1 chambre · 1 SDB · 4,83★ · jardin tropical
• Studio Mabouya (Sainte-Luce, résidence hauteurs) : 110€/nuit · 2 pers · 1 chambre · 1 SDB · 4,55★ · jacuzzi privatif VUE mer
• Bellevue (Schœlcher, hauteurs) : 100€/nuit · 2 pers · 1 chambre · 1 SDB · 4,8★ · vue baie Fort-de-France
• Appt Nogent-sur-Marne (IDF) : 85€/nuit · 2 pers · 1 chambre · 1 SDB · bord de Marne

🌊 GÉOGRAPHIE — TOUS LES BIENS MARTINIQUE SONT SUR LES HAUTEURS, PAS EN BORD DE MER :
  ❌ INTERDIT : "mer entre dans la chambre", "pieds dans l'eau", "à 5m de la plage", "crique privée"
  ✅ AUTORISÉ : "vue mer panoramique", "perché sur les hauteurs", "bercé par les alizés", "horizon caraïbe"

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
- Maximum 4 actions NOUVELLES (les plus importantes non encore traitées). PRIVILÉGIE LA QUALITÉ sur la quantité — mieux vaut 2 actions hyper-pertinentes que 6 vagues.
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

  // Vérifie qu'au moins un provider LLM est configuré
  if (!env.GROQ_API_KEY && !env.CF_AI_TOKEN && !env.MISTRAL_API_KEY && !env.CEREBRAS_API_KEY) {
    return json({ error: "No LLM provider configured (GROQ_API_KEY, CF_AI_TOKEN, MISTRAL_API_KEY ou CEREBRAS_API_KEY)" }, 503);
  }

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

      // ── Appel LLM multi-provider avec cascade automatique ──────────────
      const tier      = AGENT_TIERS[agent.id] || "medium";
      const preferred = AGENT_PREFERRED_PROVIDER[agent.id] || "groq";

      const llmResult = await callLLM(env, {
        provider: preferred,
        tier,
        max_tokens: 2048,
        temperature: 0.3,
        messages: [{ role: "user", content: buildPrompt(agent, history, memories, recentDrafts, body.brief || "") }],
      });

      if (!llmResult.ok) {
        return {
          agent: agent.id,
          error: "All providers failed",
          attempts: llmResult.errors,
        };
      }

      const activeModel = `${llmResult.provider}:${llmResult.model}`;
      // Sécurise text en string (certains providers renvoient parfois undefined/object)
      let text = llmResult.text;
      if (typeof text !== "string") {
        try { text = String(text ?? ""); } catch { text = ""; }
      }

      // Parser le JSON
      let parsed;
      try {
        const match = text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(match ? match[0] : text);
      } catch (e) {
        return { agent: agent.id, model: activeModel, error: "JSON parse failed", raw: String(text).slice(0, 200), parse_err: e.message };
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

              // Validator via callLLM multi-provider — tier=smart pour reformatage qualitatif
              // Démarre sur Mistral (FR-native) si dispo, sinon cascade.
              const valResult = await callLLM(env, {
                provider: "mistral",
                tier: "smart",
                max_tokens: 1500,
                temperature: 0.4,
                messages: [{ role: "user", content: validatorPrompt }],
              });
              if (valResult.ok) {
                let valText = valResult.text;
                if (typeof valText !== "string") valText = String(valText ?? "");
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

          // ── Si brief calendrier : force le bien_id et l'imageUrl ────────
          // Au cas où le LLM aurait ignoré la consigne et généré pour un autre bien
          if (body.brief && draft.type === "social_post") {
            const bienMatch  = body.brief.match(/bien[=:\s]+([a-z]+)/i);
            const photoMatch = body.brief.match(/photo[=:\s]+(https?:\/\/[^\s,)]+)/i);
            if (bienMatch && photoMatch) {
              const expectedBien = bienMatch[1];
              const expectedPhoto = photoMatch[1];
              // Force l'imageUrl (le serveur sait mieux que le LLM)
              draft.payload.imageUrl = expectedPhoto;
              // Force la channels par défaut
              if (!draft.payload.channels?.length) draft.payload.channels = ["ig", "fb"];
              // Vérifie que le caption mentionne bien le bien attendu
              const cap = (draft.payload.caption || "").toLowerCase();
              const BIEN_NAMES = {
                amaryllis: ["amaryllis","villa amaryllis"],
                zandoli: ["zandoli"],
                iguana: ["iguana"],
                geko: ["géko","geko"],
                mabouya: ["mabouya","studio mabouya"],
                schoelcher: ["schœlcher","schoelcher","bellevue"],
                nogent: ["nogent"],
              };
              const expected = BIEN_NAMES[expectedBien] || [expectedBien];
              const mentionsExpected = expected.some(n => cap.includes(n));
              if (!mentionsExpected) {
                // Le LLM a généré pour un autre bien → on rejette
                draft._wrong_bien = `Caption ne mentionne pas ${expectedBien} — LLM a ignoré le brief`;
              }
            }
          }

          // ── FACT-CHECK : scanne le caption final contre la liste noire ──
          const learnedRules = await loadLearnedLessons(db);
          let factErrors = draft.type === "social_post"
            ? factCheckCaption(draft.payload.caption, learnedRules)
            : [];
          if (draft._wrong_bien) {
            factErrors.push({ phrase: "bien incorrect", reason: draft._wrong_bien });
          }
          // Soft-fail : on garde le draft en "pending" même avec erreurs
          // → l'utilisateur voit les erreurs dans la review et peut cliquer "🎯 Améliorer"
          //   qui re-passera le fact-check après régénération.
          const insertStatus = "pending";
          const factCheckResult = factErrors.length > 0
            ? { fact_check: { passed: false, errors: factErrors } }
            : { fact_check: { passed: true } };

          // Fusionne avec les reviews existantes
          let finalReviews = reviews;
          if (factCheckResult) {
            try {
              const existing = reviews ? JSON.parse(reviews) : {};
              finalReviews = JSON.stringify({ ...existing, ...factCheckResult });
            } catch { finalReviews = JSON.stringify(factCheckResult); }
          }

          try {
            const insertRes = await db.prepare(`
              INSERT INTO agent_drafts
                (agent, agent_label, agent_emoji, type, payload, rationale, preview, reviews, status, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
              agent.id, agent.label, agent.emoji,
              draft.type, JSON.stringify(draft.payload),
              draft.rationale || null, draft.preview || null,
              finalReviews, insertStatus, now, now
            ).run();
            draftsCreated++;
            const draftId = insertRes.meta?.last_row_id;

            // Lier au calendrier éditorial — toujours en 'drafted' (le fact_check
            // est désormais une info dans reviews, pas un blocage hard)
            if (body.calendar_id && draftId) {
              try {
                await db.prepare(
                  "UPDATE editorial_calendar SET draft_id = ?, status = 'drafted', updated_at = unixepoch() WHERE id = ?"
                ).bind(draftId, body.calendar_id).run();
              } catch {}
            }
          } catch (e) {}
        }
      }

      // Upsert dans D1 — avec dédup sémantique
      let skipped = 0;
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
          // Dédup sémantique : skip si action très similaire existe déjà (active)
          const similar = await findSimilarExistingAction(db, agent.id, row.action);
          if (similar) {
            // L'agent re-propose la même chose — on touch updated_at pour montrer
            // qu'il reste pertinent, mais on n'insère pas un doublon
            await db.prepare("UPDATE agent_actions SET last_analyzed=?, updated_at=? WHERE id=?")
              .bind(now, now, similar.id).run();
            skipped++;
            continue;
          }
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
      // log skipped pour debug
      if (skipped > 0) console.log(`[${agent.id}] ${skipped} actions skippées (déjà dans backlog)`);

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
            category: topAction.category, model: activeModel, ts: now,
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
        `).bind(agent.id, "model", activeModel).run().catch(() => {});
      }

      return { agent: agent.id, model: activeModel, ok: true, inserted, updated, skipped, drafts: draftsCreated, actions: actions.length, context_size: history.length };
    } catch (e) {
      return {
        agent: agent.id,
        error: e.message,
        stack: e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : null
      };
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
