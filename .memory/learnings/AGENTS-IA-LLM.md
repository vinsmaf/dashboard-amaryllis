# Agents IA & LLM — Learnings locatif-dashboard

> Fleet agents, editorial/fact-check, routage LLM/AI-Ops
> Extrait de `../LEARNINGS.md` le 2026-07-04 (consolidation mémoire — split thématique).
> 11 entrées, triées par date décroissante.

## 🔴 Un LLM en sortie JSON structurée peut inclure un item tout en écrivant dans son propre champ qu'il ne devrait PAS être inclus — 2026-07-04
- **Piège trouvé en dry-run** (avant mise en prod) : `agents-triage.js` demandait au LLM un tableau JSON `[{id, reason}]` des items à bloquer. Résultat observé : certains items apparaissaient bien dans le tableau, mais avec un `reason` du type "pas de problème ici" / "mais pas exactement, donc pas de blocage" — le modèle exprime le doute dans le TEXTE tout en laissant l'item dans la liste "à bloquer" structurellement. Un parsing naïf (`if (item.id && item.reason) → bloquer`) aurait donc appliqué des blocages que le LLM lui-même jugeait incorrects.
- **La prochaine fois** : pour toute extraction JSON structurée d'un LLM qui classe/filtre des éléments, ajouter un filtre défensif POST-parsing qui rejette les entrées dont le champ texte contient des marqueurs de hedging/contradiction ("pas de problème", "pas de blocage", "correct ici", "légitime ici", etc.) — ne jamais faire une confiance aveugle à la présence structurelle dans le tableau. Combiner avec un garde-fou de proportion (si le LLM classe >X% du lot dans une catégorie à fort impact, c'est probablement un dérapage → tout annuler plutôt qu'appliquer).

