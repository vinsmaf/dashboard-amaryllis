import { describe, it, expect } from "vitest";
import { normalizePhone, samePhone, findStayForPhone, todayForBien } from "./guestResolve.js";

describe("normalizePhone — les formats réellement en présence", () => {
  it("normalise le format WhatsApp (E.164 sans +)", () => {
    expect(normalizePhone("33610880772")).toBe("610880772");
  });

  it("normalise les formats saisis au booking", () => {
    expect(normalizePhone("+33 6 10 88 07 72")).toBe("610880772");
    expect(normalizePhone("06 10 88 07 72")).toBe("610880772");
    expect(normalizePhone("0610880772")).toBe("610880772");
    expect(normalizePhone("+33610880772")).toBe("610880772");
  });

  it("normalise un mobile Martinique", () => {
    expect(normalizePhone("+596 696 12 34 56")).toBe("696123456");
    expect(normalizePhone("596696123456")).toBe("696123456");
  });

  it("gère les séparateurs exotiques", () => {
    expect(normalizePhone("(+33) 6.10.88.07.72")).toBe("610880772");
    expect(normalizePhone("+33-6-10-88-07-72")).toBe("610880772");
  });

  it("renvoie une chaîne vide sur entrée inexploitable", () => {
    expect(normalizePhone("")).toBe("");
    expect(normalizePhone(null)).toBe("");
    expect(normalizePhone(undefined)).toBe("");
    expect(normalizePhone("pas un numéro")).toBe("");
    expect(normalizePhone(33610880772)).toBe(""); // nombre, pas string → refusé
  });
});

describe("samePhone — reconnaître la même ligne malgré les formats", () => {
  it("matche WhatsApp vs booking (le cas réel du bot)", () => {
    expect(samePhone("33610880772", "+33 6 10 88 07 72")).toBe(true);
    expect(samePhone("33610880772", "06 10 88 07 72")).toBe(true);
  });

  it("matche un mobile Martinique quel que soit le format", () => {
    expect(samePhone("596696123456", "0696 12 34 56")).toBe(true);
  });

  it("ne matche pas deux lignes différentes", () => {
    expect(samePhone("33610880772", "33699999999")).toBe(false);
    expect(samePhone("+596 696 12 34 56", "+596 696 65 43 21")).toBe(false);
  });

  it("ne matche JAMAIS sur un numéro trop court — ne pas répondre vaut mieux que se tromper de voyageur", () => {
    expect(samePhone("12345", "12345")).toBe(false);
    expect(samePhone("", "")).toBe(false);
    expect(samePhone(null, "33610880772")).toBe(false);
    expect(samePhone("33610880772", "")).toBe(false);
  });
});

describe("findStayForPhone", () => {
  const TODAY = "2026-07-17";
  const bookings = [
    { id: "a", phone: "+33 6 10 88 07 72", checkin: "2026-07-15", checkout: "2026-07-20", bien_id: "nogent" },
    { id: "b", phone: "+33 6 99 99 99 99", checkin: "2026-07-16", checkout: "2026-07-19", bien_id: "geko" },
    { id: "c", phone: "+33 6 10 88 07 72", checkin: "2026-09-01", checkout: "2026-09-08", bien_id: "zandoli" },
    { id: "d", phone: "+33 6 10 88 07 72", checkin: "2026-05-01", checkout: "2026-05-08", bien_id: "geko" },
  ];

  it("trouve le séjour EN COURS et le bon logement (le fix du bug WhatsApp)", () => {
    const r = findStayForPhone(bookings, "33610880772", TODAY);
    expect(r.match).toBe("current");
    expect(r.booking.id).toBe("a");
    expect(r.booking.bien_id).toBe("nogent"); // et surtout pas "amaryllis" par défaut
  });

  it("privilégie le séjour en cours sur le futur et le passé du même voyageur", () => {
    expect(findStayForPhone(bookings, "+33610880772", TODAY).booking.id).toBe("a");
  });

  it("retombe sur le prochain séjour à venir si aucun en cours", () => {
    const r = findStayForPhone(bookings, "33610880772", "2026-08-01");
    expect(r.match).toBe("upcoming");
    expect(r.booking.id).toBe("c");
  });

  it("retombe sur le séjour passé le PLUS RÉCENT si ni en cours ni à venir", () => {
    // Au 01/12, ce voyageur a 3 séjours passés (mai, juillet, septembre) → c'est
    // septembre ("c") le plus récent, pas mai ("d").
    const r = findStayForPhone(bookings, "33610880772", "2026-12-01");
    expect(r.match).toBe("past");
    expect(r.booking.id).toBe("c");
  });

  it("ne renvoie rien pour un inconnu — le concierge doit alors rester prudent", () => {
    expect(findStayForPhone(bookings, "33600000000", TODAY)).toEqual({ booking: null, match: null });
  });

  it("gère l'absence d'entrée sans exploser", () => {
    expect(findStayForPhone([], "33610880772", TODAY)).toEqual({ booking: null, match: null });
    expect(findStayForPhone(null, "33610880772", TODAY)).toEqual({ booking: null, match: null });
    expect(findStayForPhone(bookings, "", TODAY)).toEqual({ booking: null, match: null });
  });

  it("ignore les résas sans téléphone", () => {
    const b = [{ id: "x", phone: null, checkin: "2026-07-15", checkout: "2026-07-20" }];
    expect(findStayForPhone(b, "33610880772", TODAY).booking).toBeNull();
  });
});

describe("todayForBien — Nogent n'est pas en Martinique", () => {
  it("applique UTC-4 pour les biens Martinique", () => {
    // 2026-07-17T02:00:00Z → 2026-07-16 22h en Martinique : c'est encore la veille
    expect(todayForBien("geko", Date.parse("2026-07-17T02:00:00Z"))).toBe("2026-07-16");
  });

  it("applique l'heure de Paris pour Nogent (le même instant y est déjà le 17)", () => {
    expect(todayForBien("nogent", Date.parse("2026-07-17T02:00:00Z"))).toBe("2026-07-17");
  });

  it("gère le passage de minuit Paris en été (UTC+2)", () => {
    // 2026-07-16T23:00:00Z → 01h le 17 à Paris
    expect(todayForBien("nogent", Date.parse("2026-07-16T23:00:00Z"))).toBe("2026-07-17");
    // ...mais encore le 16 en Martinique (19h)
    expect(todayForBien("zandoli", Date.parse("2026-07-16T23:00:00Z"))).toBe("2026-07-16");
  });
});
