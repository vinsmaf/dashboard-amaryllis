// Google Apps Script — Locatif Dashboard sync (lecture + écriture)
// ================================================================
// Déployer : Déployer > Nouveau déploiement > Application Web
//            Exécuter en tant que : Moi | Accès : Tout le monde

// ── Mapping lignes par bien ──────────────────────────────────────
const BIENS_MAP = [
  { id: "nogent",     revRow: 6,  occRow: 69,  adrRow: 70,  revparRow: 72,  cfRow: 122 },
  { id: "amaryllis",  revRow: 10, occRow: 76,  adrRow: 77,  revparRow: 78,  cfRow: 131 },
  { id: "iguana",     revRow: 14, occRow: 82,  adrRow: 83,  revparRow: 84,  cfRow: 138 },
  { id: "geko",       revRow: 18, occRow: 88,  adrRow: 89,  revparRow: 90,  cfRow: 145 },
  { id: "zandoli",    revRow: 22, occRow: 94,  adrRow: 95,  revparRow: 96,  cfRow: 152 },
  { id: "mabouya",    revRow: 26, occRow: 100, adrRow: 101, revparRow: 102, cfRow: 159 },
  { id: "schoelcher", revRow: 31, occRow: 106, adrRow: 107, revparRow: 108, cfRow: 169 },
];

function getSheet_(name) {
  const ss = SpreadsheetApp.openById("1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U");
  return ss.getSheetByName(name);
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── LECTURE ──────────────────────────────────────────────────────
// Lit l'onglet « Emails » (rempli par Zapier : Date/Sender/Subject/Body) — lecture seule.
// Borné aux 80 dernières lignes pour limiter la taille de réponse.
function readEmails_(p) {
  var ss = SpreadsheetApp.openById("1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U");
  var sheet = ss.getSheetByName("Emails");
  if (!sheet) return json_({ ok: false, error: "Onglet Emails introuvable" });
  var last = sheet.getLastRow();
  if (last < 2) return json_({ ok: true, rows: [], total: 0 });
  var ncols = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, ncols).getValues()[0].map(function (h) { return String(h).trim(); });
  var n = Math.min(parseInt((p && p.n) || 80, 10) || 80, last - 1);
  var startRow = last - n + 1;
  var data = sheet.getRange(startRow, 1, n, ncols).getValues();
  var rows = data
    .map(function (row) { var o = {}; headers.forEach(function (h, i) { o[h] = String(row[i] || ""); }); return o; })
    .filter(function (r) { return r.Sender || r.Subject; });
  return json_({ ok: true, rows: rows, total: last - 1 });
}

// ── INGESTION Gmail → onglet « Emails » (remplace le Zap payant) ──────────────
// Airbnb arrive sur Hotmail. Une règle Outlook transfère les mails « Reservation/Booking
// confirmed » vers ce compte Gmail (vinsmaf@gmail.com, propriétaire du script). Ce trigger
// (toutes les 15 min) lit ces mails transférés et écrit Date/Sender/Subject/Body dans l'onglet
// « Emails », d'où enrichReservation_ tire nom + prix. Idempotent : chaque thread traité est
// labellisé « amaryllis-ingested » et exclu des recherches suivantes. getPlainBody() = texte
// (pas le HTML) → évite la limite 50 000 caractères d'une cellule Sheets.
function ingestAirbnbEmails_() {
  var LABEL = "amaryllis-ingested";
  var label = GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL);
  // Requête large : FR + EN + Airbnb + Booking, transfert Hotmail inclus (from devient expéditeur de transfert).
  var queries = [
    'from:(airbnb.com OR noreply@airbnb.com OR automated@airbnb.com) newer_than:60d -label:' + LABEL,
    'subject:("reservation confirmed" OR "booking confirmed" OR "réservation confirmée" OR "confirmation de réservation" OR "nouvelle réservation") newer_than:60d -label:' + LABEL,
  ];
  var seen = {};
  var allThreads = [];
  for (var q = 0; q < queries.length; q++) {
    var found = GmailApp.search(queries[q], 0, 50);
    for (var t = 0; t < found.length; t++) {
      var tid = found[t].getId();
      if (!seen[tid]) { seen[tid] = true; allThreads.push(found[t]); }
    }
  }
  var ss = SpreadsheetApp.openById("1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U");
  var sheet = ss.getSheetByName("Emails");
  if (!sheet) { sheet = ss.insertSheet("Emails"); sheet.appendRow(["Date", "Sender", "Subject", "Body"]); }
  if (sheet.getLastRow() === 0) sheet.appendRow(["Date", "Sender", "Subject", "Body"]);
  var written = 0;
  for (var i = 0; i < allThreads.length; i++) {
    var msgs = allThreads[i].getMessages();
    for (var j = 0; j < msgs.length; j++) {
      var m = msgs[j];
      var subj = m.getSubject() || "";
      var from = m.getFrom() || "";
      var body = m.getPlainBody() || m.getBody() || "";
      var platform = /airbnb/i.test(from + subj + body) ? "Airbnb"
                   : /booking\.com/i.test(from + subj + body) ? "Booking.com"
                   : "Autre";
      sheet.appendRow([m.getDate(), platform + " <" + from + ">", subj, body.slice(0, 45000)]);
      written++;
    }
    allThreads[i].addLabel(label);
  }
  return { ok: true, threads: allThreads.length, written: written };
}

// Diagnostic : retourne les 10 derniers emails Airbnb trouvés dans Gmail (sans écrire, sans labelliser)
function debugGmailSearch_() {
  try {
    var results = [];
    var queries = [
      'from:(airbnb.com) newer_than:90d',
      'subject:(airbnb OR réservation OR reservation OR booking) newer_than:30d',
    ];
    var seen = {};
    for (var q = 0; q < queries.length; q++) {
      var threads = GmailApp.search(queries[q], 0, 10);
      for (var t = 0; t < threads.length; t++) {
        var tid = threads[t].getId();
        if (seen[tid]) continue;
        seen[tid] = true;
        var msg = threads[t].getMessages()[0];
        results.push({ from: msg.getFrom(), subject: msg.getSubject(), date: String(msg.getDate()) });
      }
    }
    return json_({ ok: true, found: results.length, emails: results.slice(0, 10) });
  } catch(e) {
    return json_({ ok: false, error: e.message, stack: e.stack });
  }
}

// À exécuter UNE fois depuis l'éditeur Apps Script : autorise le scope Gmail (lecture) et crée le
// déclencheur temporel 15 min. Idempotent (supprime un ancien trigger homonyme), lance un 1er passage.
function setupAirbnbIngest() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "ingestAirbnbEmails_") ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger("ingestAirbnbEmails_").timeBased().everyMinutes(15).create();
  var res = ingestAirbnbEmails_();
  return { ok: true, trigger: "ingestAirbnbEmails_ toutes les 15 min", premierPassage: res };
}

