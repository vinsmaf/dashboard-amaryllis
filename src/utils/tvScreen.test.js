// src/utils/tvScreen.test.js
import { describe, it, expect } from "vitest";
import { parseTvParams, wifiQrPayload, buildSlides } from "./tvScreen.js";

describe("parseTvParams", () => {
  it("retourne tv=false sans le paramètre", () => {
    expect(parseTvParams("").tv).toBe(false);
  });
  it("détecte tv=1 et extrait guest/du/au", () => {
    const p = parseTvParams("?tv=1&guest=Vincent&du=05-06&au=12-06");
    expect(p).toEqual({ tv: true, guest: "Vincent", du: "05-06", au: "12-06", slide: null });
  });
  it("extrait le slide à figer", () => {
    expect(parseTvParams("?tv=1&slide=3").slide).toBe(3);
    expect(parseTvParams("?tv=1").slide).toBeNull();
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

const GUIDE = {
  property_id: "mabouya", property_name: "Studio Mabouya", tagline: "Cocon pour deux",
  welcome_message: "Bienvenue chez vous", host_signature: "Vincent",
  wifi_ssid: "MabouyaNet", wifi_password: "jacuzzi972",
  checkout_time: "10h00", contacts: { whatsapp: "+33610880772" },
};

describe("buildSlides", () => {
  it("génère les slides de base dans l'ordre", () => {
    const s = buildSlides(GUIDE, { tv: true, guest: null });
    expect(s.map(x => x.id)).toEqual(["welcome", "wifi", "guide", "services", "practical", "rebook"]);
  });
  it("titre générique sans guest", () => {
    const s = buildSlides(GUIDE, { tv: true, guest: null });
    expect(s[0].title).toContain("Studio Mabouya");
  });
  it("titre personnalisé avec guest + dates", () => {
    const s = buildSlides(GUIDE, { tv: true, guest: "Vincent", du: "05-06", au: "12-06" });
    expect(s[0].title).toContain("Vincent");
    expect(s[0].subtitle).toContain("05-06");
  });
  it("saute le slide wifi si pas de SSID", () => {
    const s = buildSlides({ ...GUIDE, wifi_ssid: "" }, { tv: true });
    expect(s.find(x => x.id === "wifi")).toBeUndefined();
  });
  it("le slide wifi porte le payload QR", () => {
    const wifi = buildSlides(GUIDE, { tv: true }).find(x => x.id === "wifi");
    expect(wifi.qr).toBe("WIFI:T:WPA;S:MabouyaNet;P:jacuzzi972;;");
  });
});
