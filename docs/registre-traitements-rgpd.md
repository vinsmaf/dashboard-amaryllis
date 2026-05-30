# Registre des traitements de données personnelles (RGPD art. 30)

**Responsable de traitement** : Amaryllis Locations (Vincent Salomon) — locations meublées de tourisme
**Date de rédaction** : 2026-05-30
**Statut** : version de travail interne, à valider par un avocat/DPO

> ⚠️ Ce registre est obligatoire au titre de l'article 30 du RGPD dès qu'il y a traitement de données personnelles. Il doit être tenu à jour et présentable à la CNIL sur demande.

---

## Vue d'ensemble des traitements

| Réf | Traitement | Outils principaux | Données sensibles ? |
|---|---|---|---|
| T1 | Leads / contact | Formulaire site → Cloudflare D1 | Non |
| T2 | Réservations & paiements | Beds24, Stripe, Google Sheets | Non (mais données financières) |
| T3 | Newsletter | Resend | Non |
| T4 | Audience & publicité | GA4, Google Ads, Consent Mode v2 | Non |
| T5 | Avis voyageurs | Beds24 / OTA / D1 | Non |
| T6 | Chat IA | Groq / Anthropic, Cloudflare | Non |

---

## T1 — Leads / demandes de contact

| Champ | Détail |
|---|---|
| **Finalité** | Répondre aux demandes d'information et de réservation reçues via le formulaire de contact du site villamaryllis.com ; suivi commercial. |
| **Catégories de données** | Identité (nom, prénom), coordonnées (email, téléphone), contenu du message, dates/bien souhaité, métadonnées techniques (horodatage, éventuellement IP technique). |
| **Personnes concernées** | Prospects, voyageurs potentiels. |
| **Base légale** | Mesures précontractuelles à la demande de la personne (art. 6.1.b RGPD) ; à défaut, intérêt légitime à répondre (art. 6.1.f). |
| **Durée de conservation** | 3 ans à compter du dernier contact pour un prospect non converti (recommandation CNIL prospection commerciale). Suppression ou anonymisation ensuite. |
| **Destinataires / sous-traitants** | Hébergement : Cloudflare (D1, Pages) — sous-traitant. Personnel interne Amaryllis. |
| **Transferts hors UE** | Cloudflare : possibles ; encadrés par SCC + Data Processing Addendum Cloudflare. |
| **Mesures de sécurité** | Accès restreint au dashboard admin (authentification), chiffrement en transit (HTTPS/TLS), base D1 sur infrastructure Cloudflare, journalisation des accès. |

---

## T2 — Réservations & paiements

| Champ | Détail |
|---|---|
| **Finalité** | Gérer le cycle complet de réservation : disponibilités, contrat de location saisonnière, encaissement, facturation, suivi du séjour, obligations comptables et fiscales. |
| **Catégories de données** | Identité, coordonnées, adresse, dates et bien réservé, nombre de voyageurs, montant, données de paiement (traitées par Stripe — Amaryllis ne stocke PAS le numéro de carte), historique des réservations, données de facturation. |
| **Personnes concernées** | Voyageurs / clients. |
| **Base légale** | Exécution du contrat de location (art. 6.1.b RGPD) ; obligation légale pour la conservation comptable et fiscale (art. 6.1.c). |
| **Durée de conservation** | Données de réservation active + relation client : durée de la relation puis 3 ans à des fins commerciales. **Pièces comptables et factures : 10 ans** (art. L.123-22 Code de commerce — voir synthèse). Données bancaires (Stripe) : selon politique Stripe ; pas de stockage de carte côté Amaryllis. |
| **Destinataires / sous-traitants** | Beds24 (PMS / channel manager) ; Stripe (paiement — responsable conjoint/sous-traitant selon flux) ; Google Sheets / Google Workspace (suivi) ; Cloudflare (hébergement). |
| **Transferts hors UE** | Stripe, Google : encadrés par SCC + DPA respectifs. Beds24 : à vérifier (DPA à signer). |
| **Mesures de sécurité** | Tokenisation des paiements par Stripe (PCI-DSS), TLS, accès admin restreint, séparation des accès, pas de stockage local des données carte. |

---

## T3 — Newsletter / communication marketing

