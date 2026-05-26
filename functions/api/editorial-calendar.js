// Cloudflare Pages Function — /api/editorial-calendar
// Planning éditorial Facebook + Instagram pour Amaryllis Locations.
// Auto-init de la table éditoriale + CRUD complet.
//
// GET    ?from=YYYY-MM-DD&to=YYYY-MM-DD → liste des entrées
// GET    ?id=N → 1 entrée
// POST   { ...entry } → créer une entrée
// POST   ?action=seed_30days → seed 30 entrées suivant la structure hebdo canon
// PATCH  ?id=N → mettre à jour
// DELETE ?id=N → supprimer

const CORS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const DDL = `
CREATE TABLE IF NOT EXISTS editorial_calendar (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  scheduled_at  INTEGER NOT NULL,          -- timestamp unix (jour de publication)
  platform      TEXT NOT NULL,             -- 'fb' | 'ig' | 'both'
  publish_hour  TEXT NOT NULL,             -- "13h30" pour visualisation
  bien_id       TEXT NOT NULL,             -- amaryllis | zandoli | iguana | geko | mabouya | schoelcher | nogent
  theme         TEXT NOT NULL,             -- inspiration | preuve | detail | reve | conversion | lifestyle | info
  variante      TEXT,                      -- V1 | V2 | V3 | V4 + libellé
  format        TEXT,                      -- reel | carrousel | post | story
  photo_url     TEXT,                      -- /photos/{bien}/XX.webp
  cta           TEXT,                      -- "Réserver" | "Découvrir" | etc.
  brief         TEXT,                      -- consigne libre pour community-manager
  draft_id      INTEGER,                   -- FK vers agent_drafts.id quand généré
  status        TEXT NOT NULL DEFAULT 'planned', -- planned | generating | drafted | approved | published | failed | skipped
  result        TEXT,                      -- JSON détails après publication
  published_at  INTEGER,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_cal_scheduled ON editorial_calendar(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_cal_status    ON editorial_calendar(status);
CREATE INDEX IF NOT EXISTS idx_cal_bien      ON editorial_calendar(bien_id);
`;

async function ensureTable(db) {
  try { for (const s of DDL.split(";").filter(Boolean)) await db.prepare(s).run(); } catch {}
}

// ── Plan canonique 30 jours (sera adapté à la date de départ) ──────────────
const WEEKLY_TEMPLATE = [
  // [theme, variantes ordonnées V1..V4, fb_hour, ig_hour, format prioritaire]
  { day: 1, theme: "inspiration",  fb: "12h00", ig: "18h30", format: "reel",      cta: "Voir la visite" },        // Lundi
  { day: 2, theme: "preuve",       fb: "11h30", ig: "19h00", format: "carrousel", cta: "Voir la visite" },        // Mardi
  { day: 3, theme: "detail",       fb: "11h30", ig: "12h30", format: "reel",      cta: "Découvrir" },             // Mercredi
  { day: 4, theme: "reve",         fb: "13h30", ig: "19h30", format: "reel",      cta: "Réserver" },              // Jeudi
  { day: 5, theme: "conversion",   fb: "14h00", ig: "13h00", format: "carrousel", cta: "Réserver maintenant" },   // Vendredi
  { day: 6, theme: "lifestyle",    fb: "12h00", ig: "10h30", format: "carrousel", cta: "Sauvegarder pour plus tard" }, // Samedi
  { day: 7, theme: "info",         fb: "12h30", ig: "18h00", format: "post",      cta: "Voir la visite" },        // Dimanche
];

