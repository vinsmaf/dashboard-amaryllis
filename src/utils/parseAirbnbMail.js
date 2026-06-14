// parseAirbnbMail — extrait les infos d'un email de confirmation de réservation Airbnb
// (« New booking confirmed! »). L'iCal Airbnb ne transmet ni nom ni prix → ce parseur
// récupère tout depuis le mail : nom voyageur, bien, dates, montants, code de confirmation.
//
// Fonction PURE et testée (vitest) — réutilisable quel que soit le canal de réception
// (Worker email handler, Apps Script, Function). Entrée = le corps texte du mail (si HTML,
// l'appelant strippe les balises avant). Champ introuvable = null (jamais deviné).
//
// ⚠️ Le format Airbnb peut évoluer → traiter comme source best-effort. Caler les regex sur
// de vrais exemples (src/utils/__tests__/parseAirbnbMail.test.js).

// Nom du listing Airbnb (tel qu'Airbnb l'écrit, ex « Mabouya | Jacuzzi privatif… ») → bienId.
// Le titre commence par le nom du bien → on matche le mot-clé. Ordre = du plus spécifique au plus large.
const LISTING_RULES = [
  { re: /mabouya/i,            bienId: "mabouya" },
  { re: /zandoli/i,            bienId: "zandoli" },
  { re: /g[ée]ko/i,            bienId: "geko" },
  { re: /iguana/i,             bienId: "iguana" },
  { re: /sch[oœ]elcher|bellevue/i, bienId: "schoelcher" },
  { re: /nogent/i,             bienId: "nogent" },
  { re: /amaryllis/i,          bienId: "amaryllis" }, // en dernier : « Amaryllis » = aussi la marque
];

const EN_MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

// « Mon, Feb 1, 2027 » / « Feb 1, 2027 » → « 2027-02-01 »
function parseEnDate(s) {
  if (!s) return null;
  const m = s.match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (!m) return null;
  const mon = EN_MONTHS[m[1].toLowerCase().slice(0, 3)];
  if (!mon) return null;
  return `${m[3]}-${String(mon).padStart(2, "0")}-${String(parseInt(m[2], 10)).padStart(2, "0")}`;
}

// « €1,440.24 » / « € 1 440,24 » / « 1440.24 » → 1440.24 (Number) ou null
function parseMoney(s) {
  if (!s) return null;
  const m = String(s).match(/([\d][\d\s.,]*\d|\d)/);
  if (!m) return null;
  // normalise : retire espaces/insécables ; gère le format US (1,440.24) ET FR (1 440,24)
  let raw = m[1].replace(/[\s]/g, "");
  if (raw.includes(",") && raw.includes(".")) {
    // le dernier séparateur est le décimal
    raw = raw.lastIndexOf(",") > raw.lastIndexOf(".")
      ? raw.replace(/\./g, "").replace(",", ".")   // FR : 1.440,24
      : raw.replace(/,/g, "");                       // US : 1,440.24
  } else if (raw.includes(",")) {
    raw = raw.replace(",", ".");                      // 1440,24
  }
  const v = parseFloat(raw);
  return isNaN(v) ? null : v;
}

