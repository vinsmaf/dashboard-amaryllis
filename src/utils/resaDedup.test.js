import { describe, it, expect } from "vitest";
import { dedupKey, normDate, dedupeReservations } from "./resaDedup.js";

describe("normDate", () => {
  it("string ISO -> YYYY-MM-DD", () => { expect(normDate("2026-07-01")).toBe("2026-07-01"); expect(normDate("2026-07-01T12:00:00Z")).toBe("2026-07-01"); });
  it("Date -> YYYY-MM-DD (UTC)", () => { expect(normDate(new Date(Date.UTC(2026, 6, 1)))).toBe("2026-07-01"); });
  it("vide", () => { expect(normDate(null)).toBe(""); expect(normDate("")).toBe(""); });
});

describe("dedupKey", () => {
  it("stable, insensible à la casse du bien", () => {
    expect(dedupKey({ bienId: "Geko", checkin: "2026-07-01", checkout: "2026-07-04" }))
      .toBe(dedupKey({ bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" }));
  });
  it("clé identique pour la même nuitée à ids différents (le cas ami coco)", () => {
    const a = { id: "uuid-123", bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" };
    const b = { id: "beds24-999", bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" };
    expect(dedupKey(a)).toBe(dedupKey(b));
  });
  it("clés différentes si dates ou bien diffèrent", () => {
    expect(dedupKey({ bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" }))
      .not.toBe(dedupKey({ bienId: "geko", checkin: "2026-07-02", checkout: "2026-07-04" }));
    expect(dedupKey({ bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" }))
      .not.toBe(dedupKey({ bienId: "zandoli", checkin: "2026-07-01", checkout: "2026-07-04" }));
  });
});

describe("dedupeReservations", () => {
  it("fusionne les doublons de contenu (3 -> 1)", () => {
    const list = [
      { id: "a", bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" },
      { id: "b", bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" },
      { id: "c", bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" },
    ];
    expect(dedupeReservations(list)).toHaveLength(1);
  });
  it("garde les distincts", () => {
    const list = [
      { id: "a", bienId: "geko", checkin: "2026-07-01", checkout: "2026-07-04" },
      { id: "b", bienId: "zandoli", checkin: "2026-07-01", checkout: "2026-07-04" },
    ];
    expect(dedupeReservations(list)).toHaveLength(2);
  });
});