const VARIANTES = {
  inspiration: [
    "V1 Imaginez votre réveil",
    "V2 Six heures du matin face à la mer",
    "V3 Lever de soleil chambre baignée de lumière",
    "V4 Vue depuis la terrasse à l'aube",
  ],
  preuve: [
    "V1 Citation avis 5★ + photo",
    "V2 X voyageurs · 4,X étoiles",
    "V3 Avant/après saison sèche vs verte",
    "V4 Témoignage anonyme storifié",
  ],
  detail: [
    "V1 Focus piscine",
    "V2 Focus terrasse / coin lecture",
    "V3 Focus suite parentale ou cuisine",
    "V4 Focus équipement signature",
  ],
  reve: [
    "V1 Un week-end parfait à [Bien]",
    "V2 Le rituel du matin",
    "V3 Quand la nuit tombe",
    "V4 3 instants à ne pas manquer",
  ],
  conversion: [
    "V1 Dispo weekend prochain",
    "V2 Offre inter-saison 4+1",
    "V3 Pack 3 jours + transferts",
    "V4 Tarif direct -10% vs OTA",
  ],
  lifestyle: [
    "V1 5 plages secrètes à proximité",
    "V2 Marché local du samedi",
    "V3 Restaurants signature 15 min",
    "V4 Plongée / kitesurf / catamaran",
  ],
  info: [
    "V1 Comparatif inter vs haute saison",
    "V2 Que mettre dans la valise",
    "V3 Quand partir selon votre profil",
    "V4 Comment se déplacer",
  ],
};

// Rotation des biens selon target occurrences
function pickBienForDay(dayIndex, themeKey) {
  // Séquence d'apparition équitable sur 30 jours
  // amaryllis 5 / nogent 5 / iguana 5 / zandoli 4 / geko 4 / mabouya 4 / schoelcher 4
  const SEQUENCE = [
    "amaryllis", "mabouya", "zandoli", "iguana", "nogent",        // S1 j1-j5
    "schoelcher", "geko", "iguana", "amaryllis", "mabouya",       // S1 j6-j10
    "zandoli", "schoelcher", "nogent", "amaryllis", "geko",       // S2 j11-j15
    "iguana", "amaryllis", "mabouya", "zandoli", "iguana",        // S2 j16-j20
    "schoelcher", "mabouya", "geko", "nogent", "amaryllis",       // S3 j21-j25
    "iguana", "zandoli", "nogent", "schoelcher", "amaryllis",     // S3 j26-j30
  ];
  return SEQUENCE[dayIndex % SEQUENCE.length];
}

function dateToUnix(yyyymmdd) {
  return Math.floor(new Date(yyyymmdd + "T00:00:00Z").getTime() / 1000);
}

