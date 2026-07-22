// GET /api/social-insights — Social Growth Manager, BRIQUE 1 : MESURE.
//
// Snapshot quotidien des abonnés par plateforme (série temporelle persistée en D1), pour piloter
// la croissance sur des semaines/mois — là où /api/meta-insights ne fait qu'un pull live non stocké.
//
// Plateformes :
//   facebook  : fan_count (Graph API, token Meta existant)
//   instagram : followers_count (Graph API)
//   youtube   : subscriberCount (Data API v3) — SI YOUTUBE_CHANNEL_ID + clé configurés, sinon not_configured
//   gbp       : bloqué (pending_access) tant que l'accès API Google Business Profile n'est pas approuvé
//
// Écrit 1 ligne / plateforme / jour UTC dans social_snapshots (idempotent). Ne persiste JAMAIS
// une valeur non mesurable (pas de faux zéro). Calcule la croissance + le verdict vs cible % mensuelle.
//
// Auth : ?secret=POSTSTAY_SECRET (cron)  OU  Bearer admin.
// ?dry=1 : calcule et renvoie sans rien écrire en base.

import { verifyBearer } from "./_adminauth.js";
import {
  SOCIAL_PLATFORMS,
  PLATFORM_LABELS,
  computePlatformGrowth,
  targetVerdict,
  neededMonthlyFollowers,
  platformHealth,
  summarizeGrowth,
} from "../../src/utils/socialGrowth.js";

const GV = "v25.0";
const BASE = `https://graph.facebook.com/${GV}`;

const json = (d, s = 200) =>
  new Response(JSON.stringify(d, null, 2), {
    status: s,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

const todayUTC = () => new Date().toISOString().slice(0, 10);

async function gGet(path, token) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`${BASE}/${path}${sep}access_token=${token}`);
  return r.json();
}

// ── Lecture d'un compteur d'abonnés par plateforme ───────────────────────────
// Chaque fonction renvoie { followers:(Number|null), extra:Object, configured:bool, blocked:bool, error:(string|null) }

async function readFacebook(env) {
  const token = env.META_PAGE_TOKEN, pageId = env.META_PAGE_ID;
  if (!token || !pageId) return { followers: null, extra: {}, configured: false, blocked: false, error: null };
  try {
    const d = await gGet(`${pageId}?fields=fan_count,followers_count,name`, token);
    if (d.error) return { followers: null, extra: {}, configured: true, blocked: false, error: d.error.message };
    const followers = d.followers_count ?? d.fan_count ?? null;
    return { followers, extra: { name: d.name || null }, configured: true, blocked: false, error: followers == null ? "aucun compteur renvoyé" : null };
  } catch (e) {
    return { followers: null, extra: {}, configured: true, blocked: false, error: String(e) };
  }
}

async function readInstagram(env) {
  const token = env.META_PAGE_TOKEN, igId = env.META_IG_ACCOUNT_ID;
  if (!token || !igId) return { followers: null, extra: {}, configured: false, blocked: false, error: null };
  try {
    const d = await gGet(`${igId}?fields=followers_count,media_count,username`, token);
    if (d.error) return { followers: null, extra: {}, configured: true, blocked: false, error: d.error.message };
    return {
      followers: d.followers_count ?? null,
      extra: { username: d.username || null, media_count: d.media_count ?? null },
      configured: true, blocked: false,
      error: d.followers_count == null ? "aucun compteur renvoyé" : null,
    };
  } catch (e) {
    return { followers: null, extra: {}, configured: true, blocked: false, error: String(e) };
  }
}