## 🎯 Le plan AI-Ops (D1) prime TOUJOURS sur `MODELS` statique de `_llm.js` — 2026-07-01
`callLLM()` résout le modèle via `opts.model || plan.models?.[providerId]?.[tier] || MODELS[providerId]?.[tier]` — le plan D1 (construit par `/api/ai-ops` via discovery live + `RANK` de `ai-ops.js`) **écrase toujours** le fallback statique. Corriger `MODELS.groq` dans `_llm.js` après une dépréciation provider est nécessaire (filet de sécurité si le plan est absent/périmé) mais **insuffisant seul** — si le plan D1 existant référence encore l'ancien modèle, il continue à être utilisé jusqu'au prochain refresh (auto si `age_h > 20`, ou manuel `POST /api/ai-ops?secret=...&action=refresh`). **Réflexe après toute dépréciation Groq/provider : (1) corriger `RANK` dans `ai-ops.js` (retire l'entrée dépréciée) ET `MODELS` dans `_llm.js`, (2) forcer un refresh du plan, (3) vérifier `GET /api/ai-ops?secret=...` que le plan ne référence plus l'ancien modèle.** Vécu 2026-07-01 : `medium` pointait encore vers `llama-3.3-70b-versatile` dans le plan D1 malgré la correction statique, jusqu'au refresh manuel.

## 🎯 `GROQ_MODELS` dans `agents-run.js` = code mort, ne pas le confondre avec le vrai routage — 2026-07-01
`functions/api/agents-run.js` déclare son propre tableau `GROQ_MODELS` (ligne ~413) qui n'est **référencé nulle part ailleurs dans le fichier** — vestige d'une ancienne implémentation. Le routage réel passe par `_llm.js` → `callLLM()` avec `AGENT_TIERS` (tier par agent) + `AGENT_PREFERRED_PROVIDER` (provider préféré par agent, ex: `community-manager` → `mistral` pour la qualité FR, PAS Groq) + `MODELS`/plan AI-Ops (modèle par tier). Avant de corriger un modèle dans `agents-run.js`, vérifier s'il est réellement consommé (`grep -n "GROQ_MODELS"`) — sinon la correction est cosmétique, sans effet.

## 🤖 noindex = double couche (prerender statique + runtime Functions) — 2026-06-29
- **Piège** : CF Pages Functions exécute `injectMeta()` à chaque requête et peut écraser un `<meta robots>` injecté uniquement par prerender.
- **La prochaine fois** : tout meta critique (noindex, canonical) = injecté dans les DEUX couches. Sinon survivance non garantie selon le chemin de serving CF Pages.

## 📸 Editorial : le brief LLM DOIT imposer l'imageUrl EXACTE, pas un hint — 2026-06-27
- **Piège vécu (3j)** : les briefs disaient "utilise une vraie photo de ce bien" → le LLM inventait des URLs plausibles mais inexistantes (`/images/schoelcher-vue-panoramique.jpg` au lieu de `/photos/schoelcher/01.webp`) → Meta rejetait avec "image not found".
- **La prochaine fois** : dans tout brief générant un draft social_post, inclure `RÈGLE ABSOLUE : imageUrl DOIT être EXACTEMENT "https://villamaryllis.com/photos/{bien}/01.webp"` — le LLM doit copier-coller, pas interpréter. En plus, post-processing : après génération, vérifier/corriger l'imageUrl en D1 avant d'approuver.

## 🔍 Fact-check : les patterns D1 `agent_lessons` doivent avoir des word boundaries \b — 2026-06-27
- **Piège vécu** : pattern `villa` (sans `\b`) stocké dans `agent_lessons` pour `schoelcher` bloquait aussi `villamaryllis.com` dans les URLs des captions. Le domaine contient "villa" mais ce n'est pas l'intention de la règle.
- **La prochaine fois** : tout pattern d'interdiction de mot isolé = `\bvilla\b`, `\bapartement\b`, etc. (word boundaries). Vérifier via un test regex avant d'insérer dans `agent_lessons`. Et : `factCheckCaption()` strip maintenant les URLs avant de checker (même protection côté code).

## 🤖 Recos agents ignorées : toujours envoyer le "pourquoi" à l'agent — 2026-06-25
- **Règle** : quand on ignore une reco d'agent, relancer cet agent avec un `brief` expliquant pourquoi → il apprend et affine ses prochaines recos.
- **Format brief** : "RECO IGNORÉE [id] : [action]. RAISON : [pourquoi ignorée]. CONTEXTE ACTUEL : [ce qui existe déjà ou pourquoi c'est inadapté]. Génère une reco plus précise/pertinente ou confirme qu'il n'y a rien à faire."

## 🤖 Hallucinations agents backlog : croiser avec biens.js avant d'implémenter — 2026-06-23
- **Piège vécu** : agent seo-026 avait proposé "Location villa avec piscine à Schœlcher" — Schœlcher est un **appartement sans piscine**. Implémentation directe = mensonge voyageur.
- **La prochaine fois** : tout item agent qui mentionne un équipement/type/bien → vérifier `src/data/biens.js` avant d'exécuter. Marquer `bloqué` avec note si hallucination détectée.

## 🤖 Registre agents : fleet + interactive doivent rester synchronisés — 2026-06-21
- **Piège** : 11 agents existaient dans la fleet (`agents-run.js`) mais n'avaient pas de fiche `~/.claude/agents/*.md` → impossibles à convoquer en session par nom ; le registre dans ORG.md signalait "fleet only pour l'instant" mais ça crée une dette invisible.
- **La prochaine fois** : quand on crée un agent fleet → créer la fiche interactive en même temps. Les deux registres (fleet + `~/.claude/agents/`) DOIVENT rester synchronisés. L'ORG.md est le single source of truth.

## 2026-06-21 — Reels IG+FB, pipeline auto-pub

- **IG Reels timeout ≠ échec définitif** : Meta prend jusqu'à 60s pour encoder une vidéo côté serveur ; CF Pages timeout = 30s → le container est créé MAIS le polling expire avant `FINISHED`. Solution : stocker le `container_id` dès l'étape 1 dans le résultat D1 ; au retry, appeler `publish_container` directement (container déjà encodé entre temps). Ne JAMAIS recréer le container à chaque tentative.
- **FB Reels = endpoint séparé** : `POST /{page-id}/video_reels` (pas `/{pageId}/feed`, pas `/{igId}/media`). Corps : `{ video_url, description, title, published }`. Distinct des posts photo/texte FB. `META_PAGE_ID` requis (déjà dans les secrets).
- **Dual-gate serveur-à-serveur** (confirmé) : `social.js POST` accepte Bearer admin OU `?secret=POSTSTAY_SECRET`. Quand `agent-drafts.js` appelle `/api/social` en interne, passer `?secret=` — le Bearer ne se propage pas entre Functions CF.
- **Fenêtre auto-publish : mettre ≥30j, idéalement 90j** — une fenêtre de 14j laisse silencieusement orphelins tous les drafts `approved` planifiés > 14j en arrière (typique après backlog ou pause). Symptôme : cron tourne mais ne publie rien. Diagnostic : simuler la query de sélection D1 manuellement.
- **`callLLM` retourne `{ok, text}` jamais une string** — ne JAMAIS écrire `captionRes.trim()` ou `captionRes.split()` directement sur le résultat. Toujours `captionRes.text.trim()` après avoir vérifié `captionRes.ok`.

- **`rebuildRevenus2026_` = DESTRUCTIF si le Sheet contient des données mixtes (système + manuel).** La fonction zéro TOUTES les lignes data des colonnes cibles AVANT de re-appliquer depuis les onglets source. Toute donnée saisie manuellement hors des onglets source (Airbnb historique, corrections, données hors-système) est définitivement perdue. **La prochaine fois : NE JAMAIS faire de zéro global sans avoir exporté une copie du Sheet.** L'alternative safe = trigger `syncRevenus2026` (mémo-based = incremental, jamais destructif).

- **Le trigger `syncRevenus2026` (15 min) est la seule voie safe pour les incréments.** Il utilise le mémo `rev2026_traites` pour ne traiter que les résas nouvelles, jamais les existantes. Il ne touche jamais les cellules qui n'ont pas de delta à appliquer. Utiliser TOUJOURS cette voie pour les nouveaux enregistrements ; la fonction rebuild est réservée à un reset total sur données 100% système.

- **Avant tout rebuild rétroactif sur un Sheet Google, demander : "ces données viennent-elles toutes d'un onglet source ?"** Si la réponse est "non" (données manuelles, corrections, imports externes), un rebuild qui zéro+reapply va détruire les données orphelines sans avertissement.

## 📣 Auto-publication réseaux — pièges du fact-check & du pipeline — 2026-06-15 (soir)
- **Le `META_PAGE_TOKEN` publie bien FB+IG** (`pages_manage_posts` / `instagram_content_publish` présents) MALGRÉ la régénération du matin pour le bot social — vérifié par un VRAI test de publication (post Bellevue id FB `986487064137992`). `debug_token` sur un **page token** renvoie `scopes:[]` (non concluant) → le seul test fiable des droits de publication = publier réellement. Ne jamais conclure « token ne peut pas publier » sans test live.
- **Le hashtag `#AmaryllisLocations` est un faux-positif systématique** pour toute règle fact-check `équipement.*amaryllis` (cascade/piscine + le mot « amaryllis » du hashtag de marque). Fix : **stripper les hashtags** (`/#[^\s#]+/g`) AVANT d'appliquer les règles factuelles — les hashtags sont du marketing, pas des affirmations.
- **Fact-check générique = aveugle au bien → faux positifs.** « piscine à débordement » est VRAI pour Amaryllis mais la règle flaguait tout. Solution : passer le `bienId` à `factCheckCaption(caption, rules, bienId)` + 2 mécaniques : `okFor:[biens]` (équipement légitime → skip) et `onlyFor:[biens]` (règle ciblée, ex « quatre suites » faux seulement pour amaryllis=3ch). Le `bienId` se dérive de l'imageUrl `/photos/{bien}/`.
- **Les mots bannis par bien (`agent_lessons.bien_id`) fuyaient en global** : `loadLearnedLessons` chargeait `pattern,reason` SANS `bien_id` → un « villa » banni pour Schœlcher bloquait TOUS les posts (dont Amaryllis qui EST une villa). Fix : charger `bien_id` → `rule.onlyFor=[bien_id]`. **Tout filtre/ban contextuel doit propager son scope bien jusqu'au point d'application**, sinon faux positifs massifs. Validé end-to-end : post Amaryllis frais score 88 → gate PASS → auto-approuvé en live (pipeline prouvé).
- **Les drafts « approved » ne repassent PAS le gate** (le cron `runEditorialAutoPublish` publie les approved tels quels). Donc tout post approuvé AVANT la mise en place du gate peut être faux. **Défense en profondeur indispensable** : remettre le fact-check BLOQUANT au point de passage unique = `executeDraft`/action publish dans `agent-drafts.js` (toute publication le traverse : cron, manuelle, gate).
- **Nomenclature villas (règle métier confirmée Vincent)** : SEULES Villa Amaryllis ET Villa Iguana sont des « villas ». Zandoli/Géko/Mabouya/Schœlcher(Bellevue)/Nogent ne le sont pas → règle `\bvillas?\b` onlyFor ces 5 biens.
- **CF Pages : un secret/var posé via `wrangler pages secret put` n'est actif qu'APRÈS un redéploiement** (vu avec `EDITORIAL_GATE_MODE` : resté shadow jusqu'au redeploy). Toujours redéployer après avoir posé une var Pages.
- **`handleSeed30Days` est idempotent** (anti-doublon sur dates déjà planifiées + exclut Iguana) → le re-seeder chaque jour à partir d'aujourd'hui maintient un horizon glissant 30j sans doublon = auto-reseed trivial.

## 🤖 Réseau d'agents : boucles d'autonomie — pièges rencontrés — 2026-06-15
- **`agent_memory` est injectée dans le prompt** (`buildPrompt` memorySection, agents-run.js) → écrire une clé dans `agent_memory(agent=<id>)` = le faire lire à l'agent au run suivant. C'est le canal de feedback le plus simple (utilisé pour `eval_feedback`). Le bus inter-agents = même mécanique avec `agent='_shared'`.
- **Sélection des sorties à évaluer : 1 par agent, pas les N plus récentes.** community-manager génère ~12 drafts/jour → il monopolisait les 25 places de `agents-eval` (les autres agents jamais notés). Fix : `JOIN (SELECT source, MAX(id) ... GROUP BY source)` → dernière sortie de CHAQUE source.
- **Batch d'éval : ordonner DESC + garde anti-écrasement.** En traitant plusieurs sorties du même agent dans un batch (ordre DESC), une vieille bonne note **supprimait** la correction d'une sortie récente faible. Fix : `Set` des agents déjà traités → seule la sortie la plus récente fait foi (vu en prod : feedback=1 puis effacé dans la même passe).
- **`no-empty` ESLint accepte un bloc avec commentaire.** Tout `catch {}` vide = +1 erreur lint → bloque le deploy (gate delta). Toujours mettre `catch { /* raison */ }`. Idem nouveau fichier : il part d'un baseline 0, donc 0 erreur tolérée.
- **Émettre un signal/donnée structurée d'un agent = champ JSON explicite, pas du parsing de prose.** On a ajouté un champ `signal` optionnel au schéma de sortie (parsé via `parsed.signal`), fiable et additif (absent = rien ne casse).
