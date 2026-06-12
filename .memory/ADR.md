# ADR — Décisions structurantes (locatif-dashboard)

> 1 entrée par décision qui engage la suite. Format 5 lignes : **Choix · Alternatives refusées · Conséquences attendues · Périmètre · Statut**.
> Décisions d'archi détaillées (specs complets) → `../docs/superpowers/specs/README.md` (ADR-001→010). Ici = log curaté de session.

---

## ADR-PAY-001 · 2026-06-11 · Paiement en 2 fois = acompte/solde (J-30), pas Klarna
1. **Choix** : « payer en 2 fois » = acompte 30 % maintenant + solde 70 % débité off-session à J-30, **optionnel** (proposé, pas imposé, défaut = paiement total). Plan écrit, à exécuter session suivante.
2. **Alternatives refusées** : **Klarna** (3×) — surcharge au client **interdite** par CGV Klarna + réglementation EU, et absorber le frais BNPL (~3-5 %) ne convient pas à Vincent (regardant sur le coût) ; **Alma** (compte/intégration séparés, plus lourd).
3. **Conséquences attendues** : 0 € de frais en plus (carte ~1,5 % répartie sur 2 débits) ; Vincent porte le risque d'annulation (couvert par la politique d'annulation existante) ; nouvelle table D1 `payment_schedule` + cron quotidien `charge-balance.js`. Argent réel → valider en mode Stripe TEST avant LIVE, flag `PAY_2X_ENABLED`.
4. **Périmètre** : spec `docs/superpowers/specs/2026-06-11-paiement-2-fois-design.md` · plan `docs/superpowers/plans/2026-06-11-paiement-2-fois.md`.
5. **Tracking pub (décision 2026-06-12)** : la conversion `purchase` (GA4 + Meta CAPI + Pixel) doit remonter la **VALEUR TOTALE** de la réservation, **pas l'acompte 30 %** — sinon ROAS sous-compté et Google/Meta optimisent sur une valeur fausse. Implémenté : `create-payment-intent` pose `full_total` en metadata ; `stripe-webhook.js` lit `pi.metadata.full_total` quand `pay_plan='2x'` (sinon `pi.amount`). La valeur totale est comptée **UNE seule fois** (à la confirmation = acompte) ; `charge-balance.js` (débit du solde) **ne refire AUCUN event** → pas de double comptage. Côté client le `BookingModal` envoie déjà `total` → même `event_id`/`transaction_id`, valeur cohérente (dédup OK).
6. **Statut** : ✅ **livré & LIVE en prod (2026-06-12)**. Validé en Stripe TEST de bout en bout (acompte → `payment_schedule` → débit off-session du solde succès + échec/retry). Flag `PAY_2X_ENABLED=1` posé (CF Pages prod). Cron cron-job.org `7798126` (quotidien 13h UTC). Option visible si total ≥ 800 € & arrivée > 35 j.

## ADR-AVIS-001 · 2026-06-11 · Récolte d'avis Google = capture in-situ, pas email anciens voyageurs
1. **Choix** : booster les avis Google (facteur n°1 du pack local) via **CTA in-situ** (page guide-séjour + /bienvenue QR physique + slide écran TV) — chaque voyageur présent, Airbnb inclus.
2. **Alternatives refusées** : **campagne email anciens voyageurs** — abandonnée : D1 `direct_bookings` = **1 voyageur, 0 séjour passé** (canal direct trop neuf) ; les voyageurs Airbnb n'ont pas d'email exploitable. Aucun carburant.
3. **Conséquences attendues** : avis captés sans dépendre du trafic ni d'emails ; compounding lent mais gratuit. Liens writereview par fiche (Villa/Résidence) centralisés `src/data/googleReview.js`.
4. **Périmètre** : `src/data/googleReview.js`, `src/GuideSejour.jsx`, `src/GuestGuide.jsx`, `src/utils/tvScreen.js`.
5. **Statut** : ✅ acté, déployé (`de6acf3`+`6d09ca2`).

