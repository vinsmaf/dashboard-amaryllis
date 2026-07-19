# LEARNINGS — Publicité (Meta Ads, Google Ads, agent budget)

> Créé 2026-07-19. Pièges vécus sur le chantier campagnes Meta + agent budget pub + setup Google Ads API.

## Outillage / vérification (piège majeur, 2026-07-19)
- **Le preview browser intégré (`mcp__Claude_Browser__*`) ET `curl` n'exécutent PAS le JavaScript/React du site.** Sur une SPA, ils ne montrent que le HTML statique (le bloc `data-prerender-seo` dans `#root`), donc **toute route affiche "l'accueil"** et un screenshot peut être **blanc**. → **Ne JAMAIS conclure "cette page est cassée" sur la base du preview intégré ou de curl.** Signal fiable : `window.__BUILD__` (défini par `main.jsx`) est `null` dans le preview = le bundle n'a pas tourné. Le **vrai Chrome (`mcp__claude-in-chrome__*`)** est le seul juge d'une SPA — il a confirmé en 30 s que `/services/<bien>` marche parfaitement (perte de temps évitée : j'avais cru à un bug de routing prod inexistant, j'ai même déployé une page de contournement `depart-tardif.js` sur ce faux diagnostic).

## Meta Marketing API
- **Insights** : `time_increment=all_days` (pas `all` → 400 "must be monthly/all_days"). Fields perfs : `spend,impressions,clicks,actions,action_values` ; les conversions sont dans `actions[]` type `offsite_conversion.fb_pixel_purchase` (+ alias), la valeur dans `action_values[]`.
- **Carrousel** : `object_story_spec.link_data.child_attachments[]` avec `picture` (URL publique — **pas besoin d'image_hash**), `multi_share_optimized:false` pour garder l'ordre choisi. ⚠️ affichage **1:1 (crop carré)** → vérifier le cadrage des photos paysage/portrait.
- **Erreurs de création** rencontrées (toutes en PAUSED, cf. footgun) : `is_adset_budget_sharing_enabled:false` requis (ABO), `advantage_audience:0` (sinon impose âge ≤25/≥65 qui écrase le ciblage), `excluded_geo_locations.countries` = codes ISO en TEXTE (pas objet), "add a valid payment method" = pas un bug code (moyen de paiement compte). Toujours remonter l'objet `error` complet, pas `.message`.
- **Dédup/refresh** : le moteur crée une ad à chaque run → sans `findExistingAds` on duplique. `refreshCreatives:true` = graphDelete ad→créative (ordre : ad d'abord, une créative rattachée à une ad vivante ne se supprime pas) puis recrée.

## Google Ads API — setup (2026-07-19)
- **Developer token** ≠ tracking conversion. Ce sont 2 choses distinctes souvent confondues : le tracking (import GA4 `purchase` → conversion Google Ads) était **déjà en place** ; le developer token (accès API par script) n'avait jamais été demandé.
- **Le developer token se demande UNIQUEMENT depuis un compte administrateur (MCC)**, jamais un compte Ads simple (message "Seuls les comptes administrateur ont accès au centre API"). Chemin complet : créer un MCC (gratuit) → y lier le compte Ads (demande depuis MCC + acceptation côté compte) → API Center du MCC → accepter les CGU API → token en statut **"Accès Explorer"** (test only) → **demander l'accès "Basic"** (formulaire `support.google.com/adspolicy/contact/new_token_application` : exige un **numéro de projet Google Cloud** + un **document de design PDF** + review Google ~5 j).
- **Règle tenue** : sur Google Ads, Claude reste en **lecture seule** (navigation/lecture via claude-in-chrome), **jamais de clic d'action** (lier compte, accepter CGU, soumettre) — c'est Vincent qui exécute, Claude guide + rédige le contenu (texte des champs, PDF de design).

## Modèle CAC (budget pub) — RM-08
- **CAC plafond PAR BIEN = 50% de la commission Booking nette évitée** = `prix × nuits(≈4) × (0.16 − 0.015) × 0.5`. Amaryllis ~81€, Zandoli/Géko ~32€, Mabouya ~20€. Seuil viable ~30€ (coût réel d'acquisition d'une RÉSA, pas d'un clic) → **paid seulement sur Amaryllis/Zandoli/Géko**, zéro sur Mabouya/Bellevue/Nogent. Contre **Booking** l'arbitrage est large (16%), contre **Airbnb** il s'effondre (host-fee ~3% côté hôte).
- **⚠️ Erreur du facteur 6 dans les vieux docs** (`PLAN-EXECUTION`, `METRICS_H1`) : "+1 point de direct = +1 600€/an" compte le **CA déplacé** comme s'il était de la marge. FAUX : basculer 1 point OTA→direct ne gagne que la **commission évitée** (~250€/point), pas le CA. Le seul doc cohérent était la reco Nogent (distingue CA direct et commission économisée). Ne jamais calibrer un budget pub sur le CA déplacé.

## Cloudflare Functions (robustesse)
- Un `fetch` externe (Graph API) qui throw dans une Function **sans try/catch = 502 edge muet** (text/plain "error code: 502", illisible). Toujours : try/catch global + `AbortController` timeout + parser `r.text()` puis `JSON.parse` en try (une réponse non-JSON ne doit pas crasher). Remonter l'erreur en **JSON status 200** (`{ok:false,error}`) pour la lire.