| Champ | Détail |
|---|---|
| **Finalité** | Envoi d'offres, actualités et communications marketing aux abonnés. |
| **Catégories de données** | Email, prénom (facultatif), statut d'abonnement, dates d'inscription/désinscription, statistiques d'ouverture/clic. |
| **Personnes concernées** | Abonnés à la newsletter. |
| **Base légale** | Consentement (art. 6.1.a RGPD) pour les prospects ; intérêt légitime possible pour les clients existants sur produits analogues (soft opt-in), avec opt-out facile. |
| **Durée de conservation** | Jusqu'au retrait du consentement (désinscription) ou 3 ans sans interaction (ouverture/clic). Preuve du consentement conservée. |
| **Destinataires / sous-traitants** | Resend (routage emails) — sous-traitant. |
| **Transferts hors UE** | Resend : à vérifier ; DPA à signer. |
| **Mesures de sécurité** | Lien de désinscription dans chaque envoi, double opt-in recommandé, accès restreint à la liste, TLS. |

---

## T4 — Mesure d'audience & publicité

| Champ | Détail |
|---|---|
| **Finalité** | Mesure d'audience du site, analyse de performance, ciblage et mesure publicitaire (remarketing, conversions). |
| **Catégories de données** | Identifiants techniques (cookies, identifiants publicitaires), pages vues, parcours, données de conversion, données d'appareil/navigateur, IP (selon configuration). |
| **Personnes concernées** | Visiteurs du site. |
| **Base légale** | Consentement (art. 6.1.a RGPD + art. 82 loi Informatique et Libertés pour les cookies) — recueilli via le bandeau cookies et Consent Mode v2. |
| **Durée de conservation** | Cookies : 13 mois max (durée de vie) ; données de mesure : selon paramétrage GA4 (recommandé 14 mois). Consentement : preuve conservée 6 mois à 3 ans selon nature. |
| **Destinataires / sous-traitants** | Google (Analytics 4, Google Ads) — sous-traitant/responsable conjoint selon flux ; Cloudflare (diffusion). |
| **Transferts hors UE** | Google : SCC en place (mentionné dans la config existante). |
| **Mesures de sécurité** | Aucun tag déclenché avant consentement (Consent Mode v2), anonymisation IP recommandée, gestion centralisée du consentement (CMP). |

---

## T5 — Avis voyageurs

