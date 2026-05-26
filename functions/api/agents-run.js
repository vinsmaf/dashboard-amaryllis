// Cloudflare Pages Function — POST /api/agents-run
// Déclenche l'analyse autonome des agents via l'API Anthropic
// Appelle Claude claude-haiku-4-5 pour chaque agent, met à jour D1 (agent_actions)
// Utilisé par :
//   - Le bouton "Relancer l'analyse" dans l'admin
//   - Le Worker cron quotidien (workers/ical-sync/index.js) à 9h UTC

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

// Attribution agent → modèle
// Règle : max 2-3 agents par modèle pour éviter les 429 (buckets séparées par modèle)
// Modèles supprimés : mixtral-8x7b, gemma2-9b, deepseek-r1, qwen-qwq, mistral-saba, llama-4-maverick
const AGENT_MODELS = {
  // ─── bucket llama-3.3-70b-versatile (2 agents) ───────────────────────────
  "juriste-compliance":         "llama-3.3-70b-versatile",                   // légal → meilleur raisonnement
  "revenue-manager":            "llama-3.3-70b-versatile",                   // revenus → analyse profonde
  // ─── bucket llama3-70b-8192 (3 agents) ───────────────────────────────────
  "architecte-reseau":          "llama3-70b-8192",                           // sécurité → 70b classic
  "consultant-ebusiness":       "llama3-70b-8192",                           // stratégie → 70b classic
  "seo-content-writer":         "llama3-70b-8192",                           // SEO → 70b classic
  // ─── bucket llama-4-scout (3 agents) ─────────────────────────────────────
  "traffic-manager":            "meta-llama/llama-4-scout-17b-16e-instruct", // SEO → Llama 4
  "chef-produit-web":           "meta-llama/llama-4-scout-17b-16e-instruct", // produit → Llama 4
  "commercial-publicite":       "meta-llama/llama-4-scout-17b-16e-instruct", // pub → Llama 4
  // ─── bucket llama-3.1-8b-instant (2 agents) ──────────────────────────────
  "webdesigner":                "llama-3.1-8b-instant",                      // design → ultra-rapide
  "responsable-logistique":     "llama-3.1-8b-instant",                      // logistique → rapide
  // ─── community-manager : modèle plus puissant pour générer des drafts ────
  "community-manager":          "llama-3.3-70b-versatile",                   // CM → drafts + actions
  // ─── bucket llama3-8b-8192 (2 agents) ────────────────────────────────────
  "webmaster":                  "llama3-8b-8192",                            // tech → 8b classic
  "data-analyst":               "llama3-8b-8192",                            // data → 8b classic
  // ─── bucket llama-3.2-11b-vision (2 agents) ──────────────────────────────
  "developpeur-multimedia":     "llama-3.2-11b-vision-preview",              // media → vision
  "photographe-da":             "llama-3.2-11b-vision-preview",              // photo → vision
  // ─── bucket llama-3.2-3b (2 agents) ──────────────────────────────────────
  "crm-manager":                "llama-3.2-3b-preview",                      // CRM → mini
  "responsable-service-client": "llama-3.2-3b-preview",                      // SC → mini
};

