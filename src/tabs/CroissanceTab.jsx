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
  // Social Growth Manager (brique 1 mesure + brique 2 dernier rapport de l'agent)
  const [sgm, setSgm]             = useState(null);   // /api/social-insights?dry=1
  const [sgmReport, setSgmReport] = useState(null);   // /api/social-growth-agent?latest=1
  const [sgmRun, setSgmRun]       = useState("idle"); // idle | run | err (rafraîchir l'analyse)

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

  // Social Growth Manager : mesure 4 plateformes (dry, aucune écriture) + dernier rapport de l'agent
  useEffect(() => {
    adminFetch("/api/social-insights?dry=1").then(r => r.json()).then(d => { if (d.ok) setSgm(d); }).catch(() => {});
    adminFetch("/api/social-growth-agent?latest=1").then(r => r.json()).then(d => { if (d.ok) setSgmReport(d); }).catch(() => {});
  }, []);

  // Rafraîchir l'analyse = relance l'agent (LLM, ~15-20s) et récupère le nouveau rapport
  const runGrowthAgent = async () => {
    setSgmRun("run");
    try {
      const r = await adminFetch("/api/social-growth-agent");
      const d = await r.json();
      if (!d.ok) throw new Error(d.error || "Analyse échouée");
      const l = await (await adminFetch("/api/social-growth-agent?latest=1")).json();
      if (l.ok) setSgmReport(l);
      setSgmRun("idle");
    } catch { setSgmRun("err"); }
  };

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

  const igReachTotal   = (insights?.instagram?.reach?.series || []).reduce((s, p) => s + p.value, 0);
  const igEngagedTotal = (insights?.instagram?.accounts_engaged?.series || []).reduce((s, p) => s + p.value, 0);
  const engagementRate = igReachTotal > 0 ? Math.round((igEngagedTotal / igReachTotal) * 1000) / 10 : null;

  return (
    <div>
      {/* ═════ Header ═════ */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
            📈 Croissance audience
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Objectif de croissance des abonnés (FB · Instagram · YouTube · GBP), recos de l'agent, concours et tactiques d'engagement.
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

      {/* ═════ Social Growth Manager — objectif de croissance (4 plateformes) ═════ */}
      {sgm && (
        <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.22)", borderRadius: 13, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>🎯 Objectif de croissance · +{sgm.target_pct}%/mois par plateforme</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                Agent responsable réseaux · advisory (recommande, ne publie/dépense rien) · snapshot quotidien
              </div>
            </div>
            <button
              onClick={runGrowthAgent}
              disabled={sgmRun === "run"}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(99,102,241,0.4)", background: sgmRun === "run" ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.18)", color: "#c7d2fe", fontSize: 11, fontWeight: 600, cursor: sgmRun === "run" ? "wait" : "pointer" }}
            >
              {sgmRun === "run" ? "Analyse en cours…" : sgmRun === "err" ? "⚠ Réessayer" : "🔄 Rafraîchir l'analyse"}
            </button>
          </div>

          {/* Tuiles par plateforme */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10 }}>
            {sgm.platforms.map(p => <GrowthTile key={p.platform} p={p} />)}
          </div>

          {/* Recos du dernier rapport de l'agent */}
          {sgmReport?.report && (
            <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 12 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
                🧠 Recos de l'agent {sgmReport.report.focus_platform ? <>· focus <b style={{ color: "#c7d2fe" }}>{sgmReport.report.focus_platform}</b></> : null}
                {sgmReport.created_at ? <span style={{ color: "#475569" }}> · {new Date(sgmReport.created_at * 1000).toLocaleDateString("fr-FR")}</span> : null}
              </div>
              {sgmReport.report.one_liner && <div style={{ fontSize: 12, color: "#cbd5e1", fontStyle: "italic", marginBottom: 10 }}>« {sgmReport.report.one_liner} »</div>}
              <div style={{ display: "grid", gap: 8 }}>
                {(sgmReport.report.recos || []).map((r, i) => <RecoCard key={i} r={r} />)}
              </div>
            </div>
          )}
          {sgmReport && !sgmReport.report && (
            <div style={{ marginTop: 12, fontSize: 11, color: "#64748b" }}>
              Aucune analyse encore générée — clique « Rafraîchir l'analyse » (ou attends le digest de lundi).
            </div>
          )}
        </div>
      )}

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

      {/* ═════ Funnel d'acquisition IG ═════ */}
      {insights?.instagram && (
        <Section title="🎯 Funnel d'acquisition Instagram" sub="Du visiteur de profil au clic vers villamaryllis.com.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            <MetricCard label="Vues de profil" data={insights.instagram.profile_views} color="#a78bfa" icon="👁" />
            <MetricCard label="Clics site web" data={insights.instagram.website_clicks} color="#34d399" icon="🔗" tooltip="Clics sur le lien bio → villamaryllis.com" />
            <MetricCard label="Comptes engagés" data={insights.instagram.accounts_engaged} color="#f59e0b" icon="💬" />
          </div>
        </Section>
      )}

      {/* ═════ Portée & impressions ═════ */}
      {insights && (
        <Section title="📡 Portée & impressions" sub={`Sur les ${days} derniers jours — reach = comptes uniques, impressions = affichages totaux.`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 12 }}>
            <MetricCard label="Reach IG" data={insights.instagram.reach} color="#e1306c" icon="📸" />
            <MetricCard label="Impressions IG" data={insights.instagram.impressions} color="#c084fc" icon="👀" />
            <MetricCard label="Reach FB" data={insights.facebook.reach} color="#1877f2" icon="📘" />
            <MetricCard label="Impressions FB" data={insights.facebook.impressions} color="#60a5fa" icon="👀" />
          </div>
          {/* Organique vs Payant FB */}
          {insights.facebook.impressions_organic && insights.facebook.impressions_paid && (
            <OrgVsPaid organic={insights.facebook.impressions_organic} paid={insights.facebook.impressions_paid} />
          )}
        </Section>
      )}

      {/* ═════ Engagement & intention ═════ */}
      {insights?.instagram && (
        <Section title="💾 Engagement & intention de réservation" sub="Les sauvegardes (saves) sont le signal d'intention le plus fort — quelqu'un bookmark pour revenir.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            <MetricCard label="Sauvegardes IG" data={insights.instagram.saves} color="#f97316" icon="🔖" tooltip="Posts sauvegardés = intention de revenir" highlight />
            <MetricCard label="Engagements FB" data={insights.facebook.post_engagements} color="#1877f2" icon="👍" />
          </div>
        </Section>
      )}

      {/* ═════ Audience géographique ═════ */}
      {insights?.audience?.countries && (
        <Section title="🌍 Audience géographique" sub="Top pays des followers Instagram (30 derniers jours). Source : Facebook Graph API.">
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {insights.audience.countries.map(c => (
              <CountryBar key={c.country} country={c.country} count={c.count} pct={c.pct} />
            ))}
          </div>
        </Section>
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

      {/* ═════ Objectifs en cours ═════ */}
      <Section title="🎯 Objectifs en cours" sub="Progression live vers les cibles fixées.">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Objectif label="Followers Instagram" current={igFollowers} target={1500} color="#e1306c" sub="Cible 6 mois · départ 1 031" />
          <Objectif label="Fans Facebook" current={fbFollowers} target={700} color="#1877f2" sub="x2 Villa Amaryllis · départ 337" />
          <Objectif label="Audience totale FB+IG" current={total} target={2200} color="#f59e0b" sub="1 500 IG + 700 FB" />
          {engagementRate !== null && (
            <Objectif label="Taux d'engagement IG" current={engagementRate} target={3} unit="%" decimals={1} color="#10b981" sub={`Engagés / reach sur ${days}j`} />
          )}
          {insights?.instagram?.website_clicks && (
            <Objectif label="Clics site web / mois" current={insights.instagram.website_clicks.series?.reduce((s,p) => s + p.value, 0) || 0} target={200} color="#a78bfa" sub="Clic bio → villamaryllis.com" />
          )}
          {insights?.instagram?.saves && (
            <Objectif label="Sauvegardes IG / mois" current={insights.instagram.saves.series?.reduce((s,p) => s + p.value, 0) || 0} target={150} color="#f97316" sub="Signal intention de réservation" />
          )}
        </div>
        <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            { label: "1 post/jour automatique", done: true },
            { label: "2 Reels/semaine", done: false },
            { label: "1 concours viral/mois", done: false },
          ].map(o => (
            <span key={o.label} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: o.done ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)", color: o.done ? "#10b981" : "#64748b", border: `1px solid ${o.done ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.07)"}` }}>
              {o.done ? "✓" : "○"} {o.label}
            </span>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── Composants internes ────────────────────────────────────────────────────

const COUNTRY_NAMES = { FR:"France", MQ:"Martinique", GP:"Guadeloupe", US:"États-Unis", BE:"Belgique", CH:"Suisse", CA:"Canada", RE:"La Réunion", GB:"Royaume-Uni", DE:"Allemagne", IT:"Italie", ES:"Espagne", BR:"Brésil", SN:"Sénégal", CM:"Cameroun" };
const fmt = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n);

function MetricCard({ label, data, color, icon, tooltip, highlight }) {
  if (!data) return null;
  const last = data.series?.[data.series.length - 1]?.value ?? null;
  return (
    <div style={{ background: highlight ? `rgba(${color === "#f97316" ? "249,115,22" : "255,255,255"},0.06)` : "rgba(255,255,255,0.03)", border: `1px solid ${highlight ? color + "40" : "rgba(255,255,255,0.07)"}`, borderRadius: 11, padding: "11px 13px" }} title={tooltip}>
      <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{icon} {label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: "-0.5px", marginBottom: 4 }}>
        {last !== null ? fmt(last) : "—"}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
        {data.delta_7j !== null && <Delta value={data.delta_7j}  label="7j" />}
        {data.delta_30j !== null && <Delta value={data.delta_30j} label="30j" />}
      </div>
      <Sparkline series={data.series} color={color} width={100} height={28} />
    </div>
  );
}

