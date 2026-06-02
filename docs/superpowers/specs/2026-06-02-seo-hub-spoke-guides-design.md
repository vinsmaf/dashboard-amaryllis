# Design — Programme SEO « Hub & Spoke » pour les guides (villamaryllis.com)

**Date :** 2026-06-02
**Auteur :** Claude (brainstorming autonome avec Vincent)
**Objectif (validé) :** renforcer le référencement naturel via les guides, en servant **les 3** buts à la fois : (1) convertir le trafic guides → réservations directes, (2) maximiser le volume organique, (3) dominer le local commercial « location villa Sainte-Luce/Martinique ».
**Approche retenue :** A — autorité topique « hub & spoke », séquencée **technique → maillage → enrichissement → (nouveaux contenus en lots suivants)**.

---

## 0. Contexte (état réel, juin 2026)

- Trafic organique faible (GA4 30 j) : accueil 90 sessions, fiches biens (amaryllis 65, geko 26, zandoli 20), **guides quasi nuls** (/guide 10, /guide-sainte-anne 3, /activites-sainte-luce 2). « Famine de trafic » (cf. `docs/strategie/plan-ceo-2026-06.md`).
- ~19 guides/landings prérendus, 51 URLs au sitemap.
- **Footgun SEO #1 (impératif) :** le `<title>`/`meta`/`og`/JSON-LD des slugs interceptés existe à DEUX endroits ; **`functions/[slug].js` (HTMLRewriter runtime) fait foi** et écrase `scripts/prerender.mjs`. Slugs interceptés aujourd'hui : 7 biens + `guide`, `guide-le-diamant`, `guide-sainte-anne`, `villa-rental-martinique`, `activites-sainte-luce`, `guide-proximite`. **Les autres guides n'ont PAS de meta runtime** → dépendent du prerender (baseline) uniquement.
- Cibles SEO projet : **title ≤ 60c**, **meta description ≤ 158c**.
- Source de vérité des faits biens : `functions/api/_biens.js` (capacités, équipements, nomenclature « villa » = Amaryllis + Iguana uniquement).
- Guides = composants React volumineux (`Guide.jsx` 895 l., `GuideExplorer.jsx` 1078 l., `GuidePlongee.jsx`, `GuideDistilleries.jsx`, `GuideSeminaires.jsx`…). Routing manuel dans `src/main.jsx` (liste `KNOWN`).

---

## 1. Architecture en clusters (silos thématiques)

Quatre hubs ; chaque hub lie ses guides satellites **et** les biens du même secteur (autorité topique + maillage cohérent, un silo = une intention dominante).

| Hub | URL hub | Guides satellites (spokes) | Biens du cluster |
|---|---|---|---|
| **Sainte-Luce (Sud)** | `/sainte-luce-martinique` | `plus-belles-plages-sud-martinique`, `activites-sainte-luce`, `guide-distilleries-martinique`, `guide-gastronomie-martinique`, `meilleure-saison-martinique` | Amaryllis, Zandoli, Géko, Mabouya |
| **Sud / Diamant & nature** | `/guide-le-diamant` | `guide-plongee-martinique`, `guide-randonnees-martinique`, `guide-sainte-anne`, `guide-arlet` | Villa Iguana |
| **Organiser son séjour** (transversal) | `/guide-hub` | `meilleure-saison-martinique`, `reservation-directe-martinique`, `guide-trois-ilets`, `guide-saint-pierre-martinique`, `guide-francois-martinique` | tous (selon contexte) |
| **Nogent (IDF)** | `/guide-nogent-sur-marne` | (à étoffer en lot suivant) | Appartement Nogent |

Règle de maillage : chaque **fiche bien** lie 2-3 guides de son cluster ; chaque **guide** lie 1-2 biens de son cluster + son hub. Pas de lien inter-silo gratuit (préserver la cohérence thématique).

---

## 2. Fondation technique (priorité 1)

### 2.1 Meta runtime pour TOUS les guides
- Étendre l'objet `SEO`/constantes `GUIDE_*` de `functions/[slug].js` pour couvrir les **~14 guides aujourd'hui sans meta runtime** (titre ≤60c, desc ≤158c, og:title/description/image, canonical).
- Ajouter les slugs concernés à la liste d'interception de `functions/[slug].js`.
- Tenir `scripts/prerender.mjs` **cohérent** (mêmes title/desc) pour la baseline crawler et les routes non interceptées.
- **Vérif live obligatoire** après deploy : `curl -s https://villamaryllis.com/<slug> | grep -oE "<title>[^<]*</title>"`.

### 2.2 Données structurées (JSON-LD)
- **Guides** : `Article` (headline, datePublished/Modified, author=Amaryllis Locations, image) + `FAQPage` (3-6 Q/R réelles) ; `HowTo` si le guide est procédural.
- **Fiches biens** : `VacationRental`/`LodgingBusiness` + `LocalBusiness` avec **NAP cohérent** (identique aux fiches GBP) ; conserver l'`AggregateRating` existant (déjà présent, bug `rating.replace` corrigé le 02/06).
- **Partout** : `BreadcrumbList` (hub > guide ; ou accueil > bien).
- Implémentation : un helper unique de génération JSON-LD (éviter la duplication entre prerender et runtime ; centraliser).

