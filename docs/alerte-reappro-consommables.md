# Alerte réapprovisionnement consommables — Amaryllis Locations

> Document terrain · Version 1.0 · Mai 2026 · Action log-037 (alerte réappro consommables)
> Process pragmatique sans logiciel dédié · Déclencheur WhatsApp hôte Vincent +33 6 10 88 07 72

---

## 1. Principe

Chaque logement doit toujours avoir un **stock cible** de consommables. Dès qu'un consommable passe sous son **seuil d'alerte (mini)**, on déclenche un réappro **avant la rupture** — jamais à découvert pour le voyageur suivant.

Le contrôle se fait **à chaque check-out** (constat terrain) + **un passage mensuel** (stock de fond). Pas d'outil : un Google Sheet partagé + un message WhatsApp à Vincent suffisent.

**Codes type de réappro :**
- **Sur place** = recomplété depuis le stock tampon du logement / placard
- **Achat** = à racheter (course locale)
- **Prestataire** = géré par un prestataire (linge, piscine)

---

## 2. Liste des consommables par logement

### 2.1 Référentiel commun (tous les logements)

| Consommable | Stock cible (par logement) | Seuil alerte (mini) | Fréquence contrôle | Type réappro |
|---|---|---|---|---|
| Papier toilette | 4 rouleaux/SDB | 2 rouleaux/SDB | Chaque check-out | Achat |
| Essuie-tout cuisine | 2 rouleaux | 1 rouleau | Chaque check-out | Achat |
| Capsules café | 20 (×nb voyageurs/4) | 8 | Chaque check-out | Achat |
| Sucre (sticks/boîte) | 20 sticks | 6 | Mensuel | Achat |
| Sel / poivre | 1 de chaque (plein) | 1/4 restant | Mensuel | Achat |
| Huile / vinaigre | 1 de chaque | 1/4 restant | Mensuel | Achat |
| Savon mains | 1 plein/SDB + 1 réserve | 1/4 restant | Chaque check-out | Achat |
| Shampoing / gel douche | 1 plein/SDB + 1 réserve | 1/4 restant | Chaque check-out | Achat |
| Sacs poubelle | 1 rouleau (≥10 sacs) | 4 sacs | Mensuel | Achat |
| Liquide vaisselle | 1 plein | 1/4 restant | Mensuel | Achat |
| Éponges / lavettes | 2 neuves | 0 neuve | Chaque check-out | Achat |
| Produits ménagers (multi-usage, sol, WC, vitres) | Stock 4 semaines | Stock 1 semaine | Mensuel | Achat |
| Pastilles lave-vaisselle *(si LV)* | 15 | 5 | Mensuel | Achat |
| Lessive *(si lave-linge)* | 1 plein | 1/4 restant | Mensuel | Achat |
| Ampoules de rechange (par culot utilisé) | 2 par type | 0 | Mensuel | Achat |
| Piles télécommande (AA / AAA) | 4 de chaque | 2 | Mensuel | Achat |
| Draps de rechange | 3 sets/chambre | 2 sets/chambre | Chaque check-out | Prestataire |
| Serviettes de rechange | 2/voyageur + 2 réserve | sous 2 réserve | Chaque check-out | Prestataire |

> **Café** : ajuster le cible à la capacité (Amaryllis 8 pers. = ~40 capsules ; Mabouya 2 pers. = ~10).

### 2.2 Spécifique piscine *(Amaryllis, Iguana, Zandoli)*

| Consommable | Stock cible | Seuil alerte | Fréquence contrôle | Type réappro |
|---|---|---|---|---|
| Chlore / brome (selon bassin) | 1 seau plein | 1/4 seau | Hebdomadaire (avec traitement) | Prestataire piscine |
| pH+ / pH− | 1 de chaque | 1/4 restant | 2×/semaine (contrôle pH) | Prestataire piscine |
| Sel piscine *(Iguana — eau salée)* | 1 sac réserve | 0 réserve | Mensuel | Prestataire piscine |
| Pastilles test pH/chlore | 1 boîte | 10 tests | Mensuel | Prestataire piscine |

### 2.3 Spécifique jacuzzi *(Amaryllis uniquement)*

| Consommable | Stock cible | Seuil alerte | Fréquence contrôle | Type réappro |
|---|---|---|---|---|
| Produit traitement jacuzzi | 1 plein | 1/4 restant | Entre chaque séjour (vidange) | Prestataire piscine |
| Filtre/cartouche jacuzzi de rechange | 1 | 0 | Mensuel | Achat/Prestataire |

### 2.4 Notes par logement

| Logement | Particularités stock |
|---|---|
| **Villa Amaryllis** (8 pers.) | Plus gros volumes : café ×40, PQ ×nb SDB élevé. Jacuzzi (2.3) + piscine débordement (2.2). Carbet : pas de consommable dédié. |
| **Villa Iguana** (6 pers.) | Piscine eau salée → **sel piscine** (2.2). Volumes intermédiaires. |
| **Zandoli** (logement, 4 pers.) | Piscine privée (2.2). Jardin tropical = prestataire jardinier (pas de consommable). |
| **Géko** (cocon, 4 pers.) | Piscine **résidence partagée** → traitement géré par la résidence, **pas de stock piscine côté Amaryllis**. |
| **Mabouya** (studio, 2 pers.) | Petits volumes. Piscine résidence partagée (idem Géko). 1 SDB. |
| **Bellevue** (appartement de standing, Schœlcher, 4 pers.) | **Pas de piscine** ni jacuzzi. Référentiel commun (2.1) uniquement. Vue mer = rien de spécifique. |
| **Nogent** (appartement, longue durée) | Réappro **réduit** : pas de rotation courte. Contrôle au changement de locataire + relevé mensuel léger. Pas de produits accueil de type séjour court. |

