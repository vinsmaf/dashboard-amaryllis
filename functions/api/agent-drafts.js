// Cloudflare Pages Function — /api/agent-drafts
// Système de brouillons générés par les agents IA, en attente d'approbation humaine
// GET   ?status=pending|approved|... → liste les drafts
// POST  → créer un draft (appelé par les agents)
// PATCH ?id=N&action=approve|reject|publish → modifier le statut + exécuter
// D1 binding : revenue_manager

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const DDL = `
CREATE TABLE IF NOT EXISTS agent_drafts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  agent       TEXT NOT NULL,
  agent_label TEXT,
  agent_emoji TEXT,
  type        TEXT NOT NULL,
  payload     TEXT NOT NULL,
  rationale   TEXT,
  preview     TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',
  result      TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  approved_at INTEGER,
  published_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON agent_drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_agent  ON agent_drafts(agent);
CREATE INDEX IF NOT EXISTS idx_drafts_type   ON agent_drafts(type);
`;

async function ensureTable(db) {
  try { for (const s of DDL.split(";").filter(Boolean)) await db.prepare(s).run(); } catch {}
}

// ── Exécuteurs de drafts par type ─────────────────────────────────────────────
async function executeDraft(env, draft) {
  const payload = JSON.parse(draft.payload);

  if (draft.type === "social_post") {
    const token  = env.META_PAGE_TOKEN;
    const pageId = env.META_PAGE_ID;
    if (!token || !pageId) return { ok: false, error: "Meta non configuré" };

    const body = new URLSearchParams({
      ...(payload.imageUrl
        ? { url: payload.imageUrl, caption: payload.caption }
        : { message: payload.caption }),
      access_token: token,
    });
    const endpoint = payload.imageUrl ? `${pageId}/photos` : `${pageId}/feed`;
    const r = await fetch(`https://graph.facebook.com/v25.0/${endpoint}`, { method: "POST", body });
    const data = await r.json();
    return data.error ? { ok: false, error: data.error.message } : { ok: true, id: data.id };
  }

  if (draft.type === "price_change") {
    // payload: { property_id, date, price, reason }
    const r = await fetch(`${new URL(env.PAGES_URL || "https://villamaryllis.com").origin}/api/rm-overrides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return r.ok ? { ok: true } : { ok: false, error: `HTTP ${r.status}` };
  }

  if (draft.type === "email_campaign") {
    // payload: { to, subject, html }
    const resend = env.RESEND_API_KEY;
    if (!resend) return { ok: false, error: "RESEND_API_KEY non configuré" };
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resend}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.RESEND_FROM || "Amaryllis <noreply@villamaryllis.com>",
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });
    const data = await r.json();
    return r.ok ? { ok: true, id: data.id } : { ok: false, error: data.message };
  }

  return { ok: false, error: `Type "${draft.type}" non supporté` };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  await ensureTable(db);

  const url = new URL(request.url);
  const now = Math.floor(Date.now() / 1000);

  // ── GET — liste les drafts ────────────────────────────────────────────────
  if (request.method === "GET") {
    const status = url.searchParams.get("status");
    const agent  = url.searchParams.get("agent");
    const limit  = parseInt(url.searchParams.get("limit") || "50");

    let q = "SELECT * FROM agent_drafts WHERE 1=1";
    const params = [];
    if (status) { q += " AND status = ?"; params.push(status); }
    if (agent)  { q += " AND agent = ?";  params.push(agent); }
    q += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    try {
      const { results } = await db.prepare(q).bind(...params).all();
      return json({ drafts: results || [], total: (results || []).length });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── POST — créer un draft ────────────────────────────────────────────────
  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const { agent, agent_label, agent_emoji, type, payload, rationale, preview } = body;
    if (!agent || !type || !payload) return json({ error: "agent, type, payload requis" }, 400);

    try {
      const r = await db.prepare(`
        INSERT INTO agent_drafts (agent, agent_label, agent_emoji, type, payload, rationale, preview, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).bind(
        agent, agent_label || agent, agent_emoji || "🤖",
        type, JSON.stringify(payload), rationale || null, preview || null,
        now, now
      ).run();
      return json({ ok: true, id: r.meta?.last_row_id });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── PATCH — approuver / rejeter / publier ─────────────────────────────────
  if (request.method === "PATCH") {
    const id     = parseInt(url.searchParams.get("id"));
    const action = url.searchParams.get("action");
    if (!id || !action) return json({ error: "id + action requis" }, 400);

    const draft = await db.prepare("SELECT * FROM agent_drafts WHERE id = ?").bind(id).first();
    if (!draft) return json({ error: "Draft introuvable" }, 404);

    if (action === "reject") {
      await db.prepare("UPDATE agent_drafts SET status='rejected', updated_at=? WHERE id=?").bind(now, id).run();
      return json({ ok: true, status: "rejected" });
    }

    if (action === "approve") {
      await db.prepare("UPDATE agent_drafts SET status='approved', approved_at=?, updated_at=? WHERE id=?").bind(now, now, id).run();
      return json({ ok: true, status: "approved" });
    }

    if (action === "publish") {
      // Exécute la publication réelle
      const result = await executeDraft(env, draft);
      const newStatus = result.ok ? "published" : "failed";
      await db.prepare(`
        UPDATE agent_drafts SET status=?, result=?, published_at=?, updated_at=?
        WHERE id=?
      `).bind(newStatus, JSON.stringify(result), result.ok ? now : null, now, id).run();
      return json({ ok: result.ok, status: newStatus, result });
    }

    if (action === "edit") {
      // Permet de modifier le payload avant publication
      const body = await request.json().catch(() => ({}));
      if (!body.payload) return json({ error: "payload requis" }, 400);
      await db.prepare("UPDATE agent_drafts SET payload=?, updated_at=? WHERE id=?")
        .bind(JSON.stringify(body.payload), now, id).run();
      return json({ ok: true });
    }

    return json({ error: `action "${action}" inconnue` }, 400);
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (request.method === "DELETE") {
    const id = parseInt(url.searchParams.get("id"));
    if (!id) return json({ error: "id requis" }, 400);
    await db.prepare("DELETE FROM agent_drafts WHERE id=?").bind(id).run();
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
}
