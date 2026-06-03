import { describe, it, expect } from "vitest";
import fs from "node:fs";
import { BIENS as CANON } from "../data/biens.js";

// Garde-fou source unique des biens (chantier source unique — phase 2).
//
// Depuis la phase 2, PublicSite.BIENS ne stocke PLUS les FAITS en littéral :
// prix/capacite/chambres/coords/rating/reviews/bookable viennent du canonique
// (src/data/biens.js) via `...canonFacts(id)`. Ce test ne compare donc plus des
// valeurs littérales (devenues absentes) mais garantit :
//   (a) l'INTÉGRITÉ du canonique (types/bornes des faits cœur) ;
//   (b) l'ANTI-RÉGRESSION : empêcher quelqu'un de re-coder un fait en dur dans
//       le tableau `const BIENS = [...]` de PublicSite (la fusion doit rester
//       la seule source des faits).
//
// Stratégie robuste : PublicSite.jsx importe du JSX/DOM et ne s'importe pas
// proprement sous vitest node → on lit le SOURCE via fs.readFileSync + on borne
// précisément le tableau BIENS, puis on inspecte par regex.

function readSource(relPath) {
  return fs.readFileSync(new URL(relPath, import.meta.url), "utf8");
}

// Isole le bloc texte du tableau `const BIENS = [ ... ];` de PublicSite.
// De l'index de `const BIENS = [` jusqu'à la première fermeture `\n];` qui suit.
function biensArrayBlock(src) {
  const start = src.indexOf("const BIENS = [");
  if (start === -1) return null;
  const end = src.indexOf("\n];", start);
  if (end === -1) return null;
  return src.slice(start, end + 3);
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

  it("intégrité du canonique — faits cœur valides pour les 7 biens", () => {
    for (const id of Object.keys(CANON)) {
      const b = CANON[id];

      expect(typeof b.prix, `prix "${id}"`).toBe("number");
      expect(b.prix, `prix "${id}"`).toBeGreaterThan(0);

      expect(typeof b.capacite, `capacite "${id}"`).toBe("number");
      expect(b.capacite, `capacite "${id}"`).toBeGreaterThanOrEqual(1);

      expect(typeof b.chambres, `chambres "${id}"`).toBe("number");
      expect(b.chambres, `chambres "${id}"`).toBeGreaterThanOrEqual(1);

      expect(typeof b.coords.lat, `coords.lat "${id}"`).toBe("number");
      expect(Number.isFinite(b.coords.lat), `coords.lat finite "${id}"`).toBe(true);
      expect(typeof b.coords.lng, `coords.lng "${id}"`).toBe("number");
      expect(Number.isFinite(b.coords.lng), `coords.lng finite "${id}"`).toBe(true);

      expect(typeof b.rating, `rating "${id}"`).toBe("number");
      expect(b.rating, `rating "${id}"`).toBeGreaterThanOrEqual(4);
      expect(b.rating, `rating "${id}"`).toBeLessThanOrEqual(5);

      expect(typeof b.reviews, `reviews "${id}"`).toBe("number");
      expect(b.reviews, `reviews "${id}"`).toBeGreaterThanOrEqual(0);

      expect(typeof b.bookable, `bookable "${id}"`).toBe("boolean");

      expect(b.seoTitle.length, `seoTitle.length "${id}"`).toBeLessThanOrEqual(60);
      expect(b.seoDesc.length, `seoDesc.length "${id}"`).toBeLessThanOrEqual(160);
    }
  });

  it("PublicSite.BIENS — aucun fait n'est ré-écrit en littéral (fusion canonique seule source)", () => {
    const src = readSource("../PublicSite.jsx");
    const bloc = biensArrayBlock(src);
    expect(bloc, "tableau const BIENS = [...] introuvable dans PublicSite.jsx").not.toBeNull();

    // La fusion doit câbler les 7 biens via ...canonFacts("<id>").
    const canonFactsCount = (bloc.match(/canonFacts\(/g) || []).length;
    expect(canonFactsCount, "appels canonFacts() dans BIENS").toBeGreaterThanOrEqual(7);

    // Anti-régression : aucune clé de fait ne doit réapparaître en littéral
    // dans le tableau BIENS. On exclut volontairement `rating:` (présent
    // légitimement comme `note` mappé dans les sous-objets `avis`) en ne
    // ciblant que les clés qui n'apparaissent JAMAIS dans les avis.
    const residus = bloc.match(/\n\s+(prix|capacite|chambres|coords|reviews|bookable):/g);
    expect(
      residus,
      `faits littéraux résiduels dans PublicSite.BIENS : ${residus ? residus.join(", ") : ""}`
    ).toBeNull();
  });
});
