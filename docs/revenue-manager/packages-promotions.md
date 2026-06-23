# Packages & Promotions — Advisory RM
> Agent rev-014. Recommandations pour augmenter le RevPAR moyen sans baisser le prix de base.
> ⚠️ Advisory only — Vincent applique. RM ne touche jamais un prix tout seul.

---

## Pourquoi les packages

Le prix/nuit est une bataille de commodité (comparaison directe Airbnb). Les packages créent de la valeur perçue non comparable et augmentent le panier moyen sans descendre le prix de base.

**Objectif :** +10–15% de revenu par séjour sur 40% des résas.

---

## 🎁 Packages recommandés

### 1. Package Bienvenue (+30–50€)
**Contenu :** bouteille de rhum AOC Martinique + fruits locaux + petit mot manuscrit  
**Coût réel :** ~15–20€  
**Marge nette :** +15–30€/séjour  
**Cibles :** toutes propriétés Martinique  
**Quand proposer :** à la confirmation (email pré-arrivée J-3)  
**Message :** "Démarrez votre séjour comme il se doit — nous préparons une sélection de produits locaux pour votre arrivée."

---

### 2. Package Romantique (+80–120€)
**Contenu :** décoration chambre (fleurs, bougies, pétales), champagne rosé, plateau petit-déjeuner J+1  
**Coût réel :** ~35–50€  
**Marge nette :** +45–70€/séjour  
**Cibles :** Mabouya (jacuzzi), Géko (piscine privée couple), Zandoli  
**Quand proposer :** à la résa (1 adulte + 1 adulte = couple probable) ou sur demande  
**Message :** "Parfait pour un séjour romantique — nous pouvons préparer votre arrivée."

---

### 3. Package Transfert Aéroport (+60–80€ A/R)
**Contenu :** chauffeur privé depuis/vers l'aéroport Aimé Césaire (45 min)  
**Coût réel :** prestataire local ~40–55€ A/R  
**Marge nette :** +15–25€/séjour  
**Cibles :** toutes propriétés Martinique, voyageurs sans voiture  
**Quand proposer :** email confirmation (mention absence de voiture = signal)  
**Note :** À tester d'abord avec 2–3 prestataires locaux fiables (à sourcer)

---

### 4. Package Barbecue du soir (+40€)
**Contenu :** charbon livré, saucisses créoles + poulet mariné, légumes grillades locaux  
**Coût réel :** ~20–25€  
**Marge nette :** +15–20€/séjour  
**Cibles :** Géko (BBQ inclus), Zandoli, Amaryllis  
**Quand proposer :** email J-1 avant une nuit mid-semaine creuse (remplissage opportuniste)  
**Message :** "Envie de soirée créole ? On vous prépare un kit BBQ local livré à votre villa."

---

### 5. Promo Early Bird (−10% si résa > 90j)
**Mécanisme :** code promo ou prix directement affiché dans le widget  
**Objectif :** avancer la fenêtre de réservation, réduire les creux de trésorerie  
**Condition :** uniquement sur biens ayant des creux constatés (Schœlcher, Nogent)  
**Quand activer :** en basse saison (juin–septembre), retirer dès que taux d'occ > 60%  
**Advisory RM-37 :** early booking réduit le risque d'inoccupation mais sacrifie le RevPAR de pointe. À utiliser chirurgicalement.

---

### 6. Promo Basse Saison (−15% juin–septembre)
**Mécanisme :** prix affiché réduit directement sur la fiche (pas de code)  
**Condition :** septembre = creux profond (~30% occ) — cf. REVENUS_CANAL_2025  
**Biens prioritaires :** Géko, Mabouya (les plus sensibles au prix sur ce segment)  
**Retirer si :** taux d'occ basse saison dépasse 55%  
**Advisory RM-36 :** la basse saison martinique a une valeur propre (calme, mer, authenticité) — la communication doit valoriser ça avant de baisser les prix.

---

## 📋 Comment implémenter

### Phase 1 — Test manuel (2–4 semaines)
1. Créer le **Package Bienvenue** (déjà faisable avec prestataire local)
2. L'ajouter dans l'email pré-arrivée J-3 (`send-prearrivee.js`) comme option payante
3. Mesurer : taux de prise / revenu additionnel / feedback voyageur

### Phase 2 — Intégration tunnel (si test positif)
4. Ajouter un step "options" dans le tunnel de résa (`PublicSite.jsx`)
5. Les options alimentent le `metadata` Stripe (`packageBienvenue: true`)
6. Le webhook `stripe-webhook.js` notifie Vincent pour préparer le package

### Phase 3 — Automatisation
7. Si prestataire stable → automatiser la commande (WhatsApp automatique)
8. Tracker les revenus packages en D1 (`direct_bookings.extras_json`)

---

## 💡 Benchmark concurrents

Les locations haut de gamme Martinique proposent généralement :
- Bienvenue : bouteille + fruits (~80% des villas premium)
- Transfert : souvent inclus à partir d'un certain prix
- Petit-déjeuner livré : rare mais très apprécié (voir potentiel Zandoli / Amaryllis)

**Source :** analyse Airbnb listings Sainte-Luce + Sainte-Anne > 200€/nuit
