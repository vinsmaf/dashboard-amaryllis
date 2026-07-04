// Cloudflare Pages Function — POST /api/agents-run
// Déclenche l'analyse autonome des agents via l'API Anthropic
// Appelle Claude claude-haiku-4-5 pour chaque agent, met à jour D1 (agent_actions)
// Utilisé par :
//   - Le bouton "Relancer l'analyse" dans l'admin
//   - Le Worker cron quotidien (workers/ical-sync/index.js) à 9h UTC

import { getSkillForAgent } from "./_skills.js";
import { callLLM } from "./_llm.js";
import { triageAction } from "./_triage.js";
import { maybeRefresh } from "./ai-ops.js";
import { EQUIP_RULES_TEXT } from "./_biens.js"; // #8 source unique des faits
import { ragBlock } from "./_rag.js"; // #2 RAG — grounding sur les vraies données
import { clog, timer } from "./_log.js";

// Agents "content" qui bénéficient du grounding sur les vraies données (avis/guides/drafts).
const RAG_AGENTS = new Set(["community-manager", "seo-content-writer", "voyageur-research", "crm-manager", "commercial-publicite"]);

// ── Playbook revenue management / hospitality (agents revenue & marketing) ──
// Miroir condensé de ~/.claude/memory/PLAYBOOK-LOCATIF.md (cerveau partagé). Une CF Function
// ne lit pas ~/.claude au runtime → on embarque l'extrait (même pattern que FISCAL_CONTEXT).
// ⚠️ MIROIR : si PLAYBOOK-LOCATIF.md change matériellement, mettre à jour ce bloc + redéployer.
const PLAYBOOK_AGENTS = new Set([
  "revenue-manager", "traffic-manager", "crm-manager", "consultant-ebusiness",
  "growth-experiments", "seo-local", "seo-content-writer", "community-manager",
  "voyageur-research", "data-analyst", "chef-produit-web", "responsable-service-client",
  "commercial-publicite", "responsable-logistique", "veille-concurrentielle",
]);
const PLAYBOOK_DIGEST = `
═══════════════════════════════════════════════════════════════
📘 PLAYBOOK REVENUE MANAGEMENT & HOSPITALITY (applique quand pertinent à ton domaine)
═══════════════════════════════════════════════════════════════
PRICING & YIELD
• RM-01 Last-room-value : haut de bande seulement quand rareté réelle (Amaryllis 8p sans substitut) ; Mabouya/Bellevue (2p) = bas de bande pour remplir.
• RM-02 Lead-time : déc-avr = TENIR (ouvrir haut tôt, pas de décote avant J-14) ; juin-oct = DÉMARQUER par paliers.
• RM-03 Le NET encaissé décide, pas l'occupation brute : piloter le NET RevPAR par bien × canal.
• RM-04 LOS : resserrer min-stay sur pics confirmés (pickup J-45) ; orphan-night → remplir en DIRECT avant OTA.
• RM-05 Displacement Iguana : à chaque renouvellement de bail, comparer loyer net garanti vs RevPAR court terme net.
DÉSINTERMÉDIATION & DIRECT (priorité #1)
• RM-06 Billboard effect : être #1 sur son nom (Amaryllis/Géko/Bellevue ≥4,8) pour récupérer la résa amorcée par l'OTA.
• RM-07 Le direct gagne par les frais OTA évités, JAMAIS par un prix cassé : prix hôte égal en vitrine, afficher l'économie ~14%.
• RM-08 CAC ≤ 50% de la commission Booking nette évitée, par résa (pas par clic) ; budget sur le non-brand des gros tickets.
• RM-09 OTA pour le creux, direct pour le pic.
• RM-10 LTV : capturer email+tél de 100% des voyageurs (OTA inclus) → repeat direct = 0% commission.
• RM-11 Bouche-à-oreille diaspora : parrainage auto-financé (coûte moins que la commission évitée).
CONVERSION & PERSUASION
• RM-12 Chiffrer le delta de frais vs OTA, jamais casser l'ADR ; micro-étapes sur petits tickets.
• RM-13 Preuve sociale réelle, attribuée, datée, par bien (note <4,7 → mener par le verbatim, pas le chiffre).
• RM-14 Rareté HONNÊTE branchée sur le calendrier réel (D1/Beds24), zéro faux compteur.
• RM-15 A/B test seulement si ≥~30-50 résas/cycle ; métrique = résa confirmée Stripe→D1.
• RM-27 « C'est trop cher » = déficit de VALEUR perçue, pas prix trop haut. Ne JAMAIS baisser d'emblée (on se décrédibilise) → demander « trop cher par rapport à quoi ? » : concurrent → argumenter la valeur (note, piscine, conciergerie) ; budget → ajuster le PÉRIMÈTRE (durée/bien plus petit/saison creuse), jamais le tarif seul. Tarif et offre bougent ENSEMBLE.
EXPÉRIENCE & FIDÉLISATION
• RM-16 Service (attendu) vs hospitalité (fidélise) : 1 geste humain perso par arrivée ; prioriser notes planchers (Mabouya, Zandoli).
• RM-17 Router les avis vers Google (l'avis Airbnb nourrit Airbnb).
• RM-18 Récupération : accuser <15min, résoudre <2h, compenser après ; geste calibré sur l'irritation, pas le prix.
• RM-19 Échelle de fidélité multi-biens (Mabouya→Géko→Amaryllis) en direct.
DISTRIBUTION & POSITIONNEMENT
• RM-20 Amaryllis (4,94) en produit-phare ; ruissellement vers alternatives du même besoin (jamais Iguana/Nogent).
• RM-21 Grille produit-segment : 1 segment dominant par bien ; diaspora = segment direct n°1.
• RM-22 Cluster Sainte-Luce = moat (groupe multi-biens en direct, relogement « selon dispo »).
SYSTÈMES & SCALABILITÉ
• RM-23 Conciergerie = actif, pas emploi : éliminer→automatiser→déléguer (modèle Nogent/Nesrine).
• RM-24 Checklist + photos horodatées bloquent le calendrier ; standard uniforme tous biens.
• RM-25 Automatiser le prévisible, brouillon-puis-validation sur l'amirale ; un PRIX ne part JAMAIS en auto.
• RM-26 Runbooks de crise pré-écrits (cyclone, double-booking, no-show, Stripe).
GARDE-FOUS : Revenue Manager ADVISORY ONLY — ne change jamais prix/min-stay/canal seul. Iguana bookable:false exclue. Nogent = marché distinct. Jamais de faux compteur (Stripe LIVE).
`;

// ── Spécialistes fiscaux (ADR-BRAIN-003) : grounding sur le contexte fiscal UNIFIÉ ──
// FISCAL_CONTEXT = miroir condensé de ~/.claude/memory/FISCAL.md (cerveau fiscal partagé
// des 2 cerveaux). Une CF Function ne lit pas ~/.claude au runtime → on embarque l'extrait.
// ⚠️ MIROIR : si FISCAL.md change matériellement, mettre à jour ce bloc + redéployer.
const FISCAL_AGENTS = new Set(["fiscaliste", "controleur-fiscal", "comptable", "notaire-assurance"]);
const FISCAL_CONTEXT = `
═══════════════════════════════════════════════════════════════
🧾 CONTEXTE FISCAL UNIFIÉ DE VINCENT (un seul contribuable — locatif + patrimoine)
═══════════════════════════════════════════════════════════════
STATUT : Loueur Meublé sur 7 biens (6 Martinique Sainte-Luce/Schœlcher + 1 Nogent IDF). Activité BIC.
Revenus locatifs 2025 : ~160 k€ brut / ~77 k€ net. Résidence fiscale Martinique (DOM → DMTO, dispositifs ultramarins).
Aussi : crypto (depuis 2018), actions, épargne salariale (PEE/PERCO Vivendi, PEG Altice), AV — détail = côté patrimoine.

ÉCHÉANCES FISCALES DATÉES (FIXES) :
• Régularisation DGFiP 2023 : 2 319 € (IR 1 439 + PS 825 + ESSOC 55) — avis complémentaire, paiement ~01/09/2026.
• Déclarations meublé de tourisme : 🔴 URGENT, jusqu'à 12 500 € d'enjeu. Déclaration mairie = prérequis.
• Passage RÉGIME RÉEL LMP — déc. 2026 (crédit Résidence soldé) → dossier amortissement (actes notariés Résidence +
  coût construction + inventaire mobilier + factures travaux) à remettre au comptable. Amortissement par composants = levier #1.
• PEG Altice : exonération IR complète 10/2029.

STRATÉGIE : conformité d'abord (DGFiP + meublé tourisme), PUIS optimisation régime réel (amortissements). Structures
SCI/holding évoquées (non décidées). Projet d'enfant + PACS/mariage Céline → impact futur quotient familial/transmission.

🚨 RÈGLES : tu es ADVISORY — tu prépares l'analyse, VINCENT décide et signe. Aucune déclaration/paiement déclenché.
Ne présente JAMAIS un conseil comme une certitude → termine par « à valider avec le comptable/notaire réel ».
Reste factuel : ne cite pas un chiffre que tu n'as pas ici ; pointe vers la pièce manquante.
═══════════════════════════════════════════════════════════════
`;

