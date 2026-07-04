// src/__tests__/mirror-drift.test.js
// ─────────────────────────────────────────────────────────────────────────────
// GARDE ANTI-DRIFT des miroirs GAS/Worker (pattern « logique pure testée +
// miroir » du CLAUDE.md). La logique de src/utils/*.js est dupliquée à la main
// dans Apps Script et le Worker (qui ne peuvent pas importer de modules Node) :
// modifier un util sans répercuter le miroir = bug silencieux en prod.
//
// APPROCHE : équivalence COMPORTEMENTALE, pas comparaison de texte.
// On extrait le code source de chaque fonction miroir (délimitation de fonction
// par comptage d'accolades, en ignorant strings/commentaires), on l'évalue via
// new Function, puis on exécute src ET miroir sur une même batterie d'entrées
// (nominaux + limites). Toute divergence de sortie fait échouer le test.
//
// CARTOGRAPHIE CONSTATÉE (2026-07-04) :
//
// | Module src/utils        | Miroir GAS                                   | Miroir Worker                        |
// |-------------------------|----------------------------------------------|--------------------------------------|
// | resaDedup.js            | SCRIPT_SHEETS.js normDate_/dedupKey_         | —                                    |
// |                         | REVENUS_AUTO_2026.gs contentKeyRow_ (nd_)    |                                      |
// |                         | REVENUS_AUTO_2027.gs contentKeyRow27_ (nd_)  |                                      |
// | occupancy.js            | —                                            | index.js addDays/diffDays +          |
// |                         |                                              | nightsBooked (runOccupancySnapshot)  |
// | coherenceRules.js       | — (PAS de miroir : coherence-check.js        | — (le Worker appelle la Function     |
// |                         |    IMPORTE directement le module src)        |    par HTTP, pas de copie)           |
// | rmOccupancyAdjust.js    | —                                            | — (rm-recommendations IMPORTE le src)|
// | pricing.js              | — (aucun miroir runtime trouvé ; PublicSite  | —                                    |
// |                         |    importe le module directement)            |                                      |
//
// NON TESTABLES AUTOMATIQUEMENT (et pourquoi) :
// - dedupeReservations() : GAS ne déduplique pas via une fonction-liste mais via
//   une map d'IDs traités persistée en feuille (readProcessed_/appendProcessed_,
//   dépend de SpreadsheetApp) → pas de cœur pur extractible sans mock fragile.
// - runOccupancySnapshot() (wrapper Worker) : effets de bord D1 (db.prepare).
//   On teste son cœur pur nightsBooked() + on vérifie structurellement que la
//   formule sold/rate n'a pas changé (voir test dédié). Note : le Worker clampe
//   nights_sold à l'horizon avant persistance (sold = Math.min(horizon, n)),
//   alors que src occupancyForWindow() renvoie nightsSold NON clampé — le taux
//   (rate) reste identique dans les deux cas (min(1, n/h) === min(h, n)/h).
// - contentKeyRow_/contentKeyRow27_ : la partie mapping label→bienId dépend des
//   constantes BIEN_BY_LABEL(_27) du projet GAS ; on la teste en injectant un
//   stub, ce qui couvre le format de clé et nd_ mais pas le contenu du mapping.
//
// ⚠️ Le SCRIPT_SHEETS.gs à la RACINE du repo est une copie obsolète (cf.
// CLAUDE.md) — volontairement ignoré ici.
// ─────────────────────────────────────────────────────────────────────────────
import { describe, it, expect } from "vitest";
import fs from "node:fs";

import { normDate, dedupKey } from "../utils/resaDedup.js";
import {
  diffDays as srcDiffDays,
  addDays as srcAddDays,
  nightsBookedInWindow,
  occupancyForWindow,
} from "../utils/occupancy.js";

// NB : même pattern que biens-consistency.test.js — relPath doit rester une
// VARIABLE (si on écrit new URL('literal', import.meta.url), Vite le réécrit
// statiquement en URL d'asset http → fs.readFileSync explose).
function readSource(relPath) {
  return fs.readFileSync(new URL(relPath, import.meta.url), "utf8");
}

const GAS_SHEETS = readSource("../../appscript/SCRIPT_SHEETS.js");
const GAS_REV26 = readSource("../../appscript/REVENUS_AUTO_2026.gs");
const GAS_REV27 = readSource("../../appscript/REVENUS_AUTO_2027.gs");
const WORKER = readSource("../../workers/ical-sync/index.js");