// ── PUSH Gmail Airbnb → webhook /api/airbnb-email-import ──────────────────────
// Parse les emails de confirmation Airbnb reçus sur Gmail et POST les données
// structurées (nom, dates, bien, montant net) vers Cloudflare D1 via le webhook.
// Idempotent : chaque thread traité reçoit le label « airbnb-webhook-sent ».
// Trigger automatique : toutes les 15 min (setupWebhookTrigger).
function pushAirbnbEmailsToWebhook_(opts) {
  opts = opts || {};
  var LABEL = "airbnb-webhook-sent";
  var label = GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL);
  var WEBHOOK_URL = PropertiesService.getScriptProperties().getProperty("AIRBNB_WEBHOOK_URL")
    || "https://villamaryllis.com/api/airbnb-email-import?secret=79a03d767d57bae7bda15175137b10fac3bd231e7dae3c1e";
  var days = parseInt(opts.days || opts.newer_than || 60, 10) || 60;
  var queries = [
    'from:(airbnb) subject:("réservation confirmée" OR "reservation confirmed" OR "nouvelle réservation" OR "booking confirmed") newer_than:' + days + 'd -label:' + LABEL,
    'from:(automated@airbnb.com) newer_than:' + days + 'd -label:' + LABEL,
  ];
  var seen = {}, allThreads = [];
  for (var q = 0; q < queries.length; q++) {
    var found = GmailApp.search(queries[q], 0, 50);
    for (var t = 0; t < found.length; t++) {
      var tid = found[t].getId();
      if (!seen[tid]) { seen[tid] = true; allThreads.push(found[t]); }
    }
  }

  var MONTHS_FR = { jan:1,fév:2,fevr:2,févr:2,mar:3,mars:3,avr:4,mai:5,jun:6,juin:6,jul:7,juil:7,aoû:8,aout:8,sep:9,sept:9,oct:10,nov:11,déc:12,dec:12 };
  var MONTHS_EN = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
  function parseAirbnbDate(raw, year) {
    if (!raw) return null;
    var s = String(raw).toLowerCase().replace(/\./g,'').trim();
    // "dim 3 mars" or "3 mars" or "mars 3"
    var m = s.match(/(\d{1,2})\s+([a-záàâéèêëîïôùûü]+)/);
    if (m) { var day=parseInt(m[1]), mon=MONTHS_FR[m[2].substring(0,4)]||MONTHS_EN[m[2].substring(0,3)]; if (mon&&day) return year+'-'+String(mon).padStart(2,'0')+'-'+String(day).padStart(2,'0'); }
    m = s.match(/([a-záàâéèêëîïôùûü]+)\s+(\d{1,2})/);
    if (m) { var mon2=MONTHS_FR[m[1].substring(0,4)]||MONTHS_EN[m[1].substring(0,3)], day2=parseInt(m[2]); if (mon2&&day2) return year+'-'+String(mon2).padStart(2,'0')+'-'+String(day2).padStart(2,'0'); }
    return null;
  }
  var BIENS = [
    { id:'nogent',     kw:['nogent','portes de paris','standing aux portes','appartement de standing','suresnes'] },
    { id:'amaryllis',  kw:['amaryllis'] },
    { id:'iguana',     kw:['iguana'] },
    { id:'geko',       kw:['géko','geko','gecko'] },
    { id:'zandoli',    kw:['zandoli'] },
    { id:'mabouya',    kw:['mabouya'] },
    { id:'schoelcher', kw:['schoelcher','schœlcher','bellevue schoelcher'] },
  ];
  function detectBien(txt) {
    var t = txt.toLowerCase();
    for (var i = 0; i < BIENS.length; i++) {
      for (var j = 0; j < BIENS[i].kw.length; j++) { if (t.indexOf(BIENS[i].kw[j]) >= 0) return BIENS[i].id; }
    }
    return null;
  }

  var pushed=0, errors=0, skipped=0, log=[];
  for (var th = 0; th < allThreads.length; th++) {
    var msgs = allThreads[th].getMessages();
    for (var mi = 0; mi < msgs.length; mi++) {
      var msg = msgs[mi];
      var subj = msg.getSubject() || '';
      // Skip reminders / follow-ups (not booking confirmations)
      if (/rappel|reminder|arriv[ae]\s+bient/i.test(subj) && !/confirm/i.test(subj)) { skipped++; continue; }
      var body = msg.getPlainBody() || '';
      var year = msg.getDate().getFullYear();
      // Guest name from subject: "Réservation confirmée : Jean Dupont arrive le..."
      var gm = subj.match(/:\s+(.+?)\s+arriv[ae]/i);
      var guestName = gm ? gm[1].trim() : '';
      // Confirmation code (10 uppercase alphanum chars)
      var codeM = body.match(/\b([A-Z0-9]{10})\b/);
      var confirmCode = codeM ? codeM[1] : ('gmail-' + msg.getId());
      // Dates: look for "Arrivée ... Départ ..." block
      var checkin = null, checkout = null;
      var arrBlock = body.match(/arriv[eé]e[\s\S]{0,10}([A-ZDLMJVS][A-Z\.\s]+\d{1,2}[^\n]+)/i);
      if (arrBlock) checkin = parseAirbnbDate(arrBlock[1], year);
      var depBlock = body.match(/d[eé]part[\s\S]{0,10}([A-ZDLMJVS][A-Z\.\s]+\d{1,2}[^\n]+)/i);
      if (depBlock) checkout = parseAirbnbDate(depBlock[1], year);
      // Fallback: "DIM. 3 MARS MER. 6 MARS" on same line after "Arrivée Départ"
      if (!checkin || !checkout) {
        var sameLine = body.match(/arrivée\s+départ[\s\r\n]+([^\n]+)/i);
        if (sameLine) {
          var parts = sameLine[1].split(/\s{3,}|\t/);
          if (parts.length >= 2) { checkin = checkin || parseAirbnbDate(parts[0], year); checkout = checkout || parseAirbnbDate(parts[parts.length-1], year); }
        }
      }
      // Property
      var bienId = detectBien(body) || detectBien(subj);
      // Host payout total
      var totalNet = 0;
      var payoutM = body.match(/versement[\s\S]{0,400}total\s*\(eur\)\s*([\d\s]+[.,]\d{2})/i);
      if (payoutM) { totalNet = parseFloat(payoutM[1].replace(/\s/g,'').replace(',','.')); }
      else {
        var allTotals = body.match(/total\s*\(eur\)\s*([\d\s]+[.,]\d{2})/gi) || [];
        if (allTotals.length) { var last = allTotals[allTotals.length-1].match(/([\d\s]+[.,]\d{2})/); if (last) totalNet = parseFloat(last[1].replace(/\s/g,'').replace(',','.')); }
      }
      var nbGuests = 1;
      var guestNbM = body.match(/(\d+)\s+adulte/i) || body.match(/(\d+)\s+adult/i);
      if (guestNbM) nbGuests = parseInt(guestNbM[1]);
      if (!guestName || !checkin || !checkout) {
        log.push({ skip:true, subj:subj.slice(0,60), code:confirmCode, guest:guestName, checkin:checkin, checkout:checkout });
        skipped++; continue;
      }
      var payload = { platform:'Airbnb', airbnbId:confirmCode, guestName:guestName, nbGuests:nbGuests, checkin:checkin, checkout:checkout, bienId:bienId||'inconnu', totalNet:totalNet, rawSubject:subj };
      try {
        var resp = UrlFetchApp.fetch(WEBHOOK_URL, { method:'post', contentType:'application/json', payload:JSON.stringify(payload), muteHttpExceptions:true });
        var rc = resp.getResponseCode();
        if (rc === 200) { pushed++; log.push({ ok:true, code:confirmCode, guest:guestName, bien:bienId, checkin:checkin, total:totalNet }); }
        else { errors++; log.push({ ok:false, code:confirmCode, guest:guestName, httpCode:rc, body:resp.getContentText().slice(0,200) }); }
      } catch(e) { errors++; log.push({ error:String(e), code:confirmCode }); }
    }
    allThreads[th].addLabel(label);
  }
  return { ok:true, threads:allThreads.length, pushed:pushed, errors:errors, skipped:skipped, log:log };
}

// Installe le déclencheur toutes-les-15-min + lance un premier passage sur les 365 derniers jours.
function setupWebhookTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'pushAirbnbEmailsToWebhook_') ScriptApp.deleteTrigger(triggers[i]);
  }
  ScriptApp.newTrigger('pushAirbnbEmailsToWebhook_').timeBased().everyMinutes(15).create();
  var res = pushAirbnbEmailsToWebhook_({ days: 7 });
  return { ok:true, trigger:'pushAirbnbEmailsToWebhook_ toutes les 15 min', firstRun:res };
}

// Enrichit UNE résa existante de « Toutes les Réservations » avec nom/prix venant d'un mail OTA
// (Airbnb/Booking ne transmettent ni nom ni prix par iCal). NON DESTRUCTIF : n'écrit Voyageur
// (col C) et Montant (col H) QUE s'ils sont vides/placeholder. Matching par clé-contenu
// bienId|checkin|checkout (même dedupKey_ que le reste). Téléphone/Email (col N/O) si fournis et vides.
function enrichReservation_(p) {
  if (!p || !p.bienId || !p.checkin || !p.checkout) return json_({ ok: false, error: "bienId, checkin, checkout requis" });
  var ss = SpreadsheetApp.openById("1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U");
  var sheet = ss.getSheetByName("Toutes les Réservations");
  if (!sheet) return json_({ ok: false, error: "Onglet Toutes les Réservations introuvable" });
  var last = sheet.getLastRow();
  if (last < 2) return json_({ ok: true, matched: false });

  var LABEL_TO_BIENID = { "T2 Nogent": "nogent", "Villa Amaryllis": "amaryllis", "Villa Iguana": "iguana", "Geko": "geko", "Zandoli": "zandoli", "Mabouya": "mabouya", "T2 Schoelcher": "schoelcher" };
  var PLACEHOLDERS = { "": 1, "—": 1, "-": 1, "Not available": 1, "Voyageur Booking": 1, "Voyageur Airbnb": 1, "Voyageur": 1 };
  function isPlaceholder(v) { return PLACEHOLDERS[String(v || "").trim()] === 1; }

  // Matching robuste au décalage -1j de fuseau de l'iCal : même bien + même nombre de NUITS
  // (invariant au décalage) + check-in à ±1 jour. On prend le candidat le plus proche ; si
  // deux candidats sont à égalité de distance → ambigu, on n'écrit rien (jamais de faux match).
  function toUTC_(v) { return new Date(normDate_(v) + "T12:00:00Z"); }
  function nights_(a, b) { return Math.round((toUTC_(b) - toUTC_(a)) / 86400000); }
  function dayDiff_(a, b) { return Math.abs(Math.round((toUTC_(a) - toUTC_(b)) / 86400000)); }

  var bienId = String(p.bienId).toLowerCase();
  var targetNights = nights_(p.checkin, p.checkout);
  var ncols = Math.max(sheet.getLastColumn(), 15);
  var data = sheet.getRange(2, 1, last - 1, ncols).getValues();
  var best = null, bestDiff = 99, tie = false, sameBien = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var bId = LABEL_TO_BIENID[r[1]] || String(r[1] || "").toLowerCase();
    if (bId !== bienId) continue;
    sameBien.push(dedupKey_(bId, r[4], r[5]));
    if (nights_(r[4], r[5]) !== targetNights) continue;
    var diff = dayDiff_(r[4], p.checkin);
    if (diff > 1) continue;
    if (diff < bestDiff) { best = { rowNum: i + 2, r: r }; bestDiff = diff; tie = false; }
    else if (diff === bestDiff) { tie = true; }
  }
  if (!best || tie) return json_({ ok: true, matched: false, ambigu: tie, targetKey: dedupKey_(bienId, p.checkin, p.checkout), candidatsMemeBien: sameBien.slice(0, 8) });

  var rowNum = best.rowNum, r = best.r;
  var before = { voyageur: String(r[2] || ""), montant: r[7] };
  var force = !!p.force; // opt-in : écrase même si déjà rempli (corrections ponctuelles). Défaut = non destructif.
  var wrote = {};
  if (p.voyageur && (force || isPlaceholder(r[2]))) { sheet.getRange(rowNum, 3).setValue(p.voyageur); wrote.voyageur = p.voyageur; }
  var curM = parseFloat(r[7]) || 0;
  if (p.montant && (force || curM <= 0)) { sheet.getRange(rowNum, 8).setValue(parseFloat(p.montant)); wrote.montant = parseFloat(p.montant); }
  if (p.phone && (force || !String(r[13] || "").trim())) { sheet.getRange(rowNum, 14).setValue(p.phone); wrote.phone = p.phone; }
  if (p.email && (force || !String(r[14] || "").trim())) { sheet.getRange(rowNum, 15).setValue(p.email); wrote.email = p.email; }
  return json_({ ok: true, matched: true, row: rowNum, dayDiff: bestDiff, before: before, wrote: wrote });
}

