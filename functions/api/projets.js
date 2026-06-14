// functions/api/projets.js — Dashboard d'avancement des projets du SECOND CERVEAU.
// GET  /api/projets?token=RAPPORT_TOKEN        → page HTML (rend PROJETS.md stocké en D1)
// POST /api/projets?token=RAPPORT_TOKEN  body=markdown → met à jour l'état (sync depuis ~/.claude)
// Source de vérité = ~/.claude/memory/PROJETS.md (poussé ici par le cerveau). D1 = miroir d'affichage.

const TABLE = "CREATE TABLE IF NOT EXISTS brain_state (k TEXT PRIMARY KEY, v TEXT, updated_at INTEGER)";

function authed(env, url) {
  return env.RAPPORT_TOKEN && url.searchParams.get("token") === env.RAPPORT_TOKEN;
}

// Mini markdown → HTML (titres ##/###, tables |…|, **gras**, `code`, listes -, paragraphes).
function mdToHtml(md) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s) => esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
  const lines = md.split("\n");
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

const PAGE = (bodyHtml, updated) => `<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>🧠 Projets — Second cerveau</title>
<style>
:root{--bg:#0f172a;--card:#1e293b;--ink:#e2e8f0;--mut:#94a3b8;--acc:#38bdf8;--line:#334155}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,system-ui,sans-serif;padding:24px}
.wrap{max-width:860px;margin:0 auto}h1{font-size:24px;margin:0 0 4px}h2{font-size:19px;margin:28px 0 8px;color:var(--acc);border-bottom:1px solid var(--line);padding-bottom:6px}
h3{font-size:15px;margin:18px 0 6px;color:#cbd5e1}p{margin:8px 0;color:var(--ink)}blockquote{color:var(--mut);border-left:3px solid var(--line);margin:8px 0;padding:4px 12px;font-size:13px}
code{background:#0b1220;padding:1px 5px;border-radius:4px;font-size:13px;color:#7dd3fc}ul{margin:8px 0;padding-left:20px}li{margin:3px 0}
table{width:100%;border-collapse:collapse;margin:10px 0;font-size:13px}th,td{border:1px solid var(--line);padding:6px 9px;text-align:left;vertical-align:top}
th{background:#0b1220;color:var(--acc)}tr:nth-child(even) td{background:#172033}.foot{margin-top:32px;color:var(--mut);font-size:12px;text-align:center}
</style></head><body><div class="wrap">${bodyHtml}<div class="foot">🧠 Second cerveau · source : ~/.claude/memory/PROJETS.md · MAJ ${updated}</div></div></body></html>`;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!authed(env, url)) return new Response("Non autorisé", { status: 401 });
  try {
    await env.revenue_manager.prepare(TABLE).run();
    const row = await env.revenue_manager.prepare("SELECT v, updated_at FROM brain_state WHERE k='projets'").first();
    const md = row?.v || "# Projets\n\n*(Aucun état synchronisé — lance la sync depuis le cerveau.)*";
    const upd = row?.updated_at ? new Date(row.updated_at * 1000).toLocaleString("fr-FR") : "—";
    return new Response(PAGE(mdToHtml(md), upd), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (e) {
    return new Response(PAGE(`<h1>Erreur</h1><p>${e.message}</p>`, "—"), { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  if (!authed(env, url)) return Response.json({ error: "Non autorisé" }, { status: 401 });
  const md = await request.text();
  if (!md || md.length < 10) return Response.json({ error: "markdown vide" }, { status: 400 });
  await env.revenue_manager.prepare(TABLE).run();
  await env.revenue_manager.prepare(
    "INSERT INTO brain_state (k,v,updated_at) VALUES ('projets',?,unixepoch()) ON CONFLICT(k) DO UPDATE SET v=excluded.v, updated_at=excluded.updated_at"
  ).bind(md).run();
  return Response.json({ ok: true, bytes: md.length });
}
