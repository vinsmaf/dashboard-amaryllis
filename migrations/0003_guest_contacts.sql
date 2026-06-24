-- migrations/0003_guest_contacts.sql
-- Base de contacts voyageurs/locataires reconstituée (scan WhatsApp + dossiers résa).
-- Source initiale : scan WhatsApp Web 2026-06 (nomenclature "Prénom + Bien + Mois").
-- statut : 'locataire' (venu) | 'prospect' (jamais venu) | 'longue_duree' (loyer mensuel) | 'a_confirmer'
-- pays   : code indicatif déduit du numéro (MQ=+596, GP=+590, GF=+594, FR=+33, BE=+32, DE=+49, CA/US=+1)

CREATE TABLE IF NOT EXISTS guest_contacts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nom           TEXT NOT NULL,             -- nom/libellé du contact
  telephone     TEXT,                      -- format international, NULL si inconnu
  email         TEXT,
  bien          TEXT,                      -- Amaryllis | Iguana | Zandoli | Geko | Mabouya | Schoelcher | Nogent | Studio | T2 | Villa | Residence | NULL
  date_arrivee  TEXT,                      -- YYYY-MM-DD si connue, sinon NULL (période en notes)
  date_depart   TEXT,                      -- YYYY-MM-DD si connue, sinon NULL
  montant_eur   REAL,                      -- total séjour si connu
  canal         TEXT,                      -- direct | airbnb | booking | rentila | whatsapp | NULL
  pays          TEXT,                      -- MQ | GP | GF | FR | BE | DE | CA | NULL
  statut        TEXT NOT NULL DEFAULT 'locataire',
  notes         TEXT,
  source        TEXT NOT NULL DEFAULT 'whatsapp',
  created_at    INTEGER NOT NULL           -- unix ms (passé en seed)
);

-- Un même numéro ne doit pas être inséré deux fois (NULL autorisé en multiple sous SQLite).
CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_tel ON guest_contacts(telephone);
CREATE INDEX IF NOT EXISTS idx_guest_bien ON guest_contacts(bien);
CREATE INDEX IF NOT EXISTS idx_guest_statut ON guest_contacts(statut);