function doGet(e) {
  const action = e?.parameter?.action || "read";

  if (action === "read") return readAll_();
  if (action === "updateRevenu") return updateRevenu_(e.parameter);
  if (action === "addReservation") return addReservation_(e.parameter);
  if (action === "deleteReservation") return deleteReservation_(e.parameter);
  if (action === "fetchIcal") return fetchIcal_(e.parameter);
  if (action === "syncReservations") return syncReservations_(e.parameter);
  if (action === "importAllReservations") return importAllReservations_(e.parameter);
  if (action === "updateContactsById") return updateContactsById_(e.parameter);
  if (action === "revenus2026DryRun") return json_({ ok: true, preview: testRevenus2026_dryRun() });
  if (action === "revenus2026Setup")  return json_(setupRevenus2026());
  if (action === "revenus2026Sync")   return json_(syncRevenus2026());
  if (action === "revenus2026PurgeZero")    return json_(revenus2026PurgeZero_());
  if (action === "revenus2026RebuildDry")       return json_(rebuildRevenus2026_(false, parseInt(e.parameter.fromMonth, 10)));
  if (action === "revenus2026RebuildApply")     return json_(rebuildRevenus2026_(true,  parseInt(e.parameter.fromMonth, 10)));
  if (action === "revenus2026RebuildBienDry")   return json_(rebuildRevenus2026_(false, parseInt(e.parameter.fromMonth, 10), e.parameter.bien || "schoelcher"));
  if (action === "revenus2026RebuildBienApply") return json_(rebuildRevenus2026_(true,  parseInt(e.parameter.fromMonth, 10), e.parameter.bien || "schoelcher"));
  if (action === "revenus2027DryRun") return json_({ ok: true, preview: testRevenus2027_dryRun() });
  if (action === "revenus2027Setup")  return json_(setupRevenus2027());
  if (action === "revenus2027Sync")   return json_(syncRevenus2027());
  if (action === "sendCheckinAlerts") { sendCheckinAlerts_(); return json_({ ok: true }); }
  if (action === "setNtfyTopic") return setNtfyTopic_(e.parameter);
  if (action === "getConfig")    return getConfig_(e.parameter);
  if (action === "setConfig")    return setConfig_(e.parameter);
  if (action === "readEmails")   return readEmails_(e.parameter);
  if (action === "ingestAirbnbEmails") return json_(ingestAirbnbEmails_());
  if (action === "setupAirbnbIngest")  return json_(setupAirbnbIngest());
  if (action === "debugGmailSearch")   return debugGmailSearch_();
  if (action === "pushAirbnbEmails")   return json_(pushAirbnbEmailsToWebhook_(e.parameter));
  if (action === "setupWebhookTrigger") return json_(setupWebhookTrigger());
  if (action === "enrichReservation")  return enrichReservation_(e.parameter);
  if (action === "revenus2026FromMonth") return json_(revenus2026FromMonth_(parseInt(e.parameter.month||7), e.parameter.apply==="true", e.parameter.ignoreMemo==="true"));
  if (action === "revenus2026Inspect")   return json_(revenusInspect2026_()); // eslint-disable-line no-undef
  if (action === "revenus2026Rebuild")   return json_(rebuildRevenus2026_(e.parameter.apply==="true", parseInt(e.parameter.fromMonth, 10))); // eslint-disable-line no-undef
  if (action === "cleanSlate2026")       return json_(cleanSlate2026_()); // eslint-disable-line no-undef
  if (action === "fixMontantsAberrants") return json_(fixMontantsAberrants_(parseInt(e.parameter.cap || 50000, 10)));
  if (action === "importFromAirbnb")  return json_(importFromAirbnbSheet_());
  if (action === "importFromBooking") return json_(importFromBookingSheet_());

  return json_({ error: "action inconnue: " + action });
}

// ── POST handler (webhook Beds24 + sync manuel) ──────────────────
function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch(err) { return json_({ error: "JSON invalide" }); }

  var action = body.action || "";
  if (action === "importAllReservations") return importAllReservations_(body.reservations || [], !!body.skipRevenueSync);
  if (action === "cancelReservations")    return json_(cancelReservations_(body.annulations || []));
  if (action === "fixMontantsAberrants") return json_(fixMontantsAberrants_(parseInt(body.cap || 50000, 10)));
  if (action === "cleanSlate2026")       return json_(cleanSlate2026_()); // eslint-disable-line no-undef
  if (action === "setConfig")             return setConfig_(body);
  if (action === "read")                  return readAll_();
  if (action === "readEmails")            return readEmails_(body);
  if (action === "ingestAirbnbEmails")    return json_(ingestAirbnbEmails_());
  if (action === "setupAirbnbIngest")     return json_(setupAirbnbIngest());
  if (action === "pushAirbnbEmails")      return json_(pushAirbnbEmailsToWebhook_(body));
  if (action === "setupWebhookTrigger")   return json_(setupWebhookTrigger());
  if (action === "enrichReservation")     return enrichReservation_(body);
  if (action === "getConfig")             return getConfig_(body);
  if (action === "revenus2026DryRun")     return json_({ ok: true, preview: testRevenus2026_dryRun() });
  if (action === "revenus2026Setup")      return json_(setupRevenus2026());
  if (action === "revenus2026Sync")       return json_(syncRevenus2026());
  if (action === "revenus2026Status")     return json_(revenus2026Status_());
  if (action === "revenus2026Recent")     return json_(revenus2026Recent_(body.n || 10));
  if (action === "revenus2026Forget")     return json_(revenus2026Forget_(body.ids || ""));
  // ⚠️ GARDE-FOU : ignoreMemo=true est additif → double-compte si les cellules ont déjà des valeurs (vécu 2026-06-27)
  if (action === "revenus2026FromMonth" && !!body.ignoreMemo) {
    return json_({ ok: false, blocked: true, error: "BLOQUÉ: revenus2026FromMonth(ignoreMemo:true) interdit — utiliser revenus2026RebuildBienApply (idempotent)." });
  }
  if (action === "revenus2026FromMonth")  return json_(revenus2026FromMonth_(body.month || 7, !!body.apply, !!body.ignoreMemo));
  if (action === "revenus2026Undo")       return json_(revenus2026Undo_(body.ids || ""));
  if (action === "updateRevenu")            return updateRevenu_(body);
  if (action === "addReservation")          return addReservation_(body);
  if (action === "deleteReservation")       return deleteReservation_(body);
  if (action === "revenus2026PurgeZero")    return json_(revenus2026PurgeZero_());
  if (action === "revenus2026RebuildDry")       return json_(rebuildRevenus2026_(false, parseInt(body.fromMonth, 10)));
  if (action === "revenus2026RebuildApply")     return json_(rebuildRevenus2026_(true,  parseInt(body.fromMonth, 10)));
  if (action === "revenus2026RebuildBienDry")   return json_(rebuildRevenus2026_(false, parseInt(body.fromMonth, 10), body.bien || "schoelcher"));
  if (action === "revenus2026RebuildBienApply") return json_(rebuildRevenus2026_(true,  parseInt(body.fromMonth, 10), body.bien || "schoelcher"));
  if (action === "revenus2026ManualPatch")      return json_(revenus2026ManualPatch_(body)); // eslint-disable-line no-undef
  if (action === "revenus2026Inspect")    return json_(revenusInspect2026_());            // eslint-disable-line no-undef
  if (action === "revenus2026Rebuild")    return json_(rebuildRevenus2026_(!!body.apply, body.fromMonth)); // eslint-disable-line no-undef
  if (action === "revenus2027RebuildBienApply") return json_(rebuildRevenus2027_(true, parseInt(body.fromMonth, 10) || 1));
  if (action === "revenus2027DryRun")     return json_({ ok: true, preview: testRevenus2027_dryRun() });
  if (action === "revenus2027Setup")      return json_(setupRevenus2027());
  if (action === "revenus2027Sync")       return json_(syncRevenus2027());
  if (action === "revenus2027Status")     return json_(revenus2027Status_());
  if (action === "revenus2027Recent")     return json_(revenus2027Recent_(body.n || 10));
  if (action === "revenus2027Forget")     return json_(revenus2027Forget_(body.ids || ""));
  if (action === "revenus2027FromMonth")  return json_(revenus2027FromMonth_(body.month || 1, !!body.apply, !!body.ignoreMemo));
  if (action === "revenus2027Undo")       return json_(revenus2027Undo_(body.ids || ""));
  if (action === "revenus2027Inspect")    return json_(revenusInspect2027_());            // eslint-disable-line no-undef
  if (action === "revenus2027Rebuild")    return json_(rebuildRevenus2027_(!!body.apply, body.fromMonth)); // eslint-disable-line no-undef

  return json_({ error: "action POST inconnue: " + action });
}