function OrgVsPaid({ organic, paid }) {
  const orgTotal  = (organic.series || []).reduce((s, p) => s + p.value, 0);
  const paidTotal = (paid.series   || []).reduce((s, p) => s + p.value, 0);
  const total     = orgTotal + paidTotal || 1;
  const orgPct    = Math.round((orgTotal / total) * 100);
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 9, padding: "10px 12px" }}>
      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 8 }}>📊 Répartition impressions FB — organique vs payant</div>
      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 10, marginBottom: 6 }}>
        <div style={{ width: `${orgPct}%`, background: "#1877f2", transition: "width .4s" }} />
        <div style={{ flex: 1, background: "#f59e0b" }} />
      </div>
      <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#94a3b8" }}>
        <span><span style={{ color: "#1877f2", fontWeight: 700 }}>{orgPct}%</span> organique ({fmt(orgTotal)})</span>
        <span><span style={{ color: "#f59e0b", fontWeight: 700 }}>{100 - orgPct}%</span> payant ({fmt(paidTotal)})</span>
      </div>
    </div>
  );
}

function CountryBar({ country, count, pct }) {
  const name = COUNTRY_NAMES[country] || country;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 110, fontSize: 11, color: "#e2e8f0", flexShrink: 0 }}>{name}</div>
      <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 7, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, background: "linear-gradient(90deg,#a78bfa,#e1306c)", height: "100%", borderRadius: 4, transition: "width .5s" }} />
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8", width: 55, textAlign: "right", flexShrink: 0 }}>{count.toLocaleString("fr-FR")} <span style={{ color: "#475569" }}>({pct}%)</span></div>
    </div>
  );
}

