# ITERATIONS_LOG — Journal des sessions (rolling)

> 1 entrée par session : date · ce qui a été fait · commits clés. Le plus récent en haut.
> **Archive des sessions antérieures : `../PROJECT_MEMORY.md` + `../docs/_archive/`.**

---

## 2026-06-04 (6) — Écran d'accueil TV des logements — Phase 1 livrée (subagent-driven)
**1 chantier produit (brainstorm→spec→plan→implé). Déployé + vérifié live.**

- **Brainstorm → spec → plan** : `docs/superpowers/specs/2026-06-04-tv-welcome-screen-design.md` + `plans/2026-06-04-tv-welcome-screen-phase1.md`. S'appuie sur l'existant `/bienvenue/<bien>` (`GuestGuide` + guides JSON). 3 phases : écran TV (P1, fait) · ventes additionnelles Stripe via QR (P2, attend prix par logement) · images de secours (P3).
- **Phase 1 implémentée en subagent-driven (6 tâches, ~5 sous-agents)** : `src/utils/tvScreen.js` (pur, **12 tests vitest**) + `src/TvScreen.jsx` (diaporama plein écran, QR via lib `qrcode`, system-ui, overscan) + bascule `?tv=1` dans `GuestGuide` + helper admin « Générer l'URL TV » dans `LivretEditor` (onglet QR, variable `propId`). Déployé, **vérifié live** (`/bienvenue/mabouya?tv=1` générique + `?guest=&du=&au=` perso) : diaporama OK, QR scannables.
- **🐛 3ᵉ occurrence du bug `[data-surface="site"] h1`** : le `<h1>` du TvScreen ne fixait pas `color` inline → titre navy invisible sur fond sombre (même sur `/bienvenue`). Corrigé (`color:#fff` inline). **Le code du plan lui-même contenait le piège** → leçon renforcée.
- **Polish optionnel non bloquant** : « Bienvenue à Studio Mabouya » (gram. « au Studio » / « à la Villa ») — article à gérer dans `buildSlides` un jour.

## 2026-06-04 (5) — SEO hors-page : diagnostic Search Console + exécution Top 5 (pilotage navigateur)
**3 déploiements prod (page partenaires + fix contraste). Beaucoup de prépa contenu + pilotage navigateur.**

