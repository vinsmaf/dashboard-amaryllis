import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { captureAttribution, getAttributionMetadata } from "../trackingAttribution.js";

// Nettoie l'état entre les tests (sessionStorage + cookies + URL).
function clearCookies() {
  document.cookie.split(";").forEach((c) => {
    const k = c.split("=")[0].trim();
    if (k) document.cookie = `${k}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}
function setUrl(search) {
  window.history.replaceState({}, "", `/${search}`);
}

describe("trackingAttribution — attribution + cookies Meta (match quality CAPI)", () => {
  beforeEach(() => { sessionStorage.clear(); clearCookies(); setUrl(""); });
  afterEach(() => { sessionStorage.clear(); clearCookies(); setUrl(""); });

  it("capture gclid → channel google + le conserve brut pour l'attribution serveur", () => {
    setUrl("?gclid=ABC123");
    captureAttribution();
    const m = getAttributionMetadata();
    expect(m.channel).toBe("google");
    expect(m.gclid).toBe("ABC123");
  });

  it("capture fbclid → channel meta + reconstruit _fbc quand le cookie est absent", () => {
    setUrl("?fbclid=FB987");
    captureAttribution();
    const m = getAttributionMetadata();
    expect(m.channel).toBe("meta");
    expect(m.fbclid).toBe("FB987");
    // _fbc reconstruit au format fb.1.<ts>.<fbclid> faute de cookie Pixel
    expect(m.fbc).toMatch(/^fb\.1\.\d+\.FB987$/);
  });

  it("lit les vrais cookies _fbp / _fbc à chaud (priorité au cookie Pixel)", () => {
    setUrl("?fbclid=FB987");
    captureAttribution();
    document.cookie = "_fbp=fb.1.111.AAA; path=/";
    document.cookie = "_fbc=fb.1.222.REALCLICK; path=/";
    const m = getAttributionMetadata();
    expect(m.fbp).toBe("fb.1.111.AAA");
    expect(m.fbc).toBe("fb.1.222.REALCLICK"); // le cookie réel l'emporte sur la reconstruction
  });

  it("accès direct sans param ni cookie → pas de fbp/fbc/gclid (objet propre)", () => {
    captureAttribution();
    const m = getAttributionMetadata();
    expect(m.fbp).toBeUndefined();
    expect(m.fbc).toBeUndefined();
    expect(m.gclid).toBeUndefined();
    expect(m.channel).toBe("direct");
  });
});
