#!/usr/bin/env node
// scripts/funnel.mjs — Funnel LIVE depuis GA4 (source unique, jamais copié en mémoire).
//
// Lit /api/analytics (proxy GA4, public, cache CDN 5 min) et affiche le tunnel de
// conversion réel + trafic + revenu + canaux. Snapshot à l'écran, JAMAIS persisté.
//
// Usage : npm run funnel              # prod villamaryllis.com
//         FUNNEL_URL=http://localhost:8788/api/analytics npm run funnel   # local
//
// Règle (ADR-G-001) : ces chiffres sont VOLATILS → on ne les recopie nulle part.
// Pour une reco conversion/pricing/roadmap : relancer cette commande, ne pas se fier
// à un chiffre figé dans .memory/.

const URL = process.env.FUNNEL_URL || "https://villamaryllis.com/api/analytics";

const pct = (n, d) => (d > 0 ? ((n / d) * 100).toFixed(1) + "%" : "—");
const eur = (n) => Math.round(Number(n) || 0).toLocaleString("fr-FR") + " €";

const data = await fetch(URL, { headers: { "User-Agent": "amaryllis-funnel-cli" } })
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .catch((e) => {
    console.error(`❌ Impossible de lire ${URL} : ${e.message}`);
    process.exit(1);
  });

const f = Object.fromEntries((data.funnel || []).map((x) => [x.eventName, x.eventCount]));
const vi = f.view_item || 0;
const bc = f.begin_checkout || 0;
const api = f.add_payment_info || 0;
const pu = f.purchase || 0;
const lead = f.generate_lead || 0;

// Sessions période courante (date_range_0) sur les 30 derniers jours.
const sessions = (data.overview || [])
  .filter((r) => r.dateRange === "date_range_0")
  .reduce((s, r) => s + (r.sessions || 0), 0);
const revenue = (data.revenue?.[0]?.totalRevenue) || 0;

const today = new Date().toISOString().slice(0, 10);
console.log(`\n📊 FUNNEL LIVE — villamaryllis.com — ${today} (30 j glissants, source GA4)\n`);
console.log(`   Trafic 30j     : ${sessions} sessions  (~${Math.round(sessions / 30)}/jour)`);
console.log(`   Revenu 30j     : ${eur(revenue)}\n`);
console.log(`   view_item         ${String(vi).padStart(5)}`);
console.log(`          │  ${pct(bc, vi)}   (intérêt : clic dates+prix)`);
console.log(`   begin_checkout    ${String(bc).padStart(5)}`);
console.log(`          │  ${pct(api, bc)}   (formulaire + technique)`);
console.log(`   add_payment_info  ${String(api).padStart(5)}   ${api === 0 ? "(nouveau event — données à venir)" : "(écran carte affiché)"}`);
// pu > api = mathématiquement impossible pour un vrai tunnel — signe que des achats
// (ex: liens de paiement WhatsApp) contournent le checkout on-site et ne déclenchent
// jamais add_payment_info. Le ratio n'est alors pas un taux de fuite interprétable.
const apiRatioLabel = api > 0 && pu > api
  ? "◀── ratio non interprétable (achats hors tunnel on-site, ex: lien WhatsApp)"
  : "◀── fuite paiement réelle";
console.log(`          │  ${pct(pu, api)}   (saisie CB / 3DS)  ${apiRatioLabel}`);
console.log(`   purchase          ${String(pu).padStart(5)}   (${pct(pu, vi)} global)`);
console.log(`   generate_lead     ${String(lead).padStart(5)}\n`);

if (data.byChannel?.length) {
  console.log("   Canaux (sessions · achats · revenu) :");
  for (const c of data.byChannel.slice(0, 8)) {
    const flag = c.ecommercePurchases > 0 ? "✅" : "  ";
    console.log(
      `   ${flag} ${(c.sessionDefaultChannelGroup || "?").padEnd(16)} ${String(c.sessions).padStart(4)} · ${c.ecommercePurchases} · ${eur(c.totalRevenue)}`,
    );
  }
  console.log();
}

if (data.byBien?.length) {
  console.log("   Ventes par bien (attribution) :");
  for (const b of data.byBien) {
    console.log(`   · ${(b["customEvent:bien_id"] || "?").padEnd(14)} ${b.eventCount} achat(s) · ${eur(b.totalRevenue)}`);
  }
  console.log();
}

console.log("   ⚠️  Chiffres VOLATILS — ne pas recopier en mémoire (ADR-G-001). Re-lancer `npm run funnel`.\n");
