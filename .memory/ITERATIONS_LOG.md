# ITERATIONS_LOG — Journal des sessions (rolling)

> 1 entrée par session : date · ce qui a été fait · commits clés. Le plus récent en haut.
> **Archive des sessions antérieures : `../PROJECT_MEMORY.md` + `../docs/_archive/`.**

---

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
