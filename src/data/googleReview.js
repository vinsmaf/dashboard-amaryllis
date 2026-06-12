// Liens « Laisser un avis Google » par bien → fiche GBP correspondante (Place ID).
// Amaryllis/Iguana → fiche Villa Amaryllis ; Zandoli/Géko/Mabouya → fiche Résidence.
// Schœlcher/Nogent : pas de fiche Google dédiée → fallback page /avis interne.
// ⚠️ Garder synchronisé avec functions/api/send-poststay.js (GOOGLE_REVIEW).
const VILLA_REVIEW = "https://search.google.com/local/writereview?placeid=ChIJWbeKdLghQIwRCppz2lJ39Jk";
const RESIDENCE_REVIEW = "https://search.google.com/local/writereview?placeid=ChIJc2hlO7chQIwRQaczraCwlNs";

export const GOOGLE_REVIEW = {
  amaryllis:  VILLA_REVIEW,
  iguana:     VILLA_REVIEW,
  zandoli:    RESIDENCE_REVIEW,
  geko:       RESIDENCE_REVIEW,
  mabouya:    RESIDENCE_REVIEW,
  schoelcher: "https://villamaryllis.com/avis",
  nogent:     "https://villamaryllis.com/avis",
};

// true = vraie fiche Google (writereview) ; false = fallback interne /avis.
export function isGoogleReview(bienId) {
  return (GOOGLE_REVIEW[bienId] || "").includes("writereview");
}

export function getReviewUrl(bienId) {
  return GOOGLE_REVIEW[bienId] || VILLA_REVIEW;
}
