/**
 * /api/inventory — Gestion centralisée stocks + linge + consommables.
 *
 * Implémente log-008 (Option B) : système unifié avec seuils min/max,
 * alertes automatiques, prédictions ETA rupture, historique mouvements.
 *
 * Tables D1 :
 *   inventory_items     — items par bien × catégorie avec qty_current/min/max
 *   inventory_movements — historique consommations / réappro
 *
 * Endpoints :
 *   POST ?action=init           — créer tables + seed items par défaut
 *   GET  ?bien_id=X&category=Y  — liste items avec alerts + prédictions
 *   GET  ?action=alerts         — items en rupture imminente (qty < min)
 *   POST                        — créer nouvel item (body: {bien_id, category, item_name, ...})
 *   PATCH ?id=N                 — update qty/min/max/notes
 *   POST  ?action=movement&id=N — body: {delta, reason, notes?} enregistre mouvement
 *   DELETE ?id=N                — supprime item
 */

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: CORS });

// ── Schéma DB ────────────────────────────────────────────────────────────────
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bien_id TEXT NOT NULL,
    category TEXT NOT NULL,
    item_name TEXT NOT NULL,
    unit TEXT DEFAULT 'pièce',
    qty_current INTEGER NOT NULL DEFAULT 0,
    qty_min INTEGER NOT NULL DEFAULT 0,
    qty_max INTEGER NOT NULL DEFAULT 0,
    supplier TEXT,
    cost_unit_cents INTEGER DEFAULT 0,
    last_resupply_at INTEGER,
    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reservation_id TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
  )`,
  `CREATE INDEX IF NOT EXISTS idx_inv_bien_cat ON inventory_items(bien_id, category)`,
  `CREATE INDEX IF NOT EXISTS idx_inv_mov_item ON inventory_movements(item_id, created_at)`,
];

// ── Seed par défaut : items typiques par bien ────────────────────────────────
// Quantités min/max calées sur 1 résa typique (4-7 nuits, 2-8 personnes).
const SEED_TEMPLATES = {
  // Catégorie LINGE
  linge: [
    { item_name: "Draps 2 personnes 180×200",  unit: "set",  min: 2, max: 4 },
    { item_name: "Draps 1 personne 90×190",    unit: "set",  min: 2, max: 4 },
    { item_name: "Housses de couette",         unit: "pièce",min: 2, max: 4 },
    { item_name: "Taies d'oreiller",           unit: "pièce",min: 4, max: 8 },
    { item_name: "Serviettes de bain",         unit: "pièce",min: 6, max: 12 },
    { item_name: "Serviettes de main",         unit: "pièce",min: 4, max: 8 },
    { item_name: "Tapis de bain",              unit: "pièce",min: 2, max: 4 },
    { item_name: "Torchons cuisine",           unit: "pièce",min: 3, max: 6 },
  ],
  hygiene: [
    { item_name: "Savon liquide mains",        unit: "flacon", min: 1, max: 3 },
    { item_name: "Gel douche / shampoing",     unit: "flacon", min: 1, max: 3 },
    { item_name: "Papier toilette",            unit: "rouleau",min: 6, max: 18 },
    { item_name: "Mouchoirs en boîte",         unit: "boîte",  min: 1, max: 3 },
  ],
  cuisine: [
    { item_name: "Capsules Nespresso",         unit: "boîte",  min: 1, max: 3 },
    { item_name: "Sachets thé",                unit: "boîte",  min: 1, max: 2 },
    { item_name: "Sel / poivre",               unit: "pot",    min: 1, max: 2 },
    { item_name: "Huile olive",                unit: "bouteille",min: 1, max: 2 },
    { item_name: "Liquide vaisselle",          unit: "flacon", min: 1, max: 2 },
    { item_name: "Pastilles lave-vaisselle",   unit: "boîte",  min: 1, max: 2 },
    { item_name: "Éponges",                    unit: "pièce",  min: 2, max: 5 },
  ],
  entretien: [
    { item_name: "Produit multi-usages",       unit: "flacon", min: 1, max: 2 },
    { item_name: "Produit sols",               unit: "flacon", min: 1, max: 2 },
    { item_name: "Produit vitres",             unit: "flacon", min: 1, max: 2 },
    { item_name: "Anti-calcaire SDB",          unit: "flacon", min: 1, max: 2 },
    { item_name: "Sacs poubelle 30L",          unit: "rouleau",min: 1, max: 2 },
    { item_name: "Sacs poubelle 100L",         unit: "rouleau",min: 1, max: 2 },
  ],
  bien_etre: [
    { item_name: "Sèche-cheveux",              unit: "pièce",  min: 1, max: 1 },
    { item_name: "Fer à repasser + table",     unit: "set",    min: 1, max: 1 },
    { item_name: "Trousse secours / pansements",unit: "trousse",min: 1, max: 1 },
  ],
};

// Liste des biens (cohérent avec PublicSite.jsx BIENS)
const BIEN_IDS = ["amaryllis", "zandoli", "iguana", "geko", "mabouya", "schoelcher", "nogent"];

// Items spécifiques par bien (en plus du seed générique)
const BIEN_SPECIFIC = {
  amaryllis:  { piscine: [
    { item_name: "Chlore piscine", unit: "litre", min: 5, max: 15 },
    { item_name: "Bandelettes test piscine", unit: "boîte", min: 1, max: 2 },
    { item_name: "Anti-algues piscine", unit: "flacon", min: 1, max: 2 },
  ]},
  zandoli:    { piscine: [{ item_name: "Chlore piscine", unit: "litre", min: 5, max: 15 }] },
  geko:       { piscine: [{ item_name: "Chlore piscine", unit: "litre", min: 5, max: 15 }] },
  iguana:     { piscine: [{ item_name: "Sel piscine eau salée", unit: "sac 10kg", min: 1, max: 3 }] },
  mabouya:    { piscine: [{ item_name: "Bromine jacuzzi", unit: "pot", min: 1, max: 2 }] },
};

// ── Calculs prédictifs ───────────────────────────────────────────────────────
// Pour chaque item, calcule conso moyenne 30j + ETA rupture
async function enrichWithStats(db, items) {
  if (!items.length) return items;
  const itemIds = items.map(i => i.id);
  const placeholders = itemIds.map(() => "?").join(",");
  const since = Math.floor(Date.now() / 1000) - 30 * 86400;

  // Conso 30 jours (delta négatif = consommation)
  const { results: stats } = await db.prepare(`
    SELECT item_id, SUM(CASE WHEN delta < 0 THEN -delta ELSE 0 END) AS conso_30d,
           COUNT(*) AS movements_30d
    FROM inventory_movements
    WHERE item_id IN (${placeholders}) AND created_at >= ?
    GROUP BY item_id
  `).bind(...itemIds, since).all();

  const byId = new Map((stats || []).map(s => [s.item_id, s]));

  return items.map(item => {
    const s = byId.get(item.id) || { conso_30d: 0, movements_30d: 0 };
    const consoPerDay = (s.conso_30d || 0) / 30;
    const consumable = (item.qty_current || 0) - (item.qty_min || 0);
    const etaDays = consoPerDay > 0 ? Math.max(0, Math.round(consumable / consoPerDay)) : null;

    let status = "ok";
    if (item.qty_current <= 0) status = "rupture";
    else if (item.qty_current < item.qty_min) status = "critique";
    else if (item.qty_current < item.qty_min * 1.3) status = "warning";
    else if (etaDays !== null && etaDays < 7) status = "warning";

    return {
      ...item,
      conso_30d: s.conso_30d || 0,
      movements_30d: s.movements_30d || 0,
      conso_per_day: Number(consoPerDay.toFixed(2)),
      eta_rupture_days: etaDays,
      status,
    };
  });
}

// ── Handler ─────────────────────────────────────────────────────────────────
export async function onRequest({ request, env }) {
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding revenue_manager non configuré" }, 500);

  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const method = request.method;

  if (method === "OPTIONS") return new Response(null, { headers: CORS });

  // ── INIT — créer tables + seed par défaut ──────────────────────────────
  if (method === "POST" && action === "init") {
    try {
      for (const stmt of SCHEMA) await db.prepare(stmt).run();

      const { count } = await db.prepare("SELECT COUNT(*) AS count FROM inventory_items").first();
      const force = url.searchParams.get("force") === "1";
      if (count > 0 && !force) {
        return json({ ok: true, alreadySeeded: true, existingItems: count, message: "Tables créées, seed ignoré (use ?force=1 pour reseed)" });
      }

      let inserted = 0;
      for (const bienId of BIEN_IDS) {
        for (const [cat, items] of Object.entries(SEED_TEMPLATES)) {
          for (const it of items) {
            await db.prepare(`
              INSERT INTO inventory_items (bien_id, category, item_name, unit, qty_current, qty_min, qty_max)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(bienId, cat, it.item_name, it.unit, it.max, it.min, it.max).run();
            inserted++;
          }
        }
        const spec = BIEN_SPECIFIC[bienId];
        if (spec) {
          for (const [cat, items] of Object.entries(spec)) {
            for (const it of items) {
              await db.prepare(`
                INSERT INTO inventory_items (bien_id, category, item_name, unit, qty_current, qty_min, qty_max)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `).bind(bienId, cat, it.item_name, it.unit, it.max, it.min, it.max).run();
              inserted++;
            }
          }
        }
      }
      return json({ ok: true, inserted, message: `${inserted} items créés sur ${BIEN_IDS.length} biens` });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── ALERTS — items en rupture imminente ──────────────────────────────────
  if (method === "GET" && action === "alerts") {
    try {
      const { results } = await db.prepare(`
        SELECT * FROM inventory_items
        WHERE qty_current <= qty_min
        ORDER BY bien_id, category, item_name
      `).all();
      const enriched = await enrichWithStats(db, results || []);
      return json({ items: enriched, count: enriched.length });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── LIST — items filtrés par bien/catégorie + stats ──────────────────────
  if (method === "GET") {
    const bienId  = url.searchParams.get("bien_id");
    const catFilt = url.searchParams.get("category");
    let q = "SELECT * FROM inventory_items WHERE 1=1";
    const params = [];
    if (bienId)  { q += " AND bien_id = ?";  params.push(bienId); }
    if (catFilt) { q += " AND category = ?"; params.push(catFilt); }
    q += " ORDER BY category, item_name";
    try {
      const { results } = await db.prepare(q).bind(...params).all();
      const enriched = await enrichWithStats(db, results || []);
      const alertCount = enriched.filter(i => i.status === "critique" || i.status === "rupture").length;
      const warnCount  = enriched.filter(i => i.status === "warning").length;
      return json({ items: enriched, total: enriched.length, alerts: alertCount, warnings: warnCount });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── CREATE item ─────────────────────────────────────────────────────────
  if (method === "POST" && !action) {
    try {
      const body = await request.json();
      const { bien_id, category, item_name, unit = "pièce", qty_current = 0, qty_min = 0, qty_max = 0, supplier, cost_unit_cents, notes } = body;
      if (!bien_id || !category || !item_name) return json({ error: "bien_id, category, item_name requis" }, 400);
      const r = await db.prepare(`
        INSERT INTO inventory_items (bien_id, category, item_name, unit, qty_current, qty_min, qty_max, supplier, cost_unit_cents, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(bien_id, category, item_name, unit, qty_current, qty_min, qty_max, supplier || null, cost_unit_cents || 0, notes || null).run();
      return json({ ok: true, id: r.meta?.last_row_id });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── PATCH — update item ─────────────────────────────────────────────────
  if (method === "PATCH") {
    const id = parseInt(url.searchParams.get("id"));
    if (!id) return json({ error: "id requis" }, 400);
    const body = await request.json();
    const allowed = ["qty_current","qty_min","qty_max","supplier","cost_unit_cents","notes","item_name","unit","last_resupply_at","category"];
    const fields = [];
    const params = [];
    for (const k of allowed) {
      if (body[k] !== undefined) { fields.push(`${k} = ?`); params.push(body[k]); }
    }
    if (!fields.length) return json({ error: "Rien à mettre à jour" }, 400);
    fields.push("updated_at = unixepoch()");
    params.push(id);
    try {
      await db.prepare(`UPDATE inventory_items SET ${fields.join(", ")} WHERE id = ?`).bind(...params).run();
      return json({ ok: true, id });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── MOVEMENT — enregistre une conso ou réappro ──────────────────────────
  if (method === "POST" && action === "movement") {
    const id = parseInt(url.searchParams.get("id"));
    if (!id) return json({ error: "id item requis" }, 400);
    const body = await request.json();
    const { delta, reason = "consume", reservation_id, notes } = body;
    if (typeof delta !== "number" || delta === 0) return json({ error: "delta (nombre non nul) requis" }, 400);
    try {
      await db.prepare(`
        INSERT INTO inventory_movements (item_id, delta, reason, reservation_id, notes)
        VALUES (?, ?, ?, ?, ?)
      `).bind(id, delta, reason, reservation_id || null, notes || null).run();
      const fields = ["qty_current = qty_current + ?", "updated_at = unixepoch()"];
      const params = [delta];
      if (delta > 0) {
        fields.push("last_resupply_at = unixepoch()");
      }
      params.push(id);
      await db.prepare(`UPDATE inventory_items SET ${fields.join(", ")} WHERE id = ?`).bind(...params).run();
      const item = await db.prepare("SELECT * FROM inventory_items WHERE id = ?").bind(id).first();
      return json({ ok: true, item });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  // ── DELETE ───────────────────────────────────────────────────────────────
  if (method === "DELETE") {
    const id = parseInt(url.searchParams.get("id"));
    if (!id) return json({ error: "id requis" }, 400);
    try {
      await db.prepare("DELETE FROM inventory_items WHERE id = ?").bind(id).run();
      return json({ ok: true });
    } catch (e) {
      return json({ error: e.message }, 500);
    }
  }

  return json({ error: "Méthode/action non supportée" }, 405);
}