async function readYouTube(env) {
  const channel = env.YOUTUBE_CHANNEL_ID;
  const key = env.YOUTUBE_API_KEY || env.GOOGLE_PLACES_API_KEY; // réutilise la clé Google si YT Data API y est activée
  if (!channel || !key) return { followers: null, extra: {}, configured: false, blocked: false, error: null };
  try {
    // Accepte un id de chaîne (UC…) ou un handle (@nom)
    const selector = channel.startsWith("UC")
      ? `id=${encodeURIComponent(channel)}`
      : `forHandle=${encodeURIComponent(channel.startsWith("@") ? channel : "@" + channel)}`;
    const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&${selector}&key=${key}`);
    const d = await r.json();
    if (d.error) return { followers: null, extra: {}, configured: true, blocked: false, error: d.error?.message || "YouTube API error" };
    const stats = d.items?.[0]?.statistics;
    if (!stats) return { followers: null, extra: {}, configured: true, blocked: false, error: "chaîne introuvable" };
    if (stats.hiddenSubscriberCount) return { followers: null, extra: {}, configured: true, blocked: false, error: "compteur d'abonnés masqué sur la chaîne" };
    return {
      followers: parseInt(stats.subscriberCount, 10),
      extra: { videos: parseInt(stats.videoCount, 10) || null, views: parseInt(stats.viewCount, 10) || null },
      configured: true, blocked: false, error: null,
    };
  } catch (e) {
    return { followers: null, extra: {}, configured: true, blocked: false, error: String(e) };
  }
}

// GBP : pas de compteur "abonnés" par API tant que l'accès Business Profile n'est pas accordé.
function readGbp(env) {
  const granted = env.GBP_API_ENABLED === "1" || env.GBP_API_ENABLED === "true";
  return { followers: null, extra: {}, configured: granted, blocked: !granted, error: null };
}

async function readPlatform(platform, env) {
  switch (platform) {
    case "facebook":  return readFacebook(env);
    case "instagram": return readInstagram(env);
    case "youtube":   return readYouTube(env);
    case "gbp":       return readGbp(env);
    default:          return { followers: null, extra: {}, configured: false, blocked: false, error: "plateforme inconnue" };
  }
}

async function ensureTable(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS social_snapshots (
        platform      TEXT    NOT NULL,
        snapshot_date TEXT    NOT NULL,
        followers     INTEGER,
        extra         TEXT,
        created_at    INTEGER NOT NULL,
        PRIMARY KEY (platform, snapshot_date)
      )`,
    )
    .run();
}

async function loadHistory(db, platform, sinceDate) {
  const { results } = await db
    .prepare("SELECT snapshot_date AS date, followers FROM social_snapshots WHERE platform = ? AND snapshot_date >= ? ORDER BY snapshot_date")
    .bind(platform, sinceDate)
    .all();
  return (results || []).map(r => ({ date: r.date, followers: typeof r.followers === "number" ? r.followers : null }));
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const secretOk = env.POSTSTAY_SECRET && url.searchParams.get("secret") === env.POSTSTAY_SECRET;
  const { ok: bearerOk } = await verifyBearer(request, env);
  if (!secretOk && !bearerOk) return json({ error: "Non autorisé" }, 401);

  const db = env.revenue_manager;
  if (!db) return json({ error: "D1 (revenue_manager) non lié" }, 500);

  const dry = url.searchParams.get("dry") === "1";
  const targetPct = parseFloat(env.SOCIAL_GROWTH_TARGET_PCT || "5") || 5;
  const today = todayUTC();
  const since = new Date(`${today}T00:00:00Z`);
  since.setUTCDate(since.getUTCDate() - 35);
  const sinceDate = since.toISOString().slice(0, 10);

  await ensureTable(db);

  const platforms = [];
  for (const platform of SOCIAL_PLATFORMS) {
    const raw = await readPlatform(platform, env);
    const health = platformHealth(raw);

    // Persiste uniquement une vraie mesure (jamais un null), une ligne/plateforme/jour.
    if (!dry && health === "measurable" && typeof raw.followers === "number") {
      await db
        .prepare(
          `INSERT INTO social_snapshots (platform, snapshot_date, followers, extra, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(platform, snapshot_date) DO UPDATE SET
             followers = excluded.followers, extra = excluded.extra, created_at = excluded.created_at`,
        )
        .bind(platform, today, raw.followers, JSON.stringify(raw.extra || {}), Math.floor(Date.now() / 1000))
        .run();
    }

    // Historique pour la croissance : inclut le point du jour même en dry-run.
    let history = await loadHistory(db, platform, sinceDate);
    if (health === "measurable" && typeof raw.followers === "number") {
      history = history.filter(h => h.date !== today).concat({ date: today, followers: raw.followers });
    }

    const growth = computePlatformGrowth(history, today);
    const verdict = targetVerdict(growth, targetPct);

    platforms.push({
      platform,
      label: PLATFORM_LABELS[platform],
      health,
      current: growth.current,
      growth,
      verdict: verdict.verdict,
      gap_pct: verdict.gap_pct,
      target_pct: targetPct,
      needed_monthly: neededMonthlyFollowers(growth.current, targetPct),
      extra: raw.extra || {},
      error: raw.error || null,
    });
  }

  return json({
    ok: true,
    generated_at: new Date().toISOString().slice(0, 16).replace("T", " "),
    dry,
    target_pct: targetPct,
    platforms,
    summary: summarizeGrowth(platforms),
  });
}
