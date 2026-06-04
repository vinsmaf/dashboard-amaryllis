# Index ADR — Décisions d'architecture (Amaryllis Locations)

Convention : chaque fichier `specs/*-design.md` est une **décision d'architecture (ADR)** — le « quoi » et le « pourquoi » (problème, approche retenue, garde-fous) ; le `plans/*.md` de même nom est le **plan d'exécution** correspondant (le « comment », étape par étape). Le statut reflète l'état réel (implémenté / complété par une phase suivante / proposé) ; pour ajouter la prochaine décision, créer `specs/<date>-<sujet>-design.md` (ADR suivant), son `plans/<date>-<sujet>.md`, puis une ligne ci-dessous.

| ADR | Date | Titre / Décision | Statut | Plan d'exécution |
|---|---|---|---|---|
| ADR-001 | 2026-05-31 | Triage autonome des agents IA — classer chaque action par risque, auto-exécuter le sûr (drafts non publics), ne remonter à Vincent que €/légal/irréversible (approche A) | ✅ Implémenté | [plan](../plans/2026-05-31-triage-autonome-agents.md) |
| ADR-002 | 2026-06-02 | Programme SEO « Hub & Spoke » des guides — autorité topique en clusters, séquencée technique → maillage → enrichissement (approche A) | ✅ Implémenté | [plan](../plans/2026-06-02-seo-hub-spoke-guides.md) |
| ADR-003 | 2026-06-03 | Source unique des biens, phase 1 — module canonique `src/data/biens.js` (faits cœur) consommé par les consommateurs bug-prone (meta runtime + JSON-LD) + garde-fou de test (approche C, phasée) | ✅ Implémenté · Complété par ADR-004 | [plan](../plans/2026-06-03-biens-source-unique.md) |
| ADR-004 | 2026-06-03 | Source unique des biens, phase 2 — fusion minimale du canonique dans `PublicSite.jsx` (`const BIENS` + JSON-LD client), affichage public inchangé | ✅ Implémenté · Complété par ADR-005 | [plan](../plans/2026-06-03-biens-source-unique-phase2.md) |
| ADR-005 | 2026-06-03 | Source unique des biens, phase 3 — bloc JSON-LD `@graph[7]` d'`index.html` généré par prerender depuis le canonique (suppression du bloc statique, notes réelles) | ✅ Implémenté | _aucun plan séparé_ |
| ADR-006 | 2026-06-03 | Filet de tests + gate au déploiement — `npm run test:run` en barrière dure de `deploy-pages.sh` + extraction/tests des calculs argent (`pricing.js`, commissions) | ✅ Implémenté | [plan](../plans/2026-06-03-filet-tests-gate.md) |
| ADR-007 | 2026-06-03 | Contrôles de cohérence données auto — moteur de règles pur (`coherenceRules.js`) + cron `coherence-check.js` sur `direct_bookings` → inbox `client_errors` + ntfy sur critique | ✅ Implémenté | [plan](../plans/2026-06-03-coherence-checks.md) |
| ADR-008 | 2026-06-03 | Imports réservations idempotents + audit locale FR — dédup par clé-contenu `bienId\|checkin\|checkout` (`resaDedup.js`) miroitée dans le GAS (import + REVENUS_AUTO) | ✅ Implémenté | [plan](../plans/2026-06-03-imports-idempotents.md) |
| ADR-009 | 2026-06-03 | Occupation réelle → Revenue Manager, phase 1 (voir) — `occupancy.js` pur + `runOccupancySnapshot` Worker peuple `rm_kpi_snapshots` (30j/90j) + affichage RM | ✅ Implémenté · Complété par ADR-010 | [plan](../plans/2026-06-03-occupation-rm-phase1.md) |
| ADR-010 | 2026-06-03 | Occupation réelle → moteur de reco RM, phase 2 (agir) — `rmOccupancyAdjust.js` (barème occupation) injecté dans `calcDateReco`, advisory, prix clampé `[min,max]` | ✅ Implémenté | [plan](../plans/2026-06-03-occupation-rm-phase2.md) |

## Notes

- **Plan sans spec séparé** : `plans/2026-06-03-occupation-rm-phase3-dates-reservees.md` est un **raffinement de la phase 2 (ADR-010)**, pas une décision d'architecture distincte → pas d'ADR dédié (à rattacher à ADR-010 si besoin de tracer une phase 3).
- **ADR-005 (biens-source-unique phase 3)** n'a **pas de plan d'exécution séparé** dans `plans/` — la spec sert directement de référence d'exécution (chantier court, livré dans la session de juin 2026).
- **Convention de nommage** : tous les ADR sauf un suivent `specs/<base>-design.md` ↔ `plans/<base>.md`. **Exception** : ADR-001 — la spec est `2026-05-31-gestion-agents-triage-autonome-design.md` mais son plan est `2026-05-31-triage-autonome-agents.md` (base différente).
