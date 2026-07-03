// ============================================================================
// REVENUS AUTO 2026  Projet Apps Script AUTONOME (separe du script principal)
// ----------------------------------------------------------------------------
// Remplit automatiquement "revenus locatif 2026" a partir de DEUX sources :
//   - "Toutes les R\u00e9servations" (iCal Airbnb/Booking, pousse par le worker horaire)
//   - "r\u00e9servations"            (saisies directes du Planning  instantane au "Ajouter")
// Dedoublonnage par ID (memoire)  chaque resa comptee 1 seule fois, meme si
// elle apparait dans les deux onglets.
//
//   - Revenus  : TOUS canaux. Direct = net ; Airbnb/Booking = montant BRUT OTA
//                (commission incluse) assume par Vincent (peut etre ajuste a la main).
//   - Nb reservations + Nb nuits ("jours occupes") : TOUS canaux (hors blocages).
//   - Resa a cheval sur 2 mois : nuits reparties par mois reel, MONTANT 100% sur le
//     mois d'ARRIVEE (pas de prorata) + resa comptee sur le mois d'arrivee.
//
// INSTALLATION (1 fois, dans l'ordre) :
//   1) testRevenus2026_dryRun()   log, n'ecrit RIEN
//   2) setupRevenus2026()         baseline (marque l'existant des 2 onglets) + trigger 15 min
// Ensuite syncRevenus2026() tourne seul via le trigger.
// ============================================================================

var SHEET_ID  = "1xuhU0KraEMxF9NAWO5MKEt23JI_V8mnNnWktzHy6q2U";
var SRC_SHEET = "Toutes les R\u00e9servations";  // accent en \u  paste-safe
var RESA_SHEET = "r\u00e9servations";            // saisies directes du Planning
var DST_SHEET = "revenus locatif 2026";
var MEMO_SHEET = "rev2026_traites";          // memoire des IDs deja appliques (onglet cache)

// Mois à partir duquel le sync AUTO est autorisé (jan-mai = saisi manuellement par Vincent).
// syncRevenus2026() ne touchera JAMAIS une résa avec arrivée < MIN_AUTO_MONTH.
// Seules revenus2026FromMonth_ et rebuildRevenus2026_ peuvent opérer sur les mois antérieurs.
var MIN_AUTO_MONTH = 6;

// Biens EXCLUS de toute automatisation revenus (saisie 100% manuelle par Vincent).
// iguana = bail long Joël Bailleul (bookable:false) → ses lignes ne sont NI appliquées
// depuis les résas, NI zérotées par le rebuild. Régression vécue 2026-06-26 (rebuild
// a effacé 1800€ iguana). Ajouter ici tout bien à revenu manuel.
var EXCLUDED_BIENS = { iguana: true };

// Mapping colonnes par onglet (index 0-based) ; statut:-1 = colonne absente
// "Toutes les R\u00e9servations" : A=ID B=Propriete C=Voyageur D=Canal E=Arrivee F=Depart G=Nuits H=Montant I=Statut K=Notes
var COL_TOUTES = { id:0, prop:1, voy:2, canal:3, arrivee:4, depart:5, montant:7, statut:8, notes:10, ncols:11 };
// "r\u00e9servations" : A=id B=bienId C=voyageur D=canal E=checkin F=checkout G=montant H=notes
var COL_RESA   = { id:0, prop:1, voy:2, canal:3, arrivee:4, depart:5, montant:6, statut:-1, notes:7, ncols:8 };

// Libelle/identifiant bien  id interne (tolere labels ET ids bruts)
var BIEN_BY_LABEL = {
  "t2 nogent":"nogent", "nogent":"nogent",
  "villa amaryllis":"amaryllis", "amaryllis":"amaryllis",
  "villa iguana":"iguana", "iguana":"iguana",
  "geko":"geko", "geko amaryllis":"geko",
  "zandoli":"zandoli", "zandoli amaryllis":"zandoli",
  "mabouya":"mabouya", "mabouya amaryllis":"mabouya",
  "t2 schoelcher":"schoelcher", "t2 scheolcher":"schoelcher", "schoelcher":"schoelcher",
};

