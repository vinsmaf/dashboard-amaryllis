# Rapport Voix du Voyageur — Q1 2026 (premier rapport)

> Produit par l'agent voyageur-research (voyageur-003), à partir du corpus d'avis Airbnb
> codé thématiquement (voyageur-002). **Corpus** : 116 avis, 5 biens (Amaryllis, Zandoli,
> Géko, Mabouya, Schœlcher — Iguana bail long et Nogent sans annonce Airbnb sont hors
> périmètre), note moyenne **4,78/5**, période **2018-05-02 → 2026-06-25** (c'est le corpus
> historique complet disponible via le scrape Airbnb, pas uniquement des avis du 1er
> trimestre 2026 — à noter pour ne pas surinterpréter le libellé "Q1").
>
> **Méthode** : codage thématique par LLM sur 7 thèmes fixes (logement, localisation,
> piscine, accueil, prix, reco, frictions), un avis pouvant recevoir plusieurs thèmes ou
> aucun. Fréquences ci-dessous = comptage réel sur les 116 avis codés, pas une estimation.

## Fréquence des thèmes (116 avis)

| Thème | Avis concernés | % |
|---|---|---|
| Logement | 83 | 72% |
| Accueil | 77 | 66% |
| Localisation | 49 | 42% |
| Reco (recommandation explicite) | 46 | 40% |
| Piscine | 20 | 17% |
| Frictions | 7 | 6% |
| Prix | 1 | 1% |

**Lecture** : avec 4,78/5 de moyenne et seulement 6% des avis mentionnant une friction, le
corpus est très majoritairement élogieux — l'accueil (Vincent/Céline nommés dans la quasi-
totalité des avis à thème accueil) est un vrai actif différenciant, cité presque aussi
souvent que le logement lui-même. Les 7 avis à friction sont donc le signal le plus
précieux du corpus : ce sont des points d'amélioration concrets noyés dans des séjours
par ailleurs très réussis, pas des signaux d'alarme globaux.

## 3 insights majeurs

### 1. Le wifi/la connectivité est une friction transversale répétée, malgré des notes 4-5★
Deux avis indépendants (Zandoli, Mabouya) mentionnent explicitement un problème de réseau/
wifi faible :
> Zandoli, 5★ : *"Malgré quelque souci de porte et internet."*
> Mabouya, 3★ : *"Et Faible réseaux malgré la wifi également très faible"*

Ce n'est pas un point qui fait chuter la note (les deux voyageurs restent globalement très
satisfaits), mais c'est le seul thème de friction qui apparaît sur **plusieurs biens
différents** — un signal de root cause partagée (fournisseur, zone de couverture) plutôt
qu'un problème isolé à un logement.

### 2. Schœlcher a un problème d'agencement de salon cité par 2 avis indépendants
> 5★ : *"A revoir l'agencement du salon en retirant un canapé."*
> 4★ : *"céjour trop meublé a mon gout et manque un peu de place, 1 seul canapé serais
> bien avec une télé de meilleur qualité"*

Deux voyageurs différents, sans lien entre eux, pointent le même problème (trop de mobilier
dans le salon, canapé(s) en trop) sur le même bien — c'est le pattern le plus net et le plus
actionnable du corpus : spécifique à un bien, répété, formulé de façon quasi identique par
deux personnes différentes.

### 3. Amaryllis (bien premium, 280€/nuit) concentre 3 frictions dans un même avis détaillé
> 4★ : *"mais domotique. capricieuse..un petit livret serait utile. la piscine est vraiment
> petite. et pour 6 pas assez de vaisselle et de linge pour ce type de prestation. prévenir
> que la route pour accéder est très pentue et difficile."*

Sur le bien le plus cher du portefeuille, l'écart entre l'attente (prestation haut de gamme)
et la réalité perçue (domotique pas expliquée, piscine jugée petite, équipement sous-
dimensionné pour la capacité annoncée) coûte proportionnellement plus cher en satisfaction
qu'ailleurs — c'est le seul avis à friction sur Amaryllis, mais il est dense (4 points
distincts dans un seul commentaire).

## 5 recommandations produit

1. **Vérifier la couverture wifi à Zandoli et Mabouya** — les 2 biens explicitement cités. Un
   répéteur ou une box dédiée réglerait un point qui revient sur 2 biens différents pour un
   coût probablement faible.
2. **Schœlcher : retirer un canapé / réagencer le salon** — demande formulée par 2 voyageurs
   indépendants, la seule reco de ce rapport soutenue par une répétition exacte du signal.
3. **Amaryllis : produire un livret domotique simple** (1 page, équipements + usage) — fix
   quasi gratuit face à une friction "capricieuse" qui n'est probablement qu'un manque
   d'explication, pas un vrai défaut matériel.
4. **Amaryllis : vérifier le stock vaisselle/linge vs la capacité réelle (8p)** — l'avis
   mentionne explicitement "pas assez... pour ce type de prestation" sur le bien le plus
   cher, où l'écart se paie le plus cher en perception.
5. **Mabouya : ajouter un brise-vue/rideau pour le jacuzzi extérieur** — friction "manque
   d'intimité... avec le parking devant" facilement réglable par un aménagement ponctuel.

## Limites de ce rapport

- **Corpus = historique complet 2018-2026, pas un vrai "Q1"** — à clarifier dans le titre
  des prochains rapports (Q2 pourra filtrer sur les avis réellement postés depuis ce
  rapport, pour un vrai suivi trimestriel).
- **Iguana et Nogent absents** (pas d'avis Airbnb disponibles — bail long / pas d'annonce).
- **Seulement 116 avis, dont 7 à friction** — un échantillon de cette taille ne permet pas
  de conclure avec certitude statistique, mais la répétition indépendante des signaux
  Schœlcher (canapé) et wifi (2 biens) donne une confiance raisonnable sur ces 2 points
  précis.
- **Codage LLM, pas une double-lecture humaine** — fiable sur ce corpus (vérifié par
  échantillonnage manuel avant publication de ce rapport), mais pas un audit qualité formel.
