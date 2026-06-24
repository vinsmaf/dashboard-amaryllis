-- scripts/seed-guest-contacts.sql
-- Seed initial guest_contacts — scan WhatsApp 2026-06 + dossiers résa.
-- Idempotent : INSERT OR IGNORE (clé unique = telephone). Les contacts sans tél seront ré-insérés si rejoués.
-- Appliquer : wrangler d1 execute revenue-manager --remote --file=scripts/seed-guest-contacts.sql

INSERT OR IGNORE INTO guest_contacts
  (nom, telephone, email, bien, date_arrivee, date_depart, montant_eur, canal, pays, statut, notes, source, created_at)
VALUES
-- ─── A. Locataires dossier riche ───
('Stephanie Felicite', NULL, 'felicitag_4@hotmail.com', 'Amaryllis', '2026-07-31', '2026-08-14', 4800, 'rentila', 'FR', 'locataire', 'Payé par "Carl" (1000+900€ acompte). Lit bébé. Rentila résa 640181. Studio évoqué pour Orel 27-31.', 'whatsapp', (strftime('%s','now')*1000)),
('Laurent Maignan', NULL, 'laurentmaignan82@gmail.com', 'Geko', '2026-05-28', '2026-05-31', NULL, 'direct', 'FR', 'locataire', '"Laurent Geko". Clé laissée table salon.', 'whatsapp', (strftime('%s','now')*1000)),
('Delphine De Firmas', '+33 6 42 11 87 25', 'delfe971@gmail.com', 'Residence', '2026-05-07', '2026-05-10', 465, 'rentila', 'MQ', 'locataire', 'Gîte résidence. Paiement Wero.', 'whatsapp', (strftime('%s','now')*1000)),
('Anais', NULL, NULL, 'Zandoli', '2026-08-02', '2026-08-09', 298, 'direct', NULL, 'locataire', 'Via villamaryllis.com. Caution 500€. Paiement 298€ validé.', 'whatsapp', (strftime('%s','now')*1000)),
('Vanessa (Villa Amaryllis)', '+33 6 37 15 81 51', NULL, 'Amaryllis', '2026-04-20', '2026-04-29', NULL, 'direct', 'FR', 'locataire', 'Séjour agréable. Souris signalée -> pièges. Contact non enregistré.', 'whatsapp', (strftime('%s','now')*1000)),
('Ary Augustin', NULL, 'ary.augustin@gmail.com', 'Zandoli', NULL, NULL, NULL, 'direct', NULL, 'locataire', 'B2B 2A Consulting. Récurrent. Séjour été 2026 à venir, acompte 40%, facture société.', 'whatsapp', (strftime('%s','now')*1000)),
('Elicka Vivre En Bois', NULL, NULL, 'Residence', '2026-04-30', '2026-05-03', NULL, 'direct', NULL, 'locataire', 'Résidence Martinique.', 'whatsapp', (strftime('%s','now')*1000)),
('Antoine (Fen)', NULL, NULL, 'Amaryllis', NULL, NULL, NULL, 'direct', NULL, 'locataire', 'Printemps 2026. "Fen" = surnom.', 'whatsapp', (strftime('%s','now')*1000)),