// ── Voix du Voyageur — insights avis clients (accès PERMANENT, pas juste via RAG) ──
// Demande explicite de Vincent (2026-07-04) : les agents en contact avec l'expérience
// voyageur doivent avoir ce rapport TOUJOURS en contexte, pas seulement si le RAG le
// retrouve par hasard sémantique. Digest condensé du rapport complet, à tenir à jour
// manuellement à chaque nouveau rapport voyageur-research (docs/crm/rapport-voix-voyageur-*.md).
// ⚠️ MIROIR : si un nouveau rapport est produit, mettre à jour ce bloc + redéployer.
const VOYAGEUR_INSIGHTS_AGENTS = new Set([
  "voyageur-research", "responsable-service-client", "responsable-logistique",
  "revenue-manager", "community-manager",
]);
const VOYAGEUR_INSIGHTS_DIGEST = `
═══════════════════════════════════════════════════════════════
🗣️ VOIX DU VOYAGEUR — insights avis clients (rapport baseline 2026-07, 116 avis codés)
═══════════════════════════════════════════════════════════════
Corpus : 116 avis Airbnb (5 biens, Iguana/Nogent hors périmètre), note moy. 4,78/5, historique
2018-2026 (PAS un vrai Q1 — le vrai Q1 2026 n'a que 10 avis, trop peu pour conclure).
3 INSIGHTS :
• Wifi/connectivité = friction transversale répétée sur Zandoli ET Mabouya malgré notes 4-5★.
• Schœlcher : agencement salon (canapé en trop) cité par 2 avis indépendants — pattern le plus net du corpus.
• Amaryllis (premium 280€/nuit) : 3 frictions concentrées dans 1 avis (domotique sans notice, piscine jugée petite, vaisselle/linge sous-dimensionnés vs capacité 8p).
5 RECOS : (1) vérifier couverture wifi Zandoli+Mabouya (2) Schœlcher retirer un canapé (3) livret domotique Amaryllis (4) vérifier stock vaisselle/linge Amaryllis vs 8p (5) brise-vue jacuzzi Mabouya.
Rapport complet : docs/crm/rapport-voix-voyageur-2026-07.md (onglet admin Avis).
═══════════════════════════════════════════════════════════════
`;

// ── Profil humain de Vincent (TOUS les agents) ──────────────────────────────
// Miroir condensé de ~/patrimoine-dashboard/src/data/profilVincent.js + VINCENT.md (2026-06-29).
// Une CF Function ne lit pas les fichiers locaux au runtime → miroir embarqué (même pattern que PLAYBOOK/FISCAL).
// ⚠️ MIROIR : si VINCENT.md change matériellement, mettre à jour ce bloc + redéployer les 2 projets.
const VINCENT_PROFILE_DIGEST = `
═══════════════════════════════════════════════════════════════
👤 QUI EST VINCENT (contexte humain — personnalise tes recos, ADVISORY)
═══════════════════════════════════════════════════════════════
• IDENTITÉ : Entrepreneur martiniquais, né 1983 (~42 ans). Ingénieur info (Supinfo), ~17 ans télécom (PDV 2022). Créole/français/anglais. Self-made, a coaché ~60 personnes en immo/finance → ne pas vulgariser à l'excès.
• LIBRE : Indépendance financière DÉJÀ ATTEINTE. Revenus passifs > cible de vie. N'optimise plus pour le cashflow de survie.
• CAP STRATÉGIQUE : SÉCURISER (pas accumuler) — robustesse, transmission, éviter l'IRRÉVERSIBLE avant le rendement. ⚠️ Enjeux transverses (concentration Martinique · LMP réel · custody crypto) ont chacun leur agent-référent → ne les ré-émet pas en générique ; aborde-les uniquement sous ton angle métier exclusif.
• VISION LOCATIF (horizon) : (1) Marketplace conciergerie B2B — accueillir des biens tiers sur villamaryllis.com, modèle OTA locale, Vincent = distribution/service. (2) Résidence hôtelière/para-hôtelière — Résidence Amaryllis classée (agrément préfectoral + ≥3 services = TVA déductible + image établissement). Toute décision produit/tech doit être compatible avec ces 2 horizons.
• MOTEUR DE VIE : Délégation TOTALE d'ici 2028. Aujourd'hui seul pilote par nécessité, pas par choix. Test ultime : « ça tourne sans lui ? » + « ça libère du temps pour sa famille et voyager ? ». Liberté de temps > rendement.
• FAMILLE : Concubinage avec Céline (même métier). PACS/mariage en projet. Enfants en projet (INTIME — ne jamais l'évoquer). Succession : concubinage → 60% droits = levier fiscal PACS prioritaire.
• FISCAL : TMI 30%. NON IFI. Micro-BIC → réel LMP deadline déc. 2026. Déclarations meublé tourisme 🔴 URGENT (jusqu'à 12 500 €).
• RISQUE : Refuse perte définitive du socle, levier, opacité. Tolère la volatilité sur ce qu'il maîtrise. Ligne rouge = l'IRRÉVERSIBLE, pas les variations.
⚠️ GARDE-FOUS : ADVISORY ONLY (tu analyses, Vincent décide/exécute). Projet d'enfant = INTIME. Ne redemande pas ce qui est déjà ci-dessus : raisonne avec.
═══════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════
📊 PERFORMANCE LOCATIF H1 2026 (Jan–Juin · calculé 30/06/2026 · source SEED/HIST)
⚠️ MIROIR de profilVincent.js#METRICS_H1_2026_DIGEST — màj si données changent matériellement.
═══════════════════════════════════════════════════════════════
REVENUS BRUTS H1 : 99 977 € (+8,9 % vs H1 2025 = 91 771 €) · CF NET H1 : 63 554 € (~10 592 €/mois).
SCORECARD PAR BIEN :
  🟢 Amaryllis  +53,6 % → 36 386 € · ADR 353 € · occ 55,6 %  (moteur du parc, 36 % du total)
  🟢 Schoelcher +99,5 % → 12 332 € · ADR 98 €  · occ 77,4 %  (fiable, pricing à revoir +15 %)
  🟡 Mabouya    +43,2 % →  5 676 € · ADR 82 €  · occ ⚠️ seed incohérent (à vérifier Sheets)
  🟡 Geko        +2,6 % → 11 636 € · ADR 130 € · occ 48,4 %
  🟡 Iguana (bail long) -15,6 % → 10 800 € · occ 100 % · CF 8 376 €
  🔴 Zandoli    -40,9 % → 12 879 € · ADR 137 € · occ 51,9 %  (base 2025 exceptionnelle — attente Q3)
  🔴 Nogent     -14,6 % → 10 268 € · CF = -358 €  (P0 — cashflow négatif)
ALERTES P0 :
  • Nogent CF négatif (-358 € H1) : occ 55 % vs cible 65 %, 79 % Booking.com, RM non activé → activer pricing dynamique immédiatement
  • Concentration Martinique 68 % (seuil confort 50 %) → risque cyclone/réglementaire
  • Zandoli -40,9 % : analyser cause avant de conclure (juillet-août = pic Martinique)
CANAL 2025 (référence) : Direct 43 % (69 123 €) · Booking 35 % (56 626 €) · Airbnb 21 % (34 262 €). Objectif H2 : direct 50 %.
CHANTIERS H2 2026 : RM Nogent actif (P0) · Schoelcher pricing +15 % · PACS + LMP avant déc. 2026 · Crowdlending run-off (défauts 19 %).
⚠️ Ces chiffres = agrégats H1 rétrospectifs STABLES. Pour les montants LIVE : utiliser les données iCal/Beds24/Sheets injectées par liveSection.
═══════════════════════════════════════════════════════════════
`;

// ── Inventaire des capacités DÉJÀ LIVRÉES (anti-doublon transverse) ──────────
// Injecté dans CHAQUE prompt agent : ne JAMAIS reproposer la CRÉATION d'une de ces
// briques (elles existent en prod). Seulement une AMÉLIORATION précise, en nommant
// ce qui manque. ⚠️ À TENIR À JOUR à chaque feature livrée (réflexe de déploiement).
const DEJA_EN_PLACE = `
🚫 DÉJÀ EN PLACE EN PRODUCTION — NE PAS reproposer la création (uniquement une amélioration CONCRÈTE et précise, en nommant ce qui manque) :
• Tracking/Analytics : GA4 branché (events view_item/begin_checkout/purchase enrichis bien_id + niveau_tarifaire) ; onglet Analytics ; conversion "purchase" importée dans Google Ads.
• Revenus/Pilotage : Pilotage = CPA + commissions par canal (Airbnb 3%/15% PAR BIEN, Booking 17%, Direct 0%) ; Cockpit = RevPAR/ADR/Occupation par bien ; part directe par canal. Sheet "revenus locatif 2026" auto-rempli (montant/canal/nuits).
• Réservations : Beds24 temps réel + webhook + anti-double-booking ; sync iCal Airbnb/Booking horaire ; onglet unique "Toutes les Réservations".
• Paiement : Stripe (paiement + caution pré-autorisée + Checkout) ; alerte hôte post-paiement.
• Emails voyageurs (résas DIRECTES) : pré-arrivée J-3, post-séjour J+1/J+3, relance panier — automatisés (cron), opt-out présents.
• RGPD : rate-limiting, échappement HTML, CORS restreint, endpoint contacts-purge, registre des traitements.
• Pricing : Revenue Manager (D1 : profils saisonniers, règles, recommandations, concurrents) + calendrier tarifs (reco only, Vincent valide).
• SEO : meta runtime (functions/[slug].js fait foi) + prerender + sitemap + maillage interne + 5 landings + guides + JSON-LD.
• Réseaux : calendrier éditorial D1 auto-publié FB+IG (cron) ; série de posts GBP ; avis Google répondus.
• Qualité : capteur de bugs JS + inbox 🐞 + triage hebdo + crawl visuel + revue de code au déploiement.
• Agents : ~35 agents + orchestrateur + déclencheurs + éval + vérif adversariale + AI-Ops + RAG.
• Divers : chat IA, météo, géoloc, API avis Google.
• Ads : kits Google Ads + Meta Ads RÉDIGÉS et prêts (ne PAS proposer de les "créer" — Vincent les lance lui-même).
`;

const CROSS_BRAIN_INSTRUCTION = `
🔗 SIGNAL CROSS-FLEET (optionnel) : Si ton analyse révèle quelque chose d'important pour le domaine PATRIMOINE (trésorerie Amaryllis exceptionnelle, anomalie fiscale LMP, pic de revenus, signal saisonnalité fort), ajouter dans ton JSON :
"cross_signal": { "message": "1 ligne max — ce que les agents patrimoine doivent savoir", "tags": ["tresorerie"|"fiscal"|"revenu"|"saisonnalite"], "urgency": "alert"|"watch"|"ok", "for": "patrimoine" }
Ne pas émettre si rien de notable. Qualité > quantité.`;

