// Cloudflare Pages Function — /api/agents-triage
// Triage hebdo AUTOMATIQUE du backlog des ~28 agents IA (agent_actions).
// Attrape les catégories d'erreurs bon marché à détecter sans accès repo live
// (contrairement à une passe manuelle avec accès repo, ce cron ne peut QUE raisonner
// sur des données injectées : faits biens.js, mots interdits agent_lessons, texte du
// batch, et un DIGEST STATIQUE des endpoints/onglets déjà existants) :
//   1) Mot/outil banni (table agent_lessons — Brevo, HubSpot, Slack, Jest, S3...)
//   2) Contradiction factuelle vs biens.js (prix, bookable, nombre de biens)
//   3) Doublon quasi-exact avec un autre item du même lot
//   4) Probablement déjà construit (vs _featureDigest.js — signal FAIBLE, jamais certain,
//      c'est un snapshot périodique pas une lecture live du code réel)
//
//   GET|POST /api/agents-triage?secret=POSTSTAY_SECRET   (ou token admin)
//   ?dry=1  → simule (classe + résume) sans rien écrire.
//
// Appelé par le cron Worker du lundi (runAgentsTriage). Idempotent : ne retraite
// que les items encore backlog/a-planifier/en-cours, donc relançable sans effet de bord.
// ⚠️ La catégorie 4 reste un signal FAIBLE (digest = snapshot périodique, potentiellement
// périmé) — jamais aussi fiable qu'une revue humaine/session Claude avec accès repo réel.
// Régénérer le digest : node scripts/generate-feature-digest.mjs (périodique, pas auto).

