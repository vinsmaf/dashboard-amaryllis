// GET /api/social-growth-agent — Social Growth Manager, BRIQUE 2 : DÉCISION (advisory strict).
//
// Le « cerveau » du responsable réseaux. Croise la croissance des abonnés (brique 1 social-insights),
// l'engagement récent (meta-insights) et la cadence éditoriale à venir → synthèse LLM de recommandations
// concrètes (cadence, format, CTA-to-follow, cross-promo) par plateforme, priorisées par l'écart à la cible.
//
// Doctrine (comme l'agent budget pub) : RECOMMANDE, ne publie rien, ne dépense rien. Les garde-fous
// d'honnêteté (src/utils/socialGrowthAgent.js) écartent toute tactique d'ACHAT d'abonnés / faux
// engagement / boost payant — l'agent reste 100% organique. Aucune promesse magique.
//
// Persiste chaque analyse dans social_growth_reports (historique, lu par l'UI) + push ntfy (digest).
// Auth : ?secret=POSTSTAY_SECRET (cron)  OU  Bearer admin.  ?dry=1 : analyse sans écrire ni notifier.

import { verifyBearer } from "./_adminauth.js";
import { callLLM } from "./_llm.js";
import { buildGrowthFacts, sanitizeRecos, assembleDigest, planEditorialSlots } from "../../src/utils/socialGrowthAgent.js";
import { computeMixRatios, nextVariationType, pickConceptToIterate, buildMixInstruction } from "../../src/utils/contentMix.js";
import { ALL_BIENS } from "../../src/data/biens.js";

