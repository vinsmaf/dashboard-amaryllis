-- migrations/0001_emails_log.sql
-- Table de logging de tous les emails sortants (helper _sendEmail.js)
-- Volume estimé : ~300 lignes/mois, HTML moyen ~5 KB → ~1.5 MB/an

CREATE TABLE IF NOT EXISTS emails_log (
  id          TEXT PRIMARY KEY,           -- ULID généré localement
  resend_id   TEXT,                       -- ID Resend (pour matcher webhooks futurs)
  to_email    TEXT NOT NULL,              -- destinataire (clé de rattachement)
  from_email  TEXT,
  subject     TEXT NOT NULL,
  template    TEXT,                       -- ex: "poststay_j1", "prearrivee", "confirmation"
  category    TEXT NOT NULL,              -- "client" | "internal"
  bien_id     TEXT,                       -- amaryllis | mabouya | ... (NULL si non rattachable)
  booking_id  TEXT,                       -- payment_intent_id si résa directe
  html        TEXT,                       -- corps HTML complet
  text        TEXT,                       -- corps text fallback
  status      TEXT NOT NULL,              -- "sent" | "failed"
  error       TEXT,                       -- message d'erreur si status="failed"
  sent_at     INTEGER NOT NULL,           -- unix ms
  -- Champs futurs pour webhooks Resend (NULL pour l'instant)
  opened_at   INTEGER,
  clicked_at  INTEGER,
  bounced_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_emails_to ON emails_log(to_email, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_booking ON emails_log(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_client ON emails_log(category, sent_at DESC);
