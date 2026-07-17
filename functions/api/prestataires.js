// Cloudflare Pages Function — GET/POST/PATCH/DELETE /api/prestataires
// I-10 (prérequis) — Carnet de prestataires en D1.
//
// Pourquoi : le carnet vivait dans le localStorage du navigateur de Vincent
// (`amaryllis_prestataires_v1`, cf. App.jsx). Deux conséquences :
//   1. Fragilité — vider le cache ou changer de machine = contacts perdus, sans sauvegarde.
//   2. Blocage I-10 — aucun agent serveur ne peut joindre un prestataire qu'il ne voit pas.
//      C'est le prérequis MATÉRIEL du concierge : sans ça, « envoyer le plombier » est
//      impossible quel que soit le modèle LLM (cartographie 2026-07-17).
//
// Admin-only (Bearer) : PII prestataires (téléphones, emails). `?secret=POSTSTAY_SECRET`
// autorisé en LECTURE seule, pour que les crons/agents serveur puissent résoudre un contact
// sans détenir le token admin — les écritures restent strictement Bearer.

import { verifyBearer } from "./_adminauth.js";

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
  });

const CATEGORIES = ["menage", "plomberie", "electricite", "jardinage", "piscine", "serrurerie", "peinture", "autre"];

async function ensureTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS prestataires (
      id         TEXT PRIMARY KEY,
      nom        TEXT NOT NULL,
      tel        TEXT,
      email      TEXT,
      categorie  TEXT NOT NULL DEFAULT 'autre',
      biens      TEXT,
      notes      TEXT,
      actif      INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_prestataires_cat ON prestataires(categorie)").run();
}

const uid = () => `prest_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function rowOut(r) {
  let biens = [];
  try { biens = r.biens ? JSON.parse(r.biens) : []; } catch { /* champ corrompu → liste vide plutôt que 500 */ }
  return { ...r, biens, actif: r.actif !== 0 };
}

function cleanCategorie(v) {
  return CATEGORIES.includes(v) ? v : "autre";
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 non configuré" }, 503);

  const url = new URL(request.url);
  const secretOk = !!env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const isRead = request.method === "GET";
  if (!(isRead && secretOk)) {
    const { ok } = await verifyBearer(request, env);
    if (!ok) return json({ error: "Non autorisé" }, 401);
  }

  try {
    await ensureTable(db);

    // ── GET : liste (filtrable par catégorie / bien — c'est ainsi qu'un agent résout
    //    « qui appeler pour une fuite à Zandoli ? »)
    if (request.method === "GET") {
      const categorie = url.searchParams.get("categorie");
      const bien = url.searchParams.get("bien");
      let sql = "SELECT * FROM prestataires WHERE actif = 1";
      const binds = [];
      if (categorie && categorie !== "all") { sql += " AND categorie = ?"; binds.push(categorie); }
      sql += " ORDER BY nom COLLATE NOCASE";
      const { results } = await db.prepare(sql).bind(...binds).all();
      let out = (results || []).map(rowOut);
      // Filtre bien appliqué en JS : `biens` est un tableau JSON en TEXT, un LIKE SQL
      // matcherait des sous-chaînes ("geko" dans "geko-annexe") — faux positifs garantis.
      if (bien && bien !== "all") out = out.filter((p) => p.biens.includes(bien));
      return json({ ok: true, prestataires: out, total: out.length });
    }

    // ── POST : créer un contact, ou importer un lot (migration depuis localStorage)
    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}));

      // Import de migration : non destructif et idempotent — on n'écrase JAMAIS un
      // contact déjà en base (dédup sur nom+tél), pour qu'un double clic ou un import
      // depuis un 2e navigateur ne duplique pas le carnet.
      if (Array.isArray(body.import)) {
        const { results: existing } = await db.prepare("SELECT nom, tel FROM prestataires").all();
        const seen = new Set((existing || []).map((r) => `${(r.nom || "").toLowerCase().trim()}|${(r.tel || "").replace(/\s/g, "")}`));
        let imported = 0, skipped = 0;
        for (const c of body.import) {
          if (!c?.nom?.trim()) { skipped++; continue; }
          const key = `${c.nom.toLowerCase().trim()}|${(c.tel || "").replace(/\s/g, "")}`;
          if (seen.has(key)) { skipped++; continue; }
          seen.add(key);
          await db.prepare(
            "INSERT INTO prestataires (id, nom, tel, email, categorie, biens, notes) VALUES (?,?,?,?,?,?,?)"
          ).bind(
            uid(), c.nom.trim(), c.tel || "", c.email || "",
            cleanCategorie(c.categorie), JSON.stringify(c.biens || []), c.notes || ""
          ).run();
          imported++;
        }
        return json({ ok: true, imported, skipped });
      }

      if (!body.nom?.trim()) return json({ error: "nom requis" }, 400);
      const id = uid();
      await db.prepare(
        "INSERT INTO prestataires (id, nom, tel, email, categorie, biens, notes) VALUES (?,?,?,?,?,?,?)"
      ).bind(
        id, body.nom.trim(), body.tel || "", body.email || "",
        cleanCategorie(body.categorie), JSON.stringify(body.biens || []), body.notes || ""
      ).run();
      const row = await db.prepare("SELECT * FROM prestataires WHERE id = ?").bind(id).first();
      return json({ ok: true, prestataire: rowOut(row) });
    }

    // ── PATCH : mise à jour partielle
    if (request.method === "PATCH") {
      const id = url.searchParams.get("id");
      if (!id) return json({ error: "id requis" }, 400);
      const body = await request.json().catch(() => ({}));

      const sets = [], binds = [];
      if (body.nom !== undefined)       { sets.push("nom = ?");       binds.push(String(body.nom).trim()); }
      if (body.tel !== undefined)       { sets.push("tel = ?");       binds.push(body.tel || ""); }
      if (body.email !== undefined)     { sets.push("email = ?");     binds.push(body.email || ""); }
      if (body.categorie !== undefined) { sets.push("categorie = ?"); binds.push(cleanCategorie(body.categorie)); }
      if (body.biens !== undefined)     { sets.push("biens = ?");     binds.push(JSON.stringify(body.biens || [])); }
      if (body.notes !== undefined)     { sets.push("notes = ?");     binds.push(body.notes || ""); }
      if (body.actif !== undefined)     { sets.push("actif = ?");     binds.push(body.actif ? 1 : 0); }
      if (!sets.length) return json({ error: "Aucun champ à modifier" }, 400);

      sets.push("updated_at = unixepoch()");
      binds.push(id);
      await db.prepare(`UPDATE prestataires SET ${sets.join(", ")} WHERE id = ?`).bind(...binds).run();
      const row = await db.prepare("SELECT * FROM prestataires WHERE id = ?").bind(id).first();
      if (!row) return json({ error: "Introuvable" }, 404);
      return json({ ok: true, prestataire: rowOut(row) });
    }

    // ── DELETE : suppression douce (actif=0) — un contact « supprimé » reste
    //    référençable par l'historique des interventions passées.
    if (request.method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) return json({ error: "id requis" }, 400);
      await db.prepare("UPDATE prestataires SET actif = 0, updated_at = unixepoch() WHERE id = ?").bind(id).run();
      return json({ ok: true, deleted: id });
    }

    return json({ error: "Méthode non supportée" }, 405);
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
}
