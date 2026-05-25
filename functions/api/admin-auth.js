// Cloudflare Pages Function — POST /api/admin-auth
// Vérifie le mot de passe admin côté serveur (jamais exposé dans le bundle JS).
// Retourne { ok: true, role: "admin" | "menage" } ou { ok: false } (401).

import { rateLimit } from './_ratelimit.js';

// arch-007 : restreindre CORS aux domaines Amaryllis uniquement
const ALLOWED_ORIGINS = [
  "https://villamaryllis.com",
  "https://www.villamaryllis.com",
  "https://dashboard-amaryllis.pages.dev",
];
function corsHeaders(origin = "") {
  const allowed = ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith(".dashboard-amaryllis.pages.dev"));
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin":  allowed ? origin : "https://villamaryllis.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}
const json = (d, s = 200, req) =>
  new Response(JSON.stringify(d), { status: s, headers: corsHeaders(req?.headers?.get("Origin") || "") });

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request?.headers?.get("Origin") || "") });
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
    return json({ error: "Trop de tentatives. Réessayez dans quelques minutes.", retryAfter: rl.retryAfter }, 429, request);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "JSON invalide" }, 400, request); }

  const { password } = body;
  if (!password || typeof password !== "string") {
    return json({ ok: false }, 401, request);
  }

  const adminPwd  = env.ADMIN_PWD;
  const menagePwd = env.ADMIN_PWD_MENAGE;

  if (!adminPwd) {
    return json({ error: "ADMIN_PWD non configuré" }, 500, request);
  }

  if (password === adminPwd) {
    return json({ ok: true, role: "admin" }, 200, request);
  }
  if (menagePwd && password === menagePwd) {
    return json({ ok: true, role: "menage" }, 200, request);
  }

  return json({ ok: false }, 401, request);
}