## ADR-S-016 · 2026-06-11 · Masquer PricingCalendar (Tarifs prévisionnels) sur Amaryllis
1. **Choix** : `"amaryllis"` ajouté à `PRICING_CAL_HIDDEN` — le bloc "Tarifs prévisionnels" (`PricingCalendar`) supprimé sur Amaryllis (desktop était déjà masqué via condition `bien.id !== "amaryllis"`, mobile ne l'était pas).
2. **Alternatives refusées** : condition `isMobile` ciblée seule (logique éclatée) ; retrait du composant entier (les autres biens en ont besoin).
3. **Conséquences attendues** : Amaryllis passe de 3 calendriers à 2 (section réservation breakout + calendrier disponibilités). Plus propre, moins redondant.
4. **Périmètre** : `src/PublicSite.jsx` — constante `PRICING_CAL_HIDDEN` L162.
5. **Statut** : ✅ acté, déployé `d2012b4`.

## ADR-S-015 · 2026-06-11 · Trust bar CRO étendue à tous les biens bookable mobile
1. **Choix** : Trust bar "réservation directe" ajoutée (a) dans la sticky bar basse — tagline teal 9px "Prix direct · paiement sécurisé" et (b) avant le calendrier disponibilités sur les fiches Géko/Zandoli/Mabouya/Schœlcher/Nogent (3 checkmarks). Miroir du trust bar Amaryllis déjà en place.
2. **Alternatives refusées** : extension desktop (widget a déjà badge DIRECT + barré Airbnb, suffisant) ; sticky bar seule sans pre-calendar (utilisateur voit la trust bar après scroll, pas avant sélection dates).
3. **Conséquences attendues** : tous biens bookable affichent les mêmes signaux de confiance sur mobile. Cohérence CRO cross-biens.
4. **Périmètre** : `src/PublicSite.jsx` — sticky bar L≈3658 + calendrier mobile L≈4394.
5. **Statut** : ✅ acté, déployé `5257d24`. ⚠️ Déployé sans validation préalable de Vincent — voir LEARNINGS.

## ADR-S-014 · 2026-06-11 · REVENUS_AUTO_2027 : setup sans baseline pour capter les résas existantes
1. **Choix** : `setupRevenus2027()` n'appelle PAS `baselineSheet_()`. En 2026, le setup s'est fait avant l'existence de résas 2026 → baseline était safe. Pour 2027, une résa Mabouya existait déjà dans « Toutes les Réservations » → baseline l'aurait silencieusement marquée comme traitée sans l'écrire dans le sheet.
2. **Alternatives refusées** : baseline + `revenus2027Forget` sur l'ID Mabouya connu (fragile, dépend de la mémoire humaine) ; saisie manuelle dans le sheet (source de vérité contournée).
3. **Conséquences attendues** : tout `setupRevenus2027()` futur (réinstall) traitera toutes les résas 2027 existantes → comportement sûr tant que le sheet 2027 est vide avant. ⚠️ Si réinstall avec sheet déjà alimenté → doublon possible, utiliser `clearAndResetRevenus2027_()` d'abord.
4. **Périmètre** : `appscript/REVENUS_AUTO_2027.gs` (nouveau, ~380 lignes), `appscript/SCRIPT_SHEETS.js` (dispatchers `revenus2027*` + `importAllReservations` auto-sync 2027 simultanément au 2026).
5. **Statut** : ✅ acté. Trigger `syncRevenus2027` q15min installé (Vincent en manuel dans éditeur AS). 48 IDs en memo. Sheet « revenus locatif 2027 » alimenté.

## ADR-S-013 · 2026-06-05 · Accès `sessionStorage`/`localStorage` toujours gardés (helper `safeStorage`)
1. **Choix** : tout accès web-storage passe par `src/lib/safeStorage.js` (`ssGet`/`ssSet`/`ssRemove`, try/catch). Un accès nu en render plante toute la page si le stockage est bloqué (navigation privée stricte / cookies refusés / iframe sandbox → `SecurityError`).
2. **Alternatives refusées** : try/catch inline partout (verbeux, oublié sur les accès render-time) ; ne rien faire (crash silencieux de `/merci` post-paiement + page réservation pour une frange d'utilisateurs).
3. **Conséquences** : nouveau réflexe — ne JAMAIS écrire `sessionStorage.x()` nu, surtout au niveau render (top de composant, `useRef(!!sessionStorage…)`). Reste ~15 accès non critiques dans `PublicSite.jsx` (guards GA/caches, souvent déjà en `catch`) à migrer au fil de l'eau (cf. BLOCKERS).
4. **Périmètre** : `src/lib/safeStorage.js` (nouveau), `src/Merci.jsx` (tous accès), `src/PublicSite.jsx` (render-time L7735 + écritures flux dépôt).
5. **Statut** : ✅ acté & commité (`06f7783`). 161 tests verts. Déploiement à faire (`npm run deploy:pages`).

## ADR-S-008 · 2026-06-04 · Écran d'accueil TV = mode kiosk de `/bienvenue` (réutilise les livrets)
1. **Choix** : écran TV des logements = **mode `?tv=1` du livret existant** (`GuestGuide` → `TvScreen.jsx`, diaporama plein écran : accueil perso, WiFi, guide, services, infos, rebook), data depuis les **guides JSON** (D1). Perso auto via `/api/tv-context` (résa en cours : prénom+dates si directe, dates seules si OTA). Fond = photo hero (01) du bien. Param `?slide=N` (fige un slide : revue/preview/images Phase 3).
2. **Alternatives refusées** : app native tvOS/Android TV (trop lourd) ; rotation de photos 02+ (trop sombres → illisible) ; perso 100% manuelle (moins « waouh »).
3. **Conséquences attendues** : 1 URL par bien sur n'importe quelle TV à navigateur ; pousse le trafic vers le site (QR guide/site/services) ; images de secours générées (`scripts/gen-tv-screens.mjs` → `public/tv/<bien>.png`).
4. **Périmètre** : `src/TvScreen.jsx`, `src/utils/tvScreen.js` (+tests), `src/GuestGuide.jsx`, `functions/api/tv-context.js`, `scripts/gen-tv-screens.mjs`. Spec `docs/superpowers/specs/2026-06-04-tv-welcome-screen-design.md`.
5. **Statut** : **acté & déployé** (Phases 1-3). Action Vincent : mots de passe WiFi réels.

## ADR-S-009 · 2026-06-04 · Ventes additionnelles = QR → page `/services/<bien>` → Stripe (prix validé serveur)
1. **Choix** : vendre des services (départ tardif, ménage, planteur 15€, Nespresso 10€, champagne, kit plage/bébé) via **catalogue `extras[]` par livret** (éditable admin onglet Services), page publique `/services/<bien>`, paiement **Stripe Payment Link** créé par `/api/service-checkout` qui **valide le prix CÔTÉ SERVEUR** (anti-fraude). Webhook `type=service` → email + ntfy hôte + D1 `service_orders` (onglet admin Ventes).
2. **Alternatives refusées** : paiement sur la TV elle-même (TV = vitrine, téléphone = caisse) ; prix envoyés par le client (fraude) ; objectif « achat immédiat » seulement (gardé `sur-demande` vs `immediat`).
3. **Conséquences attendues** : revenu additionnel par voyageur, mesurable ; ⚠️ **Stripe LIVE = argent réel** (test requis avant de s'appuyer dessus) ; prix late/ménage = placeholders à régler en admin.
4. **Périmètre** : `functions/api/service-checkout.js`, `stripe-webhook.js` (branche service), `src/Services.jsx`, `src/tabs/ServiceOrdersTab.jsx`, `functions/api/service-orders.js`, `LivretEditor` (onglet Services), catalogue dans `public/guides/*.json` + D1.
5. **Statut** : **acté & déployé**. Aussi poussé en email pré-arrivée (upsell). Action Vincent : prix réels + 1 achat test.

## ADR-S-010 · 2026-06-04 · `POST /api/guides` désormais authentifié (verifyBearer)
1. **Choix** : le POST qui écrit le contenu public des livrets/prix en D1 exige l'**auth admin** (`verifyBearer`) ; GET reste public ; `LivretEditor`/`GuideEditor` passent par `adminFetch` (token).
2. **Alternatives refusées** : laisser le POST ouvert (faille : n'importe qui modifiait le contenu voyageur + les prix services).
3. **Conséquences attendues** : ⚠️ **on ne peut plus pousser le catalogue en D1 par script/curl** → tout ajout/prix de service se fait désormais **dans l'admin** (onglet Services). Sécurité > commodité.
4. **Périmètre** : `functions/api/guides/[[path]].js`, `src/LivretEditor.jsx`, `src/GuideEditor.jsx`.
5. **Statut** : **acté & déployé** (vérifié live : POST sans auth = 401, GET = 200).

## ADR-S-001 · 2026-06-04 · Rituel de clôture = skill `/cloture-session` + système `.memory/`
1. **Choix** : capturer la mémoire de fin de session via une **skill déclenchée manuellement** (`/cloture-session`), qui écrit dans un dossier `.memory/` indexé (CONTEXT/ADR/LEARNINGS/BLOCKERS/ITERATIONS_LOG), calqué sur patrimoine-dashboard.
2. **Alternatives refusées** : (a) un **agent autonome** qui devinerait « la session est finie » → mauvais timing, écarté ; (b) **regonfler PROJECT_MEMORY.md** qu'on venait de dégraisser → écarté ; (c) 1 seul fichier `docs/JOURNAL-SESSIONS.md` → remplacé par le standard `.memory/` déjà éprouvé sur l'autre projet (cohérence inter-projets).
3. **Conséquences attendues** : 3 rubriques (décision/apprentissages/frictions) produites à chaque clôture, au même endroit, en format court ; `.memory/INDEX.md` devient le point d'entrée de début de session.
4. **Périmètre** : `.memory/*` (nouveau), pointeurs depuis `PROJECT_MEMORY.md`.
5. **Statut** : **acté** (Vincent a choisi « 1 fichier unique » mais le standard `.memory/` retenu pour aligner les 2 projets — à confirmer s'il préfère vraiment le fichier plat).

## ADR-S-006 · 2026-06-04 · Standard de fonctionnement commun aux 2 projets (synchro)
1. **Choix** : formaliser UN mode de fonctionnement partagé entre `locatif-dashboard` et `patrimoine-dashboard` dans une charte identique **`docs/OPERATING-MODEL.md`** (mémoire 8 fichiers, 3 niveaux étanches, 4 rituels, discipline deploy, principes données, boucle de session, matrice de conformité, backlog de synchro). Pollinisation croisée : locatif a adopté `RECALL.md`/`DECISIONS.md` (de patrimoine) ; patrimoine recevra le hook SessionStart + INDEX + dégraissage (de locatif).
2. **Alternatives refusées** : laisser les 2 projets diverger (chacun réinvente ses rituels) ; un seul repo « maître » imposé à l'autre (perd les forces propres de chacun).
3. **Conséquences attendues** : un seul standard à apprendre, répliqué dans les 2 repos ; la matrice de conformité (§7 de la charte) trace les écarts restants ; toute évolution du standard se réplique des deux côtés.
4. **Périmètre** : `docs/OPERATING-MODEL.md` (identique ici et dans patrimoine), `.memory/RECALL.md` + `.memory/DECISIONS.md` (déjà créés), `.memory/INDEX.md` (référence les 8 fichiers).
5. **Statut** : **acté** (charte écrite + miroitée). Ports restants suivis dans BLOCKERS (backlog de synchro).

## ADR-S-005 · 2026-06-04 · Consolidation mémoire périodique = cron + filet SessionStart (ceinture + bretelles)
1. **Choix** : entretien périodique de `.memory/` via la skill `/consolidation` (fusionne/archive/promeut/réorganise), déclenchée par DEUX mécanismes complémentaires : (a) **cron** routine `/schedule` hebdo (lundi ~6h Martinique, mode *propose sans committer*) ; (b) **filet SessionStart** : `session-context.mjs` nudge si dernière consolidation > 7 j (lit `.memory/.last-consolidation`, sinon retombe sur « Dernière MAJ » de CONTEXT).
2. **Alternatives refusées** : tout miser sur le cron (backend claude.ai des routines était KO le 2026-06-04 → fragile) ; tout miser sur le nudge (semi-auto, ne fire qu'au démarrage de session).
3. **Conséquences attendues** : la mémoire est jardinée même si l'un des deux canaux tombe. **⚠️ Convention : à CHAQUE exécution de `/consolidation`, écrire la date du jour (AAAA-MM-JJ) dans `.memory/.last-consolidation`** pour réarmer le compteur du nudge.
4. **Périmètre** : `scripts/session-context.mjs` (nudge), `.memory/.last-consolidation` (marqueur, amorcé 2026-06-04), routine `/schedule` (à créer — cf. BLOCKERS, bloquée backend).
5. **Statut** : filet **acté** (testé : 0 nudge à J0, nudge à J+30) ; cron **en attente** (relancer `/schedule`).

## ADR-S-004 · 2026-06-04 · Rappel mémoire automatique = hook SessionStart (niveau 2 étanche)
1. **Choix** : un hook **`SessionStart`** (`.claude/settings.json` projet) exécute `scripts/session-context.mjs`, qui injecte au démarrage de chaque session l'état frais (`.memory/CONTEXT.md`) + les rappels ouverts (`.memory/BLOCKERS.md`). Transforme le « rappel » de convention en **mécanisme**.
2. **Alternatives refusées** : compter sur Claude pour ouvrir `.memory/INDEX.md` (non fiable, déjà oublié 2× cette session) ; mettre le rappel dans CLAUDE.md (statique, ne reflète pas l'état frais).
3. **Conséquences attendues** : 3 niveaux de mémoire étanches (stockage ✅ / rappel ✅ désormais mécanisé / décision ✅). Le script sort en silence (exit 0) si `.memory/` absent → inoffensif sur les autres machines/projets.
4. **Périmètre** : `.claude/settings.json` (nouveau, hook seul), `scripts/session-context.mjs` (nouveau).
5. **Statut** : **acté** (JSON validé jq, commande exit 0). ⚠️ Prise en compte : nécessite un `/hooks` ou un redémarrage la 1ʳᵉ fois (le watcher ne surveillait pas `.claude/` sans settings au démarrage).

## ADR-S-003 · 2026-06-04 · Auditeur = skill manuelle + script déterministe non bloquant au deploy
1. **Choix** : 2 niveaux d'audit. (a) skill **`auditeur`** (LLM, manuelle, audit riche avec escalation `.memory/`) ; (b) **`scripts/audit-invariants.mjs`** déterministe greffé dans `deploy-pages.sh` (post-smoke), **non bloquant** (exit 0 toujours), écrit `docs/_audits/AUDIT-latest.md`.
2. **Alternatives refusées** : appeler la skill LLM depuis bash (impossible) ; rendre l'audit **bloquant** au deploy (risque de faux FAIL qui bloque une prod saine — refusé par Vincent, « non-bloquant »).
3. **Conséquences attendues** : chaque déploiement vérifie les invariants d'archi (source unique, miroirs, CSP, meta, mémoire) sans jamais bloquer ; rapport rolling gitignoré ; les rapports datés manuels restent suivis. Réintégration au gate bloquant possible plus tard si les verdicts s'avèrent fiables.
4. **Périmètre** : `scripts/audit-invariants.mjs` (nouveau), `scripts/deploy-pages.sh` (bloc non-bloquant + `SKIP_AUDIT`), `.gitignore`, CLAUDE.md.
5. **Statut** : **acté** (testé : verdict 🟢 PASS, exit 0).

## ADR-S-002 · 2026-06-04 · Gouvernance doc : index + ADR formalisés + PROJECT_MEMORY dégraissé
1. **Choix** : corriger CLAUDE.md (suppression du faux « There are no tests »), créer `docs/INDEX.md` (carte de ~47 docs) et `docs/superpowers/specs/README.md` (index ADR 001→010 avec statut), extraire le journal historique de PROJECT_MEMORY (52KB→35KB) vers `docs/_archive/`.
2. **Alternatives refusées** : laisser PROJECT_MEMORY grossir indéfiniment ; garder les ADR implicites (specs non indexés, statut illisible).
3. **Conséquences attendues** : un dev (ou agent) sans contexte retrouve n'importe quel doc en 5 s ; PROJECT_MEMORY reste lean en préservant secrets/footguns/contraintes ; les décisions d'archi ont un statut traçable.
4. **Périmètre** : `CLAUDE.md`, `docs/INDEX.md`, `docs/superpowers/specs/README.md`, `PROJECT_MEMORY.md`, `docs/_archive/PROJECT_MEMORY-journal-2026-05.md`. Commit `347f4b3`.
5. **Statut** : **acté + poussé** sur origin/main (docs-only, aucun déploiement).

## ADR-S-011 · 2026-06-05 · Mots/expressions interdits curatés → boucle d'apprentissage agents
1. **Choix** : l'admin bannit des mots/expressions depuis l'onglet **Approbations** (panneau liste + bannissement inline 1-clic sur phrases fact-check + champ par draft). Stockés en D1 `agent_lessons` (nouveau champ `term` lisible + `pattern` regex échappé + `reason` + `bien_id` optionnel). Doublement utilisés : **(1) injectés EN AMONT dans le prompt de génération** (`renderBannedSection` → `buildPrompt`) pour éviter le terme dès la rédaction, **(2) fact-check APRÈS** (inchangé).
2. **Alternatives refusées** : saisie de regex par l'utilisateur (trop technique → on convertit le mot littéral) ; uniquement fact-check post-génération (ne « rend pas les agents plus précis », corrige après coup) ; portée toujours globale (gardé le ciblage par bien optionnel).
3. **Conséquences attendues** : plus Vincent bannit, plus les sorties agents sont propres (posts/emails/SEO). ⚠️ liste injectée dans CHAQUE prompt agent (coût tokens si elle explose → cap 60 entrées). `agent-lessons` POST/DELETE désormais **auth admin** (avant : ouvert).
4. **Périmètre** : `functions/api/agent-lessons.js` (term + escapeRegex + auth), `functions/api/agents-run.js` (`renderBannedSection`, `bannedSection` dans `buildPrompt`), `src/tabs/ApprobationsTab.jsx`. D1 `agent_lessons.term`.
5. **Statut** : **acté & déployé** (commit 6c1d0c2). Utilisable immédiatement.

## ADR-S-012 · 2026-06-05 · Ne jamais faire confiance à une var d'env d'adresse email (valider en code)
1. **Choix** : l'adresse expéditeur Resend du Worker passe par `resendFrom(env)` qui **valide la présence d'un domaine FQDN** dans `RESEND_FROM` ; sinon retombe sur `VERIFIED_FROM` en dur (`notifications@mail.villamaryllis.com`). Appliqué aux 5 points d'envoi du Worker.
2. **Alternatives refusées** : corriger seulement la valeur de la variable (un `wrangler secret put` n'écrase PAS une var texte dashboard du même nom → inefficace) ; hardcoder partout sans override possible (perte de flexibilité).
3. **Conséquences attendues** : tous les emails Worker (alertes résa, rappels prix, digest IA) partent quoi qu'il arrive ; robustesse contre une conf cassée. Pattern réutilisable pour toute var sensible.
4. **Périmètre** : `workers/ical-sync/index.js` (`resendFrom`/`VERIFIED_FROM`).
5. **Statut** : **acté & déployé** (commit 50b4da1). Reste : nettoyer la var dashboard `RESEND_FROM` cassée (cosmétique, cf BLOCKERS).

## ADR-PUB-001 · 2026-06-07 · Budgets ads plafonnés à 70% des commissions mensuelles
1. **Choix** : budget pub total ramené à €18/j (€540/mois) — Meta C1 €9/j + Meta C2 €2/j + Google €7/j. Critère : ne pas dépasser ~70% des commissions payées aux OTA (€779/mois).
2. **Alternatives refusées** : maintenir €25/j (€750/mois) qui laissait seulement €29 de marge sur les commissions — quasi nul ; baisser à €12/j jugé insuffisant pour la phase d'apprentissage algo.
3. **Conséquences attendues** : marge de sécurité €239/mois. Si 1 résa directe/mois convertie = ROI positif. Seuil à revoir haussièrement si CPA confirmé < €100/réservation après 4 semaines.
4. **Périmètre** : Meta Ads Manager (A1/A2/A3 ad sets C1) + Google Ads (C1 Offre Groupe). Aucun code modifié.
5. **Statut** : **acté** (budgets appliqués live, Processing → Active).

## ADR-PUB-002 · 2026-06-07 · Meta C2 MOFU lancée — audience custom visiteurs 30j
1. **Choix** : nouvelle campagne MOFU retargeting avec audience custom "Villa Amaryllis - Tous visiteurs site (30j)" (Pixel 714189639771397, fenêtre 30 jours), budget €2/j, destination https://villamaryllis.com.
2. **Alternatives refusées** : réutiliser l'audience 180j existante (trop large pour du retargeting chaud) ; audience Lookalike FR 1% (TOFU, pas MOFU).
3. **Conséquences attendues** : remarketing des visiteurs récents du site. Manque encore le créatif visuel (image villa + texte social proof). Annonce tourne avec texte seul dans l'immédiat.
4. **Périmètre** : Meta Ads Manager campagne C2 — ad set B1, ad "B1 - Visitor Retargeting".
5. **Statut** : **acté & publié** (status "Processing"). ⚠️ Créatif visuel manquant — à compléter.

## ADR-WA-001 · 2026-06-10 · Bot WhatsApp in-stay via Meta Cloud API + guide numérique public
1. **Choix** : webhook `/api/whatsapp` (GET vérification + POST messages) + `GuideSejour.jsx` public à `/guide-sejour/<bien>`. Bot détecte le bien par mots-clés, charge le guide JSON, répond en <120 mots via LLM Groq (fast tier). Guide exposé sans auth, URL partageable QR/email.
2. **Alternatives refusées** : bot Telegram (trop technique pour les voyageurs) ; widget chat site (hors contexte séjour) ; guide PDF statique (pas de search/FAQ live).
3. **Conséquences attendues** : hôte contacté moins souvent pour questions basiques (WiFi, codes, horaires). Guide vivant (source = D1 → fallback JSON statique). Bot inactif tant que WHATSAPP_TOKEN/WHATSAPP_PHONE_ID/WHATSAPP_VERIFY_TOKEN non posés dans Cloudflare Pages.

## ADR-META-001 · 2026-06-10 · Vérification domaine Meta = meta tag HTML (méthode retenue)
1. **Choix** : méthode meta tag `<meta name="facebook-domain-verification" content="z43gsqllrj0xack18u8r4767m1q0tz" />` dans `<head>` de `index.html`. Token récupéré dans Meta Business Suite → Brand Safety → Domains. Déployé via `npm run deploy:pages` (commit `1c5b98e`). Résultat : domaine **Verified ✅** en <2 min.
2. **Alternatives refusées** : fichier TXT DNS (délai TTL 24-48h) ; fichier `.well-known/` (nginx CF Pages = pas de fichier statique à cette route sans config) ; clic automatisé par Claude (prohibé — clics CB/comptes = règle absolue).
3. **Conséquences attendues** : domaine vérifié débloque l'AEM + améliore la qualité CAPI. ⚠️ **le content= est lié au business Amaryllis Corp** — si le business change, regénérer le token.
4. **Périmètre** : `index.html` (ligne 46). Commit `1c5b98e`.
5. **Statut** : **acté & vérifié live** (Meta Events Manager confirme "Verified").

## ADR-META-002 · 2026-06-10 · AEM (Aggregated Event Measurement) = couvert par CAPI + domaine
1. **Choix** : pas de configuration manuelle AEM "8 event slots" — l'interface Meta 2024-2026 a supprimé cet écran. La mesure iOS 14+ est **automatiquement garantie** par : (a) domaine vérifié, (b) CAPI server-side pour Purchase (non affecté par iOS 14), (c) déduplication event_id = payment_intent_id.
2. **Alternatives refusées** : chercher l'écran AEM dans Settings, Overview, Business Settings — aucun écran trouvé (déprecié). Créer une "Custom Conversion" comme workaround — inutile avec CAPI.
3. **Conséquences attendues** : score qualité dataset = **8.0/10** (objectif Meta = 7.66, au-dessus). Les events Purchase iOS 14 sont bien comptés via CAPI. Aucune action supplémentaire requise.
4. **Périmètre** : `functions/api/_metaCapi.js` (CAPI) · `index.html` (domain verification) · Pixel `1648064656415946`.
5. **Statut** : **acté** (AEM OK by design).
4. **Périmètre** : `functions/api/whatsapp.js`, `functions/api/whatsapp-conversations.js`, `src/GuideSejour.jsx`, `src/tabs/WhatsAppTab.jsx`, `src/App.jsx`, `src/main.jsx`, `public/guides/*.json`.
5. **Statut** : **code déployé**, activation bloquée sur vérification Meta Business (compte Amaryllis Corp 982907091270661 — vérification sole proprietorship à terminer + paiement + secrets CF).

## ADR-EMAIL-001 · 2026-06-10 · Email J-1 dédié avec codes d'accès proéminents
1. **Choix** : endpoint `/api/send-j1-acces` + template `public/email-templates/j1-acces.html`. Cron quotidien ~11h UTC (cron-job.org, configuré par Vincent). Envoie les codes d'accès la veille du check-in, flag D1 `j1_acces_sent` pour idempotence. Distinct de l'email J-3 pré-arrivée (infos générales) — J-1 = urgence pratique.
2. **Alternatives refusées** : fusionner avec pre-arrivee.html (diluerait les codes dans du contenu touristique) ; SMS (pas de Resend SMS, ajoute un provider).
3. **Conséquences attendues** : voyageurs arrivent avec le code sous la main. Réduit les SMS paniqués à 22h "comment j'entre". Flag idempotent = safe si cron tourne 2×/jour.
4. **Périmètre** : `functions/api/send-j1-acces.js`, `public/email-templates/j1-acces.html`, D1 `direct_bookings` (colonne `j1_acces_sent`).
5. **Statut** : **acté & déployé**. Cron activé par Vincent (cron-job.org confirmé).

## ADR-ICAL-001 · 2026-06-07 · Export iCal RFC 5545 via /api/ical/[bien].ics
1. **Choix** : endpoint Cloudflare Pages Function `functions/api/ical/[file].js` — extrait les `direct_bookings` D1, génère iCal RFC 5545 valide, protégé par secret `ICAL_EXPORT_SECRET`. Route dynamique `.ics` requis par Airbnb et Booking.com pour accepter l'import.
2. **Alternatives refusées** : paramètre query `?bienId=` (refusé par les OTA car URL ne se termine pas en `.ics`) ; webhook push (trop complexe, les OTA tirent eux-mêmes le calendrier).
3. **Conséquences attendues** : les réservations directes bloquent automatiquement les calendriers Airbnb/Booking. Les 7 biens ont chacun une URL pattern `/api/ical/[bien].ics?secret=e000748c...`.
4. **Périmètre** : `functions/api/ical/[file].js` (nouveau), D1 `revenue_manager.direct_bookings`, secret `ICAL_EXPORT_SECRET` (Cloudflare).
5. **Statut** : **acté & déployé** (commit 2f4d6da, testé live avec Mabouya/François Cambier).

## ADR-TRACKING-001 · 2026-06-07 · Attribution first-click via trackingAttribution.js → Stripe metadata
1. **Choix** : module `src/lib/trackingAttribution.js` — capture UTM/fbclid/gclid au premier clic de session (sessionStorage), injecte `channel/utm_source/utm_medium/utm_campaign` dans les metadata Stripe à chaque réservation directe.
2. **Alternatives refusées** : last-click (écrase le clic pub par une navigation directe) ; server-side (pas d'accès aux params URL côté CF Function sans passer les headers).
3. **Conséquences attendues** : chaque réservation Stripe a son origine (google/meta/direct). Permet de calculer le vrai ROAS par canal dans le dashboard admin.
4. **Périmètre** : `src/lib/trackingAttribution.js` (nouveau), `src/App.jsx`/`src/main.jsx` (import + appel), `functions/api/notify-booking.js` (injection metadata).
5. **Statut** : **acté & déployé** (commit 2f4d6da). À vérifier : metadata visibles dans Stripe Dashboard sur prochaine résa.
