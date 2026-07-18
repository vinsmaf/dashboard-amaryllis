// Cloudflare Pages Function — /api/backlog-verify
// I-11 — Vérificateur autonome du backlog agent_actions ("la machine tourne seule").
//
// Constat (delegation-stats.js, 2026-07-18) : "action_cochee" (Vincent coche un item
// du backlog IA "fait") est le poste #1 de sa charge manuelle — 194/318 traces sur
// 8 semaines (61%), 24,3/semaine, loin devant tout le reste. Mais le backlog réel est
// à majorité production physique/créative (photos, Reels, témoignages) — PAS vérifiable
// par une machine. Ce endpoint ne ferme QUE le sous-ensemble réellement vérifiable
// numériquement (meta SEO publiée, event GA4 vivant, schema JSON-LD présent) — le reste
// (photo/vidéo/process/jugement humain) reste et doit rester 100% manuel.
//
// Pipeline (jamais l'inverse) :
//   1. LLM classifie CHAQUE item backlog → {checkable, checkType, params} (défaut false)
//   2. normalizeClassification() REJETTE tout ce qui n'a pas un checkType reconnu + des
//      params sûrs (whitelist de path anti-SSRF, regex sur eventName/schemaType)
//   3. Un checker DÉTERMINISTE (jamais le LLM) vérifie contre la réalité déployée
//   4. Seul un checker positif ferme l'item, avec la preuve en note
//
// ⚠️ Ne PAS insérer dans action_outcomes (contrairement au PATCH manuel d'agents-actions.js) :
// cette table alimente delegation-stats.js "action_cochee", qui mesure CE QUE VINCENT FAIT
// À LA MAIN. Une fermeture autonome n'est pas une charge opérateur — l'y ajouter fausserait
// la métrique dans le sens inverse de son but (elle doit BAISSER si la délégation marche).
// Traçabilité propre : table backlog_autoverify_log + préfixe "🤖 Auto-vérifié" dans notes.
//
//   GET|POST /api/backlog-verify?secret=POSTSTAY_SECRET   (ou token admin)
//   ?dry=1 → classifie + vérifie sans rien écrire en D1.
//
// Cron Worker hebdo (lundi 6h UTC, aux côtés de bug-triage/agents-triage). Idempotent :
// ne lit que status IN ('backlog','a-planifier','à-planifier').

import { verifyBearer } from "./_adminauth.js";
import { callLLM } from "./_llm.js";
import { getAccessToken, runReportSafe, parseReport } from "./_ga4.js";
import {
  extractJsonArray,
  normalizeClassification,
  parseHtmlMeta,
  evaluateLiveMeta,
  evaluateGa4Count,
  hasJsonLdType,
  evaluateJsonLdPresence,
} from "../../src/utils/backlogVerify.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

const CANDIDATE_CATEGORIES = ["seo", "tracking", "content", "technique", "performance"];
const SITE_ORIGIN = "https://villamaryllis.com";
const BATCH_LIMIT = 30;

function buildClassifyPrompt(items) {
  const list = items.map((a) => `[${a.id}] (${a.category}) ${a.action}`).join("\n");
  return [
    {
      role: "system",
      content:
        "Tu vérifies un backlog d'actions générées par une fleet d'agents IA pour un site de " +
        "location de villas (Martinique + Nogent-sur-Marne, 7 biens). Pour CHAQUE item, décide " +
        "s'il s'agit d'un FAIT technique vérifiable NUMÉRIQUEMENT à cet instant, contre la réalité " +
        "déployée du site — PAS une tâche de production physique/créative (photo, vidéo, Reel, " +
        "témoignage, template visuel, shooting), PAS une tâche vague/stratégique/process (\"mettre " +
        "en place une stratégie\", \"définir un process\", \"créer des packages\"). Par défaut, " +
        "checkable=false si tu n'es pas certain à 100% que la preuve existe et est vérifiable sans " +
        "ambiguïté. Réponds UNIQUEMENT par un tableau JSON strict, un objet par item, dans cet ordre " +
        "exact : [{\"id\":\"...\",\"checkable\":true|false,\"checkType\":\"ga4_event\"|\"live_meta\"|" +
        "\"jsonld_schema\"|null,\"params\":{}}]. Aucun texte autour.\n\n" +
        "checkType=\"ga4_event\" → l'item dit qu'un événement GA4 précis a été ajouté/configuré. " +
        "params={\"eventName\":\"view_item_list\"} (nom exact de l'event, snake_case).\n" +
        "checkType=\"live_meta\" → l'item dit qu'un title/meta description SEO a été rédigé/optimisé " +
        "pour UNE page précise. params={\"path\":\"/mabouya\"} — path DOIT être l'un de : " +
        "/amaryllis /zandoli /iguana /geko /mabouya /schoelcher /nogent /guide-hub /\n" +
        "checkType=\"jsonld_schema\" → l'item dit qu'un schema JSON-LD précis (ex: VacationRental, " +
        "FAQPage, LocalBusiness) a été ajouté à UNE page précise. params={\"path\":\"/amaryllis\"," +
        "\"schemaType\":\"VacationRental\"} — mêmes paths que ci-dessus.\n" +
        "Si le path ou le nom d'event n'est pas identifiable avec certitude dans le texte de " +
        "l'item, réponds checkable=false.",
    },
    { role: "user", content: list },
  ];
}

