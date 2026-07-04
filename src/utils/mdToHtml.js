// Mini-parser markdown → HTML, extrait de functions/api/projets.js (mêmes règles,
// gardées volontairement identiques). Supporte : # ## ### , **gras**, `code`,
// listes -/* , > citation (1 ligne = 1 blockquote), tables |...|, paragraphes.
// Ne supporte PAS : listes ordonnées, liens, images, italique, code fences, <hr>.
//
// Usage : `<div dangerouslySetInnerHTML={{ __html: mdToHtml(text) }} />` — sûr
// pour du contenu qu'on contrôle soi-même (le texte est HTML-escapé avant tout
// balisage), pas conçu pour du markdown venant d'un utilisateur non fiable.
export function mdToHtml(md) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) => esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
  const lines = String(md || "").split("\n");
  let html = "", i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^\|/.test(l) && /^\|/.test(lines[i + 1] || "") && /^[\s|:-]+$/.test(lines[i + 1])) {
      const head = l.split("|").slice(1, -1).map(c => `<th>${inline(c.trim())}</th>`).join("");
      i += 2; let rows = "";
      while (i < lines.length && /^\|/.test(lines[i])) {
        rows += "<tr>" + lines[i].split("|").slice(1, -1).map(c => `<td>${inline(c.trim())}</td>`).join("") + "</tr>";
        i++;
      }
      html += `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
      continue;
    }
    if (/^###\s/.test(l)) html += `<h3>${inline(l.replace(/^###\s/, ""))}</h3>`;
    else if (/^##\s/.test(l)) html += `<h2>${inline(l.replace(/^##\s/, ""))}</h2>`;
    else if (/^#\s/.test(l)) html += `<h1>${inline(l.replace(/^#\s/, ""))}</h1>`;
    else if (/^[-*]\s/.test(l)) {
      let items = "";
      while (i < lines.length && /^[-*]\s/.test(lines[i])) { items += `<li>${inline(lines[i].replace(/^[-*]\s/, ""))}</li>`; i++; }
      html += `<ul>${items}</ul>`; continue;
    }
    else if (/^>/.test(l)) html += `<blockquote>${inline(l.replace(/^>\s?/, ""))}</blockquote>`;
    else if (l.trim()) html += `<p>${inline(l)}</p>`;
    i++;
  }
  return html;
}
