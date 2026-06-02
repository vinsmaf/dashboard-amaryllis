/**
 * SEOAuditTab — diagnostic SEO + générateur d'articles long-tail.
 *
 * - État schema/sitemap/indexation live (via fetch des URLs publiques)
 * - 30 mots-clés cibles avec statut
 * - Bouton "Générer un article long-tail du mois" via seo-content-writer
 *
 * Sources externes : sitemap.xml, robots.txt, /amaryllis (pour compter les
 * blocs ld+json côté server-rendered).
 */
import { useState, useEffect } from "react";
import { adminFetch } from "../lib/apiFetch.js";

// 30 mots-clés cibles à fort potentiel (volume Google FR + intention voyageur)
const KEYWORDS = [
  // Volume élevé · concurrence moyenne
  { k: "location villa Martinique",                       vol: "5400", target: "/", priority: "high" },
  { k: "location villa Sainte-Luce",                      vol: "1900", target: "/", priority: "high" },
  { k: "villa piscine Martinique",                        vol: "2400", target: "/location-villa-martinique-piscine", priority: "high" },
  { k: "villa Martinique vue mer",                        vol: "880",  target: "/amaryllis", priority: "high" },
  { k: "location vacances Martinique",                    vol: "8100", target: "/", priority: "high" },
  // Long-tail décisionnels
  { k: "villa Martinique 8 personnes",                    vol: "390",  target: "/amaryllis", priority: "med" },
  { k: "villa Martinique avec piscine débordement",       vol: "260",  target: "/amaryllis", priority: "med" },
  { k: "studio jacuzzi Martinique",                       vol: "210",  target: "/mabouya", priority: "med" },
  { k: "location villa Sainte-Luce piscine",              vol: "320",  target: "/zandoli", priority: "med" },
  { k: "réservation directe villa Martinique",            vol: "170",  target: "/reservation-directe-martinique", priority: "med" },
  // Saisonniers & destinations
  { k: "Martinique avril 2026",                           vol: "590",  target: "/meilleure-saison-martinique", priority: "med" },
  { k: "meilleure saison Martinique",                     vol: "1300", target: "/meilleure-saison-martinique", priority: "high" },
  { k: "plage Les Salines Martinique",                    vol: "1200", target: "/guide-sainte-anne", priority: "med" },
  { k: "Rocher du Diamant Martinique",                    vol: "1000", target: "/guide-le-diamant", priority: "med" },
  { k: "plongée Martinique",                              vol: "2100", target: "/guide-plongee-martinique", priority: "high" },
  { k: "distilleries Martinique",                         vol: "1100", target: "/guide-distilleries-martinique", priority: "high" },
  { k: "randonnée Martinique",                            vol: "1900", target: "/guide-randonnees-martinique", priority: "high" },
  { k: "gastronomie créole Martinique",                   vol: "210",  target: "/guide-gastronomie-martinique", priority: "med" },
  // Quartiers + activités
  { k: "Trois-Îlets Martinique",                          vol: "590",  target: "/guide-trois-ilets", priority: "med" },
  { k: "Saint-Pierre Martinique",                         vol: "880",  target: "/guide-saint-pierre-martinique", priority: "med" },
  { k: "Anse Mitan Trois-Îlets",                          vol: "320",  target: "/guide-trois-ilets", priority: "low" },
  { k: "François Martinique",                             vol: "260",  target: "/guide-francois-martinique", priority: "low" },
  { k: "Anse Arlet Martinique",                           vol: "320",  target: "/guide-arlet", priority: "low" },
  // B2B / niches
  { k: "séminaire Martinique entreprise",                 vol: "70",   target: "/seminaires", priority: "low" },
  { k: "location villa luxe Martinique",                  vol: "320",  target: "/amaryllis", priority: "med" },
  { k: "villa Martinique animaux acceptés",               vol: "90",   target: "/amaryllis", priority: "low" },
  // Nogent (segment IDF)
  { k: "location appartement Nogent-sur-Marne",           vol: "260",  target: "/nogent", priority: "med" },
  { k: "appartement bord de Marne",                       vol: "170",  target: "/guide-nogent-sur-marne", priority: "low" },
  // Voyage authentique
  { k: "Martinique authentique",                          vol: "210",  target: "/explorer", priority: "low" },
  { k: "Martinique en famille",                           vol: "880",  target: "/", priority: "med" },
];

