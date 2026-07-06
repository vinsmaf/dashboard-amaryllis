# Plan d'exécution — Marketing / Prospection / Revenus — H2 2026

> Amaryllis Locations (7 logements, villamaryllis.com). Rédigé le 2026-07-06.
> Ancré dans : `.memory/SPRINT_2026_07.md`, `.memory/BLOCKERS.md`, `.memory/METRICS_H1_2026.md`, `docs/marketing/*`, `docs/legal/plan-action-declarations.md`.
> Zéro code touché ici — c'est un plan d'exécution, pas un chantier technique.

---

## 1. Objectif chiffré H2

**Base H1 2026** : CA total 99 977 € (+8,9 % vs H1 2025), canal direct 43 % du CA (69 123 €/an au taux 2025), CF Nogent -358 € sur le semestre.

**Hypothèses de calcul** (explicites, à challenger) :
- Direct 43 %→46 % du CA (+3 pts) via citations + netlinking + tracking Ads fiabilisé → **+3 pts × ~140 000 € de CA annuel projeté ≈ +4 200 €/an** de marge nette (évite ~15-20 % de commission OTA).
- Schœlcher +15 % de prix sur occ 77 % maintenue → **+600 à 800 €/mois**, soit **+3 600 à 4 800 € sur les 6 mois** juillet-décembre.
- Nogent CF redressé de -358 € (H1) à positif sur H2 grâce au RM actif + page directe → cible **+1 500 à 2 000 €** de CF sur le semestre (occupation stable, moins de dépendance Booking).
- Zandoli/Géko : pas d'hypothèse chiffrée avant le bilan juillet-août (comparaison à une base 2025 exceptionnelle, cf. alerte P0 #2 des métriques).

**Objectif H2 proposé** : **+8 000 à 10 000 €** de marge nette additionnelle vs trajectoire actuelle, répartis Schœlcher (+4 000 €), Nogent (+1 800 €), part directe (+4 200 €) — hors effet saison Q3 naturel (déjà dans la base).

**Non chiffré volontairement** : impact netlinking/citations (délai 4-8 semaines avant mesure, cf. blocker SEO), impact WhatsApp/App Review Meta (dépend de validations tierces).

---

## 2. Semaine 1 (immédiat — 07 au 13 juillet)

Actions déjà prêtes, ne demandant que l'exécution. Format : action — qui — durée — impact — dépendances.

| # | Action | Qui | Durée | Impact attendu | Dépendances |
|---|---|---|---|---|---|
| 1 | **Checkpoint tracking 07/07** : vérifier GA4 `purchase` + Google Ads conversion `amaryllis (web) purchase` ≥1 conv. | Vincent (lecture dashboards) | 10 min | Débloque bascule Ads en Max Conversions → meilleure allocation budget pub | Aucune, date déjà fixée |
| 2 | **Si checkpoint OK → basculer Google Ads en « Maximiser les conversions »**, Meta en objectif « Purchase » | Vincent (UI Google Ads / Meta) | 20 min | Sort de l'enchère manuelle aveugle, optimise sur la vraie conversion | Action #1 positive |
| 3 | **Nettoyer les 2 groupes d'annonces dupliqués campagne Géko** (comparer contenu, garder le plus complet, supprimer l'autre) | Vincent (UI Google Ads, campaignId 23983721226) | 5 min | Débloque la réactivation propre de la campagne Géko | Aucune |
| 4 | **Envoyer les 3 emails institutionnels prêts** (CMT martinique.org, Mairie Sainte-Luce, OT Sainte-Luce tél 0596 62 53 53) — `docs/marketing/emails-prospection-institutionnels-2026-06.md` | Vincent (envoi depuis contact@villamaryllis.com) | 15 min | Amorce citations institutionnelles = 1er levier autorité de domaine | Aucune, prêts depuis 06/2026 |
| 5 | **Activer RM Nogent** — pricing dynamique, ADR été +20 % | Session Claude (config RM) | 30 min | Redresse le CF Nogent négatif (-358 € H1) | Aucune |
| 6 | **Override Schœlcher +15 %** dans le RM (occ 77 % confirmée sous-évaluation) | Session Claude (config RM) | 15 min | +600-800 €/mois si occupation tient | Aucune |
| 7 | **Poser caution Mabouya/François Cambier** (échéance AGENDA 02/07, en retard) | Vincent (lien Stripe manuel) | 10 min | Ferme un risque financier ouvert sur une résa en cours | Aucune |
| 8 | **Relancer confirmation Apple Business Connect** (soumis 26/06, délai 5j ouvrés dépassé) — vérifier email de validation | Vincent (vérif email) | 5 min | Débloque création des 6 fiches établissement restantes | Email Apple reçu |

**Total effort Vincent** : ~1h05. **Total effort agent/session** : ~45 min.

---

## 3. Mois 1 (juillet)

### Citations locales & netlinking