// Convertit un corps HTML (« Body Content » Outlook) en texte lisible : retire styles/scripts,
// remplace chaque balise par une espace (sépare les mots collés), décode les entités courantes.
// Si l'entrée n'est pas du HTML, la renvoie telle quelle.
function htmlToText(s) {
  if (!s) return "";
  if (!/<[a-z!/]/i.test(s)) return s; // pas du HTML → inchangé
  return s
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, " ") // blocs non-textuels
    .replace(/<[^>]+>/g, " ")                              // toute balise → espace
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&euro;/gi, "€")
    .replace(/&(?:#39|rsquo|#8217|apos);/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&[a-z]+;/gi, " ")                            // autres entités → espace
    .replace(/[ \t\u00A0]+/g, " ");                        // collapse espaces (insécables inclus)
}

// Cherche la valeur qui suit un libellé (tolère sauts de ligne / espaces entre label et valeur).
function afterLabel(text, label, valueRe) {
  const re = new RegExp(label + "[\\s\\S]{0,40}?(" + valueRe + ")", "i");
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

export function parseAirbnbMail({ subject = "", body = "" } = {}) {
  // Le « Body Content » Outlook est du HTML → on le convertit en texte lisible d'abord.
  const text = `${subject}\n${htmlToText(body)}`.replace(/\r/g, "");

  // ── Bien (listing → bienId) ──
  let bienId = null, listingLabel = null;
  const listingM = text.match(/^([^\n|]*\|[^\n]*)$/m); // ligne type « Mabouya | … »
  if (listingM) listingLabel = listingM[1].trim();
  const scope = listingLabel || text;
  for (const r of LISTING_RULES) { if (r.re.test(scope)) { bienId = r.bienId; break; } }

  // ── Dates ──
  const checkin = parseEnDate(afterLabel(text, "Check-?in", "[A-Za-z]{3}[a-z]*\\.?\\s+\\d{1,2},?\\s+\\d{4}"));
  const checkout = parseEnDate(afterLabel(text, "Check-?out", "[A-Za-z]{3}[a-z]*\\.?\\s+\\d{1,2},?\\s+\\d{4}"));

  // ── Nom du voyageur ──
  // Priorité 1 : le SUJET « Reservation confirmed - <Nom complet> arrives … » — source la plus
  // fiable (nom complet, insensible au format du corps). Fallbacks corps ensuite.
  let guestName = null;
  const subjM = subject.match(/confirmed\s*[-–—]\s*(.+?)\s+arrives\b/i);
  if (subjM) guestName = subjM[1].trim();
  // Heuristique corps : la ligne juste avant « Identity verified » (format texte propre).
  if (!guestName) {
    const idM = text.match(/\n[\s\t]*([A-ZÀ-Ÿ][^\n]{1,60}?)\n[\s\t]*Identity verified/);
    if (idM) guestName = idM[1].trim();
  }
  // Mail « brut » (texte/markdown collé) : le nom est un lien juste avant « Identity verified »,
  // ex « [Athenais Huguenot](https://…)![](…)Identity verified ». On capture le libellé du lien.
  if (!guestName) {
    const mdM = text.match(/\[([A-ZÀ-Ÿ][^\]\n]{1,60}?)\]\([^)]*\)\s*(?:!\[[^\]]*\]\([^)]*\)\s*)?Identity verified/);
    if (mdM) guestName = mdM[1].trim();
  }
  if (!guestName) {
    const arr = text.match(/\b([A-ZÀ-Ÿ][\p{L}'’-]+)\s+arrives\b/u) || text.match(/welcome\s+([A-ZÀ-Ÿ][\p{L}'’-]+)/i);
    if (arr) guestName = arr[1].trim(); // prénom seul
  }

  // ── Voyageurs ──
  let nbGuests = null;
  const gM = text.match(/Guests?[\s\S]{0,30}?(\d+)\s*(?:adult|guest|voyageur|personne)/i)
          || text.match(/(\d+)\s*(?:adult|guest)s?\b/i);
  if (gM) nbGuests = parseInt(gM[1], 10) || null;

  // ── Code de confirmation Airbnb ──
  const codeM = text.match(/Confirmation code[\s\S]{0,20}?\b([A-Z0-9]{8,12})\b/i);
  const confirmationCode = codeM ? codeM[1] : null;

  // ── Montants ──
  // « You earn » / « Host payout » = ce que l'hôte ENCAISSE (net). « Total (EUR) » = payé par le voyageur.
  const montantPayout = parseMoney(afterLabel(text, "You earn", "[€\\d][\\d\\s.,]*"));
  const montantTotal = parseMoney(afterLabel(text, "Total \\(?EUR\\)?", "[€\\d][\\d\\s.,]*"))
                    ?? parseMoney(afterLabel(text, "Total", "[€\\d][\\d\\s.,]*"));

  return {
    canal: "airbnb",
    bienId,
    listingLabel,
    guestName,
    checkin,
    checkout,
    nbGuests,
    confirmationCode,
    montantPayout,   // « You earn » — revenu net hôte
    montantTotal,    // « Total » — payé par le voyageur
  };
}
