// Cloudflare Pages Function — /api/agents-triage
// Triage hebdo AUTOMATIQUE du backlog des ~28 agents IA (agent_actions).
// Attrape les catégories d'erreurs bon marché à détecter sans accès repo live
// (contrairement à une passe manuelle avec accès repo, ce cron ne peut QUE raisonner
// sur des données injectées : faits biens.js, mots interdits agent_lessons, texte du
// batch, un DIGEST STATIQUE des endpoints/onglets déjà existants, et une requête LIVE
// des articles de blog publiés) :
//   1) Mot/outil banni (table agent_lessons — Brevo, HubSpot, Slack, Jest, S3...)
//   2) Contradiction factuelle vs biens.js (prix, bookable, nombre de biens)
//   3) Doublon quasi-exact avec un autre item du même lot
//   4) Probablement déjà construit (vs _featureDigest.js — signal FAIBLE, jamais certain,
//      c'est un snapshot périodique pas une lecture live du code réel)
//   5) Entité/bien/client halluciné — mentionne une entreprise/propriété qui n'existe pas
//      dans le portefeuille réel (ex: "GreenTech" — trouvé le 2026-07-05, marqué "fait" à
//      tort alors qu'aucune entité pareille n'existe. RÈGLE 2 ne le catchait pas : elle ne
//      couvre que les contradictions de FAITS sur un bien réel, pas une entité inventée).
//   6) Contenu déjà publié — l'item propose un article de blog qui couvre un sujet déjà
//      traité par un article PUBLIÉ existant (requête live `seo_articles`, pas un digest
//      périmé — trouvé le 2026-07-05 sur traf-016, jamais catché par le triage).
//   7) Travail technique/sécurité déjà FAIT — l'item redemande un mécanisme déjà implémenté
//      et déployé (requête live status='fait', catégories technique/sécurité — trouvé le
//      2026-07-06 : HMAC Beds24 re-proposé 2× par l'Architecte Réseau alors que fait depuis
//      3 semaines, jamais catché par la règle 4 qui ne regarde que les endpoints/onglets).
//
//   GET|POST /api/agents-triage?secret=POSTSTAY_SECRET   (ou token admin)
//   ?dry=1  → simule (classe + résume) sans rien écrire.
//
// Appelé par le cron Worker du lundi (runAgentsTriage). Idempotent : ne retraite
// que les items encore backlog/a-planifier/en-cours, donc relançable sans effet de bord.
// ⚠️ La catégorie 4 reste un signal FAIBLE (digest = snapshot périodique, potentiellement
// périmé) — jamais aussi fiable qu'une revue humaine/session Claude avec accès repo réel.
// Régénérer le digest : node scripts/generate-feature-digest.mjs (périodique, pas auto).
// Les catégories 5 et 6 sont des requêtes LIVE (biens.js importé + D1 seo_articles), donc
// aussi fiables qu'une lecture directe — pas des signaux faibles comme la catégorie 4.

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

