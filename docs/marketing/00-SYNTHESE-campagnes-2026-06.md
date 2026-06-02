# 🎯 Synthèse — Plan CEO + Campagnes pub (juin 2026)

> Préparé pendant la nuit du 2 juin 2026, à lire en premier.
> 3 livrables détaillés (liens en bas). Ici = la vue d'ensemble + ce que TU as à décider/faire.
> ⚠️ Rappel : tout est **préparé, prêt à lancer**. Rien n'a été dépensé, aucune connexion à tes comptes. **C'est toi qui lances.**

---

## 1. Le constat en 3 phrases

1. **Le problème n°1 n'est pas l'offre ni le site** (funnel direct Stripe + livret + tracking GA4 = prêts) — c'est une **famine de trafic** : ~5 visiteurs/jour, 0 visite organique sur les pages commerciales. On a construit une autoroute de réservation directe que personne n'emprunte.
2. **Des biens premium dorment** : Villa Amaryllis à **33 % d'occupation** (ADR 312 €), Mabouya à 28 %, Géko 39 %, Schœlcher 37 %. Les remplir = le plus gros gisement de CA (≈ +25 k€/an rien que sur Amaryllis à 55 %, *est.*).
3. **La pub est LE levier court terme** pour amener du trafic qualifié pendant que le SEO (gratuit, mais lent) se réveille.

## 2. La stratégie retenue (cohérente sur les 3 plans)

- **Concentrer, pas disperser.** Avec ~400 € : tout miser sur **l'OFFRE GROUPE Sainte-Luce** (le cluster de villas proches loge une grande famille/tribu — panier 2 500-4 000 €, concurrence pub quasi nulle, 1 résa rembourse 6-10× la mise).
- **Google = intention** (les gens qui cherchent déjà) → on capte la demande groupe + le Brand.
- **Meta = désir** (Martinique, villa piscine, jacuzzi couple = produit ultra-visuel) → on crée l'envie + on construit le retargeting.
- **Timing :** juin est un **creux de réservation** mais c'est le bon moment pour lancer (les groupes réservent 4-8 mois avant la haute saison déc-avril, et les audiences de retargeting mettent ~30 j à se charger). **On ne jugera pas les campagnes sur l'occupation de juin.**
- **Exclus de la pub :** Nogent (résidence principale, plafond légal 120 nuits) et Iguana (bail longue durée, déjà 100 %).

## 3. ⚠️ LE prérequis avant de dépenser 1 €

**Importer la conversion `purchase` dans Google Ads** (et poser le Pixel Meta + event Purchase). Sans ça, on optimise la pub à l'aveugle.
- ✅ **Bonne nouvelle : le code est prêt** — l'event `purchase` (avec valeur €, devise, id transaction, anti-doublon) se déclenche déjà à chaque réservation payée. Vérifié cette nuit.
- ⏳ **Ce qu'il reste (toi, dans l'UI) :** importer cet event comme conversion dans Google Ads + créer le Pixel/CAPI Meta. Procédure pas-à-pas dans les 2 kits.
- 🔒 **Règle d'or :** importer l'event **client `purchase`**, PAS `booking_completed` (serveur, non attribuable).

## 4. Plan de lancement recommandé (séquence)

| Quand | Quoi | Budget |
|---|---|---|
| **Cette semaine** | Vérifier le crédit ~400 € (palier + expiration). Importer la conversion `purchase`. Poser le Pixel Meta. | 0 € |
| **Semaine +1 (juin)** | Lancer **Google C1 « Offre groupe »** (Search, CPC manuel) + **C2 Brand**. Lancer **Meta** en objectif *Trafic/Notoriété* (5-10 €/j) pour construire les audiences. | ~150 € Google + ~150 € Meta test |
| **Septembre** (pic de recherche haute saison) | Activer **Remarketing** (Google Display + Meta retargeting, audiences mûres) + pousser **haute saison déc-avril** sur les biens sous-occupés. | reste du budget |

## 5. ✅ Ce que TU dois décider / faire (handoff)

**Décisions (rapides) :**
- [ ] Valider l'enveloppe pub (le ~400 € Google suffit pour démarrer ; veux-tu ajouter ~150 € Meta en test ?).
- [ ] Valider le **tarif plancher de l'offre groupe** (le pivot de toute la campagne).
- [ ] Valider les **prix basse saison** dans l'admin (bloquant côté revenue management — toujours en attente).
- [ ] Confirmer la conformité meublé (déclarations + n°, DPE) avant de scaler la visibilité.

**Actions UI (toi seul peux) :**
- [ ] Vérifier le crédit Google Ads (compte 226-428-3778).
- [ ] Importer la conversion `purchase` dans Google Ads.
- [ ] Poser le Pixel Meta + Conversions API (event Purchase).
- [ ] Copier-coller les campagnes des 2 kits, vérifier, **lancer**.

## 6. Attentes réalistes (pas de promesse en l'air)

- Le 1ᵉʳ mois sert surtout à **collecter de la donnée** (conversions, mots-clés/audiences qui marchent) et **construire le retargeting**. Le ROAS se juge sur 2-3 mois, pas sur 2 semaines.
- L'offre groupe a un **cycle long** (résa 4-8 mois avant) : un lead en juin = une résa pour l'hiver. Patience.
- Avec un budget modeste, **discipline** : couper vite ce qui ne convertit pas, scaler ce qui marche (seuils chiffrés dans les kits).

---

## 📎 Les 3 livrables détaillés

| Doc | Contenu |
|---|---|
| [`docs/strategie/plan-ceo-2026-06.md`](../strategie/plan-ceo-2026-06.md) | Plan stratégique CEO : diagnostic, priorités, plan 90 jours, KPIs, décisions, risques |
| [`docs/marketing/campagne-google-ads-2026-06.md`](campagne-google-ads-2026-06.md) | Google Ads clé en main : structure, mots-clés, annonces RSA, négatifs, mapping landing, checklist tracking, pilotage |
| [`docs/marketing/campagne-meta-ads-2026-06.md`](campagne-meta-ads-2026-06.md) | Meta Ads clé en main : funnel, audiences, angles créatifs, copy, briefs visuels, pixel/CAPI, KPIs |

*(Le kit historique `docs/google-ads-kit.md` reste comme référence ; la version juin 2026 ci-dessus le remplace.)*