// Lignes "revenus locatif 2026"  colonne = mois + 2 (janv=C=3 ... mai=G=7 ... dec=N=14)
var REV_ROWS = {
  nogent:{airbnb:2,booking:3,direct:4}, amaryllis:{airbnb:7,booking:8,direct:9},
  iguana:{airbnb:11,booking:12,direct:13}, geko:{airbnb:15,booking:16,direct:17},
  zandoli:{airbnb:19,booking:20,direct:21}, mabouya:{airbnb:23,booking:24,direct:25},
  schoelcher:{airbnb:28,booking:29,direct:30},
};
var CNT_ROWS = {
  nogent:{airbnb:36,booking:37,direct:38}, amaryllis:{airbnb:40,booking:41,direct:42},
  iguana:{airbnb:44,booking:45,direct:46}, geko:{airbnb:48,booking:49,direct:50},
  zandoli:{airbnb:52,booking:53,direct:54}, mabouya:{airbnb:56,booking:57,direct:58},
  schoelcher:{airbnb:60,booking:61,direct:62},
};
var NIGHTS_ROW = { nogent:68, amaryllis:75, iguana:81, geko:87, zandoli:93, mabouya:99, schoelcher:105 };

//  Helpers 
function canalKey_(canal) {
  var c = String(canal || "").toLowerCase();
  if (c.indexOf("airbnb") >= 0 || c.indexOf("air bnb") >= 0) return "airbnb";
  if (c.indexOf("direct") >= 0) return "direct";
  return "booking";
}
function toNoonUTC_(v) {
  if (v instanceof Date) return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate(), 12));
  var s = String(v || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
  return new Date(s + "T12:00:00Z");
}
function nightsByMonth2026_(ci, co) {
  var res = {}, d = toNoonUTC_(ci), end = toNoonUTC_(co), g = 0;
  if (!d || !end) return res;
  while (d < end && g++ < 400) {
    if (d.getUTCFullYear() === 2026) { var m = d.getUTCMonth() + 1; res[m] = (res[m] || 0) + 1; }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return res;
}
function appendCell_(sheet, row, col, delta) {
  if (!delta) return;
  var cell = sheet.getRange(row, col), f = cell.getFormula();
  if (f && f.charAt(0) === "=") {
    // Feuille en locale FR : la formule utilise la VIRGULE décimale.
    // delta JS ("636.81") doit être converti en "636,81" sinon #ERROR d'analyse.
    var d = String(Math.round(Math.abs(delta) * 100) / 100).replace(".", ",");
    cell.setFormula(f + (delta < 0 ? "-" : "+") + d);
  } else {
    var v = cell.getValue();
    var base = (typeof v === "number" && !isNaN(v)) ? v : 0;
    cell.setValue(Math.round((base + delta) * 100) / 100);
  }
}
function isBlocage_(voy, statut, notes) {
  voy = String(voy || "").toLowerCase(); statut = String(statut || "").toLowerCase(); notes = String(notes || "").toLowerCase();
  if (statut === "confirmé" || statut === "confirmed") return false;
  // "Annulé"/"annule"/"cancelled" : statut déjà utilisé par les imports CSV Airbnb/Booking
  // (voir importFromAirbnbSheet_/importFromBookingSheet_) mais jamais exclu du calcul des
  // revenus jusqu'ici — une résa annulée comptait quand même dans revenus locatifs 2026.
  return statut.indexOf("bloqu") >= 0 || statut.indexOf("closed") >= 0 ||
         statut.indexOf("annul") >= 0 || statut.indexOf("cancel") >= 0 ||
         voy.indexOf("not available") >= 0 || voy.indexOf("indisponible") >= 0 ||
         notes.indexOf("closed") >= 0 || notes.indexOf("not available") >= 0;
}

// Applique UNE reservation (ligne brute + mapping colonnes C). dryRun  retourne juste les changements.
function applyOne_(row, C, dstSheet, dryRun) {
  var changes = [];
  var bienId = BIEN_BY_LABEL[String(row[C.prop] || "").toLowerCase().trim()];
  if (!bienId || !REV_ROWS[bienId]) return changes;
  // Iguana = bail long (Joël Bailleul), revenus saisis À LA MAIN par Vincent →
  // JAMAIS touché par l'automatisation (ni appliqué, ni zéroté au rebuild).
  if (EXCLUDED_BIENS[bienId]) return changes;
  var statut = (C.statut >= 0) ? row[C.statut] : "";
  var notes  = (C.notes  >= 0) ? row[C.notes]  : "";
  if (isBlocage_(row[C.voy], statut, notes)) return changes;
  // Résa non chiffrée (OTA iCal pas encore renseignée : montant 0) → on n'applique
  // RIEN (ni compteur, ni nuits, ni revenu). Couplé à scanSheet_ qui ne la mémoïse
  // pas, elle sera appliquée EN UNE FOIS dès que Vincent saisit le montant — sinon
  // le revenu Booking n'est jamais ajouté (résa figée "traitée" à 0€).
  if ((parseFloat(row[C.montant]) || 0) <= 0) return changes;
  var nbm = nightsByMonth2026_(row[C.arrivee], row[C.depart]);
  var totalN = 0; for (var k in nbm) totalN += nbm[k];
  if (totalN === 0) return changes;

  var ck = canalKey_(row[C.canal]);
  var montant = parseFloat(row[C.montant]) || 0;
  var aDate = toNoonUTC_(row[C.arrivee]);
  var arrivalMonth = (aDate && aDate.getUTCFullYear() === 2026) ? aDate.getUTCMonth() + 1 : null;
  if (!arrivalMonth) { for (var mm in nbm) { arrivalMonth = parseInt(mm, 10); break; } }

  // Comptage : 1 resa sur le mois d'ARRIVEE (jamais reparti).
  if (arrivalMonth) {
    var cRow = CNT_ROWS[bienId][ck], cCol = arrivalMonth + 2;
    changes.push({ bloc:"resa", row:cRow, col:cCol, delta:1 });
    if (!dryRun) appendCell_(dstSheet, cRow, cCol, 1);
  }

  // Montant : 100% sur le mois d'ARRIVEE. Division égale par mois pour les longs séjours (>30 nuits).
  //   Court séjour (≤30 nuits) : mois d'arrivée reçoit le montant entier.
  //   Long séjour (>30 nuits, ex. bail mensuel) : montant / nb_mois_touchés → part égale par mois.
  //   Cas limite : arrivée hors 2026 → même division égale (part des mois 2026 uniquement).
  if (montant > 0) {
    var revRow = REV_ROWS[bienId][ck];
    var longStay = totalN > 30;
    if (aDate && aDate.getUTCFullYear() === 2026 && !longStay) {
      // Court séjour : 100% sur le mois d'arrivée
      var aCol = arrivalMonth + 2;
      changes.push({ bloc:"revenus", row:revRow, col:aCol, delta:montant });
      if (!dryRun) appendCell_(dstSheet, revRow, aCol, montant);
    } else {
      // Long séjour : division ÉGALE par nombre de mois touchés (ex. 3900€ / 3 mois = 1300€/mois)
      var monthKeys2 = Object.keys(nbm).map(Number).sort(function(a,b){return a-b;});
      var nMonths = monthKeys2.length;
      var equalShare = Math.round(montant / nMonths * 100) / 100;
      monthKeys2.forEach(function(mm2) {
        var pcol = mm2 + 2;
        changes.push({ bloc:"revenus", row:revRow, col:pcol, delta:equalShare });
        if (!dryRun) appendCell_(dstSheet, revRow, pcol, equalShare);
      });
    }
  }

  // Nuits ("jours occupes") : TOUJOURS reparties par mois reel (occupation/ADR).
  for (var m in nbm) {
    var col = parseInt(m, 10) + 2, nightsM = nbm[m];
    changes.push({ bloc:"nuits", row:NIGHTS_ROW[bienId], col:col, delta:nightsM });
    if (!dryRun) appendCell_(dstSheet, NIGHTS_ROW[bienId], col, nightsM);
  }
  return changes;
}

//  Memoire des IDs deja traites 
function getMemoSheet_(ss) {
  var s = ss.getSheetByName(MEMO_SHEET);
  if (!s) { s = ss.insertSheet(MEMO_SHEET); s.getRange(1,1).setValue("id_traite"); s.hideSheet(); }
  return s;
}
function readProcessed_(memo) {
  var set = {}, last = memo.getLastRow();
  if (last > 1) memo.getRange(2,1,last-1,1).getValues().forEach(function(r){ if(r[0]) set[String(r[0])] = true; });
  return set;
}
function appendProcessed_(memo, ids) {
  if (!ids.length) return;
  memo.getRange(memo.getLastRow()+1, 1, ids.length, 1).setValues(ids.map(function(id){ return [id]; }));
}

// Clé de dédoublonnage par contenu (mirroir src/utils/resaDedup.js) — auto-suffisant (nd_ inline
// pour ne pas dépendre d'un normDate_ partagé entre fichiers du projet GAS).
function contentKeyRow_(row, C) {
  function nd_(v) {
    if (v == null) return "";
    if (v instanceof Date && !isNaN(v)) {
      return v.getUTCFullYear() + "-" + String(v.getUTCMonth() + 1).padStart(2, "0") + "-" + String(v.getUTCDate()).padStart(2, "0");
    }
    return String(v).slice(0, 10);
  }
  var bienId = BIEN_BY_LABEL[String(row[C.prop] || "").toLowerCase().trim()] || String(row[C.prop] || "").toLowerCase().trim();
  return bienId + "|" + nd_(row[C.arrivee]) + "|" + nd_(row[C.depart]);
}

// Scanne un onglet : applique les resas non encore traitees (ou les liste si dryRun)
function scanSheet_(ss, name, C, dst, processed, newIds, dryRun, preview, minMonth) {
  var sh = ss.getSheetByName(name); if (!sh) return;
  var last = sh.getLastRow(); if (last < 2) return;
  var rows = sh.getRange(2, 1, last - 1, C.ncols).getValues();
  rows.forEach(function(row) {
    // Borne inférieure de mois : jamais toucher les mois gérés manuellement
    if (minMonth) {
      var a = toNoonUTC_(row[C.arrivee]);
      if (!a || a.getUTCFullYear() !== 2026 || (a.getUTCMonth() + 1) < minMonth) return;
    }
    var id = String(row[C.id] || "");
    var ck = contentKeyRow_(row, C);
    if ((!id && !ck) || processed[id] || processed[ck]) return; // dedup par id OU clé-contenu
    var ch = applyOne_(row, C, dst, dryRun);
    // Ne PAS mémoïser une résa non-blocage encore à 0€ (OTA iCal pas renseignée) :
    // elle doit être re-scannée quand Vincent saisit le montant, sinon le revenu
    // n'est jamais ajouté. Miroir du guard de applyOne_.
    var statut_ = (C.statut >= 0) ? row[C.statut] : "";
    var notes_  = (C.notes  >= 0) ? row[C.notes]  : "";
    var skipMemo = ((parseFloat(row[C.montant]) || 0) <= 0) && !isBlocage_(row[C.voy], statut_, notes_);
    if (!skipMemo) {
      processed[id] = true;
      if (ck) processed[ck] = true;   // idempotence par contenu (même séjour, id différent)
      if (!dryRun) { if (id) newIds.push(id); if (ck) newIds.push(ck); }
    }
    if (dryRun && ch.length) preview.push({ id:id, src:name, prop:row[C.prop], canal:row[C.canal], arrivee:String(row[C.arrivee]).slice(0,10), changements:ch });
  });
}

//  Fonction recurrente (cible du trigger 15 min)
function syncRevenus2026() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var dst = ss.getSheetByName(DST_SHEET); if (!dst) return;
  var memo = getMemoSheet_(ss), processed = readProcessed_(memo);
  var newIds = [];
  // MIN_AUTO_MONTH = 6 : jan-mai gérés manuellement par Vincent → jamais touchés ici
  scanSheet_(ss, SRC_SHEET,  COL_TOUTES, dst, processed, newIds, false, null, MIN_AUTO_MONTH);
  scanSheet_(ss, RESA_SHEET, COL_RESA,   dst, processed, newIds, false, null, MIN_AUTO_MONTH);
  appendProcessed_(memo, newIds);
  return { applied: newIds.length };
}

