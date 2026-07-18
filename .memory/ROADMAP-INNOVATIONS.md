# 🚀 Roadmap Innovations — 10 chantiers locatif (validés Vincent 2026-07-16)

> **Statut** : validés en bloc par Vincent le 2026-07-16 — *« elles sont toutes intéressantes et de gros projets, sauvegarde tout et on va les traiter une par une à partir de demain »*.
> **Traitement** : UN PAR UN, à partir du 2026-07-17. Pas de parallélisation, pas de "on fait tout".
> **Nature** : ce ne sont PAS des quick-wins — chacun est un vrai chantier (backend + UI + décisions métier).
> **Origine** : demande explicite de Vincent d'améliorations *« un peu révolutionnaires, qu'on ne voit pas partout »* — donc chaque item a été filtré contre l'existant (RM, ~28 agents IA, newsletter, reels, caution auto, parity/coherence check, guides PWA, CRM/LTV, WhatsApp bot, services additionnels) pour ne proposer que du réellement absent du marché ET du projet.
>
> ⚠️ **Aucun n'est spécifié techniquement à ce stade** — la liste ci-dessous est l'intention + l'ancrage, pas un plan d'implémentation. Chaque chantier demandera sa propre phase de cadrage avec Vincent (cf. « Questions ouvertes » par item).

## Ordre de traitement

**Non figé.** Vincent n'a pas priorisé — il a validé les 10 en bloc. Demander l'ordre au démarrage, ou proposer en partant de l'alignement valeurs (cf. tableau en bas). Ne pas supposer que l'ordre de cette liste = l'ordre de traitement.

| # | Chantier | Statut |
|---|---|---|
| I-01 | Enchère inversée sur le direct | ✅ **cadré 2026-07-18, en attente de go** — design hybride validé, pas d'implémentation avant que Vincent le redemande explicitement |
| I-02 | Vendre le temps mort au marché local | 📋 à cadrer |
| I-03 | P&L par séjour (pas CA par séjour) | ✅ **livré 2026-07-17** (`0214662`) |
| I-04 | Le vrai loyer payé aux OTA (€/an + point de bascule) | ✅ **livré 2026-07-18** (`3e11cad`) |
| I-05 | Marché secondaire des réservations | 📋 à cadrer |
| I-06 | La note 4,79★ comme actif chiffré | 📋 à cadrer |
| I-07 | Sur-occupation détectée par les données existantes | 📋 à cadrer |
| I-08 | Simulateur de bascule para-hôtelière | 📋 à cadrer |
| I-09 | Runbook de délégation auto-mesuré | ✅ **livré 2026-07-17** (`dc1b28d`) |
| I-10 | Concierge IA qui AGIT (pas qui répond) | ✅ **livré 2026-07-17** en shadow (`e7ccc17` + `b674d43`) — reste à basculer en live |

---

## ✅ Livré le 2026-07-17 — I-09 & I-10 (Vincent : « on essait de faire 9 et 10 »)

### I-09 — Runbook de délégation (`dc1b28d`)
`/api/delegation-stats` + `src/utils/delegation.js` (20 tests) + panneau « 🧍 Dépendance
opérationnelle » dans `AgentsKanban.jsx`. Agrège 9 traces d'acte manuel déjà loguées.

**Premier verdict sur données réelles (2026-07-17) — à re-vérifier dans 4 semaines :**
- **317 actes manuels / 8 semaines · 39 cette semaine · tendance PLATE (-7%)** → la
  délégation ne progresse pas. C'est le fait le plus important de la mesure.
- **194 (61%) = cocher des actions agents « fait »** — le geste dominant n'est PAS de
  l'opérationnel voyageur, c'est du suivi de backlog. Automatisable/supprimable sans IA.
- 36 bugs triés · 35 posts approuvés (le gate escalade au lieu de trancher) · 24 leçons
  agents (Vincent corrige encore les agents) · 16 prix RM **tous « validés », zéro corrigé**
  → si ça se confirme, la validation RM est un rituel, pas une décision → candidat n°1.
- `config_edits` (édition des prix journaliers) : table créée à la 1re édition post-déploiement.
  L'historique antérieur est structurellement absent → **317 est un plancher, pas un total**.

