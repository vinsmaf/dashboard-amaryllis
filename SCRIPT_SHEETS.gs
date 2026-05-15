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

  return json_({ error: "action inconnue: " + action });
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