//  Installation 1 fois : baseline (marque l'existant des 2 onglets, SANS appliquer) + trigger 
function baselineSheet_(ss, name, C, processed, baseline) {
  var sh = ss.getSheetByName(name); if (!sh || sh.getLastRow() < 2) return;
  sh.getRange(2, 1, sh.getLastRow() - 1, C.ncols).getValues().forEach(function(r) {
    var id = String(r[C.id] || "");
    var ck = contentKeyRow_(r, C);
    if (id && !processed[id]) { processed[id] = true; baseline.push(id); }
    if (ck && !processed[ck]) { processed[ck] = true; baseline.push(ck); }
  });
}
function setupRevenus2026() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var memo = getMemoSheet_(ss), processed = readProcessed_(memo);
  var baseline = [];
  baselineSheet_(ss, SRC_SHEET,  COL_TOUTES, processed, baseline);
  baselineSheet_(ss, RESA_SHEET, COL_RESA,   processed, baseline);
  appendProcessed_(memo, baseline);

  ScriptApp.getProjectTriggers().forEach(function(t){ if (t.getHandlerFunction() === "syncRevenus2026") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("syncRevenus2026").timeBased().everyMinutes(15).create();

  Logger.log("Setup OK  " + baseline.length + " reservations marquees (baseline, 2 onglets). Trigger 15 min installe.");
  return { baseline: baseline.length };
}

//  Test DRY-RUN : log ce qui SERAIT applique, sans rien ecrire 
function testRevenus2026_dryRun() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var dst = ss.getSheetByName(DST_SHEET); if (!dst) { Logger.log("Onglet cible introuvable"); return; }
  var memo = getMemoSheet_(ss), processed = readProcessed_(memo);
  var preview = [];
  scanSheet_(ss, SRC_SHEET,  COL_TOUTES, dst, processed, [], true, preview);
  scanSheet_(ss, RESA_SHEET, COL_RESA,   dst, processed, [], true, preview);
  Logger.log("A TRAITER (nouvelles, non comptees) : " + preview.length);
  Logger.log(JSON.stringify(preview, null, 2));
  return preview;
}

