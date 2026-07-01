// functions/api/calendar-sync.test.js
import { describe, it, expect } from "vitest";
import { resaKey, timezoneForBien, buildMenageEvent } from "./calendar-sync.js";

describe("resaKey", () => {
  it("combine bienId et date de sortie", () => {
    expect(resaKey("amaryllis", "2026-07-10")).toBe("amaryllis|2026-07-10");
  });
});

describe("timezoneForBien", () => {
  it("renvoie Europe/Paris pour nogent", () => {
    expect(timezoneForBien("nogent")).toBe("Europe/Paris");
  });
  it("renvoie America/Martinique pour les autres biens", () => {
    expect(timezoneForBien("amaryllis")).toBe("America/Martinique");
    expect(timezoneForBien("zandoli")).toBe("America/Martinique");
  });
});

describe("buildMenageEvent", () => {
  const base = {
    bienId: "amaryllis",
    bienNom: "Villa Amaryllis",
    checkoutISO: "2026-07-10",
    checkinNextISO: "2026-07-12",
    guestOut: "Jean Dupont",
    guestIn: "Marie Martin",
    windowHours: 48,
    assigneNom: "Fatima",
    assigneEmail: "fatima@example.com",
  };

  it("construit un summary avec le nom du bien", () => {
    const event = buildMenageEvent(base);
    expect(event.summary).toBe("🧹 Ménage — Villa Amaryllis");
  });

  it("place l'event sur la date de checkout à 11h-13h heure locale", () => {
    const event = buildMenageEvent(base);
    expect(event.start).toEqual({ dateTime: "2026-07-10T11:00:00", timeZone: "America/Martinique" });
    expect(event.end).toEqual({ dateTime: "2026-07-10T13:00:00", timeZone: "America/Martinique" });
  });

  it("utilise Europe/Paris pour Nogent", () => {
    const event = buildMenageEvent({ ...base, bienId: "nogent" });
    expect(event.start.timeZone).toBe("Europe/Paris");
  });

  it("ajoute le prestataire comme attendee si un email est résolu", () => {
    const event = buildMenageEvent(base);
    expect(event.attendees).toEqual([{ email: "fatima@example.com" }]);
  });

  it("n'ajoute pas d'attendee si aucun email résolu", () => {
    const event = buildMenageEvent({ ...base, assigneEmail: null });
    expect(event.attendees).toBeUndefined();
  });

  it("inclut la fenêtre et le voyageur suivant dans la description", () => {
    const event = buildMenageEvent(base);
    expect(event.description).toContain("Sortie : Jean Dupont");
    expect(event.description).toContain("Prochaine arrivée : Marie Martin (2026-07-12)");
    expect(event.description).toContain("Fenêtre disponible : 48 h");
    expect(event.description).toContain("Assigné : Fatima");
  });

  it("indique l'absence d'arrivée suivante si nextCheckin est null", () => {
    const event = buildMenageEvent({ ...base, guestIn: null, checkinNextISO: null });
    expect(event.description).toContain("Pas d'arrivée suivante planifiée");
  });

  it("indique 'Non assigné' si aucun prestataire", () => {
    const event = buildMenageEvent({ ...base, assigneNom: null, assigneEmail: null });
    expect(event.description).toContain("Non assigné");
  });
});
