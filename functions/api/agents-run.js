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

// ── Prompt template pour chaque agent ────────────────────────────────────────
function buildPrompt(agent) {
  return `Tu es l'agent "${agent.label}" (${agent.emoji}) d'Amaryllis Locations, plateforme de location de 7 propriétés premium en Martinique et Île-de-France (villamaryllis.com).

TON DOMAINE D'EXPERTISE : ${agent.focus}

FICHIERS CLÉS à analyser : ${agent.files_hint}

MISSION : Identifie les actions concrètes à réaliser dans ton domaine pour améliorer le site et les opérations d'Amaryllis Locations.

Propriétés : Villa Amaryllis (280€/nuit, 8 pers, 4.94★), Zandoli (220€, 5 pers, 4.5★), Villa Iguana (180€, 6 pers, 4.75★), Géko (150€, 4 pers, 4.83★), Mabouya (110€, 2 pers, 4.55★), Bellevue/Schœlcher (100€, 2 pers, 4.8★), Nogent-sur-Marne (85€, 2 pers, 4.95★).

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
  ]
}

Règles :
- Maximum 6 actions (les plus importantes seulement)
- Priorité "critique" = risque légal, sécurité, perte revenus significative
- Priorité "haute" = impact business direct mesurable
- "ext" pour effort = ressources externes nécessaires (photographe, agence, etc.)
- IDs format: ${agent.prefix}-001, ${agent.prefix}-002, etc.
- Retourne UNIQUEMENT le JSON, aucun texte avant ou après`;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return json({ error: "POST only" }, 405);

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "ANTHROPIC_API_KEY not configured in Cloudflare Pages env vars" }, 503);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  const body = await request.json().catch(() => ({}));
  // agents peut être "all" ou un tableau d'IDs d'agents spécifiques
  const targetAgents = body.agents === "all" || !body.agents
    ? AGENTS
    : AGENTS.filter(a => body.agents.includes(a.id));

  if (!targetAgents.length) return json({ error: "No matching agents found" }, 400);

  const results = [];
  const now = Math.floor(Date.now() / 1000);

  for (const agent of targetAgents) {
    try {
      // Appel API Anthropic (claude-haiku-4-5 pour économiser les tokens)
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 1024,
          messages: [{ role: "user", content: buildPrompt(agent) }],
        }),
      });

      if (!res.ok) {
        results.push({ agent: agent.id, error: `Anthropic API ${res.status}` });
        continue;
      }

      const data = await res.json();
      const text = data.content?.[0]?.text || "";

      // Parser le JSON retourné par Claude
      let parsed;
      try {
        // Extraire le JSON même si Claude a ajouté du texte
        const match = text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(match ? match[0] : text);
      } catch {
        results.push({ agent: agent.id, error: "JSON parse failed", raw: text.slice(0, 200) });
        continue;
      }

      const actions = parsed.actions || [];
      let inserted = 0, updated = 0;

      // Upsert dans D1
      for (const row of actions) {
        if (!row.id || !row.action) continue;
        const existing = await db.prepare("SELECT id, status FROM agent_actions WHERE id = ?").bind(row.id).first();
        if (existing) {
          // Préserver tous les statuts sauf backlog — ne jamais écraser fait/bloqué/a-planifier/en-cours
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

      results.push({ agent: agent.id, ok: true, inserted, updated, actions: actions.length });

    } catch (e) {
      results.push({ agent: agent.id, error: e.message });
    }
  }

  const ok = results.filter(r => r.ok).length;
  const errors = results.filter(r => r.error).length;
  return json({ ok: true, agents_run: targetAgents.length, ok_count: ok, error_count: errors, results });
}
