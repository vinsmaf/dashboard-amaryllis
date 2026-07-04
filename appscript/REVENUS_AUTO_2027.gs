// ============================================================================
// REVENUS AUTO 2027  Projet Apps Script AUTONOME (separe du script principal)
// ----------------------------------------------------------------------------
// Remplit automatiquement "revenus locatif 2027" a partir de DEUX sources :
//   - "Toutes les Réservations" (iCal Airbnb/Booking, pousse par le worker horaire)
//   - "réservations"            (saisies directes du Planning  instantane au "Ajouter")
// Dedoublonnage par ID (memoire)  chaque resa comptee 1 seule fois, meme si
// elle apparait dans les deux onglets.
//
//   - Revenus  : TOUS canaux. Direct = net ; Airbnb/Booking = montant BRUT OTA
//                (commission incluse) assume par Vincent (peut etre ajuste a la main).
//   - Nb reservations + Nb nuits ("jours occupes") : TOUS canaux (hors blocages).
//   - Resa a cheval sur 2 mois : nuits reparties par mois reel, montant prorata.
//
// INSTALLATION (1 fois, dans l'ordre) :
//   1) testRevenus2027_dryRun()   log, n'ecrit RIEN
//   2) setupRevenus2027()         installe le trigger 15 min (PAS de baseline — voir note !)
//                                 ⚠️ DIFFÉRENCE vs 2026 : setupRevenus2027 NE base-line PAS les
//                                 réservations existantes, afin que les résas 2027 déjà présentes
//                                 dans "Toutes les Réservations" (ex. Mabouya reçue avant setup)
//                                 soient correctement comptabilisées au premier syncRevenus2027().
// Ensuite syncRevenus2027() tourne seul via le trigger.
// ============================================================================

var SHEET_ID_27  = "1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U";
var SRC_SHEET_27 = "Toutes les Réservations";  // accent en \u  paste-safe
var RESA_SHEET_27 = "réservations";            // saisies directes du Planning
var DST_SHEET_27 = "revenus locatif 2027";
var MEMO_SHEET_27 = "rev2027_traites";          // memoire des IDs deja appliques (onglet cache)

// Mapping colonnes par onglet (index 0-based) ; statut:-1 = colonne absente
// "Toutes les Réservations" : A=ID B=Propriete C=Voyageur D=Canal E=Arrivee F=Depart G=Nuits H=Montant I=Statut K=Notes
var COL_TOUTES_27 = { id:0, prop:1, voy:2, canal:3, arrivee:4, depart:5, montant:7, statut:8, notes:10, ncols:11 };
// "réservations" : A=id B=bienId C=voyageur D=canal E=checkin F=checkout G=montant H=notes
var COL_RESA_27   = { id:0, prop:1, voy:2, canal:3, arrivee:4, depart:5, montant:6, statut:-1, notes:7, ncols:8 };

// Libelle/identifiant bien  id interne (tolere labels ET ids bruts)
var BIEN_BY_LABEL_27 = {
  "t2 nogent":"nogent", "nogent":"nogent",
  "villa amaryllis":"amaryllis", "amaryllis":"amaryllis",
  "villa iguana":"iguana", "iguana":"iguana",
  "geko":"geko", "geko amaryllis":"geko",
  "zandoli":"zandoli", "zandoli amaryllis":"zandoli",
  "mabouya":"mabouya", "mabouya amaryllis":"mabouya",
  "t2 schoelcher":"schoelcher", "t2 scheolcher":"schoelcher", "schoelcher":"schoelcher",
};

// Lignes "revenus locatif 2027"  colonne = mois + 2 (janv=C=3 ... mai=G=7 ... dec=N=14)
// ⚠️ Ces numéros de lignes supposent que "revenus locatif 2027" est une COPIE CONFORME
//    de "revenus locatif 2026" (même structure, colonnes identiques).
var REV_ROWS_27 = {
  nogent:{airbnb:2,booking:3,direct:4}, amaryllis:{airbnb:7,booking:8,direct:9},
  iguana:{airbnb:11,booking:12,direct:13}, geko:{airbnb:15,booking:16,direct:17},
  zandoli:{airbnb:19,booking:20,direct:21}, mabouya:{airbnb:23,booking:24,direct:25},
  schoelcher:{airbnb:28,booking:29,direct:30},
};
var CNT_ROWS_27 = {
  nogent:{airbnb:36,booking:37,direct:38}, amaryllis:{airbnb:40,booking:41,direct:42},
  iguana:{airbnb:44,booking:45,direct:46}, geko:{airbnb:48,booking:49,direct:50},
  zandoli:{airbnb:52,booking:53,direct:54}, mabouya:{airbnb:56,booking:57,direct:58},
  schoelcher:{airbnb:60,booking:61,direct:62},
};
var NIGHTS_ROW_27 = { nogent:68, amaryllis:75, iguana:81, geko:87, zandoli:93, mabouya:99, schoelcher:105 };

