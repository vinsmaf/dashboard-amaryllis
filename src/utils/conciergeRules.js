// I-10 — Concierge : garde-fous et décision d'action (logique pure, testée).
//
// PRINCIPE FONDATEUR (décidé avec Vincent le 2026-07-17, cohérent avec les 3 précédents
// du projet : RM advisory-only · agents-execute qui dégrade tout ce qui n'est pas sûr ·
// SOCIAL_BOT_MODE en shadow par défaut) :
//
//     LE DÉFAUT EST DE PROPOSER, PAS D'EXÉCUTER.
//
// Une seule action est exécutable en live au démarrage : le CODE PROMO. Raison : aucun
// argent ne sort du compte (c'est une remise sur un futur séjour), c'est plafonné,
// nominatif, à usage unique, traçable et réversible. Tout le reste — remboursement,
// intervention prestataire, geste sur argent réel — est seulement PROPOSÉ et poussé à
// Vincent pour validation.
//
// ⚠️ Le LLM ne décide RIEN ici. Il produit une intention structurée (json_object) ; ce
// module la valide et tranche. La validation est du code qu'on contrôle, pas une promesse
// du modèle. (Le projet n'utilise le tool-calling nulle part et _llm.js envoie le même
// body à 7 providers — l'ajouter casserait la cascade pour un gain nul ici.)

/** Actions que le concierge peut envisager. Toute intention hors de cette liste est rejetée. */
export const ACTIONS = {
  PROMO: "promo_code",
  REFUND: "refund",
  INTERVENTION: "intervention",
  SERVICE: "service",
  REPLY_ONLY: "reply_only",
  ESCALATE: "escalate",
};

/** Seule action autorisée à s'exécuter réellement au démarrage. */
export const LIVE_ACTIONS = new Set([ACTIONS.PROMO, ACTIONS.REPLY_ONLY]);

/** Plafond par défaut d'un geste promo, en euros. Surchargeable par CONCIERGE_MAX_PROMO_EUR. */
export const DEFAULT_MAX_PROMO_EUR = 50;

/**
 * Décide ce qu'on fait d'une intention produite par le LLM.
 * Retourne { action, execute, reason, params, escalate }.
 *  - execute=true  → à exécuter réellement (uniquement promo/reply, en mode live)
 *  - execute=false → à proposer à Vincent (ntfy), jamais exécuté
 *
 * `intent` : { action, amountEur?, message?, category?, rationale? } (sortie LLM, non fiable)
 * `ctx`    : { mode, maxPromoEur, hasGuest, hasBooking }
 */
export function decideAction(intent, ctx = {}) {
  const {
    mode = "shadow",
    maxPromoEur = DEFAULT_MAX_PROMO_EUR,
    hasGuest = false,
    hasBooking = false,
  } = ctx;

  const action = intent?.action;

  // Intention inconnue / absente → on n'invente rien, on escalade.
  if (!action || !Object.values(ACTIONS).includes(action)) {
    return {
      action: ACTIONS.ESCALATE,
      execute: false,
      escalate: true,
      reason: `Intention non reconnue (${action || "vide"}) — escalade par défaut`,
      params: {},
    };
  }

  if (action === ACTIONS.ESCALATE) {
    return { action, execute: false, escalate: true, reason: intent.rationale || "Escalade demandée par l'agent", params: {} };
  }

  // Répondre est toujours permis (c'est ce que le bot fait déjà aujourd'hui).
  if (action === ACTIONS.REPLY_ONLY) {
    return {
      action,
      execute: mode === "live",
      escalate: false,
      reason: mode === "live" ? "Réponse simple" : "Shadow : réponse non envoyée",
      params: { message: intent.message || "" },
    };
  }

  // ── Actions à enjeu : jamais exécutées au démarrage, seulement proposées ──
  if (!LIVE_ACTIONS.has(action)) {
    return {
      action,
      execute: false,
      escalate: true,
      reason: `Action « ${action} » hors périmètre live — proposée à Vincent`,
      params: sanitizeParams(action, intent),
    };
  }

  // ── PROMO : la seule action à enjeu autorisée en live, sous conditions strictes ──
  if (action === ACTIONS.PROMO) {
    // Un geste doit être nominatif : sans voyageur identifié, on ne peut ni le cibler
    // ni le tracer — donc on escalade plutôt que d'émettre un code dans le vide.
    if (!hasGuest) {
      return {
        action, execute: false, escalate: true,
        reason: "Voyageur non identifié — un geste doit être nominatif",
        params: {},
      };
    }
    if (!hasBooking) {
      return {
        action, execute: false, escalate: true,
        reason: "Aucune réservation rattachée — geste non justifiable",
        params: {},
      };
    }

    const amount = Number(intent.amountEur);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { action, execute: false, escalate: true, reason: "Montant de geste invalide", params: {} };
    }
    if (amount > maxPromoEur) {
      // On n'écrête PAS en silence : un dépassement est un signal de gravité,
      // c'est justement le cas où Vincent doit trancher lui-même.
      return {
        action, execute: false, escalate: true,
        reason: `Geste de ${amount}€ au-delà du plafond de ${maxPromoEur}€ — décision de Vincent`,
        params: { amountEur: amount },
      };
    }

    return {
      action,
      execute: mode === "live",
      escalate: mode !== "live",
      reason: mode === "live" ? `Geste de ${amount}€ dans le plafond (${maxPromoEur}€)` : "Shadow : geste non émis",
      params: { amountEur: amount, note: String(intent.rationale || "").slice(0, 200) },
    };
  }

  return { action, execute: false, escalate: true, reason: "Cas non couvert — escalade", params: {} };
}

function sanitizeParams(action, intent) {
  if (action === ACTIONS.REFUND) {
    const a = Number(intent.amountEur);
    return { amountEur: Number.isFinite(a) && a > 0 ? a : null };
  }
  if (action === ACTIONS.INTERVENTION) {
    return { categorie: typeof intent.category === "string" ? intent.category : "autre" };
  }
  if (action === ACTIONS.SERVICE) {
    return { serviceId: typeof intent.serviceId === "string" ? intent.serviceId : null };
  }
  return {};
}

/**
 * Parse la sortie LLM en intention. Le modèle est faillible : on ne lui fait confiance
 * ni sur le format (il enrobe souvent le JSON de texte) ni sur le contenu (validé par
 * decideAction juste après).
 */
export function parseIntent(text) {
  if (!text || typeof text !== "string") return null;
  try {
    return JSON.parse(text);
  } catch { /* le modèle a bavardé autour du JSON → on tente d'extraire l'objet */ }
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

/** Kill-switch, même convention que le reste du projet (guide-write, editorial-gate).
 *  ⚠️ social-webhook n'accepte que "1" et raterait un `=true` posé en urgence — on accepte les deux. */
export function isDisabled(env) {
  const v = env?.CONCIERGE_DISABLED;
  return v === "1" || v === "true";
}

/** Mode : shadow (défaut, ne fait rien de réel) | live. Défaut prudent, comme SOCIAL_BOT_MODE. */
export function conciergeMode(env) {
  return env?.CONCIERGE_MODE === "live" ? "live" : "shadow";
}

/** Plafond promo, borné : ni négatif, ni délirant même si la variable d'env est mal saisie. */
export function maxPromoEur(env) {
  const v = Number(env?.CONCIERGE_MAX_PROMO_EUR);
  if (!Number.isFinite(v) || v <= 0) return DEFAULT_MAX_PROMO_EUR;
  return Math.min(v, 200);
}