export default function SEOAuditTab() {
  const [audit, setAudit] = useState({ loading: true });
  const [genStatus, setGenStatus] = useState("idle");
  const [genMsg, setGenMsg] = useState("");

  // Audit live : fetch sitemap + /amaryllis pour compter schemas
  useEffect(() => {
    Promise.all([
      fetch("/sitemap.xml").then(r => r.text()).catch(() => null),
      fetch("/robots.txt").then(r => r.text()).catch(() => null),
      fetch("/amaryllis").then(r => r.text()).catch(() => null),
    ]).then(([sitemap, robots, page]) => {
      const sitemapUrls = sitemap ? (sitemap.match(/<loc>/g) || []).length : 0;
      const robotsOk    = robots ? robots.length > 100 : false;
      const ldJsonCount = page ? (page.match(/application\/ld\+json/g) || []).length : 0;
      const hasFAQ      = page ? /FAQPage/.test(page) : false;
      const hasCanonical= page ? /rel="canonical"/.test(page) : false;
      const hasHreflang = page ? /hreflang="en"/.test(page) : false;
      const hasOg       = page ? /property="og:/.test(page) : false;
      setAudit({ loading: false, sitemapUrls, robotsOk, ldJsonCount, hasFAQ, hasCanonical, hasHreflang, hasOg });
    });
  }, []);

  const generateLongTailArticle = async () => {
    setGenStatus("gen");
    setGenMsg("");
    const moisLabels = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
    const now = new Date();
    const moisCourant = moisLabels[now.getMonth()];
    const annee = now.getFullYear();

    // Pioche un mot-clé long-tail aléatoire prioritaire
    const candidates = KEYWORDS.filter(k => k.priority !== "low");
    const kw = candidates[Math.floor(Math.random() * candidates.length)];

    const brief = `Article de blog SEO long-tail — ${moisCourant} ${annee}
Mot-clé cible : "${kw.k}" (volume estimé ${kw.vol} recherches/mois Google FR)
URL cible pour maillage interne : ${kw.target}

Type : article de blog 600-900 mots, optimisé SEO mais lisible et utile pour le voyageur.
Structure : H1 (mot-clé exact), intro 80 mots, 3-4 H2 thématiques, conclusion + CTA.
Ton : voix Amaryllis (formel, sensoriel, informatif), pas pub Meta Ads.
Inclure 1-2 liens internes vers ${kw.target} et 1 vers /amaryllis.
NE PAS inventer d'équipement : Amaryllis = piscine débordement eau salée 4×7m (PAS de jacuzzi),
Mabouya = jacuzzi privatif (seul), Iguana = eau salée non chlorée, Zandoli+Géko = piscines privatives cascade.

Retourne un draft de type "blog_article" avec : { title, slug, h1, intro, sections: [{h2, body}], cta, hashtags, photo_url }.`;

    try {
      const r = await adminFetch("/api/agents-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: "seo-content-writer", brief }),
      });
      const data = await r.json();
      if (data.ok || data.draftsCreated) {
        setGenStatus("ok");
        setGenMsg(`✓ Article long-tail généré sur "${kw.k}". Voir l'onglet Approbations.`);
      } else {
        throw new Error(data.error || "Génération échouée");
      }
    } catch (e) {
      setGenStatus("err");
      setGenMsg(e.message);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
          🔍 SEO Audit & Articles long-tail
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          Diagnostic SEO live de villamaryllis.com + générateur d'articles ciblant les mots-clés à fort potentiel.
        </div>
      </div>

      {/* Audit live */}
      <Section title="📋 État SEO live" sub="Vérifications sur les URLs publiques.">
        {audit.loading ? (
          <div style={{ color: "#64748b" }}>Chargement…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <Check label="Sitemap URLs"      value={audit.sitemapUrls}    ok={audit.sitemapUrls >= 30} sub="cible 30+" />
            <Check label="Robots.txt"        value={audit.robotsOk ? "OK" : "Absent"} ok={audit.robotsOk} />
            <Check label="JSON-LD blocs"     value={audit.ldJsonCount}    ok={audit.ldJsonCount >= 3} sub="cible 3+ (Org + Rental + FAQ)" />
            <Check label="Schema FAQ"        value={audit.hasFAQ ? "✓ présent" : "Manquant"} ok={audit.hasFAQ} sub="Rich snippet PAA" />
            <Check label="Canonical"         value={audit.hasCanonical ? "OK" : "Absent"} ok={audit.hasCanonical} />
            <Check label="Hreflang EN"       value={audit.hasHreflang ? "OK" : "Absent"} ok={audit.hasHreflang} />
            <Check label="OpenGraph"         value={audit.hasOg ? "OK" : "Absent"} ok={audit.hasOg} sub="FB/IG partage" />
          </div>
        )}
      </Section>

      {/* Générateur d'articles */}
      <Section title="📝 Article long-tail du mois" sub="L'IA SEO Content Writer génère un article 600-900 mots optimisé pour un mot-clé cible. Apparaîtra dans Approbations.">
        <button
          onClick={generateLongTailArticle}
          disabled={genStatus === "gen"}
          style={{
            padding: "11px 22px", borderRadius: 10, border: "none",
            background: genStatus === "ok" ? "#10b981" : genStatus === "err" ? "#ef4444" : "#0ea5e9",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: genStatus === "gen" ? "wait" : "pointer",
            opacity: genStatus === "gen" ? 0.6 : 1,
          }}
        >
          {genStatus === "gen" ? "⟳ Génération…" : genStatus === "ok" ? "✓ Article créé" : genStatus === "err" ? "❌ Réessayer" : "🎯 Générer l'article du mois"}
        </button>
        {genMsg && (
          <div style={{ marginTop: 10, fontSize: 12, color: genStatus === "ok" ? "#10b981" : "#fca5a5" }}>{genMsg}</div>
        )}
      </Section>

      {/* Mots-clés cibles */}
      <Section title={`🎯 Mots-clés cibles (${KEYWORDS.length})`} sub="Tri par priorité. Click sur un mot-clé pour voir sa page cible.">
        <KeywordsTable items={KEYWORDS} />
      </Section>

      {/* Actions SEO à faire */}
      <Section title="✅ Tactiques SEO" sub="Checklist persistante des leviers SEO à activer.">
        <Checklist
          storageKey="ldb_seo_check"
          items={[
            { id: "gsc",         label: "Connecter Google Search Console + Bing Webmaster",                                impact: "🔥🔥🔥", who: "Webmaster" },
            { id: "schema-faq",  label: "Schema FAQ server-side sur les 7 fiches biens",                                  impact: "🔥🔥🔥", who: "✓ FAIT (29 mai 2026)" },
            { id: "schema-rev",  label: "Schema VacationRental + AggregateRating server-side",                            impact: "🔥🔥🔥", who: "✓ FAIT" },
            { id: "long-tail",   label: "Articles long-tail mensuels (génération auto)",                                  impact: "🔥🔥",   who: "seo-content-writer cron" },
            { id: "backlinks",   label: "Backlinks : guest posts blogs voyage MQ (Madinin'Art, etc.)",                    impact: "🔥🔥",   who: "Manuel" },
            { id: "perf-lcp",    label: "Optimiser Core Web Vitals (LCP < 2.5s) sur fiches biens",                        impact: "🔥",    who: "Developpeur multimedia" },
            { id: "links-mesh",  label: "Maillage interne systématique guides → biens",                                   impact: "🔥🔥",   who: "Manuel via Approbations" },
            { id: "alt-tags",    label: "Alt tags sémantiques sur toutes les images (accessibilité + SEO)",                 impact: "🔥",    who: "Photographe DA" },
            { id: "mobile",      label: "Audit mobile-first : 62%+ du trafic GA4",                                         impact: "🔥",    who: "Webmaster" },
            { id: "google-reviews", label: "Réponses systématiques aux avis Google (signal local SEO fort)",             impact: "🔥🔥",   who: "Responsable service client" },
            { id: "bbl-listings",  label: "Booking.com listings optimisés (rebondit sur SEO Google)",                    impact: "🔥",    who: "Manuel" },
            { id: "blog",        label: "Page /blog dédiée pour les articles long-tail",                                  impact: "🔥",    who: "Webmaster" },
          ]}
        />
      </Section>
    </div>
  );
}

