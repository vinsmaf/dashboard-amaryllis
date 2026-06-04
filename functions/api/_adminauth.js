// _adminauth.js — token de session signé (HMAC-SHA256), sans stockage serveur.
//
// Objectif : ne plus stocker le mot de passe admin EN CLAIR côté client.
// Au login, le serveur émet un token signé { role, exp } signé avec une clé
// secrète (le mot de passe admin lui-même). Les endpoints vérifient la
// signature + l'expiration — aucun stockage (KV/D1) nécessaire, c'est stateless.
//
// Rétro-compat : verifyBearer accepte AUSSI le mot de passe brut en Bearer
// (ancien mécanisme arch-008) tant que d'anciennes sessions existent.
//
// Format du token : v1.<base64url(payload JSON)>.<base64url(signature)>
//   payload = { r: "admin"|"menage", e: <expiration epoch secondes> }

const enc = new TextEncoder();

function b64urlEncode(bytesOrStr) {
  let bin;
  if (typeof bytesOrStr === "string") {
    bin = bytesOrStr;
  } else {
    bin = "";
    const bytes = new Uint8Array(bytesOrStr);
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecodeToStr(s) {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/");
  return atob(pad + "===".slice((pad.length + 3) % 4));
}

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return b64urlEncode(sig);
}

// Comparaison en temps constant (évite les attaques par timing)
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function resolveSecret(env) {
  return env.ADMIN_PASSWORD || env.ADMIN_PWD || "";
}

// Émet un token signé pour un rôle donné. ttlSec par défaut : 7 jours
// (12 h était trop court → onglets admin « vides » dès expiration ; le 401 force
//  désormais une ré-auth propre côté front, ce TTL réduit juste la fréquence).
export async function signSession(role, env, ttlSec = 7 * 24 * 3600) {
  const secret = resolveSecret(env);
  if (!secret) throw new Error("Secret admin non configuré");
  const payload = b64urlEncode(JSON.stringify({ r: role, e: Math.floor(Date.now() / 1000) + ttlSec }));
  const body = "v1." + payload;
  const sig = await hmac(secret, body);
  return body + "." + sig;
}

// Vérifie un Bearer. Retourne { ok, role }.
// Accepte : token signé valide, OU (rétro-compat) le mot de passe brut.
export async function verifyBearer(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return { ok: false };

  const secret = resolveSecret(env);
  if (!secret) return { ok: false };

  // 1. Token signé v1.<payload>.<sig>
  if (token.startsWith("v1.")) {
    const parts = token.split(".");
    if (parts.length !== 3) return { ok: false };
    const body = parts[0] + "." + parts[1];
    let expected;
    try { expected = await hmac(secret, body); } catch { return { ok: false }; }
    if (!safeEqual(parts[2], expected)) return { ok: false };
    let payload;
    try { payload = JSON.parse(b64urlDecodeToStr(parts[1])); } catch { return { ok: false }; }
    if (!payload || typeof payload.e !== "number" || payload.e < Math.floor(Date.now() / 1000)) {
      return { ok: false }; // expiré ou malformé
    }
    return { ok: true, role: payload.r === "menage" ? "menage" : "admin" };
  }

  // 2. Rétro-compat : mot de passe brut en Bearer
  if (env.ADMIN_PASSWORD && safeEqual(token, env.ADMIN_PASSWORD)) return { ok: true, role: "admin" };
  if (env.ADMIN_PWD && safeEqual(token, env.ADMIN_PWD)) return { ok: true, role: "admin" };
  if (env.ADMIN_PWD_MENAGE && safeEqual(token, env.ADMIN_PWD_MENAGE)) return { ok: true, role: "menage" };

  return { ok: false };
}
