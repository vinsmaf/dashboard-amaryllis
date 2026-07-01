// src/utils/promoCodeGen.js
// Génération de codes promo — extrait de functions/api/promo-codes.js pour être
// réutilisé par functions/api/crm-lifecycle.js (segment parrainage) sans dupliquer.

const RANDOM_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I/L

export function randomSuffix(len = 4) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += RANDOM_ALPHABET[bytes[i] % RANDOM_ALPHABET.length];
  return out;
}

export function buildPrefix(email) {
  if (!email) return "AMARYL";
  const local = String(email).split("@")[0] || "";
  const clean = local.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.slice(0, 6) || "AMARYL";
}