function articlesText(articles) {
  if (!articles || !articles.length) return "(aucun article publié)";
  return articles.map(a => `• ${a.title}${a.keywords ? ` [${a.keywords}]` : ""}`).join("\n");
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

  const [{ results: items }, { results: lessons }, { results: articles }, { results: doneItems }] = await Promise.all([
    db.prepare(
      "SELECT id, agent, action FROM agent_actions WHERE status IN ('backlog','a-planifier','en-cours') ORDER BY created_at DESC LIMIT 150"
    ).all(),
    // scope='tool' UNIQUEMENT — les clichés de captions (scope='caption', ex: "mezzanine perchée")
    // sont conçus pour interdire une PHRASE dans un texte généré final, pas pour juger qu'une
    // RECOMMANDATION qui propose un thème de contenu est invalide. Mélanger les deux causait des
    // faux positifs (ex: "faire un Reel sur la vue panoramique" bloqué à tort).
    db.prepare("SELECT pattern, reason, term FROM agent_lessons WHERE scope='tool' ORDER BY created_at DESC LIMIT 60").all(),
    // Requête LIVE (pas un digest périodique) — les articles publiés ne bougent pas assez
    // souvent pour justifier un snapshot séparé, autant lire la vérité directement.
    db.prepare("SELECT title, keywords FROM seo_articles WHERE status='published' ORDER BY created_at DESC LIMIT 150").all()
      .catch(() => ({ results: [] })),
    // Items déjà FAITS (catégories technique/sécurité — là où une reco redemande un travail déjà
    // livré, ex: HMAC Beds24 re-flaggé le 2026-07-06 alors qu'implémenté et déployé depuis le
    // 2026-06-23, arch-053/arch-054). Scopé à ces 2 catégories pour limiter la taille du prompt —
    // c'est là que le risque de re-découverte "déjà construit" est le plus fréquent.
    db.prepare("SELECT agent, action FROM agent_actions WHERE status='fait' AND category IN ('technique','securite') ORDER BY updated_at DESC LIMIT 150").all()
      .catch(() => ({ results: [] })),
  ]);

  if (!items || items.length === 0) {
    return json({ ok: true, analyzed: 0, blocked: 0, summary: "🧹 Triage recos : backlog vide, rien à trier. ✓" });
  }

  const bannedText = (lessons || []).length
    ? (lessons || []).map(l => `• « ${l.term || l.pattern} » — ${l.reason}`).join("\n")
    : "(aucun)";

  const list = items.map(it => `[${it.id}] (agent:${it.agent}) ${it.action}`).join("\n");
  const doneText = (doneItems || []).length
    ? doneItems.map(d => `• (agent:${d.agent}) ${d.action}`).join("\n")
    : "(aucun)";

  const system = `Tu es un agent de contrôle qualité pour le backlog de recommandations IA de villamaryllis.com (location de 7 logements Martinique+Nogent). On te donne une liste d'items backlog. Ta seule tâche : repérer les items à BLOQUER pour l'une de ces 7 raisons précises, RIEN d'autre :
1) L'item mentionne un outil/framework banni (liste ci-dessous) de façon centrale à l'action.
2) L'item contredit un fait vérifié sur un bien (prix, capacité, bookable) donné ci-dessous.
3) L'item est un DOUBLON quasi-exact d'un autre item de CETTE liste (même besoin, même bien, formulation très proche).
4) L'item décrit une feature qui existe DÉJÀ très probablement, vu le nom explicite d'un endpoint ou onglet admin ci-dessous (ex: l'item demande "créer un système de X" et un endpoint/onglet nommé quasi-X existe déjà).
5) L'item fait référence à une ENTREPRISE/CLIENT/PROPRIÉTÉ qui n'existe PAS dans le portefeuille réel : le seul portefeuille est les 7 biens listés ci-dessous, sous le nom commercial "Amaryllis Locations" — TOUT autre nom d'entreprise/villa/client cité comme sujet de l'action (ex: "la villa Sunset", "l'entreprise GreenTech") est une hallucination à bloquer SYSTÉMATIQUEMENT, sans exception et sans hésitation, même si le reste de l'action semble par ailleurs cohérent.
6) L'item propose de créer un article/contenu de blog sur un sujet DÉJÀ couvert par un article PUBLIÉ existant (liste ci-dessous) — même angle, même intention de recherche. Ne bloque QUE si le chevauchement est net (pas juste un thème voisin) ; un angle clairement différent sur le même thème général n'est PAS un doublon.
7) L'item redemande un travail TECHNIQUE/SÉCURITÉ déjà FAIT et déployé (liste ci-dessous, catégories technique/sécurité déjà marquées "fait") — même sujet, même mécanisme (ex: "mettre en place HMAC pour Beds24" alors qu'un item "fait" implémente déjà HMAC pour Beds24). Ne bloque que si le sujet et le mécanisme technique correspondent clairement, pas juste le même thème général (sécurité, cache, performance).

FAITS BIENS (source unique, jamais à contredire) :
${biensFactsText()}

OUTILS/MOTS BANNIS (jamais utilisés dans ce projet) :
${bannedText}

ARTICLES DE BLOG DÉJÀ PUBLIÉS (requête live seo_articles, pas un snapshot périmé) :
${articlesText(articles)}

STACK RÉELLE : React 19+Vite, Cloudflare Pages+Functions+Worker+D1+KV, tests=Vitest (jamais Jest), email=Resend (jamais Brevo/HubSpot), alertes=ntfy (jamais Slack), aucun service AWS.

ENDPOINTS API DÉJÀ EXISTANTS (snapshot périodique, peut être légèrement périmé) :
${ENDPOINTS_DIGEST.join("\n")}

ONGLETS ADMIN DÉJÀ EXISTANTS :
${ADMIN_TABS_DIGEST.join(", ")}

TRAVAUX TECHNIQUE/SÉCURITÉ DÉJÀ FAITS (requête live status='fait', pas un digest périmé) :
${doneText}

RÈGLE 1 (outil banni) : ne s'applique QUE si l'item propose de littéralement UTILISER/INTÉGRER l'outil (ex: "via HubSpot", "trigger Brevo") — PAS si le mot apparaît sans rapport ou par association vague.
RÈGLE 2 (fait bien) : ne s'applique QUE si l'item affirme un chiffre/statut qui contredit DIRECTEMENT et sans ambiguïté un fait ci-dessus (prix exact différent, bookable=false utilisé pour une action de réservation/conversion) — pas une simple mention du nom du bien.
RÈGLE 4 (déjà construit) : signal FAIBLE, sois TRÈS conservateur — ne l'utilise QUE si le nom de l'endpoint/onglet correspond de façon quasi-évidente au besoin décrit (pas une vague ressemblance thématique). En cas de doute, NE bloque PAS — un digest périmé peut aussi te tromper dans l'autre sens (un endpoint peut avoir changé de portée). Commence toujours la raison par "[digest, à re-vérifier]" pour cette règle spécifiquement, pour que ce soit distingué visuellement des 3 autres règles (plus fiables).
RÈGLE 5 (entité inventée) : règle FIABLE (pas un signal faible) — ne PAS confondre avec la règle 2. La règle 2 juge une CONTRADICTION sur un bien réel ; la règle 5 détecte un bien/client/entreprise qui n'existe pas DU TOUT dans la liste des 7. Vérifie explicitement : le sujet principal de l'action est-il un des 7 biens listés, "Amaryllis Locations" elle-même, ou une entité générique sans nom propre (ex: "les voyageurs", "un prestataire") ? Si NON — nom propre absent de la liste — bloque TOUJOURS, sans exception ni hésitation.
RÈGLE 6 (contenu déjà publié) : compare le SUJET de l'article proposé aux titres/mots-clés publiés ci-dessus. Ne bloque que si un article existant couvre déjà la même intention de recherche de façon quasi-identique (ex: proposer "avantages réservation directe villa Martinique" alors qu'un article "Réserver votre villa en Martinique en direct" existe déjà) — pas si c'est juste le même thème général (Martinique, villa) avec un angle différent (une activité précise, un lieu précis, une saison précise).
RÈGLE 7 (travail déjà fait) : règle FIABLE (requête live, pas un digest) — trouvé le 2026-07-06 : l'agent Architecte Réseau a re-proposé 2 fois "mettre en place HMAC pour Beds24" alors que c'était fait et déployé depuis 3 semaines. Compare le MÉCANISME technique précis (ex: HMAC, rate limiting, cache CDN, rotation de secret) au sujet précis (ex: quel endpoint/webhook), pas juste la catégorie générale ("sécurité"). Deux items sur le même thème mais des mécanismes différents (ex: HMAC vs rate limiting, tous deux "sécurité API") ne sont PAS un doublon.

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