---

## 3. Process d'alerte (sans logiciel)

### 3.1 Qui contrôle, quand

| Moment | Qui | Quoi |
|---|---|---|
| **À chaque check-out** | Équipe de ménage | Vérifie les consommables « Chaque check-out » du tableau §2 + recomplète depuis le stock tampon (**Sur place**). Note les manques. |
| **Mensuel (1×/mois)** | Responsable logistique | Tour complet stock de fond (lignes « Mensuel ») des 6 biens Martinique + 1 IDF. |
| **Hebdo / bi-hebdo** | Prestataire piscine | Vérifie chlore/pH/sel/jacuzzi lors du traitement (lignes §2.2 / §2.3). |

### 3.2 Comment déclencher l'alerte

1. **Constat** : un consommable est **sous le seuil mini** (ou le sera avant le prochain check-in).
2. **Saisie** : on coche la ligne dans le **Google Sheet « Réappro Amaryllis »** (1 onglet par logement, colonne « À racheter » + quantité).
3. **Déclencheur WhatsApp** → message à **Vincent (+33 6 10 88 07 72)** au format ci-dessous.
4. **Achat / réappro** : Vincent ou la personne désignée rachète, puis **met à jour le Sheet** (ligne re-cochée « OK », date).
5. **Prestataire** (linge, piscine) : l'alerte est transmise directement au prestataire concerné, puis confirmée dans le Sheet.

### 3.3 Format du message WhatsApp (à copier)

```
🔔 RÉAPPRO — [LOGEMENT]
Check-out du [date]
Sous seuil / manquant :
- [consommable] : reste [qté] (cible [qté])
- [consommable] : reste [qté] (cible [qté])
Urgence : ☐ avant prochain check-in [date/heure]  ☐ stock de fond
Par : [prénom]
```

**Exemple :**
```
🔔 RÉAPPRO — Villa Amaryllis
Check-out du 30/05
Sous seuil / manquant :
- Capsules café : reste 5 (cible 40)
- PQ : reste 2 rouleaux (cible 12)
- Produit jacuzzi : reste 1/4 (vidange ce soir)
Urgence : ☑ avant prochain check-in 31/05 17h
Par : Sandrine
```

### 3.4 Règle de priorité

- **Rouge (bloquant)** : manque avant le prochain check-in → WhatsApp immédiat + achat le jour même.
- **Orange (sous seuil)** : à racheter sous 7 jours, groupé avec les courses.
- **Vert (stock de fond mensuel)** : intégré à la commande mensuelle.

---

## 4. Google Sheet recommandé (structure)

Fichier **« Réappro Amaryllis »** — 1 onglet par logement, colonnes identiques :

| Consommable | Cible | Seuil mini | Stock constaté | Statut | Qté à racheter | Dernier contrôle | Note |
|---|---|---|---|---|---|---|---|
| Capsules café | 40 | 8 | 5 | 🔴 | 35 | 30/05 | check-out |
| PQ | 12 | 4 | 2 | 🔴 | 10 | 30/05 | |
| Savon mains | 3 | 1 | 2 | 🟢 | 0 | 30/05 | |

Mise en forme conditionnelle : `Stock constaté ≤ Seuil mini` → ligne rouge automatique. Un coup d'œil = la liste de courses.

---

## Annexe — Future automatisation légère (NON implémentée)

> Esquisse au cas où l'on voudrait coder une alerte automatique plus tard. À titre indicatif uniquement — rien à déployer ici. Réutiliserait l'infra existante (D1 `revenue_manager`, Pages Functions, Worker cron, ntfy).

**Modèle de données (table D1) :**

```sql
CREATE TABLE consumables (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id   TEXT NOT NULL,        -- amaryllis | iguana | zandoli | geko | mabouya | schoelcher | nogent
  item          TEXT NOT NULL,        -- "café", "PQ", "chlore"...
  target_qty    REAL NOT NULL,        -- stock cible
  min_qty       REAL NOT NULL,        -- seuil alerte
  current_qty   REAL NOT NULL,        -- stock constaté (mis à jour par le ménage)
  unit          TEXT,                 -- "rouleaux", "capsules", "L"...
  category      TEXT,                 -- commun | piscine | jacuzzi
  updated_at    TEXT,                 -- ISO date dernier contrôle
  updated_by    TEXT
);
```

**Mise à jour du stock :** mini-form admin (ou champ dans l'app ménage) → `POST /api/consumables` met à jour `current_qty` + `updated_at`. Pas de scan, saisie manuelle.

**Cron de contrôle :** un cron (ex. dans `workers/ical-sync/index.js`, schedule quotidien `0 7 * * *`) exécute :
```sql
SELECT property_id, item, current_qty, min_qty
FROM consumables
WHERE current_qty <= min_qty;
```

**Alerte :** pour chaque ligne sous seuil, push **ntfy** (déjà utilisé par `send-prix-alert.js`) + email Resend récap groupé par logement :
```
ntfy.sh/amaryllis-reappro — "3 consommables sous seuil — Villa Amaryllis"
```
Email quotidien (ou seulement si ≥1 alerte) à Vincent, format identique au §3.3.

**Endpoint suggéré :** `functions/api/consumables.js` (GET liste + alertes, POST update stock) — calqué sur le pattern `rm-*.js` existant. Réutilise `rateLimit()` de `_ratelimit.js`.

**Effort estimé :** ~½ journée (1 table + 1 endpoint CRUD + 1 bloc cron + réutilisation ntfy/Resend). À ne lancer que si le suivi manuel Google Sheet montre ses limites.