// ── Récupère l'historique D1 d'un agent ──────────────────────────────────────
async function fetchAgentHistory(db, agentId) {
  try {
    const { results } = await db.prepare(
      "SELECT id, action, status, notes FROM agent_actions WHERE agent = ? ORDER BY id ASC"
    ).bind(agentId).all();
    return results || [];
  } catch {
    return [];
  }
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
function buildPrompt(agent, history = [], memories = []) {
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

  return `Tu es l'agent "${agent.label}" (${agent.emoji}) d'Amaryllis Locations, plateforme de location de 7 propriétés premium en Martinique et Île-de-France (villamaryllis.com).

TON DOMAINE D'EXPERTISE : ${agent.focus}

FICHIERS CLÉS à analyser : ${agent.files_hint}
${memorySection}${historySection}
MISSION : Identifie les actions concrètes NOUVELLES à réaliser dans ton domaine. Tiens compte de ce qui a déjà été fait ou identifié pour approfondir ton analyse et aller plus loin.

Propriétés : Villa Amaryllis (280€/nuit, 8 pers, 4.94★), Zandoli (220€, 5 pers, 4.5★), Villa Iguana (180€, 6 pers, 4.75★), Géko (150€, 4 pers, 4.83★), Mabouya (110€, 2 pers, 4.55★), Bellevue/Schœlcher (100€, 2 pers, 4.8★), Nogent-sur-Marne (85€, 2 pers, 4.95★).

${DRAFT_CAPABLE[agent.id] ? `\n🚀 CAPACITÉ SPÉCIALE : Tu peux générer des BROUILLONS de contenu publiable.
${DRAFT_CAPABLE[agent.id].instructions}\n` : ""}
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
        ? '{ "caption": "Le texte complet du post avec emojis et hashtags", "imageUrl": "URL d\'une image publique", "channels": ["ig","fb"] }'
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
      // Historique D1 + mémoires de l'agent
      const history = await fetchAgentHistory(db, agent.id);
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
        max_tokens: 1024,
        temperature: 0.3,
        messages: [{ role: "user", content: buildPrompt(agent, history, memories) }],
      });

      // Retry auto sur 429 avec backoff + AbortController 22s (CF timeout = 30s)
      let res, attempt = 0;
      while (attempt < 3) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 22000);
        try {
          res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
            body: groqBody,
            signal: ctrl.signal,
          });
        } finally {
          clearTimeout(timer);
        }
        if (res.status !== 429) break;
        attempt++;
        await new Promise(r => setTimeout(r, 1500 * attempt)); // 1.5s, 3s, 4.5s
      }

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        return { agent: agent.id, model, error: `Groq ${res.status}`, detail: errBody.slice(0, 100) };
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";

      // Parser le JSON
      let parsed;
      try {
        const match = text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(match ? match[0] : text);
      } catch {
        return { agent: agent.id, model, error: "JSON parse failed", raw: text.slice(0, 200) };
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
              const validatorPrompt = `Tu es un panel de 2 agents experts qui review un draft de post social :
- traffic-manager : SEO, CTAs, hashtags, conversions
- seo-content-writer : qualité rédactionnelle, lisibilité, mots-clés longue traîne

DRAFT À VALIDER :
Caption : """${draft.payload.caption || ""}"""
ImageUrl : ${draft.payload.imageUrl || "(aucune)"}
Channels : ${(draft.payload.channels || []).join(", ")}

CHECKLIST QUALITÉ :
1. CTA avec URL https://villamaryllis.com/* visible ?
2. 8-12 hashtags stratégiques (marque + lieu + audience) ?
3. Hook accrocheur en première ligne ?
4. Mention sensorielle (vue, son, ambiance) ?
5. Image .webp avec numéro 01-12 valide ?
6. Longueur 100-200 mots (ni trop court ni trop long) ?
7. Tone "vous" formel respecté ?

Retourne UNIQUEMENT un JSON :
{
  "score": 0-100,
  "verdict": "approve|needs_edits|reject",
  "traffic_manager": { "note": 0-10, "feedback": "1-2 phrases" },
  "seo_writer": { "note": 0-10, "feedback": "1-2 phrases" },
  "improved_caption": "version améliorée si needs_edits ou approve (sinon null)"
}`;

              const valRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify({
                  model: "meta-llama/llama-4-scout-17b-16e-instruct",
                  max_tokens: 800, temperature: 0.2,
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
                  // Si le validator a fourni une version améliorée, on l'utilise
                  if (parsed.improved_caption && parsed.verdict !== "reject") {
                    draft.payload.caption = parsed.improved_caption;
                  }
                }
              }
            } catch (e) { /* validation optionnelle, on continue sans */ }
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

      return { agent: agent.id, model, ok: true, inserted, updated, drafts: draftsCreated, actions: actions.length, context_size: history.length };
    } catch (e) {
      return { agent: agent.id, error: e.message };
    }
  }

  // ── Exécution PARALLÈLE — tous les agents simultanément ──────────────────
  // Chaque agent utilise un modèle différent → buckets de rate limit distincts
  const results = await Promise.all(targetAgents.map(agent => runAgent(agent)));

  const ok = results.filter(r => r.ok).length;
  const errors = results.filter(r => r.error).length;
  return json({ ok: true, agents_run: targetAgents.length, ok_count: ok, error_count: errors, results });
}
