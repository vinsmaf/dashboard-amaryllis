// Cloudflare Pages Function — /api/agents-triage
// Triage hebdo AUTOMATIQUE du backlog des ~28 agents IA (agent_actions).
// Attrape les 3 catégories d'erreurs bon marché à détecter sans lire le code réel
// (contrairement à une passe manuelle avec accès repo, ce cron ne peut QUE raisonner
// sur des données injectées : faits biens.js, mots interdits agent_lessons, texte du batch) :
//   1) Mot/outil banni (table agent_lessons — Brevo, HubSpot, Slack, Jest, S3...)
//   2) Contradiction factuelle vs biens.js (prix, bookable, nombre de biens)
//   3) Doublon quasi-exact avec un autre item du même lot
//
//   GET|POST /api/agents-triage?secret=POSTSTAY_SECRET   (ou token admin)
//   ?dry=1  → simule (classe + résume) sans rien écrire.
//
// Appelé par le cron Worker du lundi (runAgentsTriage). Idempotent : ne retraite
// que les items encore backlog/a-planifier/en-cours, donc relançable sans effet de bord.
// ⚠️ Ne remplace PAS une revue humaine/session Claude avec accès au repo — ce triage
// ne peut jamais détecter "c'est déjà codé", seulement les 3 catégories ci-dessus.

import { verifyBearer } from "./_adminauth.js";
import { callLLM } from "./_llm.js";
import { BIENS } from "./_biens.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});

function extractJsonArray(text) {
  if (!text) return null;
  const a = text.indexOf("["), b = text.lastIndexOf("]");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(text.slice(a, b + 1)); } catch { return null; }
}

function biensFactsText() {
  return Object.entries(BIENS).map(([id, b]) =>
    `${id} (${b.nom}) : ${b.type}, ${b.prix}€/nuit, ${b.capacite}p, bookable=${b.bookable}${b.bookable === false ? " (bail long, PAS réservable en courte durée)" : ""}`
  ).join("\n");
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const db = env.revenue_manager;
  if (!db) return json({ ok: false, error: "DB indisponible" }, 500);

  const secret = url.searchParams.get("secret");
  const secretOk = env.POSTSTAY_SECRET && secret === env.POSTSTAY_SECRET;
  const { ok: adminOk } = await verifyBearer(request, env);
  if (!secretOk && !adminOk) return json({ ok: false, error: "Non autorisé" }, 401);

  const dry = url.searchParams.get("dry") === "1";

  const [{ results: items }, { results: lessons }] = await Promise.all([
    db.prepare(
      "SELECT id, agent, action FROM agent_actions WHERE status IN ('backlog','a-planifier','en-cours') ORDER BY created_at DESC LIMIT 150"
    ).all(),
    db.prepare("SELECT pattern, reason, term FROM agent_lessons ORDER BY created_at DESC LIMIT 60").all(),
  ]);

  if (!items || items.length === 0) {
    return json({ ok: true, analyzed: 0, blocked: 0, summary: "🧹 Triage recos : backlog vide, rien à trier. ✓" });
  }

  const bannedText = (lessons || []).length
    ? (lessons || []).map(l => `• « ${l.term || l.pattern} » — ${l.reason}`).join("\n")
    : "(aucun)";

  const list = items.map(it => `[${it.id}] (agent:${it.agent}) ${it.action}`).join("\n");

  const system = `Tu es un agent de contrôle qualité pour le backlog de recommandations IA de villamaryllis.com (location de 7 logements Martinique+Nogent). On te donne une liste d'items backlog. Ta seule tâche : repérer les items à BLOQUER pour l'une de ces 3 raisons précises, RIEN d'autre :
1) L'item mentionne un outil/framework banni (liste ci-dessous) de façon centrale à l'action.
2) L'item contredit un fait vérifié sur un bien (prix, capacité, bookable) donné ci-dessous.
3) L'item est un DOUBLON quasi-exact d'un autre item de CETTE liste (même besoin, même bien, formulation très proche).

FAITS BIENS (source unique, jamais à contredire) :
${biensFactsText()}

OUTILS/MOTS BANNIS (jamais utilisés dans ce projet) :
${bannedText}

STACK RÉELLE : React 19+Vite, Cloudflare Pages+Functions+Worker+D1+KV, tests=Vitest (jamais Jest), email=Resend (jamais Brevo/HubSpot), alertes=ntfy (jamais Slack), aucun service AWS.

Ne bloque JAMAIS un item par excès de prudence — en cas de doute, laisse-le. Ne juge PAS la qualité créative/business d'un item (ça reste la décision de Vincent). Réponds UNIQUEMENT par un tableau JSON, un objet par item à bloquer (n'inclus PAS les items à garder) : [{"id":"...","reason":"raison précise et courte en français"}]. Tableau vide si rien à bloquer. Aucun texte autour.`;

  const llm = await callLLM(env, {
    tier: "medium",
    messages: [{ role: "system", content: system }, { role: "user", content: list }],
    logSource: "agents-triage",
    timeoutMs: 25000,
  });
  const verdicts = extractJsonArray(llm.text) || [];
  const known = new Set(items.map(it => it.id));
  const toBlock = verdicts.filter(v => v && v.id && known.has(v.id) && v.reason);

  if (!dry) {
    for (const v of toBlock) {
      await db.prepare("UPDATE agent_actions SET status='bloqué', notes=?, updated_at=unixepoch() WHERE id=?")
        .bind(`[triage auto] ${String(v.reason).slice(0, 300)}`, v.id).run();
    }
  }

  const top = toBlock.slice(0, 8).map(v => `  • [${v.id}] ${v.reason}`).join("\n");
  const summary = `🧹 Triage recos — ${items.length} analysé${items.length > 1 ? "s" : ""} : ${toBlock.length} bloqué${toBlock.length > 1 ? "s" : ""}.` + (top ? `\n${top}` : "");

  return json({ ok: true, dry, analyzed: items.length, blocked: toBlock.length, llm_provider: llm.provider, summary });
}
