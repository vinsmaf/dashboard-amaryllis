import { describe, it, expect } from "vitest";
import {
  isReactivableEmail, segmentClients, commissionOta, commissionFromReservations, normCanal,
  projectionReactivation, computeOtaCost,
} from "./otaCost.js";

describe("normCanal — libellés du Sheet → canal normalisé", () => {
  it("mappe les variantes réelles", () => {
    expect(normCanal("Airbnb")).toBe("airbnb");
    expect(normCanal("Booking.com")).toBe("booking");
    expect(normCanal("Direct")).toBe("direct");
    expect(normCanal("Louer Premium")).toBe("direct");   // Nogent direct
    expect(normCanal("beds24")).toBe("direct");
    expect(normCanal("")).toBe("autre");
    expect(normCanal(null)).toBe("autre");
  });
});

describe("commissionFromReservations — FAIT vivant (remplace le seed statique)", () => {
  const rates = { airbnbComm: (bien) => (bien === "amaryllis" ? 0.15 : 0.03), bookingComm: 0.17 };
  const resas = [
    { bienId: "amaryllis", canal: "Airbnb",      montant: 10000, checkin: "2025-06-01" }, // 15%
    { bienId: "geko",      canal: "Airbnb",      montant: 5000,  checkin: "2025-07-01" }, // 3%
    { bienId: "zandoli",   canal: "Booking.com", montant: 20000, checkin: "2025-08-01" }, // 17%
    { bienId: "geko",      canal: "Direct",      montant: 8000,  checkin: "2025-09-01" }, // 0%
    { bienId: "nogent",    canal: "Louer Premium", montant: 1000, checkin: "2025-05-01" }, // direct
    { bienId: "geko",      canal: "Airbnb",      montant: 3000,  checkin: "2026-01-01" }, // autre année
    { bienId: "geko",      canal: "Booking.com", montant: 0,     checkin: "2025-03-01" }, // montant 0 ignoré
  ];

  it("agrège par canal et applique le taux Airbnb PAR BIEN, pour la bonne année", () => {
    const c = commissionFromReservations(resas, "2025", rates);
    expect(c.airbnb).toBe(Math.round(10000 * 0.15 + 5000 * 0.03)); // 1500 + 150 = 1650
    expect(c.booking).toBe(Math.round(20000 * 0.17));              // 3400
    expect(c.total).toBe(1650 + 3400);
    expect(c.caAirbnb).toBe(15000);
    expect(c.caBooking).toBe(20000);
    expect(c.caDirect).toBe(9000);  // 8000 direct + 1000 louer premium
    expect(c.year).toBe("2025");
  });

  it("filtre bien par année (2026 séparé)", () => {
    const c = commissionFromReservations(resas, "2026", rates);
    expect(c.caAirbnb).toBe(3000);
    expect(c.airbnb).toBe(Math.round(3000 * 0.03));
    expect(c.caBooking).toBe(0);
  });

  it("ignore les montants nuls et les canaux inconnus (pas de taux inventé)", () => {
    const c = commissionFromReservations(
      [{ bienId: "x", canal: "Mystère", montant: 5000, checkin: "2025-01-01" }], "2025", rates);
    expect(c.total).toBe(0);
    expect(c.partOtaPct).toBe(0);
  });

  it("gère une liste vide", () => {
    expect(commissionFromReservations([], "2025", rates).total).toBe(0);
  });
});

describe("isReactivableEmail — recontactable en direct ?", () => {
  it("accepte un email réel", () => {
    expect(isReactivableEmail("marie.dupont@gmail.com")).toBe(true);
    expect(isReactivableEmail("  Jean@Orange.FR ")).toBe(true);
  });
  it("rejette les alias OTA (relais)", () => {
    expect(isReactivableEmail("ngrubo.974870@guest.booking.com")).toBe(false);
    expect(isReactivableEmail("abc@guest.airbnb.com")).toBe(false);
    expect(isReactivableEmail("xyz@reply.airbnb.com")).toBe(false);
  });
  it("rejette vide / null / sans @", () => {
    expect(isReactivableEmail("")).toBe(false);
    expect(isReactivableEmail(null)).toBe(false);
    expect(isReactivableEmail(undefined)).toBe(false);
    expect(isReactivableEmail("pasunemail")).toBe(false);
  });
});