import { factCheckCaption, loadLearnedLessons } from "./_factcheck.js";

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

// ── Définition des agents avec leur contexte métier ──────────────────────
export const AGENTS = [
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
    id: "repondeur-social",
    label: "Répondeur Social",
    emoji: "💬",
    prefix: "rep",
    focus: "répondre aux commentaires FB/IG des prospects qui cherchent une location en Martinique (lead inbound) : accueil chaleureux + lien du site, ton Amaryllis vouvoiement, JAMAIS de prix/dispo inventés. Améliorer les accroches/gabarits, analyser social_bot_log (taux de lead, ignorés, erreurs), affiner le tri LLM des commentaires.",
    files_hint: "functions/api/social-webhook.js (REPONDEUR_SYSTEM, REPLIES/DM, classify), D1 social_bot_log",
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
    focus: "CRM, emails automatiques (Resend + D1), segmentation, fidélisation, collecte données voyageurs, séquences post-séjour, newsletter, leads D1 `contacts`",
    files_hint: "functions/api/contact.js, functions/api/newsletter-*.js, functions/api/send-poststay.js, functions/api/send-relance-panier.js, D1 tables: contacts / newsletter_subscribers / direct_bookings",
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
  {
    id: "qa-tester",
    label: "QA Tester",
    emoji: "🧪",
    prefix: "qa",
    focus: "tests Vitest, smoke tests post-déploiement, parité mobile/desktop, cas limites (jours fériés, fuseaux MQ vs FR, devises), triage bugs prod, prévention régressions",
    files_hint: "src/calculations.js (tests existants), vitest.config.js, src/App.jsx, functions/api/, public/_headers, public/sitemap.xml",
  },
  {
    id: "growth-experiments",
    label: "Growth / A/B",
    emoji: "🧬",
    prefix: "growth",
    focus: "hypothèses ICE, A/B tests UX/copy/prix/CTA/hero, métriques conversion, taille échantillon, segmentation post-test, watchdogs (bounce, RPS)",
    files_hint: "src/PublicSite.jsx (CTAs, hero), src/main.jsx (GA4 events), functions/api/analytics.js, src/RevenueManagerPro.jsx (prix)",
  },
  {
    id: "veille-concurrentielle",
    label: "Veille Concurrence",
    emoji: "🔭",
    prefix: "veille",
    focus: "scraping concurrents Airbnb/Booking, prix médian marché, dispos, photos hero, avis, signaux forts (variations prix, nouveaux listings, photos changées)",
    files_hint: "functions/api/rm-competitors/[[path]].js, functions/api/fc-competitors-scan.js, D1 rm_competitor_listings / rm_competitor_snapshots / rm_market_signals",
  },
  {
    id: "prompt-engineer",
    label: "Prompt Engineer",
    emoji: "🪄",
    prefix: "prompt",
    focus: "optimisation prompts agents-run, ChatWidget, fact-checker, AI summary admin. Mesure qualité sorties (hallucinations, ton, concision), choix modèles (Groq/CF AI/Cerebras/Mistral/Anthropic), garde-fous, JSON schema",
    files_hint: "functions/api/agents-run.js, functions/api/chat.js, functions/api/_factcheck.js, functions/api/ai-summary.js, ~/.claude/skills/*/SKILL.md",
  },
  {
    id: "seo-local",
    label: "SEO Local",
    emoji: "🗺️",
    prefix: "local",
    focus: "Google Business Profile (7 fiches), Apple Plans, TripAdvisor, Bing Places, citations NAP, reviews cross-platform, ranking local Maps, mots-clés locaux (Sainte-Luce, Trois-Îlets, Schoelcher, Nogent)",
    files_hint: "functions/api/google-reviews.js, public/sitemap.xml (citations), index.html (LocalBusiness schema), src/PublicSite.jsx (avis section)",
  },
  {
    id: "voyageur-research",
    label: "Voyageur Research",
    emoji: "🔬",
    prefix: "voyageur",
    focus: "analyse en masse avis Airbnb/Google/Booking/TripAdvisor, codage thématique, sentiment, personas voyageurs, NPS, frictions récurrentes, attentes non couvertes, synthèse trimestrielle",
    files_hint: "D1 google_reviews / contacts, functions/api/google-reviews.js, ~/.claude/skills/voyageur-research-amaryllis/SKILL.md",
  },
  // ── Spécialistes fiscaux/comptables (ADR-BRAIN-003, 2026-06-15) ─────────────
  // « Armée commune » aux 2 cerveaux : mêmes rôles que côté patrimoine (agentsConfig.js),
  // ici scopés au business locatif MAIS grounded sur le contexte fiscal UNIFIÉ (FISCAL_CONTEXT
  // = miroir de ~/.claude/memory/FISCAL.md). Advisory only — Vincent décide et signe.
  {
    id: "fiscaliste",
    label: "Fiscaliste LMP",
    emoji: "📜",
    prefix: "fisc",
    focus: "Tu es Maître Moreau, avocat fiscaliste (CGI art. 14/31) doublé de Céline, experte LMNP/LMP. Fiscalité des meublés : micro-BIC vs régime réel, amortissement par composants (PCG), statut LMP (seuils 23k€/revenus), TVA meublé para-hôtelier, plus-values, spécificités DOM. Objectif : réduire légalement la base imposable des revenus locatifs de Vincent en préparant le passage au régime réel (déc. 2026).",
    files_hint: "~/.claude/memory/FISCAL.md (contexte unifié), docs/legal/plan-action-declarations.md, src/data/biens.js (7 biens, valeurs), revenus locatifs (Sheet)",
  },
  {
    id: "controleur-fiscal",
    label: "Contrôleur Fiscal",
    emoji: "🏛️",
    prefix: "ctrlfisc",
    focus: "Tu es l'Inspecteur Lévy, inspecteur DGFiP (vérification de comptabilité + ESFP). Tu traques le RISQUE fiscal AVANT que l'administration ne le fasse : cohérence des déclarations, suite de la régularisation DGFiP 2023, conformité des déclarations meublé de tourisme (enjeu 12 500 €), pièces justificatives, points de contrôle probables. Tu sécurises, tu ne dénonces pas — tu prépares Vincent à un contrôle.",
    files_hint: "~/.claude/memory/FISCAL.md, docs/legal/plan-action-declarations.md, D1 direct_bookings (revenus déclarables), agent_actions (conformité)",
  },
  {
    id: "comptable",
    label: "Comptable",
    emoji: "📒",
    prefix: "compta",
    focus: "Tu es Valérie, expert-comptable (DEC, PCG 2014, spécialiste bailleurs meublés). Charges déductibles, immobilisations & amortissements, clôture, préparation de la liasse et du dossier comptable (Résidence : actes notariés + coût construction + inventaire mobilier + factures travaux). Tu structures les pièces pour le comptable réel et maximises les déductions légitimes.",
    files_hint: "~/.claude/memory/FISCAL.md, src/data/biens.js, charges par bien (App.jsx CHARGES_*), Sheet revenus/charges",
  },
  {
    id: "notaire-assurance",
    label: "Notaire & Assurance",
    emoji: "⚖️",
    prefix: "notass",
    focus: "Tu combines Maître Blanc (notaire DOM : DMTO Martinique, droit immobilier, transmission, actes nécessaires au dossier d'amortissement de la Résidence) et Nicolas (courtier : couverture des biens locatifs, PNO, RC, prévoyance bailleur, contact AXA Loganadin). Tu sécurises le juridique-patrimonial du bâti locatif et la couverture assurantielle.",
    files_hint: "~/.claude/memory/FISCAL.md, dossier Résidence (actes), contrats AXA (Loganadin 01 47 74 40 98), src/data/biens.js",
  },
];

// ── Modèles Groq — rotation pour maximiser les appels parallèles ─────────────
// Chaque modèle a sa propre bucket de rate limit → on peut les appeler simultanément
// UNIQUEMENT modèles ACTIFS vérifiés (pas de modèles décommissionnés)
const GROQ_MODELS = [
  { model: "openai/gpt-oss-120b",                       tier: "high"   }, // remplace llama-3.3-70b-versatile (décommissionné 2026-08-16, annonce Groq)
  { model: "llama-3.1-8b-instant",                      tier: "fast"   }, // ✅ confirmé actif
  // meta-llama/llama-4-scout-17b-16e-instruct deprecated 2026-06-24
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
  "qa-tester":                  "fast",
  "veille-concurrentielle":     "fast",
  // growth = medium (raisonnement statistique + créativité variantes)
  "growth-experiments":         "medium",
  // prompt-engineer = smart (méta-IA, demande du raisonnement fin)
  "prompt-engineer":            "smart",
  // seo-local = fast (analyses techniques NAP, fiches)
  "seo-local":                  "fast",
  // voyageur-research = medium (analyse sentiment + synthèse)
  "voyageur-research":          "medium",
  // Spécialistes fiscaux (ADR-BRAIN-003) — raisonnement à fort enjeu → smart/medium
  "fiscaliste":                 "smart",
  "controleur-fiscal":          "smart",
  "comptable":                  "medium",
  "notaire-assurance":          "medium",
};

