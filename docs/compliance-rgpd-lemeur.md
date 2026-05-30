# Conformité — RGPD & Loi « Le Meur » (jur-012 / jur-014)

> Audit du 30/05/2026. Statut : ✅ corrigé (RGPD formulaires) · 📋 à appliquer (Loi Le Meur, au build du contrat cpw-101).

---

## jur-012 — RGPD des formulaires ✅ corrigé

### Déjà conforme avant audit
- **Cookie banner** avec Consent Mode v2 + durée de consentement limitée à **13 mois (CNIL)** (`amaryllis_consent_v2`).
- Liens **Mentions légales / CGV / Politique de confidentialité** en footer.
- Formulaire **contact** (footer site) et **newsletter** (guide-hub) : lien politique de confidentialité présent.

### Gaps trouvés & corrigés (lien politique de confidentialité ajouté avant collecte d'email)
| Formulaire | Fichier | Correctif |
|---|---|---|
| Réservation (tunnel paiement) | `src/PublicSite.jsx` | + mention « En réservant, vous acceptez notre politique de confidentialité. Vos données servent uniquement à gérer votre séjour. » |
| Contact « réservation directe » | `src/GuideReservationDirecte.jsx` | + lien politique de confidentialité sous le bouton |
| Demande séminaire | `src/GuideSeminaires.jsx` | + lien politique de confidentialité |
| Newsletter guide PDF | `src/Guide.jsx` | + lien politique de confidentialité |

### Reste recommandé (non bloquant)
- **Registre des traitements** (art. 30 RGPD) : tenir à jour qui/quoi/pourquoi/durée pour : leads contact (D1), réservations (Beds24/Sheets/Stripe), newsletter.
- **Durée de conservation** : définir une purge (ex. leads non convertis à 24 mois ; données de résa selon obligations comptables 10 ans pour les factures).
- **Sous-traitants** (art. 28) : DPA à jour avec Stripe, Resend, Cloudflare, Beds24, Google (Analytics/Ads), Groq/Anthropic. Les lister dans la politique de confidentialité.
- **Droit d'accès/suppression** : process documenté (email contact@ → suppression sous 30 j).

---

## jur-014 — Loi « Le Meur » (n° 2024-1039 du 19/11/2024) 📋 à appliquer au contrat (cpw-101)

> ⚠️ Pas de contrat de location généré aujourd'hui (feature cpw-101 à venir). Ces points sont à intégrer **quand** le contrat + la signature électronique seront construits.

### Ce que la loi Le Meur impose / change pour les meublés de tourisme
1. **Déclaration obligatoire avec enregistrement** : à terme, déclaration en mairie via téléprocédure nationale + **numéro d'enregistrement** à faire figurer sur **toutes les annonces** (Airbnb, Booking, site direct). → prévoir un champ « n° d'enregistrement » par bien, affiché sur les fiches.
2. **DPE** : les meublés de tourisme entrent progressivement dans l'obligation de performance énergétique (calendrier d'interdiction des passoires thermiques aligné sur les locations classiques dans les zones tendues). → vérifier le DPE de chaque bien (surtout Nogent, zone tendue IDF).
3. **Pouvoir renforcé des communes** : quotas, autorisation de changement d'usage, limitation du nombre de nuitées en résidence principale (plafond abaissable à 90 nuits/an selon commune). → vérifier les règles de Sainte-Luce, Schœlcher, Nogent-sur-Marne.
4. **Fiscalité** : abattement micro-BIC réduit (meublés de tourisme non classés : abattement abaissé). → info à remonter au comptable, pas au site.

### Mentions obligatoires à prévoir dans le contrat de location saisonnière (cpw-101)
- Identité du loueur + coordonnées
- Désignation et adresse du bien + **n° d'enregistrement**
- Dates et heures d'arrivée/départ, durée
- Prix total détaillé (loyer + frais ménage + taxe de séjour + caution)
- **Taxe de séjour** (montant, perçue pour le compte de la commune)
- Montant et modalités de la **caution** (déjà gérée via pré-autorisation Stripe)
- Conditions d'annulation / rétractation
- État des lieux entrée/sortie
- Capacité maximale (nb de personnes) — cohérent avec les capacités du site
- Règlement intérieur (non-fumeur, fêtes interdites, animaux selon bien)
- Clause RGPD (traitement des données du voyageur)

### Action conseillée
- Centraliser un **« n° d'enregistrement » par bien** (D1 ou config) → l'afficher sur chaque fiche + l'injecter dans les futures annonces et le contrat.
- Faire valider le gabarit de contrat par un avocat/notaire avant mise en production (la génération de contrat = enjeu juridique fort).