// ── Diagnostic d'état (memo, trigger, source) ───────────────────────────────
function revenus2026Status_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var memo = ss.getSheetByName(MEMO_SHEET);
  var memoCount = memo ? Math.max(0, memo.getLastRow() - 1) : 0;
  var trig = 0;
  try { trig = ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === "syncRevenus2026"; }).length; }
  catch (e) { trig = -1; } // -1 = scope triggers indisponible dans ce contexte
  var src = ss.getSheetByName(SRC_SHEET);
  var srcCount = src ? Math.max(0, src.getLastRow() - 1) : 0;
  var resa = ss.getSheetByName(RESA_SHEET);
  var resaCount = resa ? Math.max(0, resa.getLastRow() - 1) : 0;
  return { ok: true, memoIds: memoCount, triggerInstalled: trig > 0, triggers: trig,
           toutesReservations: srcCount, reservationsDirectes: resaCount };
}

// ── Rattrapage : applique (ou prévisualise) les réservations dont l'ARRIVÉE est
//    en 2026 au mois >= fromMonth. ignoreMemo=true → traite même les IDs déjà
//    "baselinés" (à n'utiliser que si AUCUNE écriture auto n'a encore eu lieu sur
//    ces mois, sinon double-comptage). apply=false → dry-run (n'écrit rien).
function revenus2026FromMonth_(fromMonth, apply, ignoreMemo) {
  fromMonth = parseInt(fromMonth, 10) || 7;
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var dst = ss.getSheetByName(DST_SHEET);
  var memo = getMemoSheet_(ss), processed = ignoreMemo ? {} : readProcessed_(memo);
  var preview = [], appliedIds = [];
  var pairs = [[SRC_SHEET, COL_TOUTES], [RESA_SHEET, COL_RESA]];
  pairs.forEach(function (pair) {
    var sh = ss.getSheetByName(pair[0]); if (!sh || sh.getLastRow() < 2) return;
    var C = pair[1];
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, C.ncols).getValues();
    rows.forEach(function (row) {
      var id = String(row[C.id] || ""); if (!id) return;
      if (!ignoreMemo && processed[id]) return;
      var a = toNoonUTC_(row[C.arrivee]);
      if (!a || a.getUTCFullYear() !== 2026 || (a.getUTCMonth() + 1) < fromMonth) return;
      var ch = applyOne_(row, C, dst, !apply);
      if (ch.length) {
        preview.push({ id: id, src: pair[0], prop: row[C.prop], canal: row[C.canal],
                       arrivee: String(row[C.arrivee]).slice(0, 10), changements: ch });
        if (apply) appliedIds.push(id);
      }
      processed[id] = true; // évite de traiter 2x le même id entre les 2 onglets
    });
  });
  if (apply && appliedIds.length) appendProcessed_(memo, appliedIds);
  return { ok: true, fromMonth: fromMonth, mode: apply ? "applied" : "dry",
           ignoreMemo: !!ignoreMemo, count: preview.length, preview: preview };
}

