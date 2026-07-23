# LEARNINGS — Enseignements réutilisables (locatif-dashboard)

> **Splitté par thème le 2026-07-04** (consolidation mémoire — 843 lignes/174 entrées, 2× le seuil
> recommandé). Le contenu détaillé vit désormais dans `learnings/*.md`. Ce fichier est un
> **pointeur** — toute référence externe à "LEARNINGS.md" (RECALL.md, etc.) reste valide,
> elle route juste vers le bon sous-fichier ci-dessous.
> Le journal d'erreurs exhaustif reste `../docs/ERREURS-LOG.md`.

## 2026-07-23 — Doctrines métier codées (mix créatif, mesure pub, promo)

- **Une règle anti-biais ne peut PAS vivre dans le prompt du LLM.** La discipline 30/20/50 corrige un biais (« on sur-investit dans le neuf ») que le modèle partage avec l'humain. Lui demander de s'en souvenir, c'est demander au biais de se surveiller lui-même. La règle doit être **calculée en code** sur l'historique réel, et **imposée** au prompt. Vaut pour toute doctrine qui contredit un réflexe naturel du modèle.
- **Une « itération » répétée à l'identique EST une duplication.** En codant le 30/20/50, la 1ʳᵉ version tirait l'élément à varier depuis un hash du seul `concept_id` → itérer 2× le même concept donnait 2× la même consigne. Corrigé en indexant aussi sur le rang d'itération. Leçon : quand une règle dit « varie UN élément », vérifier que deux applications successives ne produisent pas la même sortie.
- **Un test bien écrit attrape une faille de RAISONNEMENT, pas juste un bug.** Le test « MER < 1 → non rentable » a échoué parce que ma chaîne de verdicts testait `LTV/CAC >= 3` en premier : un LTV flatteur écrasait une trésorerie négative. Corrigé par un verdict dédié `payback_differe`. Écrire le test AVANT de faire passer le code aurait donné le même résultat plus vite.
- **Vérifier le contrat de retour d'un helper partagé, ne pas le supposer.** `rateLimit()` renvoie `{ok}` ; j'ai lu `rl.allowed` → `undefined` → **tout POST du questionnaire repartait en 429**. Ni les tests (aucun ne couvrait ce chemin) ni un déploiement vert ne pouvaient le voir. C'est le **clic réel dans le navigateur** qui l'a sorti. Corollaire : sur un endpoint public tout neuf, faire au moins un aller-retour réel avant de le déclarer livré.
- **Sonder le vrai compte plutôt que supposer un nom d'API.** Pour le breakdown Meta « segment d'audience », j'ai construit la logique pure d'abord (indépendante du nom du champ), puis prévu de sonder le compte réel. Le déploiement a bloqué avant la sonde → le nom `user_segment_key` reste **non vérifié**. Ne pas le tenir pour acquis à la reprise.
- **Rejouer TOUTES les étapes de la CI en local, pas seulement les tests.** J'ai poussé du code cassé 3 fois de suite en croyant la CI défaillante : `vitest` et `npm run build` **ne parsent jamais `functions/`**, seul `npx wrangler pages functions build --outdir /tmp/fn-build` le fait. C'était la seule étape que je n'avais pas rejouée. À lancer systématiquement avant tout push touchant `functions/`.
- **Jamais de backtick à l'intérieur d'un `*_DIGEST`.** Ces constantes sont des template literals ; un backtick imbriqué (autour d'un chemin, d'un endpoint) referme la chaîne et casse le fichier. Utiliser des guillemets, ou rien.
- **Quand un pipeline « identique » marche d'un côté et pas de l'autre, la cause est dans le dépôt, pas dans l'infra.** C'est la remarque de Vincent (« côté patrimoine il n'y a pas ce souci ») qui a fait tomber mon faux diagnostic en une phrase. Réflexe à garder : avant d'accuser une plateforme, chercher ce qui diffère entre les deux cas.
- **Un garde-fou qui bloque n'est pas une panne.** J'ai ouvert un blocker 🔴 « CI bloquée » alors que la CI refusait — correctement — de déployer du code qui ne compile pas. Quand quelque chose refuse de passer, l'hypothèse par défaut doit être « il a raison », pas « il est cassé ».
- **Chiffrer une doctrine avec les VRAIS chiffres change la conclusion.** La règle « une promo de -20 % coûte -33 % » suppose une marge de 60 %. Sur la marge de contribution directe réelle d'Amaryllis (**93,4 %**, `/api/pnl-sejour`), -15 % ne comprime que 16 %. Le risque réel n'est donc pas arithmétique ici mais comportemental/algorithmique. Toujours passer une règle générale dans les données du projet avant d'en tirer une reco.


## → Voir [`learnings/INDEX.md`](./learnings/INDEX.md)

| Thème | Fichier |
|---|---|
| Revenus & Pricing (GAS/Worker/RM) | [learnings/REVENUS-PRICING-GAS.md](./learnings/REVENUS-PRICING-GAS.md) |
| Déploiement Cloudflare | [learnings/DEPLOIEMENT-CF.md](./learnings/DEPLOIEMENT-CF.md) |
| UI, Frontend & SEO | [learnings/UI-FRONTEND-SEO.md](./learnings/UI-FRONTEND-SEO.md) |
| Automation Navigateur & Outils | [learnings/AUTOMATION-NAVIGATEUR.md](./learnings/AUTOMATION-NAVIGATEUR.md) |
| Méthodologie & Process | [learnings/METHODOLOGIE-PROCESS.md](./learnings/METHODOLOGIE-PROCESS.md) |
| Tracking, Analytics & Ads | [learnings/TRACKING-ANALYTICS-ADS.md](./learnings/TRACKING-ANALYTICS-ADS.md) |
| Stripe & Paiements | [learnings/STRIPE-PAIEMENTS.md](./learnings/STRIPE-PAIEMENTS.md) |
| Agents IA & LLM | [learnings/AGENTS-IA-LLM.md](./learnings/AGENTS-IA-LLM.md) |
| D1 & Sécurité | [learnings/D1-SECURITE.md](./learnings/D1-SECURITE.md) |
| Intégrations OAuth & Email | [learnings/INTEGRATIONS-OAUTH-EMAIL.md](./learnings/INTEGRATIONS-OAUTH-EMAIL.md) |

## Convention
- **Nouvelle leçon → directement dans le fichier thématique concerné**, jamais ici.
- Si aucun thème ne convient → `learnings/METHODOLOGIE-PROCESS.md` (catch-all discipline/process).
- Si un fichier thématique dépasse ~400 lignes → re-scinder (sous-thème ou période).
