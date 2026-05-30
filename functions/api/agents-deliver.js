// Cloudflare Pages Function — POST /api/agents-deliver
// #5 BRAS EXÉCUTANT ÉLARGI : les agents produisent des LIVRABLES PRÊTS À L'EMPLOI
// (pas juste des lignes de backlog). Chaque livrable est validé avant d'être rendu.
//   type "meta-seo"       → SEO agent : {title ≤60c, description ≤158c} fact-checkés (prêt pour functions/[slug].js)
//   type "email-sequence" → CRM agent : 3 emails {jour, sujet, corps} prêts à envoyer
//   type "pricing-reco"   → Revenue agent : grille tarifaire saisonnière (RECO uniquement)
//
// POST /api/agents-deliver?secret=POSTSTAY_SECRET  { "type":"meta-seo", "bien":"mabouya" }

import { callLLM } from "./_llm.js";
import { BIENS } from "./_biens.js";
import { factCheckCaption } from "./_factcheck.js";

const json = (d, s = 200) => new Response(JSON.stringify(d, null, 2), {
  status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
});
const NOM = `NOMENCLATURE STRICTE : seuls Amaryllis et Iguana sont des "villas" ; Zandoli=logement, Géko=cocon, Mabouya=studio, Bellevue=appartement de standing, Nogent=appartement. Jamais "villa Zandoli/Géko/Mabouya/Bellevue".`;
const parseJSON = (t, f) => { try { const m = String(t).match(/[\[{][\s\S]*[\]}]/); return m ? JSON.parse(m[0]) : f; } catch { return f; } };
const bienCtx = (b) => `${b.nom} (${b.type}, ${b.lieu || "Sainte-Luce"}) — ${b.equip}${b.capacite ? `, ${b.capacite} pers` : ""}, dès ${b.prix}€/nuit. À NE PAS DÉPASSER : ${b.interdit}.`;

// ── meta-seo : title ≤60c + description ≤158c, fact-checkés, 1 retry si invalide ──
async function metaSeo(env, bienId) {
  const b = BIENS[bienId];
  if (!b) return { error: `bien inconnu: ${bienId}` };
  const ask = (note = "") => callLLM(env, {
    tier: "smart", max_tokens: 300, temperature: 0.4, logSource: `deliver:meta:${bienId}`,
    messages: [{ role: "user", content:
`Tu es SEO Content Writer pour Amaryllis Locations. ${NOM}
Bien : ${bienCtx(b)}
Génère pour la page de ce bien :
- "title" : ≤ 60 caractères, mot-clé localité en tête, accrocheur
- "description" : ≤ 158 caractères, bénéfice + appel à la réservation directe
${note}
Réponds UNIQUEMENT en JSON : {"title":"...","description":"..."}` }],
  });
  for (const note of ["", "⚠️ Le précédent essai dépassait les limites ou contenait une erreur. Respecte STRICTEMENT ≤60 et ≤158 caractères et les équipements réels."]) {
    const r = await ask(note);
    const o = parseJSON(r.text, {});
    const title = String(o.title || "").trim(), description = String(o.description || "").trim();
    const fc = factCheckCaption(`${title} ${description}`);
    const valid = title && description && title.length <= 60 && description.length <= 158 && fc.length === 0;
    if (valid) return { bien: bienId, title, description, len_title: title.length, len_desc: description.length, valid: true, ready_for: "functions/[slug].js SEO[" + bienId + "]" };
    if (note) return { bien: bienId, title, description, len_title: title.length, len_desc: description.length, valid: false, issues: { trop_long_title: title.length > 60, trop_long_desc: description.length > 158, factcheck: fc } };
  }
}

// ── email-sequence : 3 emails prêts ──────────────────────────────────────────
async function emailSequence(env, theme) {
  const r = await callLLM(env, {
    tier: "medium", max_tokens: 1500, temperature: 0.5, logSource: "deliver:email-seq",
    messages: [{ role: "user", content:
`Tu es CRM Manager d'Amaryllis Locations (ton chaleureux, "vous" formel). ${NOM}
Thème : "${theme}". Génère une séquence de 3 emails pour voyageurs en réservation directe.
Chaque email : {"jour":"J+n","sujet":"≤60c","corps":"≤120 mots, chaleureux, 1 CTA clair"}.
Réponds UNIQUEMENT en JSON : {"emails":[ ... ]}` }],
  });
  const o = parseJSON(r.text, { emails: [] });
  const emails = (o.emails || []).slice(0, 3).map(e => ({ ...e, factcheck: factCheckCaption(String(e.corps || "")) }));
  return { theme, emails, ready: emails.length === 3 && emails.every(e => e.factcheck.length === 0) };
}

// ── pricing-reco : grille saisonnière (RECO, jamais appliqué) ────────────────
async function pricingReco(env, bienId) {
  const b = BIENS[bienId];
  if (!b) return { error: `bien inconnu: ${bienId}` };
  const r = await callLLM(env, {
    tier: "smart", max_tokens: 700, temperature: 0.3, logSource: `deliver:pricing:${bienId}`,
    messages: [{ role: "user", content:
`Tu es Revenue Manager d'Amaryllis Locations. ${NOM}
Bien : ${bienCtx(b)} (prix de base ${b.prix}€).
Propose une GRILLE TARIFAIRE saisonnière INDICATIVE (Martinique : haute = 15 déc→15 avr, basse = juin→nov).
⚠️ RECOMMANDATION uniquement — jamais appliquée automatiquement.
JSON : {"recommandation":true,"grille":[{"saison":"...","prix_nuit":n,"sejour_min":n,"note":"..."}]}` }],
  });
  const o = parseJSON(r.text, {});
  return { bien: bienId, recommandation: true, grille: o.grille || [], rappel: "RECO — à valider par Vincent avant application" };
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  if (!env.POSTSTAY_SECRET || url.searchParams.get("secret") !== env.POSTSTAY_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }
  const body = await request.json().catch(() => ({}));
  const type = body.type;
  try {
    if (type === "meta-seo") return json({ ok: true, type, livrable: await metaSeo(env, body.bien) });
    if (type === "email-sequence") return json({ ok: true, type, livrable: await emailSequence(env, body.theme || "fidélisation post-séjour") });
    if (type === "pricing-reco") return json({ ok: true, type, livrable: await pricingReco(env, body.bien) });
    return json({ error: "type inconnu (meta-seo | email-sequence | pricing-reco)" }, 400);
  } catch (e) { return json({ error: e.message }, 500); }
}
