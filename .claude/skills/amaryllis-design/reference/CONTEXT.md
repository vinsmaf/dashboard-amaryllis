Locatif Dashboard — Handoff vers Claude Code
Ce document est le passage de relais entre une conversation Claude.ai et Claude Code. Il contient tout le contexte business, les décisions techniques prises, et la roadmap pour la suite. À lire en premier avant toute modification du code.


________________


🎯 Vue d'ensemble du projet
Dashboard de gestion locative pour 7 biens en France (6 en Martinique + 1 à Nogent-sur-Marne). Mélange court terme (Airbnb/Booking), moyen terme (contrats 3 mois) et long terme (loyer fixe annuel).


État actuel : un seul fichier React JSX (dashboard-final.jsx, ~2950 lignes) qui tourne comme artifact Claude.ai. Fonctionnel mais limité (pas de backend, pas de déploiement, persistance limitée au navigateur via window.storage).


Objectif Claude Code : transformer ça en application React déployée avec backend pour persister les données et y accéder depuis n'importe où.


________________


👤 Contexte propriétaire
Les 7 biens
ID
	Nom
	Localisation
	Type loc
	Caractéristiques
	Charges/mois
	nogent
	T2 Nogent
	Nogent-sur-Marne
	Court terme
	T2, 45m², terrasse + jardin privé
	1 330€
	amaryllis
	Villa Amaryllis
	Sainte-Luce (Résidence Clos de Bellevue)
	Court terme
	T4, 3 ch suites, piscine privée, vue mer, 120m²
	1 682€
	iguana
	Villa Iguana
	Sainte-Luce
	Long terme (loyer fixe 1800€/mois)
	—
	404€
	geko
	Geko
	Sainte-Luce (Résidence Clos de Bellevue)
	Court terme
	T2, 1 ch, piscine privée, 45m²
	376€
	zandoli
	Zandoli
	Sainte-Luce (Résidence Clos de Bellevue)
	Court terme
	T2, 1 ch, piscine privée, vue jardin+mer, 50m²
	376€
	mabouya
	Mabouya
	Sainte-Luce (Résidence Clos de Bellevue)
	Court terme
	Studio, jacuzzi privé, vue mer, 30m²
	376€
	schoelcher
	T2 Schoelcher
	Schœlcher
	Moyen terme (contrats 3 mois)
	T2, 40m², vue mer exceptionnelle
	1 190€
	Chiffres clés
* Revenus 2025 réels : 161 331€ (total tous biens)
* Cashflow 2025 réel : 71 814€ (extrait Google Sheets)
* Revenus cumulés depuis 2022 : ~654 000€
* Cashflow cumulé depuis 2022 : ~245 000€
* Croissance moyenne annuelle revenus : +15%
* Statut fiscal probable : LMP (à confirmer avec comptable, dépend des autres revenus du foyer)


________________


🗺 Architecture du dashboard
7 onglets principaux
1. 📅 Planning — 4 sous-vues


   * ✅ To-do (check-ins/outs/ménages du jour + 7 jours)
   * 📅 Calendrier Gantt mensuel (drag-free)
   * 🕳 Trous (détecteur de gaps 3+ jours sur 60 jours à venir)
   * 📋 Liste réservations
   * Auto-sync iCal Airbnb au chargement


2. 🎯 Cockpit — KPIs + cards par bien


   * Bilan IA mensuel (bouton "Générer", appel API Anthropic)
   * Graphique revenus mensuels 2026
   * Cards bien : jauges circulaires occupation, sparklines, barres progression


3. 🔮 Prévisionnel — Objectifs + projections


   * Slider objectif annuel
   * 3 scénarios (pessimiste/réaliste/optimiste)
   * Projection mensuelle vs objectif vs 2025
   * Recommandations ADR par bien


4. 💰 Charges — Analyse des coûts


   * KPIs charges YTD vs revenus
   * Camembert répartition par bien
   * Tableau ratio coût (vert/orange/rouge)
   * Alertes automatiques


5. 💼 Pilotage — 5 sous-vues


   * Canaux (Airbnb/Booking/Direct avec commissions estimées)
   * Marché (benchmark concurrentiel par bien, données Booking.com réelles)
   * Fiscal (seuils LMNP/LMP/TVA, projection)
   * Conseil (analyse situation + comparatif régimes + actions concrètes)
   * Détail charges (par poste : crédit, syndic, taxes, etc.)


6. 📈 Historique — 5 sous-vues


   * Annuel (2022→2026 avec cards par année)
   * Mensuel (par bien)
   * Cumul 25/26 (delta par mois)
   * 🌡 Saisonnalité (heatmap par bien × mois)
   * 📅 Jour de semaine (occupation + ADR Lun→Dim)