**Décision Vincent** : logger les éditions de prix (fait, `site-config.js`, fail-open +
waitUntil, pas de diff — un GET Apps Script par écriture épuiserait le quota, cf. incident 07-15).

### I-10 — Concierge (`e7ccc17` prérequis + `b674d43` cœur)
**Prérequis livré** : carnet prestataires migré localStorage → D1 (`/api/prestataires`).
C'était le blocage matériel n°1 — sans numéro accessible au serveur, aucun agent ne peut
joindre personne. Migration non destructive (bandeau + bouton, dédup, localStorage conservé).

**Bug production corrigé au passage** : le bot WhatsApp ne liait jamais numéro → réservation ;
il devinait le bien par mots-clés avec `"amaryllis"` en défaut silencieux → un voyageur Nogent
recevait le wifi/adresse de la Villa Amaryllis. `resolveGuestContext()` fait désormais autorité.

**Garde-fous (décision Vincent, cohérente avec RM advisory / agents-execute / social shadow)** :
- `CONCIERGE_MODE=shadow` **par défaut** · kill-switch `CONCIERGE_DISABLED`
- **Une seule action live : le code promo** (zéro argent sortant, nominatif, `max_uses:1`,
  plafond 50€ borné à 200€, réversible). Refund/intervention/service = proposés → ntfy.
- Le LLM ne décide rien : `decideAction()` (23 tests dont adversariaux) tranche.
- Dépassement de plafond → escalade **sans écrêter en silence**.
- Pas de tool-calling : absent du projet, casserait la cascade 7 providers de `_llm.js`.

**⏭️ Prochaine étape I-10 (décision de Vincent, pas automatique)** : après une période
d'observation en shadow (lire `concierge_log` : quelles actions auraient été prises, étaient-elles
justes ?), poser `CONCIERGE_MODE=live` en variable Cloudflare Pages. Ne PAS élargir au refund
sans que le promo ait fait ses preuves.

**Reste ouvert (non fait, assumé)** : mémoire conversationnelle WhatsApp (stateless), WhatsApp
sortant (helper non exporté + templates Meta hors fenêtre 24h), chaînage WhatsApp→réclamation,
refund sans annulation (`cancel-booking.js:211` force `status='cancelled'`), `iguana` absent de
`service-checkout` (6 biens/7), incohérence late checkout 50€ (`guides/*.json`) vs 80€
(`_emailTemplateFields.js`).

---

## I-01 · Enchère inversée sur le direct — « faites votre prix »

**Problème** : le prix affiché est binaire — le voyageur accepte ou part. Toute la demande située sous le prix affiché est invisible et perdue. Baisser le prix publiquement casse la parité OTA et dévalorise la marque.

**Idée** : le voyageur propose son montant sur `villamaryllis.com`, le système accepte/refuse automatiquement selon la valeur d'option de la date (yield management aérien / « Name your own price » Priceline). Le prix bas n'est **jamais affiché publiquement** → zéro casse de parité, zéro signal de braderie.

**Pourquoi c'est rare** : inexistant en location saisonnière (le secteur ne pense qu'en prix affiché + promos publiques).

**Ancrage réel** : le RM calcule déjà des recos par date (`/api/rm-recommendations`, `calcDateReco`), connaît l'occupation forward 30/90j (`rm_kpi_snapshots`) et le vacancy_risk. La brique de décision « cette date vaut-elle X ? » existe donc déjà en grande partie.

**Questions ouvertes — TRANCHÉES le 2026-07-18** (Vincent : « à garder mais pas mettre en place de suite ») :
- **Seuil d'acceptation** : design **hybride** retenu (proposé par Claude, pas encore challengé par Vincent en détail — à reconfirmer avant de coder). Vincent fixe à l'avance un **plancher** (€ ou % du prix affiché, ex. 70%) + une **fenêtre de dates éligibles** (lead time court ≤14j, ou `vacancy_risk` élevé déjà calculé par le RM) par bien/saison. Offre dans le plancher+fenêtre → acceptée **instantanément** (paiement + résa confirmée comme une résa directe classique). Offre hors fenêtre (trop basse, ou date à forte demande) → mise en attente, validation manuelle. **Ne viole pas "RM=advisory only"** : ce n'est pas le RM qui décide d'un prix, c'est Vincent qui fixe un plancher figé à l'avance (comme un prix minimum de vente) et le système applique une règle mécanique déjà posée par lui.
- **Plancher stocké où** : pas encore spécifié techniquement (probablement un nouveau champ par `rm_seasonal_profiles`/property, à cadrer au moment de coder).
- **Anti-cannibalisation** : la fenêtre de dates (lead time court / vacancy_risk élevé, déjà calculé par le RM) est le garde-fou — sur une date qui se vend déjà bien, le CTA « faites votre prix » n'apparaît simplement pas.

