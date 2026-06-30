# 🧠 Mémoire structurée — locatif-dashboard (Amaryllis Locations)

> Système de mémoire indexé. **Point d'entrée à lire en début de session.**
> Chaque fichier a un rôle unique ; le détail historique reste dans les archives.
> Alimenté par le rituel `/cloture-session` (skill) en fin de session.

## Fichiers (par fréquence de lecture)

| Fichier | Rôle | Quand le lire |
|---|---|---|
| **[CONTEXT.md](./CONTEXT.md)** | État courant condensé (chiffres frais, où on en est) | **Toujours, en 1er** |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | 🗺️ Carte VIVANTE du système (site public + admin + backend + RM + IA + D1, 2 schémas Mermaid, table des crons). Tenue à jour à chaque `/cloture-session` (§4a). | **Pour comprendre l'ensemble / avant de toucher la structure** |
| **[ADR.md](./ADR.md)** | Décisions structurantes datées (5 lignes : choix / alternatives / conséquences / périmètre / statut) | Avant de toucher l'archi/les données |
| **[LEARNINGS.md](./LEARNINGS.md)** | Enseignements réutilisables (pièges déjà rencontrés) | Avant d'agir sur un sujet à risque |
| **[BLOCKERS.md](./BLOCKERS.md)** | Frictions / dettes / points bloquants + statut | Pour savoir ce qui attend quoi/qui |
| **[RECALL.md](./RECALL.md)** | Rappel contextuel : quoi se rappeler avant de toucher un domaine (niv.2) | **Avant d'agir sur un domaine** |
| **[DECISIONS.md](./DECISIONS.md)** | Moteur de décision : critères déterministes par type de décision (niv.3) | Avant de trancher |
| **[FLUX-RESAS.md](./FLUX-RESAS.md)** | 📡 Pipeline complet des 4 canaux (Airbnb/Booking/Direct/Beds24) + annulations + garde-fous | Avant de toucher aux réservations ou revenus |
| **[ITERATIONS_LOG.md](./ITERATIONS_LOG.md)** | Journal des sessions (rolling) | Pour retracer l'historique récent |
| **[METRICS_H1_2026.md](./METRICS_H1_2026.md)** | Revue de performance H1 2026 — scorecard 7 biens, alertes P0, canal mix, chantiers H2 | En début de session ou avant tout conseil pricing/locatif |

## Archives profondes (référence, pas à relire intégralement)
- `../docs/OPERATING-MODEL.md` — **charte de fonctionnement COMMUNE aux 2 projets** (mémoire, rituels, deploy, matrice de conformité, backlog de synchro). Identique dans patrimoine-dashboard.
- `../CLAUDE.md` — **référence architecture/technique** (stack, endpoints, footguns, conventions).
- `../PROJECT_MEMORY.md` — mémoire long terme (état, secrets, crons, IDs, contraintes Vincent, backlog).
- `../docs/INDEX.md` — carte d'indexation de toute la doc (~47 fichiers).
- `../docs/superpowers/specs/README.md` — index ADR formel (10 specs de design + plans).
- `../docs/ERREURS-LOG.md` — journal d'erreurs exhaustif (erreur + cause + garde-fou).
- `../docs/_archive/` — journaux historiques extraits de PROJECT_MEMORY.

## Convention
- **Distiller, pas copier-coller.** La mémoire structurée est curatée ; l'archive profonde reste ailleurs.
- **Dater toutes les entrées. APPEND, jamais d'écrasement.** Le plus récent en haut.
- `.memory/` (ici) = mémoire vive curatée · `PROJECT_MEMORY.md` = mémoire long terme détaillée · `docs/` = livrables.
