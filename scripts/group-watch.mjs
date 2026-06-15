#!/usr/bin/env node
// scripts/group-watch.mjs — VEILLE SOCIALE Facebook (lecture seule, ta session, ton Mac).
//
// Surveille 3 surfaces dans TA session :
//   1. Commentaires de TA PAGE (Amaryllis Location) → lecture DOM, détection lead, ntfy brouillon
//   2. Posts récents de GROUPES listés → idem
//   3. (optionnel) Mentions de ta page dans des posts publics
//
// ⚠️ Lecture seule. JAMAIS d'auto-post (ni sur la page, ni dans les groupes). Tu postes toi-même.
//    API Groups fermée par Meta → Playwright obligatoire. API page feed bloquée (app-level config
//    Meta non faite) → Playwright aussi pour la page.
//
// Setup (1 fois) :
//   node scripts/group-watch.mjs --login          # ouvre Facebook, tu te connectes, Entrée → session mémorisée
//   echo '["https://www.facebook.com/groups/XXXX"]' > ~/.amaryllis-groups.json   # groupes à surveiller
//
// Usage :
//   SOCIAL_DRAFT_SECRET=xxx node scripts/group-watch.mjs            # scanne page + groupes
//   SOCIAL_DRAFT_SECRET=xxx node scripts/group-watch.mjs --no-page  # groupes seulement
//   SOCIAL_DRAFT_SECRET=xxx node scripts/group-watch.mjs --groups "url1,url2"
//   HEADED=1 ... (voir le navigateur)
//
// Env : FB_PROFILE_DIR · BOOKING_NTFY_TOPIC/NTFY_TOPIC · DRAFT_URL
//       SOCIAL_DRAFT_SECRET (= POSTSTAY_SECRET Cloudflare) · GROUPS_FILE · PAGE_URL

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
// URL de la page Facebook Amaryllis (override via PAGE_URL si elle change).
const PAGE_URL    = process.env.PAGE_URL || "https://www.facebook.com/Amaryllis.villa";

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

// Extrait les commentaires récents visibles sous les posts de la PAGE (DOM, best-effort).
// Retourne { text, permalink, commentId } pour chaque commentaire extrait.
async function extractPageComments(page) {
  return page.evaluate(() => {
    const out = [];
    // Chaque post de la page est un [role="article"]. On cherche les commentaires en dessous.
    for (const article of document.querySelectorAll('[role="article"]')) {
      // Lien du post (permalink)
      let postLink = "";
      for (const a of article.querySelectorAll('a[href*="/posts/"], a[href*="/permalink/"]')) {
        if (/\/(posts|permalink)\//.test(a.href)) { postLink = a.href.split("?")[0]; break; }
      }
      // Les commentaires sont dans des sous-articles ou des éléments avec data-testid="UFI2CommentsList..."
      // FB DOM est très variable — on cible les blocs de texte qui ne sont pas le post lui-même.
      const seen = new Set();
      for (const cmEl of article.querySelectorAll('[aria-label*="omment"], [data-testid*="comment"]')) {
        const txt = (cmEl.innerText || "").replace(/\s+/g, " ").trim();
        if (txt.length < 5 || seen.has(txt)) continue;
        seen.add(txt);
        // id synthétique basé sur le texte (suffisant pour le dédup)
        const cid = "page-cm-" + btoa(encodeURIComponent(txt.slice(0, 60))).slice(0, 20);
        out.push({ text: txt.slice(0, 500), permalink: postLink, commentId: cid });
      }
    }
    return out;
  });
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
    const skipPage = args.includes("--no-page");
    if (!groups.length && skipPage) { console.error("❌ Aucun groupe ET --no-page : rien à surveiller."); return 1; }

    const seen = loadSeen();
    let scanned = 0, leads = 0, expired = false;

    // ── 1. COMMENTAIRES DE LA PAGE ─────────────────────────────────────────────
    if (!skipPage) {
      await page.goto(PAGE_URL, { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(3000);
      if (await isLoginPage(page)) {
        expired = true;
      } else {
        // Cliquer "Posts" si le tab est disponible pour charger les posts récents
        await page.locator('text=/^Posts$|^Publications$/', { exact: true }).first().click().catch(() => {});
        await page.waitForTimeout(1500);
        for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 1800).catch(() => {}); await page.waitForTimeout(1200); }

        const comments = await extractPageComments(page).catch(() => []);
        for (const c of comments) {
          if (seen.has(c.commentId)) continue;
          seen.add(c.commentId);
          scanned++;
          try {
            const r = await fetch(`${DRAFT_URL}?secret=${encodeURIComponent(SECRET)}`, {
              method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: c.text }),
            }).then((x) => x.json());
            if (r?.lead && r.reply) {
              leads++;
              await ntfy("💬 Lead PAGE FB — réponse prête", `« ${c.text.slice(0, 160)} »\n\n→ ${r.reply}\n\n${c.permalink || PAGE_URL}`);
              console.log(`✅ lead page → ${c.permalink || "(sans lien)"}`);
            }
          } catch (e) { console.error("draft KO:", e.message); }
        }
        console.log(`Page Amaryllis : ${comments.length} commentaire(s) extrait(s), ${leads} lead(s) so far.`);
      }
    }

    // ── 2. POSTS DES GROUPES ───────────────────────────────────────────────────
    for (const url of groups) {
      if (expired) break;
      await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(2500);
      if (await isLoginPage(page)) { expired = true; break; }
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
            console.log(`✅ lead groupe → ${p.permalink || "(sans lien)"}`);
          }
        } catch (e) { console.error("draft KO:", e.message); }
      }
    }

    saveSeen(seen);
    if (expired) {
      await ntfy("⚠️ Veille sociale — session expirée", "Reconnecte-toi : node scripts/group-watch.mjs --login", "urgent", "warning");
      console.error("🔒 Session Facebook expirée — re-login requis.");
      return 2;
    }
    console.log(`\nBilan : ${scanned} élément(s) analysé(s), ${leads} lead(s) → ntfy.`);
    return 0;
  } finally {
    await ctx.close();
  }
}

main().then((c) => process.exit(c ?? 0)).catch(async (e) => {
  console.error("Erreur:", e.message);
  await ntfy("⚠️ Veille sociale — erreur", String(e.message).slice(0, 200), "high", "warning");
  process.exit(1);
});