// ── Config générique (min_nights_config, daily_prices, …) ────────
function getConfig_(params) {
  try {
    var key   = (params && params.key) ? params.key : "min_nights_config";
    var props = PropertiesService.getScriptProperties();
    var val   = props.getProperty(key);
    return json_({ ok: true, config: val ? JSON.parse(val) : {} });
  } catch(e) {
    return json_({ ok: false, error: String(e) });
  }
}

function setConfig_(params) {
  // Accepte : { key: "daily_prices", config: "<JSON string>" }  (depuis doGet params)
  //       ou : { config: {...} }                                  (depuis doPost body, legacy)
  try {
    var key   = (params && params.key) ? params.key : "min_nights_config";
    var props = PropertiesService.getScriptProperties();
    var raw   = params.config;
    var cfg;
    if (typeof raw === "string") {
      try { cfg = JSON.parse(raw); } catch(e) { return json_({ ok: false, error: "JSON invalide: " + e.message }); }
    } else {
      cfg = raw || {};
    }
    props.setProperty(key, JSON.stringify(cfg));
    return json_({ ok: true });
  } catch(e) {
    return json_({ ok: false, error: String(e) });
  }
}

function readAll_() {
  const sheet = getSheet_("revenus locatif 2026");
  if (!sheet) return json_({ error: "Onglet 'revenus locatif 2026' introuvable" });

  const getVals = (s, row, startCol, numCols) =>
    s.getRange(row, startCol, 1, numCols).getValues()[0]
      .map(v => (typeof v === "number" ? Math.round(v * 100) / 100 : 0));

  const nogentRevs = getVals(sheet, BIENS_MAP[0].revRow, 3, 12);
  let moisActifs = 0;
  for (let i = 0; i < nogentRevs.length; i++) {
    if (nogentRevs[i] > 0) moisActifs = i + 1;
  }
  if (!moisActifs) moisActifs = new Date().getMonth() + 1;

  return json_({
    moisActifs,
    biens: BIENS_MAP.map(b => ({
      id: b.id,
      revenus:  getVals(sheet, b.revRow,    3, 12),
      occ:      getVals(sheet, b.occRow,    3, 12), // valeurs en % (0-100), pas divisées par 100
      adr:      getVals(sheet, b.adrRow,    3, 12),
      revpar:   getVals(sheet, b.revparRow, 3, 12),
      cashflow: getVals(sheet, b.cfRow,     2, 12),
    })),
    hist: readHist_(),
    reservations: readReservations_(),
  });
}

// ── LECTURE RÉSERVATIONS → tableau pour sync multi-appareils ──────
// Relit l'onglet "Toutes les Réservations" et le reconvertit au format
// front (bienId, voyageur, canal, checkin, checkout, montant, id…).
// Colonnes : A=ID B=Propriété C=Voyageur D=Canal E=Arrivée F=Départ
//            G=Nuits H=Montant I=Statut J=Voyageurs K=Notes L=Source M=Modifié
function readReservations_() {
  try {
    var sheet = getSheet_("Toutes les Réservations");
    if (!sheet) return [];
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    var rows = sheet.getRange(2, 1, lastRow - 1, 15).getValues();
    // Inverse du mapping label → id (cohérent avec RESA_BIEN_LABELS / BIEN_LABELS)
    var LABEL_TO_ID = {
      "T2 Nogent": "nogent", "Villa Amaryllis": "amaryllis", "Villa Iguana": "iguana",
      "Geko": "geko", "Zandoli": "zandoli", "Mabouya": "mabouya", "T2 Schoelcher": "schoelcher"
    };
    var CANAL_TO_ID = { "Airbnb": "airbnb", "Booking.com": "booking", "Direct": "direct", "Beds24": "beds24" };
    var fmtDate = function(v) {
      if (v instanceof Date) {
        return v.getFullYear() + "-" + String(v.getMonth() + 1).padStart(2, "0") + "-" + String(v.getDate()).padStart(2, "0");
      }
      return String(v || "");
    };
    var out = [];
    rows.forEach(function(r) {
      var id = String(r[0] || "");
      if (!id) return;
      out.push({
        id: id,
        bienId: LABEL_TO_ID[r[1]] || String(r[1] || ""),
        voyageur: String(r[2] || ""),
        canal: CANAL_TO_ID[r[3]] || String(r[3] || "").toLowerCase(),
        checkin: fmtDate(r[4]),
        checkout: fmtDate(r[5]),
        nights: Number(r[6]) || 0,
        montant: Number(r[7]) || 0,
        status: String(r[8] || ""),
        nb_guests: Number(r[9]) || 1,
        notes: String(r[10] || ""),
        phone: String(r[13] || ""),
        email: String(r[14] || ""),
      });
    });
    return out;
  } catch (e) {
    return []; // fail-safe : ne casse jamais readAll_
  }
}

// ── PURGE montants aberrants (iCal descGet → numéro de référence) ───────────
function fixMontantsAberrants_(cap) {
  cap = cap || 50000;
  var sheet = getSheet_("Toutes les Réservations");
  if (!sheet) return { ok: false, error: "onglet introuvable" };
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: true, fixed: 0 };
  // Colonne H = index 8 (1-based) = montant
  var range = sheet.getRange(2, 8, lastRow - 1, 1);
  var values = range.getValues();
  var fixed = 0;
  values.forEach(function(row, i) {
    var v = Number(row[0]);
    if (!isNaN(v) && v > cap) {
      values[i][0] = 0;
      fixed++;
    }
  });
  if (fixed > 0) range.setValues(values);
  return { ok: true, fixed: fixed, cap: cap, totalRows: lastRow - 1 };
}

// ── LECTURE HISTORIQUE 2022-2025 ─────────────────────────────────
function readHist_() {
  const hist = {};
  const years = [2022, 2023, 2024, 2025];
  const tabNames = {
    2022: ["revenus locatif 2022", "revenus locatif 2022/2023"],
    2023: ["revenus locatif 2023", "revenus locatif 2022/2023"],
    2024: ["revenus locatif 2024", "revenus locatif 2024/2025"],
    2025: ["revenus locatif 2025", "revenus locatif 2024/2025"],
  };

  for (const year of years) {
    let sheet = null;
    for (const name of (tabNames[year] || [])) {
      sheet = getSheet_(name);
      if (sheet) break;
    }
    if (!sheet) continue;

    try {
      const getVals = (row, startCol, numCols) =>
        sheet.getRange(row, startCol, 1, numCols).getValues()[0]
          .map(v => (typeof v === "number" ? Math.round(v * 100) / 100 : 0));

      const yearData = {};
      for (const b of BIENS_MAP) {
        yearData[b.id] = getVals(b.revRow, 3, 12);
      }
      yearData.total = BIENS_MAP.reduce((totals, b) => {
        const revs = yearData[b.id];
        return totals.map((t, i) => t + (revs[i] || 0));
      }, Array(12).fill(0));

      hist[year] = yearData;
    } catch (e) {
      // Onglet trouvé mais structure différente — ignorer
    }
  }

  return hist;
}

// ── ÉCRITURE revenus ─────────────────────────────────────────────
// ?action=updateRevenu&bienId=nogent&month=1&value=2500
function updateRevenu_(p) {
  const bien = BIENS_MAP.find(b => b.id === p.bienId);
  if (!bien) return json_({ error: "bienId inconnu: " + p.bienId });

  const month = parseInt(p.month);
  const value = parseFloat(p.value);
  if (isNaN(month) || month < 1 || month > 12) return json_({ error: "month invalide" });
  if (isNaN(value)) return json_({ error: "value invalide" });

  const sheet = getSheet_("revenus locatif 2026");
  sheet.getRange(bien.revRow, month + 2).setValue(value); // col C = mois 1

  return json_({ ok: true, bienId: p.bienId, month, value });
}