import { verifyBearer } from "./_adminauth.js";
import { callLLM } from "./_llm.js";
import { BIENS } from "./_biens.js";
import { ENDPOINTS_DIGEST, ADMIN_TABS_DIGEST } from "./_featureDigest.js";

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
    // scope='tool' UNIQUEMENT — les clichés de captions (scope='caption', ex: "mezzanine perchée")
    // sont conçus pour interdire une PHRASE dans un texte généré final, pas pour juger qu'une
    // RECOMMANDATION qui propose un thème de contenu est invalide. Mélanger les deux causait des
    // faux positifs (ex: "faire un Reel sur la vue panoramique" bloqué à tort).
    db.prepare("SELECT pattern, reason, term FROM agent_lessons WHERE scope='tool' ORDER BY created_at DESC LIMIT 60").all(),
  ]);

  if (!items || items.length === 0) {
    return json({ ok: true, analyzed: 0, blocked: 0, summary: "🧹 Triage recos : backlog vide, rien à trier. ✓" });
  }

  const bannedText = (lessons || []).length
    ? (lessons || []).map(l => `• « ${l.term || l.pattern} » — ${l.reason}`).join("\n")
    : "(aucun)";

  const list = items.map(it => `[${it.id}] (agent:${it.agent}) ${it.action}`).join("\n");

  const system = `Tu es un agent de contrôle qualité pour le backlog de recommandations IA de villamaryllis.com (location de 7 logements Martinique+Nogent). On te donne une liste d'items backlog. Ta seule tâche : repérer les items à BLOQUER pour l'une de ces 4 raisons précises, RIEN d'autre :
1) L'item mentionne un outil/framework banni (liste ci-dessous) de façon centrale à l'action.
2) L'item contredit un fait vérifié sur un bien (prix, capacité, bookable) donné ci-dessous.
3) L'item est un DOUBLON quasi-exact d'un autre item de CETTE liste (même besoin, même bien, formulation très proche).
4) L'item décrit une feature qui existe DÉJÀ très probablement, vu le nom explicite d'un endpoint ou onglet admin ci-dessous (ex: l'item demande "créer un système de X" et un endpoint/onglet nommé quasi-X existe déjà).

FAITS BIENS (source unique, jamais à contredire) :
${biensFactsText()}

OUTILS/MOTS BANNIS (jamais utilisés dans ce projet) :
${bannedText}

STACK RÉELLE : React 19+Vite, Cloudflare Pages+Functions+Worker+D1+KV, tests=Vitest (jamais Jest), email=Resend (jamais Brevo/HubSpot), alertes=ntfy (jamais Slack), aucun service AWS.

ENDPOINTS API DÉJÀ EXISTANTS (snapshot périodique, peut être légèrement périmé) :
${ENDPOINTS_DIGEST.join("\n")}

ONGLETS ADMIN DÉJÀ EXISTANTS :
${ADMIN_TABS_DIGEST.join(", ")}

RÈGLE 1 (outil banni) : ne s'applique QUE si l'item propose de littéralement UTILISER/INTÉGRER l'outil (ex: "via HubSpot", "trigger Brevo") — PAS si le mot apparaît sans rapport ou par association vague.
RÈGLE 2 (fait bien) : ne s'applique QUE si l'item affirme un chiffre/statut qui contredit DIRECTEMENT et sans ambiguïté un fait ci-dessus (prix exact différent, bookable=false utilisé pour une action de réservation/conversion) — pas une simple mention du nom du bien.
RÈGLE 4 (déjà construit) : signal FAIBLE, sois TRÈS conservateur — ne l'utilise QUE si le nom de l'endpoint/onglet correspond de façon quasi-évidente au besoin décrit (pas une vague ressemblance thématique). En cas de doute, NE bloque PAS — un digest périmé peut aussi te tromper dans l'autre sens (un endpoint peut avoir changé de portée). Commence toujours la raison par "[digest, à re-vérifier]" pour cette règle spécifiquement, pour que ce soit distingué visuellement des 3 autres règles (plus fiables).

Ne bloque JAMAIS un item par excès de prudence — en cas de doute, laisse-le. Ne juge PAS la qualité créative/business d'un item (ça reste la décision de Vincent). N'inclus dans le tableau QUE les items que tu bloques réellement — si tu écris toi-même dans ta raison "pas de problème"/"pas de blocage"/"correct ici"/"légitime", alors NE L'INCLUS PAS dans le tableau, laisse-le simplement de côté. Réponds UNIQUEMENT par un tableau JSON, un objet par item à bloquer : [{"id":"...","reason":"raison précise et courte en français, affirmative, jamais hésitante"}]. Tableau vide si rien à bloquer. Aucun texte autour.`;

  const llm = await callLLM(env, {
    tier: "medium",
    messages: [{ role: "system", content: system }, { role: "user", content: list }],
    logSource: "agents-triage",
    timeoutMs: 25000,
  });
  const verdicts = extractJsonArray(llm.text) || [];
  const known = new Set(items.map(it => it.id));
  // Garde-fou : rejette tout verdict dont le raisonnement se contredit lui-même
  // (le LLM inclut parfois un item dans le tableau "à bloquer" tout en écrivant
  // dans sa propre raison que ce n'est pas un problème — trouvé en dry-run le 2026-07-03).
  const HEDGE_RE = /pas de (probl[eè]me|blocage|souci)|pas exactement|l[ée]gitime ici|correct ici|aucun souci/i;
  let toBlock = verdicts.filter(v => v && v.id && known.has(v.id) && v.reason && !HEDGE_RE.test(v.reason));
  // Garde-fou : si plus de 30% du lot serait bloqué d'un coup, quelque chose s'est mal passé
  // côté LLM (halluciné/dérapé) — on n'applique rien plutôt que de risquer un dégât en masse.
  const capExceeded = toBlock.length > Math.ceil(items.length * 0.3);
  if (capExceeded) toBlock = [];

  if (!dry && !capExceeded) {
    for (const v of toBlock) {
      const isWeakSignal = /^\[digest, à re-vérifier\]/i.test(v.reason);
      if (isWeakSignal) {
        // Signal faible (règle 4, digest potentiellement périmé) : on annote SANS bloquer —
        // l'item reste visible dans le backlog actif, juste avec un indice à vérifier.
        await db.prepare("UPDATE agent_actions SET notes=?, updated_at=unixepoch() WHERE id=?")
          .bind(`🔎 ${String(v.reason).slice(0, 300)}`, v.id).run();
      } else {
        await db.prepare("UPDATE agent_actions SET status='bloqué', notes=?, updated_at=unixepoch() WHERE id=?")
          .bind(`[triage auto] ${String(v.reason).slice(0, 300)}`, v.id).run();
      }
    }
  }

  const blocked = toBlock.filter(v => !/^\[digest, à re-vérifier\]/i.test(v.reason));
  const flagged = toBlock.filter(v => /^\[digest, à re-vérifier\]/i.test(v.reason));
  const top = toBlock.slice(0, 8).map(v => `  • [${v.id}] ${v.reason}`).join("\n");
  const summary = capExceeded
    ? `🧹 Triage recos — ${items.length} analysés : ⚠️ ABANDONNÉ (le LLM voulait bloquer plus de 30% du lot d'un coup, probable dérapage — rien appliqué, à vérifier manuellement).`
    : `🧹 Triage recos — ${items.length} analysé${items.length > 1 ? "s" : ""} : ${blocked.length} bloqué${blocked.length > 1 ? "s" : ""}, ${flagged.length} signalé${flagged.length > 1 ? "s" : ""} (à re-vérifier).` + (top ? `\n${top}` : "");

  return json({ ok: true, dry, analyzed: items.length, blocked: blocked.length, flagged: flagged.length, cap_exceeded: capExceeded, llm_provider: llm.provider, summary });
}
