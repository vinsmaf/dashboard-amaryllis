// Cloudflare Pages Function — /api/agents-actions
// CRUD pour les actions des 17 agents Amaryllis
// Stockage D1 (binding: revenue_manager, table: agent_actions)

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

// ── DDL ─────────────────────────────────────────────────────────────────────
const DDL = `
CREATE TABLE IF NOT EXISTS agent_actions (
  id           TEXT PRIMARY KEY,
  agent        TEXT NOT NULL,
  agent_label  TEXT NOT NULL,
  agent_emoji  TEXT NOT NULL,
  category     TEXT NOT NULL,
  action       TEXT NOT NULL,
  priority     TEXT NOT NULL CHECK(priority IN ('critique','haute','moyenne','basse')),
  effort       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'backlog',
  notes        TEXT,
  last_analyzed INTEGER,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent  ON agent_actions(agent);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(status);
CREATE INDEX IF NOT EXISTS idx_agent_actions_prio   ON agent_actions(priority);

CREATE TABLE IF NOT EXISTS agent_memory (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  agent      TEXT NOT NULL,
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  expires_at INTEGER,
  UNIQUE(agent, key)
);
CREATE INDEX IF NOT EXISTS idx_memory_agent ON agent_memory(agent);
CREATE INDEX IF NOT EXISTS idx_memory_key   ON agent_memory(key);

CREATE TABLE IF NOT EXISTS orchestrator_runs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  trigger          TEXT NOT NULL,
  event_data       TEXT,
  status           TEXT DEFAULT 'running',
  summary          TEXT,
  decisions        TEXT,
  agents_consulted TEXT,
  duration_ms      INTEGER,
  created_at       INTEGER DEFAULT (unixepoch()),
  completed_at     INTEGER
);
`;

// Migration : supprime le CHECK constraint sur status (pour supporter 'a-planifier')
const MIGRATE_DDL = `
CREATE TABLE IF NOT EXISTS agent_actions_v2 (
  id           TEXT PRIMARY KEY,
  agent        TEXT NOT NULL,
  agent_label  TEXT NOT NULL,
  agent_emoji  TEXT NOT NULL,
  category     TEXT NOT NULL,
  action       TEXT NOT NULL,
  priority     TEXT NOT NULL CHECK(priority IN ('critique','haute','moyenne','basse')),
  effort       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'backlog',
  notes        TEXT,
  last_analyzed INTEGER,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
INSERT OR IGNORE INTO agent_actions_v2 SELECT * FROM agent_actions;
DROP TABLE agent_actions;
ALTER TABLE agent_actions_v2 RENAME TO agent_actions;
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent  ON agent_actions(agent);
CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(status);
CREATE INDEX IF NOT EXISTS idx_agent_actions_prio   ON agent_actions(priority);
`;

