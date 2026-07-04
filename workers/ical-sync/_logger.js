// Logger structuré JSON pour le Worker amaryllis-ical-sync (arch-monitoring,
// Architecte Réseau, MOYENNE) — miroir du pattern `clog` de functions/api/_log.js.
// Bundle esbuild séparé (pas d'import cross-repo possible), donc dupliqué ici
// à l'identique plutôt que réinventé.
//
// redactName() : filtre PII — un nom de voyageur ne doit JAMAIS apparaître en
// clair dans les logs Cloudflare (visibles via `wrangler tail` / dashboard CF).
// Ne garde que l'initiale du prénom (ex: "Jean Dupont" → "J.").

export const clog = (fn, level, data = {}) =>
  console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
    JSON.stringify({ fn, level, ...data })
  );

export function redactName(fullName) {
  if (!fullName || typeof fullName !== "string") return "?";
  const first = fullName.trim().split(/\s+/)[0];
  return first ? `${first[0].toUpperCase()}.` : "?";
}
