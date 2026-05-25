// Cloudflare Pages Function — GET /api/health-check
// web-006 : retourne le statut des services critiques (D1, Beds24, Resend)
// Brancher sur cron-job.org toutes les 5min pour alerter si 503

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

export async function onRequestGet(context) {
  const { env } = context;
  const checks = {};
  let allOk = true;

  // ── D1 ────────────────────────────────────────────────────────────────────
  try {
    const db = env.revenue_manager;
    if (!db) throw new Error("binding manquant");
    await db.prepare("SELECT 1").first();
    checks.d1 = { ok: true };
  } catch (e) {
    checks.d1 = { ok: false, error: e.message };
    allOk = false;
  }

  // ── Beds24 token ──────────────────────────────────────────────────────────
  try {
    const token = env.BEDS24_TOKEN;
    if (!token) throw new Error("BEDS24_TOKEN manquant");
    const res = await fetch("https://beds24.com/api/v2/authentication/details", {
      headers: { token },
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (!data.validToken) throw new Error("token invalide");
    const expiresIn = data.token?.expiresIn ?? null;
    checks.beds24 = { ok: true, expiresIn };
    // Alerte si expiration proche (< 7 jours)
    if (expiresIn !== null && expiresIn < 604800) {
      checks.beds24.warning = `Token Beds24 expire dans ${Math.round(expiresIn / 86400)}j`;
    }
  } catch (e) {
    checks.beds24 = { ok: false, error: e.message };
    allOk = false;
  }

  // ── Resend (clé présente) ─────────────────────────────────────────────────
  try {
    if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY manquant");
    checks.resend = { ok: true };
  } catch (e) {
    checks.resend = { ok: false, error: e.message };
    allOk = false;
  }

  const status = allOk ? 200 : 503;
  return new Response(JSON.stringify({
    ok: allOk,
    timestamp: new Date().toISOString(),
    checks,
  }), { status, headers: CORS });
}
