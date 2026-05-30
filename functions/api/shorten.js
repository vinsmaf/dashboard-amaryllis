// Cloudflare Pages Function — /api/shorten
// Liens courts pour les devis : villamaryllis.com/r/{code}
//
// POST  (auth admin) { d: "<base64 payload devis>", label?: "..." } → { ok, code, url }
// GET   ?code=XXXX  (public) → { ok, d: "<payload>", clicks }   + incrémente le compteur
//
// Stockage D1 (binding: revenue_manager, table: short_links)

import { verifyBearer } from "./_adminauth.js";

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const DDL = `CREATE TABLE IF NOT EXISTS short_links (
  code        TEXT PRIMARY KEY,
  payload     TEXT NOT NULL,
  label       TEXT,
  clicks      INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);`;

// Code court non ambigu (sans 0/O/1/I/l) — 5 caractères
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function genCode(n = 5) {
  let c = "";
  const arr = crypto.getRandomValues(new Uint8Array(n));
  for (let i = 0; i < n; i++) c += ALPHABET[arr[i] % ALPHABET.length];
  return c;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 500);
  await db.prepare(DDL).run();

  const url = new URL(request.url);

  // ── GET ?code= : résoudre un lien court (public) ──
  if (request.method === "GET") {
    const code = url.searchParams.get("code");
    if (!code) return json({ error: "code requis" }, 400);
    const row = await db.prepare("SELECT payload, clicks FROM short_links WHERE code = ?").bind(code).first();
    if (!row) return json({ error: "Lien introuvable" }, 404);
    // Incrémente le compteur de clics (best-effort, non bloquant)
    db.prepare("UPDATE short_links SET clicks = clicks + 1 WHERE code = ?").bind(code).run().catch(() => {});
    return json({ ok: true, d: row.payload, clicks: (row.clicks || 0) + 1 });
  }

  // ── POST : créer un lien court (auth admin) ──
  if (request.method === "POST") {
    // arch-009 : token de session signé OU mot de passe brut (rétro-compat).
    // Rejet si aucun secret n'est défini (sécurisé).
    if (!env.ADMIN_PWD && !env.ADMIN_PASSWORD) return json({ error: "Unauthorized" }, 401);
    const { ok } = await verifyBearer(request, env);
    if (!ok) return json({ error: "Unauthorized" }, 401);

    const body = await request.json().catch(() => ({}));
    const payload = body.d;
    if (!payload || typeof payload !== "string") return json({ error: "champ 'd' (payload base64) requis" }, 400);

    let code;
    // Slug personnalisé (ex: "laurent-geko") — nettoyé : minuscules, a-z 0-9 et tirets
    if (body.slug) {
      code = String(body.slug).toLowerCase().trim()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")   // retire accents
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") // espaces → tirets
        .slice(0, 40);
      if (!code) return json({ error: "slug invalide" }, 400);
      const exists = await db.prepare("SELECT 1 FROM short_links WHERE code = ?").bind(code).first();
      if (exists) return json({ error: `slug '${code}' déjà utilisé — choisis-en un autre` }, 409);
    } else {
      // Code aléatoire (réessaie en cas de collision)
      code = genCode();
      for (let i = 0; i < 5; i++) {
        const ex = await db.prepare("SELECT 1 FROM short_links WHERE code = ?").bind(code).first();
        if (!ex) break;
        code = genCode();
      }
    }
    await db.prepare("INSERT INTO short_links (code, payload, label) VALUES (?, ?, ?)")
      .bind(code, payload, body.label || null).run();

    const origin = url.origin;
    return json({ ok: true, code, url: `${origin}/r/${code}` });
  }

  return json({ error: "Méthode non autorisée" }, 405);
}
