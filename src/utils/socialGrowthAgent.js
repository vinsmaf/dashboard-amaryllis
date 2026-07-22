// Logique pure — Social Growth Manager, BRIQUE 2 : DÉCISION (advisory strict).
// Assemblage des faits pour le LLM, garde-fous honnêteté sur ses recommandations, formatage du digest.
// Aucune I/O, aucun appel LLM ici : testable. L'endpoint social-growth-agent.js fait l'I/O + le callLLM.
//
// Doctrine (comme l'agent budget pub brique 2) : l'agent RECOMMANDE, il ne publie rien et ne dépense rien.
// On ne « force » pas des abonnés : les recos portent sur les leviers organiques (contenu, cadence,
// appel à s'abonner, cross-promo). Tout ce qui relève d'un ACHAT ou d'un FAUX signal est banni.

import { PLATFORM_LABELS } from "./socialGrowth.js";

// Tactiques interdites : dépense (décision de Vincent) ou triche (risque bannissement plateforme + ToS).
// Une reco qui les évoque est écartée par sanitizeRecos — l'agent reste 100% organique et honnête.
const BANNED_TACTICS = [
  /achat|acheter|buy\s+followers?|abonn[ée]s?\s+achet/i,
  /faux\s+(abonn|compte|engagement|like)|fake\s+(follow|engag|like)/i,
  /bot(s)?\b|follow[/\s-]?unfollow|follow4follow|f4f/i,
  /boost(er)?\s+pay|budget\s+pub|sponsoris|paid\s+ad|promot(e|ion)\s+pay/i,
  /giveaway\s+d['e]?\s*argent|concours\s+cash/i,
];

export function isBannedTactic(text = "") {
  const s = String(text);
  return BANNED_TACTICS.some((re) => re.test(s));
}

// Construit l'objet de FAITS déterministe donné au LLM (jamais inventé : uniquement des mesures réelles).
// platforms : sortie de social-insights (avec health/current/growth/verdict).
// engagement : { instagram:{reach_30d, saves_30d, profile_views_30d, website_clicks_30d}, facebook:{...} } (peut être partiel).
// cadence : { reel, carrousel, post, total } sur la fenêtre à venir.
export function buildGrowthFacts(platforms = [], engagement = {}, cadence = {}, targetPct = 5) {
  const measurable = platforms.filter((p) => p.health === "measurable");
  return {
    objectif_mensuel_pct: targetPct,
    plateformes: platforms.map((p) => ({
      plateforme: p.platform,
      label: PLATFORM_LABELS[p.platform] || p.platform,
      identifiant: p.extra?.username || p.extra?.name || null, // vrai handle/nom → l'agent ne l'invente pas
      etat: p.health,
      abonnes: p.current ?? null,
      croissance_30j_abs: p.growth?.delta_30d ?? null,
      croissance_30j_pct: p.growth?.growth_30d_pct ?? null,
      verdict: p.verdict,
      a_gagner_ce_mois: p.needed_monthly ?? null,
    })),
    engagement_30j: engagement || {},
    cadence_editoriale_a_venir: cadence || {},
    mesurables: measurable.map((p) => p.platform),
    non_mesurables: platforms.filter((p) => p.health !== "measurable").map((p) => p.platform),
  };
}

// Nettoie et borne la sortie LLM : ne garde que les plateformes connues, des priorités valides,
// ≤ 3 actions concrètes par reco, et ÉCARTE toute action à tactique bannie (achat/triche/dépense).
// Défensif : le LLM peut renvoyer n'importe quoi, la vérité reste déterministe.
export function sanitizeRecos(raw, knownPlatforms = []) {
  const known = new Set(knownPlatforms);
  const recos = Array.isArray(raw?.recos) ? raw.recos : [];
  const clean = [];
  const dropped = [];

  for (const r of recos) {
    const platform = String(r?.platform || "").toLowerCase();
    if (!known.has(platform)) { dropped.push({ platform, reason: "plateforme inconnue" }); continue; }
    const priority = ["high", "med", "low"].includes(r?.priority) ? r.priority : "med";
    const diagnosis = String(r?.diagnosis || "").slice(0, 400);

    const actions = (Array.isArray(r?.actions) ? r.actions : [])
      .map((a) => String(a || "").trim())
      .filter(Boolean)
      .filter((a) => {
        if (isBannedTactic(a)) { dropped.push({ platform, reason: "tactique bannie", action: a }); return false; }
        return true;
      })
      .slice(0, 3);

    if (!actions.length) continue; // une reco sans action organique valide ne sert à rien
    clean.push({ platform, priority, diagnosis, actions });
  }

  // Tri par priorité (high d'abord), max 4 recos.
  const rank = { high: 0, med: 1, low: 2 };
  clean.sort((a, b) => rank[a.priority] - rank[b.priority]);
  return { recos: clean.slice(0, 4), dropped };
}

// ── Passerelle vers le calendrier éditorial (l'agent ne se contente pas de conseiller : il ALIMENTE) ──
// Le content_plan du LLM devient des entrées PLANNED du calendrier → elles suivent le pipeline existant
// (draft-gen → gate qualité → approbation → publication). Jamais insérées 'approved' : le gate reste le garde-fou.
export const EDITORIAL_THEMES = ["inspiration", "preuve", "detail", "reve", "conversion", "lifestyle", "info"];
export const EDITORIAL_FORMATS = ["reel", "carrousel", "post"]; // pas 'story' : hors du rail d'auto-publication feed

// Valide le plan de contenu LLM et l'assigne à des créneaux (dates) LIBRES et futurs. Déterministe :
// candidateDates (futures, ordonnées) + occupied sont passés → aucun Date.now ici.
// occupied : Set de clés "bien|YYYY-MM-DD" déjà prises. Le conflit à éviter est un DOUBLON sur le
// MÊME bien le MÊME jour — le calendrier programme ~1 post/jour PAR BIEN (rotation sur 7 biens), donc
// bloquer une journée entière dès qu'un bien y publie viderait toute la fenêtre de créneaux disponibles.
export function planEditorialSlots(contentPlan, { candidateDates = [], occupied = new Set(), knownBiens = new Set(), maxNew = 2 } = {}) {
  const items = Array.isArray(contentPlan) ? contentPlan : [];
  const used = new Set(occupied);
  const slots = [];
  const dropped = [];

  for (const c of items) {
    if (slots.length >= maxNew) break;
    const bien = String(c?.bien || "").toLowerCase();
    const format = EDITORIAL_FORMATS.includes(c?.format) ? c.format : null;
    const theme = EDITORIAL_THEMES.includes(c?.theme) ? c.theme : "lifestyle";
    const angle = String(c?.angle || "").trim();
    const cta = (String(c?.cta || "").trim() || "S'abonner").slice(0, 60);

    if (!knownBiens.has(bien)) { dropped.push({ bien, reason: "bien inconnu" }); continue; }
    if (!format)              { dropped.push({ bien, reason: "format invalide" }); continue; }
    if (!angle)               { dropped.push({ bien, reason: "angle vide" }); continue; }
    if (isBannedTactic(angle) || isBannedTactic(cta)) { dropped.push({ bien, reason: "tactique bannie" }); continue; }

    const date = candidateDates.find((d) => !used.has(`${bien}|${d}`));
    if (!date) { dropped.push({ bien, reason: "aucun créneau libre pour ce bien" }); continue; }
    used.add(`${bien}|${date}`);
    slots.push({ bien_id: bien, format, theme, cta, angle, brief: `croissance — ${angle}`.slice(0, 300), scheduled_ymd: date });
  }
  return { slots, dropped };
}

// Formate le digest ntfy à partir des faits + recos nettoyées. Déterministe (pas de LLM).
export function assembleDigest(facts, recos) {
  const emoji = { high: "🔴", med: "🟡", low: "🟢" };
  const behind = facts.plateformes.filter((p) => p.verdict === "behind");
  const measurableWithData = facts.plateformes.filter((p) => p.etat === "measurable" && p.croissance_30j_pct != null);

  const headline = measurableWithData.length
    ? measurableWithData
        .map((p) => `${p.label} ${p.abonnes} (${p.croissance_30j_pct > 0 ? "+" : ""}${p.croissance_30j_pct}%/mois)`)
        .join(" · ")
    : "Historique en cours de constitution (verdicts sous ~30 j).";

  const lines = recos.recos.map((r) => {
    const label = PLATFORM_LABELS[r.platform] || r.platform;
    return `${emoji[r.priority]} ${label} — ${r.diagnosis}\n  ${r.actions.map((a) => `• ${a}`).join("\n  ")}`;
  });

  return {
    title: behind.length
      ? `📱 Réseaux — ${behind.length} plateforme${behind.length > 1 ? "s" : ""} sous l'objectif`
      : "📱 Réseaux — point croissance",
    headline,
    body: [headline, "", ...lines].join("\n").trim(),
    has_recos: recos.recos.length > 0,
  };
}
