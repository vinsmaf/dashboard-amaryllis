// I-10 — Résolution « qui me parle, et où loge-t-il ? » : logique pure (testée).
//
// C'était la pièce manquante n°1 du concierge (cartographie 2026-07-17) : le bot WhatsApp
// ne faisait AUCUN lien entre le numéro de téléphone et la réservation. Il devinait le bien
// par mots-clés dans le message et retombait par défaut sur "amaryllis" — donc un voyageur
// à Nogent qui écrit « le wifi ne marche pas » recevait le code wifi de la Villa Amaryllis.
// Ce n'était pas qu'une limite pour I-10 : c'était un bug en production.
//
// Ici : uniquement la normalisation/matching (pur, testable). Les requêtes D1 vivent
// dans functions/api/_guestContext.js.

/**
 * Normalise un numéro en une forme comparable.
 * Les formats en présence sont hétérogènes :
 *   - WhatsApp (msg.from) : "33610880772"      (E.164 sans +)
 *   - Saisi au booking    : "+33 6 10 88 07 72", "06 10 88 07 72", "0610880772"
 *   - Martinique          : "+596 696 12 34 56", "0696 12 34 56"
 * On retire tout sauf les chiffres, puis on retire le préfixe international connu et
 * le 0 national, pour obtenir un « noyau » comparable.
 * Retourne "" si rien d'exploitable (l'appelant ne doit alors JAMAIS matcher).
 */
export function normalizePhone(raw) {
  if (!raw || typeof raw !== "string") return "";
  let d = raw.replace(/\D/g, "");
  if (!d) return "";

  // Indicatifs pertinents pour ce portefeuille, du plus long au plus court :
  // 596 = Martinique fixe, 696 = Martinique mobile, 590 = Guadeloupe, 33 = France métro.
  // ⚠️ L'ordre compte : "596..." doit être testé avant "59"/"5" éventuels.
  for (const cc of ["596", "590", "594", "33"]) {
    if (d.startsWith(cc) && d.length > cc.length + 5) {
      d = d.slice(cc.length);
      break;
    }
  }
  // 0 national résiduel ("0610880772" → "610880772")
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

/**
 * Deux numéros désignent-ils la même ligne ?
 * On compare les 9 derniers chiffres du noyau : robuste aux préfixes et aux espaces,
 * assez long pour ne pas produire de collision fortuite.
 * Un noyau trop court (< 6 chiffres) ne matche JAMAIS — mieux vaut ne pas répondre
 * que répondre à la mauvaise personne avec un code d'accès.
 */
export function samePhone(a, b) {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (na.length < 6 || nb.length < 6) return false;
  const tail = (s) => s.slice(-9);
  return tail(na) === tail(nb);
}

/**
 * Parmi des réservations candidates, trouve celle qui correspond au numéro,
 * et de préférence le séjour EN COURS (ou le plus proche à venir).
 * `bookings` : [{ phone, checkin, checkout, ... }] · `todayIso` : "YYYY-MM-DD".
 * Retourne { booking, match } où match ∈ 'current' | 'upcoming' | 'past' | null.
 */
export function findStayForPhone(bookings, phone, todayIso) {
  if (!phone || !Array.isArray(bookings)) return { booking: null, match: null };
  const mine = bookings.filter((b) => samePhone(b?.phone, phone));
  if (!mine.length) return { booking: null, match: null };

  const current = mine.find((b) => b.checkin <= todayIso && b.checkout >= todayIso);
  if (current) return { booking: current, match: "current" };

  const upcoming = mine
    .filter((b) => b.checkin > todayIso)
    .sort((a, b) => a.checkin.localeCompare(b.checkin))[0];
  if (upcoming) return { booking: upcoming, match: "upcoming" };

  const past = mine
    .filter((b) => b.checkout < todayIso)
    .sort((a, b) => b.checkout.localeCompare(a.checkout))[0];
  return past ? { booking: past, match: "past" } : { booking: null, match: null };
}

/**
 * Date du jour au bon fuseau selon le bien.
 * Nogent est en Europe/Paris ; les 6 autres en Martinique (UTC-4).
 * (tv-context.js codait UTC-4 en dur pour tout le monde → faux pour Nogent.)
 */
export function todayForBien(bienId, nowMs = Date.now()) {
  const offsetH = bienId === "nogent" ? paris0ffsetHours(nowMs) : -4;
  return new Date(nowMs + offsetH * 3600 * 1000).toISOString().slice(0, 10);
}

// Europe/Paris = UTC+1 en hiver, UTC+2 en été. On lit l'offset réel via Intl plutôt
// que de coder une règle DST à la main (source d'erreurs deux fois par an).
function paris0ffsetHours(nowMs) {
  try {
    const d = new Date(nowMs);
    const utc = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
    const paris = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
    return Math.round((paris - utc) / 3600000);
  } catch {
    return 2; // repli : heure d'été, l'erreur maximale reste 1h
  }
}
