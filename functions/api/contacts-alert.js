// Cloudflare Pages Function — GET /api/contacts-alert
// crm-007 : alerte ntfy pour les leads > 24h sans réponse.
// Prévu pour un cron-job.org quotidien (ex: 8h matin).
// Auth : ?secret=CONTACTS_ALERT_SECRET (stocké en variable Cloudflare).
//
// Secrets requis :
//   revenue_manager   — binding D1
//   NTFY_TOPIC        — topic ntfy.sh (ex: "amaryllis-leads")
//   CONTACTS_ALERT_SECRET — clé secrète pour sécuriser l'appel cron

export async function onRequestGet(context) {
  const { env, request } = context;

  // ── Auth par secret URL ──────────────────────────────────────────────────
  const secret = env.CONTACTS_ALERT_SECRET;
  if (secret) {
    const url = new URL(request.url);
    if (url.searchParams.get("secret") !== secret) {
      return json({ error: "Non autorisé" }, 401);
    }
  }

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  const ntfyTopic = env.NTFY_TOPIC;

  try {
    // Contacts status=nouveau depuis > 24h (86400 secondes)
    const cutoff = Math.floor(Date.now() / 1000) - 86400;
    const { results } = await db.prepare(
      `SELECT id, nom, email, bien, created_at
       FROM contacts
       WHERE status = 'nouveau' AND created_at < ?
       ORDER BY created_at DESC
       LIMIT 20`
    ).bind(cutoff).all();

    if (!results || results.length === 0) {
      return json({ ok: true, pending: 0, message: "Aucun lead en attente" });
    }

    // ── Envoi ntfy ──────────────────────────────────────────────────────────
    if (ntfyTopic) {
      const lines = results.map(r => {
        const bienStr  = r.bien ? ` — ${r.bien}` : "";
        const hoursAgo = Math.round((Date.now() / 1000 - r.created_at) / 3600);
        return `• ${r.nom} (${r.email})${bienStr} · il y a ${hoursAgo}h`;
      });
      await fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Title": `⏳ ${results.length} lead(s) sans réponse depuis >24h`,
          "Priority": "default",
          "Tags": "crm,reminder",
        },
        body: lines.join("\n"),
      }).catch(e => console.error("[contacts-alert] ntfy erreur:", e.message));
    }

    return json({
      ok: true,
      pending: results.length,
      leads: results.map(r => ({ id: r.id, nom: r.nom, email: r.email, bien: r.bien || null, created_at: r.created_at })),
    });

  } catch (err) {
    console.error("[contacts-alert] erreur:", err);
    return json({ error: err.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" },
  });
}
