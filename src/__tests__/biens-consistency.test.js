import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { BIENS as CANON } from "../data/biens.js";

// Garde-fou anti-drift (chantier source unique — phase 1).
// PublicSite.BIENS et les seeds de App.jsx ne sont PAS encore migrés vers le
// canonique (src/data/biens.js). Ce test échoue si leurs FAITS NUMÉRIQUES
// (prix, capacite) divergent du canonique.
//
// ⚠️ On ne compare QUE prix + capacite (faits stables qui causent de vrais bugs).
// On NE compare PAS le `nom` : les noms d'affichage diffèrent légitimement
// (« Studio Mabouya » canon vs « Mabouya » PublicSite, etc.).
//
// Stratégie robuste : PublicSite.jsx / App.jsx importent du JSX/DOM et ne
// s'importent pas proprement sous vitest node → on lit le SOURCE via
// fs.readFileSync + extraction par regex, puis on compare au canonique.

function readSource(relPath) {
  return fs.readFileSync(new URL(relPath, import.meta.url), "utf8");
}

// Extrait le bloc texte de l'objet bien commençant à `id: "<id>"` dans le
// tableau `const BIENS = [...]`. Le bloc va de la déclaration de l'id jusqu'à
// l'id suivant (ou la fin du fichier), ce qui garantit qu'on ne lit pas le
// prix/capacite d'un voisin.
function blockForId(src, id) {
  const start = src.indexOf(`id: "${id}"`);
  if (start === -1) return null;
  // borne de fin = prochain `id: "..."` après start
  const next = src.slice(start + 1).search(/id:\s*"[a-z]+"/);
  const end = next === -1 ? src.length : start + 1 + next;
  return src.slice(start, end);
}

function extractInt(block, key) {
  const m = block.match(new RegExp(`${key}:\\s*(\\d+)`));
  return m ? Number(m[1]) : null;
}

describe("biens — cohérence avec la source canonique", () => {
  it("le canonique a 7 biens et 2 villas", () => {
    expect(Object.keys(CANON)).toHaveLength(7);
    expect(
      Object.values(CANON)
        .filter((b) => b.type === "villa")
        .map((b) => b.id)
    ).toEqual(["amaryllis", "iguana"]);
  });

  it("PublicSite.BIENS — prix & capacite collent au canonique", () => {
    const src = readSource("../PublicSite.jsx");
    const skipped = [];
    for (const id of Object.keys(CANON)) {
      const block = blockForId(src, id);
      if (!block) {
        skipped.push(id);
        continue;
      }
      const prix = extractInt(block, "prix");
      const capacite = extractInt(block, "capacite");
      if (prix !== null) {
        expect(prix, `prix PublicSite "${id}"`).toBe(CANON[id].prix);
      }
      if (capacite !== null) {
        expect(capacite, `capacite PublicSite "${id}"`).toBe(CANON[id].capacite);
      }
    }
    if (skipped.length) {
      // eslint-disable-next-line no-console
      console.warn(
        `[biens-consistency] ids absents de PublicSite.BIENS (skip) : ${skipped.join(", ")}`
      );
    }
  });
});
