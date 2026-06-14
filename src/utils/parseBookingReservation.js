// parseBookingReservation — normalise une ligne de réservation lue dans l'extranet Booking.com.
//
// Booking ne transmet NI nom NI prix par iCal (ni par email host) → ce parseur lit la ligne de
// l'extranet (scrapée dans la session de l'hôte par le script local Playwright) et produit
// l'objet attendu par `enrichReservation_` (GAS) : { bienId, checkin, checkout, voyageur, montant }.
//
// Fonction PURE et testée (vitest) — indépendante du DOM : le scraper extrait les cellules brutes
// et les passe ici. ⚠️ « montant » = NET = Montant total − Commission et frais (= virement Booking,
// convention validée par Vincent 2026-06-14).

// hotel_id Booking → bienId : le plus fiable (IDs stables). Complété au fil de l'eau.
const HOTEL_ID_BIEN = {
  "9438450": "zandoli",
  "8741457": "nogent",
  "8227852": "amaryllis",
};

// Fallback : le nom d'établissement (+ adresse) contient le bien. Ordre = spécifique → marque.
const ESTAB_RULES = [
  { re: /zandoli/i,                bienId: "zandoli" },
  { re: /mabouya/i,                bienId: "mabouya" },
  { re: /g[ée]ko/i,                bienId: "geko" },
  { re: /iguana/i,                 bienId: "iguana" },
  { re: /sch[oœ]elcher|bellevue/i, bienId: "schoelcher" },
  { re: /nogent|portes de paris/i, bienId: "nogent" },
  { re: /amaryllis/i,              bienId: "amaryllis" }, // en dernier : « Amaryllis » = aussi la marque
];

const FR_MONTHS = { jan: 1, fev: 2, mar: 3, avr: 4, mai: 5, juin: 6, juil: 7, aou: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function stripAccents(s) { return s.normalize("NFD").replace(/[̀-ͯ]/g, ""); }

// « 10 août 2026 » / « 9 avr. 2026 » / « 15 juin 2026 » → « 2026-08-10 »
export function parseFrDate(s) {
  if (!s) return null;
  const m = String(s).match(/(\d{1,2})\s+([A-Za-zÀ-ÿ.]+)\s+(\d{4})/);
  if (!m) return null;
  const key = stripAccents(m[2].toLowerCase()).replace(/\.$/, "").slice(0, 4);
  const mon = FR_MONTHS[key] || FR_MONTHS[key.slice(0, 3)]; // juin/juil distincts en 4 lettres
  if (!mon) return null;
  return `${m[3]}-${String(mon).padStart(2, "0")}-${String(parseInt(m[1], 10)).padStart(2, "0")}`;
}

// « € 1 234,56 » / « € 578,40 » / « 70.00 » → 578.40 (Number) ou null. Dernier séparateur = décimal.
export function parseEuro(s) {
  if (s == null) return null;
  let str = String(s).replace(/[^\d.,]/g, "");
  if (!str) return null;
  const lastComma = str.lastIndexOf(","), lastDot = str.lastIndexOf(".");
  if (lastComma > lastDot) str = str.replace(/\./g, "").replace(",", ".");
  else if (lastDot > lastComma) str = str.replace(/,/g, "");
  const v = parseFloat(str);
  return isNaN(v) ? null : v;
}

// « Ferry Vergeer 2 adultes » / « NINA GRUBO 3 adultes et 2 enfants » → « Ferry Vergeer »
export function cleanGuestName(s) {
  if (!s) return null;
  const n = String(s).replace(/\s+/g, " ").trim()
    .replace(/\s+\d+\s*(adulte|enfant|personne|voyageur|guest|child|adult|p\b).*$/i, "")
    .trim();
  return n || null;
}

function estabToBien({ hotelId, establishment, address }) {
  if (hotelId && HOTEL_ID_BIEN[String(hotelId)]) return HOTEL_ID_BIEN[String(hotelId)];
  const scope = `${establishment || ""} ${address || ""}`;
  for (const r of ESTAB_RULES) if (r.re.test(scope)) return r.bienId;
  return null;
}

// Entrée = cellules brutes d'une ligne de la liste extranet (ou de la fiche détail).
// Sortie : { canal, bienId, voyageur, checkin, checkout, montant (NET), montantTotal, commission, resId, email }.
export function parseBookingRow({ hotelId, establishment, address, client, arrival, departure, total, commission, resId, email } = {}) {
  const t = parseEuro(total);
  const c = parseEuro(commission);
  const montant = (t != null && c != null) ? Math.round((t - c) * 100) / 100 : (t != null ? t : null);
  return {
    canal: "booking",
    bienId: estabToBien({ hotelId, establishment, address }),
    voyageur: cleanGuestName(client),
    checkin: parseFrDate(arrival),
    checkout: parseFrDate(departure),
    montant,                                  // NET = total − commission (= virement Booking)
    montantTotal: t,                          // payé par le client
    commission: c,
    resId: resId ? String(resId).replace(/\D/g, "") : null,
    email: email || null,
  };
}

// Parse le TEXTE de la fiche détail d'une réservation (extranet_ng/manage/booking.html),
// scrapée par le script local. `title` = document.title (contient le nom de l'établissement).
// Approche label→valeur, robuste aux retours-ligne. Réutilise parseBookingRow pour la normalisation.
export function parseBookingDetailText(text, { title = "", hotelId = "" } = {}) {
  const t = String(text || "").replace(/\r/g, "");
  const after = (label, n = 60) => {
    const i = t.indexOf(label);
    return i < 0 ? "" : t.slice(i + label.length, i + label.length + n);
  };
  const client = (after("Nom du client", 70).replace(/^[\s:]+/, "").split("\n").map(s => s.trim()).filter(Boolean)[0]) || "";
  const emailM = t.match(/[\w.+-]+@[\w.-]*guest\.booking\.com/i) || t.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
  const resId = (after("Numéro de réservation", 40).match(/\d{6,}/) || [])[0] || "";
  const establishment = String(title).split(/[·|]/)[0].trim();
  return parseBookingRow({
    hotelId,
    establishment,
    client,
    arrival:    after("Date d'arrivée", 45),
    departure:  after("Date de départ", 45),
    total:      after("Montant total", 30),
    commission: after("Commission et frais", 30),
    resId,
    email: emailM ? emailM[0] : null,
  });
}