// ── ÉCRITURE réservations ────────────────────────────────────────
// ?action=addReservation&bienId=nogent&checkin=2026-06-01&checkout=2026-06-05&voyageur=Jean&montant=800&canal=direct&id=xxx
// ── Onglet unique pour TOUTES les réservations (manuelles + Beds24) ──────────
function resaSheet_() {
  const ss = SpreadsheetApp.openById("1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U");
  let sheet = ss.getSheetByName("Toutes les Réservations");
  if (!sheet) {
    sheet = ss.insertSheet("Toutes les Réservations");
    const headers = ["ID","Propriété","Voyageur","Canal","Arrivée","Départ","Nuits","Montant (€)","Statut","Voyageurs","Notes","Source","Modifié le","Téléphone","Email"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      .setBackground("#1e3a5f").setFontColor("#ffffff").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}
const RESA_BIEN_LABELS = { nogent:"T2 Nogent", amaryllis:"Villa Amaryllis", iguana:"Villa Iguana", geko:"Geko", zandoli:"Zandoli", mabouya:"Mabouya", schoelcher:"T2 Schoelcher" };
const RESA_CANAL_LABELS = { airbnb:"Airbnb", booking:"Booking.com", direct:"Direct", beds24:"Beds24" };

function addReservation_(p) {
  const sheet = resaSheet_();
  const id = String(p.id || Utilities.getUuid());
  let nights = 0;
  if (p.checkin && p.checkout) {
    const a = new Date(p.checkin + "T12:00:00Z"), b = new Date(p.checkout + "T12:00:00Z");
    nights = Math.round((b - a) / 86400000);
  }
  const bienLabel  = RESA_BIEN_LABELS[p.bienId] || p.bienId || "";
  const canalLabel = RESA_CANAL_LABELS[p.canal] || p.canal || "Direct";
  const now = Utilities.formatDate(new Date(), "Europe/Paris", "yyyy-MM-dd");
  const row = [ id, bienLabel, p.voyageur || "—", canalLabel, p.checkin || "", p.checkout || "", nights,
                parseFloat(p.montant) || 0, p.statut || p.status || "Confirmé", parseInt(p.voyageurs || p.numGuests || 1, 10) || 1,
                p.notes || "", "Manuel", now, p.phone || p.tel || "", p.email || "" ];

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const grid = sheet.getRange(2, 1, lastRow - 1, 15).getValues();
    const LBL2ID = { "T2 Nogent":"nogent","Villa Amaryllis":"amaryllis","Villa Iguana":"iguana","Geko":"geko","Zandoli":"zandoli","Mabouya":"mabouya","T2 Schoelcher":"schoelcher" };
    const wantCk = dedupKey_(p.bienId, p.checkin, p.checkout);
    for (let i = 0; i < grid.length; i++) {
      const er = grid[i];
      // 1) même id → update direct
      if (String(er[0]) === id) {
        sheet.getRange(i + 2, 1, 1, row.length).setValues([row]);
        return json_({ ok: true, action: "updated" });
      }
      // 2) même contenu (bien|checkin|checkout) → update SANS créer de doublon.
      //    Anti-doublon des résas déjà présentes via un autre id (ex: direct_bookings
      //    'direct-*' synchronisé). On garde l'id existant pour ne pas casser le lien.
      const erBien = LBL2ID[er[1]] || String(er[1] || "").toLowerCase();
      const erCk = dedupKey_(erBien, er[4], er[5]);
      if (wantCk && wantCk !== "||" && erCk === wantCk) {
        row[0] = er[0];
        sheet.getRange(i + 2, 1, 1, row.length).setValues([row]);
        return json_({ ok: true, action: "updated", merged: true });
      }
    }
  }
  sheet.appendRow(row);
  // Saisie directe → remplit aussitôt "revenus locatif 2026" (nouvelle résa uniquement)
  try { syncRevenus2026(); } catch (e) {}
  return json_({ ok: true, action: "added" });
}

// ?action=deleteReservation&id=xxx  (suppression dans "Toutes les Réservations", id comparé en String)
function deleteReservation_(p) {
  var sheet = getSheet_("Toutes les Réservations");
  if (!sheet || !p.id) return json_({ ok: true, action: "noop" });

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return json_({ ok: true, action: "noop" });

  // Lire cols A(id) + B(bienLabel) + E(checkin) AVANT suppression pour rebuild revenus
  var LBL2ID = { "T2 Nogent":"nogent","Villa Amaryllis":"amaryllis","Villa Iguana":"iguana","Geko":"geko","Zandoli":"zandoli","Mabouya":"mabouya","T2 Schoelcher":"schoelcher" };
  var rows = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var idx = -1;
  var rowMeta = null;
  rows.forEach(function(r, i) {
    if (idx >= 0) return;
    if (String(r[0] || "") !== String(p.id)) return;
    idx = i;
    var bienLabel  = String(r[1] || "");
    var checkinRaw = r[4];
    // GAS renvoie les cellules date comme objets Date — on normalise en string "yyyy-MM-dd"
    var checkin = (checkinRaw instanceof Date)
      ? Utilities.formatDate(checkinRaw, "UTC", "yyyy-MM-dd")
      : String(checkinRaw || "");
    var bienId = LBL2ID[bienLabel] || bienLabel.toLowerCase().replace(/\s+/g, "");
    var year   = checkin ? parseInt(checkin.slice(0, 4), 10) : 0;
    var month  = checkin ? parseInt(checkin.slice(5, 7), 10) : 0;
    if (bienId && month && year >= 2026) rowMeta = { bienId: bienId, year: year, month: month };
  });

  if (idx < 0) return json_({ ok: true, action: "not_found" });

  sheet.deleteRow(idx + 2);

  // Rebuild revenus (revenus + nuits + occ) pour le bien/mois affecté
  var rebuilt = null;
  if (rowMeta) {
    try {
      if (rowMeta.year === 2026) rebuildRevenus2026_(true, rowMeta.month, rowMeta.bienId);
      if (rowMeta.year === 2027) rebuildRevenus2027_(true, rowMeta.month);
      rebuilt = rowMeta;
    } catch(e) { console.log("[deleteReservation] rebuild err:", e.message); }
  }

  return json_({ ok: true, action: "deleted", rebuilt: rebuilt });
}

// ?action=fetchIcal&url=https%3A%2F%2F...
function fetchIcal_(p) {
  if (!p.url) return json_({ error: "url manquante" });
  try {
    const resp = UrlFetchApp.fetch(p.url, { muteHttpExceptions: true, followRedirects: true });
    const text = resp.getContentText("UTF-8");
    return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.TEXT);
  } catch(err) {
    return json_({ error: err.toString() });
  }
}

// ?action=syncReservations&data=[{...}]
function syncReservations_(p) {
  if (!p.data) return json_({ error: "data manquante" });
  var resas;
  try { resas = JSON.parse(p.data); } catch(e) { return json_({ error: "JSON invalide" }); }

  var ss = SpreadsheetApp.openById("1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U");
  var sheet = ss.getSheetByName("alertes_sync");
  if (!sheet) sheet = ss.insertSheet("alertes_sync");
  sheet.clearContents();
  sheet.appendRow(["id","bienId","voyageur","canal","checkin","checkout","checkin_time","nb_guests","phone"]);
  resas.forEach(function(r) {
    sheet.appendRow([r.id||"", r.bienId||"", r.voyageur||"", r.canal||"", r.checkin||"", r.checkout||"", r.checkin_time||"", r.nb_guests||"", r.phone||""]);
  });
  return json_({ ok: true, count: resas.length });
}

// Fonction déclenchée automatiquement chaque jour
// Déclencheurs > Ajouter un déclencheur > sendCheckinAlerts_ > Quotidien > 07h-08h
function sendCheckinAlerts_() {
  var ss = SpreadsheetApp.openById("1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U");
  var sheet = ss.getSheetByName("alertes_sync");
  if (!sheet || sheet.getLastRow() < 2) return;

  var tz = "Europe/Paris";
  var today = new Date();
  var j2 = new Date(today);
  j2.setDate(j2.getDate() + 2);
  var j2str = Utilities.formatDate(j2, tz, "yyyy-MM-dd");
  var j1str = Utilities.formatDate(new Date(today.getTime() + 86400000), tz, "yyyy-MM-dd");
  var todayStr = Utilities.formatDate(today, tz, "yyyy-MM-dd");

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).getValues();

  var bienNames = {
    nogent: "T2 Nogent", amaryllis: "Villa Amaryllis", iguana: "Villa Iguana",
    geko: "Geko", zandoli: "Zandoli", mabouya: "Mabouya", schoelcher: "T2 Schœlcher"
  };

  function formatAlert(rows, label, emoji) {
    if (rows.length === 0) return "";
    var lines = rows.map(function(r) {
      return emoji + " " + (bienNames[r[1]] || r[1]) + " — " + r[2] +
        (r[6] ? " à " + r[6] : "") + (r[7] ? " · " + r[7] + " pers." : "") +
        (r[8] ? " · 📞 " + r[8] : "");
    });
    return label + "\n" + lines.join("\n");
  }

  var j2rows = data.filter(function(r) { return r[4] === j2str; });
  var j1rows = data.filter(function(r) { return r[4] === j1str; });
  var todayRows = data.filter(function(r) { return r[4] === todayStr; });

  if (j2rows.length === 0 && j1rows.length === 0 && todayRows.length === 0) return;

  var sections = [
    formatAlert(todayRows, "📅 AUJOURD'HUI", "🔑"),
    formatAlert(j1rows, "⏰ DEMAIN", "🔑"),
    formatAlert(j2rows, "📌 DANS 2 JOURS", "🔑"),
  ].filter(Boolean);

  var subject = "🏠 Dashboard Amaryllis — " +
    (todayRows.length ? todayRows.length + " check-in(s) aujourd'hui · " : "") +
    (j1rows.length ? j1rows.length + " demain · " : "") +
    (j2rows.length ? j2rows.length + " dans 2 jours" : "");

  var body = "Bonjour,\n\n" + sections.join("\n\n") +
    "\n\n— Dashboard Amaryllis\nhttps://dashboardamaryllis.netlify.app";

  var email = Session.getActiveUser().getEmail();
  GmailApp.sendEmail(email, subject.trim().replace(/ ·\s*$/, ""), body);
  sendNtfyPush_("🏠 " + subject.trim().replace(/ ·\s*$/, "").replace("🏠 Dashboard Amaryllis — ", ""), sections.join("\n\n"));
}

