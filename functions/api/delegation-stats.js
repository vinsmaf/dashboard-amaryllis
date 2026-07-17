// Cloudflare Pages Function — GET /api/delegation-stats
// I-09 — Runbook de délégation auto-mesuré.
//
// Répond à UNE question : « qu'est-ce que Vincent fait ENCORE à la main, et est-ce que ça baisse ? »
// Cap : délégation totale de l'opérationnel d'ici 2028.
//
// Frontière avec l'existant (vérifiée 2026-07-17) :
//   - /api/agents-stats  = observabilité de la MACHINE (coût LLM, latence, qualité, backlog agents)
//   - /api/agents-triage = qualité des PROPOSITIONS des agents
//   - celui-ci           = observabilité de l'OPÉRATEUR (les actes de Vincent). Zéro recouvrement.
//
// Lecture seule, agrégation SQL pure (aucun LLM). Ne lit QUE des traces déjà écrites par les
// endpoints admin existants — aucune instrumentation nouvelle, aucune surveillance ajoutée.
//
// ⚠️ Ne JAMAIS baser un signal humain sur agent_actions.updated_at : ce champ est aussi écrit
// par agents-triage (cron) et par ?action=upsert. Le marqueur humain est action_outcomes.completed_at.

import { verifyBearer } from "./_adminauth.js";
import { toEpochSeconds, computeDelegationIndex, WEEK_SEC } from "../../src/utils/delegation.js";

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
  });

// Fail-safe : une table absente (ex. config_edits avant la 1re édition de prix) ne doit pas
// faire tomber tout l'indice — on renvoie [] et on signale la source en dégradé.
async function rows(db, sql, ...binds) {
  try {
    const r = await db.prepare(sql).bind(...binds).all();
    return { ok: true, results: r?.results || [] };
  } catch (e) {
    return { ok: false, results: [], error: String(e?.message || e) };
  }
}

// Libellés lisibles + piste d'automatisation, pour que le candidat soit actionnable
// sans avoir à décoder un identifiant technique.
export const KIND_LABELS = {
  prix_journalier_edite: { label: "Prix journaliers édités", hint: "Onglet Tarifs — candidat n°1 au pilotage auto par le RM" },
  prix_rm_corrige: { label: "Prix RM corrigés à la main", hint: "Tu ne suis pas la reco : soit le modèle est à ajuster, soit une règle manque" },
  prix_rm_valide: { label: "Prix RM validés en un clic", hint: "Validation sans correction → délégable si la confiance se confirme" },
  action_cochee: { label: "Actions agents cochées « fait »", hint: "Suivi de backlog" },
  email_manuel: { label: "Emails écrits à la main", hint: "Un motif récurrent = un template ou une séquence auto" },
  reclamation_resolue: { label: "Réclamations résolues", hint: "Cible directe du concierge IA (I-10)" },
  suggestion_ackee: { label: "Suggestions ntfy traitées", hint: "Beaucoup d'« ignore » = alerte à supprimer ou à affiner" },
  lecon_agent: { label: "Leçons apprises aux agents", hint: "Dette de confiance : tu corriges encore les agents" },
  post_approuve: { label: "Posts approuvés à la main", hint: "Le gate éditorial a escaladé au lieu de trancher" },
  bug_trie: { label: "Bugs triés à la main", hint: "bug-triage automatique n'a pas suffi" },
};