async function runChecker(item, env, ga4Token) {
  const { checkType, params } = item;
  try {
    if (checkType === "ga4_event") {
      if (!ga4Token.value) return { verified: false, evidence: "GA4 indisponible (secrets manquants)" };
      const raw = await runReportSafe(ga4Token.value, env.GA4_PROPERTY_ID, {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: { filter: { fieldName: "eventName", stringFilter: { value: params.eventName } } },
      });
      const rows = parseReport(raw);
      const count = rows.reduce((s, r) => s + (r.eventCount || 0), 0);
      return evaluateGa4Count(params.eventName, count);
    }
    if (checkType === "live_meta") {
      const res = await fetch(`${SITE_ORIGIN}${params.path}`, { cf: { cacheTtl: 0 } });
      if (!res.ok) return { verified: false, evidence: `page ${params.path} inaccessible (${res.status})` };
      const html = await res.text();
      return evaluateLiveMeta(parseHtmlMeta(html));
    }
    if (checkType === "jsonld_schema") {
      const res = await fetch(`${SITE_ORIGIN}${params.path}`, { cf: { cacheTtl: 0 } });
      if (!res.ok) return { verified: false, evidence: `page ${params.path} inaccessible (${res.status})` };
      const html = await res.text();
      return evaluateJsonLdPresence(hasJsonLdType(html, params.schemaType), params.schemaType);
    }
  } catch (e) {
    return { verified: false, evidence: `erreur checker : ${e.message}` };
  }
  return { verified: false, evidence: "checkType inconnu" };
}

const LOG_DDL = `CREATE TABLE IF NOT EXISTS backlog_autoverify_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  action_id    TEXT NOT NULL,
  check_type   TEXT NOT NULL,
  params_json  TEXT NOT NULL,
  verified     INTEGER NOT NULL,
  evidence     TEXT NOT NULL,
  checked_at   INTEGER NOT NULL
)`;

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const db = env.revenue_manager;
  if (!db) return json({ ok: false, error: "D1 binding 'revenue_manager' introuvable" }, 503);

  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ ok: false, error: "Non autorisé" }, 401);

  const dry = url.searchParams.get("dry") === "1";

  const placeholders = CANDIDATE_CATEGORIES.map(() => "?").join(",");
  const { results: items } = await db.prepare(
    `SELECT id, category, action FROM agent_actions
     WHERE status IN ('backlog','a-planifier','à-planifier') AND category IN (${placeholders})
     ORDER BY id LIMIT ?`
  ).bind(...CANDIDATE_CATEGORIES, BATCH_LIMIT).all();

  if (!items || items.length === 0) {
    return json({ ok: true, scanned: 0, closed: 0, summary: "Backlog-verify : rien à scanner cette semaine." });
  }

  const llm = await callLLM(env, {
    tier: "medium",
    messages: buildClassifyPrompt(items),
    logSource: "backlog-verify",
    timeoutMs: 25000,
  }).catch((e) => ({ ok: false, text: "", errors: [e.message] }));

  const classification = normalizeClassification(extractJsonArray(llm.text) || []);
  const byId = new Map(classification.map((c) => [c.id, c]));
  const checkable = items
    .map((it) => ({ ...it, cls: byId.get(it.id) }))
    .filter((it) => it.cls?.checkable);

  if (checkable.length === 0) {
    const llmNote = llm.ok ? "aucun item numériquement vérifiable" : `LLM indisponible (${(llm.errors || []).join("; ") || "erreur inconnue"})`;
    return json({
      ok: true, scanned: items.length, classified_checkable: 0, closed: 0,
      summary: `Backlog-verify : ${items.length} items scannés, 0 fermé — ${llmNote}.`,
    });
  }

  // Jeton GA4 chargé une seule fois si au moins un item en a besoin.
  const needsGa4 = checkable.some((it) => it.cls.checkType === "ga4_event");
  const ga4Token = { value: null };
  if (needsGa4 && env.GA4_CLIENT_EMAIL && env.GA4_PRIVATE_KEY) {
    ga4Token.value = await getAccessToken(env.GA4_CLIENT_EMAIL, env.GA4_PRIVATE_KEY).catch(() => null);
  }

  const now = Math.floor(Date.now() / 1000);
  const today = new Date(now * 1000).toISOString().slice(0, 10);
  const results = [];

  if (!dry) await db.prepare(LOG_DDL).run();

  for (const it of checkable) {
    const { checkType, params } = it.cls;
    const outcome = await runChecker({ checkType, params }, env, ga4Token);
    results.push({ id: it.id, checkType, params, ...outcome });

    if (!dry) {
      await db.prepare(
        "INSERT INTO backlog_autoverify_log (action_id, check_type, params_json, verified, evidence, checked_at) VALUES (?,?,?,?,?,?)"
      ).bind(it.id, checkType, JSON.stringify(params), outcome.verified ? 1 : 0, outcome.evidence, now).run();

      if (outcome.verified) {
        await db.prepare(
          "UPDATE agent_actions SET status='fait', notes = COALESCE(notes || ' | ', '') || ?, updated_at = ? WHERE id = ?"
        ).bind(`🤖 Auto-vérifié le ${today} : ${outcome.evidence}`, now, it.id).run();
      }
    }
  }

  const closed = results.filter((r) => r.verified).length;
  return json({
    ok: true,
    dry,
    scanned: items.length,
    classified_checkable: checkable.length,
    closed,
    summary: `Backlog-verify : ${items.length} scannés, ${checkable.length} vérifiables, ${closed} fermé(s) automatiquement.`,
    results,
  });
}