// Provider préféré par agent (cascade vers les autres si échec)
// Distribution équilibrée pour éviter saturation d'un seul provider.
const AGENT_PREFERRED_PROVIDER = {
  // Groq (8 agents) — rapide, free tier généreux
  "juriste-compliance":         "groq",
  "revenue-manager":            "groq",
  "traffic-manager":            "groq",
  "chef-produit-web":           "groq",
  "commercial-publicite":       "mistral", // copie pub FR → Mistral nettement meilleur
  "consultant-ebusiness":       "groq",
  "responsable-service-client": "mistral", // réponses voyageurs FR → qualité native FR > Llama
  "webdesigner":                "groq",
  // Mistral — contenu FR natif (social posts, emails voyageurs, SEO)
  "community-manager":          "mistral",
  "crm-manager":                "mistral",
  "seo-content-writer":         "mistral",
  // Cloudflare AI (2 agents) — bucket séparé, latence faible
  "developpeur-multimedia":     "cloudflare",
  "photographe-da":             "cloudflare",
  // Cerebras (2 agents) — ultra-rapide pour analyses simples
  "webmaster":                  "cerebras",
  "data-analyst":               "cerebras",
  // Mistral (2 agents) — FR-native pour contenu opérationnel
  "architecte-reseau":          "mistral",
  "responsable-logistique":     "mistral",
  // Nouveaux agents (2026-05) — répartition équilibrée
  "qa-tester":                  "cerebras",   // ultra-rapide pour smoke tests
  "growth-experiments":         "groq",       // raisonnement stat
  "veille-concurrentielle":     "mistral",    // analyse marché FR
  // Phase 2 — 3 derniers agents (2026-05)
  "prompt-engineer":            "cloudflare", // bucket séparé pour méta-tâches
  "seo-local":                  "groq",       // analyses techniques NAP
  "voyageur-research":          "mistral",    // analyse sentiment FR avis voyageurs
  // Spécialistes fiscaux (ADR-BRAIN-003) — répartis sur les buckets
  "fiscaliste":                 "groq",       // raisonnement fiscal (llama-70b smart)
  "controleur-fiscal":          "mistral",    // analyse risque FR-native
  "comptable":                  "groq",       // structuration comptable
  "notaire-assurance":          "mistral",    // texte juridique FR/DOM → vocabulaire Martinique
};

