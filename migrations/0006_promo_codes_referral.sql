-- migrations/0006_promo_codes_referral.sql
-- Programme de fidélité — étape 3/3 : parrainage (docs/crm-roadmap.md Phase 3).
-- Réutilise la table promo_codes existante (le filleul entre le code dans le
-- champ "Code promo" déjà présent au tunnel de réservation) plutôt que de créer
-- une mécanique séparée. 2 colonnes ajoutées :
--   - referrer_client_id : NULL pour un promo classique, ID crm_clients si le
--     code a été émis comme lien de parrainage (fait le lien parrain → code).
--   - reward_credited : 0/1, évite de créditer 2x le même parrain si le code
--     est relu plusieurs fois par le webhook Stripe (retry).

ALTER TABLE promo_codes ADD COLUMN referrer_client_id TEXT;
ALTER TABLE promo_codes ADD COLUMN reward_credited INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_promo_referrer ON promo_codes(referrer_client_id);