// ── Composants internes ────────────────────────────────────────────────

function Check({ label, value, ok, sub }) {
  const color = ok ? "#10b981" : "#ef4444";
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}33`, borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, sub, children }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>{sub}</div>}
      {children}
    </div>
  );
}

function KeywordsTable({ items }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? items : items.filter(i => i.priority === filter);
  const prioColor = { high: "#ef4444", med: "#f59e0b", low: "#64748b" };
  const prioLabel = { high: "🔥 Haute", med: "🟠 Moyenne", low: "⚪ Faible" };
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["all","high","med","low"].map(p => (
          <button key={p} onClick={() => setFilter(p)} style={{
            padding: "5px 11px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600,
            background: filter === p ? "#0ea5e9" : "rgba(255,255,255,0.06)",
            color: filter === p ? "#fff" : "#94a3b8",
          }}>
            {p === "all" ? "Tous" : prioLabel[p]} ({p === "all" ? items.length : items.filter(i => i.priority === p).length})
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {filtered.map((kw, i) => (
          <a key={i} href={kw.target} target="_blank" rel="noreferrer" style={{
            display: "grid", gridTemplateColumns: "1fr 80px 100px 140px", gap: 10, alignItems: "center",
            padding: "8px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 8, textDecoration: "none", color: "#e2e8f0",
          }}>
            <span style={{ fontSize: 12 }}>{kw.k}</span>
            <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "var(--font-mono)", textAlign: "right" }}>{kw.vol}/mois</span>
            <span style={{ fontSize: 10, color: prioColor[kw.priority], fontWeight: 600 }}>{prioLabel[kw.priority]}</span>
            <span style={{ fontSize: 10, color: "#64748b", fontFamily: "var(--font-mono)" }}>{kw.target}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function Checklist({ storageKey, items }) {
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); }
    catch { return {}; }
  });
  const toggle = (id) => {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map(item => {
        const isDone = !!done[item.id] || item.who?.startsWith("✓");
        return (
          <label key={item.id} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
            background: isDone ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${isDone ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
            borderRadius: 9, cursor: "pointer",
          }}>
            <input
              type="checkbox" checked={isDone} onChange={() => toggle(item.id)}
              style={{ accentColor: "#10b981", width: 16, height: 16, cursor: "pointer" }}
            />
            <span style={{ flex: 1, fontSize: 12, color: isDone ? "#475569" : "#e2e8f0", textDecoration: isDone ? "line-through" : "none" }}>
              {item.label}
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8", whiteSpace: "nowrap" }}>{item.impact}</span>
            <span style={{ fontSize: 10, color: "#64748b", whiteSpace: "nowrap", marginLeft: 4 }}>· {item.who}</span>
          </label>
        );
      })}
    </div>
  );
}