// ── Dernières réservations de "Toutes les Réservations" (inspection / test) ──
function revenus2026Recent_(n) {
  n = parseInt(n, 10) || 10;
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SRC_SHEET); if (!sh || sh.getLastRow() < 2) return { ok: true, rows: [] };
  var memo = getMemoSheet_(ss), processed = readProcessed_(memo);
  var last = sh.getLastRow(), C = COL_TOUTES;
  // Le haut de l'onglet = arrivées les plus récentes (tri arrivée décroissante) →
  // c'est là que se trouve une nouvelle résa pour un séjour à venir.
  var ncols = Math.max(C.ncols, 13); // inclure "Modifié le" (col M = index 12)
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
function revenus2026Forget_(idsCsv) {
  var ids = String(idsCsv || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  if (!ids.length) return { ok: false, error: "aucun id" };
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var memo = getMemoSheet_(ss);
  var last = memo.getLastRow();
  var removed = 0;
  if (last > 1) {
    var vals = memo.getRange(2, 1, last - 1, 1).getValues();
    // reconstruire sans les ids ciblés
    var keep = [];
    vals.forEach(function (r) { var id = String(r[0] || ""); if (id && ids.indexOf(id) < 0) keep.push([id]); else if (id) removed++; });
    memo.getRange(2, 1, last - 1, 1).clearContent();
    if (keep.length) memo.getRange(2, 1, keep.length, 1).setValues(keep);
  }
  return { ok: true, removed: removed, ids: ids };
}

// ── ANNULER l'application d'une/des résa(s) : resoustrait exactement les deltas ──
// (les ids restent dans le journal → ne seront pas ré-appliqués ensuite).
function revenus2026Undo_(idsCsv) {
  var ids = String(idsCsv || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  if (!ids.length) return { ok: false, error: "aucun id" };
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var dst = ss.getSheetByName(DST_SHEET);
  var done = [];
  [[SRC_SHEET, COL_TOUTES], [RESA_SHEET, COL_RESA]].forEach(function (pair) {
    var sh = ss.getSheetByName(pair[0]); if (!sh || sh.getLastRow() < 2) return;
    var C = pair[1];
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, C.ncols).getValues();
    rows.forEach(function (row) {
      var id = String(row[C.id] || ""); if (ids.indexOf(id) < 0) return;
      var ch = applyOne_(row, C, dst, true); // dry → récupère les deltas
      ch.forEach(function (c) { appendCell_(dst, c.row, c.col, -c.delta); });
      done.push({ id: id, reversed: ch });
    });
  });
  return { ok: true, undone: done };
}

// ── Inspection read-only : structure des lignes (formule vs valeur) avant rebuild ──
//   probe = lignes data (canaux/counts/nuits) + lignes dérivées (total/occ/adr) pour
//   Nogent. Sert à confirmer que les lignes data sont des VALEURS et les dérivées des
//   FORMULES (qui se recalculent seules) avant tout zéro.
function revenusInspect2026_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var dst = ss.getSheetByName(DST_SHEET); if (!dst) return { ok:false, error:"dst introuvable" };
  var probe = [2,3,4,5,6, 36,37,38, 68, 69,70,72]; // nogent: canaux,total(6),counts,nuits(68),occ/adr/revpar
  var out = [];
  probe.forEach(function(r){
    var vals = dst.getRange(r,1,1,14).getValues()[0];
    var fmls = dst.getRange(r,1,1,14).getFormulas()[0];
    out.push({ row:r, label:String(vals[0]).slice(0,28),
      mai: fmls[6] ? fmls[6] : vals[6],
      jui: fmls[7] ? fmls[7] : vals[7],
      isFormula: !!(fmls[6] || fmls[7]) });
  });
  return { ok:true, dst:DST_SHEET, rows:out };
}

