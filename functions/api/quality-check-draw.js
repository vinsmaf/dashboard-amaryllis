// functions/api/quality-check-draw.js — reco agent Resp. Logistique (2026-07-18) :
// contrôle qualité aléatoire dans le dashboard admin. Chaque semaine (ou à la demande),
// tire un bien au hasard (bookable, pas déjà en cours, pas contrôlé depuis <21j) et crée
// une entrée `maintenance` (category='qualite', déjà dans son enum) avec la checklist en
// notes. Réutilise 100% l'infra maintenance existante — pas de nouvelle table/UI.
//
// GET  ?secret=POSTSTAY_SECRET → tirage cron hebdo (lundi). ?dry=1 = aperçu sans écrire.
// POST (Bearer admin)          → tirage manuel depuis le bouton "🎲 Tirer maintenant".

import { verifyBearer } from "./_adminauth.js";
import { initTable } from "./maintenance.js";
import { ALL_BIENS } from "../../src/data/biens.js";
import { eligibleBiensForCheck, pickBienForCheck, formatChecklistNotes } from "../../src/utils/qualityCheck.js";

const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

async function runDraw(db, { dry = false } = {}) {
  await initTable(db);

  const { results: recent } = await db.prepare(
    "SELECT bien_id, status, created_at FROM maintenance WHERE category='qualite'"
  ).all();

  const eligible = eligibleBiensForCheck(ALL_BIENS, recent);
  const bienId = pickBienForCheck(eligible);
  if (!bienId) return { drawn: null, eligible: eligible.length };

  const bien = ALL_BIENS.find((b) => b.id === bienId);
  const todayStr = new Date().toISOString().slice(0, 10);
  const titre = `Contrôle qualité aléatoire — ${bien?.nom || bienId} — semaine du ${todayStr}`;

  if (dry) return { drawn: bienId, titre, eligible: eligible.length };

  const id = "maint-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
  await db.prepare(
    "INSERT INTO maintenance (id,bien_id,category,titre,status,scheduled_at,notes) VALUES (?,?,?,?,?,?,?)"
  ).bind(id, bienId, "qualite", titre, "a_planifier", todayStr, formatChecklistNotes()).run();

  return { drawn: bienId, id, titre, eligible: eligible.length };
}

async function notify(env, result) {
  if (!result.drawn || !env.NTFY_TOPIC) return;
  try {
    const bien = ALL_BIENS.find((b) => b.id === result.drawn);
    await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
      method: "POST",
      headers: {
        Title: "🎲 Contrôle qualité de la semaine",
        Priority: "3",
        Tags: "white_check_mark",
        Actions: `view, Ouvrir Maintenance, ${env.SITE_URL || "https://villamaryllis.com"}/admin, clear=true`,
      },
      body: `${bien?.nom || result.drawn} tiré au sort — checklist à faire dans l'onglet Maintenance (catégorie Contrôle qualité).`,
    });
  } catch { /* ntfy best-effort */ }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }
  const db = env.revenue_manager;
  if (!db) return json({ error: "DB indisponible" }, 500);

  const dry = url.searchParams.get("dry") === "1";
  const result = await runDraw(db, { dry });
  if (!dry) await notify(env, result);
  return json({ ok: true, dry, ...result });
}

export async function onRequestPost({ request, env }) {
  const { ok } = await verifyBearer(request, env);
  if (!ok) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "DB indisponible" }, 500);

  const result = await runDraw(db);
  await notify(env, result);
  return json({ ok: true, ...result });
}
