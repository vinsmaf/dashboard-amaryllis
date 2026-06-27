# Process Gestion des Réclamations Voyageurs

> Amaryllis Locations · Mis à jour : 2026-06-28  
> Outil admin : `/admin` → Analyses → 😤 Réclamations  
> Formulaire public : `https://villamaryllis.com/reclamation`

---

## 1. Canaux d'entrée

| Canal | Comment elle arrive | Statut initial |
|---|---|---|
| **Post-séjour** | Lien "Signalez-le ici" dans l'email J+1/J+3 | `ouvert` |
| **Formulaire contact** | villamaryllis.com → Contact → objet "Réclamation" | `ouvert` |
| **Direct** | Email / WhatsApp / message Airbnb → saisie manuelle admin | `ouvert` |
| **Airbnb** | Message sur la plateforme → saisie manuelle admin | `ouvert` |

**Règle :** toute réclamation reçue hors formulaire (email direct, WhatsApp, Airbnb) doit être saisie manuellement dans l'onglet admin pour traçabilité.

---

## 2. Niveaux de priorité

| Priorité | Critères | Délai de réponse |
|---|---|---|
| 🚨 **Urgente** | Sécurité (gaz, électricité, intrusion), blessure | **< 30 min** |
| 🔶 **Haute** | A gâché le séjour (piscine HS, panne majeure, nuisibles) | **< 2h** |
| 🔵 **Normale** | Inconfort significatif (ménage insuffisant, équipement défaillant) | **< 24h** |
| ⬇️ **Basse** | Amélioration souhaitée, point mineur | **< 48h** |

---

## 3. Workflow de traitement

```
OUVERT → [Qualifier] → EN COURS → [Résoudre + geste] → RÉSOLU → FERMÉ
```

### Étape 1 — Qualifier (dès réception)
- Lire la description, identifier le bien et la période
- Ajuster la **priorité** si nécessaire
- Passer en `en_cours`
- Prendre contact avec le voyageur (voir templates ci-dessous)

### Étape 2 — Investiguer
- Contacter le prestataire ou l'équipe ménage si pertinent
- Vérifier si d'autres séjours sont potentiellement impactés
- Documenter les actions dans **Notes internes**

### Étape 3 — Résoudre + geste commercial
Grille de gestes (indicative — ajuster au contexte) :

| Problème | Geste suggéré |
|---|---|
| Ménage insuffisant (confirmé) | Remboursement partiel 10-20% ou nuit offerte |
| Équipement défaillant > 12h | Remboursement 1 nuit |
| Nuisibles (confirmés) | Remboursement 50% ou relogement |
| Problème mineur résolu < 2h | Geste symbolique (bouteille de rhum locale, etc.) |
| Erreur sans impact séjour | Excuses sincères, sans geste financier |

Documenter le geste dans le champ **Geste commercial** de l'onglet admin.

### Étape 4 — Clore
- Envoyer l'email de résolution (voir template #4)
- Passer en `résolu`
- Si avis négatif laissé sur Airbnb/Google → répondre publiquement (voir skill `responsable-service-client`)

---

## 4. Templates de réponse

### Template 1 — Accusé de réception (< 2h)

> Objet : Votre réclamation — [Bien] · Prise en compte

Bonjour [Prénom],

Merci de nous avoir contactés. Nous avons bien reçu votre signalement concernant [résumé court du problème].

Nous prenons cela très au sérieux et revenons vers vous dans les [X heures/24h] avec une solution concrète.

Cordialement,  
Vincent — Amaryllis Locations

---

### Template 2 — Pendant séjour, problème mineur

> Objet : Intervention prévue — [Bien]

Bonjour [Prénom],

Désolé pour [problème]. Je m'en occupe immédiatement.

[Prestataire / équipe] intervient [créneau précis] pour régler cela. En attendant, [contournement si possible].

N'hésitez pas à me contacter directement si besoin : [mobile].

Cordialement,  
Vincent

---

### Template 3 — Pendant séjour, problème majeur

> Objet : Prise en charge immédiate — [Bien]

Bonjour [Prénom],

Je suis vraiment désolé que [problème]. Vous êtes en vacances, c'est inacceptable.

Voici ce que je mets en place :
1. [Action immédiate — prestataire / remplacement]
2. [Plan B si non résolu sous Xh]
3. [Geste commercial — remboursement partiel / compensation]

Je vous rappelle d'ici 1h pour confirmer la résolution.

Cordialement,  
Vincent — Amaryllis Locations · [mobile]

---

### Template 4 — Résolution post-séjour

> Objet : Suite de votre réclamation — [Bien]

Bonjour [Prénom],

Suite à votre retour concernant [problème], voici ce que nous avons fait :

- [Action corrective prise]
- [Mesure préventive pour les prochains séjours]

[Si geste commercial :] En signe de considération, [description du geste — remboursement X€ / code promo / etc.].

Votre retour nous aide à améliorer l'expérience pour tous nos voyageurs. Merci de nous avoir fait confiance.

Cordialement,  
Vincent — Amaryllis Locations

---

## 5. Anti-patterns à éviter

❌ "Nous comprenons votre frustration" — formule vide, remplacer par une action concrète  
❌ Promettre sans délai précis  
❌ Argumenter publiquement (toujours basculer en privé)  
❌ Ignorer une réclamation même si elle semble de mauvaise foi  
❌ Rembourser sans documenter dans l'admin (perd la traçabilité)  
❌ Attendre que le voyageur laisse un mauvais avis pour réagir  

---

## 6. Escalade

| Situation | Action |
|---|---|
| Menace de procédure judiciaire | Contacter l'assurance + ne plus répondre seul |
| Réclamation Airbnb formelle | Répondre dans les 72h via la plateforme |
| Remboursement > 500€ | Décision manuelle Vincent |
| Nuisibles confirmés | Traitement immédiat + information préfecture si nécessaire |