// ── Extraction d'une déclaration `function <name>(...) {...}` par comptage
//    d'accolades (ignore strings, template literals et commentaires). ─────────
function extractFunction(source, name) {
  const m = new RegExp(`function\\s+${name}\\s*\\(`).exec(source);
  if (!m) {
    throw new Error(
      `Fonction miroir "${name}" introuvable — elle a été renommée/supprimée. ` +
      `Mettre à jour la cartographie de mirror-drift.test.js.`
    );
  }
  let depth = 0;
  let state = null; // null | "'" | '"' | "`" | "//" | "/*"
  for (let j = source.indexOf("{", m.index); j < source.length; j++) {
    const c = source[j];
    const c2 = source.slice(j, j + 2);
    if (state === null) {
      if (c === "'" || c === '"' || c === "`") state = c;
      else if (c2 === "//") { state = "//"; j++; }
      else if (c2 === "/*") { state = "/*"; j++; }
      else if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) return source.slice(m.index, j + 1);
      }
    } else if (state === "'" || state === '"' || state === "`") {
      if (c === "\\") j++;
      else if (c === state) state = null;
    } else if (state === "//") {
      if (c === "\n") state = null;
    } else if (state === "/*") {
      if (c2 === "*/") { state = null; j++; }
    }
  }
  throw new Error(`Extraction de "${name}" : accolade fermante introuvable.`);
}

// Évalue du code miroir et retourne les fonctions demandées.
// `inject` : dépendances du miroir (closures GAS/Worker) fournies par le test.
function evalMirror(code, names, inject = {}) {
  const keys = Object.keys(inject);
  const factory = new Function(...keys, `${code}\nreturn { ${names.join(", ")} };`);
  return factory(...keys.map((k) => inject[k]));
}

// ── Batteries d'entrées partagées ────────────────────────────────────────────
const STRINGY_INPUTS = [
  "2026-07-04",
  "2026-07-04T14:30:00Z",
  "2026-07-04T00:00:00+02:00",
  "2026-12-31",
  "2026-7-4",            // non paddé → slice(0,10) le laisse tel quel
  "  2026-07-04",        // espaces de tête inclus dans les 10 premiers chars
  "n/a",
  "",
  null,
  undefined,
  0,                     // 0 n'est pas == null → String(0)
  20260704,
  NaN,
  true,
  new Date("invalid"),   // Date invalide → branche String(v).slice(0,10)
];
// Dates à MIDI UTC : la date calendaire locale == la date UTC pour tout fuseau
// d'offset dans ]-12h, +12h[ → comparaison robuste sur les runners du projet
// (Mac de Vincent = Europe/Paris, CI GitHub = UTC). Un runner exotique à
// offset ≥ +12h (NZ, Kiritimati) ferait diverger la branche Date LOCALE de
// SCRIPT_SHEETS.normDate_ — hors périmètre, cf. drift volontaire ci-dessous.
const NOON_UTC_DATES = [
  new Date("2026-07-04T12:00:00Z"),
  new Date("2026-01-01T12:00:00Z"),
  new Date("2028-02-29T12:00:00Z"), // année bissextile
  new Date("2026-03-29T12:00:00Z"), // passage heure d'été Europe
  new Date("2026-10-25T12:00:00Z"), // passage heure d'hiver Europe
];

