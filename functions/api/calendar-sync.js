// POST /api/calendar-sync — Bearer admin uniquement (bouton "📅 Sync calendrier" dans MenageTab)
//
// Reçoit la liste des ménages déjà calculée côté client (MenageTab a accès à
// `reservations` ET à l'annuaire prestataires en localStorage — deux choses que le
// backend ne voit pas) et crée/met à jour un événement Google Calendar par ménage sur
// le compte connecté (contact@villamaryllis.com, provider="calendar" — voir
// _googleOAuth.js et docs/GMAIL-SETUP.md).
//
// Dédup : clé stable "<bienId>|<checkoutISO>" (table menage_calendar_events) → PATCH
// l'event existant au lieu d'en recréer un à chaque sync. Si le prestataire assigné a
// changé depuis le dernier sync, l'attendee est mis à jour (et notifié si sendUpdates=all).

import { verifyBearer } from "./_adminauth.js";
import { getValidAccessToken, getOAuthRow } from "./_googleOAuth.js";

const CORS = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" };
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: CORS });

const NOGENT_TZ = "Europe/Paris";
const MARTINIQUE_TZ = "America/Martinique";

export function resaKey(bienId, checkoutISO) {
  return `${bienId}|${checkoutISO}`;
}

export function timezoneForBien(bienId) {
  return bienId === "nogent" ? NOGENT_TZ : MARTINIQUE_TZ;
}

/** Construit le payload d'event Google Calendar pour un ménage. Fonction pure — testable. */
export function buildMenageEvent(m) {
  const tz = timezoneForBien(m.bienId);
  const start = `${m.checkoutISO}T11:00:00`;
  const end = `${m.checkoutISO}T13:00:00`;

  const lines = [
    `Sortie : ${m.guestOut || "voyageur"}`,
    m.guestIn ? `Prochaine arrivée : ${m.guestIn} (${m.checkinNextISO})` : "Pas d'arrivée suivante planifiée",
    m.windowHours != null ? `Fenêtre disponible : ${m.windowHours} h` : null,
    m.assigneNom ? `Assigné : ${m.assigneNom}` : "Non assigné",
  ].filter(Boolean);

  const event = {
    summary: `🧹 Ménage — ${m.bienNom}`,
    description: lines.join("\n"),
    start: { dateTime: start, timeZone: tz },
    end: { dateTime: end, timeZone: tz },
  };
  if (m.assigneEmail) event.attendees = [{ email: m.assigneEmail }];
  return event;
}

async function calendarFetch(accessToken, path, options = {}) {
  const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  return r;
}

// GET /api/calendar-sync?status=1 — statut de connexion (bouton "Connecter Calendar" dans MenageTab)
export async function onRequestGet({ request, env }) {
  const { ok } = await verifyBearer(request, env);
  if (!ok) return json({ error: "Non autorisé" }, 401);
  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  try {
    await getValidAccessToken(env, db, "calendar");
  } catch (e) {
    return json({ ok: false, connected: false, error: e.message }, 200);
  }
  const row = await getOAuthRow(db, "calendar");
  return json({ ok: true, connected: true, accountEmail: row?.account_email || null });
}

export async function onRequestPost({ request, env }) {
  const { ok } = await verifyBearer(request, env);
  if (!ok) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 indisponible" }, 503);

  let accessToken;
  try {
    accessToken = await getValidAccessToken(env, db, "calendar");
  } catch (e) {
    return json({ ok: false, connected: false, error: e.message }, 200);
  }

  const body = await request.json().catch(() => ({}));
  const menages = Array.isArray(body.menages) ? body.menages : [];
  if (!menages.length) return json({ ok: true, created: 0, updated: 0, errors: [] });

  let created = 0, updated = 0;
  const errors = [];

  for (const m of menages) {
    if (!m.bienId || !m.checkoutISO) { errors.push({ m, error: "bienId/checkoutISO manquant" }); continue; }
    const key = resaKey(m.bienId, m.checkoutISO);
    const eventPayload = buildMenageEvent(m);

    try {
      const existing = await db.prepare(
        "SELECT calendar_event_id FROM menage_calendar_events WHERE resa_key = ?"
      ).bind(key).first();

      if (existing?.calendar_event_id) {
        const r = await calendarFetch(accessToken, `/events/${existing.calendar_event_id}?sendUpdates=all`, {
          method: "PATCH",
          body: JSON.stringify(eventPayload),
        });
        if (r.status === 404) {
          // Event supprimé côté Google (manuellement) → on en recrée un.
          const created2 = await calendarFetch(accessToken, `/events?sendUpdates=all`, { method: "POST", body: JSON.stringify(eventPayload) });
          const data2 = await created2.json();
          if (!created2.ok) throw new Error(data2.error?.message || `Calendar ${created2.status}`);
          await db.prepare(
            `INSERT INTO menage_calendar_events (resa_key, bien_id, checkout_date, calendar_event_id, assigne, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(resa_key) DO UPDATE SET calendar_event_id = excluded.calendar_event_id, assigne = excluded.assigne, updated_at = excluded.updated_at`
          ).bind(key, m.bienId, m.checkoutISO, data2.id, m.assigneNom || null, Date.now()).run();
          created++;
        } else if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          throw new Error(data.error?.message || `Calendar ${r.status}`);
        } else {
          await db.prepare(
            "UPDATE menage_calendar_events SET assigne = ?, updated_at = ? WHERE resa_key = ?"
          ).bind(m.assigneNom || null, Date.now(), key).run();
          updated++;
        }
      } else {
        const r = await calendarFetch(accessToken, `/events?sendUpdates=all`, { method: "POST", body: JSON.stringify(eventPayload) });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error?.message || `Calendar ${r.status}`);
        await db.prepare(
          `INSERT INTO menage_calendar_events (resa_key, bien_id, checkout_date, calendar_event_id, assigne, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(resa_key) DO UPDATE SET calendar_event_id = excluded.calendar_event_id, assigne = excluded.assigne, updated_at = excluded.updated_at`
        ).bind(key, m.bienId, m.checkoutISO, data.id, m.assigneNom || null, Date.now()).run();
        created++;
      }
    } catch (e) {
      errors.push({ key, error: e.message });
    }
  }

  return json({ ok: true, connected: true, created, updated, errors });
}