// ?action=setNtfyTopic&topic=mon-topic-secret
function setNtfyTopic_(p) {
  PropertiesService.getScriptProperties().setProperty("ntfyTopic", p.topic || "");
  return json_({ ok: true });
}

function sendNtfyPush_(title, body) {
  var topic = PropertiesService.getScriptProperties().getProperty("ntfyTopic");
  if (!topic) return;
  try {
    UrlFetchApp.fetch("https://ntfy.sh/" + topic, {
      method: "post",
      payload: body,
      headers: { "Title": title, "Priority": "high", "Tags": "key,house" },
      muteHttpExceptions: true
    });
  } catch(e) {}
}

// Note : les réservations Beds24 (Nogent) — onglet Beds24 + webhook temps réel —
// sont désormais mappées au format unifié côté JS (Beds24Admin.jsx / beds24-webhook.js)
// puis envoyées via l'action importAllReservations. Plus de fonction importBeds24_
// ni d'onglet "Réservations Nogent" : tout converge dans "Toutes les Réservations".

// ── IMPORT TOUTES LES RÉSERVATIONS → feuille "Toutes les Réservations" ─
// Format unifié : iCal (Airbnb/Booking/Direct) + Beds24 (toutes propriétés)
// Colonnes : A=ID  B=Propriété  C=Voyageur  D=Canal  E=Arrivée  F=Départ
//            G=Nuits  H=Montant(€)  I=Statut  J=Voyageurs  K=Notes  L=Source  M=Modifié le
// ── Clé de dédoublonnage par contenu (mirroir src/utils/resaDedup.js — garder synchro) ──
function normDate_(v) {
  if (v == null) return "";
  if (v instanceof Date && !isNaN(v)) {
    // La feuille stocke les dates à MINUIT heure locale (Europe/Paris). getUTC*
    // reculait d'un jour (Paris = UTC+1/+2) → clés-contenu décalées vs les dates
    // entrantes en string → dédup par contenu CASSÉE (placeholders iCal jamais
    // fusionnés avec la ligne enrichie, enrichReservation_ ne matchait jamais).
    // On lit donc les composantes LOCALES (fuseau du script), cohérent avec fmtDate.
    return v.getFullYear() + "-" + String(v.getMonth() + 1).padStart(2, "0") + "-" + String(v.getDate()).padStart(2, "0");
  }
  return String(v).slice(0, 10);
}
function dedupKey_(bienId, checkin, checkout) {
  return String(bienId || "").toLowerCase().trim() + "|" + normDate_(checkin) + "|" + normDate_(checkout);
}

// ── ENRICHISSEMENT CONTACTS (Téléphone + Email) par ID de résa ──────────────
// Reçoit via GET chunks : ?action=updateContactsById&data=[{"id":"...","tel":"...","email":"..."}]
// Met à jour les colonnes 14 (Téléphone) et 15 (Email) pour chaque ID trouvé.
function updateContactsById_(params) {
  var raw;
  try { raw = JSON.parse(params.data || "[]"); }
  catch(e) { return json_({ error: "JSON invalide: " + e.message }); }
  if (!Array.isArray(raw) || raw.length === 0) return json_({ ok: true, updated: 0 });

  var ss    = SpreadsheetApp.openById("1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U");
  var sheet = ss.getSheetByName("Toutes les Réservations");
  if (!sheet) return json_({ error: "Onglet introuvable" });

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return json_({ ok: true, updated: 0 });

  // Index ID → numéro de ligne
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  var idToRow = {};
  ids.forEach(function(r, i) { if (r[0]) idToRow[String(r[0])] = i + 2; });

  var updated = 0;
  raw.forEach(function(item) {
    var rowNum = idToRow[String(item.id || "")];
    if (!rowNum) return;
    // Col 14 = Téléphone, Col 15 = Email (seulement si non vide)
    if (item.tel)   sheet.getRange(rowNum, 14).setValue(item.tel);
    if (item.email) sheet.getRange(rowNum, 15).setValue(item.email);
    updated++;
  });

  return json_({ ok: true, updated: updated, total: raw.length });
}