### 2.3 Images & sitemap
- ALT descriptifs (lieu + sujet) sur les images de guides ; OG image dédiée par hub/guide.
- `scripts/prerender.mjs` (génération sitemap) : `priority`/`lastmod` cohérents, hubs en priorité haute.

---

## 3. Maillage interne systématique

- **Composant réutilisable `<MaillageCluster slug=… />`** (nouveau, `src/components/seo/MaillageCluster.jsx`) :
  - lit une **table de clusters** centralisée (`src/data/seoClusters.js`) : slug → { hub, guides[], biens[] } ;
  - rend deux blocs en bas de page : « À lire aussi » (guides du cluster) + « Où loger » (biens du cluster), avec **ancres descriptives** (jamais « cliquez ici ») ;
  - inséré dans les composants guides + en bas des fiches biens (`PublicSite.jsx`).
- Le `/guide-hub` devient le **centre du silo** : liste structurée par thème (déjà un hub, à enrichir avec la table clusters).
- Liens **biens → guides** (« Que faire autour de [bien] ») via la même table.

---

## 4. Contenu

### 4.1 Enrichissement des guides existants (DANS ce lot)
Pour chaque guide mince / faible intention : structure **H2/H3 répondant aux questions réelles** (People Also Ask), bloc **FAQ** (alimente `FAQPage`), **infos pratiques** (accès, horaires, tarifs indicatifs, meilleure saison), viser **800-1500 mots utiles** (pas de remplissage). Priorité aux guides du cluster Sainte-Luce (plus proches des biens qui convertissent).
- Délégué aux skills/agents `seo-content-writer-amaryllis` et `seo-local-amaryllis`, **fact-check** des faits biens via `_biens.js` (équipements, capacités, nomenclature).

### 4.2 Plan des nouveaux guides longue-traîne (PLAN seulement ici ; création = lots suivants)
Lot cible ~6-8, forte intention locale / faible concurrence, ex. :
- « location villa avec piscine Sainte-Luce » (commercial)
- « que faire à Sainte-Luce quand il pleut »
- « plages accessibles / familles Sud Martinique »
- « Martinique en famille — Sud, semaine type »
- « où loger bord de Marne à Nogent-sur-Marne »
- « se déplacer en Martinique sans voiture (Sud) »
Chaque candidat sera validé (intention + concurrence) avant rédaction.

---

## 5. Mesure & garde-fous

- **Baseline avant** : sessions organiques GA4 par page (via `/api/analytics`), + positions/impressions GSC si accessibles. Snapshot daté.
- **Suivi** : revue à J+30 / J+60 (organique par cluster).
- **Garde-fous projet (impératifs) :**
  - Meta des slugs interceptés = **`functions/[slug].js` fait foi** ; éditer les 2 sources, vérifier en live (curl).
  - **1 intention = 1 page** (anti-cannibalisation) : pas deux guides sur la même requête.
  - Nomenclature « villa » = Amaryllis + Iguana **uniquement** (cf. voice.md / _biens.js).
  - Déploiement **uniquement** via `npm run deploy:pages` ; ne JAMAIS toucher `patrimoine-dashboard`.
  - Garde-fou **anti-cache-empoisonné** : ne pas marteler le chemin canonique du bundle juste après deploy ; le smoke test est en cache-bust (cf. `docs/ERREURS-LOG.md` 02/06).

---

## 6. Périmètre de CE spec (focalisé — 1 plan d'implémentation)

**INCLUS :** §1 architecture (table clusters) + §2 fondation technique (meta runtime tous guides, JSON-LD Article/FAQ/Breadcrumb/LocalBusiness, ALT/OG/sitemap) + §3 maillage (`seoClusters.js` + `<MaillageCluster>` intégré guides & biens) + §4.1 enrichissement des guides existants + §5 baseline de mesure.

**EXCLU (lots/specs suivants) :** §4.2 **création** des nouveaux guides longue-traîne (un spec par lot), étoffement du hub Nogent, campagnes off-page/netlinking.

---

## 7. Unités & interfaces (pour l'implémentation)

| Unité | Rôle | Dépend de |
|---|---|---|
| `src/data/seoClusters.js` | Source unique : slug → {hub, guides[], biens[], ancres} | — |
| `src/components/seo/MaillageCluster.jsx` | Rend « À lire aussi » + « Où loger » depuis la table | seoClusters, primitives |
| helper JSON-LD (centralisé) | Génère Article/FAQ/Breadcrumb/LocalBusiness | _biens, seoClusters |
| `functions/[slug].js` (étendu) | Meta runtime + JSON-LD pour tous les guides | helper JSON-LD |
| `scripts/prerender.mjs` (cohérence) | Baseline meta + sitemap priorités | — |
| Composants `Guide*.jsx` + `PublicSite.jsx` | Insèrent `<MaillageCluster>` + contenu enrichi | MaillageCluster |

Critère d'acceptation global : pour chaque guide ciblé → meta vérifiée en live (title ≤60c/desc ≤158c), JSON-LD valide (Rich Results Test), bloc maillage présent avec ancres descriptives, contenu enrichi (FAQ + infos pratiques), aucune régression de build/smoke test.
