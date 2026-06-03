// data-052 — taux de commission OTA (source unique de vérité). Modifiables ici.
//
// Airbnb : DEUX modèles de frais selon l'annonce (réglage par bien côté Airbnb) :
//   • 3%  = « frais partagés » (l'hôte paie 3%, le voyageur paie des frais de service)
//           → Géko, Zandoli, Mabouya, Bellevue/Schœlcher.
//   • 15% = « frais hôte simplifié » (prix tout compris, l'hôte paie ~15%)
//           → Villa Amaryllis (Iguana/Nogent : à confirmer, défaut 15%).
// Booking.com : 17% partout.
// Direct : 0% OTA (mais ~1,5% de frais Stripe, voir FRAIS_STRIPE).

export const AIRBNB_COMM_PAR_BIEN = {
  amaryllis:  0.15, // Villa Amaryllis (frais hôte simplifié)
  iguana:     0.03, // Résidence Amaryllis (Sainte-Luce) — pas sur Airbnb actuellement
  geko:       0.03,
  zandoli:    0.03,
  mabouya:    0.03,
  schoelcher: 0.03, // Bellevue
  nogent:     0.15, // frais hôte simplifié
};
export const AIRBNB_COMM_DEFAUT = 0.15;
export const BOOKING_COMM = 0.17;
export const FRAIS_STRIPE = 0.015;

// Taux Airbnb pour un bien donné (id interne)
export const airbnbComm = (bienId) => AIRBNB_COMM_PAR_BIEN[bienId] ?? AIRBNB_COMM_DEFAUT;

// Taux de commission d'une réservation selon canal normalisé + bien
export function commissionTaux(canalNorm, bienId) {
  if (canalNorm === "airbnb")  return airbnbComm(bienId);
  if (canalNorm === "booking") return BOOKING_COMM;
  return 0; // direct, beds24, autre
}

// Pour l'affichage / fallback (taux indicatif par canal, hors per-bien Airbnb)
export const COMMISSIONS_CANAL = {
  airbnb:  { label: "Airbnb",      taux: 0.15, color: "#FF5A5F" },
  booking: { label: "Booking.com", taux: BOOKING_COMM, color: "#0ea5e9" },
  direct:  { label: "Direct",      taux: 0.00, color: "#10b981" },
  beds24:  { label: "Beds24",      taux: 0.00, color: "#a855f7" },
};
