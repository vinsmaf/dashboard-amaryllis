// Cloudflare Pages Function — POST /api/concierge
// I-10 — Concierge IA qui AGIT (pas qui répond).
//
// Différence avec /api/chat et /api/whatsapp : ceux-ci RÉPONDENT (FAQ, guide statique).
// Celui-ci a le contexte réel du séjour ET peut déclencher une action.
//
// ── Garde-fous (décidés avec Vincent le 2026-07-17) ──────────────────────────
//  · Défaut = shadow : rien de réel ne part tant que CONCIERGE_MODE=live n'est pas posé.
//  · UNE SEULE action exécutable en live : le code promo. Aucun argent ne sort du compte
//    (remise sur un futur séjour), plafonné, nominatif, usage unique, réversible.
//  · Remboursement / intervention / service : PROPOSÉS seulement, poussés en ntfy.
//  · Le LLM ne décide rien : il émet une intention JSON, `decideAction` (logique pure,
//    23 tests dont adversariaux) tranche. La validation est du code, pas une promesse du modèle.
//  · Kill-switch : CONCIERGE_DISABLED=1|true.
//
// Cohérent avec les 3 précédents du projet : RM advisory-only · agents-execute dégrade
// tout ce qui n'est pas explicitement sûr · SOCIAL_BOT_MODE=shadow par défaut.

import { verifyBearer } from "./_adminauth.js";
import { callLLM } from "./_llm.js";
import { resolveGuestContext, contextSummary } from "./_guestContext.js";
import {
  decideAction, parseIntent, isDisabled, conciergeMode, maxPromoEur, ACTIONS,
} from "../../src/utils/conciergeRules.js";

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
  });

async function ensureLog(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS concierge_log (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      phone        TEXT,
      email        TEXT,
      bien_id      TEXT,
      booking_ref  TEXT,
      message      TEXT,
      intent       TEXT,
      action       TEXT,
      executed     INTEGER NOT NULL DEFAULT 0,
      escalated    INTEGER NOT NULL DEFAULT 0,
      reason       TEXT,
      result       TEXT,
      mode         TEXT,
      created_at   INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_concierge_created ON concierge_log(created_at)").run();
}

async function notifyHost(env, { title, body, priority = "default" }) {
  if (!env.NTFY_TOPIC) return;
  try {
    await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain; charset=utf-8", Title: title, Priority: priority, Tags: "bellhop_bell" },
      body,
    });
  } catch { /* best-effort, comme partout dans le projet */ }
}

const SYSTEM_PROMPT = `Tu es le concierge d'Amaryllis Locations (locations saisonnières, Martinique + Nogent-sur-Marne).
Tu analyses le message d'un voyageur et tu décides d'UNE action.

Réponds UNIQUEMENT en JSON, sans texte autour :
{"action":"...","message":"...","amountEur":N,"category":"...","rationale":"..."}

Actions possibles :
- "reply_only"   : une simple réponse suffit (question, info pratique). Mets ta réponse dans "message".
- "promo_code"   : un geste commercial est justifié (désagrément réel et avéré subi par le voyageur).
                   "amountEur" = montant proportionné au préjudice. Réserve-le aux vrais désagréments,
                   pas à une simple question ni à une insatisfaction vague.
- "refund"       : un remboursement est justifié (préjudice grave). "amountEur" = montant.
- "intervention" : un prestataire doit intervenir. "category" parmi : plomberie, electricite, menage,
                   piscine, jardinage, serrurerie, autre.
- "escalate"     : cas ambigu, grave, agressif, ou qui engage l'entreprise. Dans le doute, escalade.

Règles :
- Sois honnête : si tu n'es pas sûr, escalade. Ne devine jamais un code d'accès ni une info que tu n'as pas.
- Ne promets JAMAIS un remboursement ou une intervention : ce n'est pas toi qui décides, tu proposes.
- "rationale" : une phrase, en français, expliquant ton choix.
- Le ton de "message" : chaleureux, vouvoiement, direct, sans excuses excessives.`;

