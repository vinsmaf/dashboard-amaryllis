# Bot social Amaryllis — Dossier App Review Meta

**App :** Amaryllis Dashboard · App ID `1248539197126557` · Business : Amaryllis Corp (`609408700286001`)  
**Page FB :** Amaryllis Location (`115471004486809`) · **IG :** @amaryllislocations (`17841450886833537`)  
**Site :** https://villamaryllis.com · **Webhook :** https://villamaryllis.com/api/social-webhook

---

## ÉTAPE 0 — Avant tout : activer les permissions en mode développement

Sans cette étape, même le mode dev ne fonctionnera pas.

1. Aller sur https://developers.facebook.com/apps/1248539197126557
2. Menu gauche → **App Review** → **Permissions and Features**
3. Pour chaque permission ci-dessous : cliquer **"Add"** → choisir **"In Development"**
   - `pages_read_engagement`
   - `pages_manage_engagement`
   - `pages_messaging`
   - `instagram_manage_comments`
   - `instagram_manage_messages`
4. Sauvegarder.

→ Le poller API fonctionnera ensuite sans App Review (pour ton compte admin uniquement).

---

## ÉTAPE 1 — Pré-requis avant de soumettre l'App Review

- [ ] **Business Verification** d'Amaryllis Corp validée (paramètres du compte Business → Vérification)
- [ ] App en mode **Live** (pas Development) au moment de la soumission
- [ ] Webhook `https://villamaryllis.com/api/social-webhook` actif et abonné à `feed` (FB) + `comments` (IG)
- [ ] Page abonnée : `POST /115471004486809/subscribed_apps?subscribed_fields=feed` avec ton page token
- [ ] **Politique de confidentialité** accessible en ligne (ajouter `/confidentialite` sur villamaryllis.com ou utiliser une page Notion publique)
- [ ] **Capture vidéo** enregistrée (voir script §4 ci-dessous)
- [ ] Compte de test Meta créé (Roles → Test Users dans l'App Dashboard) avec droits sur la page de test

---

## ÉTAPE 2 — Description générale de l'app (à coller dans "App Details")

**App Name :** Amaryllis Dashboard  
**App Category :** Business  

**App Description (EN) :**

> Amaryllis Dashboard is the internal management tool for Amaryllis Locations, a vacation rental company operating 7 properties in Martinique and Nogent-sur-Marne, France (website: villamaryllis.com).
>
> The app provides two core capabilities:
> 1. **Social lead detection**: automatically identifies comments on our own Facebook Page and Instagram account from users seeking vacation rentals in Martinique, and sends us a pre-drafted reply for manual review and posting.
> 2. **Automated customer service**: when enabled, the system replies publicly to qualifying comments with a welcome message and our website link, and sends one private follow-up message per user.
>
> The app only accesses our own Page and Instagram account. It never reads third-party pages, groups, or users' private data beyond what they voluntarily post in a comment on our content.

**Privacy Policy URL :** https://villamaryllis.com/confidentialite  
*(à créer avant soumission — peut être une page simple)*

---

## ÉTAPE 3 — Justifications par permission (copier-coller dans chaque formulaire)

### `pages_read_engagement`

**How will your app use this permission?**
> Amaryllis Locations uses `pages_read_engagement` to read comments posted by users on our own Facebook Page (Amaryllis Location, Page ID 115471004486809). Our system scans these comments to identify users who are actively looking for vacation rentals in Martinique. When a qualifying comment is detected, a pre-drafted welcome reply is generated and either sent to our team for manual posting, or posted automatically depending on the mode. We do not read comments on any third-party pages. We only access our own Page's content.

**Step-by-step instructions for the reviewer:**
> 1. Open the app's test environment at https://villamaryllis.com/api/social-poll?secret=[TEST_SECRET]
> 2. On a post of the Amaryllis Location test page, post a comment such as: "Bonjour, je cherche une location en Martinique pour août, avez-vous des disponibilités ?"
> 3. Call the endpoint above — it should return `scanned: 1, leads: 1` and send a notification.
> 4. The system has identified the comment as a rental inquiry and generated a draft reply containing our website URL.
> 5. No reply is posted automatically in shadow mode (default). In live mode, the reply appears under the comment within seconds.

---

### `pages_manage_engagement`

**How will your app use this permission?**
> Amaryllis Locations uses `pages_manage_engagement` to post a single public reply to comments on our own Facebook Page from users who have expressed interest in renting one of our properties. The reply is a short, templated welcome message (approximately 20 words) containing our website link (villamaryllis.com) so the user can check availability and rates directly. We never reply to comments on third-party pages. We only use this permission on our own Page (Amaryllis Location, Page ID 115471004486809). The system includes a kill-switch (`SOCIAL_BOT_DISABLED=1`) and operates in shadow mode by default (no posts sent until explicitly enabled).

**Step-by-step instructions for the reviewer:**
> 1. Configure the webhook endpoint: `https://villamaryllis.com/api/social-webhook` with verify token provided separately.
> 2. Subscribe the test page to the `feed` field via the webhook.
> 3. On a post of the test page, post a comment: "Looking for a villa in Martinique for 2 weeks in August, any availability?"
> 4. Within 5 seconds, the system should post a public reply under the comment: a short welcome message + website link.
> 5. The reply appears as coming from the Page (Amaryllis Location), not from a personal account.
> 6. Check the admin dashboard at https://villamaryllis.com/admin (login: provided separately) → 🐞 tab → `social_bot_log` to see the logged entry.

---

### `pages_messaging`

**How will your app use this permission?**
> Amaryllis Locations uses `pages_messaging` to send one private reply (via Facebook's `private_replies` endpoint) to users who comment on our Page expressing interest in renting a property. This private message contains a personalized welcome and a direct link to our booking website. We strictly follow Facebook's policy of one private reply per comment. We never initiate unsolicited messages. We never send messages to users who have not first commented on our Page's content. The private message feature is only active in live mode (controlled by the `SOCIAL_BOT_MODE` environment variable).

**Step-by-step instructions for the reviewer:**
> 1. Enable live mode by setting `SOCIAL_BOT_MODE=live` (contact us for test environment access).
> 2. Post a comment on the test page: "Bonjour, je cherche une location saisonnière en Martinique."
> 3. Within 5 seconds: a public reply appears under the comment, AND the commenting user receives one private message from the Page with our booking website link.
> 4. Post a second comment from the same user — no additional private message is sent (deduplication via D1 `social_bot_log` table, PRIMARY KEY on `(platform, comment_id)`).

---

### `instagram_manage_comments`

**How will your app use this permission?**
> Amaryllis Locations uses `instagram_manage_comments` to read comments on our business Instagram account (@amaryllislocations, IG account ID 17841450886833537) and to reply to comments from users seeking vacation rentals. The system polls our recent media for new comments, classifies them using an AI model (Groq/Mistral), and — when a genuine rental inquiry is detected — posts a public reply with our website link. We only access our own Instagram account. We do not read or interact with any third-party accounts.

**Step-by-step instructions for the reviewer:**
> 1. On a post of the @amaryllislocations test Instagram account, post a comment: "Do you have any villas available in Martinique for September? 🌴"
> 2. Call `https://villamaryllis.com/api/social-poll?secret=[TEST_SECRET]` — it should detect the IG comment and return `leads: 1`.
> 3. In live mode, a reply appears under the Instagram comment: a short welcome message + our website link.

---

### `instagram_manage_messages`

**How will your app use this permission?**
> Amaryllis Locations uses `instagram_manage_messages` to send one direct message to Instagram users who comment on our posts expressing interest in our vacation rentals. The message contains a short welcome and a link to our direct booking website. We only send one message per commenting user and only in response to a comment they have voluntarily posted on our content. We never send unsolicited messages or bulk DMs. All messages are sent as follow-ups to genuine rental inquiries, giving the user a convenient way to start the booking process.

**Step-by-step instructions for the reviewer:**
> 1. Enable live mode (contact us for test credentials).
> 2. From a test Instagram account, comment on an @amaryllislocations post: "Looking for a 1-week rental in Martinique for a group of 6."
> 3. The system: (a) posts a public reply under the comment, (b) sends one DM to the commenter with our website link.
> 4. Verify in the Instagram DM inbox of the test account that exactly one message was received.

---

## ÉTAPE 4 — Script de la capture vidéo (obligatoire, ~2 min)

**Outil recommandé :** QuickTime (Mac) ou Loom — résolution min. 720p.

```
0:00 – Ouvrir la page Facebook "Amaryllis Location" (page de test).
0:10 – Publier un commentaire sur un post : "Bonjour, je cherche une
       location en Martinique pour cet été, avez-vous des disponibilités ?"
0:20 – Montrer le terminal / le log en temps réel :
       "social-poll → scanned: 1, leads: 1"
0:30 – Revenir sur le post Facebook : une réponse publique est apparue
       sous le commentaire (message d'accueil + lien villamaryllis.com).
0:40 – Ouvrir les DMs de la page : 1 message privé envoyé au commentateur.
0:55 – Ouvrir le dashboard admin https://villamaryllis.com/admin →
       onglet 🐞 Bugs/Logs → montrer l'entrée social_bot_log :
       platform=fb, lead=1, action=replied.
1:05 – Répéter avec Instagram (@amaryllislocations) :
       commentaire → réponse publique → DM reçu.
1:30 – Montrer le kill-switch (SOCIAL_BOT_DISABLED) et le mode shadow
       (réponse envoyée en ntfy à l'admin, RIEN posté publiquement).
1:50 – Fin.
```

**Narration à lire pendant la vidéo :**
> "This is Amaryllis Locations' internal dashboard. When a user comments on our Facebook Page or Instagram expressing interest in renting a property in Martinique, the system detects it, generates a templated welcome reply, and sends a private follow-up. The bot only acts on our own content, never on third-party pages or groups. Replies are short, pre-approved templates — the system never invents prices or availability."

---

## ÉTAPE 5 — Compte de test pour le reviewer

Créer un utilisateur test dans l'App Dashboard (Roles → Test Users) :
- Email : `meta-reviewer@villamaryllis.com` (à créer)
- Rôle sur la page : **Editor** (pas Admin — pour tester les scopes minimaux)
- Accès au dashboard : URL + mot de passe fourni dans les notes de soumission

Notes à inclure dans le champ "Notes for the reviewer" :
> Test environment: https://villamaryllis.com  
> Admin dashboard: https://villamaryllis.com/admin (password: provided separately)  
> Social poll test endpoint: https://villamaryllis.com/api/social-poll?secret=[contact us]  
> The bot is in SHADOW MODE by default (no public posts). To see the auto-reply feature, contact us at contact@villamaryllis.com and we will temporarily enable LIVE mode for the review session.  
> Webhook URL: https://villamaryllis.com/api/social-webhook  
> The system logs all actions in the `social_bot_log` D1 table, visible in the admin dashboard under the 🐞 tab.

---

## Résumé des permissions et niveau d'accès requis

| Permission | Niveau actuel | Niveau cible | App Review requis |
|---|---|---|---|
| `pages_read_engagement` | Standard Access | Advanced Access | ✅ oui |
| `pages_manage_engagement` | — | Advanced Access | ✅ oui |
| `pages_messaging` | Standard Access | Advanced Access | ✅ oui |
| `instagram_manage_comments` | Standard Access | Advanced Access | ✅ oui |
| `instagram_manage_messages` | — | Advanced Access | ✅ oui |

**Délai estimé :** 5 à 10 jours ouvrés après soumission. Business Verification d'Amaryllis Corp doit être validée avant la soumission (sinon rejet immédiat).
