// Cloudflare Pages Function — POST /api/admin-auth
// Vérifie le mot de passe admin côté serveur (jamais exposé dans le bundle JS).
// Retourne { ok: true, role: "admin" | "menage" } ou { ok: false } (401).

import { rateLimit } from './_ratelimit.js';

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // ── Rate limiting : 5 tentatives / IP / 15 min ───────────────────────────
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rl = await rateLimit(env.revenue_manager, {
    key: `admin-auth:${ip}`,
    limit: 5,
    windowSec: 900,
  });
  if (!rl.ok) {
    return json({ error: "Trop de tentatives. Réessayez dans quelques minutes.", retryAfter: rl.retryAfter }, 429);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400); }

  const { password } = body;
  if (!password || typeof password !== "string") {
    return json({ ok: false }, 401);
  }

  const adminPwd  = env.ADMIN_PWD;
  const menagePwd = env.ADMIN_PWD_MENAGE;

  if (!adminPwd) {
    return json({ error: "ADMIN_PWD non configuré" }, 500);
  }

  if (password === adminPwd) {
    return json({ ok: true, role: "admin" });
  }
  if (menagePwd && password === menagePwd) {
    return json({ ok: true, role: "menage" });
  }

  return json({ ok: false }, 401);
}