function Objectif({ label, current, target, unit = "", decimals = 0, color, sub }) {
  const val = current !== null && current !== undefined ? current : null;
  const pct = val !== null && target ? Math.min(100, Math.round((val / target) * 100)) : 0;
  const done = pct >= 100;
  const display = val !== null ? (decimals > 0 ? val.toFixed(decimals) : val.toLocaleString("fr-FR")) : "—";
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 11, padding: "12px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
        <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 11, color: done ? "#10b981" : "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
          {display}{unit} <span style={{ color: "#475569" }}>/ {target.toLocaleString("fr-FR")}{unit}</span>
        </span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 5, height: 8, overflow: "hidden", marginBottom: 7 }}>
        <div style={{ width: `${pct}%`, background: done ? "#10b981" : color, height: "100%", borderRadius: 5, transition: "width .5s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#475569" }}>{sub}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: done ? "#10b981" : color }}>{pct}%</span>
      </div>
    </div>
  );
}

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

// ── Social Growth Manager : tuile plateforme + carte reco ────────────────────
const PLATFORM_EMOJI = { facebook: "📘", instagram: "📸", youtube: "▶️", gbp: "🗺️" };
const VERDICT_META = {
  ahead:    { label: "au-dessus", color: "#10b981" },
  on_track: { label: "dans la marge", color: "#3b82f6" },
  behind:   { label: "sous l'objectif", color: "#ef4444" },
  no_data:  { label: "historique en cours", color: "#64748b" },
};
const HEALTH_META = {
  not_configured: { label: "à configurer", color: "#f59e0b" },
  pending_access: { label: "accès en attente", color: "#f59e0b" },
  error:          { label: "erreur API", color: "#ef4444" },
};

