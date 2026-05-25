// Cloudflare Pages Function — DELETE /api/contacts-purge
// jur-008 : RGPD — purge des contacts de plus de 2 ans (durée légale maximale).
// Endpoint protégé par Bearer token (PURGE_SECRET) — à appeler manuellement
// ou via cron-job.org une fois par mois.
//
// Secrets requis :
//   revenue_manager — binding D1
//   PURGE_SECRET    — token Bearer pour sécuriser la suppression
//
// Méthode : DELETE /api/contacts-purge
// Header requis : Authorization: Bearer <PURGE_SECRET>
// Réponse : { ok, deleted, cutoff_iso }

const TWO_YEARS_SEC = 2 * 365 * 24 * 3600; // 63 072 000 s

export async function onRequest(context) {
  const { env, request } = context;
  const method = request.method.toUpperCase();

  // ── CORS preflight ───────────────────────────────────────────────────────
  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin":  "https://dashboard-amaryllis.pages.dev",
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  // ── Méthode ───────────────────────────────────────────────────────────────
  if (method !== "DELETE") {
    return json({ error: "Méthode non autorisée — utiliser DELETE" }, 405);
  }

  // ── Auth Bearer ───────────────────────────────────────────────────────────
  const secret = env.PURGE_SECRET;
  if (!secret) return json({ error: "PURGE_SECRET non configuré" }, 503);

  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (token !== secret) {
    return json({ error: "Non autorisé" }, 401);
  }

  // ── Purge D1 ──────────────────────────────────────────────────────────────
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  const cutoff = Math.floor(Date.now() / 1000) - TWO_YEARS_SEC;

  try {
    // Compter d'abord pour le rapport
    const { results: toDelete } = await db.prepare(
      "SELECT id FROM contacts WHERE created_at < ?"
    ).bind(cutoff).all();

    const count = toDelete?.length ?? 0;

    if (count > 0) {
      await db.prepare(
        "DELETE FROM contacts WHERE created_at < ?"
      ).bind(cutoff).run();
    }

    const cutoffIso = new Date(cutoff * 1000).toISOString().slice(0, 10);
    console.log(`[contacts-purge] ${count} contact(s) supprimé(s) antérieurs au ${cutoffIso}`);

    return json({
      ok: true,
      deleted: count,
      cutoff_iso: cutoffIso,
      message: count > 0
        ? `${count} contact(s) antérieur(s) au ${cutoffIso} supprimé(s) (RGPD — 2 ans max)`
        : `Aucun contact à purger (seuil : ${cutoffIso})`,
    });

  } catch (err) {
    console.error("[contacts-purge] erreur:", err);
    return json({ error: err.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "https://dashboard-amaryllis.pages.dev",
    },
  });
}
