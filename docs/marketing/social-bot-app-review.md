# Bot social Amaryllis — guide token + dossier App Review Meta

Deux niveaux, deux exigences Meta différentes. **Le détecteur (poller) ne demande qu'un scope de token. L'auto-post (webhook) demande l'App Review.**

| Capacité | Endpoint | Ce que ça fait | Exigence Meta |
|---|---|---|---|
| **Détecteur de leads** | `/api/social-poll` | lit tes commentaires (page+IG), l'agent rédige, te ntfy le brouillon à coller | **token avec `pages_read_engagement`** (Standard Access, TA page → pas de review) |
| **Réponse auto publique** | `/api/social-webhook` | répond/DM tout seul sous les commentaires | **app publiée + App Review** (`pages_manage_engagement`, `instagram_manage_messages`…) |

---

## A. Débloquer le DÉTECTEUR aujourd'hui — régénérer le token de page (~5 min, pas d'App Review)

Le token actuel sait poster mais pas lire les commentaires (erreur `(#10) requires pages_read_engagement`). Comme tu es **admin de l'app** et **propriétaire de la page**, tu peux ajouter ce scope sans review.

1. **Graph API Explorer** : https://developers.facebook.com/tools/explorer/
2. En haut à droite : **Meta App** = `Amaryllis Dashboard` (Amaryllis Corp, App ID `1248539197126557`).
3. **User or Page** → **Get Page Access Token** → choisir la page **Amaryllis Location** (`115471004486809`).
4. **Permissions** (ajouter, puis re-générer) :
   - `pages_read_engagement` ← **indispensable pour le poller**
   - `pages_show_list`
   - (pour la suite live :) `pages_manage_engagement`, `pages_messaging`
   - (pour l'IG :) `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`
5. **Generate Access Token** → accepter.
6. Ce token est **court (1-2 h)**. Le rendre **permanent** :
   - Onglet **Access Token Tool** (https://developers.facebook.com/tools/debug/accesstoken/) → coller le token → **Extend Access Token** (→ long-lived user token).
   - OU mieux : créer un **System User** dans Business Settings (Amaryllis Corp) → lui assigner la page → générer un token système (n'expire pas) avec les scopes ci-dessus.
7. **Mettre à jour le secret Cloudflare** (terminal, tu colles ta valeur — moi je ne saisis pas de token) :
   ```bash
   npx wrangler pages secret put META_PAGE_TOKEN --project-name dashboard-amaryllis
   # → coller le nouveau token quand demandé
   ```
8. Me dire « c'est fait » → je **relance le poller** et on vérifie qu'il lit tes commentaires + te ntfy un brouillon.

> Une fois OK : planifier `/api/social-poll?secret=POSTSTAY_SECRET` toutes les 15-30 min (cron-job.org ou Worker). Le détecteur ne poste jamais — il te prépare la réponse, tu colles.

---

## B. Dossier App Review (pour l'auto-post webhook plus tard)

### Contexte de l'app
- **App** : Amaryllis Dashboard (`1248539197126557`), business **Amaryllis Corp** (`609408700286001`).
- **Entreprise** : Amaryllis Locations — 7 locations saisonnières (Martinique + Nogent-sur-Marne), site villamaryllis.com.
- **Page** : Amaryllis Location (`115471004486809`) · **IG** : @amaryllislocations (`17841450886833537`).

### Permissions demandées + justification (à coller dans la soumission)
| Permission | Justification d'usage (FR/EN) |
|---|---|
| `pages_read_engagement` | Lire les commentaires sous **nos propres** posts/pubs pour identifier les voyageurs qui cherchent une location en Martinique. / Read comments on **our own** posts to identify travellers seeking a rental. |
| `pages_manage_engagement` | Répondre publiquement à ces commentaires avec un message d'accueil + le lien de notre site. / Reply publicly to those comments with a welcome message and our website link. |
| `pages_messaging` | Envoyer une réponse privée (1 par commentaire) au voyageur intéressé. / Send a private reply to the interested traveller. |
| `instagram_basic` + `instagram_manage_comments` | Mêmes usages sur **notre** compte Instagram professionnel. / Same on **our** professional IG account. |
| `instagram_manage_messages` | Répondre en message privé Instagram au commentateur. / Private reply on Instagram. |

### Étapes de reproduction pour le reviewer (script)
1. Se connecter à l'app de test ; le webhook est `https://villamaryllis.com/api/social-webhook` (vérification + signature `META_APP_SECRET`).
2. Sur un post de la page de test, publier un commentaire : « Bonjour, je cherche une location en Martinique pour cet été ».
3. Le système classe le commentaire (intention « recherche de location »), génère une réponse de bienvenue avec le lien du site, **répond publiquement** et envoie un **message privé**.
4. Montrer le log (`social_bot_log` en D1) : commentaire reçu → classé lead → réponse postée.

### Script de la capture vidéo (screencast obligatoire)
- 0:00 montrer la page/IG de test. 0:10 publier le commentaire « je cherche une location… ». 0:20 montrer la réponse publique auto + le DM. 0:35 montrer le tableau de bord interne (onglet 🐞/log) avec l'entrée. Narration : usage = service client / accueil de prospects sur NOS surfaces uniquement.

### Points de conformité à mettre en avant
- **Uniquement nos propres surfaces** (page + IG de l'entreprise) — jamais de commentaires chez des tiers ni dans des groupes (respect des CGU + API Groups fermée).
- **Tri strict** (un lead réel, pas de spam) ; réponses **templatées/encadrées** (jamais de prix/dispo inventés) ; **opt-out** : un commentateur peut supprimer/masquer ; **kill-switch** côté Amaryllis (`SOCIAL_BOT_DISABLED`).
- **Business Verification** d'Amaryllis Corp requise avant publication.

### Pré-requis avant de soumettre
- [ ] App passée des « Use cases » Ads à un use case incluant **Pages** + **Instagram** (ajouter les produits).
- [ ] Business Verification Amaryllis Corp validée.
- [ ] Webhook configuré (callback `https://villamaryllis.com/api/social-webhook` + verify token `SOCIAL_WEBHOOK_VERIFY_TOKEN` déjà posé côté Cloudflare) et page abonnée (`POST /{PAGE_ID}/subscribed_apps?subscribed_fields=feed`).
- [ ] Capture vidéo enregistrée selon le script ci-dessus.
- [ ] Soumettre chaque permission avec sa justification, puis **publier l'app** (Live mode).