// ═════════════════════════════════════════════════════════════════════════════
// 1. resaDedup.js ↔ appscript/SCRIPT_SHEETS.js (normDate_ / dedupKey_)
// ═════════════════════════════════════════════════════════════════════════════
describe("miroir resaDedup ↔ SCRIPT_SHEETS.js", () => {
  const code = extractFunction(GAS_SHEETS, "normDate_") + "\n" + extractFunction(GAS_SHEETS, "dedupKey_");
  const gas = evalMirror(code, ["normDate_", "dedupKey_"]);

  it("normDate — équivalence sur strings/scalaires/limites (15 cas)", () => {
    for (const v of STRINGY_INPUTS) {
      expect(gas.normDate_(v), `normDate_(${String(v)})`).toBe(normDate(v));
    }
  });

  it("normDate — équivalence sur Date à midi UTC (5 cas, TZ-safe)", () => {
    for (const d of NOON_UTC_DATES) {
      expect(gas.normDate_(d), `normDate_(${d.toISOString()})`).toBe(normDate(d));
    }
  });

  // DRIFT VOLONTAIRE (documenté) détecté le 2026-07-04 — arbitrage non requis
  // tant que des objets Date ne traversent pas la frontière front↔GAS :
  //   src/utils/resaDedup.js normDate(Date) lit les composantes UTC
  //   (getUTCFullYear/…), SCRIPT_SHEETS.js normDate_(Date) lit les composantes
  //   LOCALES (getFullYear/…). C'est un fix ASSUMÉ, expliqué dans le commentaire
  //   de normDate_ : la feuille Google stocke les dates à minuit heure
  //   Europe/Paris ; getUTC* reculait d'un jour et cassait la dédup par contenu.
  //   Exemple divergent (exécuté en TZ Europe/Paris) :
  //     d = new Date("2026-07-04T00:00:00+02:00")  (= 2026-07-03T22:00Z)
  //     src  normDate(d)  → "2026-07-03"   (composantes UTC)
  //     GAS  normDate_(d) → "2026-07-04"   (composantes locales Paris)
  //   Chaque implémentation est correcte DANS SON runtime. À noter : les nd_ de
  //   REVENUS_AUTO_2026/2027.gs utilisent, eux, getUTC* (comme src) — si un jour
  //   ces scripts GAS échangent des clés bâties sur des Date, ça divergera.
  it.skip("normDate(Date à minuit local) — divergence UTC vs local ASSUMÉE (voir commentaire)", () => {});

  it("dedupKey — équivalence clé complète (bienId + dates, 12 combinaisons)", () => {
    const bienIds = ["Amaryllis ", "  ZANDOLI", "nogent", "", null];
    const pairs = [
      ["2026-07-04", "2026-07-10"],
      ["2026-07-04T14:00:00Z", "2026-07-10T09:00:00+02:00"],
      [new Date("2026-07-04T12:00:00Z"), new Date("2026-07-10T12:00:00Z")],
      ["", null],
    ];
    for (const bienId of bienIds) {
      for (const [checkin, checkout] of pairs) {
        expect(
          gas.dedupKey_(bienId, checkin, checkout),
          `dedupKey_(${String(bienId)}, ${String(checkin)}, ${String(checkout)})`
        ).toBe(dedupKey({ bienId, checkin, checkout }));
      }
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 2. resaDedup.js ↔ appscript/REVENUS_AUTO_2026.gs / _2027.gs (nd_ interne)
// ═════════════════════════════════════════════════════════════════════════════
describe("miroir resaDedup ↔ REVENUS_AUTO_2026/2027.gs", () => {
  // nd_ est déclarée À L'INTÉRIEUR de contentKeyRow_(row, C) — on extrait
  // d'abord la fonction externe, puis nd_ dans son corps.
  const key26 = extractFunction(GAS_REV26, "contentKeyRow_");
  const key27 = extractFunction(GAS_REV27, "contentKeyRow27_");
  const nd26 = evalMirror(extractFunction(key26, "nd_"), ["nd_"]).nd_;
  const nd27 = evalMirror(extractFunction(key27, "nd_"), ["nd_"]).nd_;

  it("nd_ (2026 & 2027) — équivalence stricte avec normDate, y compris Date à minuit UTC (23 cas)", () => {
    // Ces nd_ utilisent getUTC* comme src → l'équivalence doit tenir pour TOUTE
    // Date valide, même minuit UTC (contrairement au normDate_ de SCRIPT_SHEETS).
    const inputs = [...STRINGY_INPUTS, ...NOON_UTC_DATES,
      new Date("2026-07-04T00:00:00Z"), new Date("2026-01-01T23:59:59Z"), new Date(0)];
    for (const v of inputs) {
      expect(nd26(v), `2026 nd_(${String(v)})`).toBe(normDate(v));
      expect(nd27(v), `2027 nd_(${String(v)})`).toBe(normDate(v));
    }
  });

  it("contentKeyRow_ / contentKeyRow27_ — même format de clé que dedupKey (stub mapping)", () => {
    const ck26 = evalMirror(key26, ["contentKeyRow_"], { BIEN_BY_LABEL: { "villa amaryllis": "amaryllis" } }).contentKeyRow_;
    const ck27 = evalMirror(key27, ["contentKeyRow27_"], { BIEN_BY_LABEL_27: { "villa amaryllis": "amaryllis" } }).contentKeyRow27_;
    const C = { prop: 1, arrivee: 4, depart: 5 };
    const cases = [
      // label mappé → bienId canonique
      { row: ["id1", "Villa Amaryllis ", "x", "y", "2026-07-04", "2026-07-10"], bienId: "amaryllis" },
      // label inconnu → fallback lowercase/trim (même normalisation que dedupKey)
      { row: ["id2", "  GEKO", "x", "y", new Date("2026-07-04T12:00:00Z"), new Date("2026-07-10T12:00:00Z")], bienId: "geko" },
      { row: ["id3", "", "x", "y", "", null], bienId: "" },
    ];
    for (const { row, bienId } of cases) {
      const want = dedupKey({ bienId, checkin: row[4], checkout: row[5] });
      expect(ck26(row, C), `2026 contentKeyRow_(${row[1]})`).toBe(want);
      expect(ck27(row, C), `2027 contentKeyRow27_(${row[1]})`).toBe(want);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 3. occupancy.js ↔ workers/ical-sync/index.js
// ═════════════════════════════════════════════════════════════════════════════
describe("miroir occupancy ↔ Worker ical-sync", () => {
  const w = evalMirror(
    extractFunction(WORKER, "addDays") + "\n" + extractFunction(WORKER, "diffDays"),
    ["addDays", "diffDays"]
  );

  it("diffDays — équivalence (10 paires, DST/bissextile/négatif inclus)", () => {
    const pairs = [
      ["2026-07-04", "2026-07-11"],
      ["2026-07-04", "2026-07-04"],
      ["2026-07-11", "2026-07-04"], // négatif
      ["2026-03-28", "2026-03-30"], // heure d'été Europe
      ["2026-10-24", "2026-10-26"], // heure d'hiver Europe
      ["2028-02-28", "2028-03-01"], // bissextile
      ["2026-12-31", "2027-01-01"],
      ["2026-01-01", "2027-01-01"],
      ["2026-01-31", "2026-02-01"],
      ["2025-01-01", "2026-07-04"],
    ];
    for (const [a, b] of pairs) {
      expect(w.diffDays(a, b), `diffDays(${a}, ${b})`).toBe(srcDiffDays(a, b));
    }
  });

  it("addDays — équivalence (14 cas, DST/bissextile/négatif inclus)", () => {
    const cases = [
      ["2026-07-04", 0], ["2026-07-04", 1], ["2026-07-04", -1],
      ["2026-07-04", 27], ["2026-07-04", 30], ["2026-07-04", 90], ["2026-07-04", 365],
      ["2026-03-28", 1], ["2026-03-28", 2],   // traverse le passage à l'heure d'été
      ["2026-10-24", 2],                       // traverse le passage à l'heure d'hiver
      ["2028-02-28", 1], ["2028-02-29", 1],    // bissextile
      ["2026-12-31", 1], ["2026-01-01", -1],
    ];
    for (const [d, n] of cases) {
      expect(w.addDays(d, n), `addDays(${d}, ${n})`).toBe(srcAddDays(d, n));
    }
  });

  // nightsBooked est déclarée dans runOccupancySnapshot et capture allEvents +
  // diffDays par closure → on l'évalue avec ces dépendances injectées (diffDays
  // = la version WORKER extraite, pour tester le miroir dans son ensemble).
  const snapshotSrc = extractFunction(WORKER, "runOccupancySnapshot");
  const nightsBookedCode = extractFunction(snapshotSrc, "nightsBooked");
  const buildWorkerNightsBooked = (events) =>
    evalMirror(nightsBookedCode, ["nightsBooked"], { allEvents: events, diffDays: w.diffDays }).nightsBooked;

  const TODAY = "2026-07-04";
  const EVENT_SETS = {
    vide: [],
    nominal: [
      { bienId: "amaryllis", checkin: "2026-07-10", checkout: "2026-07-15" }, // dans la fenêtre
      { bienId: "amaryllis", checkin: "2026-06-28", checkout: "2026-07-06" }, // chevauche le début
      { bienId: "amaryllis", checkin: "2026-07-30", checkout: "2026-08-10" }, // chevauche la fin (30j)
      { bienId: "zandoli", checkin: "2026-07-10", checkout: "2026-07-12" },   // autre bien
      { bienId: "amaryllis", checkin: "2026-11-01", checkout: "2026-11-05" }, // hors fenêtre 30/90j? (90j: dedans)
    ],
    limites: [
      { bienId: "amaryllis", checkin: "", checkout: "2026-07-12" },           // checkin manquant
      { bienId: "amaryllis", checkin: "2026-07-12" },                          // checkout manquant
      { bienId: "amaryllis", checkin: "2026-07-20", checkout: "2026-07-18" },  // dates inversées
      { bienId: "amaryllis", checkin: "2026-07-04", checkout: "2026-07-04" },  // 0 nuit
      { bienId: "amaryllis", checkin: "2026-07-01", checkout: "2026-07-04" },  // checkout == début fenêtre
      { bienId: "amaryllis", checkin: "2026-06-01", checkout: "2026-09-01" },  // englobe toute la fenêtre
    ],
    surbooking: [
      { bienId: "geko", checkin: "2026-06-01", checkout: "2026-09-01" },
      { bienId: "geko", checkin: "2026-07-01", checkout: "2026-08-01" },       // double-booking → nuits > horizon
    ],
  };

  it("nightsBooked ↔ nightsBookedInWindow — équivalence (3 jeux × 3 biens × 4 horizons)", () => {
    for (const [label, events] of Object.entries(EVENT_SETS)) {
      const workerFn = buildWorkerNightsBooked(events);
      for (const bienId of ["amaryllis", "zandoli", "geko"]) {
        for (const horizon of [1, 7, 30, 90]) {
          const to = srcAddDays(TODAY, horizon);
          expect(
            workerFn(bienId, TODAY, to),
            `${label} / ${bienId} / ${horizon}j`
          ).toBe(nightsBookedInWindow(events, bienId, TODAY, to));
        }
      }
    }
  });

  it("taux d'occupation — la formule inline du Worker donne le même rate que occupancyForWindow", () => {
    // Réplique les 2 lignes du wrapper Worker (sold clampé puis rate) — le
    // wrapper lui-même n'est pas extractible (effets de bord D1), cf. en-tête.
    for (const [label, events] of Object.entries(EVENT_SETS)) {
      const workerFn = buildWorkerNightsBooked(events);
      for (const bienId of ["amaryllis", "geko"]) {
        for (const horizon of [30, 90]) {
          const sold = Math.min(horizon, workerFn(bienId, TODAY, w.addDays(TODAY, horizon)));
          const rate = horizon > 0 ? sold / horizon : 0;
          expect(
            occupancyForWindow(events, bienId, TODAY, horizon).rate,
            `${label} / ${bienId} / ${horizon}j`
          ).toBeCloseTo(rate, 12);
        }
      }
    }
  });

  it("garde structurelle — la formule sold/rate du Worker n'a pas changé de forme", () => {
    // Si ce test casse : la formule du wrapper runOccupancySnapshot a été
    // modifiée → vérifier l'équivalence avec occupancyForWindow et mettre à
    // jour le test « taux d'occupation » ci-dessus.
    expect(snapshotSrc).toMatch(/Math\.min\(horizon,\s*nightsBooked\(/);
    expect(snapshotSrc).toMatch(/sold\s*\/\s*horizon/);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// 4. Modules SANS miroir — garde anti-fork (le drift ne peut pas exister tant
//    que les consommateurs IMPORTENT le module src au lieu de le recopier).
//    Si un de ces tests casse : quelqu'un a remplacé l'import par une copie
//    inline → l'ajouter aux sections d'équivalence comportementale ci-dessus.
// ═════════════════════════════════════════════════════════════════════════════
describe("modules sans miroir — les imports directs restent en place", () => {
  it("coherenceRules — coherence-check.js importe toujours le module src (pas de copie)", () => {
    const fn = readSource("../../functions/api/coherence-check.js");
    expect(fn).toMatch(/import\s*\{\s*checkReservations\s*\}\s*from\s*["'].*coherenceRules\.js["']/);
  });

  it("rmOccupancyAdjust — rm-recommendations importe toujours le module src (pas de copie)", () => {
    const fn = readSource("../../functions/api/rm-recommendations/[[path]].js");
    expect(fn).toMatch(/import\s*\{\s*occupancyAdjustment\s*\}\s*from\s*["'].*rmOccupancyAdjust\.js["']/);
  });

  it("pricing — PublicSite importe toujours le module src (pas de copie)", () => {
    const src = readSource("../PublicSite.jsx");
    expect(src).toMatch(/from\s*["']\.\/utils\/pricing\.js["']/);
  });

  it("pricing — aucun barème de remise (>= 28 nuits) recopié dans GAS/Worker", () => {
    // CLAUDE.md liste pricing.js parmi les modules « mirrorés », mais aucun
    // miroir runtime n'existe au 2026-07-04 (seule copie : un ui_kit de skill
    // design, hors runtime). Ce scan détecte l'apparition d'un futur fork.
    for (const [label, src] of [
      ["SCRIPT_SHEETS.js", GAS_SHEETS],
      ["REVENUS_AUTO_2026.gs", GAS_REV26],
      ["REVENUS_AUTO_2027.gs", GAS_REV27],
      ["workers/ical-sync/index.js", WORKER],
    ]) {
      expect(
        /(?:nights|nuits|n)\s*>=\s*28\s*\?/.test(src),
        `barème de remise pricing recopié dans ${label} — ajouter une section d'équivalence`
      ).toBe(false);
    }
  });
});