function GrowthTile({ p }) {
  const measurable = p.health === "measurable";
  const v = VERDICT_META[p.verdict] || VERDICT_META.no_data;
  const h = HEALTH_META[p.health];
  const pct = p.growth?.growth_30d_pct;
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 11, padding: "11px 13px" }}>
      <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
        {PLATFORM_EMOJI[p.platform] || "•"} {p.label}
      </div>
      {measurable ? (
        <>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.5px" }}>
            {p.current != null ? p.current.toLocaleString("fr-FR") : "—"}
          </div>
          <div style={{ fontSize: 10, color: "#475569", marginBottom: 8 }}>abonnés</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {pct != null && (
              <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 0 ? "#10b981" : "#ef4444" }}>
                {pct >= 0 ? "+" : ""}{pct}%<span style={{ fontWeight: 400, color: "#64748b" }}>/mois</span>
              </span>
            )}
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 5, background: v.color + "22", color: v.color }}>{v.label}</span>
          </div>
          {p.needed_monthly != null && p.verdict !== "ahead" && (
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 6 }}>cible : +{p.needed_monthly} ce mois</div>
          )}
        </>
      ) : (
        <>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#64748b", marginTop: 4 }}>—</div>
          <div style={{ display: "inline-block", fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, background: (h?.color || "#64748b") + "22", color: h?.color || "#64748b", marginTop: 8 }}>
            {h?.label || p.health}
          </div>
        </>
      )}
    </div>
  );
}

function RecoCard({ r }) {
  const pr = { high: { e: "🔴", c: "#ef4444" }, med: { e: "🟡", c: "#f59e0b" }, low: { e: "🟢", c: "#10b981" } }[r.priority] || { e: "•", c: "#64748b" };
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderLeft: `2px solid ${pr.c}`, borderRadius: 8, padding: "9px 11px" }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: "#e2e8f0", marginBottom: 5 }}>
        {pr.e} {PLATFORM_EMOJI[r.platform] || ""} {(r.platform || "").charAt(0).toUpperCase() + (r.platform || "").slice(1)} — <span style={{ fontWeight: 400, color: "#94a3b8" }}>{r.diagnosis}</span>
      </div>
      <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 3 }}>
        {(r.actions || []).map((a, i) => <li key={i} style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.4 }}>{a}</li>)}
      </ul>
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

