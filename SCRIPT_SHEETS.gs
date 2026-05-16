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

  return json_({ error: "action inconnue: " + action });
}

// ── POST handler (webhook Beds24 + sync manuel) ──────────────────
function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch(err) { return json_({ error: "JSON invalide" }); }

  var action = body.action || "";
  if (action === "importBeds24")       return importBeds24_(body.bookings || []);
  if (action === "importAllReservations") return importAllReservations_(body.reservations || []);

  return json_({ error: "action POST inconnue: " + action });
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
  });
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
function addReservation_(p) {
  let sheet = getSheet_("réservations");
  if (!sheet) {
    const ss = SpreadsheetApp.openById("1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U");
    sheet = ss.insertSheet("réservations");
    sheet.getRange(1, 1, 1, 8).setValues([["id","bienId","voyageur","canal","checkin","checkout","montant","notes"]]);
    sheet.getRange(1, 1, 1, 8).setFontWeight("bold");
  }

  const lastRow = sheet.getLastRow();
  if (p.id && lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    const idx = ids.indexOf(p.id);
    if (idx >= 0) {
      const row = idx + 2;
      sheet.getRange(row, 1, 1, 8).setValues([[p.id, p.bienId, p.voyageur, p.canal, p.checkin, p.checkout, parseFloat(p.montant)||0, p.notes||""]]);
      return json_({ ok: true, action: "updated", row });
    }
  }

  sheet.appendRow([p.id || Utilities.getUuid(), p.bienId, p.voyageur, p.canal, p.checkin, p.checkout, parseFloat(p.montant)||0, p.notes||""]);
  return json_({ ok: true, action: "added" });
}

// ?action=deleteReservation&id=xxx
function deleteReservation_(p) {
  const sheet = getSheet_("réservations");
  if (!sheet || !p.id) return json_({ ok: true, action: "noop" });

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return json_({ ok: true, action: "noop" });

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  const idx = ids.indexOf(p.id);
  if (idx >= 0) sheet.deleteRow(idx + 2);

  return json_({ ok: true, action: "deleted" });
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

// ── IMPORT BEDS24 → feuille "Réservations Nogent" ───────────────
// Colonnes : A=bookingId B=Client C=Email D=Téléphone E=Arrivée F=Départ
//            G=Nuits H=Canal I=Montant J=Statut K=Voyageurs L=Notes M=Créé le N=Modifié le
function importBeds24_(bookings) {
  if (!bookings || bookings.length === 0) return json_({ ok: true, updated: 0, added: 0 });

  var ss = SpreadsheetApp.openById("1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U");

  // ── Créer la feuille si elle n'existe pas ──
  var SHEET_NAME = "Réservations Nogent";
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // En-têtes
    var headers = ["ID Beds24","Client","Email","Téléphone","Arrivée","Départ","Nuits","Canal","Montant (€)","Statut","Voyageurs","Notes","Créé le","Modifié le"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground("#1e3a5f").setFontColor("#ffffff").setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, headers.length, 120);
    sheet.setColumnWidth(2, 160); // Client
    sheet.setColumnWidth(3, 200); // Email
    sheet.setColumnWidth(12, 240); // Notes
  }

  // ── Lire les IDs existants ──
  var lastRow = sheet.getLastRow();
  var existingIds = {};
  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    ids.forEach(function(row, i) {
      if (row[0]) existingIds[String(row[0])] = i + 2; // numéro de ligne
    });
  }

  var added = 0, updated = 0;

  bookings.forEach(function(b) {
    var row = [
      b.bookingId   || "",
      b.guestName   || "",
      b.email       || "",
      b.phone       || "",
      b.arrival     || "",
      b.departure   || "",
      b.nights      || 0,
      b.channel     || "",
      b.price       || 0,
      b.status      || "",
      b.numGuests   || 1,
      b.notes       || "",
      b.createdOn   || "",
      b.modifiedOn  || "",
    ];

    var existingRow = existingIds[String(b.bookingId)];
    if (existingRow) {
      // Mettre à jour la ligne existante
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
      updated++;
    } else {
      // Ajouter une nouvelle ligne
      sheet.appendRow(row);
      existingIds[String(b.bookingId)] = sheet.getLastRow();
      added++;
    }

    // ── Colorer selon statut ──
    var rowNum = existingIds[String(b.bookingId)];
    var color = b.statusCode === "1" ? "#e8f5e9"   // confirmé → vert clair
              : b.statusCode === "2" ? "#fce4ec"   // annulé → rouge clair
              : b.statusCode === "0" ? "#fff8e1"   // nouveau → jaune clair
              : "#ffffff";
    sheet.getRange(rowNum, 1, 1, row.length).setBackground(color);
  });

  // ── Trier par arrivée décroissante (col E = 5) ──
  if (sheet.getLastRow() > 2) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 14).sort({ column: 5, ascending: false });
  }

  // ── Mise à jour revenus mensuels Nogent (réservations confirmées) ──
  var revSheet = ss.getSheetByName("revenus locatif 2026");
  if (revSheet) {
    var nogentRevRow = 6; // ligne Nogent dans revenus locatif 2026
    bookings.forEach(function(b) {
      if (b.statusCode !== "1") return; // seulement les confirmées
      if (!b.arrival || !b.price)  return;

      var mois = new Date(b.arrival + "T12:00:00Z").getUTCMonth() + 1; // 1-12
      var col  = mois + 2; // col C=3 pour janvier, etc.

      var current = revSheet.getRange(nogentRevRow, col).getValue() || 0;
      // On n'additionne pas aveuglément — on recalcule depuis la feuille Réservations
      // (logique simplifiée : ajouter uniquement si la réservation est nouvelle)
    });
  }

  // Notif push si nouvelle réservation
  if (added > 0) {
    var newBookings = bookings.slice(0, added);
    var msg = newBookings.map(function(b) {
      return b.guestName + " · " + b.arrival + " → " + b.departure + " · " + b.price + "€";
    }).join("\n");
    sendNtfyPush_("🏙️ Nouvelle résa Nogent (" + added + ")", msg);
  }

  return json_({ ok: true, added: added, updated: updated });
}

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
    var headers = ["ID","Propriété","Voyageur","Canal","Arrivée","Départ","Nuits","Montant (€)","Statut","Voyageurs","Notes","Source","Modifié le"];
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
