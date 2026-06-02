// apiFetch — fetch durci pour l'admin
// - timeout via AbortController (évite les onglets figés sur une API lente/morte)
// - messages d'erreur lisibles (timeout / réseau / HTTP) au lieu d'échecs silencieux
//
// Usage :
//   import { fetchJSON, ApiError } from "../lib/apiFetch";
//   try {
//     const data = await fetchJSON("/api/get-config", { timeout: 8000 });
//   } catch (e) {
//     addToast(e.message, "error");   // e.message est déjà lisible en français
//   }

export class ApiError extends Error {
  constructor(message, { kind, status } = {}) {
    super(message);
    this.name = "ApiError";
    this.kind = kind || "unknown"; // "timeout" | "network" | "http" | "parse"
    this.status = status ?? null;
  }
}

/**
 * fetch avec timeout. Lève une ApiError si le réseau échoue, si le délai est
 * dépassé ou si le statut HTTP n'est pas 2xx. Retourne l'objet Response sinon.
 */
// Injecte automatiquement le token de session admin (Bearer) sur les appels
// internes /api/* — sauf si un header Authorization est déjà fourni. Permet de
// sécuriser les endpoints serveur (verifyBearer) sans toucher chaque appelant.
function withAuth(url, opts) {
  try {
    const isInternal = typeof url === "string" && (url.startsWith("/api/") || url.includes("/api/"));
    if (!isInternal) return opts;
    const headers = new Headers(opts.headers || {});
    if (!headers.has("Authorization")) {
      const tok = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("ldb_tok") : null;
      if (tok) headers.set("Authorization", "Bearer " + tok);
    }
    return { ...opts, headers };
  } catch {
    return opts;
  }
}

/**
 * adminFetch — drop-in de `fetch` pour les appels admin : injecte automatiquement
 * le Bearer de session (ldb_tok) sur les `/api/*` et retourne la Response brute
 * (comme fetch). Pour les call-sites admin qui font `await fetch(...).json()`.
 */
export function adminFetch(url, opts = {}) {
  return fetch(url, withAuth(url, opts));
}

export async function fetchWithTimeout(url, { timeout = 12000, ...opts } = {}) {
  // Respecte un signal externe éventuel tout en ajoutant le timeout
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  if (opts.signal) {
    if (opts.signal.aborted) ctrl.abort();
    else opts.signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }
  opts = withAuth(url, opts);
  let res;
  try {
    res = await fetch(url, { ...opts, signal: ctrl.signal });
  } catch (e) {
    if (e && e.name === "AbortError") {
      throw new ApiError("Délai dépassé — le serveur ne répond pas. Réessaie.", { kind: "timeout" });
    }
    throw new ApiError("Erreur réseau — vérifie ta connexion.", { kind: "network" });
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.clone().text() || "").slice(0, 140); } catch {}
    throw new ApiError(
      `Erreur serveur (${res.status})${detail ? " — " + detail : ""}`,
      { kind: "http", status: res.status }
    );
  }
  return res;
}

/**
 * Comme fetchWithTimeout mais renvoie directement le JSON parsé.
 */
export async function fetchJSON(url, opts = {}) {
  const res = await fetchWithTimeout(url, opts);
  try {
    return await res.json();
  } catch {
    throw new ApiError("Réponse illisible du serveur.", { kind: "parse", status: res.status });
  }
}
