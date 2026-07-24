import { describe, it, expect } from "vitest";
import {
  DIRECT_REFERER,
  THRESHOLD_HOURS,
  isOwnFunnelBooking,
  bookingAgeHours,
  isCancellableAbandoned,
  partitionForCancellation,
} from "./beds24Cancel.js";

// Instant de référence fixe — pas de Date.now() dans les tests.
const NOW = new Date("2026-07-24T12:00:00Z").getTime();
const hoursAgo = (h) => {
  const d = new Date(NOW - h * 3600000);
  return d.toISOString().slice(0, 19).replace("T", " ");
};

const mk = (over = {}) => ({
  id: "1",
  status: "new",
  referer: "direct",
  bookingTime: hoursAgo(10),
  ...over,
});

describe("isOwnFunnelBooking", () => {
  it("reconnaît le referer écrit par beds24-create.js", () => {
    expect(isOwnFunnelBooking({ referer: "direct" })).toBe(true);
    expect(isOwnFunnelBooking({ referer: "  Direct " })).toBe(true);
  });

  it("rejette les canaux OTA", () => {
    for (const r of ["Booking.com", "Airbnb", "Expedia", "VRBO"]) {
      expect(isOwnFunnelBooking({ referer: r })).toBe(false);
    }
  });

  it("rejette les saisies manuelles du compte Beds24 de Vincent", () => {
    // « Louer Premium » = nom du compte, pas notre tunnel. Un includes('direct') naïf
    // ne l'attraperait pas non plus, mais on verrouille l'intention explicitement.
    expect(isOwnFunnelBooking({ referer: "Louer Premium" })).toBe(false);
  });

  it("rejette un referer absent ou vide", () => {
    expect(isOwnFunnelBooking({})).toBe(false);
    expect(isOwnFunnelBooking({ referer: "" })).toBe(false);
    expect(isOwnFunnelBooking({ referer: null })).toBe(false);
    expect(isOwnFunnelBooking(null)).toBe(false);
  });

  it("ne se laisse pas berner par un canal qui CONTIENT le mot direct", () => {
    expect(isOwnFunnelBooking({ referer: "Direct Booking Partner" })).toBe(false);
  });
});

describe("bookingAgeHours", () => {
  it("parse le format Beds24 'YYYY-MM-DD HH:MM:SS' comme de l'UTC", () => {
    expect(bookingAgeHours({ bookingTime: hoursAgo(6) }, NOW)).toBeCloseTo(6, 5);
  });

  it("renvoie null (donc jamais annulé) sur un format inexploitable", () => {
    for (const bt of [undefined, null, "", "   ", "pas une date", 12345]) {
      expect(bookingAgeHours({ bookingTime: bt }, NOW)).toBeNull();
    }
  });
});

describe("isCancellableAbandoned", () => {
  it("annule un panier abandonné de NOTRE tunnel au-delà du seuil", () => {
    expect(isCancellableAbandoned(mk(), { nowMs: NOW })).toBe(true);
  });

  it("épargne une Booking.com au statut new — le bug qui a motivé ce module", () => {
    // Cas réel du 2026-07-24 : 6 résas Booking.com en statut new, toutes candidates
    // avant ce filtre. Aucune ne doit être touchée.
    const booking = mk({ referer: "Booking.com", bookingTime: hoursAgo(500) });
    expect(isCancellableAbandoned(booking, { nowMs: NOW })).toBe(false);
  });

  it("épargne une saisie manuelle Beds24", () => {
    expect(isCancellableAbandoned(mk({ referer: "Louer Premium" }), { nowMs: NOW })).toBe(false);
  });

  it("épargne tout statut autre que new", () => {
    for (const status of ["confirmed", "cancelled", "black", "request", "closed"]) {
      expect(isCancellableAbandoned(mk({ status }), { nowMs: NOW })).toBe(false);
    }
  });

  it("épargne une résa plus jeune que le seuil", () => {
    expect(isCancellableAbandoned(mk({ bookingTime: hoursAgo(THRESHOLD_HOURS - 0.5) }), { nowMs: NOW })).toBe(false);
    expect(isCancellableAbandoned(mk({ bookingTime: hoursAgo(THRESHOLD_HOURS) }), { nowMs: NOW })).toBe(true);
  });

  it("épargne une résa déjà payée côté Stripe", () => {
    const paidIds = new Set(["42"]);
    expect(isCancellableAbandoned(mk({ id: "42" }), { nowMs: NOW, paidIds })).toBe(false);
    expect(isCancellableAbandoned(mk({ id: 42 }), { nowMs: NOW, paidIds })).toBe(false); // id numérique
  });

  it("épargne une résa dont la date de création est illisible", () => {
    expect(isCancellableAbandoned(mk({ bookingTime: "n'importe quoi" }), { nowMs: NOW })).toBe(false);
  });
});

describe("partitionForCancellation", () => {
  it("sépare à annuler / protégée car payée / épargnée", () => {
    const paidIds = new Set(["payee"]);
    const bookings = [
      mk({ id: "abandon", referer: "direct" }),
      mk({ id: "payee", referer: "direct" }),
      mk({ id: "ota", referer: "Booking.com" }),
      mk({ id: "recente", bookingTime: hoursAgo(1) }),
      mk({ id: "confirmee", status: "confirmed" }),
    ];
    const { toCancel, protectedPaid, spared } = partitionForCancellation(bookings, { nowMs: NOW, paidIds });

    expect(toCancel.map((b) => b.id)).toEqual(["abandon"]);
    expect(protectedPaid.map((b) => b.id)).toEqual(["payee"]);
    expect(spared.map((b) => b.id)).toEqual(["ota", "recente", "confirmee"]);
  });

  it("ne classe PAS une OTA payée en protectedPaid (elle n'était de toute façon pas candidate)", () => {
    const paidIds = new Set(["x"]);
    const { toCancel, protectedPaid, spared } = partitionForCancellation(
      [mk({ id: "x", referer: "Booking.com" })],
      { nowMs: NOW, paidIds }
    );
    expect(toCancel).toHaveLength(0);
    expect(protectedPaid).toHaveLength(0);
    expect(spared).toHaveLength(1);
  });

  it("tolère une entrée vide", () => {
    expect(partitionForCancellation(undefined, { nowMs: NOW }).toCancel).toEqual([]);
    expect(partitionForCancellation([], { nowMs: NOW }).toCancel).toEqual([]);
  });

  it("expose les constantes attendues", () => {
    expect(DIRECT_REFERER).toBe("direct");
    expect(THRESHOLD_HOURS).toBe(4);
  });
});
