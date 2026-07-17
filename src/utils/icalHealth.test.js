import { describe, it, expect } from "vitest";
import { countVevents, feedSuspect } from "./icalHealth.js";

// Fragments iCal réalistes (format Airbnb/Booking).
const VEVENT_OK = `BEGIN:VEVENT
DTSTART;VALUE=DATE:20260710
DTEND;VALUE=DATE:20260715
SUMMARY:Reserved
END:VEVENT`;

const feed = (...events) => `BEGIN:VCALENDAR\nVERSION:2.0\n${events.join("\n")}\nEND:VCALENDAR`;

// Un VEVENT dont le format de date a changé (le regex DTSTART/DTEND ne matche plus) :
// c'est exactement le cas « parser mort » qu'on veut attraper.
const VEVENT_FORMAT_CASSE = `BEGIN:VEVENT
DTSTART:2026-07-10T14:00:00Z
DTEND:2026-07-15T10:00:00Z
SUMMARY:Reserved
END:VEVENT`;

describe("countVevents — volume brut avant parsing", () => {
  it("compte les VEVENT présents", () => {
    expect(countVevents(feed(VEVENT_OK, VEVENT_OK, VEVENT_OK))).toBe(3);
  });
  it("renvoie 0 sur un feed sans VEVENT (vide légitime)", () => {
    expect(countVevents(feed())).toBe(0);
    expect(countVevents("BEGIN:VCALENDAR\nEND:VCALENDAR")).toBe(0);
  });
  it("gère null / vide / non-string", () => {
    expect(countVevents(null)).toBe(0);
    expect(countVevents("")).toBe(0);
    expect(countVevents(undefined)).toBe(0);
    expect(countVevents(42)).toBe(0);
  });
});

describe("feedSuspect — parser mort vs feed vide vs feed sain", () => {
  it("SUSPECT : des VEVENT présents mais 0 nuit extraite (format changé)", () => {
    // 1 VEVENT dans le texte, mais le parseur n'a rien tiré → panne silencieuse.
    expect(feedSuspect(feed(VEVENT_FORMAT_CASSE), 0)).toBe(true);
  });

  it("PAS suspect : feed vide légitime (0 VEVENT, 0 nuit) — un bien sans résa ce canal", () => {
    expect(feedSuspect(feed(), 0)).toBe(false);
  });

  it("PAS suspect : feed sain (VEVENT présents ET nuits extraites)", () => {
    expect(feedSuspect(feed(VEVENT_OK), 5)).toBe(false);
  });

  it("PAS suspect : feed muet (text null) — déjà couvert par le degraded 'muet'", () => {
    expect(feedSuspect(null, 0)).toBe(false);
    expect(feedSuspect("", 0)).toBe(false);
  });

  it("un seul VEVENT malformé parmi des sains n'est PAS suspect (les autres produisent des nuits)", () => {
    // 3 VEVENT dont 1 cassé, mais nightsExtracted > 0 → le parseur marche.
    expect(feedSuspect(feed(VEVENT_OK, VEVENT_FORMAT_CASSE, VEVENT_OK), 10)).toBe(false);
  });

  it("robuste à un nightsExtracted non entier (Set.size est toujours un entier, mais on borne)", () => {
    expect(feedSuspect(feed(VEVENT_OK), undefined)).toBe(true); // undefined|0 === 0
    expect(feedSuspect(feed(VEVENT_OK), null)).toBe(true);
  });
});
