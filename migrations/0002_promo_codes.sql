-- migrations/0002_promo_codes.sql
-- Codes promo générés par le compositeur d'email admin.
-- Champ used_count incrémenté à chaque conversion (feature D future).

CREATE TABLE IF NOT EXISTS promo_codes (
  code         TEXT PRIMARY KEY,          -- ex: "CAMBIE-A8F2"
  type         TEXT NOT NULL,             -- "percent" | "amount_eur"
  value        INTEGER NOT NULL,          -- 10 (= -10%) ou 50 (= -50€)
  bien_id      TEXT,                      -- limite à un bien (NULL = tous)
  expires_at   INTEGER NOT NULL,          -- unix ms
  max_uses     INTEGER DEFAULT 1,         -- 1 = single use (default)
  used_count   INTEGER DEFAULT 0,         -- incrémenté à chaque conversion
  created_at   INTEGER NOT NULL,          -- unix ms
  created_for  TEXT,                      -- email destinataire (pour tracer)
  note         TEXT                       -- libre, ex: "relance panier Cambier"
);

CREATE INDEX IF NOT EXISTS idx_promo_expires ON promo_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_promo_for ON promo_codes(created_for);
