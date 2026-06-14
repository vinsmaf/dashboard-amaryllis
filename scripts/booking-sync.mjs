#!/usr/bin/env node
// scripts/booking-sync.mjs — récupère nom + prix des réservations Booking.com en lisant l'extranet
// dans une session déjà connectée (profil Playwright persistant), puis enrichit le Sheet via
// enrichReservation_ (NON destructif, même chemin que pour Airbnb). AUCUN identifiant n'est manipulé
// par le script : Vincent se connecte UNE fois (`--login`), la session persiste dans le profil.
//
// Pourquoi local : Booking exige login + 2FA + anti-bot + token `ses=` en URL → aucun cloud headless
// ne peut s'authentifier. Le script tourne sur le Mac de Vincent (IP résidentielle, sa session).
// Booking n'envoie ni nom ni prix par iCal/email → seule la fiche extranet les porte.
//
// Usage :
//   node scripts/booking-sync.mjs --login                    # 1×  : ouvre l'extranet pour se connecter
//   node scripts/booking-sync.mjs 6191917019:9438450 [...]   # scrape la/les fiche(s) res_id:hotel_id → enrichit
//   HEADED=1 node scripts/booking-sync.mjs <res:hotel>       # affiche le navigateur (debug)
//
// Env : BOOKING_PROFILE_DIR (défaut ~/.amaryllis-booking-profile) · BOOKING_NTFY_TOPIC
//       SHEETS_PROXY_URL (défaut https://villamaryllis.com/api/sheets-proxy)
//
// ⚠️ FRAGILE (assumé) : la session Booking expire régulièrement → si non connecté, le script
// envoie un ntfy « à re-loguer / saisir à la main » et sort en code 2 (jamais d'écriture devinée).

import { chromium } from "playwright";
import os from "node:os";
import path from "node:path";
import { parseBookingDetailText } from "../src/utils/parseBookingReservation.js";

const PROFILE_DIR = process.env.BOOKING_PROFILE_DIR || path.join(os.homedir(), ".amaryllis-booking-profile");
const NTFY_TOPIC  = process.env.BOOKING_NTFY_TOPIC || "amaryllis-alertes-7r4k9";
const SHEETS_PROXY = process.env.SHEETS_PROXY_URL || "https://villamaryllis.com/api/sheets-proxy";
const EXTRANET = "https://admin.booking.com/";
const detailUrl = (resId, hotelId) =>
  `https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/booking.html?lang=fr&res_id=${resId}&hotel_id=${hotelId}`;

async function ntfy(title, body, priority = "high", tags = "warning") {
  try {
    await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: "POST",
      headers: { Title: title, Priority: priority, Tags: tags },
      body,
    });
  } catch { /* fail-silent */ }
}

function isLoginPage(url, text) {
  return /account\.booking\.com|\/sign-in|\/oauth2\/authorize/.test(url) || /Connectez-vous pour gérer/.test(text || "");
}

async function enrich(p) {
  if (!p.bienId || !p.checkin || !p.checkout || !p.voyageur) {
    return { ok: false, skip: "parse incomplet", parsed: p };
  }
  const body = { action: "enrichReservation", bienId: p.bienId, checkin: p.checkin, checkout: p.checkout, voyageur: p.voyageur, montant: p.montant, email: p.email || "" };
  const r = await fetch(SHEETS_PROXY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return r.json().catch(() => ({ ok: false, error: "réponse illisible" }));
}

async function main() {
  const args = process.argv.slice(2);
  const loginMode = args.includes("--login");
  const headed = loginMode || process.env.HEADED === "1";

  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: !headed,
    viewport: { width: 1366, height: 900 },
    locale: "fr-FR",
  });
  const page = ctx.pages()[0] || (await ctx.newPage());

  try {
    if (loginMode) {
      await page.goto(EXTRANET, { waitUntil: "domcontentloaded" }).catch(() => {});
      console.log("\n👉 Connecte-toi à l'extranet Booking dans la fenêtre ouverte (email + mot de passe + 2FA).");
      console.log("   Quand tu vois ton tableau de bord, reviens ici et appuie sur Entrée.\n");
      await new Promise((res) => process.stdin.once("data", res));
      console.log("✅ Session enregistrée dans", PROFILE_DIR);
      return 0;
    }

    const pairs = args.filter((a) => /^\d+:\d+$/.test(a)).map((a) => a.split(":"));
    if (!pairs.length) {
      console.error("Usage: node scripts/booking-sync.mjs <res_id>:<hotel_id> [...]  |  --login");
      return 1;
    }

    let enrichis = 0, ignores = 0, expired = false;
    for (const [resId, hotelId] of pairs) {
      await page.goto(detailUrl(resId, hotelId), { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(2500);
      const url = page.url();
      const text = await page.evaluate(() => document.body.innerText).catch(() => "");
      if (isLoginPage(url, text)) { expired = true; break; }

      const title = await page.title().catch(() => "");
      const parsed = parseBookingDetailText(text, { title, hotelId });
      const res = await enrich(parsed);
      if (res?.matched && Object.keys(res.wrote || {}).length) {
        enrichis++;
        console.log(`✅ ${resId} → ${parsed.bienId} · ${parsed.voyageur} · ${parsed.montant}€`, res.wrote);
      } else if (res?.matched) {
        console.log(`➖ ${resId} → ${parsed.bienId} : déjà complet (rien écrit)`);
      } else {
        ignores++;
        console.log(`⚠️  ${resId} : non enrichi`, res?.skip || res?.error || res);
      }
    }

    if (expired) {
      await ntfy("⚠️ Booking session expirée", `Reconnecte-toi : node scripts/booking-sync.mjs --login (puis relance). Résas non traitées : ${pairs.map(p => p[0]).join(", ")}`, "urgent");
      console.error("🔒 Session expirée — ntfy envoyé, re-login requis.");
      return 2;
    }
    if (ignores) {
      await ntfy("⚠️ Booking : résa(s) à saisir à la main", `${ignores} réservation(s) non parsée(s)/non matchée(s). Vérifie le Sheet.`, "high");
    }
    console.log(`\nBilan : ${enrichis} enrichie(s), ${ignores} à vérifier.`);
    return 0;
  } finally {
    await ctx.close();
  }
}

main().then((code) => process.exit(code ?? 0)).catch(async (e) => {
  console.error("Erreur:", e.message);
  await ntfy("⚠️ Booking sync — erreur", String(e.message).slice(0, 200), "high");
  process.exit(1);
});