// ── Données seed (17 agents, ~70 actions) ───────────────────────────────────
const SEED = [
  // ── Juriste Compliance ──────────────────────────────────────────────────
  { id:"jur-001", agent:"juriste-compliance",         agent_label:"Juriste Compliance",   agent_emoji:"⚖️",  category:"legal",       priority:"critique", effort:"30min", action:"Ajouter mentions RGPD sur les formulaires contact et réservation (art. 13 RGPD)" },
  { id:"jur-002", agent:"juriste-compliance",         agent_label:"Juriste Compliance",   agent_emoji:"⚖️",  category:"legal",       priority:"critique", effort:"4h",    action:"Rédiger les CGV — manquantes alors que Stripe encaisse des paiements (contrat non formé)" },
  { id:"jur-003", agent:"juriste-compliance",         agent_label:"Juriste Compliance",   agent_emoji:"⚖️",  category:"legal",       priority:"haute",    effort:"1h",    action:"Corriger expiration consentement cookies (localStorage infini → 13 mois max CNIL)" },
  { id:"jur-004", agent:"juriste-compliance",         agent_label:"Juriste Compliance",   agent_emoji:"⚖️",  category:"securite",    priority:"haute",    effort:"30min", action:"Corriger CORS ouvert sur /api/contact (Access-Control-Allow-Origin: *)" },

  // ── Architecte Réseau ───────────────────────────────────────────────────
  { id:"arch-001", agent:"architecte-reseau",         agent_label:"Architecte Réseau",    agent_emoji:"🔌",  category:"securite",    priority:"critique", effort:"1h",    action:"Migrer URLs iCal Airbnb (tokens hardcodées dans Worker) vers wrangler secret put" },
  { id:"arch-002", agent:"architecte-reseau",         agent_label:"Architecte Réseau",    agent_emoji:"🔌",  category:"securite",    priority:"critique", effort:"30min", action:"Activer vérification HMAC Stripe webhook (bypassé si STRIPE_WEBHOOK_SECRET absent)" },
  { id:"arch-003", agent:"architecte-reseau",         agent_label:"Architecte Réseau",    agent_emoji:"🔌",  category:"securite",    priority:"haute",    effort:"30min", action:"Ajouter headers sécurité HTTP dans public/_headers (CSP, X-Frame-Options, X-Content-Type-Options)" },
  { id:"arch-004", agent:"architecte-reseau",         agent_label:"Architecte Réseau",    agent_emoji:"🔌",  category:"securite",    priority:"haute",    effort:"1h",    action:"Mettre en place rate limiting WAF Cloudflare sur /api/admin-auth (brute-force possible)" },
  { id:"arch-005", agent:"architecte-reseau",         agent_label:"Architecte Réseau",    agent_emoji:"🔌",  category:"securite",    priority:"haute",    effort:"30min", action:"Mettre en place rate limiting WAF Cloudflare sur /api/contact (anti-spam)" },
  { id:"arch-006", agent:"architecte-reseau",         agent_label:"Architecte Réseau",    agent_emoji:"🔌",  category:"technique",   priority:"moyenne",  effort:"30min", action:"Ajouter timeout AbortController sur fetchICS dans le Worker (risque cron timeout si Airbnb lent)" },

  // ── Webmaster ───────────────────────────────────────────────────────────
  { id:"web-001", agent:"webmaster",                  agent_label:"Webmaster",            agent_emoji:"🖥️", category:"technique",   priority:"critique", effort:"2h",    action:"Compléter secrets Cloudflare Pages manquants en production (OPENWEATHER_API_KEY, APIFY_TOKEN, secrets GA4)" },
  { id:"web-002", agent:"webmaster",                  agent_label:"Webmaster",            agent_emoji:"🖥️", category:"performance", priority:"haute",    effort:"30min", action:"Convertir hosts.jpg (1.8 MB JPEG brut) en WebP optimisé — économie directe 1.68 MB" },
  { id:"web-003", agent:"webmaster",                  agent_label:"Webmaster",            agent_emoji:"🖥️", category:"technique",   priority:"haute",    effort:"2h",    action:"Migrer email contact@villamaryllis.com vers domaine Resend vérifié (délivrabilité)" },
  { id:"web-004", agent:"webmaster",                  agent_label:"Webmaster",            agent_emoji:"🖥️", category:"securite",    priority:"haute",    effort:"1h",    action:"Lancer npm audit et traiter les vulnérabilités identifiées" },
  { id:"web-005", agent:"webmaster",                  agent_label:"Webmaster",            agent_emoji:"🖥️", category:"doc",         priority:"moyenne",  effort:"2h",    action:"Mettre à jour la documentation des endpoints (28 réels vs 7 documentés)" },

  // ── Traffic Manager ─────────────────────────────────────────────────────
  { id:"traf-001", agent:"traffic-manager",           agent_label:"Traffic Manager",      agent_emoji:"📈",  category:"performance", priority:"critique", effort:"30min", action:"Passer Stripe.js en chargement async (actuellement synchrone, bloque le parser HTML → nuit au LCP)" },
  { id:"traf-002", agent:"traffic-manager",           agent_label:"Traffic Manager",      agent_emoji:"📈",  category:"seo",         priority:"haute",    effort:"1h",    action:"Ajouter hreflang dans chaque fichier prérendu (actuellement seulement dans index.html racine)" },
  { id:"traf-003", agent:"traffic-manager",           agent_label:"Traffic Manager",      agent_emoji:"📈",  category:"seo",         priority:"haute",    effort:"4h",    action:"Créer page /sainte-luce-martinique (toutes les villas y sont — aucune page dédiée, P0 SEO)" },
  { id:"traf-004", agent:"traffic-manager",           agent_label:"Traffic Manager",      agent_emoji:"📈",  category:"seo",         priority:"haute",    effort:"4h",    action:"Créer page /reservation-directe-martinique (pilier conversion, ~1200 req/mois, quasi 0 concurrence)" },
  { id:"traf-005", agent:"traffic-manager",           agent_label:"Traffic Manager",      agent_emoji:"📈",  category:"seo",         priority:"haute",    effort:"1h",    action:"Configurer Google Search Console + soumettre sitemap.xml" },
  { id:"traf-006", agent:"traffic-manager",           agent_label:"Traffic Manager",      agent_emoji:"📈",  category:"ads",         priority:"haute",    effort:"2h",    action:"Lancer campagne Google Ads Brand (test 200€ — structure + annonces prêtes dans rapport)" },
  { id:"traf-007", agent:"traffic-manager",           agent_label:"Traffic Manager",      agent_emoji:"📈",  category:"seo",         priority:"haute",    effort:"1h",    action:"Corriger 11 meta titles > 60 caractères tronqués par Google (corrections prêtes dans rapport SEO)" },
  { id:"traf-008", agent:"traffic-manager",           agent_label:"Traffic Manager",      agent_emoji:"📈",  category:"seo",         priority:"moyenne",  effort:"4h",    action:"Créer page /meilleure-saison-martinique (top TOFU, 5000+ req/mois)" },

  // ── Data Analyst ────────────────────────────────────────────────────────
  { id:"data-001", agent:"data-analyst",              agent_label:"Data Analyst",         agent_emoji:"📊",  category:"tracking",    priority:"critique", effort:"1h",    action:"Corriger double-comptage event purchase GA4 (codé dans 2 composants — analytics corrompus)" },
  { id:"data-002", agent:"data-analyst",              agent_label:"Data Analyst",         agent_emoji:"📊",  category:"tracking",    priority:"critique", effort:"30min", action:"Activer ad_storage dans le consentement cookies (bloqué → tout remarketing impossible)" },
  { id:"data-003", agent:"data-analyst",              agent_label:"Data Analyst",         agent_emoji:"📊",  category:"tracking",    priority:"haute",    effort:"1h",    action:"Ajouter event view_item_list sur la homepage (CTR des fiches non mesurable actuellement)" },
  { id:"data-004", agent:"data-analyst",              agent_label:"Data Analyst",         agent_emoji:"📊",  category:"business",    priority:"haute",    effort:"4h",    action:"Réduire coût conciergerie Nogent (8 575€/an → T2 en cashflow négatif) ou renégocier" },
  { id:"data-005", agent:"data-analyst",              agent_label:"Data Analyst",         agent_emoji:"📊",  category:"business",    priority:"haute",    effort:"4h",    action:"Réduire dépendance Booking.com Nogent (79% OTA → risque de déréférencement)" },

  // ── Revenue Manager ─────────────────────────────────────────────────────
  { id:"rev-001", agent:"revenue-manager",            agent_label:"Revenue Manager",      agent_emoji:"💡",  category:"business",    priority:"critique", effort:"2h",    action:"Synchroniser rate plans Beds24/OTA avec la seed pricing du site (ADR réel 17-73% sous la seed)" },
  { id:"rev-002", agent:"revenue-manager",            agent_label:"Revenue Manager",      agent_emoji:"💡",  category:"business",    priority:"haute",    effort:"2h",    action:"Améliorer distribution Mabouya (RevPAR 23€, mois entiers à 0€ malgré jacuzzi privatif vue mer)" },
  { id:"rev-003", agent:"revenue-manager",            agent_label:"Revenue Manager",      agent_emoji:"💡",  category:"business",    priority:"haute",    effort:"4h",    action:"Stratégie basse saison Villa Amaryllis (occupation 33,4% — mai 13%, septembre 0%)" },
  { id:"rev-004", agent:"revenue-manager",            agent_label:"Revenue Manager",      agent_emoji:"💡",  category:"business",    priority:"haute",    effort:"2h",    action:"Optimiser séjours minimum par saison (levier RevPAR — grille détaillée dans rapport)" },

  // ── Développeur Multimédia ──────────────────────────────────────────────
  { id:"media-001", agent:"developpeur-multimedia",   agent_label:"Dév. Multimédia",      agent_emoji:"🎬",  category:"performance", priority:"haute",    effort:"1h",    action:"Recompresser 9 photos > 400KB (max: amaryllis/06.webp 780KB) — commandes cwebp -q 82 prêtes" },
  { id:"media-002", agent:"developpeur-multimedia",   agent_label:"Dév. Multimédia",      agent_emoji:"🎬",  category:"ux",          priority:"moyenne",  effort:"1h",    action:"Ajouter animation fadeIn entre photos de la lightbox (swap brutal actuellement)" },
  { id:"media-003", agent:"developpeur-multimedia",   agent_label:"Dév. Multimédia",      agent_emoji:"🎬",  category:"performance", priority:"basse",    effort:"4h",    action:"Implémenter srcset responsive images (variantes 480w / 800w / 1200w — absentes)" },
  { id:"media-004", agent:"developpeur-multimedia",   agent_label:"Dév. Multimédia",      agent_emoji:"🎬",  category:"business",    priority:"haute",    effort:"ext",   action:"Créer vidéos présentation propriétés 30-60s MP4/WebM — manque critique pour villa 280€/nuit" },

  // ── Photographe DA ──────────────────────────────────────────────────────
  { id:"photo-001", agent:"photographe-da",           agent_label:"Photographe DA",       agent_emoji:"📸",  category:"business",    priority:"critique", effort:"ext",   action:"Shooting photo nuit jacuzzi Mabouya (argument commercial principal — aucune photo de nuit)" },
  { id:"photo-002", agent:"photographe-da",           agent_label:"Photographe DA",       agent_emoji:"📸",  category:"performance", priority:"haute",    effort:"30min", action:"Recompresser photos Nogent (24-60KB trop léger → sous-dimensionné pour affichage plein écran)" },
  { id:"photo-003", agent:"photographe-da",           agent_label:"Photographe DA",       agent_emoji:"📸",  category:"seo",         priority:"haute",    effort:"1h",    action:"Vérifier OG images des pages guides (pointent vers Wikimedia — risque indisponibilité)" },
  { id:"photo-004", agent:"photographe-da",           agent_label:"Photographe DA",       agent_emoji:"📸",  category:"business",    priority:"haute",    effort:"ext",   action:"Shooting shot signature Rocher du Diamant pour Villa Iguana (hero photo manquant)" },

  // ── Webdesigner ─────────────────────────────────────────────────────────
  { id:"design-001", agent:"webdesigner",             agent_label:"Webdesigner",          agent_emoji:"🎨",  category:"bug",         priority:"haute",    effort:"30min", action:"Corriger --font-display dans tokens.css (pointe sur Jost, pas Playfair Display comme documenté)" },
  { id:"design-002", agent:"webdesigner",             agent_label:"Webdesigner",          agent_emoji:"🎨",  category:"bug",         priority:"haute",    effort:"1h",    action:"Corriger dark mode ReviewCard (texte illisible en mode sombre — 1 ligne de CSS)" },
  { id:"design-003", agent:"webdesigner",             agent_label:"Webdesigner",          agent_emoji:"🎨",  category:"ux",          priority:"haute",    effort:"2h",    action:"Ajouter RatingBadge sur les cards du listing (cohérence avec les fiches propriétés)" },
  { id:"design-004", agent:"webdesigner",             agent_label:"Webdesigner",          agent_emoji:"🎨",  category:"ux",          priority:"moyenne",  effort:"2h",    action:"Créer états d'erreur brandés Amaryllis (404, API timeout — actuellement pages génériques)" },
  { id:"design-005", agent:"webdesigner",             agent_label:"Webdesigner",          agent_emoji:"🎨",  category:"technique",   priority:"moyenne",  effort:"4h",    action:"Créer composants manquants : Toast, Modal, Skeleton, PropertyCard, SectionHeader" },

  // ── Chef Produit Web ────────────────────────────────────────────────────
  { id:"cpw-001", agent:"chef-produit-web",           agent_label:"Chef Produit Web",     agent_emoji:"🏗️", category:"ux",          priority:"critique", effort:"4h",    action:"Créer email de confirmation automatique au voyageur après paiement Stripe (absent actuellement)" },
  { id:"cpw-002", agent:"chef-produit-web",           agent_label:"Chef Produit Web",     agent_emoji:"🏗️", category:"conversion",  priority:"haute",    effort:"2h",    action:"Ajouter widget comparatif prix direct vs Airbnb sur les fiches propriétés" },
  { id:"cpw-003", agent:"chef-produit-web",           agent_label:"Chef Produit Web",     agent_emoji:"🏗️", category:"ux",          priority:"haute",    effort:"30min", action:"Afficher message explicatif pour Villa Iguana désactivée (déroute les visiteurs)" },
  { id:"cpw-004", agent:"chef-produit-web",           agent_label:"Chef Produit Web",     agent_emoji:"🏗️", category:"seo",         priority:"haute",    effort:"2h",    action:"Ajouter JSON-LD VacationRental dans les pages prérendues (client-side seulement actuellement)" },

  // ── Community Manager ───────────────────────────────────────────────────
  { id:"cm-001", agent:"community-manager",           agent_label:"Community Manager",    agent_emoji:"📱",  category:"business",    priority:"haute",    effort:"30min", action:"Activer liens réseaux sociaux dans le footer du site (Instagram / Facebook absents)" },
  { id:"cm-002", agent:"community-manager",           agent_label:"Community Manager",    agent_emoji:"📱",  category:"content",     priority:"haute",    effort:"2h",    action:"Créer calendrier éditorial Instagram juin 2026 (plan complet + 5 posts rédigés dans rapport)" },
  { id:"cm-003", agent:"community-manager",           agent_label:"Community Manager",    agent_emoji:"📱",  category:"content",     priority:"moyenne",  effort:"2h",    action:"Mettre en place process collecte photos voyageurs UGC via email post-séjour" },
  { id:"cm-004", agent:"community-manager",           agent_label:"Community Manager",    agent_emoji:"📱",  category:"content",     priority:"moyenne",  effort:"4h",    action:"Créer 12 templates Stories Instagram (rotation mensuelle)" },
  { id:"cm-005", agent:"community-manager",           agent_label:"Community Manager",    agent_emoji:"📱",  category:"content",     priority:"basse",    effort:"4h",    action:"Définir stratégie TikTok / Reels Martinique (format vertical piscine / vue mer)" },

  // ── Commercial / Publicité ──────────────────────────────────────────────
  { id:"pub-001", agent:"commercial-publicite",       agent_label:"Commercial / Pub",     agent_emoji:"💼",  category:"conversion",  priority:"haute",    effort:"1h",    action:"Mettre en avant remises durée (-5%/-10%/-15%) dans les descriptions propriétés (codé mais invisible)" },
  { id:"pub-002", agent:"commercial-publicite",       agent_label:"Commercial / Pub",     agent_emoji:"💼",  category:"conversion",  priority:"haute",    effort:"1h",    action:"Réécrire description Iguana : piscine eau salée = 'nager dans la mer' (argument rare non exploité)" },
  { id:"pub-003", agent:"commercial-publicite",       agent_label:"Commercial / Pub",     agent_emoji:"💼",  category:"bug",         priority:"haute",    effort:"30min", action:"Afficher rating Bellevue (null dans le code → badge absent → freine la conversion)" },
  { id:"pub-004", agent:"commercial-publicite",       agent_label:"Commercial / Pub",     agent_emoji:"💼",  category:"ads",         priority:"haute",    effort:"4h",    action:"Lancer campagnes Google Ads (10 RSA + 5 Meta Ads rédigés dans rapport — budget 4500€/an)" },
  { id:"pub-005", agent:"commercial-publicite",       agent_label:"Commercial / Pub",     agent_emoji:"💼",  category:"business",    priority:"moyenne",  effort:"4h",    action:"Créer page /seminaires dédiée B2B (offre packagée 4000€ HT / 3 nuits Villa Amaryllis)" },
  { id:"pub-006", agent:"commercial-publicite",       agent_label:"Commercial / Pub",     agent_emoji:"💼",  category:"conversion",  priority:"moyenne",  effort:"1h",    action:"Afficher citation James K. sur toutes les fiches (actuellement sur /avis uniquement)" },

  // ── CRM Manager ─────────────────────────────────────────────────────────
  { id:"crm-001", agent:"crm-manager",                agent_label:"CRM Manager",          agent_emoji:"📧",  category:"crm",         priority:"critique", effort:"4h",    action:"Persister contacts formulaire en base (actuellement perdus si non traités manuellement)" },
  { id:"crm-002", agent:"crm-manager",                agent_label:"CRM Manager",          agent_emoji:"📧",  category:"crm",         priority:"haute",    effort:"2h",    action:"Créer séquence email post-séjour J+3 (demande avis Google + fidélisation)" },
  { id:"crm-003", agent:"crm-manager",                agent_label:"CRM Manager",          agent_emoji:"📧",  category:"crm",         priority:"haute",    effort:"2h",    action:"Créer séquence email pré-arrivée J-7 (conseils locaux + bons plans + contacts utiles)" },
  { id:"crm-004", agent:"crm-manager",                agent_label:"CRM Manager",          agent_emoji:"📧",  category:"crm",         priority:"moyenne",  effort:"2h",    action:"Créer segments Brevo (9 segments définis dans rapport : prospect / voyageur / fidèle / perdu…)" },
  { id:"crm-005", agent:"crm-manager",                agent_label:"CRM Manager",          agent_emoji:"📧",  category:"crm",         priority:"basse",    effort:"8h",    action:"Lancer programme fidélité Amaryllis Club 4 niveaux (ROI estimé 35× pour 480€/an)" },

  // ── Consultant e-Business ───────────────────────────────────────────────
  { id:"ebiz-001", agent:"consultant-ebusiness",      agent_label:"Consultant e-biz",     agent_emoji:"🚀",  category:"conversion",  priority:"haute",    effort:"4h",    action:"Ajouter upsells dans le tunnel réservation (chef à domicile, transfert, courses) — potentiel +390€/mois" },
  { id:"ebiz-002", agent:"consultant-ebusiness",      agent_label:"Consultant e-biz",     agent_emoji:"🚀",  category:"business",    priority:"haute",    effort:"2h",    action:"Email post-séjour → réduction dépendance OTA (objectif 20% → 45% réservations directes)" },
  { id:"ebiz-003", agent:"consultant-ebusiness",      agent_label:"Consultant e-biz",     agent_emoji:"🚀",  category:"business",    priority:"haute",    effort:"4h",    action:"Créer offre packagée séminaires B2B Amaryllis (potentiel +1200€/mois sur 6 séminaires/an)" },
  { id:"ebiz-004", agent:"consultant-ebusiness",      agent_label:"Consultant e-biz",     agent_emoji:"🚀",  category:"conversion",  priority:"haute",    effort:"4h",    action:"Créer comparateur prix direct/Airbnb avec calcul économie en temps réel sur la homepage" },

  // ── Responsable Service Client ──────────────────────────────────────────
  { id:"sc-001", agent:"responsable-service-client",  agent_label:"Service Client",       agent_emoji:"🤝",  category:"bug",         priority:"critique", effort:"30min", action:"Corriger incohérence check-in : 16h dans la FAQ vs 17h dans les fiches propriétés" },
  { id:"sc-002", agent:"responsable-service-client",  agent_label:"Service Client",       agent_emoji:"🤝",  category:"crm",         priority:"haute",    effort:"2h",    action:"Créer email automatique mi-séjour J+3 (satisfaction + services additionnels)" },
  { id:"sc-003", agent:"responsable-service-client",  agent_label:"Service Client",       agent_emoji:"🤝",  category:"ops",         priority:"moyenne",  effort:"4h",    action:"Digitaliser les états des lieux (application photo + signature horodatée)" },
  { id:"sc-004", agent:"responsable-service-client",  agent_label:"Service Client",       agent_emoji:"🤝",  category:"ops",         priority:"moyenne",  effort:"2h",    action:"Définir SLA réponse < 1h en haute saison (processus + outils + escalade)" },

  // ── Responsable Logistique ──────────────────────────────────────────────
  { id:"log-001", agent:"responsable-logistique",     agent_label:"Resp. Logistique",     agent_emoji:"🏠",  category:"ops",         priority:"haute",    effort:"2h",    action:"Digitaliser carnet contacts prestataires (ménage, plombier, électricien, jardinier par propriété)" },
  { id:"log-002", agent:"responsable-logistique",     agent_label:"Resp. Logistique",     agent_emoji:"🏠",  category:"ops",         priority:"haute",    effort:"4h",    action:"Rédiger guide procédures ménage prestataire (checklist par propriété, standards Amaryllis)" },
  { id:"log-003", agent:"responsable-logistique",     agent_label:"Resp. Logistique",     agent_emoji:"🏠",  category:"ops",         priority:"moyenne",  effort:"4h",    action:"Mettre en place système de suivi des interventions (Notion / Google Sheets)" },
  { id:"log-004", agent:"responsable-logistique",     agent_label:"Resp. Logistique",     agent_emoji:"🏠",  category:"ops",         priority:"moyenne",  effort:"2h",    action:"Créer stock tracker partagé avec niveaux min/max par propriété" },
];