//  Helpers
function canalKey27_(canal) {
  var c = String(canal || "").toLowerCase();
  if (c.indexOf("airbnb") >= 0 || c.indexOf("air bnb") >= 0) return "airbnb";
  if (c.indexOf("direct") >= 0) return "direct";
  return "booking";
}
function toNoonUTC27_(v) {
  if (v instanceof Date) return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate(), 12));
  var s = String(v || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
  return new Date(s + "T12:00:00Z");
}
function nightsByMonth2027_(ci, co) {
  var res = {}, d = toNoonUTC27_(ci), end = toNoonUTC27_(co), g = 0;
  if (!d || !end) return res;
  while (d < end && g++ < 400) {
    if (d.getUTCFullYear() === 2027) { var m = d.getUTCMonth() + 1; res[m] = (res[m] || 0) + 1; }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return res;
}
function appendCell27_(sheet, row, col, delta) {
  if (!delta) return;
  var cell = sheet.getRange(row, col), f = cell.getFormula();
  if (f && f.charAt(0) === "=") {
    var d = String(Math.round(Math.abs(delta) * 100) / 100).replace(".", ",");
    cell.setFormula(f + (delta < 0 ? "-" : "+") + d);
  } else {
    var v = cell.getValue();
    var base = (typeof v === "number" && !isNaN(v)) ? v : 0;
    cell.setValue(Math.round((base + delta) * 100) / 100);
  }
}
function isBlocage27_(voy, statut, notes) {
  voy = String(voy || "").toLowerCase(); statut = String(statut || "").toLowerCase(); notes = String(notes || "").toLowerCase();
  return statut.indexOf("bloqu") >= 0 || statut.indexOf("closed") >= 0 ||
         voy.indexOf("not available") >= 0 || voy.indexOf("indisponible") >= 0 ||
         notes.indexOf("closed") >= 0 || notes.indexOf("not available") >= 0;
}

// Applique UNE reservation (ligne brute + mapping colonnes C). dryRun  retourne juste les changements.
function applyOne27_(row, C, dstSheet, dryRun) {
  var changes = [];
  var bienId = BIEN_BY_LABEL_27[String(row[C.prop] || "").toLowerCase().trim()];
  if (!bienId || !REV_ROWS_27[bienId]) return changes;
  if (bienId === "iguana") return changes; // bail long manuel — jamais automatisé
  var statut = (C.statut >= 0) ? row[C.statut] : "";
  var notes  = (C.notes  >= 0) ? row[C.notes]  : "";
  if (isBlocage27_(row[C.voy], statut, notes)) return changes;
  var nbm = nightsByMonth2027_(row[C.arrivee], row[C.depart]);
  var totalN = 0; for (var k in nbm) totalN += nbm[k];
  if (totalN === 0) return changes;

  var ck = canalKey27_(row[C.canal]);
  var montant = parseFloat(row[C.montant]) || 0;
  var aDate = toNoonUTC27_(row[C.arrivee]);
  var arrivalMonth = (aDate && aDate.getUTCFullYear() === 2027) ? aDate.getUTCMonth() + 1 : null;
  if (!arrivalMonth) { for (var mm in nbm) { arrivalMonth = parseInt(mm, 10); break; } }

  // Comptage : 1 resa sur le mois d'ARRIVEE (jamais reparti).
  if (arrivalMonth) {
    var cRow = CNT_ROWS_27[bienId][ck], cCol = arrivalMonth + 2;
    changes.push({ bloc:"resa", row:cRow, col:cCol, delta:1 });
    if (!dryRun) appendCell27_(dstSheet, cRow, cCol, 1);
  }

  // Montant : 100% sur le mois d'ARRIVEE. Division égale par mois pour les longs séjours (>30 nuits).
  //   Court séjour (≤30 nuits) : mois d'arrivée reçoit le montant entier.
  //   Long séjour (>30 nuits) : montant / nb_mois_touchés → part égale par mois.
  //   Cas limite : arrivée hors 2027 → même division égale.
  if (montant > 0) {
    var revRow = REV_ROWS_27[bienId][ck];
    var longStay = totalN > 30;
    if (aDate && aDate.getUTCFullYear() === 2027 && !longStay) {
      var aCol = arrivalMonth + 2;
      changes.push({ bloc:"revenus", row:revRow, col:aCol, delta:montant });
      if (!dryRun) appendCell27_(dstSheet, revRow, aCol, montant);
    } else {
      var monthKeys2 = Object.keys(nbm).map(Number).sort(function(a,b){return a-b;});
      var nMonths = monthKeys2.length;
      var equalShare = Math.round(montant / nMonths * 100) / 100;
      monthKeys2.forEach(function(mm2) {
        var pcol = mm2 + 2;
        changes.push({ bloc:"revenus", row:revRow, col:pcol, delta:equalShare });
        if (!dryRun) appendCell27_(dstSheet, revRow, pcol, equalShare);
      });
    }
  }

  // Nuits ("jours occupes") : TOUJOURS reparties par mois reel.
  for (var m in nbm) {
    var col = parseInt(m, 10) + 2, nightsM = nbm[m];
    changes.push({ bloc:"nuits", row:NIGHTS_ROW_27[bienId], col:col, delta:nightsM });
    if (!dryRun) appendCell27_(dstSheet, NIGHTS_ROW_27[bienId], col, nightsM);
  }
  return changes;
}

//  Memoire des IDs deja traites
function getMemoSheet27_(ss) {
  var s = ss.getSheetByName(MEMO_SHEET_27);
  if (!s) { s = ss.insertSheet(MEMO_SHEET_27); s.getRange(1,1).setValue("id_traite"); s.hideSheet(); }
  return s;
}
function readProcessed27_(memo) {
  var set = {}, last = memo.getLastRow();
  if (last > 1) memo.getRange(2,1,last-1,1).getValues().forEach(function(r){ if(r[0]) set[String(r[0])] = true; });
  return set;
}
function appendProcessed27_(memo, ids) {
  if (!ids.length) return;
  memo.getRange(memo.getLastRow()+1, 1, ids.length, 1).setValues(ids.map(function(id){ return [id]; }));
}

// Clé de dédoublonnage par contenu (mirroir src/utils/resaDedup.js)
function contentKeyRow27_(row, C) {
  function nd_(v) {
    if (v == null) return "";
    // Composantes LOCALES (pas getUTC*) : même fix que REVENUS_AUTO_2026.gs
    // (miroir SCRIPT_SHEETS.normDate_) — voir son commentaire pour le détail.
    if (v instanceof Date && !isNaN(v)) {
      return v.getFullYear() + "-" + String(v.getMonth() + 1).padStart(2, "0") + "-" + String(v.getDate()).padStart(2, "0");
    }
    return String(v).slice(0, 10);
  }
  var bienId = BIEN_BY_LABEL_27[String(row[C.prop] || "").toLowerCase().trim()] || String(row[C.prop] || "").toLowerCase().trim();
  return bienId + "|" + nd_(row[C.arrivee]) + "|" + nd_(row[C.depart]);
}

// Scanne un onglet : applique les resas non encore traitees (ou les liste si dryRun)
function scanSheet27_(ss, name, C, dst, processed, newIds, dryRun, preview) {
  var sh = ss.getSheetByName(name); if (!sh) return;
  var last = sh.getLastRow(); if (last < 2) return;
  var rows = sh.getRange(2, 1, last - 1, C.ncols).getValues();
  rows.forEach(function(row) {
    var id = String(row[C.id] || "");
    var ck = contentKeyRow27_(row, C);
    if ((!id && !ck) || processed[id] || processed[ck]) return;
    var ch = applyOne27_(row, C, dst, dryRun);
    processed[id] = true;
    if (ck) processed[ck] = true;
    if (!dryRun) { if (id) newIds.push(id); if (ck) newIds.push(ck); }
    else if (ch.length) preview.push({ id:id, src:name, prop:row[C.prop], canal:row[C.canal], arrivee:String(row[C.arrivee]).slice(0,10), changements:ch });
  });
}

//  Fonction recurrente (cible du trigger 15 min)
function syncRevenus2027() {
  var ss = SpreadsheetApp.openById(SHEET_ID_27);
  var dst = ss.getSheetByName(DST_SHEET_27); if (!dst) return;
  var memo = getMemoSheet27_(ss), processed = readProcessed27_(memo);
  var newIds = [];
  scanSheet27_(ss, SRC_SHEET_27,  COL_TOUTES_27, dst, processed, newIds, false, null);
  scanSheet27_(ss, RESA_SHEET_27, COL_RESA_27,   dst, processed, newIds, false, null);
  appendProcessed27_(memo, newIds);
  return { applied: newIds.length };
}

//  Installation 1 fois : trigger SEULEMENT (PAS de baseline)
// ⚠️ INTENTIONNELLEMENT différent de setupRevenus2026 :
//    On ne base-line PAS les réservations existantes. Cela permet à syncRevenus2027()
//    de traiter au premier run les résas 2027 déjà présentes dans les onglets
//    (ex : Mabouya reçue via Airbnb avant que cet onglet soit créé).
function setupRevenus2027() {
  var ss = SpreadsheetApp.openById(SHEET_ID_27);
  var dst = ss.getSheetByName(DST_SHEET_27);
  if (!dst) {
    Logger.log("ERREUR : onglet '" + DST_SHEET_27 + "' introuvable. Créer l'onglet en dupliquant 'revenus locatif 2026' et en remettant les valeurs de mois à 0, puis relancer setupRevenus2027().");
    return { ok: false, error: "onglet cible manquant" };
  }

  // Supprimer un éventuel trigger restant, puis créer
  ScriptApp.getProjectTriggers().forEach(function(t){ if (t.getHandlerFunction() === "syncRevenus2027") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("syncRevenus2027").timeBased().everyMinutes(15).create();

  Logger.log("Setup 2027 OK — trigger 15 min installé. Aucun baseline : toutes les résas 2027 existantes seront traitées au premier syncRevenus2027().");
  return { ok: true, note: "trigger installe, pas de baseline — resas existantes seront traitees au prochain sync" };
}

//  Test DRY-RUN : log ce qui SERAIT applique, sans rien ecrire
function testRevenus2027_dryRun() {
  var ss = SpreadsheetApp.openById(SHEET_ID_27);
  var dst = ss.getSheetByName(DST_SHEET_27); if (!dst) { Logger.log("Onglet cible introuvable : " + DST_SHEET_27); return; }
  var memo = getMemoSheet27_(ss), processed = readProcessed27_(memo);
  var preview = [];
  scanSheet27_(ss, SRC_SHEET_27,  COL_TOUTES_27, dst, processed, [], true, preview);
  scanSheet27_(ss, RESA_SHEET_27, COL_RESA_27,   dst, processed, [], true, preview);
  Logger.log("A TRAITER (nouvelles, non comptees) : " + preview.length);
  Logger.log(JSON.stringify(preview, null, 2));
  return preview;
}

// ── Diagnostic d'état (memo, trigger, source) ───────────────────────────────
function revenus2027Status_() {
  var ss = SpreadsheetApp.openById(SHEET_ID_27);
  var memo = ss.getSheetByName(MEMO_SHEET_27);
  var memoCount = memo ? Math.max(0, memo.getLastRow() - 1) : 0;
  var trig = 0;
  try { trig = ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === "syncRevenus2027"; }).length; }
  catch (e) { trig = -1; }
  var src = ss.getSheetByName(SRC_SHEET_27);
  var srcCount = src ? Math.max(0, src.getLastRow() - 1) : 0;
  var resa = ss.getSheetByName(RESA_SHEET_27);
  var resaCount = resa ? Math.max(0, resa.getLastRow() - 1) : 0;
  return { ok: true, memoIds: memoCount, triggerInstalled: trig > 0, triggers: trig,
           toutesReservations: srcCount, reservationsDirectes: resaCount };
}

// ── Rattrapage : applique (ou prévisualise) les réservations dont l'ARRIVÉE est
//    en 2027 au mois >= fromMonth. ignoreMemo=true → traite même les IDs déjà
//    dans le journal (à n'utiliser que si AUCUNE écriture auto n'a encore eu lieu
//    sur ces mois, sinon double-comptage). apply=false → dry-run (n'écrit rien).
function revenus2027FromMonth_(fromMonth, apply, ignoreMemo) {
  fromMonth = parseInt(fromMonth, 10) || 1;
  var ss = SpreadsheetApp.openById(SHEET_ID_27);
  var dst = ss.getSheetByName(DST_SHEET_27);
  var memo = getMemoSheet27_(ss), processed = ignoreMemo ? {} : readProcessed27_(memo);
  var preview = [], appliedIds = [];
  var pairs = [[SRC_SHEET_27, COL_TOUTES_27], [RESA_SHEET_27, COL_RESA_27]];
  pairs.forEach(function (pair) {
    var sh = ss.getSheetByName(pair[0]); if (!sh || sh.getLastRow() < 2) return;
    var C = pair[1];
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, C.ncols).getValues();
    rows.forEach(function (row) {
      var id = String(row[C.id] || ""); if (!id) return;
      if (!ignoreMemo && processed[id]) return;
      var a = toNoonUTC27_(row[C.arrivee]);
      if (!a || a.getUTCFullYear() !== 2027 || (a.getUTCMonth() + 1) < fromMonth) return;
      var ch = applyOne27_(row, C, dst, !apply);
      if (ch.length) {
        preview.push({ id: id, src: pair[0], prop: row[C.prop], canal: row[C.canal],
                       arrivee: String(row[C.arrivee]).slice(0, 10), changements: ch });
        if (apply) appliedIds.push(id);
      }
      processed[id] = true;
    });
  });
  if (apply && appliedIds.length) appendProcessed27_(memo, appliedIds);
  return { ok: true, fromMonth: fromMonth, mode: apply ? "applied" : "dry",
           ignoreMemo: !!ignoreMemo, count: preview.length, preview: preview };
}