function importAllReservations_(input) {
  // Accepte :
  //   – un tableau direct (appel interne)
  //   – un objet params GET { data: "[{...}]" } (via doGet → chunks)
  var reservations;
  if (Array.isArray(input)) {
    reservations = input;
  } else {
    if (!input || !input.data) return json_({ ok: true, added: 0, updated: 0 });
    try { reservations = JSON.parse(input.data); }
    catch(e) { return json_({ error: "JSON invalide: " + e.message }); }
  }
  if (!Array.isArray(reservations) || reservations.length === 0) return json_({ ok: true, added: 0, updated: 0 });

  var ss = SpreadsheetApp.openById("1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U");

  var SHEET_NAME = "Toutes les Réservations";
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    var headers = ["ID","Propriété","Voyageur","Canal","Arrivée","Départ","Nuits","Montant (€)","Statut","Voyageurs","Notes","Source","Modifié le","Téléphone","Email"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      .setBackground("#1e3a5f").setFontColor("#ffffff").setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 200);  // ID
    sheet.setColumnWidth(2, 130);  // Propriété
    sheet.setColumnWidth(3, 160);  // Voyageur
    sheet.setColumnWidth(4, 110);  // Canal
    sheet.setColumnWidth(5, 100);  // Arrivée
    sheet.setColumnWidth(6, 100);  // Départ
    sheet.setColumnWidth(11, 220); // Notes
  }

  var NCOLS = 15;

  // Index des lignes existantes — par ID, par clé-contenu (bien|checkin|checkout),
  // ET par voyageur+bien (pour détecter les modifs OTA qui changent les dates d'1-2j et génèrent un nouvel UID)
  var lastRow = sheet.getLastRow();
  var existingIds = {}, existingByContent = {}, existingByVoyBien = {};
  var LABEL_TO_BIENID = { "T2 Nogent":"nogent", "Villa Amaryllis":"amaryllis", "Villa Iguana":"iguana", "Geko":"geko", "Zandoli":"zandoli", "Mabouya":"mabouya", "T2 Schoelcher":"schoelcher" };
  if (lastRow > 1) {
    var existRows = sheet.getRange(2, 1, lastRow - 1, 6).getValues(); // ID, Propriété, Voyageur, Canal, Arrivée, Départ
    existRows.forEach(function(er, i) {
      var rowNum = i + 2;
      if (er[0]) existingIds[String(er[0])] = rowNum;
      var bId = LABEL_TO_BIENID[er[1]] || String(er[1] || "").toLowerCase();
      var ck = dedupKey_(bId, er[4], er[5]);
      if (ck && ck !== "||") existingByContent[ck] = rowNum;
      // Index voyageur+bien pour détecter chevauchement de dates (modif OTA)
      var voy = String(er[2] || "").toLowerCase().trim();
      if (voy && bId) {
        var vbKey = bId + "|" + voy;
        if (!existingByVoyBien[vbKey]) existingByVoyBien[vbKey] = [];
        existingByVoyBien[vbKey].push({ rowNum: rowNum, checkin: String(er[4] || ""), checkout: String(er[5] || "") });
      }
    });
  }

  var BIEN_LABELS = {
    nogent: "T2 Nogent", amaryllis: "Villa Amaryllis", iguana: "Villa Iguana",
    geko: "Geko", zandoli: "Zandoli", mabouya: "Mabouya", schoelcher: "T2 Schoelcher"
  };
  var CANAL_LABELS = {
    airbnb: "Airbnb", booking: "Booking.com", direct: "Direct", beds24: "Beds24",
    "Airbnb": "Airbnb", "Booking.com": "Booking.com", "Direct": "Direct"
  };

  var added = 0, updated = 0;
  var newResaLines = [];

  reservations.forEach(function(r) {
    var id = String(r.id || r.bookingId || "");
    if (!id) return;

    // Calcul nuits
    var nights = r.nights || 0;
    if (!nights && r.checkin && r.checkout) {
      var a = new Date(r.checkin + "T12:00:00Z");
      var b = new Date(r.checkout + "T12:00:00Z");
      nights = Math.round((b - a) / 86400000);
    }

    var bienLabel = BIEN_LABELS[r.bienId] || r.bienId || r.property || "";
    var canalLabel = CANAL_LABELS[r.canal] || r.canal || r.channel || "Direct";
    var statut = r.status || r.statusLabel || (r.statusCode === "2" ? "Annulé" : "Confirmé");

    var row = [
      id,
      bienLabel,
      r.voyageur || r.guestName || "—",
      canalLabel,
      r.checkin  || r.arrival   || "",
      r.checkout || r.departure || "",
      nights,
      r.montant  || r.price     || 0,
      statut,
      r.nb_guests || r.numGuests || 1,
      r.notes    || r.note      || "",
      r.source   || canalLabel,
      r.modifiedOn || r.checkin || "",
      r.phone    || r.tel       || "",
      r.email    || "",
    ];

    var contentK = dedupKey_(r.bienId, r.checkin || r.arrival, r.checkout || r.departure);
    var existingRow = existingIds[id] || (contentK && contentK !== "||" ? existingByContent[contentK] : null);

    // 3ème dédup : même voyageur + même bien + dates qui se chevauchent (modif OTA, nouvel UID)
    if (!existingRow) {
      var voy = String(r.voyageur || r.guestName || "").toLowerCase().trim();
      var ci = r.checkin || r.arrival || "";
      var co = r.checkout || r.departure || "";
      if (voy && r.bienId && ci && co) {
        var vbKey = r.bienId + "|" + voy;
        var candidates = existingByVoyBien[vbKey] || [];
        for (var ci2 = 0; ci2 < candidates.length; ci2++) {
          var cand = candidates[ci2];
          // Chevauchement : a.checkin < b.checkout && b.checkin < a.checkout
          if (cand.checkin && cand.checkout && cand.checkin < co && ci < cand.checkout) {
            existingRow = cand.rowNum;
            break;
          }
        }
      }
    }

    if (existingRow) {
      // PRÉSERVATION des champs saisis à la main : les iCal OTA (Booking surtout,
      // mais aussi Airbnb) ne transmettent NI nom NI montant → la résa arrive en
      // "Voyageur"/0 à chaque sync. Sans ça, le sync horaire écraserait la saisie
      // manuelle. Règle : un placeholder entrant ne remplace JAMAIS une vraie
      // valeur existante ; une vraie valeur entrante (ex. montant Airbnb) gagne.
      var cur = sheet.getRange(existingRow, 1, 1, NCOLS).getValues()[0];
      var PLACEHOLDER_VOY = { "":1, "—":1, "-":1, "voyageur":1, "voyageur (booking)":1,
        "reserved":1, "réservé":1, "not available":1, "blocked":1, "closed":1, "closed - not available":1 };
      function keepText_(inc, old) {
        var s = String(inc == null ? "" : inc).trim();
        return (!s || PLACEHOLDER_VOY[s.toLowerCase()]) ? old : inc;
      }
      row[2]  = keepText_(row[2],  cur[2]);                              // Voyageur
      row[7]  = (Number(row[7]) > 0) ? row[7] : cur[7];                  // Montant
      row[9]  = (Number(row[9]) > 1) ? row[9] : (Number(cur[9]) > 0 ? cur[9] : row[9]); // Voyageurs
      row[10] = keepText_(row[10], cur[10]);                            // Notes
      row[13] = keepText_(row[13], cur[13]);                            // Téléphone
      row[14] = keepText_(row[14], cur[14]);                            // Email
      sheet.getRange(existingRow, 1, 1, NCOLS).setValues([row]);
      existingIds[id] = existingRow;
      if (contentK && contentK !== "||") existingByContent[contentK] = existingRow;
      // Mise à jour de l'index voyBien avec les nouvelles dates
      var voy2 = String(r.voyageur || r.guestName || "").toLowerCase().trim();
      if (voy2 && r.bienId) {
        var vbKey2 = r.bienId + "|" + voy2;
        existingByVoyBien[vbKey2] = (existingByVoyBien[vbKey2] || []).filter(function(c) { return c.rowNum !== existingRow; });
        existingByVoyBien[vbKey2].push({ rowNum: existingRow, checkin: String(r.checkin || r.arrival || ""), checkout: String(r.checkout || r.departure || "") });
      }
      updated++;
    } else {
      sheet.appendRow(row);
      existingIds[id] = sheet.getLastRow();
      if (contentK && contentK !== "||") existingByContent[contentK] = sheet.getLastRow();
      // Ajout dans l'index voyBien
      var voy3 = String(r.voyageur || r.guestName || "").toLowerCase().trim();
      if (voy3 && r.bienId) {
        var vbKey3 = r.bienId + "|" + voy3;
        if (!existingByVoyBien[vbKey3]) existingByVoyBien[vbKey3] = [];
        existingByVoyBien[vbKey3].push({ rowNum: sheet.getLastRow(), checkin: String(r.checkin || r.arrival || ""), checkout: String(r.checkout || r.departure || "") });
      }
      added++;
      if (r.montant > 0 || r.price > 0) newResaLines.push(bienLabel + " · " + (r.voyageur || r.guestName || "?") + " · " + (r.checkin || r.arrival) + " · " + (r.montant || r.price || "?") + "€");
    }

    // Couleur par canal
    var rowNum = existingIds[id];
    var bg = canalLabel === "Airbnb"       ? "#fff3e0"
           : canalLabel === "Booking.com"  ? "#e3f2fd"
           : canalLabel === "Direct"       ? "#e8f5e9"
           : "#f3f4f6";
    if (statut === "Annulé") bg = "#fce4ec";
    sheet.getRange(rowNum, 1, 1, NCOLS).setBackground(bg);
  });

  // Tri par arrivée décroissante (col E = 5)
  if (sheet.getLastRow() > 2) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, NCOLS).sort({ column: 5, ascending: false });
  }

  // Notif push si nouvelles réservations
  if (newResaLines.length > 0) {
    sendNtfyPush_(
      "🏠 " + newResaLines.length + " nouvelle(s) réservation(s)",
      newResaLines.join("\n")
    );
  }

  return json_({ ok: true, added: added, updated: updated, total: reservations.length });
}

// ── IMPORT HISTORIQUE DEPUIS ONGLETS CSV ────────────────────────────────────
//
// Usage :
//   1. Dans le Sheet, créer un onglet "Import Airbnb" → y coller le CSV exporté
//      depuis l'extranet Airbnb (Réservations > Exporter en CSV).
//   2. Appeler ?action=importFromAirbnb  (ou lancer importFromAirbnbSheet_() dans l'éditeur)
//   3. Idem pour Booking.com : onglet "Import Booking" + ?action=importFromBooking
//
// Les fonctions détectent les colonnes automatiquement (FR et EN) et
// appellent importAllReservations_ → dédoublonnage + alimentation "Toutes les Réservations".

// Mappe le nom d'annonce Airbnb / d'établissement Booking → bienId
function guessAirbnbBienId_(listing) {
  if (!listing) return "";
  var l = String(listing).toLowerCase();
  if (l.includes("amaryllis")) return "amaryllis";
  if (l.includes("iguana"))    return "iguana";
  if (l.includes("zandoli"))   return "zandoli";
  if (l.includes("geko") || l.includes("gecko")) return "geko";
  if (l.includes("mabouya"))   return "mabouya";
  if (l.includes("schoel"))    return "schoelcher";
  if (l.includes("nogent") || l.includes("t2 nogent")) return "nogent";
  return "";
}

// Parse dates en plusieurs formats → YYYY-MM-DD
function parseCsvDate_(v) {
  if (!v) return "";
  if (v instanceof Date) { return v.getUTCFullYear() + "-" + String(v.getUTCMonth()+1).padStart(2,"0") + "-" + String(v.getUTCDate()).padStart(2,"0"); }
  var s = String(v).trim().replace(/\u00a0/g, " ");
  if (!s || s === "—" || s === "-") return "";
  // ISO : YYYY-MM-DD
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + "-" + m[2] + "-" + m[3];
  // DD/MM/YYYY (FR) ou MM/DD/YYYY (US) : si premier chiffre > 12 → forcément jour (FR)
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    var a = parseInt(m[1]);
    if (a > 12) return m[3] + "-" + m[2].padStart(2,"0") + "-" + m[1].padStart(2,"0"); // FR
    return m[3] + "-" + m[1].padStart(2,"0") + "-" + m[2].padStart(2,"0"); // US (Airbnb EN)
  }
  // D MMM YYYY (ex: "15 Jun 2024")
  m = s.match(/^(\d{1,2})\s+([A-Za-zéû]+)\s+(\d{4})/);
  if (m) {
    var MONTHS = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
                  janv:1,févr:2,mars:3,avr:4,mai:5,juin:6,juil:7,août:8,sept:9};
    var mo = MONTHS[m[2].slice(0,4).toLowerCase()];
    if (mo) return m[3] + "-" + String(mo).padStart(2,"0") + "-" + m[1].padStart(2,"0");
  }
  return "";
}

// Construit un mapping logique → index colonne à partir des en-têtes
function buildColMap_(headers) {
  var ALIASES = {
    id:        ["confirmation code","code de confirmation","booking number","numéro de réservation","reservation id","id réservation"],
    status:    ["status","statut","booking status","état"],
    listing:   ["listing","annonce","accommodation name","établissement","property name","nom du logement","logement"],
    firstName: ["guest first name","prénom du voyageur","first name","prénom"],
    lastName:  ["guest last name","nom du voyageur","last name"],
    guestName: ["guest name","nom du voyageur","guest","nom du client","client","booker name","nom du locataire","prénom et nom du client","voyageur"],
    checkin:   ["start date","date d'arrivée","arrival date","check-in date","arrivée","check in","checkin","date arrivée"],
    checkout:  ["end date","date de départ","departure date","check-out date","départ","check out","checkout","date départ"],
    nights:    ["nights booked","nuits réservées","nights","nuits","durée (nuits)"],
    amount:    ["gross earnings","revenus bruts","amount paid","montant payé","price","montant","gross price",
                "montant de la réservation","prix brut","prix total","total","amount","earnings"],
    email:     ["contact","email","e-mail","courriel"],
    persons:   ["number of adults","number of guests","adults","personnes","persons","voyageurs","nb voyageurs"],
  };
  var map = {};
  headers.forEach(function(h, i) {
    var hLow = String(h).toLowerCase().trim().replace(/\s+/g," ");
    Object.keys(ALIASES).forEach(function(key) {
      if (!Object.prototype.hasOwnProperty.call(map, key) && ALIASES[key].some(function(a) { return hLow === a || hLow.includes(a); })) {
        map[key] = i;
      }
    });
  });
  return map;
}

