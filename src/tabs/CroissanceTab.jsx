/**
 * CroissanceTab — pilotage croissance audience (followers + UGC + concours).
 *
 * Centralise les leviers de croissance sociale identifiés au refactor 2026 :
 * - KPIs followers FB + IG temps réel via /api/social?action=status
 * - Évolution historique (sparklines + deltas J-7/J-30/J-90) via /api/meta-insights
 * - Bouton générateur de post-concours mensuel (via agents-run + draft IG/FB)
 * - Checklist tactiques (UGC, reels, hashtags géo, ambassadeurs)
 *
 * Aucune data via useAppData (autonome, fetch local).
 */
import { useState, useEffect } from "react";
import { adminFetch } from "../lib/apiFetch.js";

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ series, color, width = 120, height = 36 }) {
  const vals = (series || []).map(p => p.value).filter(v => typeof v === "number");
  if (vals.length < 2) return null;
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const range = mx - mn || 1;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width;
    const y = height - ((v - mn) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.9} />
    </svg>
  );
}

function Delta({ value, label }) {
  if (value === null || value === undefined) return null;
  const pos = value >= 0;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: pos ? "rgba(16,185,129,0.14)" : "rgba(239,68,68,0.14)", color: pos ? "#10b981" : "#ef4444" }}>
      {pos ? "+" : ""}{value} <span style={{ fontWeight: 400, opacity: 0.8 }}>{label}</span>
    </span>
  );
}