const json = (d, s = 200) =>
  new Response(JSON.stringify(d, null, 2), {
    status: s,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

const secretQS = (env) => encodeURIComponent(env.POSTSTAY_SECRET || "");

// Abonnés + croissance + verdict par plateforme (réutilise la brique 1, en dry pour ne pas re-persister).
async function fetchPlatforms(origin, env) {
  try {
    const r = await fetch(`${origin}/api/social-insights?dry=1&secret=${secretQS(env)}`);
    const d = await r.json();
    return Array.isArray(d?.platforms) ? d.platforms : [];
  } catch { return []; }
}

// Engagement 30j (dernier point des séries meta-insights) — signal de résonance du contenu.
async function fetchEngagement(origin, env) {
  const last = (s) => (Array.isArray(s?.series) && s.series.length ? s.series[s.series.length - 1].value : null);
  try {
    const r = await fetch(`${origin}/api/meta-insights?days=30&secret=${secretQS(env)}`);
    const d = await r.json();
    const ig = d?.instagram || {}, fb = d?.facebook || {};
    return {
      instagram: {
        reach_dernier_jour: last(ig.reach),
        saves_dernier_jour: last(ig.saves),
        profile_views: last(ig.profile_views),
        website_clicks: last(ig.website_clicks),
        followers_delta_30j: ig.delta_30j ?? null,
      },
      facebook: {
        reach_dernier_jour: last(fb.reach),
        engagements: last(fb.post_engagements),
        fans_delta_30j: fb.delta_30j ?? null,
      },
    };
  } catch { return {}; }
}

// Impact des posts déjà publiés sur les abonnés (boucle de feedback) — l'agent apprend ce qui marche.
// Retourne `digest` (résumé compact pour le prompt) + `byId` (delta par publication, gardé HORS du
// prompt : il sert à classer les concepts à ré-itérer, pas à être lu par le LLM).
async function fetchImpact(origin, env) {
  try {
    const r = await fetch(`${origin}/api/social-impact?secret=${secretQS(env)}`);
    const d = await r.json();
    if (!d?.ok) return null;
    const byId = new Map();
    for (const p of d.publications || []) {
      if (typeof p?.delta === "number") byId.set(Number(p.id), p.delta);
    }
    return {
      digest: {
        posts_agent_mesures: d.growth_agent?.completeCount ?? 0,
        abonnes_gagnes_par_post_agent: d.growth_agent?.avgDelta ?? null,
        abonnes_gagnes_par_post_tous: d.summary?.avgDelta ?? null,
        meilleur_post: d.summary?.best ? { bien: d.summary.best.bien_id, format: d.summary.best.format, delta: d.summary.best.delta } : null,
        pire_post: d.summary?.worst ? { bien: d.summary.worst.bien_id, format: d.summary.worst.format, delta: d.summary.worst.delta } : null,
      },
      byId,
    };
  } catch { return null; }
}

// État de la discipline 50/20/30 : historique classifié récent + concepts ré-itérables (classés
// par impact abonnés mesuré). Lecture D1 directe — le calendrier est déjà dans cette base.
async function fetchMixState(db, impactById) {
  const history = [], concepts = [];
  try {
    const { results: rows } = await db.prepare(`
      SELECT id, bien_id, theme, variante, variation_type, concept_id, created_at
      FROM editorial_calendar
      WHERE variation_type IS NOT NULL
      ORDER BY created_at DESC LIMIT 20
    `).all();
    const seen = new Set();
    for (const r of rows || []) {
      history.push({ variation_type: r.variation_type });
      if (!r.concept_id || seen.has(r.concept_id)) continue;
      seen.add(r.concept_id);
      concepts.push({
        concept_id: r.concept_id,
        bien_id: r.bien_id,
        theme: r.theme,
        angle: r.variante || r.theme,
        impactDelta: impactById?.has(Number(r.id)) ? impactById.get(Number(r.id)) : null,
        createdAt: Number(r.created_at) || 0,
      });
    }
  } catch { /* colonnes absentes (migration pas encore passée) → démarrage à froid */ }
  return { history, concepts };
}

// Cadence éditoriale à venir (14 j) par format — l'agent raisonne sur ce qui est déjà planifié.
async function fetchCadence(origin, env) {
  const out = { reel: 0, carrousel: 0, post: 0, total: 0 };
  // Clés "bien|YYYY-MM-DD" déjà planifiées → l'agent n'empile pas 2 posts du MÊME bien le même jour.
  // Le calendrier programme ~1 post/jour PAR BIEN (rotation sur 7 biens) : bloquer la journée entière
  // dès qu'UN bien y publie viderait toute la fenêtre de créneaux (bug vécu 2026-07-22).
  const occupied = new Set();
  try {
    const r = await fetch(`${origin}/api/editorial-calendar?secret=${secretQS(env)}`);
    const d = await r.json();
    const entries = d?.entries || [];
    const now = Math.floor(Date.now() / 1000);
    const horizon = now + 20 * 86400;
    for (const e of entries) {
      const ts = Number(e.scheduled_at || 0);
      if (ts < now || ts > horizon) continue;
      const ymd = new Date(ts * 1000).toISOString().slice(0, 10);
      if (e.bien_id) occupied.add(`${String(e.bien_id).toLowerCase()}|${ymd}`);
      const fmt = String(e.format || e.theme || "post").toLowerCase();
      if (fmt.includes("reel")) out.reel++;
      else if (fmt.includes("carrousel") || fmt.includes("carousel")) out.carrousel++;
      else out.post++;
      out.total++;
    }
  } catch { /* cadence vide si l'appel échoue */ }
  return { cadence: out, occupied };
}

const SYSTEM_PROMPT =
  `Tu es le Responsable Réseaux Sociaux d'Amaryllis Locations (villamaryllis.com — 7 locations saisonnières ` +
  `en Martinique + Nogent-sur-Marne). Objectif : faire croître RÉGULIÈREMENT les abonnés sur Facebook, ` +
  `Instagram, YouTube et Google Business Profile.\n\n` +
  `Tu es ADVISORY : tu recommandes, tu ne publies rien et tu ne dépenses rien. Sois CONCRET (actions ` +
  `exécutables cette semaine) et HONNÊTE : pas de promesse magique d'abonnés, raisonne UNIQUEMENT sur les ` +
  `chiffres réels fournis. INTERDITS ABSOLUS (ne les propose jamais) : acheter des abonnés, faux ` +
  `engagement/bots, follow-unfollow, boost payant/sponsorisation (c'est la décision de Vincent, pas la tienne). ` +
  `Ne recommande RIEN pour une plateforme dont l'état n'est pas "measurable" (ex. not_configured / pending_access) ` +
  `sauf pour dire, en 1 action, comment la rendre mesurable. Utilise les vrais identifiants fournis ` +
  `(champ "identifiant"), n'invente JAMAIS un @handle.\n\n` +
  `Rédige TOUT en FRANÇAIS (diagnostics et actions). Réponds STRICTEMENT en JSON : ` +
  `{"recos":[{"platform":"facebook|instagram|youtube|gbp","priority":"high|med|low",` +
  `"diagnosis":"1 phrase sur l'écart à la cible","actions":["3 actions organiques max, concrètes"]}],` +
  `"focus_platform":"la plateforme n°1 à travailler","one_liner":"synthèse en 1 phrase",` +
  `"content_plan":[{"bien":"amaryllis|zandoli|geko|mabouya|schoelcher","format":"reel|carrousel|post",` +
  `"theme":"inspiration|preuve|detail|reve|conversion|lifestyle|info","angle":"idée de post concrète orientée gain d'abonnés","cta":"appel à s'abonner"}]}. ` +
  `Le content_plan = 1 à 2 posts CONCRETS à AJOUTER au calendrier éditorial pour la plateforme focus ` +
  `(ils passeront par le gate qualité avant toute publication). Choisis un bien réel de la liste, un format, et un ` +
  `angle qui donne envie de s'abonner. Si le champ "impact_posts_passes" est présent, PRIVILÉGIE les ` +
  `formats/biens qui ont fait gagner le plus d'abonnés (meilleur_post) et évite ceux qui en ont fait perdre. ` +
  `IMPORTANT : propose ces 1-2 posts DÈS QU'au moins une plateforme mesurable ` +
  `n'est pas déjà "ahead" — Y COMPRIS si son verdict est "no_data" (l'historique se construit, mais l'objectif ` +
  `est de faire croître dès maintenant). content_plan VIDE UNIQUEMENT si TOUTES les plateformes mesurables sont ` +
  `déjà au-dessus de la cible.`;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: bearerOk } = await verifyBearer(request, env);
  if (!secretOk && !bearerOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 (revenue_manager) non lié" }, 500);

  // Lecture rapide du dernier rapport stocké (pour l'UI) — aucun appel LLM.
  if (url.searchParams.get("latest") === "1") {
    try {
      const row = await db
        .prepare("SELECT created_at, report FROM social_growth_reports ORDER BY created_at DESC LIMIT 1")
        .first();
      if (!row) return json({ ok: true, report: null });
      return json({ ok: true, created_at: row.created_at, report: JSON.parse(row.report) });
    } catch {
      return json({ ok: true, report: null }); // table pas encore créée / rapport absent
    }
  }

  const dry = url.searchParams.get("dry") === "1";
  const origin = env.SITE_URL || url.origin;
  const targetPct = parseFloat(env.SOCIAL_GROWTH_TARGET_PCT || "5") || 5;

  const [platforms, engagement, editorial, impact] = await Promise.all([
    fetchPlatforms(origin, env),
    fetchEngagement(origin, env),
    fetchCadence(origin, env),
    fetchImpact(origin, env),
  ]);

  if (!platforms.length) return json({ ok: false, error: "aucune donnée plateforme (social-insights indisponible)" }, 502);

  const facts = buildGrowthFacts(platforms, engagement, editorial.cadence, targetPct);
  if (impact) facts.impact_posts_passes = impact.digest; // boucle de feedback : ce qui a marché → biaise le content_plan
  const knownPlatforms = platforms.map((p) => p.platform);

  // Discipline 50/20/30 : le mix n'est PAS laissé au jugement du LLM (il dérive vers le neuf) —
  // on calcule le type sous-représenté sur l'historique réel et on le lui impose.
  const mix = await fetchMixState(db, impact?.byId);
  const mixRatios = computeMixRatios(mix.history);
  const wantedType = nextVariationType(mix.history);
  const iterateOn = wantedType === "new_concept" ? null : pickConceptToIterate(mix.concepts);
  // Une itération sans concept à itérer n'existe pas : on retombe sur du neuf (cf. buildMixInstruction).
  const variationType = iterateOn ? wantedType : "new_concept";
  const mixInstruction = buildMixInstruction(wantedType, iterateOn, mixRatios);

  // Synthèse LLM (JSON strict) — cascade multi-provider via callLLM.
  let llmRaw = null, llmError = null;
  try {
    const llm = await callLLM(env, {
      tier: "smart",
      logSource: "social-growth-agent",
      responseFormat: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Faits (chiffres réels) :\n${JSON.stringify(facts, null, 2)}\n\nDISCIPLINE DE PRODUCTION (contrainte, pas suggestion) :\n${mixInstruction}\n\nProduis le JSON de recommandations.` },
      ],
    });
    if (llm?.ok && llm.text) llmRaw = JSON.parse(llm.text);
    else llmError = "LLM indisponible ou réponse vide";
  } catch (e) {
    llmError = `parse LLM: ${String(e)}`;
  }

  const sanitized = sanitizeRecos(llmRaw || {}, knownPlatforms);
  const digest = assembleDigest(facts, sanitized);

  // Passerelle éditoriale : le content_plan de l'agent → entrées PLANNED du calendrier (elles passent
  // par le gate qualité avant toute publication). Capé, dédupliqué sur créneaux libres. Kill-switch env.
  const scheduleOff = env.SOCIAL_GROWTH_SCHEDULE === "0" || env.SOCIAL_GROWTH_SCHEDULE === "false";
  const maxSchedule = Math.max(0, parseInt(env.SOCIAL_GROWTH_MAX_SCHEDULE || "2", 10) || 0);
  const bookableBiens = new Set(ALL_BIENS.filter((b) => b.bookable).map((b) => b.id));
  const candidateDates = [];
  for (let d = 3; d <= 17; d++) { // J+3 (laisse le lead J-2 au draft-gen) → J+17
    candidateDates.push(new Date(Date.now() + d * 86400000).toISOString().slice(0, 10));
  }
  const planned = (scheduleOff || maxSchedule === 0)
    ? { slots: [], dropped: [] }
    : planEditorialSlots(llmRaw?.content_plan, { candidateDates, occupied: editorial.occupied, knownBiens: bookableBiens, maxNew: maxSchedule });

  const report = {
    generated_at: new Date().toISOString().slice(0, 16).replace("T", " "),
    target_pct: targetPct,
    facts,
    focus_platform: llmRaw?.focus_platform || sanitized.recos[0]?.platform || null,
    one_liner: String(llmRaw?.one_liner || "").slice(0, 300) || null,
    recos: sanitized.recos,
    dropped: sanitized.dropped,
    content_scheduled: planned.slots.map((s) => ({ bien_id: s.bien_id, format: s.format, date: s.scheduled_ymd, angle: s.angle })),
    content_mix: {
      historique: mixRatios.counts,
      total_classifie: mixRatios.total,
      type_demande: variationType,
      itere_sur: iterateOn ? { concept_id: iterateOn.concept_id, angle: iterateOn.angle, impact: iterateOn.impactDelta } : null,
    },
    llm_error: llmError,
  };

  if (dry) {
    return json({
      ok: true, dry: true, digest, report,
      would_schedule: planned.slots,
      would_schedule_dropped: planned.dropped, // diagnostic : pourquoi une entrée du content_plan a été écartée
      raw_content_plan: llmRaw?.content_plan ?? null, // diagnostic : ce que le LLM a réellement renvoyé (avant validation)
    });
  }

  // Persiste le rapport (historique + source de l'UI).
  await db
    .prepare(`CREATE TABLE IF NOT EXISTS social_growth_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT, created_at INTEGER NOT NULL, report TEXT NOT NULL )`)
    .run();
  await db
    .prepare("INSERT INTO social_growth_reports (created_at, report) VALUES (?, ?)")
    .bind(Math.floor(Date.now() / 1000), JSON.stringify(report))
    .run();

  // Insère les posts planifiés dans le calendrier éditorial (status 'planned' → gate qualité avant publication).
  let scheduled = 0;
  for (const s of planned.slots) {
    const ts = Math.floor(new Date(`${s.scheduled_ymd}T12:00:00Z`).getTime() / 1000);
    const photoUrl = `https://villamaryllis.com/photos/${s.bien_id}/01.webp`;
    try {
      // Une itération garde le concept_id du concept d'origine ; un nouveau concept en ouvre un.
      const conceptId = variationType === "new_concept" ? crypto.randomUUID() : iterateOn.concept_id;
      await db.prepare(`
        INSERT INTO editorial_calendar
          (scheduled_at, platform, publish_hour, bien_id, theme, variante, format, photo_url, cta, brief, status, variation_type, concept_id, created_at, updated_at)
        VALUES (?, 'both', 'FB 12h00 · IG 18h30', ?, ?, ?, ?, ?, ?, ?, 'planned', ?, ?, unixepoch(), unixepoch())
      `).bind(ts, s.bien_id, s.theme, s.angle.slice(0, 120), s.format, photoUrl, s.cta, `${s.brief} · source:growth-agent`, variationType, conceptId).run();
      scheduled++;
    } catch { /* conflit/erreur → on saute cette entrée */ }
  }

  // Push ntfy — anti-fatigue : uniquement s'il y a des recos actionnables.
  let sent = false;
  const ntfyTopic = env.NTFY_TOPIC;
  if (ntfyTopic && digest.has_recos) {
    try {
      const res = await fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: "POST",
        headers: {
          Title: digest.title,
          Priority: "3",
          Tags: "chart_with_upwards_trend",
          Actions: `view, Ouvrir Croissance audience, ${origin}/admin, clear=true`,
          "Content-Type": "text/plain; charset=utf-8",
        },
        body: digest.body,
      });
      sent = res.ok;
    } catch { /* ntfy best-effort */ }
  }

  return json({ ok: true, sent, recos: sanitized.recos.length, scheduled, dropped: sanitized.dropped.length, focus: report.focus_platform, llm_error: llmError });
}