// ── Récupère l'historique D1 d'un agent ────────────────────────────────────
// Stratégie : tout l'historique non-faits (max 120) + les 80 faits les plus récents.
// L'agent voit toujours les bloqué/a-planifier/backlog ; les "fait" sont
// trimés pour économiser des tokens. Débridé le 30/05 (était 80/40) — les modèles
// gratuits actuels ont de grands contextes (128k+), on peut transmettre plus.
async function fetchAgentHistory(db, agentId) {
  try {
    const { results: nonDone } = await db.prepare(
      "SELECT id, action, status, notes FROM agent_actions WHERE agent = ? AND status != 'fait' ORDER BY updated_at DESC LIMIT 120"
    ).bind(agentId).all();
    const { results: done } = await db.prepare(
      "SELECT id, action, status, notes FROM agent_actions WHERE agent = ? AND status = 'fait' ORDER BY updated_at DESC LIMIT 80"
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
    // Dédup TRANSVERSE : compare à TOUTES les actions (tous agents) ET INCLUT les
    // "fait" → écarte les doublons inter-agents ET le re-proposé déjà livré.
    const { results } = await db.prepare(
      "SELECT id, action, status FROM agent_actions LIMIT 1500"
    ).all();
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
// Rend la liste des mots/expressions interdits (table agent_lessons) pour l'injecter
// EN AMONT dans le prompt — les agents les évitent à la génération (pas juste détectés après).
function renderBannedSection(lessons = []) {
  if (!lessons.length) return "";
  const lines = lessons.slice(0, 60).map(l => {
    const w = l.term || l.pattern;
    const scope = l.bien_id ? ` [uniquement ${l.bien_id}]` : "";
    return `• « ${w} »${scope}${l.reason ? ` — ${l.reason}` : ""}`;
  }).join("\n");
  return `\n🚫 MOTS / EXPRESSIONS STRICTEMENT INTERDITS (ne JAMAIS les écrire, ni une variante proche) :\n${lines}\n`;
}

function buildPrompt(agent, history = [], memories = [], recentDrafts = [], brief = "", liveSection = "", feedbackSection = "", outcomesSection = "", ragSection = "", bannedSection = "", sharedSection = "") {
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

  // Retour qualité de l'évaluateur (boucle de feedback A) — mis en exergue car c'est
  // la consigne la plus actionnable du run. Le reste de la mémoire passe en dessous.
  const evalFb = memories.find(m => m.key === "eval_feedback");
  const otherMems = memories.filter(m => m.key !== "eval_feedback");
  const evalSection = evalFb ? `
🎯 RETOUR QUALITÉ (évaluateur automatique — corrige ÇA en priorité) :
  ${evalFb.value}
` : "";
  const memorySection = `${evalSection}${otherMems.length > 0 ? `
MÉMOIRE DE TES RUNS PRÉCÉDENTS :
${otherMems.map(m => `  • ${m.key}: ${m.value}`).join('\n')}
` : (evalFb ? "" : `
MÉMOIRE DE TES RUNS PRÉCÉDENTS :
  (première analyse)
`)}`;

  // ── Profil humain Vincent (tous les agents — contexte qui personnalise les recos) ──
  const vincentSection = VINCENT_PROFILE_DIGEST;

  // ── Contexte fiscal unifié (spécialistes fiscaux — ADR-BRAIN-003) ───────────
  const fiscalSection = FISCAL_AGENTS.has(agent.id) ? FISCAL_CONTEXT : "";

  // ── Playbook revenue management / hospitality (agents revenue & marketing) ──
  const playbookSection = PLAYBOOK_AGENTS.has(agent.id) ? PLAYBOOK_DIGEST : "";

  // ── Voix du Voyageur — accès permanent (pas juste via RAG), demande Vincent 2026-07-04 ──
  const voyageurSection = VOYAGEUR_INSIGHTS_AGENTS.has(agent.id) ? VOYAGEUR_INSIGHTS_DIGEST : "";

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
${bienId === "amaryllis"  ? "  Villa Amaryllis, Sainte-Luce — 8 pers · 3 chambres · 4,94★ · sur les HAUTEURS, vue mer 180°, alizés, PISCINE À DÉBORDEMENT EAU SALÉE 4×7 m (la seule à débordement du portfolio). PAS de jacuzzi." : ""}
${bienId === "zandoli"    ? "  Zandoli, Sainte-Luce (résidence Amaryllis) — 5 pers · 2 chambres · 4,5★ · cocon tropical, mezzanine, jardin, PISCINE PRIVATIVE AVEC CASCADE (chaque logement de la résidence a sa propre piscine)" : ""}
${bienId === "iguana"     ? "  Villa Iguana, Sainte-Luce — 6 pers · 2 chambres · 4,75★ · vue Rocher du Diamant, PISCINE EAU SALÉE (la seule de la résidence, non chlorée)" : ""}
${bienId === "geko"       ? "  Géko, Sainte-Luce (résidence Amaryllis hauteurs) — 4 pers · 1 chambre · 4,83★ · jardin tropical, PISCINE PRIVATIVE AVEC CASCADE (chaque logement de la résidence a sa propre piscine)" : ""}
${bienId === "mabouya"    ? "  Mabouya (résidence Amaryllis hauteurs) — 2 pers · 1 chambre · 4,55★ · JACUZZI privatif terrasse avec VUE mer (pas de piscine, pas pieds dans l'eau)" : ""}
${bienId === "schoelcher" ? "  Bellevue, Schœlcher (hauteurs) — 2 pers · 1 chambre · 4,8★ · vue baie Fort-de-France + Trois-Îlets (pas de piscine)" : ""}
${bienId === "nogent"     ? "  Appt Nogent-sur-Marne — 2 pers · 1 chambre · jardin privatif + terrasse bois · RER A 20min Paris. À évoquer : jardin fleuri (glycines), hirondelles le matin, balade vélo, marché local, Paris à portée, échappée verdure IDF. NE PAS évoquer l'eau/rivière/Marne." : ""}

🚫 GÉOGRAPHIE — INTERDIT (fact-check automatique + règles apprises) :
  - "clapotis" (seul ou combiné) → banni globalement, MÊME pour Nogent/Marne
  - "chant des vagues", "bruit/son/murmure/rugissement/écume des vagues"
  - "mer entre dans la chambre", "pieds dans l'eau", "à Xm de la plage"
  - "vagues qui chantent/caressent/bercent/murmurent"
  - "sable chaud sous les pieds", "réveillé par les vagues", "lagon devant"
  - "plage privée", "crique privée", "ponton devant"
  - Pour Nogent : éviter toute référence à l'eau (rivière, Marne, berge mouillée)

🚫 ÉQUIPEMENTS — INTERDIT (mensonge factuel) :
  - "piscine à débordement" UNIQUEMENT pour Villa Amaryllis (PAS pour les autres)
  - "piscine privative avec cascade" UNIQUEMENT pour Zandoli et Géko (chacune sa propre piscine dans la résidence Amaryllis)
  - "piscine eau salée" pour Villa Amaryllis (à débordement 4×7 m) ET Villa Iguana (non chlorée). Interdit ailleurs.
  - Pas de "piscine" pour Mabouya, Schœlcher, Nogent
  - "jacuzzi privatif" UNIQUEMENT pour Mabouya (PAS pour les autres)
  - "jardin et terrasse" pour Nogent (pas de piscine, pas de jacuzzi)

✅ AUTORISÉ pour les biens hauteurs :
  - "vue mer panoramique", "perché sur les hauteurs", "bercé par les alizés"
  - "horizon caraïbe", "vue 180° sur la baie", "bruissement des palmiers"
  - "parfum des fleurs tropicales", "chant des oiseaux"

═══════════════════════════════════════════════════════════════
📚 EXEMPLES (few-shot) — apprends de ces patterns
═══════════════════════════════════════════════════════════════

✅ EXEMPLES VALIDES (à reproduire) :

  Bien=amaryllis :
    "Villa Amaryllis et sa piscine à débordement eau salée, perchée sur les hauteurs de Sainte-Luce avec vue 180° sur la baie."

  Bien=iguana :
    "Villa Iguana, sa piscine eau salée non chlorée et la vue imprenable sur le Rocher du Diamant."

  Bien=zandoli :
    "Zandoli, son cocon tropical avec mezzanine et sa piscine privative avec cascade dans la résidence Amaryllis."

  Bien=geko :
    "Géko, son jardin tropical et sa piscine privative avec cascade pour un week-end en couple."

  Bien=mabouya :
    "Mabouya, son jacuzzi privatif sur la terrasse avec vue mer pour un séjour romantique."

  Bien=schoelcher :
    "Bellevue à Schœlcher, sa vue panoramique sur la baie de Fort-de-France et les Trois-Îlets."

  Bien=nogent (EXEMPLE COMPLET 5 blocs) :
    HOOK:        "Vingt minutes. C'est tout ce qui sépare Paris de ce jardin."
    DESCRIPTION: "Appartement Nogent-sur-Marne : une terrasse en bois, des glycines qui grimpent, le chant des mésanges le matin. L'après-midi, le vélo, le marché, les berges verdoyantes. Le soir, Paris — si vous en avez encore envie."
    BÉNÉFICE:    "Pour un week-end en amoureux ou une semaine sans agenda."
    CTA:         "Réservez en direct → https://villamaryllis.com/nogent ⤴️"
    HASHTAGS:    "#AmaryllisLocations #NogentSurMarne #ÉchappéeParis #WeekendNature #JardinPrivatif #SlowTravel #ProcheDeParis #LocationDirecte"

❌ EXEMPLES À NE PAS PRODUIRE (raisons précises) :

  ❌ "Villa Amaryllis et son jacuzzi privatif sous les étoiles"
     → FAUX : Amaryllis a une PISCINE à débordement, PAS de jacuzzi.

  ❌ "Mabouya et sa grande piscine eau salée"
     → FAUX : Mabouya = jacuzzi privatif uniquement, AUCUNE piscine.

  ❌ "Géko et sa piscine eau salée non chlorée"
     → FAUX : Géko = piscine privative avec CASCADE (eau classique). Eau salée = Amaryllis + Iguana uniquement.

  ❌ "Villa Iguana et sa piscine à débordement"
     → FAUX : débordement = Amaryllis uniquement. Iguana = piscine eau salée non chlorée.

  ❌ "Zandoli et son jacuzzi pour 5 personnes"
     → FAUX : Zandoli = piscine avec cascade. Jacuzzi = Mabouya uniquement.

  ❌ "Bellevue à Schœlcher, sa piscine et sa vue mer"
     → FAUX : Bellevue n'a PAS de piscine. Seulement la vue panoramique.

  ❌ "Appt Nogent et sa piscine privée"
     → FAUX : Nogent = jardin + terrasse, AUCUNE piscine.

  ❌ "Villa Amaryllis, 4 chambres, parfaite pour 10 personnes"
     → FAUX : Amaryllis = 3 chambres, 8 personnes max.

🎯 RÈGLE D'OR : si tu doutes d'un équipement → ne le mentionne pas. Utilise la liste AUTORISÉE.

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
${vincentSection}${fiscalSection}${playbookSection}${voyageurSection}${skillSection}${liveSection}${sharedSection}${ragSection}${bannedSection}${memorySection}${feedbackSection}${outcomesSection}${historySection}
${DEJA_EN_PLACE}${CROSS_BRAIN_INSTRUCTION}

MISSION : Identifie les actions concrètes NOUVELLES à réaliser dans ton domaine. Tiens compte de ce qui a déjà été fait ou identifié pour approfondir ton analyse et aller plus loin. Si une idée recoupe une capacité « DÉJÀ EN PLACE », ne la propose PAS — sauf amélioration précise et chiffrée (dis ce qui manque concrètement).

📋 DONNÉES CANONIQUES PROPRIÉTÉS (NE JAMAIS INVENTER) :
• Villa Amaryllis (Sainte-Luce, sur les hauteurs) : 280€/nuit · 8 pers · 3 chambres · 3,5 SDB · 4,94★ · vue mer 180° depuis les hauteurs (PAS bord de mer)
• Zandoli (Sainte-Luce, résidence Amaryllis hauteurs) : 220€/nuit · 5 pers · 2 chambres · 1 SDB · 4,5★ · cocon tropical
• Villa Iguana (Sainte-Luce, résidence hauteurs) : 180€/nuit · 6 pers · 2 chambres · 1 SDB · 4,75★ · vue Rocher du Diamant
• Géko (Sainte-Luce, résidence Amaryllis hauteurs) : 150€/nuit · 4 pers · 1 chambre · 1 SDB · 4,83★ · jardin tropical
• Mabouya (Sainte-Luce, résidence hauteurs) : 110€/nuit · 2 pers · 1 chambre · 1 SDB · 4,55★ · jacuzzi privatif VUE mer
• Bellevue (Schœlcher, hauteurs) : 100€/nuit · 2 pers · 1 chambre · 1 SDB · 4,8★ · vue baie Fort-de-France
• Appt Nogent-sur-Marne (IDF) : 85€/nuit · 2 pers · 1 chambre · 1 SDB · bord de Marne

🏷️ NOMENCLATURE EXACTE — NE JAMAIS ajouter ni retirer « Villa » :
  ✅ SONT des villas (et SEULEMENT elles) : « Villa Amaryllis », « Villa Iguana ».
  ❌ NE SONT PAS des villas → écrire SANS « Villa » : « Zandoli » (logement), « Géko » (cocon), « Mabouya » (studio), « Bellevue » (appartement), « Appartement Nogent ».
  ❌ INTERDIT ABSOLU : « Villa Zandoli », « Villa Géko », « Villa Mabouya », « Villa Bellevue ».

${EQUIP_RULES_TEXT}

⚠️ Si tu n'es pas sûr d'un chiffre ou d'un équipement, reste vague ("piscine privative") ou ne le mentionne pas.

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
Bloc 1 — HOOK accrocheur (≤ 12 mots, image sensorielle ou chiffre — PAS de clichés interdits)
        Ex Martinique: "Six heures du matin. L'horizon remplace l'alarme."
        Ex IDF: "Vingt minutes. C'est tout ce qui sépare Paris de ce jardin."

Bloc 2 — DESCRIPTION (3-5 lignes, sensoriel : vue/lumière/sons naturels/ambiance, max 150 mots)
        Ex: "Perchée sur les hauteurs de Sainte-Luce, la Villa Amaryllis capte les alizés dès l'aube. La piscine à débordement eau salée attrape le coucher de soleil. Pas d'alarme. Juste l'horizon."

Bloc 3 — BÉNÉFICE clair (1 ligne, ce que le voyageur gagne)
        Ex: "Pour des vacances où le temps s'arrête vraiment."

Bloc 4 — CTA explicite avec URL COMPLÈTE
        Format: "Réservez sur https://villamaryllis.com/{bienId} ⤴️"

Bloc 5 — HASHTAGS (5-9 stratégiques, mix marque + lieu + audience)
        Ex: "#AmaryllisLocations #Martinique #SainteLuce #VillaPiscine #SlowTravel #Caraïbes #Honeymoon"

🎯 CRITÈRES DE SCORE (le gate note de 0 à 100 — seuil d'auto-publication : 85/100) :
  Hook stop-scroll sensoriel (première ligne accroche sans cliché)        : 20 pts
  Immersion sensorielle (vue, lumière, alizés, sons naturels, ambiance)   : 25 pts
  CTA clair avec URL villamaryllis.com                                      : 15 pts
  Hashtags stratégiques (6-9 : marque + lieu + cible + usage)             : 20 pts
  Voix formelle "vous" (jamais "tu")                                        : 10 pts
  Aucune erreur factuelle (équipements, nomenclature, géographie)          : 10 pts
→ Un seul mot interdit = score 0 (rejet immédiat avant notation).

🚨 INTERDIT ABSOLU : cascade emojis, "opportunité unique", "n'hésitez pas", "découvrez sans plus attendre", tout terme de la liste GÉOGRAPHIE ci-dessus.

EXEMPLE DE CAPTION PARFAITE (à imiter, pas copier) — Amaryllis :
"""
Six heures du matin. L'horizon remplace l'alarme.

Perchée sur les hauteurs de Sainte-Luce, la Villa Amaryllis vous réveille avant le soleil. La piscine à débordement eau salée (4×7 m, eau non chlorée) capte les premières lueurs. Trois chambres, huit voyageurs, et les alizés en fond sonore.

Pour des vacances où le temps s'arrête vraiment.

Réservez sur https://villamaryllis.com/amaryllis ⤴️

#AmaryllisLocations #Martinique #SainteLuce #VillaPiscine #PiscineEauSalée #SlowTravel #Caraïbes #Honeymoon
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
  ],
  "signal": "OPTIONNEL — UNE phrase si tu détectes une tendance/alerte/opportunité TRANSVERSE utile aux AUTRES agents (ex: 'CA août -30%, Mabouya sous-performe' ou 'concurrents -15% sur juillet'). Sinon omets ce champ."${DRAFT_CAPABLE[agent.id] ? `,
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
// ── LIVE CONTEXT : KPIs réels injectés dans chaque run (lever #1) ───────────
// Tout vient du même D1 (binding revenue_manager). Chaque requête est isolée
// dans un try/catch : si une source manque, on dégrade sans casser le run.
function seasonLabel(d = new Date()) {
  const m = d.getUTCMonth() + 1, day = d.getUTCDate();
  // Haute saison Martinique : mi-décembre → mi-avril
  const high = (m === 12 && day >= 15) || m <= 3 || (m === 4 && day <= 15);
  const shoulder = m === 4 || m === 5 || m === 11 || (m === 12 && day < 15);
  return high ? "HAUTE SAISON (forte demande, prix premium)"
       : shoulder ? "MOYENNE SAISON (demande modérée)"
       : "BASSE SAISON (creux — privilégier remplissage & directs)";
}

async function fetchLiveContext(db) {
  const today = new Date().toISOString().slice(0, 10);
  const date30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const ctx = { ts: Math.floor(Date.now() / 1000), date: today, season: seasonLabel() };

  // Leads (contacts)
  try {
    const { results } = await db.prepare(
      "SELECT status, COUNT(*) c FROM contacts GROUP BY status"
    ).all();
    ctx.leads = Object.fromEntries((results || []).map(r => [r.status, r.c]));
    ctx.leadsTotal = (results || []).reduce((s, r) => s + r.c, 0);
  } catch { ctx.leads = null; }

  // Santé du backlog agents
  try {
    const { results } = await db.prepare(
      "SELECT priority, COUNT(*) c FROM agent_actions WHERE status IN ('backlog','a-planifier','en-cours') GROUP BY priority"
    ).all();
    ctx.backlog = Object.fromEntries((results || []).map(r => [r.priority, r.c]));
  } catch { ctx.backlog = null; }

  // Pricing & signaux marché (30 prochains jours) — par bien
  try {
    const { results } = await db.prepare(
      `SELECT property_id,
              ROUND(AVG(recommended_price_cents)/100.0) avg_eur,
              SUM(CASE WHEN premium_opportunity=1 THEN 1 ELSE 0 END) premium,
              SUM(CASE WHEN vacancy_risk_score>=70 THEN 1 ELSE 0 END) risk
       FROM rm_recommendations
       WHERE date >= ? AND date <= ?
       GROUP BY property_id`
    ).bind(today, date30).all();
    ctx.pricing = results || [];
  } catch { ctx.pricing = null; }

  return ctx;
}

function readSnapshot(memoriesSystem) {
  try {
    const row = (memoriesSystem || []).find(m => m.key === "kpi_snapshot");
    return row ? JSON.parse(row.value) : null;
  } catch { return null; }
}

// Rendu de la section "DONNÉES LIVE + ÉVOLUTION" (identique pour tous les agents)
function renderLiveSection(ctx, prev) {
  if (!ctx) return "";
  const lines = [`📊 DONNÉES LIVE (${ctx.date}) — ${ctx.season}`];

  if (ctx.leads) {
    const d = prev?.leadsTotal != null ? ` (était ${prev.leadsTotal} au dernier run)` : "";
    lines.push(`• Leads : ${ctx.leadsTotal} au total${d} — ${Object.entries(ctx.leads).map(([k, v]) => `${v} ${k}`).join(", ")}`);
  }
  if (ctx.backlog) {
    const open = Object.values(ctx.backlog).reduce((s, v) => s + v, 0);
    lines.push(`• Backlog agents : ${open} actions ouvertes (${ctx.backlog.critique || 0} critiques, ${ctx.backlog.haute || 0} hautes)`);
  }
  if (ctx.pricing?.length) {
    const premium = ctx.pricing.reduce((s, p) => s + (p.premium || 0), 0);
    const risk = ctx.pricing.reduce((s, p) => s + (p.risk || 0), 0);
    lines.push(`• Pricing 30j : ${premium} jours en opportunité premium, ${risk} jours à risque de vacance sur l'ensemble du portefeuille`);
    lines.push(`  Prix moyen recommandé/bien : ${ctx.pricing.map(p => `${p.property_id} ${p.avg_eur || "?"}€`).join(" · ")}`);
  }
  if (lines.length === 1) return ""; // aucune donnée → pas de section
  return `\n${lines.join("\n")}\nUtilise ces chiffres réels pour prioriser : agis là où l'impact est mesurable.\n`;
}

// Section feedback par agent (lever #2) : ce qu'il a accompli depuis son dernier passage
function renderFeedbackSection(completedSince, lastRunTs) {
  if (!lastRunTs) return "";
  const when = new Date(lastRunTs * 1000).toISOString().slice(0, 10);
  if (completedSince > 0) {
    return `\n🔄 DEPUIS TON DERNIER RUN (${when}) : ${completedSince} de tes actions sont passées en "fait". Capitalise dessus et propose la suite logique, pas un redémarrage.\n`;
  }
  return `\n🔄 DEPUIS TON DERNIER RUN (${when}) : aucune de tes actions n'a encore été marquée "fait". Privilégie des actions à fort levier et faible effort pour débloquer.\n`;
}

// ═══════════════════════════════════════════════════════════════════════════
// ATTRIBUTION CAUSALE (corrélationnelle) — ferme la boucle d'apprentissage
// Série temporelle kpi_history capturée chaque run → on compare l'état des KPIs
// au moment où une action est passée "fait" vs ~14j après. Honnête : c'est de
// la corrélation, pas de la causalité (confondants : saison, pubs…).
// ═══════════════════════════════════════════════════════════════════════════
const ATTR_WINDOW_DAYS = 14;
// Métrique principale par agent : sessions (visibilité/trafic), leads (conversion), revenue (CA Sheets)
const AGENT_PRIMARY_METRIC = {
  "traffic-manager": "sessions", "seo-content-writer": "sessions", "seo-local": "sessions",
  "chef-produit-web": "sessions", "webdesigner": "sessions", "developpeur-multimedia": "sessions",
  "photographe-da": "sessions", "community-manager": "sessions",
  "crm-manager": "leads", "responsable-service-client": "leads",
  "revenue-manager": "revenue", "commercial-publicite": "revenue",
  "consultant-ebusiness": "revenue", "data-analyst": "revenue",
};

async function captureKpiHistory(db, env, request) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS kpi_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    captured_at INTEGER NOT NULL,
    scope TEXT NOT NULL,
    value REAL NOT NULL
  )`).run().catch(() => {});
  const now = Math.floor(Date.now() / 1000);
  const rows = [];
  // Leads (D1)
  try {
    const r = await db.prepare("SELECT COUNT(*) c FROM contacts").first();
    rows.push(["leads", r?.c || 0]);
  } catch {}
  // Trafic GA4 par fiche bien (sous-requête vers /api/analytics, même origine)
  try {
    const aurl = new URL("/api/analytics", request.url).toString();
    const res = await fetch(aurl, { headers: { "User-Agent": "Mozilla/5.0" }, cf: { cacheTtl: 300 } });
    if (res.ok) {
      const data = await res.json();
      const pages = data.bienConversions || data.pages || [];
      let total = 0;
      for (const p of pages) {
        const s = p.sessions || 0;
        total += s;
        if (p.pagePath) rows.push([`page:${p.pagePath}`, s]);
      }
      rows.push(["sessions_total", total]);
    }
  } catch {}
  // Revenu par bien (Google Sheets via Apps Script) — CA YTD cumulé.
  // delta(après - avant) sur la fenêtre = CA réellement généré pendant la période.
  let revDiag = env.APPS_SCRIPT_URL ? "no-data" : "no-url";
  try {
    if (env.APPS_SCRIPT_URL) {
      const res = await fetch(env.APPS_SCRIPT_URL, { redirect: "follow" });
      const text = await res.text();
      if (text.trimStart().startsWith("<")) {
        revDiag = `html(${res.status})`;
      } else {
        const data = JSON.parse(text);
        let totalCA = 0;
        for (const b of (data.biens || [])) {
          const ytd = (b.revenus || []).reduce((s, v) => s + (Number(v) || 0), 0);
          totalCA += ytd;
          if (b.id) rows.push([`revenue:${b.id}`, ytd]);
        }
        rows.push(["revenue_total", totalCA]);
        revDiag = `ok:${(data.biens || []).length}biens:${Math.round(totalCA)}€`;
      }
    }
  } catch (e) { revDiag = `err:${e.name}:${(e.message || "").slice(0, 60)}`; }
  for (const [scope, value] of rows) {
    await db.prepare("INSERT INTO kpi_history (captured_at, scope, value) VALUES (?,?,?)")
      .bind(now, scope, value).run().catch(() => {});
  }
  return { n: rows.length, revDiag };
}

async function kpiAt(db, scope, ts) {
  // Valeur la plus proche AVANT ou le jour même de la complétion (+1j de marge)
  try {
    const r = await db.prepare(
      "SELECT value FROM kpi_history WHERE scope=? AND captured_at<=? ORDER BY captured_at DESC LIMIT 1"
    ).bind(scope, ts + 86400).first();
    return r ? r.value : null;
  } catch { return null; }
}
async function kpiLatest(db, scope) {
  try {
    const r = await db.prepare(
      "SELECT value FROM kpi_history WHERE scope=? ORDER BY captured_at DESC LIMIT 1"
    ).bind(scope).first();
    return r ? r.value : null;
  } catch { return null; }
}

async function measureDueOutcomes(db) {
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - ATTR_WINDOW_DAYS * 86400;
  let due = [];
  try {
    const { results } = await db.prepare(
      "SELECT action_id, agent, completed_at FROM action_outcomes WHERE measured_at IS NULL AND completed_at <= ?"
    ).bind(cutoff).all();
    due = results || [];
  } catch { return 0; }

  let measured = 0;
  for (const o of due) {
    const leadsB = await kpiAt(db, "leads", o.completed_at);
    const leadsA = await kpiLatest(db, "leads");
    const sessB = await kpiAt(db, "sessions_total", o.completed_at);
    const sessA = await kpiLatest(db, "sessions_total");
    const revB = await kpiAt(db, "revenue_total", o.completed_at);
    const revA = await kpiLatest(db, "revenue_total");
    const metric = AGENT_PRIMARY_METRIC[o.agent] || "leads";

    let label;
    if (metric === "revenue") {
      // CA YTD cumulé : le delta absolu = CA généré pendant la fenêtre.
      if (revB != null && revA != null) {
        const d = Math.round(revA - revB);
        const arrow = d > 0 ? "↑" : d < 0 ? "↓" : "→";
        label = `${arrow} ${d >= 0 ? "+" : ""}${d.toLocaleString("fr-FR")}€ de CA (14j)`;
      } else {
        label = "données insuffisantes (historique trop court)";
      }
    } else {
      const [b, a] = metric === "sessions" ? [sessB, sessA] : [leadsB, leadsA];
      const noun = metric === "sessions" ? "trafic fiches" : "leads";
      if (b != null && a != null && b > 0) {
        const pct = Math.round(((a - b) / b) * 100);
        const arrow = pct > 3 ? "↑" : pct < -3 ? "↓" : "→";
        label = `${arrow} ${pct >= 0 ? "+" : ""}${pct}% ${noun} (14j)`;
      } else if (b != null && a != null) {
        label = `${noun} ${b}→${a} (14j)`;
      } else {
        label = "données insuffisantes (historique trop court)";
      }
    }
    const detail = JSON.stringify({ leads: [leadsB, leadsA], sessions: [sessB, sessA], revenue: [revB, revA], metric });
    await db.prepare(
      "UPDATE action_outcomes SET measured_at=?, impact_label=?, detail_json=? WHERE action_id=?"
    ).bind(now, label, detail, o.action_id).run().catch(() => {});
    measured++;
  }
  return measured;
}

async function fetchAgentOutcomes(db, agentId) {
  try {
    const { results } = await db.prepare(`
      SELECT o.action_id, o.impact_label, a.action
      FROM action_outcomes o LEFT JOIN agent_actions a ON a.id = o.action_id
      WHERE o.agent = ? AND o.measured_at IS NOT NULL
      ORDER BY o.measured_at DESC LIMIT 5
    `).bind(agentId).all();
    return results || [];
  } catch { return []; }
}

function renderOutcomesSection(outcomes) {
  if (!outcomes?.length) return "";
  const lines = outcomes.map(o => `  • "${(o.action || o.action_id).slice(0, 70)}" → ${o.impact_label}`);
  return `\n📈 IMPACT MESURÉ DE TES ACTIONS PASSÉES (corrélation, ~14j après complétion) :\n${lines.join("\n")}\nApprends-en : reproduis ce qui corrèle avec une hausse, abandonne ce qui ne bouge rien.\n`;
}

export async function onRequest(context) {
  const t = timer();
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (request.method !== "POST") return json({ error: "POST only" }, 405);

  // sec : déclenche les agents (coût LLM, écritures D1) → admin (Bearer) OU secret
  //       partagé (crons Worker x3 + déclencheur interne agents-triggers).
  const _u = new URL(request.url);
  const _secretOk = env.POSTSTAY_SECRET && _u.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: _adminOk } = await verifyBearer(request, env);
  if (!_secretOk && !_adminOk) return json({ error: "Non autorisé" }, 401);

  // Vérifie qu'au moins un provider LLM est configuré
  if (!env.GROQ_API_KEY && !env.CF_AI_TOKEN && !env.MISTRAL_API_KEY && !env.CEREBRAS_API_KEY) {
    return json({ error: "No LLM provider configured (GROQ_API_KEY, CF_AI_TOKEN, MISTRAL_API_KEY ou CEREBRAS_API_KEY)" }, 503);
  }

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  // Agent AI-Ops : auto-entretien des sources LLM gratuites (rebuild si plan > 20h),
  // en tâche de fond → ne ralentit pas la réponse. Self-forming sans intervention.
  try { context.waitUntil(maybeRefresh(env).catch(() => {})); } catch { /* waitUntil indispo : ignore */ }

  const body = await request.json().catch(() => ({}));
  // agents peut être "all" ou un tableau d'IDs d'agents spécifiques
  const targetAgents = body.agents === "all" || !body.agents
    ? AGENTS
    : AGENTS.filter(a => body.agents.includes(a.id));

  if (!targetAgents.length) return json({ error: "No matching agents found" }, 400);

  const now = Math.floor(Date.now() / 1000);

  // ── Contexte LIVE partagé (lever #1) : 1 seul fetch pour tout le run ───────
  const liveCtx = await fetchLiveContext(db);
  // Snapshot global précédent (lever #2 : deltas d'évolution)
  let prevSnapshot = null;
  try {
    const { results: sysMem } = await db.prepare(
      "SELECT key, value FROM agent_memory WHERE agent = '_system'"
    ).all();
    prevSnapshot = readSnapshot(sysMem);
  } catch {}
  const liveSection = renderLiveSection(liveCtx, prevSnapshot);

  // ── Cross-brain signals (patrimoine → locatif) ──────────────────────────
  let crossBrainContext = "";
  if (env.CROSS_BRAIN_KV) {
    try {
      const raw = await env.CROSS_BRAIN_KV.get("cross:patrimoine:signals");
      if (raw) {
        const d = JSON.parse(raw);
        const age_h = Math.floor((Date.now() / 1000 - d.ts) / 3600);
        if (age_h < 48 && d.signals?.length) {
          crossBrainContext = `\n═══ SIGNAUX PATRIMOINE → LOCATIF (${age_h}h — ${d.run_summary || ''}) ═══\n`
            + d.signals.map(s => `• [${(s.urgency || 'watch').toUpperCase()}] ${s.label}: ${s.message}`).join('\n')
            + '\n════════════════════════════════════════════════\n';
        }
      }
    } catch { /* KV absent ou données invalides — fail-soft */ }
  }

  // Mots/expressions interdits (curatés depuis l'onglet Approbations) → injectés dans chaque prompt.
  let bannedSection = "";
  try {
    const { results: lessons } = await db.prepare(
      "SELECT pattern, reason, bien_id, term FROM agent_lessons ORDER BY created_at DESC LIMIT 60"
    ).all();
    bannedSection = renderBannedSection(lessons || []);
  } catch {}

  // ── Attribution causale : capture la série KPI + mesure les outcomes mûrs ──
  const kpiResult = await captureKpiHistory(db, env, request).catch(() => ({ n: 0, revDiag: "throw" }));
  const kpiCaptured = kpiResult.n;
  const outcomesMeasured = await measureDueOutcomes(db).catch(() => 0);

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

      // ── Bus inter-agents (B) : signaux transverses émis par les AUTRES agents ──
      // Chaque agent peut émettre 1 "signal" (tendance/alerte) lu par tous les autres au run
      // suivant → fin du silo. On exclut son propre signal.
      let sharedSection = "";
      try {
        const { results: sig } = await db.prepare(
          "SELECT value FROM agent_memory WHERE agent='_shared' AND key LIKE 'signal:%' AND key != ? ORDER BY created_at DESC LIMIT 8"
        ).bind(`signal:${agent.id}`).all();
        // Apprentissages distillés (B2) : sagesse durable extraite des évals/impacts hebdo.
        const { results: lessons } = await db.prepare(
          "SELECT value FROM agent_memory WHERE agent='_shared' AND key LIKE 'learning:%' ORDER BY created_at DESC LIMIT 5"
        ).all();
        const blocks = [];
        if (lessons && lessons.length) {
          blocks.push(`🧠 APPRENTISSAGES DU RÉSEAU (distillés des résultats passés — applique-les) :\n${lessons.map(s => `  • ${s.value}`).join("\n")}`);
        }
        if (sig && sig.length) {
          blocks.push(`📡 SIGNAUX DU RÉSEAU (émis par les autres agents — contexte transverse frais) :\n${sig.map(s => `  • ${s.value}`).join("\n")}`);
        }
        if (blocks.length) sharedSection = `\n${blocks.join("\n\n")}\n`;
        if (crossBrainContext) sharedSection += crossBrainContext;
      } catch { /* bus indisponible → run sans signaux, fail-soft */ }

      // Feedback (lever #2) : actions passées en "fait" depuis le dernier run de cet agent
      let lastRunTs = null, completedSince = 0;
      try {
        const lr = memories.find(m => m.key === "last_run_ts");
        lastRunTs = lr ? parseInt(lr.value, 10) : null;
        if (lastRunTs) {
          const row = await db.prepare(
            "SELECT COUNT(*) c FROM agent_actions WHERE agent = ? AND status = 'fait' AND updated_at >= ?"
          ).bind(agent.id, lastRunTs).first();
          completedSince = row?.c || 0;
        }
      } catch {}
      const feedbackSection = renderFeedbackSection(completedSince, lastRunTs);

      // Attribution causale : impact mesuré des actions passées de cet agent
      const outcomesSection = renderOutcomesSection(await fetchAgentOutcomes(db, agent.id));

      // ── Appel LLM multi-provider avec cascade automatique ──────────────
      const tier      = AGENT_TIERS[agent.id] || "medium";
      const preferred = AGENT_PREFERRED_PROVIDER[agent.id] || "groq";

      // #2 RAG — pour les agents content, injecte des extraits RÉELS (fail-open)
      const ragSection = RAG_AGENTS.has(agent.id)
        ? await ragBlock(env, body.brief || agent.focus || agent.label, 4).catch(() => "")
        : "";

      const llmResult = await callLLM(env, {
        provider: preferred,
        tier,
        max_tokens: 4096, // débridé (était 2048) — réponses agents plus complètes
        temperature: 0.3,
        responseFormat: { type: "json_object" },
        logSource: `agent:${agent.id}`, // prompt-004 — journalise la sortie en D1
        messages: [{ role: "user", content: buildPrompt(agent, history, memories, recentDrafts, body.brief || "", liveSection, feedbackSection, outcomesSection, ragSection, bannedSection, sharedSection) }],
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

      // Parser le JSON (json_object mode → direct ; fallback regex pour cascade sans json mode)
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        try {
          const match = text.match(/\{[\s\S]*\}/);
          parsed = JSON.parse(match ? match[0] : text);
        } catch (e) {
          return { agent: agent.id, model: activeModel, error: "JSON parse failed", raw: String(text).slice(0, 200), parse_err: e.message };
        }
      }

      const actions = parsed.actions || [];
      const drafts  = parsed.drafts || [];
      let inserted = 0, updated = 0, draftsCreated = 0, rejected = 0;

      // ── Bus inter-agents (B) : publie le signal transverse émis par cet agent ──
      // Lu par tous les autres agents au run suivant (agent_memory '_shared'). 1 par agent
      // (ON CONFLICT remplace l'ancien) → le réseau partage ses tendances sans silo.
      const signal = typeof parsed.signal === "string" ? parsed.signal.trim() : "";
      const crossSignal = parsed.cross_signal || null;
      if (signal && signal.length > 8 && !/^optionnel/i.test(signal)) {
        await db.prepare(`INSERT INTO agent_memory (agent, key, value) VALUES (?,?,?)
          ON CONFLICT(agent, key) DO UPDATE SET value=excluded.value, created_at=unixepoch()`)
          .bind("_shared", `signal:${agent.id}`, `${agent.emoji} ${agent.label}: ${signal}`.slice(0, 300)).run().catch(() => {});
      }

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
Six heures du matin. L'horizon remplace l'alarme.

Perchée sur les hauteurs de Sainte-Luce, la Villa Amaryllis capte les alizés dès l'aube. La piscine à débordement eau salée (4×7 m, non chlorée) attrape le coucher de soleil. Trois chambres, huit voyageurs, et le bruissement des palmiers en fond sonore.

Pour des vacances où le temps s'arrête vraiment.

Réservez sur https://villamaryllis.com/amaryllis ⤴️

#AmaryllisLocations #Martinique #SainteLuce #VillaPiscine #PiscineEauSalée #SlowTravel #Caraïbes #Honeymoon
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
                responseFormat: { type: "json_object" },
                messages: [{ role: "user", content: validatorPrompt }],
              });
              if (valResult.ok) {
                let valText = valResult.text;
                if (typeof valText !== "string") valText = String(valText ?? "");
                let parsed;
                try { parsed = JSON.parse(valText); } catch { const match = valText.match(/\{[\s\S]*\}/); if (match) parsed = JSON.parse(match[0]); }
                if (parsed) {
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
              // Force les 2 canaux : la stratégie éditoriale cross-poste toujours
              // FB + IG (entrées calendrier = "both"). Le LLM émet parfois ["ig"]
              // seul, ce qui laissait Facebook de côté → on garantit les deux.
              draft.payload.channels = ["ig", "fb"];
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
          // ── Triage des nouvelles actions : filtre qualité + risque ──
          let verdict = triageAction(row, []);
          if (!verdict.keep && (verdict.reason === "vague" || verdict.reason === "court")) {
            // Retry 1× : demander à l'agent de reformuler concrètement
            try {
              const retry = await callLLM(env, {
                tier: "fast", max_tokens: 200, temperature: 0.4,
                logSource: `triage-retry:${agent.id}`,
                messages: [{ role: "user", content:
                  `Réécris cette action pour qu'elle soit CONCRÈTE : nomme le bien, chiffre la cible, cite l'endpoint/outil. Une seule phrase, sans guillemets. Action vague : "${row.action}"` }],
              });
              const improved = String(retry.text || "").trim().replace(/^["']|["']$/g, "");
              if (improved) {
                const v2 = triageAction({ ...row, action: improved }, []);
                if (v2.keep) { row.action = improved; verdict = v2; }
              }
            } catch (_) { /* retry best-effort */ }
          }
          if (!verdict.keep) { rejected++; continue; }
          const risk = verdict.risk || "review";
          await db.prepare(`
            INSERT OR IGNORE INTO agent_actions
              (id, agent, agent_label, agent_emoji, category, action, priority, effort, status, risk, last_analyzed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'backlog', ?, ?, ?, ?)
          `).bind(row.id, row.agent || agent.id, row.agent_label || agent.label, row.agent_emoji || agent.emoji,
                 row.category || "autre", row.action, row.priority || "moyenne", row.effort || "?",
                 risk, now, now, now).run();
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

      // Mémoire enrichie (lever #3) : horodatage du run pour le feedback du prochain passage
      await db.prepare(`
        INSERT INTO agent_memory (agent, key, value) VALUES (?,?,?)
        ON CONFLICT(agent, key) DO UPDATE SET value=excluded.value, created_at=unixepoch()
      `).bind(agent.id, "last_run_ts", String(now)).run().catch(() => {});

      return { agent: agent.id, model: activeModel, ok: true, inserted, updated, rejected, skipped, drafts: draftsCreated, actions: actions.length, context_size: history.length, completed_since: completedSince, cross_signal: crossSignal, label: agent.label, emoji: agent.emoji };
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

  // Snapshot global du contexte live (lever #2) : alimente les deltas du prochain run
  try {
    await db.prepare(`
      INSERT INTO agent_memory (agent, key, value) VALUES ('_system','kpi_snapshot',?)
      ON CONFLICT(agent, key) DO UPDATE SET value=excluded.value, created_at=unixepoch()
    `).bind(JSON.stringify({
      ts: liveCtx.ts, date: liveCtx.date,
      leadsTotal: liveCtx.leadsTotal ?? null,
      backlog: liveCtx.backlog ?? null,
    })).run();
  } catch {}

  const ok = results.filter(r => r.ok).length;
  const errors = results.filter(r => r.error).length;

  // ── Cross-brain KV write (locatif → patrimoine) ─────────────────────────
  const crossSignals = results
    .filter(r => r.ok && r.cross_signal?.message)
    .map(r => ({
      agent: r.agent,
      label: `${r.emoji || ''}${r.label || r.agent}`.trim(),
      urgency: r.cross_signal.urgency || 'watch',
      message: String(r.cross_signal.message).slice(0, 200),
      tags: Array.isArray(r.cross_signal.tags) ? r.cross_signal.tags : [],
      for: 'patrimoine'
    }));

  // Dernière réservation ENREGISTRÉE (created_at le plus récent) — pour la question
  // "quelle est ma dernière réservation" côté assistant vocal patrimoine (2026-07-03).
  // ⚠️ Source = D1 direct_bookings uniquement, PAS le merge complet Sheet+D1 que fait
  // App.jsx côté client (cf. CLAUDE.md §2 "Toutes les Réservations") — un vrai appel
  // Apps Script depuis ce cron ajouterait une dépendance externe fragile (POST-redirect
  // quirk documenté) pour un gain marginal, direct_bookings couvre déjà les 3 canaux en
  // pratique (Direct/Airbnb/Booking.com y arrivent via le webhook Stripe + les syncs
  // existants). Caveat explicite côté prompt vocal plutôt qu'une fausse exhaustivité.
  let lastReservation = null
  let lastReservationByProperty = []
  if (db) {
    try {
      const row = await db.prepare(
        `SELECT bien_nom, voyageur, nb_guests, checkin, checkout, canal, total, created_at
         FROM direct_bookings ORDER BY created_at DESC LIMIT 1`
      ).first()
      if (row) {
        lastReservation = {
          bien: row.bien_nom, voyageur: row.voyageur, guests: row.nb_guests,
          checkin: row.checkin, checkout: row.checkout, canal: row.canal,
          total: row.total, bookedAt: row.created_at,
        }
      }
    } catch { /* fail-soft */ }

    // Par bien (2026-07-03) — la requête globale ci-dessus ne répond QUE pour le bien
    // globalement le plus récent (ex. Géko) ; Vincent a besoin de la dernière résa d'un
    // bien PRÉCIS (ex. "et pour Zandoli ?"), qui peut être un autre bien. Groupé par
    // bien_id (PAS bien_nom : incohérence d'accent constatée "Géko"/"Geko" en base —
    // bien_id est la clé stable, bien_nom n'est là que pour l'affichage).
    try {
      const { results } = await db.prepare(
        `SELECT bien_id, bien_nom, voyageur, nb_guests, checkin, checkout, canal, total, created_at
         FROM direct_bookings d1
         WHERE bien_id IS NOT NULL
           AND created_at = (SELECT MAX(created_at) FROM direct_bookings d2 WHERE d2.bien_id = d1.bien_id)
         ORDER BY created_at DESC`
      ).all()
      lastReservationByProperty = (results || []).map(row => ({
        bienId: row.bien_id, bien: row.bien_nom, voyageur: row.voyageur, guests: row.nb_guests,
        checkin: row.checkin, checkout: row.checkout, canal: row.canal,
        total: row.total, bookedAt: row.created_at,
      }))
    } catch { /* fail-soft */ }
  }

  if (env.CROSS_BRAIN_KV) {
    try {
      await env.CROSS_BRAIN_KV.put('cross:locatif:signals', JSON.stringify({
        ts: now,
        fleet: 'locatif',
        run_summary: `${results.length} agents · ${ok} ok`,
        signals: crossSignals,
        last_reservation: lastReservation,
        last_reservation_by_property: lastReservationByProperty,
      }), { expirationTtl: 7 * 24 * 3600 });
    } catch { /* fail-soft */ }
  }

  // ── Alerte ntfy réactive si actions critiques fraîches (< 5 min) ──────────
  if (env.NTFY_TOPIC && env.revenue_manager) {
    try {
      const freshCrit = await env.revenue_manager.prepare(
        `SELECT COUNT(*) as cnt FROM agent_actions WHERE priority='critique' AND status!='fait' AND last_analyzed > ?`
      ).bind(now - 300).first().catch(() => null);
      const alertSigs = crossSignals.filter(s => s.urgency === 'alert');
      const cnt = freshCrit?.cnt ?? 0;
      if (cnt > 0 || alertSigs.length > 0) {
        const parts = [];
        if (cnt > 0) parts.push(`${cnt} critique${cnt > 1 ? 's' : ''}`);
        if (alertSigs.length > 0) parts.push(`${alertSigs.length} cross-alert`);
        const body = alertSigs.length > 0
          ? alertSigs.map(s => `• [${s.label}] ${s.message}`).join('\n')
          : `${cnt} action(s) critique(s) non résolue(s) — voir le dashboard`;
        await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
          method: 'POST',
          headers: { Title: `🔴 Agents locatif — ${parts.join(' · ')}`, Priority: '5', Tags: 'robot,warning', 'Content-Type': 'text/plain; charset=utf-8' },
          body,
        }).catch(() => {});
      }
    } catch { /* fail-soft */ }
  }

  clog('agents-run', errors > 0 ? 'warn' : 'info', { agents: targetAgents.length, ok, errors, ms: t() });
  return json({ ok: true, agents_run: targetAgents.length, ok_count: ok, error_count: errors, live: !!liveSection, kpi_captured: kpiCaptured, rev_diag: kpiResult.revDiag, outcomes_measured: outcomesMeasured, results });
}
