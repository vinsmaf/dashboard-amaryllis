// Frais de ménage par bien (source unique de vérité).
// Double usage : (1) montant facturé au voyageur en réservation directe (PublicSite),
// (2) coût variable du ménage déduit dans le P&L par séjour (I-03, pnlSejour.js).
// Iguana = 0 (bail long, pas de rotation).
export const FRAIS_MENAGE = {
  nogent:     45,
  amaryllis:  180,
  geko:       70,
  schoelcher: 70,
  zandoli:    70,
  mabouya:    50,
  iguana:     0,
};

export const fraisMenage = (bienId) => FRAIS_MENAGE[bienId] ?? 0;