| Action | Qui | Durée | Impact | Dépendances |
|---|---|---|---|---|
| Bing Places — reprendre l'ajout des 2 fiches Amaryllis (l'import précédent a pris la mauvaise fiche) | Vincent | 20 min | Citation off-page supplémentaire | Aucune |
| PagesJaunes + Petit Futé — créer les comptes et soumettre les fiches | Vincent | 40 min | 2 citations locales, backlinks annuaire | Aucune |
| Relancer J+10 les 3 emails institutionnels si sans réponse (courtoise, 2 lignes) | Vincent | 10 min | Maintient la pression sans harceler | Envoi semaine 1 (action #4) fait |
| Contacter 3-5 prestataires locaux pour échange de liens (distilleries, plongée, restos — template A du netlinking-plan) | Vincent | 30 min | Backlinks white-hat + trafic référent qualifié | Contacts à identifier |
| Construire la page « Nos partenaires » sur le site | Session Claude (dev, hors scope code marketing mais livrable produit) | — | Support technique aux échanges de liens ci-dessus | Prestataires partants |

### Revenus (RM & pages directes)

| Action | Qui | Durée | Impact | Dépendances |
|---|---|---|---|---|
| Suivre l'effet RM Nogent + Schœlcher à J+15 (comparer occ/ADR avant/après) | Session Claude (lecture métriques) | 15 min | Valide ou ajuste les overrides posés semaine 1 | Actions #5-6 posées |
| Construire la page directe Nogent (SEO + calendrier + contact direct) — réduit la dépendance 79 % Booking.com | Session Claude (dev) | — | Réduit le risque de dépendance à 1 canal sur Nogent | Aucune |
| Bilan Zandoli mi-juillet (lecture résultats 1-14 juillet, base de comparaison 2025 exceptionnelle) | Vincent + session Claude | 20 min | Décide si action structurelle nécessaire ou si -40,9 % H1 était un artefact de base | Données 1-14 juillet disponibles |

### Emails institutionnels & déclarations (prérequis aux citations)

| Action | Qui | Durée | Impact | Dépendances |
|---|---|---|---|---|
| Confirmer le canal de déclaration meublé de tourisme par commune (Sainte-Luce, Schœlcher, Nogent) | Vincent (contact mairies) | variable | Débloque la déclaration officielle → numéro à afficher | Aucune, action #1 du plan légal |
| Déclarer/enregistrer les 6 biens → obtenir les numéros d'enregistrement | Vincent | 2-3 semaines (délai mairie) | Ferme le risque d'amende 12 500 € (numéro absent des annonces) | Canal confirmé |
| Dès numéro obtenu : l'afficher sur site + Airbnb + Booking + contrat | Vincent + session Claude (intégration technique) | 1h par bien | Ferme le risque #1 le plus cher | Numéros obtenus |

### Bascules Ads (post-checkpoint)

| Action | Qui | Durée | Impact | Dépendances |
|---|---|---|---|---|
| Surveiller 1 semaine post-bascule Max Conversions/Purchase : CPA, volume, pas de dérive de dépense | Vincent + session Claude | 15 min/jour | Sécurise la bascule, évite un emballement de budget | Action #2 (semaine 1) faite |
| Rapport termes de recherche Google Ads — ajouter en négatif le hors-sujet (règle : c'est là que fuit 80 % du budget) | Vincent (UI Google Ads) | 20 min/semaine | Réduit le gaspillage de budget pub | Campagnes actives |

---

## 4. Trimestre (juillet-septembre)

| Action | Qui | Durée | Impact | Dépendances |
|---|---|---|---|---|
| **App Review Meta** (déblocage FB `pages_read_engagement` Advanced Access) — soumission dossier | Vincent | 1-2h préparation + délai Meta variable | Débloque le bot social auto-répondeur sur Facebook (déjà fonctionnel sur Instagram) | Aucune, en attente depuis 06/2026 |
| **WhatsApp Business réel** — une fois Business Verification validée : ajouter le vrai numéro, lier à la Page | Vincent (action humaine, code SMS) | 15 min | Sort du mode test (`+1 555 006 0804`), ouvre un vrai canal client | Business Verification validée |
| **Retargeting septembre** (Google C3 Display + Meta MOFU) — activer une fois l'audience `RMKT_Vu_fiche_calendrier_sans_resa` >100 users/30j | Vincent (UI) | 30 min | Récupère les visiteurs non convertis de l'été, cycle long de l'offre groupe (4-8 mois) | Audience mûre, budget disponible |
| **Push haute saison individuels** (nouveaux ad groups Search : villa piscine, Sainte-Luce, couples Mabouya, vue mer Schœlcher, direct propriétaire) | Vincent (UI Google Ads) | 1h setup | Capte le pic de recherche sept-oct (lead-time 3-5 mois pour l'hiver) | Budget Ads disponible post-crédit |
| **Audit avis Amaryllis** — vérifier cohérence note affichée (4,79-4,94★ selon sources) vs fiches réelles, cf. incohérence trouvée dans les mockups refonte home | Session Claude (vérif `src/data/biens.js`) | 30 min | Évite d'afficher un chiffre erroné dans une prochaine campagne ou refonte | Aucune |
| **Veille RM étendue aux 6 autres biens** — aujourd'hui `rm_market_signals` ne couvre que Villa Amaryllis | Session Claude (dev) | — | Donne une base de pricing concurrentiel sur 86 % du portefeuille actuellement aveugle | Aucune |
| **DPE par bien** (priorité Nogent, zone tendue IDF) | Vincent (diagnostiqueur certifié) | ~100-250 €/bien, 1-2 mois délai | Conformité légale, évite blocage de mise en location à terme | Déclaration faite en amont |
| **Classement Atout France** (2 devis puis visites, 6 biens) | Vincent (cabinet accrédité COFRAC) | ~150-250 € HT/bien, 1-2 mois | Abattement fiscal 50 % vs 30 % (micro-BIC) + plafond micro plus élevé | Déclaration + numéro obtenus |

---

## 5. Arbitrages à soumettre à Vincent

1. **Contradiction contenu SEO** : la consigne actuelle est « pas de nouveau contenu tant que l'autorité de domaine ne monte pas » (diagnostic Search Console — seules 3 pages sur ~50 reçoivent des impressions), mais le cron article SEO mensuel long-tail reste actif (`0 1 1 * *`). **Décision à prendre** : suspendre le cron le temps que le netlinking/citations produisent un effet mesurable (4-8 semaines), ou l'assumer comme un pari à très long terme indépendant du problème d'autorité actuel.
2. **Budget pub H2** : le crédit Google ~400 € a un palier de déblocage et une date d'expiration (à vérifier, jamais confirmés dans les sources). Faut-il réengager un budget propre en septembre pour le push haute saison, ou rester sur le reliquat de crédit ?
3. **Priorité déclarations vs citations** : les emails institutionnels (OT/CMT) mentionnent une déclaration meublé de tourisme "en cours de finalisation" qui n'est en réalité pas commencée. Faut-il déclarer d'abord (2-3 semaines de délai mairie) avant de pousser plus loin les citations, pour ne pas construire une stratégie SEO sur une conformité bancale ?
4. **Zandoli -40,9 %** : attendre le bilan juillet-août avant toute action structurelle (prix, pub) — confirmer que c'est bien la position officielle et qu'aucune action prématurée n'est souhaitée.
5. **Crowdlending run-off** (mentionné en P1 des métriques, hors périmètre marketing strict) : désengagement de capital face à des défauts de 19 % — à confirmer si ce sujet reste dans un autre plan ou doit être rattaché ici.

---

## 6. Tableau de bord du plan

| Indicateur | Où le lire | Fréquence | Cible H2 |
|---|---|---|---|
| **Impressions Search Console** (pages avec impressions >0) | Google Search Console → Performances | Mensuel | Passer de 3 à 8-10 pages actives (effet citations/netlinking) |
| **Sessions organiques** | `npm run funnel` ou onglet admin Analytics (GA4 30j glissants) | Hebdomadaire | Sortir de la famine de trafic (~5 sessions SEO/mois en base) |
| **Part directe du CA** | Onglet Pilotage/Charges admin, comparaison Sheet revenus par canal | Mensuel | 43 % → 46 % (cf. hypothèse §1) |
| **Purchase trackées (GA4 + Google Ads)** | GA4 Événements clés + Google Ads → Conversions | Hebdomadaire les 4 premières semaines post-bascule | Volume croissant, valeur € cohérente (pas 0,00 €) |
| **RevPAR par bien** (Nogent, Schœlcher en priorité) | `.memory/METRICS_H1_2026.md` (mise à jour fin septembre) + Cockpit admin | Mensuel | Nogent CF positif, Schœlcher +600-800 €/mois |
| **CF Nogent** | Onglet Pilotage admin | Mensuel | Sortir du négatif (-358 € H1) |

**Prochaine révision du plan** : bilan Q3 fin septembre 2026 (déjà planifié dans `.memory/METRICS_H1_2026.md`).

---

## Sources

- `.memory/SPRINT_2026_07.md` — sprint en cours, P0/P1/stretch
- `.memory/BLOCKERS.md` — frictions actives (Géko Ads, SEO hors-page, Apple Business Connect, tracking purchase)
- `.memory/METRICS_H1_2026.md` — scorecard H1 2026 par bien, alertes P0
- `docs/marketing/netlinking-plan-2026.md` — cibles et templates netlinking
- `docs/marketing/emails-prospection-institutionnels-2026-06.md` — 6 emails prêts à envoyer
- `docs/marketing/campagne-google-ads-2026-06.md` — structure campagnes Google Ads
- `docs/marketing/RUNBOOK-lancement.md` — runbook lancement Google + Meta Ads
- `docs/marketing/00-SYNTHESE-campagnes-2026-06.md` — synthèse plan CEO + campagnes
- `docs/legal/plan-action-declarations.md` — plan déclarations meublé de tourisme