**Statut** : cadrage validé par Claude, **PAS challengé en détail par Vincent**, **PAS implémenté**. Ne pas coder avant que Vincent redemande explicitement de reprendre ce chantier — cf. `.memory/BLOCKERS.md` "En cours".

**Filtre valeurs** : ✅ #2 (tourne sans lui si auto, dans les limites qu'il a posées).

---

## I-02 · Vendre le temps mort au marché LOCAL

**Problème** : les gaps de 1-2 nuits entre deux résas ne se vendent jamais — le touriste ne prend pas 1 nuit (vol à réserver, min stay), donc ces nuits sont structurellement perdues.

**Idée** : dès qu'un gap se crée, générer automatiquement une offre ciblée **résidents Martinique** (une nuit piscine/villa, tarif dégressif, réservation immédiate). Segment de clientèle totalement disjoint du touriste — donc **zéro cannibalisation** du cœur de business.

**Pourquoi c'est rare** : le secteur optimise le prix des nuits vendables, jamais l'activation d'un segment différent sur les nuits invendables.

**Ancrage réel** : les gaps sont déjà calculables (occupation forward par bien, iCal fusionné, `get-availability`). Le canal de diffusion existe (newsletter, réseaux FB/IG déjà automatisés, WhatsApp). `/api/geo` sait déjà détecter le contexte Caraïbes vs métropole.

**Questions ouvertes** :
- Le min stay actuel (`site-config`, séjour minimum par bien/période) bloque-t-il mécaniquement ces offres ? Comment l'assouplir sur les seules dates-gap sans ouvrir les 1-nuit partout ?
- Quel canal d'acquisition local (audience FB locale ? base des ~60 coachés ? partenariats ?) — **pas d'audience locale identifiée à ce jour**, c'est probablement le vrai blocage du chantier.
- Impact ménage : une nuit locale = un ménage complet. Rentable ou destructeur de marge ? (→ dépend de I-03.)

**Filtre valeurs** : ✅ #1 (revenu sans effort récurrent si auto) · ⚠️ charge ménage à vérifier.

---

## I-03 · P&L par séjour, pas CA par séjour

**Problème** : tout le système compte le CA. Un séjour à 800€ qui consomme 40 messages de support, sur-occupe, et laisse un ménage catastrophique peut être **moins rentable** qu'un 600€ propre — et rien ne le montre aujourd'hui.

**Idée** : un vrai P&L par séjour — CA moins commission canal, ménage, linge, consommables, support consommé, incidents/réclamations, dégradations. Permet de **choisir** ses voyageurs (et ses canaux) sur la marge réelle, pas sur le chiffre d'affaires.

**Pourquoi c'est rare** : l'industrie entière raisonne en RevPAR/ADR (revenu), jamais en marge nette par séjour.

**Ancrage réel** : beaucoup de briques existent déjà — `canauxCommissions.js` (commissions par canal), `reclamations`, `emails_log` (volume de support par voyageur), `voyageur_feedback`, `inventory` (consommables), `crm_clients`/LTV, état des lieux (photos entrée/sortie, depuis 2026-07-16). Le chaînon manquant = le coût ménage/linge réel par séjour.

