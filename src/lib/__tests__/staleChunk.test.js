import { describe, it, expect } from "vitest";
import { isStaleChunkError } from "../staleChunk.js";

describe("isStaleChunkError", () => {
  it("détecte les messages explicites de chunk périmé", () => {
    expect(isStaleChunkError("Failed to fetch dynamically imported module", "")).toBe(true);
    expect(isStaleChunkError("Loading chunk 42 failed", "")).toBe(true);
    expect(isStaleChunkError("ChunkLoadError: something", "")).toBe(true);
  });

  it("détecte le message générique .default UNIQUEMENT si la stack référence un asset buildé", () => {
    const msg = "Cannot read properties of undefined (reading 'default')";
    expect(isStaleChunkError(msg, "at N (https://villamaryllis.com/assets/recharts-BhV4vNSn.js:1:3704)")).toBe(true);
    expect(isStaleChunkError(msg, "at someFunction (app.js:12:3)")).toBe(false);
    expect(isStaleChunkError(msg, "")).toBe(false);
  });

  it("ne marque pas une erreur non liée comme chunk périmé", () => {
    expect(isStaleChunkError("Failed to connect to MetaMask", "chrome-extension://abc/inpage.js")).toBe(false);
    expect(isStaleChunkError("undefined is not a function", "at foo (app.js:1:1)")).toBe(false);
  });
});