// ── Dernières réservations de "Toutes les Réservations" (inspection / test) ──
function revenus2027Recent_(n) {
  n = parseInt(n, 10) || 10;
  var ss = SpreadsheetApp.openById(SHEET_ID_27);
  var sh = ss.getSheetByName(SRC_SHEET_27); if (!sh || sh.getLastRow() < 2) return { ok: true, rows: [] };
  var memo = getMemoSheet27_(ss), processed = readProcessed27_(memo);
  var last = sh.getLastRow(), C = COL_TOUTES_27;
  var ncols = Math.max(C.ncols, 13);
  var rows = sh.getRange(2, 1, Math.min(n, last - 1), ncols).getValues();
  var fmt = function (v) {
    if (v instanceof Date) return v.getUTCFullYear() + "-" + ("0" + (v.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + v.getUTCDate()).slice(-2);
    return String(v || "").slice(0, 10);
  };
  var out = rows.map(function (r) {
    var id = String(r[C.id] || "");
    return { id: id, prop: r[C.prop], voyageur: r[C.voy], canal: r[C.canal],
             arrivee: fmt(r[C.arrivee]), depart: fmt(r[C.depart]),
             montant: r[C.montant], statut: r[C.statut], modifie: fmt(r[12]),
             dejaTraite: !!processed[id] };
  });
  return { ok: true, lus: out.length, rows: out };
}

// ── "Oublier" un ou plusieurs IDs du journal (pour rejouer une résa en test) ──
function revenus2027Forget_(idsCsv) {
  var ids = String(idsCsv || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  if (!ids.length) return { ok: false, error: "aucun id" };
  var ss = SpreadsheetApp.openById(SHEET_ID_27);
  var memo = getMemoSheet27_(ss);
  var last = memo.getLastRow();
  var removed = 0;
  if (last > 1) {
    var vals = memo.getRange(2, 1, last - 1, 1).getValues();
    var keep = [];
    vals.forEach(function (r) { var id = String(r[0] || ""); if (id && ids.indexOf(id) < 0) keep.push([id]); else if (id) removed++; });
    memo.getRange(2, 1, last - 1, 1).clearContent();
    if (keep.length) memo.getRange(2, 1, keep.length, 1).setValues(keep);
  }
  return { ok: true, removed: removed, ids: ids };
}

// ── ANNULER l'application d'une/des résa(s) : resoustrait exactement les deltas ──
// (les ids restent dans le journal → ne seront pas ré-appliqués ensuite).
function revenus2027Undo_(idsCsv) {
  var ids = String(idsCsv || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  if (!ids.length) return { ok: false, error: "aucun id" };
  var ss = SpreadsheetApp.openById(SHEET_ID_27);
  var dst = ss.getSheetByName(DST_SHEET_27);
  var done = [];
  [[SRC_SHEET_27, COL_TOUTES_27], [RESA_SHEET_27, COL_RESA_27]].forEach(function (pair) {
    var sh = ss.getSheetByName(pair[0]); if (!sh || sh.getLastRow() < 2) return;
    var C = pair[1];
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, C.ncols).getValues();
    rows.forEach(function (row) {
      var id = String(row[C.id] || ""); if (ids.indexOf(id) < 0) return;
      var ch = applyOne27_(row, C, dst, true); // dry → récupère les deltas
      ch.forEach(function (c) { appendCell27_(dst, c.row, c.col, -c.delta); });
      done.push({ id: id, reversed: ch });
    });
  });
  return { ok: true, undone: done };
}

// ── Inspection read-only 2027 (structure formule vs valeur) ──
function revenusInspect2027_() {
  var ss = SpreadsheetApp.openById(SHEET_ID_27);
  var dst = ss.getSheetByName(DST_SHEET_27); if (!dst) return { ok:false, error:"dst 2027 introuvable" };
  var probe = [2,3,4,5,6, 36,37,38, 68, 69,70,72];
  var out = [];
  probe.forEach(function(r){
    var vals = dst.getRange(r,1,1,14).getValues()[0];
    var fmls = dst.getRange(r,1,1,14).getFormulas()[0];
    out.push({ row:r, label:String(vals[0]).slice(0,28),
      jan: fmls[2] ? fmls[2] : vals[2],
      fev: fmls[3] ? fmls[3] : vals[3],
      isFormula: !!(fmls[2] || fmls[3]) });
  });
  return { ok:true, dst:DST_SHEET_27, rows:out };
}

// ── Recompute SCOPÉ rétroactif 2027 (regle courante : montant 100% mois d'arrivee) ──
//   2027 est 100% futur -> toutes les resas sont encore en source -> fromMonth defaut 1
//   (recompute toute l'annee, sans risque de perte d'historique). Meme mecanique que 2026 :
//   zero des lignes data cols fromMonth..dec + re-application des arrivees 2027 >= fromMonth.
function rebuildRevenus2027_(apply, fromMonth) {
  fromMonth = parseInt(fromMonth, 10); if (!fromMonth || fromMonth < 1 || fromMonth > 12) fromMonth = 1;
  var ss = SpreadsheetApp.openById(SHEET_ID_27);
  var dst = ss.getSheetByName(DST_SHEET_27); if (!dst) return { ok:false, error:"dst 2027 introuvable" };
  var startCol = fromMonth + 2, nCols = 14 - startCol + 1;
  var dataRows = [];
  for (var b in REV_ROWS_27)    { if (b === "iguana") continue; dataRows.push(REV_ROWS_27[b].airbnb, REV_ROWS_27[b].booking, REV_ROWS_27[b].direct); }
  for (var b2 in CNT_ROWS_27)   { if (b2 === "iguana") continue; dataRows.push(CNT_ROWS_27[b2].airbnb, CNT_ROWS_27[b2].booking, CNT_ROWS_27[b2].direct); }
  for (var b3 in NIGHTS_ROW_27) { if (b3 === "iguana") continue; dataRows.push(NIGHTS_ROW_27[b3]); }
  if (!apply) {
    return { ok:true, mode:"dry", fromMonth:fromMonth, startCol:startCol, nCols:nCols,
             rowsToRecompute:dataRows.length, note:"mois < " + fromMonth + " preserves" };
  }
  var before = dst.getRange(6, startCol, 1, nCols).getValues()[0];
  var zeros = []; for (var z=0; z<nCols; z++) zeros.push(0);
  dataRows.forEach(function(r){ dst.getRange(r, startCol, 1, nCols).setValues([zeros.slice()]); });
  var seen = {}, applied = 0;
  [[SRC_SHEET_27, COL_TOUTES_27], [RESA_SHEET_27, COL_RESA_27]].forEach(function(pair){
    var sh = ss.getSheetByName(pair[0]); if (!sh || sh.getLastRow() < 2) return;
    var C = pair[1];
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, C.ncols).getValues();
    rows.forEach(function(row){
      var a = toNoonUTC27_(row[C.arrivee]);
      if (!a || a.getUTCFullYear() !== 2027 || (a.getUTCMonth() + 1) < fromMonth) return;
      var id = String(row[C.id] || ""), ck = contentKeyRow27_(row, C);
      if ((id && seen[id]) || (ck && seen[ck])) return;
      var ch = applyOne27_(row, C, dst, false);
      if (id) seen[id] = true; if (ck) seen[ck] = true;
      if (ch.length) applied++;
    });
  });
  SpreadsheetApp.flush();
  var after = dst.getRange(6, startCol, 1, nCols).getValues()[0];
  return { ok:true, mode:"applied", fromMonth:fromMonth, rowsZeroed:dataRows.length,
           appliedBookings:applied, nogentTotalBefore:before, nogentTotalAfter:after };
}
