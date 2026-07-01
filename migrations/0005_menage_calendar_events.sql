-- migrations/0005_menage_calendar_events.sql
-- Mapping ménage → événement Google Calendar (chantier 2 du plan connecteurs 2026-07).
--
-- Clé = "<bienId>|<checkoutISO>" (même logique que resaDedup.js : bienId+checkout
-- identifie un ménage de façon stable, même si l'id interne de la résa change entre
-- deux syncs Sheets/Beds24/iCal). Permet de PATCH un event existant au lieu d'en
-- recréer un doublon à chaque clic sur "Sync calendrier".

CREATE TABLE IF NOT EXISTS menage_calendar_events (
  resa_key          TEXT PRIMARY KEY,     -- "<bienId>|<checkoutISO>"
  bien_id           TEXT NOT NULL,
  checkout_date     TEXT NOT NULL,
  calendar_event_id TEXT NOT NULL,
  assigne           TEXT,                 -- dernier nom de prestataire connu (détecte les changements)
  updated_at        INTEGER NOT NULL
);