7. 📊 vs 2025 — Comparatif détaillé tous indicateurs
Composants UI réutilisables
* Gauge — Jauge circulaire SVG (utilisée pour occupation)
* Spark — Sparkline mini-courbe (tendance par bien)
* PBar — Barre de progression avec label
* TodayBanner — Banner persistant en haut (mois courant, actions, top/flop, YTD)
* AISummary — Composant bilan IA avec appel API
* FAB — Floating Action Button navigation rapide


________________


📊 Sources de données
1. Google Sheets (lecture seule via MCP)
File ID : 1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U


Onglets utilisés :


* revenus locatif 2026 : données mois par mois pour l'année en cours
* revenus locatif 2022/2023/2024/2025 : historique annuel
* Synthese_2025 : récap annuel


Structure attendue (à confirmer avec le fichier réel) :


* Lignes 6, 10, 14, 18, 22, 26, 31 : revenus mensuels par bien (cols C-N)
* Lignes 69, 76, 82, 88, 94, 100, 106 : taux d'occupation × 100
* Lignes 70, 77, 83, 89, 95, 101, 107 : ADR
* Lignes 72, 78, 84, 90, 96, 102, 108 : RevPAR
* Lignes 122, 131, 138, 145, 152, 159, 169 : cashflow (cols B-M)


Important : Google Drive MCP est LECTURE SEULE. Pour écrire, il faut soit Claude Desktop + MCP Google Sheets, soit n8n/Make en automation.
2. iCal Airbnb (récupération automatique)
URLs déjà configurées dans le code (ICAL_DEFAULTS) pour 5 biens :


* Villa Amaryllis
* T2 Schoelcher
* Geko
* Mabouya
* Zandoli


