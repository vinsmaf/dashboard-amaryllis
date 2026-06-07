// functions/api/_sanitizeHtml.js
// Sanitization HTML minimale pour les emails envoyés depuis le compositeur admin.
// Strip : <script>, attributs onXXX, javascript: dans href/src.
// NE strippe PAS les tags hors whitelist en v1 — on garde la richesse du HTML
// (le user admin contrôle ce qu'il colle, pas du UGC public).
// Si on ouvre un jour la composition à des non-admins, passer à DOMPurify.

export function sanitizeHtml(html) {
  if (!html || typeof html !== "string") return "";
  let out = html;
  // 1. Stripper <script>...</script> (et leur contenu)
  out = out.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  // 2. Stripper attributs onXXX="..." et onXXX='...'
  out = out.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, "");
  out = out.replace(/\s+on\w+\s*=\s*'[^']*'/gi, "");
  // 3. Remplacer href/src javascript: par #
  out = out.replace(/(href|src)\s*=\s*"javascript:[^"]*"/gi, '$1="#"');
  out = out.replace(/(href|src)\s*=\s*'javascript:[^']*'/gi, "$1=\"#\"");
  return out;
}