| Champ | Détail |
|---|---|
| **Finalité** | Collecte, affichage et modération des avis et retours d'expérience des voyageurs ; amélioration du service ; preuve sociale. |
| **Catégories de données** | Prénom / nom ou pseudonyme, note, contenu de l'avis, bien concerné, date du séjour. |
| **Personnes concernées** | Voyageurs ayant séjourné. |
| **Base légale** | Intérêt légitime (art. 6.1.f RGPD) pour la collecte et l'affichage ; consentement si publication nominative sollicitée explicitement. |
| **Durée de conservation** | Durée de publication tant que pertinente ; suppression sur demande de la personne (droit d'opposition). Pour les avis publiés : conformité au cadre « avis en ligne » (information sur date de collecte). |
| **Destinataires / sous-traitants** | Beds24 / plateformes OTA (source des avis), Cloudflare (affichage). Public (avis publiés sur le site). |
| **Transferts hors UE** | Selon plateformes OTA et Cloudflare ; encadrés par DPA respectifs. |
| **Mesures de sécurité** | Modération avant publication, possibilité de retrait, accès admin restreint. |

---

## T6 — Chat IA (assistant conversationnel)

| Champ | Détail |
|---|---|
| **Finalité** | Répondre automatiquement aux questions des visiteurs (disponibilités, infos biens, pré-qualification de demandes) via un widget de chat assisté par IA. |
| **Catégories de données** | Contenu des messages échangés (saisis librement par l'utilisateur, pouvant contenir nom/email/téléphone), horodatage, éventuel identifiant de session. |
| **Personnes concernées** | Visiteurs utilisant le chat. |
| **Base légale** | Intérêt légitime (art. 6.1.f RGPD) à fournir une assistance ; mesures précontractuelles si la conversation porte sur une réservation (art. 6.1.b). |
| **Durée de conservation** | Logs de conversation : durée courte recommandée (ex. 6 à 12 mois) puis suppression/anonymisation. À paramétrer explicitement. |
| **Destinataires / sous-traitants** | Groq et/ou Anthropic (inférence du modèle) — sous-traitants ; Cloudflare (hébergement du widget et des logs). |
| **Transferts hors UE** | Groq, Anthropic : hors UE probable — DPA + clauses de non-réutilisation pour entraînement à exiger (voir liste DPA). |
| **Mesures de sécurité** | Information de l'utilisateur (interaction avec une IA), minimisation (ne pas solliciter de données sensibles), purge périodique des logs, TLS. À compléter : avertissement « ne saisissez pas d'informations sensibles ». |

---

## Synthèse des durées de conservation

| Donnée / traitement | Durée | Fondement |
|---|---|---|
| Lead non converti (T1) | 3 ans après dernier contact | Reco CNIL prospection |
| Relation client / réservation (T2) | Durée relation + 3 ans (commercial) | Reco CNIL |
| **Factures et pièces comptables (T2)** | **10 ans** ⚠️ | **Art. L.123-22 Code de commerce** — et NON 5 ans. (Le délai de 5 ans concerne d'autres documents ; les livres et pièces justificatives comptables se conservent 10 ans.) |
| Contrats de location | 5 ans (prescription droit commun) à 10 ans si pièce comptable associée | Art. 2224 Code civil / L.123-22 |
| Newsletter (T3) | Jusqu'au retrait du consentement / 3 ans sans interaction | Reco CNIL |
| Cookies & mesure d'audience (T4) | Cookies ≤ 13 mois ; données GA4 ≤ 14 mois | Lignes directrices CNIL cookies |
| Preuve du consentement | Le temps nécessaire à la preuve | RGPD |
| Avis voyageurs (T5) | Tant que pertinent / retrait sur demande | Intérêt légitime |
| Logs chat IA (T6) | 6–12 mois puis purge (à fixer) | Minimisation |

> ⚠️ Point d'attention principal : ne pas appliquer un délai uniforme de 5 ans. Les **factures et documents comptables se conservent 10 ans** (art. L.123-22 Code de commerce). Distinguer dans la base ce qui relève de la facturation (10 ans) de ce qui relève du prospect/marketing (3 ans).

---

## Liste des DPA (accords de sous-traitance, art. 28 RGPD) à signer / vérifier

| Sous-traitant | Statut | Action requise |
|---|---|---|
| Stripe | DPA signé ✅ | OK — vérifier version à jour |
| Google (GA4 / Ads) | SCC en place ✅ | OK — vérifier DPA Google Ads/Analytics signé |
| Cloudflare | À confirmer | Vérifier acceptation du DPA Cloudflare (D1, Pages) |
| **Beds24** | À signer ❌ | Obtenir et signer le DPA ; vérifier localisation des données et transferts hors UE |
| **Resend** | À signer ❌ | Obtenir et signer le DPA ; vérifier transferts hors UE |
| **Groq** | À signer ❌ | Signer le DPA **+ exiger la clause de non-réutilisation des données pour l'entraînement des modèles** |
| **Anthropic** | À signer ❌ | Signer le DPA / addendum commercial **+ confirmer la non-utilisation des données API pour l'entraînement** (politique API Anthropic) |

**Exigence transversale pour les sous-traitants IA (Groq, Anthropic)** : clause contractuelle explicite garantissant que les contenus transmis via l'API (messages voyageurs du chat) ne sont **pas réutilisés pour l'entraînement des modèles**, avec durée de rétention limitée et localisation documentée.

---

## Actions complémentaires recommandées

- Tenir une **liste à jour des sous-traitants** (annexe au registre) avec localisation des données.
- Documenter une **procédure de gestion des droits** (accès, rectification, effacement, opposition, portabilité) et un canal de contact dédié.
- Vérifier la nécessité d'une **AIPD/DPIA** pour le chat IA et le ciblage publicitaire (probablement non obligatoire mais à tracer).
- Ajouter au widget de chat un avertissement « ne pas saisir de données sensibles » + mention IA.
- Vérifier la cohérence du registre avec la politique de confidentialité publiée.

---

*Base de travail à valider par un avocat/DPO.*