-- ─── B. Zandoli ───
('Zandoli Avril', '+33 6 16 13 61 70', NULL, 'Zandoli', NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Séjour avril 2026.', 'whatsapp', (strftime('%s','now')*1000)),
('Aurelien Zandoli', '+32 478 66 76 40', NULL, 'Zandoli', NULL, NULL, NULL, 'whatsapp', 'BE', 'locataire', 'Séjour février 2026.', 'whatsapp', (strftime('%s','now')*1000)),
('Sylvie Gervais', '+596 696 70 80 70', NULL, 'Zandoli', NULL, NULL, NULL, 'whatsapp', 'MQ', 'locataire', 'Janvier 2026. Avis : "appartement nickel".', 'whatsapp', (strftime('%s','now')*1000)),
('Valerie Zandoli', '+596 696 35 14 63', NULL, 'Zandoli', NULL, NULL, NULL, 'whatsapp', 'MQ', 'locataire', 'Août 2025.', 'whatsapp', (strftime('%s','now')*1000)),
('Emelyn (Zandoli Airbnb Juillet)', '+596 696 96 01 30', NULL, 'Zandoli', NULL, NULL, NULL, 'airbnb', 'MQ', 'locataire', 'Séjour juillet via Airbnb.', 'whatsapp', (strftime('%s','now')*1000)),
('Pascal P. (4REAZONS)', '+33 6 72 98 40 59', 'pascal.p@4reazons.com', 'Zandoli', NULL, NULL, NULL, 'direct', 'FR', 'locataire', 'Compte pro 4REAZONS. Séjour juillet.', 'whatsapp', (strftime('%s','now')*1000)),
('Client Zandoli Fevrier', '+33 6 95 90 00 85', NULL, 'Zandoli', NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Séjour février.', 'whatsapp', (strftime('%s','now')*1000)),
('Ulric (Zandoli)', '+33 6 95 06 26 28', NULL, 'Zandoli', NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Contact, pas de conversation.', 'whatsapp', (strftime('%s','now')*1000)),

-- ─── B. Geko ───
('Libos (Geko)', '+596 696 31 41 99', NULL, 'Geko', NULL, NULL, NULL, 'direct', 'MQ', 'locataire', 'Octobre 2025. RÉCURRENT ("de nouveau un agréable séjour").', 'whatsapp', (strftime('%s','now')*1000)),
('Keyanne Geko', '+596 696 08 05 11', NULL, 'Geko', NULL, NULL, NULL, 'whatsapp', 'MQ', 'locataire', 'Septembre 2025.', 'whatsapp', (strftime('%s','now')*1000)),
('Christelle Geko', '+33 6 50 87 88 68', NULL, 'Geko', NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Juin 2025. (2e contact "Christelle Geko" existe - à vérifier.)', 'whatsapp', (strftime('%s','now')*1000)),
('Christophe Geko', '+596 696 60 61 71', NULL, 'Geko', NULL, NULL, NULL, 'whatsapp', 'MQ', 'locataire', 'Janvier 2026.', 'whatsapp', (strftime('%s','now')*1000)),
('Sandrine Geko', '+33 6 09 28 95 68', NULL, 'Geko', NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Juin 2025.', 'whatsapp', (strftime('%s','now')*1000)),
('Maurice (Geko)', '+596 696 23 15 38', NULL, 'Geko', NULL, NULL, NULL, 'whatsapp', 'MQ', 'locataire', 'Contact, pas de conversation.', 'whatsapp', (strftime('%s','now')*1000)),

-- ─── B. Mabouya / Iguana ───
('Teddy (Mabouya)', '+596 696 94 96 99', NULL, 'Mabouya', NULL, NULL, NULL, 'whatsapp', 'MQ', 'locataire', 'Août 2025.', 'whatsapp', (strftime('%s','now')*1000)),
('Locataire Iguana Aout', '+596 696 93 73 03', NULL, 'Iguana', NULL, NULL, NULL, 'whatsapp', 'MQ', 'locataire', 'Août 2025 (loc. courte avant bail long).', 'whatsapp', (strftime('%s','now')*1000)),

-- ─── B. Studio / T2 / Villa / générique ───
('Jean Alexis (lemaya)', '+596 696 89 19 28', 'lemaya.jean.alexis@gmail.com', 'Studio', NULL, NULL, NULL, 'direct', 'MQ', 'locataire', 'Compte pro lemaya. Février 2026.', 'whatsapp', (strftime('%s','now')*1000)),
('Locataire T2 (nov 2023)', '+596 696 74 05 95', NULL, 'T2', NULL, NULL, NULL, 'whatsapp', 'MQ', 'locataire', 'PLUS ANCIEN locataire identifié (nov. 2023).', 'whatsapp', (strftime('%s','now')*1000)),
('Locataire T2 Fevrier', '+33 6 99 11 93 21', NULL, 'T2', NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Février 2026.', 'whatsapp', (strftime('%s','now')*1000)),
('Locataire Studio Aout 2025', '+33 7 66 33 09 42', NULL, 'Studio', NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Août 2025.', 'whatsapp', (strftime('%s','now')*1000)),
('Locataire Villa Janvier', '+33 6 83 03 33 18', NULL, 'Villa', NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Janvier 2026.', 'whatsapp', (strftime('%s','now')*1000)),
('Locataire Villa Novembre', '+33 6 09 24 93 98', NULL, 'Villa', NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Nov. 2025.', 'whatsapp', (strftime('%s','now')*1000)),
('Laure (Villa)', '+33 6 75 42 69 83', NULL, 'Villa', NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Mai 2023 (une des plus anciennes).', 'whatsapp', (strftime('%s','now')*1000)),
('Locataire Mars Visite', '+33 7 81 07 42 73', NULL, 'Residence', NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Résidence Amaryllis Ste-Luce. Mars.', 'whatsapp', (strftime('%s','now')*1000)),
('Eden Locataire', '+33 6 16 13 01 72', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Décembre 2025.', 'whatsapp', (strftime('%s','now')*1000)),
('Ludo (Airbnb)', '+596 696 81 11 85', NULL, NULL, NULL, NULL, NULL, 'airbnb', 'MQ', 'locataire', 'Août 2025.', 'whatsapp', (strftime('%s','now')*1000)),
('Sulivan (Airbnb)', '+596 696 61 43 29', NULL, NULL, NULL, NULL, NULL, 'airbnb', 'MQ', 'locataire', 'Octobre 2025.', 'whatsapp', (strftime('%s','now')*1000)),
('Christophe Locataire', '+596 696 36 62 29', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'MQ', 'locataire', 'Avril 2026.', 'whatsapp', (strftime('%s','now')*1000)),
('Jean Christophe Locataire', '+596 696 03 07 55', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'MQ', 'locataire', 'Février 2026.', 'whatsapp', (strftime('%s','now')*1000)),
('Leilla Locataire', '+33 7 81 05 05 83', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Janvier 2026.', 'whatsapp', (strftime('%s','now')*1000)),
('Wilma Locataire', '+32 467 81 84 79', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'BE', 'locataire', 'Juillet 2025.', 'whatsapp', (strftime('%s','now')*1000)),
('Dimitri (Airbnb)', '+33 6 47 43 82 26', NULL, NULL, NULL, NULL, NULL, 'airbnb', 'FR', 'locataire', 'Septembre 2024.', 'whatsapp', (strftime('%s','now')*1000)),
('LUXURY Locataire Juillet 2024', '+590 690 73 36 07', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'GP', 'locataire', 'Juillet 2024. Demande avis Google envoyée.', 'whatsapp', (strftime('%s','now')*1000)),
('Chaffard Locataire', '+33 6 03 87 38 11', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Juillet 2024.', 'whatsapp', (strftime('%s','now')*1000)),
('Jimmy Locataire', '+590 690 95 50 93', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'GP', 'locataire', 'Avril 2026.', 'whatsapp', (strftime('%s','now')*1000)),
('Vanessa (Locataire)', '+596 696 17 10 01', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'MQ', 'locataire', 'Mai 2026.', 'whatsapp', (strftime('%s','now')*1000)),
('Estelle (Juillet)', '+33 6 40 40 49 35', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Juillet. Contact.', 'whatsapp', (strftime('%s','now')*1000)),
('Vilal (Avril)', '+49 173 4886096', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'DE', 'locataire', 'Nov. 2025.', 'whatsapp', (strftime('%s','now')*1000)),
('Melina Locataire', '+33 6 83 02 11 76', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Mars 2024.', 'whatsapp', (strftime('%s','now')*1000)),
('Coco Locataire', '+596 696 91 01 34', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'MQ', 'locataire', 'Contact.', 'whatsapp', (strftime('%s','now')*1000)),
('Jousse Locataire', '+33 6 84 91 50 23', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'FR', 'locataire', 'Contact.', 'whatsapp', (strftime('%s','now')*1000)),

-- ─── Longue durée ───
('Emmanuel Mongiovi (Manu)', '+596 696 54 21 97', NULL, 'T2', NULL, NULL, NULL, 'direct', 'MQ', 'longue_duree', 'Locataire T2 à l''année (loyer mensuel, wifi/cuisine/devis). PAS un voyageur courte durée.', 'whatsapp', (strftime('%s','now')*1000)),

-- ─── Prospects (jamais venus) ───
('Belgique Locataire Potentiel', '+32 499 43 15 85', NULL, 'Villa', NULL, NULL, NULL, 'whatsapp', 'BE', 'prospect', 'Juin 2023. Prospect non confirmé.', 'whatsapp', (strftime('%s','now')*1000)),
('Locataire Potentiel', '+33 6 19 94 16 35', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'FR', 'prospect', 'Prospect générique.', 'whatsapp', (strftime('%s','now')*1000)),

-- ─── À confirmer ───
('Locataire Papa (AGLM)', '+596 696 81 30 13', NULL, NULL, NULL, NULL, NULL, 'whatsapp', 'MQ', 'a_confirmer', 'Compte pro "AGLM". Vrai locataire ou partenaire ? À confirmer.', 'whatsapp', (strftime('%s','now')*1000));
