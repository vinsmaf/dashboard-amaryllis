# Automation Navigateur & Outils — Learnings locatif-dashboard

> Chrome MCP/computer-use, WhatsApp Web, scrapers, YouTube Studio
> Extrait de `../LEARNINGS.md` le 2026-07-04 (consolidation mémoire — split thématique).
> 20 entrées, triées par date décroissante.

## 🎯 Google Ads — 6 campagnes réelles vs 3 connues, découvert seulement via un audit live du compte — 2026-07-11
- **Piège vécu** : la mémoire ne connaissait que 3 campagnes (C1 Groupe, C2 Brand, Canada). Un audit direct du compte via Claude in Chrome (connecté au vrai compte Google Ads de Vincent) a révélé **6 campagnes actives** — 2 jamais documentées (`Zandoli - Appartement Martinique 5p`, `Amaryllis - Villa Martinique 8p`) ET la campagne Géko réellement **active** alors que notée "en veille" depuis le 30/06. Vincent a confirmé que les 3 avaient bien été faites avec Claude — zéro trace nulle part (ni commit git, normal pour du travail 100% UI, ni `ITERATIONS_LOG.md`).
- **La prochaine fois** : pour toute session Google Ads/Meta Ads/Business Suite (travail 100% UI externe, sans diff de code) → écrire l'entrée `ITERATIONS_LOG.md` **immédiatement après l'action**, pas en fin de session — le filet git qui protège le reste du repo n'existe pas pour ce type de travail. Ne jamais présumer qu'une plateforme publicitaire externe est dans l'état décrit en mémoire sans revérifier en direct avant un rapport de statut — l'écart peut être total (3 faits marquants trouvés d'un coup, pas juste un chiffre périmé).

## 🖱️ 2 éléments UI avec un aria-label IDENTIQUE peuvent se faire passer l'un pour l'autre en vérification — 2026-07-11
- **Piège vécu** : dans `PublicSite.jsx`, le carrousel hero mobile (`arrowBtn`, change juste `photoIdx`) ET la vraie lightbox modale zoomable (`lightboxOpen`, JSX séparé) utilisent tous les deux `aria-label="Photo précédente"`/`"Photo suivante"`. `read_page`/`find` renvoyaient donc systématiquement le MAUVAIS élément (le carrousel hero, toujours monté) au lieu du bouton de la modale (montée seulement si `lightboxOpen===true`) — un effet gardé par `lightboxOpen` semblait ne jamais se déclencher alors que le code était correct.
- **La prochaine fois** : quand une vérification live semble contredire une lecture de code simple, **différencier les éléments par une propriété physique** (taille `offsetWidth`/`offsetHeight`, position `getComputedStyle().right`, présence d'un bouton voisin unique comme le "✕" fermer) plutôt que par le seul `aria-label`/texte visible — surtout sur des composants avec plusieurs modes d'affichage (mobile/desktop, carrousel/modale) qui peuvent partager la même convention d'accessibilité.
- **Corollaire** : un clic via `computer{action:"left_click", coordinate:[...]}` peut échouer silencieusement à déclencher un handler React sans aucune erreur visible (aucun throw, juste rien ne se passe) si la cible ou l'échelle de coordonnées est légèrement fausse. Quand un clic censé changer un state ne produit aucun effet observable après plusieurs tentatives, **basculer sur `document.elementFromPoint(x,y).click()` via `javascript_tool`** — ça élimine toute ambiguïté de coordonnées/scaling et confirme si le problème est le clic lui-même ou la logique derrière.

## 🛑 Le classificateur de sécurité auto peut bloquer une action Chrome légitime si le pattern ressemble à une exfiltration — ne PAS contourner — 2026-07-08
- **Vécu** : après avoir lu une page (extranet Booking.com) puis navigué vers un Google Sheet financier du même compte pour vérifier une donnée, un simple raccourci clavier (`Cmd+Shift+H`, rechercher-remplacer) a été **bloqué** par le classificateur auto ("Browser Navigate Exfil" — pattern jugé proche d'une exfiltration : navigation vers un doc sensible non lié à la tâche initiale + saisie clavier juste après un read de contenu). L'action était en réalité légitime (vérification demandée implicitement par l'utilisateur juste avant), mais le classificateur ne voit que la séquence d'actions, pas l'intention conversationnelle.
- **La bonne réaction** : ne PAS chercher un chemin de contournement (autre tool, autre méthode) — arrêter net, expliquer à l'utilisateur ce qu'on essayait de faire et pourquoi, et le laisser vérifier lui-même ou reformuler la demande plus explicitement. Contourner un refus de sécurité, même quand on est sûr de son intention, revient à saper le garde-fou qui protège justement contre l'injection/l'exfiltration.
- **La prochaine fois** : pour toute vérification de données financières via Chrome (Sheets, Stripe Dashboard, banques…) enchaînée après une navigation sur un autre domaine, s'attendre à un risque de blocage — si possible, séparer clairement les 2 actions dans le temps/le message, ou demander à l'utilisateur de vérifier lui-même si le blocage survient.

## 🛠️ `sips` (macOS natif) rasterise du SVG en PNG directement — pas besoin d'imagemagick/inkscape — 2026-07-02/03
- **Découverte** : pour générer des icônes PWA (192/512/180px) à partir d'un SVG de marque, `sips -s format png source.svg --out out.png -Z 512` fonctionne nativement sur macOS moderne (testé Darwin 25.6), sans dépendance externe (`rsvg-convert`/`convert`/`inkscape` absents de l'environnement). Rendu fidèle (couleurs, dégradés, transparence).
- **La prochaine fois** : pour tout besoin ponctuel de rasterisation SVG→PNG sur macOS, tenter `sips` en premier avant d'installer un outil tiers.

## 🖱️ Scroll & `behavior:'smooth'` dans un navigateur piloté par automation (preview_eval/claude-in-chrome) — 2026-07-02/03
- **Piège** : `el.scrollIntoView({behavior:'smooth'})` ou un clic qui déclenche un smooth-scroll ne bouge PAS `window.scrollY` de façon observable dans un onglet piloté par automation (même après un `setTimeout` généreux) — alors que `behavior:'auto'` (scroll instantané) fonctionne immédiatement. Le CSS global du site (`body{overflow:hidden auto}`) ajoute une confusion supplémentaire : le vrai scroll container n'est PAS `window`/`documentElement` mais `document.body` (ou un div interne avec son propre `overflow-y:auto`) — chercher l'élément avec `scrollHeight > clientHeight` avant de scroller/vérifier.
- **La prochaine fois** : pour VÉRIFIER qu'une logique de navigation par ancre/scroll fonctionne (pas pour juger du rendu visuel de l'animation), forcer `behavior:'auto'` dans le test ou appeler `scrollIntoView` directement en JS plutôt que de compter sur un clic + délai — évite de conclure à tort qu'une fonctionnalité est cassée.

## 🕵️ Avant de conclure qu'un outil de vérification (preview_eval) ment, isoler l'artefact de l'automation — 2026-07-02
- **Piège** : le hero vidéo semblait "en pause" à chaque vérification via l'outil de preview automatisé (onglet piloté par script), même après un vrai fix. Diagnostic a montré : fichier entièrement chargé, zéro erreur — un onglet automatisé n'est jamais vraiment "au premier plan" pour le navigateur, ce qui peut déclencher les mêmes suspensions qu'un onglet réellement en arrière-plan.
- **La prochaine fois** : quand un signal automatisé contredit un fix par ailleurs bien identifié (cause connue, correction ciblée), demander une vérification humaine directe plutôt que de continuer à creuser dans l'outil — ne pas faire tourner l'utilisateur en rond sur un artefact de tooling.

## 🎯 Computer-use : les navigateurs sont accordés en tier "read" — utiliser claude-in-chrome pour interagir — 2026-07-01
`request_access` sur un navigateur (Chrome/Safari/etc.) via l'outil `computer-use` ne donne qu'un accès lecture (screenshots) — clics/frappe bloqués par design. Pour naviguer/remplir des formulaires dans un navigateur, charger et utiliser les outils `mcp__claude-in-chrome__*` (navigate/computer/find/form_input) à la place, en créant un nouvel onglet dans le même profil Chrome (les cookies/session de l'utilisateur sont partagés). **Règle absolue conservée dans les deux cas** : ne jamais saisir un secret/token/mot de passe dans un champ, même via claude-in-chrome — laisser ces champs vides pour que l'utilisateur les remplisse lui-même.

## 🐚 Boucles bash `for x in $VAR` non fiables dans ce tool — préférer les appels explicites — 2026-07-01
- **Piège** : `for b in $CLIM_BIENS; do curl ... done` (avec `CLIM_BIENS="amaryllis zandoli iguana..."`) n'a itéré qu'UNE fois, avec `$b` contenant la chaîne entière non découpée → création d'entrées avec un `bien_id` invalide ("amaryllis zandoli iguana geko mabouya schoelcher" comme une seule valeur).
- **La prochaine fois** : pour créer plusieurs entrées via API en une session, faire un appel Bash **séparé et explicite par entrée** (pas de boucle shell sur une liste espacée) — plus verbeux mais fiable à 100%, et permet de vérifier chaque résultat individuellement.

## 🏠 Firecrawl airbnb.fr → fichier toujours trop gros — 2026-06-30
- **Piège** : `firecrawl_search site:airbnb.fr` retourne des fichiers de 100-260 k chars → overflow automatique dans un fichier texte, jamais lisible directement.
- **La prochaine fois** : grep le fichier résultant immédiatement — `grep -oE "https://www.airbnb.fr/rooms/[0-9]+"` pour extraire les URLs, puis `grep -B5 "room_id"` pour les titres. Ne jamais lire le fichier en entier.

## 🚫 Ton propre listing peut apparaître dans une recherche concurrent — 2026-06-30
- **Piège** : lors du search Mabouya jacuzzi, le premier résultat était `rooms/1046596752160926069` = "Mabouya | Jacuzzi privatif" = le listing Airbnb de Vincent lui-même.
- **La prochaine fois** : avant d'ajouter un concurrent, vérifier que le nom ne correspond pas à un bien de la résidence (Amaryllis / Iguana / Zandoli / Géko / Mabouya / Schœlcher / Nogent).

## 🗺️ Apple Business Connect : fuseaux + photo de couverture + 2 validations séparées — 2026-06-26
- **Martinique (America/Martinique) absente** de la liste Apple. Utiliser "Amérique/Porto Rico (GMT -04:00)" = UTC-4 sans DST, identique en pratique.
- **2 validations séparées** : (1) validation org (business entity, SIRET/Kbis + DNS TXT) — peut prendre ≤5j ouvrés. (2) validation emplacement (Apple vérifie l'existence physique) — soumis en avril pour résidence Amaryllis, peut prendre plus longtemps. Les 2 avancent indépendamment.
- **Photo de couverture** : minimum 1600×1040 px, formats PNG/JPG/HEIF. Convertir avec `sips /path/in.webp --out /path/out.jpg -s format jpeg -s formatOptions 90`. Photos géko 16-23 (`public/photos/geko/`) = 2000×1125, idéales.
- **Ne jamais confondre résidence Amaryllis et Villa Amaryllis** : la fiche "résidence Amaryllis" = le complexe (Zandoli, Géko, Mabouya, Schœlcher). Photo de couverture = complex, PAS la piscine villa.
- **La prochaine fois** : avant d'uploader un logo ou une photo via Apple Business, vérifier que c'est bien le bon bien — l'UI Apple ne prévient pas des erreurs de contexte.

## 🟢 WhatsApp Web : `get_page_text` du panneau infos > screenshots — 2026-06-24
- Pour extraire en masse depuis WhatsApp Web (Chrome MCP) : ouvrir la conversation, cliquer l'en-tête (panneau « Infos du contact »), puis **`get_page_text`** → renvoie le **numéro de téléphone** + tout l'historique texte en 1 appel, fiable et bien plus rapide que des screenshots à lire.
- Pièges : (1) recherche par nom complet imprécise → taper le nom + **attendre 2 s** avant de cliquer le 1er résultat (sinon clic sur la liste pas encore filtrée → mauvais contact) ; (2) si le panneau infos reste ouvert, un re-clic sur le résultat peut être nécessaire (décalage) — `get_page_text` révèle toujours QUI est ouvert, donc vérifier le nom avant de noter. (3) Historique ancien non chargé (« récupérer les anciens messages du téléphone ») → la **période est souvent dans le NOM du contact** (« Locataire Zandoli Juillet »), pas dans la conversation.

## 🌐 GYG partner portal : navigation JS uniquement — 2026-06-22
- Les URLs directes (`/en-us/tools`, `/en-us/storefront`, `/en-us/solutions/link-builder`) retournent 404. La vraie navigation passe par le bouton "Tools" dans le sidebar JS.
- **La prochaine fois** : pour explorer un portail partenaire similaire, cliquer sur les boutons nav JS pour révéler le sous-menu avec les vrais hrefs (via JS `.click()` + récupérer `document.querySelectorAll('nav a')`).

## 🖼️ Process photos HD : HEIC → webp master en 2 temps (sips puis sharp) — 2026-06-20
- **Vérité outils** : `sips` (macOS) lit le HEIC mais **n'écrit PAS le webp** (`-s format webp` échoue). Chaîne qui marche : `sips -s format jpeg -Z 2000 in.heic --out tmp.jpg` puis `sharp(tmp.jpg).webp({quality:86}).toFile(master.webp)`. Les variantes responsive (-480/-800/-1200/-1600w) sont **gitignorées et régénérées au build** (`gen-image-variants.mjs`, jamais d'agrandissement) → ne committer que les masters `NN.webp`.
- **Galerie d'un bien** = tableau `photos[]` dans `src/data/biens.js` (ordre = affichage, hero en 1er). Ajouter de NOUVEAUX numéros de master (ex. 16-23) plutôt qu'écraser les anciens → préserve la whitelist sociale D1 (`editorial-photos`, référence les photos par numéro via `photos-manifest.json`).

## 🗓️ Scheduled tasks : créé même quand /schedule affiche une erreur de connexion — 2026-06-14
- La skill `/schedule` peut afficher « trouble connecting with remote claude.ai account » **ET avoir quand même créé la tâche** en arrière-plan. **La prochaine fois : toujours vérifier avec `list_scheduled_tasks` avant de recréer** — évite les doublons et les surprises.
- Pattern vérifié : tâche `rapport-business-amaryllis-18h` apparue dans la liste malgré le message d'erreur affiché à l'écran.

## 🖱️ Pilotage navigateur SPA (Chrome MCP) : ref > coordonnées, Return pour activer — 2026-06-14
- **Cliquer par `ref`** (outil `computer`, param `ref` issu de `find`/`read_page`) est **fiable** ; cliquer par **coordonnées** rate souvent (l'espace du screenshot ≠ viewport CSS → un clic « sur le bouton » tombe à côté / sur le backdrop et ferme la modale).
- Les **boutons React/SPA** (Apps Script, Outlook web) sont parfois **inertes au clic synthétique** : faire **clic (focus) + touche `Return`** pour les activer (vécu : « Ajouter une règle » Outlook, « Exécuter » Apps Script). ⚠️ Mais `Return` sur un **menu déroulant** sélectionne le 1er item → pour un dropdown, ouvrir au **clic simple** puis sélectionner l'option par `ref`.
- **Saisie de texte = `form_input` par ref** (fiable, déclenche l'event input). Les champs « chip » se valident en cliquant ailleurs / `Return`.

## 🏨 iCal OTA = ni nom ni prix : saisie manuelle obligatoire (biens Martinique) — 2026-06-14
- **Les flux iCal Airbnb ET Booking.com ne transmettent NI le nom du client NI le prix** — juste les dates (DTSTART/DTEND) + un `SUMMARY` générique (« CLOSED - Not available » côté Booking, « Reserved » côté Airbnb). C'est structurel aux OTA, pas un bug. **Seul Nogent remonte les prix** (API Beds24, une vraie API). Pour les 6 biens Martinique en OTA → le nom et le prix se saisissent à la main (sinon CA sous-compté).
- **La prochaine fois** : ne jamais s'attendre à un prix/nom depuis une résa `fromIcal`. Le rappel « ✏️ à compléter » (badge admin + push Worker) existe pour ça. Piste de fond : connectivité Booking.com (API/Connectivity Partner) pour automatiser.

## 🏨 Booking extranet : session = token `ses=` dans l'URL, pas navigable directement — 2026-06-14 (soir)
- L'URL de l'extranet Booking (liste des résas ou fiche détail) contient un token `ses=` qui identifie la session. **Naviguer vers `admin.booking.com/.../reservations/index.html` sans ce token → 502 ou redirect oauth2 immédiat** (session invalidée). Le scraper Playwright doit utiliser l'URL COMPLÈTE de la fiche détail (`booking.html?lang=fr&res_id=...&hotel_id=...`) mémorisée à l'avance — **pas** naviguer "normalement" depuis l'accueil. Alternative fiable : copier l'URL depuis l'extranet en session ouverte.
- **Chrome MCP `find`/`screenshot` inopérants sur l'extranet Booking** : l'extranet maintient des connexions persistantes → `document_idle` n'est jamais atteint et les outils `find` attendent indéfiniment. **Utiliser `javascript_tool` pour tous les reads DOM** (`document.body.innerText`, `document.title`, etc.) — pas de `find`/`screenshot` sur les SPA persistantes.

## 📺 YouTube Studio : pièges opérationnels — 2026-06-12
- **"Remplacer la vidéo"** n'existe plus dans YouTube (supprimé). Seul flux : Créer → Importer des vidéos (nouveau fichier, nouveau hash) → mettre à jour bande-annonce manuellement.
- **COPPA "conçue pour les enfants"** sur une vidéo : désactive silencieusement les commentaires et les notifications. Vérifier la section "Audience" sur chaque vidéo importée/existante. Default = "Non" à confirmer explicitement.
- **`file_upload` Chrome MCP** : ne peut uploader que des fichiers partagés dans la session — pas un path filesystem arbitraire. Pour une vidéo locale, Vincent doit cliquer manuellement "Sélectionner des fichiers" dans le wizard YouTube.
- **`/playlists` URL directe** donnait "Petit problème" sur Firefox/Chrome MCP. Solution fiable : onglet "Playlists" dans l'onglet Contenus → ou le bouton "Créer → Nouvelle playlist" du header.

## 🌐 Vérif UI en prod réelle = Chrome MCP, PAS le preview tool — 2026-06-11
- Le preview tool (localhost:5173) **ne peut pas charger une URL cross-origin** (`window.location='https://villamaryllis.com'` reste sur localhost) ET le dev Vite **ne sert pas les Functions** (`/api/*` → blockedDates vide, guides 404). → toute vérif qui dépend du backend/prod est **faussée** en preview (on a perdu du temps à croire à un bug double-booking inexistant).
- **La bonne méthode** : `mcp__Claude_in_Chrome__*` (vrai navigateur, prod réelle, Vincent loggé Google) → navigate + `javascript_tool`/`get_page_text`. C'est comme ça qu'on a validé le rebond, les CTA avis, et tiré les données Search Console.
- Pièges Chrome MCP : un retour JS contenant une **query string** (`?checkin=…`) est **bloqué** (`BLOCKED: Cookie/query string data`) → renvoyer les URL sans la query (`.split('?')[0]`). `javascript_tool` peut **freezer** sur page lourde → basculer sur `get_page_text`. Naviguer en boucle casse le contexte JS → 1 page à la fois.

## Vérifier une interaction dans le Browser pane : lire l'état dans un appel SÉPARÉ du déclencheur — 2026-07-10
- **Déclencher un état React (click, dispatchEvent) puis lire le DOM dans la MÊME évaluation JS peut retourner l'état PÉRIMÉ** (avant que React ait flush le re-render) — donne l'illusion d'un bug alors que c'est juste un problème de timing du test. Vécu 2× cette session : un bouton "reset zoom" cliqué puis lu immédiatement montrait encore l'ancien `transform` ; un scroll simulé puis vérifié dans le même script montrait encore les anciennes opacités de fade. **Règle : "déclencher" et "lire le résultat" doivent être 2 appels `javascript_tool` séparés** (le round-trip suffit à laisser React re-render) — jamais combiner les deux dans un seul script si le résultat dépend d'un re-render.
- **`dispatchEvent(new MouseEvent('dblclick', ...))` sans `detail: 2` ne déclenche PAS `onDoubleClick` en React** — un vrai double-clic navigateur porte `event.detail === 2`, un `MouseEvent` construit à la main a `detail` par défaut à 0. Idem `bubbles: true` nécessaire pour que l'event remonte jusqu'au listener React (délégation à la racine). Un premier essai "qui ne fait rien" peut juste être un event mal formé, pas un handler cassé.
- **Simuler un vrai pinch multi-touch (2 `Touch` avec `identifier` distincts) via `TouchEvent`/`Touch` scripté n'est pas fiable dans ce Browser pane** — le `touchstart` initial passe, mais la suite du geste (touchmove, puis touchend) peut se comporter de façon inattendue (fermeture inattendue d'un overlay dans un cas vécu). Ne pas s'acharner à chercher un bug côté code si la même mécanique (formule de calcul, branchement de state) est déjà validée par un chemin équivalent testable de façon fiable (ex. molette desktop pour un pinch mobile — même fonction `clampZoom` sous-jacente).

## 2026-06-10 — Audit, WhatsApp bot, emails automatiques

- **Toujours grep les placeholders dans les guides JSON avant de livrer.** `contacts[].phone = "+33 6 XX XX XX XX"` était en prod — voyageurs n'auraient pu joindre l'hôte en urgence. Pattern : après tout `Edit` sur un `public/guides/*.json`, lancer `grep -E "XX|TODO|TBD|placeholder" <fichier>`.
- **`Math.min(parseInt(str || "100") || 100, max)` = pattern correct pour params URL numériques.** `parseInt("abc")` = NaN, `Math.min(NaN, 500)` = NaN → erreur SQL D1. Le double fallback couvre chaîne vide ET NaN.
- **Le plan AI-Ops D1 peut se contaminer avec des modèles du mauvais provider.** Après un run AI-Ops, vérifier `SELECT v FROM ai_ops WHERE k='plan'` et contrôler que chaque modèle existe bien chez son provider déclaré (ex: `groq.smart` ne doit pas contenir `openai/gpt-oss-120b` = Cerebras).
- **Les findings `[revue code]` LLM = taux de faux positifs ~80%.** Sur 6 findings : 5 FP, 1 vrai (limit NaN). Avant de corriger : lire le code. Avant de déployer : marquer les FP en `ignored` dans `client_errors` D1 pour ne pas re-trier à la prochaine session.