export default function CroissanceTab() {
  const [status, setStatus]       = useState(null);
  const [statusErr, setStatusErr] = useState(null);
  const [insights, setInsights]   = useState(null);
  const [insErr, setInsErr]       = useState(null);
  const [days, setDays]           = useState(30);
  const [genStatus, setGenStatus] = useState("idle"); // idle | gen | ok | err
  const [genMsg, setGenMsg]       = useState("");

  // Count temps réel
  useEffect(() => {
    fetch("/api/social?action=status")
      .then(r => r.json())
      .then(d => { if (d.error) setStatusErr(d.error); else setStatus(d); })
      .catch(e => setStatusErr(e.message));
  }, []);

  // Évolution historique
  useEffect(() => {
    adminFetch(`/api/meta-insights?days=${days}`)
      .then(r => r.json())
      .then(d => { if (!d.ok) setInsErr(d.error || "Erreur API"); else setInsights(d); })
      .catch(e => setInsErr(e.message));
  }, [days]);

  // Génère un draft "post-concours du mois" qui apparaîtra dans Approbations
  const generateConcours = async () => {
    setGenStatus("gen");
    setGenMsg("");
    try {
      const now = new Date();
      const moisLabels = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
      const moisCourant = moisLabels[now.getMonth()];

      // Génère un draft IG/FB via /api/agents-run avec un brief explicite
      const brief = `Concours mensuel ${moisCourant} ${now.getFullYear()} — bien tournant : zandoli
Format : post photo + caption viral.
Hook : "🎁 Concours ${moisCourant.toUpperCase()} — Gagnez 1 nuit à Villa Amaryllis"
Mécanique : Like + commenter "présent" + tagger 3 amis = participation. Tirage au sort au sort le dernier jour du mois.
Photo : la plus belle vue mer Villa Amaryllis (photos/amaryllis/01.webp ou 03.webp).
Hashtags obligatoires : #ConcoursMartinique #AmaryllisLocations #GagnerUnSéjour #MartiniqueGratuit + 5 autres pertinents.
CTA : "👉 Inscrivez-vous à notre newsletter pour les prochains concours : https://villamaryllis.com/links"
Ton : excité, festif, croissance virale.
Channels : ig + fb`;

      const r = await adminFetch("/api/agents-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: "community-manager", brief }),
      });
      const data = await r.json();
      if (data.ok || data.draftsCreated) {
        setGenStatus("ok");
        setGenMsg(`✓ Draft concours ${moisCourant} créé. Va dans l'onglet "📥 Approbations" pour le valider.`);
      } else {
        throw new Error(data.error || "Génération échouée");
      }
    } catch (e) {
      setGenStatus("err");
      setGenMsg(e.message);
    }
  };

  const fbFollowers = status?.page?.followers_count ?? null;
  const igFollowers = status?.ig?.followers_count ?? null;
  const igPosts     = status?.ig?.media_count ?? null;
  const total       = fbFollowers !== null && igFollowers !== null ? fbFollowers + igFollowers : null;

  return (
    <div>
      {/* ═════ Header ═════ */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
            📈 Croissance audience
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Pilotage followers Facebook + Instagram, génération automatique de concours, tactiques d'engagement.
          </div>
        </div>
        {/* Sélecteur période historique */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[30, 60, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: days === d ? "rgba(255,255,255,0.09)" : "transparent", color: days === d ? "#e2e8f0" : "#64748b", fontSize: 11, cursor: "pointer" }}>
              {d}j
            </button>
          ))}
        </div>
      </div>

      {/* ═════ KPIs + évolution ═════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>

        {/* Instagram */}
        <div style={{ background: "rgba(225,48,108,0.07)", border: "1px solid rgba(225,48,108,0.18)", borderRadius: 13, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>📸 Instagram</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.5px" }}>
            {igFollowers !== null ? igFollowers.toLocaleString("fr-FR") : "—"}
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10 }}>{igPosts !== null ? `${igPosts} posts publiés` : ""}</div>
          {insights?.instagram && (
            <>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                <Delta value={insights.instagram.delta_7j}  label="7j" />
                <Delta value={insights.instagram.delta_30j} label="30j" />
              </div>
              <Sparkline series={insights.instagram.series} color="#e1306c" width={130} />
            </>
          )}
          {insErr && <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 6 }}>{insErr}</div>}
        </div>

        {/* Facebook */}
        <div style={{ background: "rgba(24,119,242,0.07)", border: "1px solid rgba(24,119,242,0.18)", borderRadius: 13, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>📘 Facebook</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.5px" }}>
            {fbFollowers !== null ? fbFollowers.toLocaleString("fr-FR") : "—"}
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10 }}>{status?.page?.name || ""}</div>
          {insights?.facebook && (
            <>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                <Delta value={insights.facebook.delta_7j}  label="7j" />
                <Delta value={insights.facebook.delta_30j} label="30j" />
              </div>
              <Sparkline series={insights.facebook.series} color="#1877f2" width={130} />
            </>
          )}
          {insErr && <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 6 }}>{insErr}</div>}
        </div>
      </div>

      {/* KPIs secondaires */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
        <KPI label="Token Meta"      value={status?.token?.isValid ? "Valide" : statusErr ? "Erreur" : "—"} icon="🔐" color={status?.token?.isValid ? "#10b981" : "#ef4444"} sub={status?.token?.expiresIn !== null && status?.token?.expiresIn !== undefined ? `Expire dans ${status.token.expiresIn} j` : "N'expire pas"} />
        <KPI label="Audience totale" value={total} icon="🌟" color="#f59e0b" sub="FB + IG cumulés" />
        {insights && (
          <KPI label={`Gain ${days}j total`} value={(insights.facebook?.delta_30j || 0) + (insights.instagram?.delta_30j || 0)} icon="📊" color="#a855f7" sub="FB + IG combinés" />
        )}
      </div>

      {statusErr && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#fca5a5" }}>
          ⚠ Status Meta : {statusErr}
        </div>
      )}

      {/* ═════ Générateur de post-concours ═════ */}
      <Section title="🎁 Concours mensuel" sub="Génère un draft de post-concours viral via l'IA Community Manager. À approuver ensuite dans l'onglet Approbations.">
        <button
          onClick={generateConcours}
          disabled={genStatus === "gen"}
          style={{
            padding: "11px 22px", borderRadius: 10, border: "none",
            background: genStatus === "ok" ? "#10b981" : genStatus === "err" ? "#ef4444" : "#a855f7",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: genStatus === "gen" ? "wait" : "pointer",
            opacity: genStatus === "gen" ? 0.6 : 1,
          }}
        >
          {genStatus === "gen" ? "⟳ Génération…" : genStatus === "ok" ? "✓ Draft créé" : genStatus === "err" ? "❌ Réessayer" : "🎯 Générer le post-concours du mois"}
        </button>
        {genMsg && (
          <div style={{ marginTop: 10, fontSize: 12, color: genStatus === "ok" ? "#10b981" : "#fca5a5" }}>{genMsg}</div>
        )}
      </Section>

      {/* ═════ Tactiques de croissance ═════ */}
      <Section title="🎯 Tactiques organiques actives" sub="Checklist des leviers à exécuter chaque semaine pour gagner des followers.">
        <Checklist
          items={[
            { id: "reels",         label: "Reels cinématiques (5-15s) sur les 7 biens",                impact: "🔥🔥🔥", who: "Photographe + community-manager" },
            { id: "stories-repost",label: "Repartager les stories des voyageurs (avec accord)",       impact: "🔥🔥",   who: "Service client" },
            { id: "ugc-hashtag",   label: "Réutiliser le hashtag #AmaryllisLocations en CTA voyageur", impact: "🔥",     who: "Pré-arrivée email" },
            { id: "concours-mois", label: "Concours mensuel viral (tag 3 amis = participation)",       impact: "🔥🔥🔥", who: "Community-manager (auto)" },
            { id: "hashtags-geo",  label: "Mix hashtags géo (#SainteLuce #MartiniquePlages #Caraibes)", impact: "🔥",    who: "Community-manager (déjà actif)" },
            { id: "tiktok",        label: "Cross-post Reels → TikTok",                                   impact: "🔥🔥",   who: "Manuel pour l'instant" },
            { id: "behind-scenes", label: "Posts behind-the-scenes (ménage, sunset, vie locale)",       impact: "🔥",     who: "Photographe terrain" },
            { id: "ambassadeur",   label: "Programme ambassadeur : -10% contre mention + photo",       impact: "🔥🔥",   who: "CRM Manager" },
          ]}
        />
      </Section>

      {/* ═════ Diagnostic actuel ═════ */}
      <Section title="📊 Diagnostic" sub="Référence rapide pour évaluer où on en est.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, color: "#94a3b8" }}>
          <Fact label="Objectif court terme"     value="+50% IG d'ici 6 mois (1031 → 1500)" />
          <Fact label="Objectif court terme FB"  value="x2 Villa Amaryllis (337 → 700)" />
          <Fact label="Fréquence cible posts"    value="1 post/jour automatique" />
          <Fact label="Fréquence cible Reels"    value="2 Reels/semaine" />
          <Fact label="Concours par mois"        value="1 concours viral / mois" />
          <Fact label="Engagement rate cible"    value=">3% (likes + commentaires)" />
        </div>
      </Section>
    </div>
  );
}

// ── Composants internes ────────────────────────────────────────────────────

function KPI({ label, value, icon, color, sub }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}>
      <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>
        {value === null || value === undefined ? "—" : typeof value === "number" ? value.toLocaleString("fr-FR") : value}
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

function Checklist({ items }) {
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ldb_croissance_check") || "{}"); }
    catch { return {}; }
  });
  const toggle = (id) => {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    localStorage.setItem("ldb_croissance_check", JSON.stringify(next));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map(item => {
        const isDone = !!done[item.id];
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

function Fact({ label, value }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, padding: "8px 11px" }}>
      <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>{value}</div>
    </div>
  );
}
