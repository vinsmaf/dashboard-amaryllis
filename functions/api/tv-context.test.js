// functions/api/tv-context.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { onRequestGet } from "./tv-context.js";

function req(url, referer) {
  const headers = referer ? { Referer: referer } : {};
  return new Request(url, { headers });
}

function mockDb(rows) {
  return {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        all: vi.fn(async () => ({ results: rows })),
      })),
    })),
  };
}

describe("tv-context — anti-scan (audit sécurité 2026-07-15)", () => {
  beforeEach(() => { global.fetch = vi.fn(); });

  it("renvoie {} sans Referer (curl / scan direct)", async () => {
    const env = { revenue_manager: mockDb([{ bien_nom: "Appartement Nogent", voyageur: "Stéphane Martin", checkin: "2020-01-01", checkout: "2099-01-01" }]) };
    const res = await onRequestGet({ request: req("https://villamaryllis.com/api/tv-context?p=nogent"), env });
    expect(await res.json()).toEqual({});
  });

  it("renvoie {} avec un Referer d'un autre domaine", async () => {
    const env = { revenue_manager: mockDb([{ bien_nom: "Appartement Nogent", voyageur: "Stéphane Martin", checkin: "2020-01-01", checkout: "2099-01-01" }]) };
    const res = await onRequestGet({
      request: req("https://villamaryllis.com/api/tv-context?p=nogent", "https://evil.example.com/"),
      env,
    });
    expect(await res.json()).toEqual({});
  });

  it("renvoie {} avec un Referer villamaryllis.com mais hors /bienvenue", async () => {
    const env = { revenue_manager: mockDb([{ bien_nom: "Appartement Nogent", voyageur: "Stéphane Martin", checkin: "2020-01-01", checkout: "2099-01-01" }]) };
    const res = await onRequestGet({
      request: req("https://villamaryllis.com/api/tv-context?p=nogent", "https://villamaryllis.com/nogent"),
      env,
    });
    expect(await res.json()).toEqual({});
  });

  it("répond normalement avec le Referer légitime de l'écran TV (/bienvenue)", async () => {
    const env = { revenue_manager: mockDb([{ bien_nom: "Appartement Nogent", voyageur: "Stéphane Martin", checkin: "2020-01-01", checkout: "2099-01-01" }]) };
    const res = await onRequestGet({
      request: req("https://villamaryllis.com/api/tv-context?p=nogent", "https://villamaryllis.com/bienvenue/nogent"),
      env,
    });
    const data = await res.json();
    expect(data.guest).toBe("Stéphane");
    expect(data.source).toBe("direct");
  });
});
