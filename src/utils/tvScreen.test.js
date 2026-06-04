// src/utils/tvScreen.test.js
import { describe, it, expect } from "vitest";
import { parseTvParams, wifiQrPayload } from "./tvScreen.js";

describe("parseTvParams", () => {
  it("retourne tv=false sans le paramètre", () => {
    expect(parseTvParams("").tv).toBe(false);
  });
  it("détecte tv=1 et extrait guest/du/au", () => {
    const p = parseTvParams("?tv=1&guest=Vincent&du=05-06&au=12-06");
    expect(p).toEqual({ tv: true, guest: "Vincent", du: "05-06", au: "12-06" });
  });
  it("guest absent => null, tv quand même true", () => {
    const p = parseTvParams("?tv=1");
    expect(p.tv).toBe(true);
    expect(p.guest).toBeNull();
  });
  it("nettoie les espaces du prénom", () => {
    expect(parseTvParams("?tv=1&guest=%20Léa%20").guest).toBe("Léa");
  });
});

describe("wifiQrPayload", () => {
  it("formate le payload WIFI standard WPA", () => {
    expect(wifiQrPayload("AmaryllisNet", "soleil972")).toBe("WIFI:T:WPA;S:AmaryllisNet;P:soleil972;;");
  });
  it("échappe les caractères spéciaux ; , : \\", () => {
    expect(wifiQrPayload("Box;A", "p:a,b")).toBe("WIFI:T:WPA;S:Box\\;A;P:p\\:a\\,b;;");
  });
  it("retourne null si ssid manquant", () => {
    expect(wifiQrPayload("", "x")).toBeNull();
  });
});
