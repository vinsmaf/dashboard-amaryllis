import { describe, it, expect } from "vitest";
import { CAUTION_AMOUNTS, cautionAmountFor, placeDateFor, PLACE_DAYS_BEFORE, decideCautionAction, REAUTH_LEAD_DAYS, RELEASE_DAYS_AFTER, leadDays, isNearBooking, NEAR_LEAD_DAYS } from "./caution.js";

describe("cautionAmountFor", () => {
  it("retourne le montant pré-autorisé en prod par bien", () => {
    expect(cautionAmountFor("amaryllis")).toBe(1500);
    expect(cautionAmountFor("schoelcher")).toBe(1000);
    expect(cautionAmountFor("zandoli")).toBe(500); // = ce qui a réellement été bloqué (Antoine/Anaïs)
    expect(cautionAmountFor("nogent")).toBe(500);
  });

  it("retourne 0 pour un bien inconnu (pas de caution fantôme)", () => {
    expect(cautionAmountFor("inconnu")).toBe(0);
    expect(cautionAmountFor("")).toBe(0);
    expect(cautionAmountFor(undefined)).toBe(0);
  });

  it("couvre les 7 biens", () => {
    expect(Object.keys(CAUTION_AMOUNTS)).toHaveLength(7);
  });
});

describe("placeDateFor", () => {
  const TODAY = "2026-06-18";

  it("pose la caution PLACE_DAYS_BEFORE jours avant une arrivée lointaine", () => {
    // Cas Anaïs : réservé en juin, séjour le 02/08 → caution posée le 31/07 (pas en juin).
    expect(placeDateFor("2026-08-02", TODAY)).toBe("2026-07-31");
    expect(PLACE_DAYS_BEFORE).toBe(2);
  });

  it("pose dès aujourd'hui si l'arrivée est imminente (< buffer)", () => {
    // checkin demain → target = avant-hier < today → on pose aujourd'hui.
    expect(placeDateFor("2026-06-19", TODAY)).toBe(TODAY);
    expect(placeDateFor("2026-06-20", TODAY)).toBe(TODAY); // target = 18/06 = today
  });

  it("pose dès aujourd'hui si l'arrivée est déjà passée", () => {
    expect(placeDateFor("2026-06-10", TODAY)).toBe(TODAY);
  });

  it("franchit correctement une frontière de mois", () => {
    expect(placeDateFor("2026-07-01", TODAY)).toBe("2026-06-29");
  });

  it("retourne null sur une date invalide (pas de planification hasardeuse)", () => {
    expect(placeDateFor("", TODAY)).toBeNull();
    expect(placeDateFor("pas-une-date", TODAY)).toBeNull();
    expect(placeDateFor("2026-08-02", "")).toBeNull();
  });

  it("rejette les dates au bon format mais irréelles (mois 13, 30 février)", () => {
    expect(placeDateFor("2026-13-01", TODAY)).toBeNull();
    expect(placeDateFor("2026-02-30", TODAY)).toBeNull();
  });
});

describe("leadDays / isNearBooking (répartition inline vs différé)", () => {
  const TODAY = "2026-06-18";

  it("leadDays compte les jours jusqu'à l'arrivée", () => {
    expect(leadDays("2026-08-02", TODAY)).toBe(45);
    expect(leadDays("2026-06-20", TODAY)).toBe(2);
    expect(leadDays("2026-06-18", TODAY)).toBe(0);
    expect(leadDays("2026-06-15", TODAY)).toBe(-3); // arrivée passée
    expect(leadDays("invalide", TODAY)).toBeNull();
  });

  it("isNearBooking : arrivée ≤ 3 j → caution au paiement", () => {
    expect(NEAR_LEAD_DAYS).toBe(3);
    expect(isNearBooking("2026-06-20", TODAY)).toBe(true);  // dans 2 j
    expect(isNearBooking("2026-06-21", TODAY)).toBe(true);  // dans 3 j (limite)
    expect(isNearBooking("2026-06-18", TODAY)).toBe(true);  // aujourd'hui
    expect(isNearBooking("2026-06-15", TODAY)).toBe(true);  // déjà arrivé → on prend tout de suite
  });

  it("isNearBooking : arrivée > 3 j → caution différée (false)", () => {
    expect(isNearBooking("2026-06-22", TODAY)).toBe(false); // dans 4 j
    expect(isNearBooking("2026-08-02", TODAY)).toBe(false); // dans 45 j (cas Anaïs)
    expect(isNearBooking("invalide", TODAY)).toBe(false);
  });

  it("complémentarité : une résa est SOIT inline (near) SOIT différée, jamais les deux", () => {
    // À la frontière : lead=3 → inline (pas de ligne cron) ; lead=4 → différé (ligne cron, pas d'inline).
    expect(isNearBooking("2026-06-21", TODAY)).toBe(true);
    expect(isNearBooking("2026-06-22", TODAY)).toBe(false);
  });
});

describe("decideCautionAction (machine à états poser / re-poser / libérer)", () => {
  it("constantes attendues", () => {
    expect(REAUTH_LEAD_DAYS).toBe(1);
    expect(RELEASE_DAYS_AFTER).toBe(3);
  });

  it("pending : attend la date de pose", () => {
    const base = { status: "pending", placeDate: "2026-07-31", checkout: "2026-08-09" };
    expect(decideCautionAction({ ...base, today: "2026-07-30" })).toBe("noop");
    expect(decideCautionAction({ ...base, today: "2026-07-31" })).toBe("place"); // jour J
    expect(decideCautionAction({ ...base, today: "2026-08-01" })).toBe("place");
  });

  it("held + hold sain + séjour en cours → rien", () => {
    expect(decideCautionAction({
      status: "held", captureBefore: "2026-08-10", checkout: "2026-08-20", today: "2026-08-06",
    })).toBe("noop");
  });

  it("held + hold proche de l'expiration + séjour long → re-pose (couvre > 7 nuits)", () => {
    // capture_before 05/08, on re-pose 1 j avant = 04/08, séjour jusqu'au 20/08.
    expect(decideCautionAction({
      status: "held", captureBefore: "2026-08-05", checkout: "2026-08-20", today: "2026-08-04",
    })).toBe("reauth");
  });

  it("held + départ passé depuis 3 j → libère", () => {
    expect(decideCautionAction({
      status: "held", captureBefore: "2026-08-15", checkout: "2026-08-09", today: "2026-08-12",
    })).toBe("release"); // 09/08 + 3 = 12/08
  });

  it("held : la libération est prioritaire sur le re-blocage", () => {
    // Les deux conditions sont vraies au 12/08 → on doit libérer, pas re-poser.
    expect(decideCautionAction({
      status: "held", captureBefore: "2026-08-12", checkout: "2026-08-09", today: "2026-08-12",
    })).toBe("release");
  });

  it("held : re-pose pendant la fenêtre d'inspection (départ passé mais < 3 j) si le hold expire", () => {
    expect(decideCautionAction({
      status: "held", captureBefore: "2026-08-10", checkout: "2026-08-09", today: "2026-08-10",
    })).toBe("reauth"); // checkout+3 = 12/08 non atteint, hold expire → on garde actif
  });

  it("états terminaux et date invalide → noop", () => {
    for (const status of ["released", "captured", "failed"]) {
      expect(decideCautionAction({ status, checkout: "2026-08-09", today: "2026-08-20" })).toBe("noop");
    }
    expect(decideCautionAction({ status: "pending", placeDate: "2026-07-31", today: "" })).toBe("noop");
  });
});