// ── Recompute SCOPÉ rétroactif (regle courante : montant 100% mois d'arrivee) ──
//   /!\ PAS de rebuild complet : "Toutes les Reservations" ne remonte qu'a avril 2026
//   (jan-mars ont peri de la source) -> on ne recompute QUE les mois >= fromMonth,
//   en PRESERVANT les mois anterieurs (formules accumulees intactes).
//   Pour chaque mois cible : zero des lignes data (revenus+counts+nuits) cols fromMonth..dec,
//   puis re-application des resas 2026 dont l'ARRIVEE est au mois >= fromMonth (regle 100%).
//   Les lignes TOTAL/OCC/ADR (formules =SUM/ratio) se recalculent seules.
//   apply=false -> dry-run. fromMonth defaut = MOIS COURANT (auto, jamais figé) —
//   protège toujours les mois déjà clos sans maintenance manuelle mensuelle.
// bienFilter optionnel : si fourni (ex. "schoelcher"), ne recompute QUE ce bien.
// Permet un rebuild chirurgical sans toucher les autres lignes du Sheet.
function currentMonthDefault_() {
  return new Date().getMonth() + 1;
}
function rebuildRevenus2026_(apply, fromMonth, bienFilter) {
  fromMonth = parseInt(fromMonth, 10); if (!fromMonth || fromMonth < 1 || fromMonth > 12) fromMonth = currentMonthDefault_();
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var dst = ss.getSheetByName(DST_SHEET); if (!dst) return { ok:false, error:"dst introuvable" };
  var startCol = fromMonth + 2;
  var nCols = 14 - startCol + 1;
  var dataRows = [];
  for (var b in REV_ROWS)    { if (EXCLUDED_BIENS[b]) continue; if (bienFilter && b !== bienFilter) continue; dataRows.push(REV_ROWS[b].airbnb, REV_ROWS[b].booking, REV_ROWS[b].direct); }
  for (var b2 in CNT_ROWS)   { if (EXCLUDED_BIENS[b2]) continue; if (bienFilter && b2 !== bienFilter) continue; dataRows.push(CNT_ROWS[b2].airbnb, CNT_ROWS[b2].booking, CNT_ROWS[b2].direct); }
  for (var b3 in NIGHTS_ROW) { if (EXCLUDED_BIENS[b3]) continue; if (bienFilter && b3 !== bienFilter) continue; dataRows.push(NIGHTS_ROW[b3]); }
  if (!apply) {
    return { ok:true, mode:"dry", fromMonth:fromMonth, bienFilter:bienFilter||"all", startCol:startCol, nCols:nCols,
             rowsToRecompute:dataRows.length, note:"mois < " + fromMonth + " preserves" };
  }
  var before = dst.getRange(6, startCol, 1, nCols).getValues()[0];
  var zeros = []; for (var z=0; z<nCols; z++) zeros.push(0);
  dataRows.forEach(function(r){ dst.getRange(r, startCol, 1, nCols).setValues([zeros.slice()]); });
  var seen = {}, applied = 0;
  [[SRC_SHEET, COL_TOUTES], [RESA_SHEET, COL_RESA]].forEach(function(pair){
    var sh = ss.getSheetByName(pair[0]); if (!sh || sh.getLastRow() < 2) return;
    var C = pair[1];
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, C.ncols).getValues();
    rows.forEach(function(row){
      var a = toNoonUTC_(row[C.arrivee]);
      if (!a || a.getUTCFullYear() !== 2026 || (a.getUTCMonth() + 1) < fromMonth) return;
      if (bienFilter && BIEN_BY_LABEL[String(row[C.prop] || "").toLowerCase().trim()] !== bienFilter) return;
      var id = String(row[C.id] || ""), ck = contentKeyRow_(row, C);
      if ((id && seen[id]) || (ck && seen[ck])) return;
      var ch = applyOne_(row, C, dst, false);
      if (id) seen[id] = true; if (ck) seen[ck] = true;
      if (ch.length) applied++;
    });
  });
  SpreadsheetApp.flush();
  var after = dst.getRange(6, startCol, 1, nCols).getValues()[0];
  return { ok:true, mode:"applied", fromMonth:fromMonth, bienFilter:bienFilter||"all",
           rowsZeroed:dataRows.length, appliedBookings:applied,
           nogentTotalBefore:before, nogentTotalAfter:after };
}