export async function onRequestPost(context) {
  const { request, env } = context;

  // Auth AVANT le kill-switch (même ordre que guide-write.js / editorial-gate.js).
  const url = new URL(request.url);
  const secretOk = !!env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  if (!secretOk) {
    const { ok } = await verifyBearer(request, env);
    if (!ok) return json({ error: "Non autorisé" }, 401);
  }

  // Kill-switch : ok:true (ce n'est pas une erreur — l'appelant ne doit ni retenter ni alerter).
  if (isDisabled(env)) {
    return json({ ok: true, disabled: true, message: "Concierge désactivé (kill-switch)" });
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const { phone, email, message } = body;
  if (!message || typeof message !== "string" || !message.trim()) {
    return json({ error: "message requis" }, 400);
  }

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  const mode = conciergeMode(env);
  const maxPromo = maxPromoEur(env);
  const dry = url.searchParams.get("dry") === "1";

  // ── 1. Contexte réel : qui parle, où loge-t-il ? ──
  const ctx = await resolveGuestContext(db, { phone, email });
  const summary = contextSummary(ctx);

  // ── 2. Le LLM propose une intention (il ne décide pas) ──
  const llm = await callLLM(env, {
    tier: "medium",
    logSource: "concierge",
    max_tokens: 500,
    temperature: 0.3,
    responseFormat: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `CONTEXTE :\n${summary}\n\nMESSAGE DU VOYAGEUR :\n${message.trim()}` },
    ],
  });

  if (!llm.ok) {
    // LLM indisponible : on n'improvise pas sur un vrai voyageur, on remonte à Vincent.
    await notifyHost(env, {
      title: "🛎️ Concierge — LLM indisponible",
      body: `Message non traité :\n${message.slice(0, 300)}`,
      priority: "high",
    });
    return json({ ok: false, error: "LLM indisponible", escalated: true }, 200);
  }

  const intent = parseIntent(llm.text);

  // ── 3. LA décision : logique pure, testée, pas le modèle ──
  const decision = decideAction(intent, {
    mode: dry ? "shadow" : mode,
    maxPromoEur: maxPromo,
    hasGuest: !!ctx.guest?.email,
    hasBooking: !!ctx.booking,
  });

  // ── 4. Exécution (uniquement promo) ou escalade ──
  let result = null;
  if (decision.execute && decision.action === ACTIONS.PROMO) {
    result = await emitPromo(env, url.origin, ctx, decision.params);
  }

  if (decision.escalate) {
    const who = ctx.booking ? `${ctx.booking.voyageur} — ${ctx.booking.bien_nom || ctx.booking.bien_id}` : "Voyageur non identifié";
    await notifyHost(env, {
      title: `🛎️ Concierge — ${decision.action} à valider`,
      body: [
        who,
        `Message : ${message.slice(0, 200)}`,
        `Proposition : ${decision.action}${decision.params?.amountEur ? ` ${decision.params.amountEur}€` : ""}`,
        `Motif : ${decision.reason}`,
      ].join("\n"),
      priority: decision.action === ACTIONS.ESCALATE ? "high" : "default",
    });
  }

  // ── 5. Trace (waitUntil : ne pas retarder la réponse au voyageur) ──
  context.waitUntil((async () => {
    try {
      await ensureLog(db);
      await db.prepare(`
        INSERT INTO concierge_log (phone, email, bien_id, booking_ref, message, intent, action, executed, escalated, reason, result, mode)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `).bind(
        phone || null, email || null,
        ctx.booking?.bien_id || null, ctx.booking?.payment_intent_id || null,
        message.slice(0, 1000), JSON.stringify(intent || {}), decision.action,
        decision.execute ? 1 : 0, decision.escalate ? 1 : 0,
        decision.reason, result ? JSON.stringify(result) : null, dry ? "dry" : mode
      ).run();
    } catch { /* le log ne doit jamais casser la réponse */ }
  })());

  return json({
    ok: true,
    mode: dry ? "dry" : mode,
    identified: !!ctx.booking,
    context: ctx.booking ? { bien_id: ctx.booking.bien_id, match: ctx.match } : null,
    action: decision.action,
    executed: decision.execute,
    escalated: decision.escalate,
    reason: decision.reason,
    reply: intent?.message || null,
    result,
  });
}

/**
 * Émet un code promo nominatif à usage unique. Aucun argent ne sort : c'est une remise
 * sur un FUTUR séjour. Réutilise /api/promo-codes (déjà éprouvé : validation, anti-collision).
 */
async function emitPromo(env, origin, ctx, params) {
  try {
    const res = await fetch(`${origin}/api/promo-codes?secret=${encodeURIComponent(env.POSTSTAY_SECRET || "")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "amount_eur",
        value: params.amountEur,
        validity_days: 365,
        for_email: ctx.guest?.email,
        max_uses: 1,
        note: `[concierge] ${params.note || ""}`.slice(0, 200),
      }),
    });
    const d = await res.json();
    if (!res.ok || !d.ok) return { ok: false, error: d.error || `HTTP ${res.status}` };
    return { ok: true, code: d.code || d.promo?.code, amountEur: params.amountEur };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
