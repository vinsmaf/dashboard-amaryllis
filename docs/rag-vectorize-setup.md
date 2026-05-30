# RAG Vectorize (#2) — marche à suivre

> Objectif : ancrer les agents dans tes **vraies données** (avis Airbnb/Google, guides, drafts passés)
> via une base vectorielle → ils *citent* au lieu d'inventer.

---

## ✅ Étape 1 — Index Vectorize (DÉJÀ FAIT par Claude)
```
amaryllis-knowledge · 1024 dimensions · cosine
```
Embeddings : `@cf/baai/bge-m3` (multilingue, 1024 dims) via Workers AI — utilise `CF_AI_TOKEN` déjà en place. **Aucun token à créer.**

---

## 👉 Étape 2 — Ajouter le binding Vectorize (TOI, ~2 min, dashboard)
Le binding ne peut pas se faire en ligne de commande pour un projet **Pages**.

1. Cloudflare dashboard → **Workers & Pages** → **Pages** → projet **`dashboard-amaryllis`**.
2. Onglet **Settings** → section **Bindings** (ou **Functions** → **Vectorize bindings** selon l'UI).
3. **Add binding** → type **Vectorize** :
   - **Variable name** : `VECTORIZE`  *(exactement, en majuscules)*
   - **Vectorize index** : `amaryllis-knowledge`
4. **Save**.
5. (Important) Le binding ne s'active qu'au **prochain déploiement** → **dis-le moi**, je lance `npm run deploy:pages`.

> Si tu vois aussi une option « Workers AI binding », ce n'est PAS nécessaire (j'utilise l'API REST avec `CF_AI_TOKEN` pour les embeddings).

---

## 🤖 Étape 3 — Ce que je code ensuite (dès que le binding est posé)
1. **`/api/rag-ingest`** : récupère tes sources (avis Google via l'API déjà branchée, guides `public/guides/*`, drafts passés) → découpe en passages → embeddings `bge-m3` → insère dans Vectorize avec métadonnées (source, bien, date).
2. **Helper `ragSearch(env, query, k)`** : embed la requête → `env.VECTORIZE.query()` → renvoie les k passages les plus proches.
3. **Branchement agents** : injection d'un bloc « 📚 DONNÉES RÉELLES (extraits vérifiés) » dans le prompt des agents *content* (community-manager, seo-content-writer, voyageur-research, crm) → ils s'appuient sur de vrais verbatims.
4. **Cron d'ingestion** (hebდo) pour garder la base à jour.

Puis je **teste en réel** (ingestion + une requête de retrieval) avant de committer.

---

## Récap
| Étape | Qui | Statut |
|---|---|---|
| 1. Créer l'index | Claude | ✅ fait |
| 2. Binding `VECTORIZE` (dashboard) + me prévenir | **Toi** | ⏳ |
| 3. Redéploiement | Claude | après #2 |
| 4. Code ingestion + retrieval + branchement agents | Claude | après #2 |
| 5. Ingestion + test | Claude | après #2 |
