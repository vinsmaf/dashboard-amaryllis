// Cloudflare Pages Function — /api/code-review
// Revue de code LLM ciblée sur un DIFF (pas tout le code) : signale les bugs
// probables introduits par un changement. Pensé pour tourner au déploiement
// (scripts/deploy-pages.sh) sur `git diff`.
//
//   POST /api/code-review?secret=POSTSTAY_SECRET   body: { diff, label? }
//   ?post=1  → pousse les findings dans l'inbox bugs (kind=console, dédupliqué)
//             → ils rejoignent le triage hebdo + l'onglet 🐞 Bugs.
//
// Cadré sur le diff = peu de faux positifs, peu de tokens. L'agent PROPOSE ;
// rien n'est cassant, tout atterrit dans l'inbox pour revue humaine.

import { verifyBearer } from "./_adminauth.js";
import { callLLM } from "./_llm.js";
import { ensureClientErrorsTable, clientErrorFingerprint } from "./client-errors.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const SEVS = ["critique", "haute", "moyenne", "basse"];
const DIFF_MAX = 16000; // garde-fou tokens

function extractJsonArray(text) {
  if (!text) return null;
  const a = text.indexOf("["), b = text.lastIndexOf("]");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(text.slice(a, b + 1)); } catch { return null; }
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" } });
  if (request.method !== "POST") return json({ ok: false, error: "POST requis" }, 405);

  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ ok: false, error: "Non autorisé" }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "JSON invalide" }, 400); }
  let diff = String(body.diff || "").trim();
  if (!diff) return json({ ok: true, findings: [], note: "diff vide" });
  const truncated = diff.length > DIFF_MAX;
  if (truncated) diff = diff.slice(0, DIFF_MAX);

  const prompt = [
    { role: "system", content: "Tu es un relecteur de code senior pour un site React 19 + Cloudflare Pages Functions (location de villas). On te donne un DIFF git. Repère UNIQUEMENT les vrais BUGS probablement introduits par ce changement : régression logique, condition inversée, undefined/null non géré, await manquant, fuite/typo de variable, casse d'API, faille évidente. IGNORE le style, le formatage, les préférences. Sois conservateur : en cas de doute, n'inclus pas. Réponds UNIQUEMENT par un tableau JSON, format strict : [{\"file\":\"chemin\",\"severity\":\"critique|haute|moyenne|basse\",\"title\":\"résumé court actionnable\",\"detail\":\"explication courte + ligne si visible\"}]. Tableau vide [] si aucun bug réel. Aucun texte autour." },
    { role: "user", content: (body.label ? `Changement : ${body.label}\n\n` : "") + "```diff\n" + diff + "\n```" },
  ];

  const llm = await callLLM(env, { tier: "smart", messages: prompt, logSource: "code-review", timeoutMs: 30000 });
  let findings = extractJsonArray(llm.text) || [];
  // Normalise + borne. Exclut les verdicts "pas de bug" que le LLM met parfois
  // dans un finding au lieu de renvoyer un tableau vide (bruit dans l'inbox).
  const NO_BUG_RE = /aucun bug|aucune? (erreur|anomalie)|no bug|rien à signaler|pas de bug|r\.?a\.?s/i;
  findings = findings
    .filter(f => f && (f.title || f.detail))
    .filter(f => !NO_BUG_RE.test(`${f.title || ""} ${f.detail || ""}`))
    .slice(0, 15)
    .map(f => ({
      file: String(f.file || "?").slice(0, 120),
      severity: SEVS.includes(f.severity) ? f.severity : "moyenne",
      title: String(f.title || f.detail || "").slice(0, 160),
      detail: String(f.detail || "").slice(0, 500),
    }));

  let posted = 0;
  if (url.searchParams.get("post") === "1" && findings.length) {
    const db = env.revenue_manager;
    if (db) {
      await ensureClientErrorsTable(db);
      for (const f of findings) {
        const msg = `[revue code] ${f.file} — ${f.title}`;
        const id = await clientErrorFingerprint("console", msg, f.file);
        // upsert dédupliqué (même finding récurrent → compteur, pas de doublon)
        await db.prepare(
          "INSERT INTO client_errors (id, kind, message, stack, path, severity) VALUES (?,?,?,?,?,?) " +
          "ON CONFLICT(id) DO UPDATE SET count=count+1, last_seen=unixepoch(), severity=excluded.severity, " +
          "status=CASE WHEN status IN ('ignored','fixed') THEN status ELSE 'new' END"
        ).bind(id, "console", msg.slice(0, 600), f.detail || null, f.file, f.severity).run();
        posted++;
      }
    }
  }

  return json({ ok: true, findings, posted, truncated, provider: llm.provider });
}