// ── Handler principal ────────────────────────────────────────────────────────
export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  // sec : backlog agents (CRUD D1) → admin (Bearer) OU secret partagé (script CLI).
  const _url0 = new URL(request.url);
  const _secretOk = env.POSTSTAY_SECRET && _url0.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: _adminOk } = await verifyBearer(request, env);
  if (!_secretOk && !_adminOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  const url = new URL(request.url);
  const method = request.method;

  // ── GET — liste des actions (filtrable) ou mémoires ─────────────────────
  if (method === "GET") {
    const table    = url.searchParams.get("table");
    const agent    = url.searchParams.get("agent");

    // GET ?table=memory — lecture des mémoires agents
    if (table === "memory") {
      try {
        let q = "SELECT * FROM agent_memory WHERE 1=1";
        const params = [];
        if (agent) { q += " AND agent = ?"; params.push(agent); }
        q += " ORDER BY created_at DESC";
        const { results } = await db.prepare(q).bind(...params).all();
        return json({ memories: results, total: results.length });
      } catch (e) {
        return json({ memories: [], total: 0, error: e.message });
      }
    }

    // GET ?table=outcomes — attribution causale mesurée
    if (table === "outcomes") {
      try {
        let q = "SELECT * FROM action_outcomes WHERE 1=1";
        const params = [];
        if (agent) { q += " AND agent = ?"; params.push(agent); }
        q += " ORDER BY completed_at DESC";
        const { results } = await db.prepare(q).bind(...params).all();
        return json({ outcomes: results, total: results.length });
      } catch (e) {
        return json({ outcomes: [], total: 0, error: e.message });
      }
    }

    // GET ?table=llm_outputs — journal des sorties LLM (prompt-004)
    if (table === "llm_outputs") {
      try {
        await db.prepare(`CREATE TABLE IF NOT EXISTS llm_outputs (
          id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT, tier TEXT, provider TEXT, model TEXT,
          prompt TEXT, output TEXT, output_len INTEGER, attempts INTEGER,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()))`).run();
        let q = "SELECT id, source, tier, provider, model, output_len, attempts, created_at, substr(prompt,1,200) AS prompt_preview, substr(output,1,400) AS output_preview FROM llm_outputs WHERE 1=1";
        const params = [];
        if (agent) { q += " AND source = ?"; params.push(`agent:${agent}`); }
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10) || 100, 500);
        q += ` ORDER BY id DESC LIMIT ${limit}`;
        const { results } = await db.prepare(q).bind(...params).all();
        return json({ logs: results, total: results.length });
      } catch (e) {
        return json({ logs: [], total: 0, error: e.message });
      }
    }

    const status   = url.searchParams.get("status");
    const priority = url.searchParams.get("priority");
    const category = url.searchParams.get("category");

    let q = "SELECT * FROM agent_actions WHERE 1=1";
    const params = [];
    if (agent)    { q += " AND agent = ?";    params.push(agent); }
    if (status)   { q += " AND status = ?";   params.push(status); }
    if (priority) { q += " AND priority = ?"; params.push(priority); }
    if (category) { q += " AND category = ?"; params.push(category); }
    q += " ORDER BY CASE priority WHEN 'critique' THEN 1 WHEN 'haute' THEN 2 WHEN 'moyenne' THEN 3 ELSE 4 END, agent";

    try {
      const { results } = await db.prepare(q).bind(...params).all();
      // Stats par colonne
      const stats = { backlog: 0, "en-cours": 0, fait: 0, "bloqué": 0, "a-planifier": 0 };
      results.forEach(r => { if (r.status in stats) stats[r.status]++; else stats[r.status] = (stats[r.status] || 0) + 1; });
      return json({ actions: results, stats, total: results.length });
    } catch (e) {
      // Table inexistante → init automatique
      if (e.message?.includes("no such table")) {
        return json({ actions: [], stats: { backlog: 0, "en-cours": 0, fait: 0, "bloqué": 0, "a-planifier": 0 }, total: 0, hint: "Run POST ?action=init to initialize" });
      }
      return json({ error: e.message }, 500);
    }
  }

  // ── PATCH — mettre à jour le statut d'une action ─────────────────────────
  if (method === "PATCH") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "id is required" }, 400);

    const body = await request.json().catch(() => ({}));
    const fields = [];
    const params = [];

    if (body.status !== undefined) {
      const valid = ["backlog","en-cours","fait","bloqué","a-planifier"];
      if (!valid.includes(body.status)) return json({ error: "Invalid status" }, 400);
      fields.push("status = ?"); params.push(body.status);
    }
    if (body.notes  !== undefined) { fields.push("notes = ?");  params.push(body.notes); }
    if (body.action !== undefined) { fields.push("action = ?"); params.push(body.action); }
    if (body.priority !== undefined) { fields.push("priority = ?"); params.push(body.priority); }
    if (body.category !== undefined) { fields.push("category = ?"); params.push(body.category); }
    if (body.effort   !== undefined) { fields.push("effort = ?");   params.push(body.effort); }
    if (body.risk     !== undefined) { fields.push("risk = ?");     params.push(body.risk); }
    if (!fields.length) return json({ error: "Nothing to update" }, 400);

    fields.push("updated_at = ?"); params.push(Math.floor(Date.now() / 1000));
    params.push(id);

    try {
      await db.prepare(`UPDATE agent_actions SET ${fields.join(", ")} WHERE id = ?`).bind(...params).run();

      // Attribution causale : quand une action passe en "fait", on note la date
      // de complétion + l'agent. La mesure d'impact est faite plus tard par
      // agents-run (passe de mesure ~14j après, via la série kpi_history).
      if (body.status === "fait") {
        try {
          const row = await db.prepare("SELECT agent FROM agent_actions WHERE id = ?").bind(id).first();
          await db.prepare(`
            CREATE TABLE IF NOT EXISTS action_outcomes (
              action_id    TEXT PRIMARY KEY,
              agent        TEXT NOT NULL,
              completed_at INTEGER NOT NULL,
              measured_at  INTEGER,
              impact_label TEXT,
              detail_json  TEXT
            )
          `).run();
          await db.prepare(`
            INSERT INTO action_outcomes (action_id, agent, completed_at) VALUES (?,?,?)
            ON CONFLICT(action_id) DO UPDATE SET completed_at=excluded.completed_at, measured_at=NULL, impact_label=NULL, detail_json=NULL
          `).bind(id, row?.agent || "?", Math.floor(Date.now() / 1000)).run();
        } catch (_) { /* best-effort, ne bloque jamais le PATCH */ }
      }

      return json({ ok: true, id });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── POST — init table OU insérer de nouvelles actions depuis une analyse ─
  if (method === "POST") {
    const action = url.searchParams.get("action") || "init";
    const body = await request.json().catch(() => ({}));

    // ── POST ?action=migrate — supprimer CHECK constraint status ─────────
    if (action === "migrate") {
      try {
        for (const stmt of MIGRATE_DDL.split(";").map(s => s.trim()).filter(Boolean)) {
          await db.prepare(stmt).run();
        }
        // Colonne risk (triage) — idempotent, D1 n'a pas ADD COLUMN IF NOT EXISTS
        try { await db.prepare("ALTER TABLE agent_actions ADD COLUMN risk TEXT DEFAULT 'review'").run(); } catch (_) { /* déjà présente */ }
        return json({ ok: true, message: "Migration terminée — CHECK constraint sur status supprimé, 'a-planifier' supporté" });
      } catch (e) {
        return json({ ok: false, error: e.message }, 500);
      }
    }

    // ── POST ?action=init — créer la table + seeder ──────────────────────
    if (action === "init") {
      try {
        // DDL
        for (const stmt of DDL.split(";").map(s => s.trim()).filter(Boolean)) {
          await db.prepare(stmt).run();
        }
        // Migration idempotente : colonne risk (triage) — D1 n'a pas ADD COLUMN IF NOT EXISTS
        try { await db.prepare("ALTER TABLE agent_actions ADD COLUMN risk TEXT DEFAULT 'review'").run(); } catch (_) { /* déjà présente */ }
        // Seed (INSERT OR IGNORE pour idempotence)
        const now = Math.floor(Date.now() / 1000);
        for (const row of SEED) {
          await db.prepare(`
            INSERT OR IGNORE INTO agent_actions
              (id, agent, agent_label, agent_emoji, category, action, priority, effort, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'backlog', ?, ?)
          `).bind(row.id, row.agent, row.agent_label, row.agent_emoji, row.category, row.action, row.priority, row.effort, now, now).run();
        }
        return json({ ok: true, seeded: SEED.length, message: `Table agent_actions créée et seedée avec ${SEED.length} actions` });
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    // ── POST ?action=upsert — mise à jour par un agent (analyse autonome) ─
    if (action === "upsert") {
      const { actions: incoming = [] } = body;
      if (!Array.isArray(incoming) || !incoming.length) return json({ error: "actions[] is required" }, 400);
      // Migration idempotente : garantit la colonne risk avant tout upsert (D1 n'a pas ADD COLUMN IF NOT EXISTS)
      try { await db.prepare("ALTER TABLE agent_actions ADD COLUMN risk TEXT DEFAULT 'review'").run(); } catch (_) { /* déjà présente */ }
      const now = Math.floor(Date.now() / 1000);
      let inserted = 0, updated = 0;
      for (const row of incoming) {
        if (!row.id || !row.agent || !row.action) continue;
        const existing = await db.prepare("SELECT id FROM agent_actions WHERE id = ?").bind(row.id).first();
        if (existing) {
          // Mettre à jour action + priorité + effort + last_analyzed (ne pas écraser status si déjà traité)
          await db.prepare(`
            UPDATE agent_actions SET action=?, priority=?, effort=?, risk=?, last_analyzed=?, updated_at=?
            WHERE id=?
          `).bind(row.action, row.priority || "moyenne", row.effort || "?", row.risk || "review", now, now, row.id).run();
          updated++;
        } else {
          await db.prepare(`
            INSERT INTO agent_actions (id, agent, agent_label, agent_emoji, category, action, priority, effort, status, risk, last_analyzed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'backlog', ?, ?, ?, ?)
          `).bind(row.id, row.agent, row.agent_label || row.agent, row.agent_emoji || "🤖", row.category || "autre", row.action, row.priority || "moyenne", row.effort || "?", row.risk || "review", now, now, now).run();
          inserted++;
        }
      }
      return json({ ok: true, inserted, updated });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  }

  return json({ error: "Method not allowed" }, 405);
}