function importFromAirbnbSheet_() {
  var sheet = getSheet_("Import Airbnb");
  if (!sheet) return { ok: false, error: "Onglet 'Import Airbnb' introuvable. Créer l'onglet, puis File > Import > coller le CSV Airbnb." };
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { ok: true, added: 0, updated: 0, total: 0, message: "Onglet vide" };

  var col = buildColMap_(data[0]);
  var reservations = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var id = col.id !== undefined ? String(r[col.id] || "").trim() : "";
    if (!id || id === "—" || id === "") continue;

    var guestName = "";
    if (col.guestName !== undefined) guestName = String(r[col.guestName] || "").trim();
    if (!guestName && col.firstName !== undefined) {
      guestName = (String(r[col.firstName] || "") + " " + String(col.lastName !== undefined ? r[col.lastName] : "")).trim();
    }

    var listing = col.listing !== undefined ? String(r[col.listing] || "").trim() : "";
    var bienId  = guessAirbnbBienId_(listing);
    var status  = col.status !== undefined ? String(r[col.status] || "").toLowerCase() : "";
    var isCancelled = status.includes("cancel") || status.includes("annul") || status === "no-show";
    var amount  = col.amount !== undefined ? parseFloat(String(r[col.amount] || "0").replace(/[^0-9.,]/g,"").replace(",",".")) : 0;

    reservations.push({
      id:       "airbnb-" + id,
      bienId:   bienId,
      voyageur: guestName || "—",
      canal:    "airbnb",
      checkin:  col.checkin  !== undefined ? parseCsvDate_(r[col.checkin])  : "",
      checkout: col.checkout !== undefined ? parseCsvDate_(r[col.checkout]) : "",
      nights:   col.nights   !== undefined ? parseInt(r[col.nights] || 0, 10) : 0,
      montant:  amount,
      status:   isCancelled ? "Annulé" : "Confirmé",
      email:    col.email   !== undefined ? String(r[col.email]   || "").trim() : "",
      nb_guests: col.persons !== undefined ? parseInt(r[col.persons] || 1, 10) : 1,
      source:   "Import Airbnb CSV",
    });
  }

  var valid   = reservations.filter(function(r) { return r.bienId && r.checkin && r.checkout; });
  var skipped = reservations.length - valid.length;
  if (valid.length === 0) {
    return { ok: false, error: "Aucune ligne valide (bienId ou dates manquants). Vérifier le mapping colonnes.", skipped_no_match: skipped, col_map: col, headers: data[0] };
  }
  var result = JSON.parse(importAllReservations_(valid).getContent());
  result.skipped_no_match = skipped;
  result.total_rows = reservations.length;
  return result;
}

// ── Annulations automatiques iCal ────────────────────────────────────────────
// Appelé par le Worker quand un UID disparaît de l'iCal Airbnb/Booking.
// Supprime la ligne du Sheet + retire l'ID du memo revenus + re-synchro.
function cancelReservations_(annulations) {
  if (!Array.isArray(annulations) || annulations.length === 0) return { ok: true, cancelled: 0, ids: [] };

  var ss = SpreadsheetApp.openById("1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U");
  var sheet = ss.getSheetByName("Toutes les Réservations");
  if (!sheet) return { ok: false, error: "Sheet 'Toutes les Réservations' introuvable" };

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { ok: true, cancelled: 0, ids: [] };

  var ids = annulations.map(function(a) { return String(a.uid || ""); }).filter(Boolean);
  var idSet = {};
  ids.forEach(function(id) { idSet[id] = true; });

  // Lecture cols A(id) + B(bienLabel) + E(checkin) pour identifier les lignes et capturer le bien/mois
  var allData = sheet.getRange(2, 1, lastRow - 1, 5).getValues(); // A..E
  var rowsToDelete = [];
  var foundIds = [];
  var rowMeta = []; // [{bienId, month, year}] pour le rebuild post-suppression
  allData.forEach(function(r, i) {
    var cellId = String(r[0] || "");
    if (!idSet[cellId]) return;
    rowsToDelete.push(i + 2);
    foundIds.push(cellId);
    var bienLabel  = String(r[1] || ""); // col B
    var checkinRaw = r[4]; // col E — peut être un objet Date (GAS) ou string
    var checkin = (checkinRaw instanceof Date)
      ? Utilities.formatDate(checkinRaw, "UTC", "yyyy-MM-dd")
      : String(checkinRaw || "");
    var bienId = LBL2ID[bienLabel] || bienLabel.toLowerCase().replace(/\s+/g, "");
    var year  = checkin ? parseInt(checkin.slice(0, 4), 10) : 0;
    var month = checkin ? parseInt(checkin.slice(5, 7), 10) : 0;
    if (bienId && month && year >= 2026) rowMeta.push({ bienId: bienId, month: month, year: year });
  });

  // Supprimer de bas en haut pour éviter le décalage d'indices
  rowsToDelete.sort(function(a, b) { return b - a; });
  rowsToDelete.forEach(function(rowNum) { sheet.deleteRow(rowNum); });

  // Rebuild revenus idempotent (zero + recalcul depuis Sheet résiduel)
  // ⚠️ NE PAS utiliser revenus2026Forget+syncRevenus2026 : additif, ne soustrait pas
  var rebuilt = [];
  var rebuildDone = {};
  rowMeta.forEach(function(m) {
    var rebuildKey = m.bienId + "|" + m.month;
    if (rebuildDone[rebuildKey]) return;
    rebuildDone[rebuildKey] = true;
    try {
      if (m.year === 2026) rebuildRevenus2026_(true, m.month, m.bienId); // eslint-disable-line no-undef
      if (m.year === 2027) rebuildRevenus2027_(true, m.month, m.bienId); // eslint-disable-line no-undef
      rebuilt.push(rebuildKey);
    } catch(e) { console.log("rebuild err " + rebuildKey + ": " + e.message); }
  });

  return { ok: true, cancelled: rowsToDelete.length, ids: foundIds, rebuilt: rebuilt, notFound: ids.filter(function(id) { return foundIds.indexOf(id) < 0; }) };
}

function importFromBookingSheet_() {
  var sheet = getSheet_("Import Booking");
  if (!sheet) return { ok: false, error: "Onglet 'Import Booking' introuvable. Créer l'onglet, puis File > Import > coller le CSV Booking.com." };
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { ok: true, added: 0, updated: 0, total: 0, message: "Onglet vide" };

  var col = buildColMap_(data[0]);
  var reservations = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var id = col.id !== undefined ? String(r[col.id] || "").trim() : "";
    if (!id || id === "—" || id === "") continue;

    var listing    = col.listing  !== undefined ? String(r[col.listing]   || "").trim() : "";
    var bienId     = guessAirbnbBienId_(listing);
    var guestName  = col.guestName !== undefined ? String(r[col.guestName] || "").trim() : "—";
    var status     = col.status    !== undefined ? String(r[col.status]    || "").toLowerCase() : "";
    var isCancelled = status.includes("cancel") || status.includes("annul") || status === "no show" || status === "no_show";
    var amount     = col.amount    !== undefined ? parseFloat(String(r[col.amount] || "0").replace(/[^0-9.,]/g,"").replace(",",".")) : 0;

    reservations.push({
      id:       "booking-" + id,
      bienId:   bienId,
      voyageur: guestName || "—",
      canal:    "booking",
      checkin:  col.checkin  !== undefined ? parseCsvDate_(r[col.checkin])  : "",
      checkout: col.checkout !== undefined ? parseCsvDate_(r[col.checkout]) : "",
      nights:   col.nights   !== undefined ? parseInt(r[col.nights] || 0, 10) : 0,
      montant:  amount,
      status:   isCancelled ? "Annulé" : "Confirmé",
      email:    col.email   !== undefined ? String(r[col.email]   || "").trim() : "",
      nb_guests: col.persons !== undefined ? parseInt(r[col.persons] || 1, 10) : 1,
      source:   "Import Booking CSV",
    });
  }

  var valid   = reservations.filter(function(r) { return r.bienId && r.checkin && r.checkout; });
  var skipped = reservations.length - valid.length;
  if (valid.length === 0) {
    return { ok: false, error: "Aucune ligne valide. Vérifier le mapping colonnes.", skipped_no_match: skipped, col_map: col, headers: data[0] };
  }
  var result = JSON.parse(importAllReservations_(valid).getContent());
  result.skipped_no_match = skipped;
  result.total_rows = reservations.length;
  return result;
}
