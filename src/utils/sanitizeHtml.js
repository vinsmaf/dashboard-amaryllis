// src/utils/sanitizeHtml.js
// Sanitization HTML minimale — module pur, importable par les Functions (functions/api/_sanitizeHtml.js
// re-exporte depuis ici, même pattern que src/data/biens.js) ET par le front (src/ArticlePage.jsx).
// Strip : <script>, attributs onXXX, javascript: dans href/src.
// NE strippe PAS les tags hors whitelist en v1 — pertinent pour du contenu admin-contrôlé
// (compositeur email, articles SEO édités/relus par un admin). Si le contenu devient du UGC
// public non relu, passer à DOMPurify.

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