describe("segmentClients — réactivables / captifs OTA / leads", () => {
  const clients = [
    { canal_principal: "direct",  email: "a@gmail.com", ltv_total: 2000, nb_sejours: 3 }, // réactivable
    { canal_principal: "direct",  email: "b@free.fr",   ltv_total: 500,  nb_sejours: 1 }, // réactivable
    { canal_principal: "booking", email: null,          ltv_total: 968,  nb_sejours: 2 }, // captif OTA repeater
    { canal_principal: "booking", email: "",            ltv_total: 400,  nb_sejours: 1 }, // captif OTA
    { canal_principal: "airbnb",  email: null,          ltv_total: 220,  nb_sejours: 2 }, // captif OTA repeater
    { canal_principal: "whatsapp",email: null,          ltv_total: 0,    nb_sejours: 0 }, // lead sans séjour
    { canal_principal: "direct",  email: null,          ltv_total: 330,  nb_sejours: 1 }, // non réactivable MAIS direct → ni captif OTA ni lead
  ];

  it("range chaque client dans la bonne catégorie", () => {
    const s = segmentClients(clients);
    expect(s.reactivables.count).toBe(2);
    expect(s.reactivables.ltv).toBe(2500);
    expect(s.captifsOta.count).toBe(3);           // 2 booking + 1 airbnb
    expect(s.captifsOta.ltv).toBe(968 + 400 + 220);
    expect(s.captifsOta.repeaters).toBe(2);       // le booking 2 séjours + l'airbnb 2 séjours
    expect(s.leadsSansSejour.count).toBe(1);      // le whatsapp ltv 0
  });

  it("ventile les captifs par canal", () => {
    const s = segmentClients(clients);
    expect(s.captifsOta.parCanal.booking).toMatchObject({ count: 2, repeaters: 1 });
    expect(s.captifsOta.parCanal.airbnb).toMatchObject({ count: 1, repeaters: 1 });
  });

  it("un client direct sans email n'est NI captif OTA NI lead (capté hors OTA)", () => {
    const s = segmentClients(clients);
    // 7 clients : 2 réactivables + 3 captifs + 1 lead = 6 rangés, le 7e (direct sans email, 1 séjour) n'est dans aucune de ces 3 cases
    expect(s.reactivables.count + s.captifsOta.count + s.leadsSansSejour.count).toBe(6);
  });

  it("gère une base vide", () => {
    const s = segmentClients([]);
    expect(s.captifsOta.count).toBe(0);
    expect(s.reactivables.count).toBe(0);
  });
});

describe("commissionOta — FAIT (CA réel × taux réel)", () => {
  const rates = { airbnbComm: (bien) => (bien === "amaryllis" ? 0.15 : 0.03), bookingComm: 0.17 };
  it("calcule la commission par canal et la part OTA", () => {
    const rev = {
      amaryllis: { airbnb: 10000, booking: 20000, direct: 30000 },
      geko:      { airbnb: 5000,  booking: 5000,  direct: 10000 },
    };
    const c = commissionOta(rev, rates);
    expect(c.airbnb).toBe(Math.round(10000 * 0.15 + 5000 * 0.03));  // 1500 + 150 = 1650
    expect(c.booking).toBe(Math.round(25000 * 0.17));               // 4250
    expect(c.total).toBe(1650 + 4250);
    // part OTA : (15000+25000) / (40000+40000) = 50%
    expect(c.partOtaPct).toBe(50);
    expect(c.tauxMoyenOta).toBeCloseTo((1650 + 4250) / 40000, 5);
  });
  it("gère un CA vide sans division par zéro", () => {
    const c = commissionOta({}, rates);
    expect(c.total).toBe(0);
    expect(c.partOtaPct).toBe(0);
    expect(c.tauxMoyenOta).toBe(0);
  });
});

describe("projectionReactivation — HYPOTHÈSE bornée", () => {
  it("calcule l'économie annuelle projetée", () => {
    // 20 repeaters captifs, 600€/séjour, 15% réactivés, commission 17%
    expect(projectionReactivation({ repeatersCaptifs: 20, valeurSejourMoyen: 600, tauxReactivation: 0.15, tauxCommissionOta: 0.17 }))
      .toBe(Math.round(20 * 0.15 * 600 * 0.17)); // 306
  });
  it("borne le taux de réactivation à [0,1] et refuse le négatif", () => {
    expect(projectionReactivation({ repeatersCaptifs: 10, valeurSejourMoyen: 500, tauxReactivation: 2, tauxCommissionOta: 0.17 }))
      .toBe(Math.round(10 * 1 * 500 * 0.17)); // taux clampé à 1
    expect(projectionReactivation({ repeatersCaptifs: 10, valeurSejourMoyen: 500, tauxReactivation: -1, tauxCommissionOta: 0.17 }))
      .toBe(0);
  });
  it("renvoie 0 sur entrées absurdes", () => {
    expect(projectionReactivation({ repeatersCaptifs: 0, valeurSejourMoyen: 600, tauxReactivation: 0.5, tauxCommissionOta: 0.17 })).toBe(0);
    expect(projectionReactivation({ repeatersCaptifs: NaN, valeurSejourMoyen: NaN, tauxReactivation: NaN, tauxCommissionOta: NaN })).toBe(0);
  });
});

describe("computeOtaCost — assemblage fait + hypothèse", () => {
  it("sépare le coût réel (commission) de l'estimé (réactivation)", () => {
    const facts = {
      commission: { airbnb: 2620, booking: 9626, total: 12246, partOtaPct: 57, tauxMoyenOta: 0.135 },
      segment: {
        reactivables: { count: 72, ltv: 127728 },
        captifsOta: { count: 28, ltv: 20370, repeaters: 23, parCanal: {} },
        leadsSansSejour: { count: 37 },
      },
    };
    const out = computeOtaCost(facts, { valeurSejourMoyen: 600, tauxReactivation: 0.15, tauxCommissionOta: 0.17 });
    expect(out.commission.total).toBe(12246);          // fait, intact
    expect(out.captifs.repeaters).toBe(23);            // fait
    expect(out.economieProjetee).toBe(Math.round(23 * 0.15 * 600 * 0.17)); // hypothèse
    expect(out.coutTotalEstime).toBe(12246 + out.economieProjetee);
  });
});