// ── PATCH MANUEL d'une cellule revenus ──────────────────────────────────────
// Usage : {bien:"schoelcher", canal:"direct", month:6, value:1300, mode:"set"|"add"}
// mode "set" = écrase ; mode "add" = ajoute (appendCell_). Défaut : "set".
function revenus2026ManualPatch_(params) {
  var bien  = String(params.bien  || "").toLowerCase();
  var canal = String(params.canal || "direct").toLowerCase();
  var month = parseInt(params.month, 10);
  var value = parseFloat(params.value);
  var mode  = String(params.mode  || "set");
  if (!REV_ROWS[bien])       return { ok:false, error:"bien inconnu: " + bien };
  if (!REV_ROWS[bien][canal]) return { ok:false, error:"canal inconnu: " + canal };
  if (!month || month < 1 || month > 12) return { ok:false, error:"month invalide: " + month };
  if (isNaN(value)) return { ok:false, error:"value invalide" };
  var ss  = SpreadsheetApp.openById(SHEET_ID);
  var dst = ss.getSheetByName(DST_SHEET); if (!dst) return { ok:false, error:"dst introuvable" };
  var row = REV_ROWS[bien][canal];
  var col = month + 2;
  var before = dst.getRange(row, col).getValue();
  if (mode === "add") { appendCell_(dst, row, col, value); }
  else                { dst.getRange(row, col).setValue(value); }
  SpreadsheetApp.flush();
  var after = dst.getRange(row, col).getValue();
  return { ok:true, bien:bien, canal:canal, month:month, mode:mode, row:row, col:col, before:before, after:after };
}

