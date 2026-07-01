-- migrations/0004_emails_log_inbound.sql
-- Ajoute le support des emails ENTRANTS (réponses voyageurs à contact@villamaryllis.com)
-- à la table emails_log (jusqu'ici uniquement sortants via Resend).
--
-- direction = 'out' (défaut, rétro-compat totale avec les lignes existantes) | 'in'
-- Pour les lignes direction='in' :
--   to_email    = "contact@villamaryllis.com" (boîte réceptrice)
--   from_email  = adresse du voyageur (partie qui nous intéresse pour le regroupement)
--   gmail_msg_id / gmail_thread_id = identifiants Gmail (dédup + fil de discussion)
--   status      = "received"
--
-- Voir functions/api/emails-log.js : les requêtes group=clients / to= doivent
-- grouper sur "l'autre partie" (guest_email), pas sur to_email brut, sinon toutes
-- les réponses entrantes se retrouvent agrégées sous contact@villamaryllis.com.

ALTER TABLE emails_log ADD COLUMN direction TEXT NOT NULL DEFAULT 'out';
ALTER TABLE emails_log ADD COLUMN gmail_msg_id TEXT;
ALTER TABLE emails_log ADD COLUMN gmail_thread_id TEXT;
ALTER TABLE emails_log ADD COLUMN read_at INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_emails_gmail_msg ON emails_log(gmail_msg_id) WHERE gmail_msg_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_direction ON emails_log(direction, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_from ON emails_log(from_email, sent_at DESC) WHERE from_email IS NOT NULL;

-- Stockage des tokens OAuth (Gmail pour l'instant, réutilisable pour Calendar plus tard —
-- chantier 2 du plan connecteurs 2026-07). Une ligne par "provider".
CREATE TABLE IF NOT EXISTS oauth_tokens (
  provider      TEXT PRIMARY KEY,      -- ex: "gmail"
  account_email TEXT,                  -- ex: "contact@villamaryllis.com" (informatif)
  refresh_token TEXT NOT NULL,
  access_token  TEXT,
  expires_at    INTEGER,               -- unix ms — expiration de l'access_token en cache
  scope         TEXT,
  updated_at    INTEGER NOT NULL
);