- **🔑 DIAGNOSTIC SEARCH CONSOLE (le constat structurant)** : sur ~2 sem de données, **17 clics / 289 impressions / position moyenne 5,8 / CTR 5,9%**. **Seules 3 pages reçoivent des impressions** (accueil 165, /amaryllis 166, le reste ~0) → les 47 guides + 5 landings sont indexés mais **invisibles**. ~65% des requêtes = marque. Seul générique qui décolle : « location sainte luce martinique » (11 impr). **CONCLUSION : le SEO technique est déjà bon ; le goulot = AUTORITÉ DE DOMAINE (backlinks/citations/GBP), PAS du contenu.** → EN + nouveau contenu = prématurés tant que l'autorité ne monte pas.
- **Vérif état SEO technique = TOUT déjà en place** (l'audit Explore initial était FAUX, lu sur les sources au lieu du live) : sitemap 63 URLs (POI inclus), JSON-LD Article+Breadcrumb+FAQPage sur destinations ET POI, maillage landings fait. Rien à reconstruire.
- **Page `/nos-partenaires`** : enrichie (5 liens sortants distilleries **vérifiés par recherche web** : La Mauny 1ère car la + proche, Trois-Rivières, Clément, Depaz, Neisson) + **désorphelinée** (lien header site-wide). Bug contraste hero corrigé (titre navy invisible → scopé `.pt-hero`). 3 déploiements.
- **Kits off-page préparés** (agents traffic-manager/commercial/seo) : `plan-execution-semaine1`, `emails-prospection-institutionnels` (6 emails, recipients trouvés : web@martiniquetourisme.com, bienvenue@mairie-sainte-luce.fr ; OT = tél 0596625353), `press-kit`. ⚠️ Emails corrigés : logements **pas encore déclarés ni classés** → retirer toute mention déclaration/classement.
- **Plan déclaration/classement MAJ** (agent juriste, sur l'existant `docs/legal/plan-action-declarations.md`) : 6 meublés (Iguana exclue=bail long), loi Le Meur, classement Atout France, micro-BIC. ⚠️ Spécificités légales à CONFIRMER (mairie/expert-comptable).
- **Top 5 exécuté en partie (pilotage navigateur, Vincent fait comptes/clics)** : ✅ **Post GBP « Studio Mabouya » PUBLIÉ** sur fiche Résidence (carrousel 4 photos exportées en JPEG dans ~/Downloads). ⏸️ Bing : import a pris la fiche *patrimoine* par erreur (Amaryllis sous le MÊME compte vinsmaf@gmail.com → reprenable). ⏸️ Apple Business Connect : produit séparé de Business Manager, URL rebondit → à faire via iPhone Plans. 📧 3 emails prêts (Vincent envoie). ⬜ PagesJaunes/Petit Futé (Vincent).

**Commits** : analytics→partenaires→fix contraste + docs marketing/legal + mémoire. **À suivre** : Vincent exécute citations + envoie emails ; reprendre Bing/Apple ; contrôle C1 Ads.

## 2026-06-04 (4) — Dashboard Analytics business (data-049) déployé
**1 déploiement prod. Onglet `/admin` Analytics enrichi de KPIs business.**

- **Backend `functions/api/analytics.js`** : 3 rapports GA4 ajoutés au `Promise.all`, chacun isolé via nouveau wrapper **`runReportSafe`** (try/catch → `null` si échec, `parseReport(null)=[]` → une carte vide ne casse jamais le reste du dashboard) :
  - `revenue` — `totalRevenue` 30j (€).
  - `byBien` — `customEvent:bien_id` × {eventCount, totalRevenue}, filtre `eventName=purchase`.
  - `byChannel` — `sessionDefaultChannelGroup` × {sessions, ecommercePurchases, totalRevenue}.
- **Front `src/tabs/AnalyticsTab.jsx`** : import `getBien`, 3 sections style sombre — KPIs (Revenu 30j · Panier moyen · Taux de conversion) ; tableau **par bien** (barres, fallback « 24-48h » si dim pas propagée) ; tableau **par canal** (canal/sessions/résas/revenu = lecture ROI pub). Accès `data.revenue[0]` blindé (`&&`).
- **Vérif live `/api/analytics`** : `byChannel` ✅ 6 canaux (dont **Paid Search 1** = 1ʳᵉ session Google Ads) ; `revenue`/`byBien` vides = **0 purchase sur 30j** (funnel 240 view_item → 16 begin_checkout → **0 purchase**). Déploiement sain (tests/build/smoke OK, audit invariants 🟢).
- **⚠️ Signal à creuser** : 16 begin_checkout mais 0 purchase trackés sur 30j → soit aucune résa directe ce mois, soit trou de tracking `purchase` côté confirmation Stripe (`/merci`). À vérifier si Vincent a eu des résas directes. (→ BLOCKERS)
- Revue de code a flaggé « gestion d'erreur insuffisante » dans analytics.js = **faux positif** (`runReportSafe` blinde justement chaque rapport).

**Commits** : `feat(analytics): dashboard business`. **À suivre** : trou purchase/Stripe ; byBien se peuple sous 24-48h.

## 2026-06-04 (3) — Lancement acquisition (Google Ads LIVE) + étanchéité tracking + CI verte
**Commits `347f4b3` → `21ceab3`. 1 déploiement prod (fix consentement) — le reste docs/config/CI/GA4.**

- **Google Ads LANCÉ** (pilotage navigateur, Vincent fait les clics money) :
  - **C1 « Offre Groupe Sainte-Luce »** (campaignId 23904365229) : Recherche seule, 8 €/j, CPC max 0,80 €, France/FR, landing `/location-groupe-sainte-luce`, 13 mots-clés, RSA 7 titres/3 desc.
  - **C2 « Brand »** (campaignId 23913930124) : 2 €/j, CPC max 0,40 € (~0,11 € réel), landing `/`, 7 mots-clés marque, 6 titres/2 desc.
  - **Liste « Négatifs globaux Amaryllis » (120 mots)** créée + appliquée aux 2 campagnes. Conversion GA4 `purchase` = Principale (déjà importée le 02/06).
- **Pré-flight vérifié (audit code + live)** : tunnel résa 🟢 (Stripe LIVE, gestion d'erreur robuste, idempotent, /merci+purchase, testé) ; landings 🟢 ; **GA4 🟡→🟢 après fix**.
- **🔴→🟢 Fix consentement déployé** (commit consent) : 2 bannières cookies coexistaient ; l'inline PublicSite n'accordait qu'`analytics_storage` → conversions Google Ads perdues. Bannière inline neutralisée (globale fait foi) + `index.html` restaure les 4 signaux. **Vérifié LIVE** : 1 seule bannière, `ad_storage=granted` après accept, Meta Pixel charge.
- **2 dimensions GA4 créées** (pilotage) : `bien_id` + `niveau_tarifaire` (Événement, propriété amaryllis p538182418).
- **CI GitHub réparée** : échouait depuis qu'on pousse souvent — `wrangler ≥4.94` exige **Node ≥22**, CI était en Node 20 (étape Build Functions). Fix `node-version: "22"` → run vert. N'a jamais impacté la prod. (LEARNINGS + technique de lecture du log CI via navigateur.)
- **ADR-011 rédigé** (matin) : éliminer le drift des miroirs GAS/Worker (hybride import Worker + codegen GAS + test parité) — *Proposé*, pas implémenté.
- **Meta Ads reporté** : bon compte = « Amaryllis corp » act 853205825762332 (paiement à finaliser) ; DIMA 308 restreint ; clics bloqués sur adsmanager → mode guidé. Détails BLOCKERS.

**Décisions** → ADR-011 (specs). **Fixes** → consent (prod), CI node22. **À suivre** : Meta (guidé, après paiement), Resend domaine, surveiller search terms C1 sous 2-3 j.

## 2026-06-04 (2) — Système mémoire complet + audit + synchro inter-projets
**Commits `de21941` → `949bf6b` (locatif) + `6e218bc` (patrimoine, charte). Doc/config/mémoire only — AUCUN déploiement.**

- **Auditeur** : skill `/auditeur` (audit riche, verdict 🟢 PASS) + `scripts/audit-invariants.mjs` déterministe greffé **non bloquant** au deploy (post-smoke) → `docs/_audits/`. ADR-S-003.
- **Rappel mémoire mécanisé** : hook **SessionStart** (`.claude/settings.json` + `scripts/session-context.mjs`) injecte CONTEXT + rappels + nudge consolidation. Niveau 2 passé de convention à mécanisme. ADR-S-004. ⚠️ activer via `/hooks`/redémarrage la 1ʳᵉ fois.
- **Consolidation** : skill `/consolidation` (jardinage) + cron `/schedule` hebdo (BLOQUÉ backend) + filet nudge >7j (`.last-consolidation`). ADR-S-005.
- **Synchro inter-projets** : charte commune `docs/OPERATING-MODEL.md` (identique locatif ↔ patrimoine) ; `.memory/` aligné au standard 8 fichiers (RECALL.md + DECISIONS.md adoptés de patrimoine). ADR-S-006. Ports répartis : chacun fait les siens ; chantier commun = drift miroirs (locatif conçoit, partage).
- **Mémoire = 3 niveaux étanches + 4 rituels.** Findings : doc « 557 erreurs eslint » périmée (lint=0 aujourd'hui).

**À suivre prochaine session** : (1) confirmer injection hook SessionStart ; (2) recréer cron `/consolidation` ; (3) **lancement Google Ads + Meta Ads** (runbook, Vincent aux commandes).

## 2026-06-04 — Audit + cleanup gouvernance/architecture
**Commit `347f4b3` poussé sur origin/main (docs-only, aucun déploiement).**

- **Audit gouvernance** : constitution (CLAUDE.md), agents/skills, fichiers mémoire (ADR, learnings, blockers, iterations log, contexte + indexation). Verdict : gouvernance mature mais CLAUDE.md périmé, PROJECT_MEMORY trop gros, pas d'index in-repo, ADR non formalisés.
- **CLAUDE.md actualisé** : corrigé le faux « There are no tests » → suite vitest ~148 tests + gate deploy + CI ; nouvelle section « Source unique des biens & filet qualité » (biens.js, pattern miroir GAS/Worker, coherence-check, occupation→RM, Meta Pixel/CSP) ; footgun #1 corrigé (plus de prix codés en dur dans [slug].js/prerender).
- **`docs/INDEX.md`** créé (carte d'indexation ~47 docs + fichiers racine).
- **`docs/superpowers/specs/README.md`** créé (index ADR : 10 décisions ADR-001→010, statut + plan lié).
- **`PROJECT_MEMORY.md` dégraissé** 52KB→35KB ; journal historique extrait → `docs/_archive/PROJECT_MEMORY-journal-2026-05.md`.
- **Rituel de clôture** : skill `/cloture-session` (déjà existante) exécutée → création du système **`.memory/`** (INDEX/CONTEXT/ADR/LEARNINGS/BLOCKERS/ITERATIONS_LOG), calqué sur patrimoine-dashboard.

**Décisions** → ADR-S-001 (rituel = skill + `.memory/`), ADR-S-002 (gouvernance doc). **Frictions notées** : drift pattern miroir, doublons docs GBP/Ads à archiver, lint hors CI.

**À suivre** : lancement Google Ads + Meta Ads pas-à-pas (demain matin, Vincent aux commandes).