// ── PURGE du memo des résas non chiffrées (montant 0) ───────────────────────
// Les résas OTA captées par l'iCal arrivent à 0€ ; avant le fix elles étaient
// mémoïsées "traitées" → leur montant saisi ensuite n'était jamais appliqué.
// Cette purge les retire du memo (id + clé-contenu) pour qu'elles soient
// ré-appliquées EN UNE FOIS dès que le montant est renseigné. Idempotent.
function revenus2026PurgeZero_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var toForget = [];
  [[SRC_SHEET, COL_TOUTES], [RESA_SHEET, COL_RESA]].forEach(function (pair) {
    var sh = ss.getSheetByName(pair[0]); if (!sh || sh.getLastRow() < 2) return;
    var C = pair[1];
    var rows = sh.getRange(2, 1, sh.getLastRow() - 1, C.ncols).getValues();
    rows.forEach(function (row) {
      var montant = parseFloat(row[C.montant]) || 0;
      var statut  = (C.statut >= 0) ? row[C.statut] : "";
      var notes   = (C.notes  >= 0) ? row[C.notes]  : "";
      if (montant <= 0 && !isBlocage_(row[C.voy], statut, notes)) {
        var id = String(row[C.id] || ""); var ck = contentKeyRow_(row, C);
        if (id) toForget.push(id);
        if (ck) toForget.push(ck);
      }
    });
  });
  if (toForget.length) revenus2026Forget_(toForget.join(","));
  return { ok: true, purged: toForget.length };
}

// ── RESET MEMO + RE-BASELINE (à appeler après une restauration manuelle des cellules) ──
// 1) Vide le memo (rev2026_traites) pour repartir de zéro
// 2) Marque TOUTES les réservations actuelles comme "déjà traitées" dans le memo
// 3) Réinstalle le trigger 15 min
// → Après ça, syncRevenus2026() ne touchera QUE les NOUVELLES résas (et jamais jan-mai).
// Appelé via doGet ?action=cleanSlate2026 ou depuis l'éditeur GAS.
function cleanSlate2026_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var memo = getMemoSheet_(ss);
  var last = memo.getLastRow();
  if (last > 1) memo.getRange(2, 1, last - 1, 1).clearContent();
  return setupRevenus2026();
}