Limitation : iCal contient les dates mais PAS les prix (limitation volontaire d'Airbnb). Pour récupérer les prix, il faudrait un channel manager type Hospitable/Smoobu (~29-50€/mois).
3. Booking.com comparables (snapshot juillet 2026)
Données concurrentielles hardcodées dans la vue Marché. Vraies données extraites via le MCP Booking.com côté voyageur :


* 10 villas Sainte-Luce
* 7 T2/studios Sainte-Luce
* 7 T2 Schoelcher
* 7 T2 Nogent


Important : La Villa Amaryllis du propriétaire est listée sur Booking à 467€/nuit (note 9.6/10, 9 avis).
4. Charges détaillées 2025 (hardcodées)
Constante CHARGES_2025 avec décomposition par bien et par poste : crédit, conciergerie, taxes, charges copro, syndic, électricité, eau, internet, assurance. Extraites du Google Sheets.
5. Revenus par canal 2025 (hardcodés)
Constante REVENUS_CANAL_2025. Répartition Airbnb / Booking / Direct / Parking par bien.


________________


💾 Persistance actuelle (et ses limites)
Storage actuel
Le dashboard utilise window.storage (API Claude.ai artifacts) :


* reservations_v2 : liste des réservations chargées
* ical_urls : URLs iCal configurées
Limitations
* ❌ Données perdues si l'utilisateur change de navigateur/appareil
* ❌ Pas de partage possible
* ❌ Pas d'historique des modifications
* ❌ Limite 5MB par clé
* ❌ Le window.storage ne fonctionne QUE dans les artifacts Claude.ai — il faudra le remplacer dans la version déployée
Solution recommandée pour Claude Code
Supabase (gratuit jusqu'à 500MB) :


* PostgreSQL pour les réservations, biens, snapshots
* Auth pour sécuriser l'accès (clé unique propriétaire)
* Real-time si on veut une vue multi-appareils en direct


Tables suggérées :


biens (id, nom, type, charges_fixes, attributes_json)


reservations (id, bien_id, voyageur, canal, checkin, checkout, montant, menage_done, checkin_done)


ical_urls (bien_id, url, last_sync)


snapshots_mensuels (mois, bien_id, revenus, cashflow, occ, adr, revpar) -- import Google Sheets


________________


🚀 Migration recommandée vers Claude Code
Étape 1 — Setup projet React Vite
npm create vite@latest locatif-dashboard -- --template react


cd locatif-dashboard


npm install recharts
Étape 2 — Copier le dashboard
Récupérer dashboard-final.jsx (fichier généré par Claude.ai) et le placer dans src/App.jsx. Quelques adaptations à faire :


* Remplacer window.storage par localStorage pour la phase 1 (test local)
* Ou directement par Supabase pour la phase 2
Étape 3 — Backend Supabase
npm install @supabase/supabase-js


Créer un projet sur supabase.com (gratuit), récupérer URL + anon key.
Étape 4 — Déploiement Netlify
npm install -g netlify-cli


netlify deploy --prod


Coût : 0€. URL custom possible (~12€/an pour un domaine .com).
Étape 5 — Améliorations futures
Voir section "Roadmap" plus bas.


________________


📋 Décisions business clés prises
Fiscal
* Statut probable : LMP (revenus > 23k€/an, à confirmer si > 50% revenus globaux du foyer)
* Action urgente : faire classer les meublés de tourisme via Atout France (150-250€/bien, valable 5 ans) → permet de rester en micro-BIC jusqu'à 83 600€ avec abattement 50%
* À étudier : passage en régime réel + amortissement (probablement plus avantageux vu le niveau de charges)
* Comptable LMP : indispensable à ce niveau d'activité (~1 000-2 000€/an, ROI x5-10)
Stratégie commerciale
* Pas de PriceLabs pour l'instant (trop complexe à configurer selon le proprio)
* Site de réservation directe : à construire ultérieurement
* Mabouya : remis en court terme en mai 2026 (prix suggéré 95€/nuit, mais marché est plutôt à 110-130€ → sous-coté)
* Muscade : location à l'année (725€/mois, déjà en place — pas dans le dashboard car gérée à part)
Insights marché (vue Pilotage > Marché)
* Villa Amaryllis : prix 467€/nuit (haute saison) cohérent avec le top du marché Sainte-Luce
* Mabouya : sous-coté de ~29% (potentiel +12-15k€/an)
* T2 Nogent : sous-coté de ~27% (potentiel +13k€/an)
* Zandoli : sous-coté de ~9% (marge modérée)
* Geko & T2 Schoelcher : alignés sur le marché
Outils techniques évalués
* Hospitable / Smoobu (channel managers ~29-50€/mois) : intéressants si on veut automatiser Airbnb + Booking + prix dynamiques
* PriceLabs / Beyond (pricing dynamique ~25€/mois/bien) : pour plus tard
* Make / n8n : pour automatiser des workflows (ex : sync mensuelle Sheets → dashboard)


________________


⚠️ Pièges techniques rencontrés (à éviter dans Claude Code)
Bugs résolus pendant la conversation, à retenir :


1. Mixing <Bar> + <Line> dans <BarChart> → casse Recharts. Utiliser <ComposedChart> à la place.


2. lastIndexOf sur valeurs dupliquées dans le composant Spark → résultats incorrects. Utiliser une logique simple basée sur les indices.


3. Commentaires // eslint-disable-next-line dans des hooks → peuvent casser certaines configurations de transpilation. À enlever ou déplacer.


4. Composants Recharts mal importés → toujours vérifier que ComposedChart, PieChart, Pie sont importés explicitement.


5. window.storage n'existe que dans Claude.ai → dans Claude Code, le remplacer par localStorage ou Supabase dès l'init.


6. Données dupliquées entre HIST et SEED_BIENS → consolider en une seule source de vérité dans la version Claude Code (idéalement chargée depuis Supabase au démarrage).


________________


🔜 Roadmap suggérée (par ordre de priorité)
Phase 1 — Mise en production (1-2 jours)
* Migrer vers projet Vite
* Remplacer window.storage par localStorage
* Déployer sur Netlify avec URL personnalisée
* Test sur mobile (responsive déjà géré dans le code)
Phase 2 — Backend persistant (2-3 jours)
* Setup Supabase + tables
* Migration des données hardcodées (SEED_BIENS, HIST, CHARGES_2025) vers BDD
* Auth simple (magic link Supabase)
* Synchronisation iCal automatique (Edge Function quotidienne)
Phase 3 — Automatisations (variable)
* Sync Google Sheets quotidienne (Edge Function)
* Export PDF mensuel automatique (pour comptable)
* Webhooks Airbnb/Booking si on prend Hospitable
* Notifications push pour les check-ins/outs du jour
Phase 4 — Évolutions fonctionnelles
* Site de réservation directe (Next.js + Stripe)
* Page publique par bien (vitrine SEO)
* Multi-utilisateurs (si associé/comptable)
* Analytics avancées (régression saisonnière, prévisions ML)


________________


🛠 Quick start Claude Code
Première fois sur ce projet
# Installer Claude Code si pas déjà fait


npm install -g @anthropic-ai/claude-code


# Créer le projet


npm create vite@latest locatif-dashboard -- --template react


cd locatif-dashboard


npm install recharts


# Copier ces 2 fichiers à la racine du projet :


# - CONTEXT.md (ce document)


# - dashboard-final.jsx → src/App.jsx


# Lancer Claude Code dans le dossier


claude


# Premier prompt suggéré :


# "Lis CONTEXT.md et src/App.jsx. Aide-moi à adapter le code pour qu'il fonctionne 


# en local (remplacer window.storage par localStorage), puis déployer sur Netlify."
Pour les prochaines sessions
cd locatif-dashboard


claude


# Référencer toujours CONTEXT.md au début pour que Claude Code reprenne le contexte


________________


📞 Coordonnées et accès
* Fichier principal Google Sheets : 1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U (titre : "finances")
* iCal Airbnb : URLs dans ICAL_DEFAULTS du code
* Booking.com hôte : extranet admin.booking.com (login propriétaire)


________________




Document généré le 14 mai 2026 — synthèse d'une conversation Claude.ai de plusieurs heures. À mettre à jour au fil des évolutions du projet.