export async function onRequestGet(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const secretOk = !!env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  if (!secretOk) {
    const { ok } = await verifyBearer(request, env);
    if (!ok) return json({ error: "Non autorisé" }, 401);
  }

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  const weeks = Math.min(Math.max(parseInt(url.searchParams.get("weeks") || "8", 10) || 8, 2), 26);
  const now = Math.floor(Date.now() / 1000);
  const sinceSec = now - weeks * WEEK_SEC;
  const sinceMs = sinceSec * 1000;
  // suggestion_acks.acked_at est du TEXTE en heure Martinique → on compare en texte, sur une
  // borne elle-même décalée de -4h, sinon on couperait 4h trop tôt en bordure de fenêtre.
  const sinceIsoMartinique = new Date((sinceSec - 4 * 3600) * 1000).toISOString().slice(0, 19).replace("T", " ");

  const [
    outcomes, recos, drafts, emails, reclams, acks, lessons, bugs, configEdits,
  ] = await Promise.all([
    rows(db, "SELECT completed_at FROM action_outcomes WHERE completed_at >= ?", sinceSec),
    rows(db, "SELECT reviewed_at, status FROM rm_recommendations WHERE reviewed_at IS NOT NULL AND reviewed_at >= ?", sinceMs),
    // `reviews` est du JSON en TEXT : on filtre en JS plutôt qu'avec json_extract() en SQL,
    // qui lève une erreur si une ligne contient du texte non-JSON et ferait tomber la requête.
    rows(db, "SELECT approved_at, reviews FROM agent_drafts WHERE approved_at IS NOT NULL AND approved_at >= ?", sinceSec),
    rows(db, "SELECT sent_at FROM emails_log WHERE direction='out' AND status='sent' AND template LIKE 'manual%' AND sent_at >= ?", sinceMs),
    rows(db, "SELECT resolved_at FROM reclamations WHERE resolved_at IS NOT NULL AND resolved_at >= ?", sinceSec),
    rows(db, "SELECT acked_at, status FROM suggestion_acks WHERE acked_at >= ?", sinceIsoMartinique),
    rows(db, "SELECT created_at FROM agent_lessons WHERE created_at >= ?", sinceSec),
    rows(db, "SELECT created_at FROM agent_actions WHERE category='bug' AND created_at >= ?", sinceSec),
    rows(db, "SELECT created_at, config_type FROM config_edits WHERE created_at >= ?", sinceSec),
  ]);

  const acts = [];
  const push = (kind, at, opts) => {
    const sec = toEpochSeconds(at, opts);
    if (sec != null) acts.push({ kind, at: sec });
  };

  for (const r of outcomes.results) push("action_cochee", r.completed_at);

  // 'overridden' = Vincent a corrigé le prix conseillé (jugement humain, non délégable en l'état).
  // 'approved'   = validation en un clic (délégable si la confiance se confirme).
  // Distinguer les deux est le signal le plus riche de l'indice.
  for (const r of recos.results) {
    push(r.status === "overridden" ? "prix_rm_corrige" : "prix_rm_valide", r.reviewed_at);
  }

  // Le gate éditorial écrit approved_at EXACTEMENT comme un humain (aucune colonne approved_by).
  // Seul discriminant : reviews.gate.decision='approved' + mode='live' ⇒ auto-approbation.
  for (const r of drafts.results) {
    let auto = false;
    if (r.reviews) {
      try {
        const gate = JSON.parse(r.reviews)?.gate;
        auto = gate?.decision === "approved" && gate?.mode === "live";
      } catch { /* reviews illisible → on considère l'approbation comme humaine (prudent) */ }
    }
    if (!auto) push("post_approuve", r.approved_at);
  }

  for (const r of emails.results) push("email_manuel", r.sent_at);
  for (const r of reclams.results) push("reclamation_resolue", r.resolved_at);
  for (const r of acks.results) push("suggestion_ackee", r.acked_at, { isMartiniqueLocal: true });
  for (const r of lessons.results) push("lecon_agent", r.created_at);
  for (const r of bugs.results) push("bug_trie", r.created_at);
  for (const r of configEdits.results) push("prix_journalier_edite", r.created_at);

  const index = computeDelegationIndex(acts, { now, weeks });

  // Honnêteté du chiffre : ce qu'on ne sait PAS mesurer doit être dit, pas caché.
  // Sans ça, un total bas se lirait comme « je délègue bien » alors qu'il peut juste
  // signifier « la mesure est aveugle ».
  const blindSpots = [];
  if (!configEdits.ok) {
    blindSpots.push("Édition des prix journaliers : aucune trace avant le 2026-07-17 (log ajouté à cette date) — l'historique antérieur est structurellement absent.");
  }
  blindSpots.push("Leads (table contacts) : aucun horodatage de traitement — impossible de dater tes réponses.");
  blindSpots.push("Travaux/interventions : stockés dans le navigateur (localStorage), invisibles côté serveur.");
  blindSpots.push("Emails manuels : détectés par convention de nommage (template 'manual%'), pas par contrainte — un envoi nommé autrement échappe au comptage.");

  const degraded = [
    ["action_outcomes", outcomes], ["rm_recommendations", recos], ["agent_drafts", drafts],
    ["emails_log", emails], ["reclamations", reclams], ["suggestion_acks", acks],
    ["agent_lessons", lessons], ["agent_actions", bugs], ["config_edits", configEdits],
  ].filter(([, r]) => !r.ok).map(([name, r]) => ({ source: name, error: r.error }));

  return json({
    version: 1,
    generated_at: new Date().toISOString(),
    window_weeks: weeks,
    ...index,
    labels: KIND_LABELS,
    blind_spots: blindSpots,
    ...(degraded.length ? { degraded_sources: degraded } : {}),
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" },
  });
}