function unixToYMD(ts) {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

async function handleSeed30Days(env, db, body) {
  const startDate = body.start_date || new Date().toISOString().slice(0, 10);
  const startTs   = dateToUnix(startDate);
  const startDay  = new Date(startTs * 1000).getUTCDay(); // 0=dim,1=lun..6=sam

  let inserted = 0;
  const entries = [];

  for (let i = 0; i < 30; i++) {
    const ts        = startTs + i * 86400;
    const date      = unixToYMD(ts);
    const dow       = (startDay + i) % 7;
    // Map dow JS (0=dim, 1=lun..6=sam) vers template day (1=lun..7=dim)
    const tplDay    = dow === 0 ? 7 : dow;
    const tpl       = WEEKLY_TEMPLATE.find(t => t.day === tplDay) || WEEKLY_TEMPLATE[0];
    const bienId    = pickBienForDay(i, tpl.theme);
    const weekIdx   = Math.floor(i / 7);
    const variante  = VARIANTES[tpl.theme][weekIdx % 4];
    const photoNum  = String((i % 12) + 1).padStart(2, "0");
    const photoUrl  = `https://villamaryllis.com/photos/${bienId}/${photoNum}.webp`;

    const brief = `${tpl.theme} ${variante.split(" ")[0]} — ${bienId} — format ${tpl.format}`;

    try {
      await db.prepare(`
        INSERT INTO editorial_calendar
          (scheduled_at, platform, publish_hour, bien_id, theme, variante, format, photo_url, cta, brief, status, created_at, updated_at)
        VALUES (?, 'both', ?, ?, ?, ?, ?, ?, ?, ?, 'planned', unixepoch(), unixepoch())
      `).bind(ts, `FB ${tpl.fb} · IG ${tpl.ig}`, bienId, tpl.theme, variante, tpl.format, photoUrl, tpl.cta, brief).run();
      inserted++;
      entries.push({ date, bien_id: bienId, theme: tpl.theme, variante, format: tpl.format });
    } catch (e) {}
  }

  return json({ ok: true, inserted, entries });
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 binding 'revenue_manager' not found" }, 503);

  await ensureTable(db);

  const url = new URL(request.url);
  const now = Math.floor(Date.now() / 1000);

  // ── GET ────────────────────────────────────────────────────────────────
  if (request.method === "GET") {
    const id = url.searchParams.get("id");
    if (id) {
      const row = await db.prepare("SELECT * FROM editorial_calendar WHERE id = ?").bind(parseInt(id)).first();
      return json({ entry: row });
    }
    const from = url.searchParams.get("from"); // YYYY-MM-DD
    const to   = url.searchParams.get("to");
    const status = url.searchParams.get("status");
    const bien   = url.searchParams.get("bien_id");

    let q = "SELECT * FROM editorial_calendar WHERE 1=1";
    const params = [];
    if (from) { q += " AND scheduled_at >= ?"; params.push(dateToUnix(from)); }
    if (to)   { q += " AND scheduled_at <= ?"; params.push(dateToUnix(to) + 86399); }
    if (status) { q += " AND status = ?"; params.push(status); }
    if (bien)   { q += " AND bien_id = ?"; params.push(bien); }
    q += " ORDER BY scheduled_at ASC LIMIT 200";
    try {
      const { results } = await db.prepare(q).bind(...params).all();
      return json({ entries: results || [], total: (results || []).length });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  // ── POST ───────────────────────────────────────────────────────────────
  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const action = url.searchParams.get("action");
    if (action === "seed_30days") return handleSeed30Days(env, db, body);

    // Création unitaire
    const { scheduled_at, platform = "both", publish_hour, bien_id, theme, variante, format, photo_url, cta, brief } = body;
    if (!scheduled_at || !bien_id || !theme) return json({ error: "scheduled_at, bien_id, theme requis" }, 400);
    try {
      const ts = typeof scheduled_at === "string" ? dateToUnix(scheduled_at) : scheduled_at;
      const r = await db.prepare(`
        INSERT INTO editorial_calendar
          (scheduled_at, platform, publish_hour, bien_id, theme, variante, format, photo_url, cta, brief, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned', ?, ?)
      `).bind(ts, platform, publish_hour || "", bien_id, theme, variante || "", format || "", photo_url || "", cta || "", brief || "", now, now).run();
      return json({ ok: true, id: r.meta?.last_row_id });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  // ── PATCH ──────────────────────────────────────────────────────────────
  if (request.method === "PATCH") {
    const id = parseInt(url.searchParams.get("id"));
    if (!id) return json({ error: "id requis" }, 400);
    const body = await request.json().catch(() => ({}));
    const fields = [];
    const vals = [];
    for (const k of ["scheduled_at","platform","publish_hour","bien_id","theme","variante","format","photo_url","cta","brief","status","draft_id","result"]) {
      if (body[k] !== undefined) { fields.push(`${k} = ?`); vals.push(body[k]); }
    }
    if (!fields.length) return json({ error: "rien à mettre à jour" }, 400);
    fields.push("updated_at = ?"); vals.push(now);
    vals.push(id);
    try {
      await db.prepare(`UPDATE editorial_calendar SET ${fields.join(", ")} WHERE id = ?`).bind(...vals).run();
      return json({ ok: true });
    } catch (e) { return json({ error: e.message }, 500); }
  }

  // ── DELETE ─────────────────────────────────────────────────────────────
  if (request.method === "DELETE") {
    const id = parseInt(url.searchParams.get("id"));
    const purgeAll = url.searchParams.get("all") === "true";
    if (purgeAll) {
      await db.prepare("DELETE FROM editorial_calendar WHERE status IN ('planned','skipped')").run();
      return json({ ok: true, purged: "all planned" });
    }
    if (!id) return json({ error: "id requis" }, 400);
    await db.prepare("DELETE FROM editorial_calendar WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
}
