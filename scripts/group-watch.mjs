#!/usr/bin/env node
// scripts/group-watch.mjs — VEILLE GROUPES Facebook (lecture seule, ta session, ton Mac).
// Lit les posts récents des groupes que TU listes, demande à l'agent Répondeur Social
// (serveur, /api/social-draft) si c'est un vrai « cherche une location en Martinique », et si oui
// t'envoie un ntfy avec la réponse PRÊTE À COLLER + le lien du post. TU postes (humain = autorisé).
//
// ⚠️ Aucune API Groups (fermée par Meta) → on lit le DOM dans TA session connectée. Lecture seule,
// JAMAIS d'auto-post chez les autres (= ban). Fragile aux changements d'UI Facebook (heuristique DOM).
//
// Setup (1 fois) :
//   node scripts/group-watch.mjs --login          # ouvre Facebook, tu te connectes, Entrée → session mémorisée
//   echo '["https://www.facebook.com/groups/XXXX","https://www.facebook.com/groups/YYYY"]' > ~/.amaryllis-groups.json
//
// Usage :
//   SOCIAL_DRAFT_SECRET=xxx node scripts/group-watch.mjs            # scanne les groupes du fichier
//   SOCIAL_DRAFT_SECRET=xxx node scripts/group-watch.mjs --groups "url1,url2"
//   HEADED=1 ... (voir le navigateur)
//
// Env : FB_PROFILE_DIR (défaut ~/.amaryllis-fb-profile) · BOOKING_NTFY_TOPIC/NTFY_TOPIC · DRAFT_URL
//       SOCIAL_DRAFT_SECRET (= POSTSTAY_SECRET côté Cloudflare) · GROUPS_FILE (défaut ~/.amaryllis-groups.json)

import { chromium } from "playwright";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const PROFILE_DIR = process.env.FB_PROFILE_DIR || path.join(os.homedir(), ".amaryllis-fb-profile");
const SEEN_FILE   = path.join(os.homedir(), ".amaryllis-fb-seen.json");
const GROUPS_FILE = process.env.GROUPS_FILE || path.join(os.homedir(), ".amaryllis-groups.json");
const NTFY_TOPIC  = process.env.BOOKING_NTFY_TOPIC || process.env.NTFY_TOPIC || "amaryllis-alertes-7r4k9";
const DRAFT_URL   = process.env.DRAFT_URL || "https://villamaryllis.com/api/social-draft";
const SECRET      = process.env.SOCIAL_DRAFT_SECRET || process.env.POSTSTAY_SECRET || "";

async function ntfy(title, body, priority = "high", tags = "speech_balloon") {
  try {
    await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, { method: "POST", headers: { Title: title, Priority: priority, Tags: tags }, body });
  } catch { /* fail-silent */ }
}

function loadSeen() { try { return new Set(JSON.parse(fs.readFileSync(SEEN_FILE, "utf8"))); } catch { return new Set(); } }
function saveSeen(set) { try { fs.writeFileSync(SEEN_FILE, JSON.stringify([...set].slice(-2000))); } catch { /* */ } }

function loadGroups(args) {
  const flag = args.indexOf("--groups");
  if (flag !== -1 && args[flag + 1]) return args[flag + 1].split(",").map((s) => s.trim()).filter(Boolean);
  try { return JSON.parse(fs.readFileSync(GROUPS_FILE, "utf8")); } catch { return []; }
}

// Heuristique d'extraction des posts d'un groupe (DOM, best-effort — à ajuster si Facebook change).
async function extractPosts(page) {
  return page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('[role="article"]')) {
      const text = (el.innerText || "").replace(/\s+/g, " ").trim();
      if (text.length < 25) continue;
      let permalink = "";
      for (const a of el.querySelectorAll('a[href*="/posts/"], a[href*="/permalink/"], a[href*="/groups/"]')) {
        if (/\/(posts|permalink)\//.test(a.href)) { permalink = a.href.split("?")[0]; break; }
      }
      out.push({ text: text.slice(0, 600), permalink });
    }
    return out;
  });
}

async function isLoginPage(page) {
  const u = page.url();
  if (/login|checkpoint|\/recover\//.test(u)) return true;
  const t = await page.evaluate(() => document.body.innerText.slice(0, 300)).catch(() => "");
  return /Connectez-vous|Log in to Facebook|Adresse e-mail ou num/i.test(t);
}

async function main() {
  const args = process.argv.slice(2);
  const loginMode = args.includes("--login");
  const headed = loginMode || process.env.HEADED === "1";

  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: !headed, viewport: { width: 1366, height: 900 }, locale: "fr-FR" });
  const page = ctx.pages()[0] || (await ctx.newPage());

  try {
    if (loginMode) {
      await page.goto("https://www.facebook.com/", { waitUntil: "domcontentloaded" }).catch(() => {});
      console.log("\n👉 Connecte-toi à Facebook dans la fenêtre ouverte, puis reviens ici et appuie sur Entrée.\n");
      await new Promise((res) => process.stdin.once("data", res));
      console.log("✅ Session enregistrée dans", PROFILE_DIR);
      return 0;
    }
    if (!SECRET) { console.error("❌ SOCIAL_DRAFT_SECRET manquant (= POSTSTAY_SECRET Cloudflare)."); return 1; }

    const groups = loadGroups(args);
    if (!groups.length) { console.error(`❌ Aucun groupe. Crée ${GROUPS_FILE} (tableau d'URLs) ou passe --groups "url1,url2".`); return 1; }

    const seen = loadSeen();
    let scanned = 0, leads = 0, expired = false;

    for (const url of groups) {
      await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(2500);
      if (await isLoginPage(page)) { expired = true; break; }
      // charger quelques posts en scrollant
      for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 1600).catch(() => {}); await page.waitForTimeout(1200); }

      const posts = await extractPosts(page).catch(() => []);
      for (const p of posts) {
        const key = p.permalink || ("t:" + p.text.slice(0, 80));
        if (seen.has(key)) continue;
        seen.add(key);
        scanned++;
        try {
          const r = await fetch(`${DRAFT_URL}?secret=${encodeURIComponent(SECRET)}`, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: p.text }),
          }).then((x) => x.json());
          if (r?.lead && r.reply) {
            leads++;
            await ntfy("💬 Lead groupe FB — réponse prête", `« ${p.text.slice(0, 160)} »\n\n→ ${r.reply}\n\n${p.permalink || "(ouvre le groupe)"}`);
            console.log(`✅ lead → ${p.permalink || "(sans lien)"}`);
          }
        } catch (e) { console.error("draft KO:", e.message); }
      }
    }

    saveSeen(seen);
    if (expired) {
      await ntfy("⚠️ Veille groupes — session expirée", "Reconnecte-toi : node scripts/group-watch.mjs --login", "urgent", "warning");
      console.error("🔒 Session Facebook expirée — re-login requis.");
      return 2;
    }
    console.log(`\nBilan : ${scanned} nouveau(x) post(s) analysé(s), ${leads} lead(s) → ntfy.`);
    return 0;
  } finally {
    await ctx.close();
  }
}

main().then((c) => process.exit(c ?? 0)).catch(async (e) => {
  console.error("Erreur:", e.message);
  await ntfy("⚠️ Veille groupes — erreur", String(e.message).slice(0, 200), "high", "warning");
  process.exit(1);
});