**Questions ouvertes** :
- Coût ménage : forfait par bien ou réel par intervention ? (Nogent = conciergerie externe Nesrine, montant irrégulier ; Martinique = autre modèle.)
- Comment valoriser le « support consommé » (temps de Vincent) — en € ou en minutes ?
- Sortie : un KPI par séjour, ou une vue agrégée par canal/profil pour décider ? (Vincent voudra probablement les deux — cf. son réflexe « une donnée backend sans surface visuelle n'est pas livrée ».)

**Filtre valeurs** : ✅ #5 (sécuriser/comprendre avant d'accumuler) · ✅ #1 (refuser les séjours à charge mentale élevée).

---

## I-04 · Le vrai loyer payé aux OTA — €/an + point de bascule

**Problème** : « réduire les commissions OTA » est un cap déclaré depuis des mois, mais le coût réel des OTA n'a **jamais été chiffré honnêtement**. La commission affichée (15-18%) n'est que la partie visible.

**Idée** : un chiffre unique annuel = commission + contrainte de prix (parité) + perte de la relation client (pas d'email = zéro réactivation, zéro LTV) + dépendance au ranking. Puis : **à partir de quel volume direct couper un canal devient rentable ?**

**Pourquoi c'est rare** : tout le monde subit les OTA comme une fatalité ; personne ne modélise le coût total ni le point de sortie.

**Ancrage réel** : `canauxCommissions.js`, `REVENUS_CANAL_*`, `direct_bookings` (canal + attribution), `crm_clients` (LTV réelle des voyageurs directs vs OTA), historique Sheet multi-années. La donnée est là — le modèle n'existe pas.

**Questions ouvertes** :
- Comment valoriser la « perte de relation client » ? Piste : LTV moyenne observée d'un voyageur direct (réactivable) vs OTA (jamais recontactable) × nombre de voyageurs OTA/an.
- Le point de bascule dépend de l'élasticité du direct (couper Airbnb ≠ récupérer 100% de ses résas en direct) — quelle hypothèse retenir, et comment la tester sans risque ?
- ⚠️ **Décision potentiellement irréversible** (couper un canal = perdre son historique de ranking, très dur à reconstruire) → livrer comme **aide à la décision chiffrée**, jamais comme une reco d'action automatique. Filtre #4.

**Filtre valeurs** : ✅ #6 (anti-lock-in, cap direct) · ⚠️ #4 — le chantier chiffre une décision irréversible, il doit rester advisory.

---

## I-05 · Marché secondaire des réservations

**Problème** : une annulation = remboursement + nuits qui repartent à zéro en vente, souvent trop tard pour être revendues.

**Idée** : permettre à un voyageur qui annule de **céder son séjour** à un autre voyageur (comme un billet d'avion/train revendu). L'annulation devient un transfert : le CA reste, le partant récupère sa mise, le nouveau voyageur récupère une date qui l'intéresse.

**Pourquoi c'est rare** : quasi inexistant en location saisonnière.

**Ancrage réel** : `cancel-booking.js` (flux d'annulation complet : remboursement Stripe, libération caution, sync Beds24, email), `direct_bookings`, liens courts (`/api/shorten`), `abandoned_carts` (des gens qui voulaient exactement ces dates !), Stripe (paiement du repreneur).

**Questions ouvertes** :
- Qui trouve le repreneur — le voyageur (il partage un lien) ou nous (on propose la date à la liste d'attente/paniers abandonnés) ? Les deux modèles sont très différents en effort et en droit.
- Cadre juridique : cession de contrat, CGV à modifier, identité du nouveau voyageur (taxe de séjour, contrat signé, caution) → **passer par juriste-compliance avant de coder**.
- Limité aux résas DIRECTES (Beds24/OTA = hors de notre contrôle contractuel) ?
- Frais de transfert ? (rendre le mécanisme neutre ou légèrement rentable pour nous.)

**Filtre valeurs** : ✅ #1 (moins d'annulations sèches = moins de stress) · ⚠️ complexité juridique = vrai coût de cadrage.

---

## I-06 · La note 4,79★ comme actif chiffré

**Problème** : la note Airbnb pilote le ranking, donc le trafic, donc le CA — c'est un **actif financier**. Mais on ne sait ni ce que vaut 0,1 point en €/an, ni ce que tel avis négatif a coûté, ni à quelle vitesse elle se dilue.

**Idée** : la traiter comme une ligne d'actif avec sa propre volatilité — valeur en €/an du point de note, coût réel d'un avis négatif, effet de dilution (plus tu as d'avis, moins un mauvais pèse), et projection.

**Pourquoi c'est rare** : la note est universellement traitée comme une vanity metric à surveiller, jamais comme un actif à valoriser.

**Ancrage réel** : `voyageur_feedback` (avis Airbnb ingérés + classification), `google-reviews`, `reviewClassification.js`, `reviewThemes.js`, historique CA par bien (Sheet), GA4. `agents-impact.js` fait déjà de la corrélation publication→sessions — la mécanique de mesure d'impact existe.

**Questions ouvertes** :
- La corrélation note→CA est-elle mesurable sur nos volumes, ou faut-il s'appuyer sur des benchmarks sectoriels ? **Risque réel de fabriquer un chiffre non fondé** — préférer honnêtement « données insuffisantes » à une fausse précision (pattern déjà établi côté patrimoine).
- Sur quel(s) bien(s) ? La note est par annonce, pas globale.
- Sortie actionnable : ça change quoi concrètement ? (Ex. : justifier un geste commercial de 200€ pour éviter un 3★ si le point vaut 2 000€/an.)

**Filtre valeurs** : ✅ #5 (protéger un actif existant) · ⚠️ garde-fou anti-chiffre-inventé indispensable.

---

## I-07 · Sur-occupation détectée par les données existantes

**Problème** : sur-occupation et fêtes sont détectées trop tard (par les voisins, ou par les dégâts). Les solutions du marché = capteurs (bruit, occupation) → hardware, installation, maintenance sur 7 biens.

**Idée** : **zéro capteur** — croiser la consommation réelle (EDF/SMDE, déjà réconciliée facture par facture côté patrimoine) avec le `nb_guests` déclaré et les dates de séjour. Un écart de conso = signal de sur-occupation ou de fête.

**Pourquoi c'est rare** : tout le monde vend des capteurs ; personne n'exploite les factures d'énergie qu'on a déjà.

**Ancrage réel** : côté patrimoine, l'automatisation Dépenses a déjà identifié **contrat par contrat** : 4 compteurs eau SMDE (préfixes de référence stables et uniques), 5 contrats EDF (Nogent + Géko/Zandoli/Mabouya isolables ; villa Iguana/T4/Amaryllis partagent le REFCLIENT 913108 → **non séparables individuellement**). Côté locatif : `direct_bookings.nb_guests`, dates, `reclamations`.

**Questions ouvertes** :
- ⚠️ **Granularité temporelle = le blocage probable n°1** : les factures sont MENSUELLES, les séjours durent quelques nuits. Une conso mensuelle ne dit rien d'un séjour précis, sauf mois mono-séjour. **À vérifier en premier** : existe-t-il un accès conso journalière (espace client EDF/Linky, API) ? Sans ça, le chantier est probablement mort-né dans sa forme "détection par séjour" et se limite à une détection agrégée/rétrospective.
- Les 3 biens partageant le REFCLIENT 913108 ne sont pas séparables → angle mort structurel sur villa Amaryllis/Iguana/T4.
- Détection rétrospective (post-séjour, pour facturer/blacklister) ou temps réel (pour intervenir) ? La 2e nécessite du live, la 1re non.
- ⚠️ Cross-projet : les données de conso vivent côté **patrimoine**, le besoin est côté **locatif**. Respecter la règle de cloisonnement (une instance ne code pas dans le repo de l'autre) → probablement un endpoint exposé par patrimoine, consommé par locatif (précédent existant : `/api/revenue-summary` locatif → `/api/locatif` patrimoine).

**Filtre valeurs** : ✅ #4 (éviter l'irréversible : un logement saccagé) · ✅ #6 (pas de dépendance hardware/vendor).

---

## I-08 · Simulateur de bascule para-hôtelière

**Problème** : la « résidence hôtelière classée + 3 services » est la vision long terme déclarée de Vincent (`~/.claude/CLAUDE.md`, VINCENT.md), mais elle n'a **jamais été chiffrée**. C'est une intention, pas une décision.

**Idée** : chiffrer précisément la bascule — TVA récupérable sur les investissements (le vrai levier), coût réel des 3 services obligatoires (accueil/linge/ménage), agrément préfectoral (délais, conditions DOM), impact fiscal vs LMP actuel, seuil de rentabilité, date de décision.

**Pourquoi c'est rare** : les proprios subissent leur statut fiscal ; le passage para-hôtelier est un arbitrage rarement modélisé sérieusement.

**Ancrage réel** : la Résidence Amaryllis est un complexe multi-logements (Géko/Zandoli/Mabouya + villa) = la structure s'y prête. Données existantes : revenus/charges par bien (Sheet, `/api/revenue-summary`), historique multi-années, chantier LMP réel déjà en cours côté patrimoine (recettes 161 331€ 2025, deadline déc. 2026).

**Questions ouvertes** :
- ⚠️ **Interaction avec le chantier LMP réel en cours** (deadline déc. 2026, côté patrimoine) — la bascule para-hôtelière change-t-elle ce calcul, ou vient-elle après ? **Ne pas traiter I-08 en ignorant LMP** : les deux touchent le même régime fiscal.
- Cross-domaine : c'est un sujet **fiscal/patrimoine** autant que locatif → autorité chiffres = patrimoine (ADR-G-001). Impliquer les skills `fiscaliste`/`lmp-lmnp`, et probablement une validation comptable humaine.
- Périmètre : toute la résidence, ou seulement une partie ?
- Sortie : un simulateur vivant dans le dashboard, ou une note de décision one-shot ? (Un one-shot suffit peut-être — ne pas sur-construire.)

**Filtre valeurs** : ✅ #5 (sécuriser/optimiser le socle) · ⚠️ #4 (l'agrément est un engagement lourd → advisory strict, décision humaine + comptable).

---

## I-09 · Runbook de délégation auto-mesuré

**Problème** : le cap de Vincent est la **délégation totale d'ici 2028** — c'est son projet de vie, pas une optimisation. Mais rien ne mesure ce qu'il fait ENCORE à la main, ni si ça diminue vraiment.

**Idée** : le système trace les tâches manuelles récurrentes (ce qu'il clique, valide, corrige, répond) et **propose de l'automatiser dès qu'une tâche dépasse un seuil de fréquence**. Un méta-outil pointé sur sa propre sortie de l'opérationnel.

**Pourquoi c'est rare** : les dashboards mesurent le business ; aucun ne mesure la dépendance de l'entreprise à son fondateur.

**Ancrage réel** : `agent_actions` (ce qu'il valide/rejette), `agent_drafts` (approbations manuelles), `emails_log` (réponses manuelles), `client_errors`, historique admin. Le pattern « une tâche répétée 2× doit devenir une règle permanente » est **déjà un réflexe explicite de Vincent** (VINCENT.md 2026-07-05) — ce chantier l'industrialise.

**Questions ouvertes** :
- Comment tracer sans être intrusif (pas de surveillance de tout ce qu'il fait) ? Se limiter aux actions déjà loguées en D1 plutôt que d'instrumenter l'UI ?
- Le seuil de déclenchement (2 occurrences ? 5 ?) et la sortie (une reco ? un draft d'automatisation ?).
- Complémentarité avec l'existant : `agents-triage` fait déjà du triage backlog — ce chantier est différent (il mesure VINCENT, pas les agents). Bien articuler la frontière (Vincent demande systématiquement comment un nouveau système s'articule avec l'existant).

**Filtre valeurs** : ✅✅ **#1 et #2 directement** — c'est le seul des 10 qui mesure explicitement sa sortie de l'opérationnel. Probablement le plus aligné sur son moteur profond.

---

## I-10 · Concierge IA qui AGIT (pas qui répond)

**Problème** : le chatbot public et le bot WhatsApp **répondent** (FAQ, infos, contexte par bien). Ils n'**agissent** pas : chaque incident réel remonte à Vincent, qui appelle le plombier, décide du geste commercial, coordonne.

**Idée** : un agent avec accès au contexte réel (résa en cours, codes, météo, dispo prestataires, historique du voyageur) **et capacité à déclencher** — envoyer le prestataire, accorder un late checkout, régler un incident mineur — avec garde-fous et plafonds.

**Pourquoi c'est rare** : dans le locatif, l'IA sert au copywriting et au support FAQ ; l'agent qui exécute réellement des actions opérationnelles avec un budget est quasi inexistant.

**Ancrage réel** : `/api/whatsapp` (bot contextuel par bien), `/api/chat`, `tv-context.js` (contexte du séjour en cours), `maintenance`/`inventory`, `service-checkout` (déjà capable de facturer un service), `reclamations`, `agent-drafts` (le pattern approbation existe), `_llm.js` multi-provider. La quasi-totalité des briques est là — manque l'orchestration et l'autorisation d'agir.

**Questions ouvertes** :
- ⚠️ **C'est le chantier le plus sensible des 10** : un agent qui agit sur de l'argent réel et des voyageurs réels. Quel plafond (€), quelles actions autorisées sans validation, quel kill-switch ? Les précédents du projet vont tous dans le même sens : `agents-execute` prépare des **brouillons**, ne publie jamais ; le RM est advisory only. **Le défaut doit être : proposer, pas exécuter** — et l'élargissement se fait action par action, avec l'accord explicite de Vincent.
- Quels prestataires sont réellement joignables/automatisables (Nesrine pour Nogent — humaine, WhatsApp ; Martinique = ?).
- Escalade : à quel moment ça DOIT remonter à Vincent (voyageur mécontent, montant élevé, ambiguïté) ?
- ⚠️ Risque réputationnel : une erreur d'agent face à un voyageur se voit dans les avis (→ dégrade I-06).

**Filtre valeurs** : ✅✅ #2 (« ça tourne sans toi » = le cœur du cap 2028) · ⚠️ #4 (argent réel + relation client → garde-fous stricts, montée en autonomie progressive).

---

## Alignement valeurs — vue d'ensemble

> Rappel du filtre (`~/.claude/CLAUDE.md`) : **#1 en profiter** · **#2 liberté d'esprit/temps** · **#3 famille** · **#4 éviter l'irréversible** · **#5 sécuriser > accumuler** · **#6 autonomie/anti-lock-in**.
> ✅ = sert directement · ⚠️ = point de vigilance à traiter dans le cadrage. **Aucun des 10 ne coche ❌ sur #1 ou #4** (les 2 lignes rouges).

| # | Sert le plus | Vigilance principale |
|---|---|---|
| I-01 | #2 | Règle « RM advisory only » à trancher avant de coder |
| I-02 | #1 | Pas d'audience locale identifiée = blocage probable |
| I-03 | #5, #1 | Coût ménage réel = donnée manquante |
| I-04 | #6 | Chiffre une décision irréversible → advisory strict |
| I-05 | #1 | Cadre juridique (cession de contrat) à valider avant code |
| I-06 | #5 | Risque de fabriquer un chiffre non fondé |
| I-07 | #4, #6 | Granularité mensuelle des factures = blocage probable |
| I-08 | #5 | Interaction avec le chantier LMP réel en cours |
| I-09 | **#1, #2** | Frontière avec `agents-triage` à articuler |
| I-10 | **#2** | Le plus sensible : argent réel + voyageurs réels |

**Les plus alignés sur le moteur profond de Vincent (délégation 2028)** : **I-09** et **I-10**.
**Les plus proches d'un revenu nouveau sans effort récurrent** : **I-01**, **I-02**.
**Le plus proche de son cap déclaré « réduire les commissions »** : **I-04**.

---

## Notes de méthode (pour la prochaine instance)

1. **Un par un** — instruction explicite de Vincent. Ne pas ouvrir 3 chantiers en parallèle, ne pas "profiter d'être dedans" pour enchaîner.
2. **Cadrer avant de coder** — chacun a des questions ouvertes non triviales (juridiques, métier, données manquantes). Les poser à Vincent AVANT d'écrire du code (cf. Karpathy #1 : si c'est flou, nommer ce qui est flou et demander).
3. **Chercher le blocage réel en premier** — plusieurs chantiers (I-02, I-07) ont un blocage identifié qui peut les tuer. Le vérifier AVANT d'investir dans le reste, pas après.
4. **Advisory par défaut** — I-01, I-04, I-08, I-10 touchent à des décisions à enjeu (prix, canal, fiscal, argent réel). Le précédent constant du projet : proposer, ne pas exécuter. Ne pas élargir sans accord explicite.
5. **Une donnée backend sans surface visuelle n'est pas "livrée"** (VINCENT.md 2026-07-03) — anticiper où ça s'affiche.
6. **Ne pas sur-construire** — plusieurs de ces chantiers peuvent avoir une réponse en note de décision one-shot plutôt qu'en feature permanente (I-08 typiquement). Proposer le MVP le plus simple qui répond vraiment à la question.
