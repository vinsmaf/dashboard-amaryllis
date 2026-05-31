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
function doGet(e) {
  const action = e?.parameter?.action || "read";

  if (action === "read") return readAll_();
  if (action === "updateRevenu") return updateRevenu_(e.parameter);
  if (action === "addReservation") return addReservation_(e.parameter);
  if (action === "deleteReservation") return deleteReservation_(e.parameter);
  if (action === "fetchIcal") return fetchIcal_(e.parameter);
  if (action === "syncReservations") return syncReservations_(e.parameter);
  if (action === "importAllReservations") return importAllReservations_(e.parameter);
  if (action === "sendCheckinAlerts") { sendCheckinAlerts_(); return json_({ ok: true }); }
  if (action === "setNtfyTopic") return setNtfyTopic_(e.parameter);
  if (action === "getConfig")    return getConfig_(e.parameter);
  if (action === "setConfig")    return setConfig_(e.parameter);

  return json_({ error: "action inconnue: " + action });
}

// ── POST handler (webhook Beds24 + sync manuel) ──────────────────
function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch(err) { return json_({ error: "JSON invalide" }); }

  var action = body.action || "";
  if (action === "importAllReservations") return importAllReservations_(body.reservations || []);
  if (action === "setConfig")             return setConfig_(body);
  if (action === "read")                  return readAll_();
  if (action === "getConfig")             return getConfig_(body);

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
                parseFloat(p.montant) || 0, "Confirmé", parseInt(p.voyageurs || p.numGuests || 1, 10) || 1,
                p.notes || "", "Manuel", now, p.phone || p.tel || "", p.email || "" ];

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(String);
    const idx = ids.indexOf(id);
    if (idx >= 0) {
      sheet.getRange(idx + 2, 1, 1, row.length).setValues([row]);
      return json_({ ok: true, action: "updated" });
    }
  }
  sheet.appendRow(row);
  return json_({ ok: true, action: "added" });
}

// ?action=deleteReservation&id=xxx  (suppression dans "Toutes les Réservations", id comparé en String)
function deleteReservation_(p) {
  const sheet = getSheet_("Toutes les Réservations");
  if (!sheet || !p.id) return json_({ ok: true, action: "noop" });

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return json_({ ok: true, action: "noop" });

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(String);
  const idx = ids.indexOf(String(p.id));
  if (idx >= 0) { sheet.deleteRow(idx + 2); return json_({ ok: true, action: "deleted" }); }

  return json_({ ok: true, action: "not_found" });
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
function importAllReservations_(input) {
  // Accepte :
  //   – un tableau direct (appel interne)
  //   – un objet params GET { data: "[{...}]" } (via doGet → chunks Cloudflare)
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

  var NCOLS = 13;

  // Index des IDs existants
  var lastRow = sheet.getLastRow();
  var existingIds = {};
  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    ids.forEach(function(row, i) { if (row[0]) existingIds[String(row[0])] = i + 2; });
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

    var existingRow = existingIds[id];
    if (existingRow) {
      sheet.getRange(existingRow, 1, 1, NCOLS).setValues([row]);
      updated++;
    } else {
      sheet.appendRow(row);
      existingIds[id] = sheet.getLastRow();
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
