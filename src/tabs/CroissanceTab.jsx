/**
 * CroissanceTab — pilotage croissance audience (followers + UGC + concours).
 *
 * Centralise les leviers de croissance sociale identifiés au refactor 2026 :
 * - KPIs followers FB + IG temps réel via /api/social?action=status
 * - Bouton générateur de post-concours mensuel (via agents-run + draft IG/FB)
 * - Checklist tactiques (UGC, reels, hashtags géo, ambassadeurs)
 *
 * Aucune data via useAppData (autonome, fetch local).
 */
import { useState, useEffect } from "react";
import { adminFetch } from "../lib/apiFetch.js";

export default function CroissanceTab() {
  const [status, setStatus] = useState(null);
  const [statusErr, setStatusErr] = useState(null);
  const [genStatus, setGenStatus] = useState("idle"); // idle | gen | ok | err
  const [genMsg, setGenMsg] = useState("");

  // Charge les KPIs followers via l'endpoint social
  useEffect(() => {
    fetch("/api/social?action=status")
      .then(r => r.json())
      .then(d => { if (d.error) setStatusErr(d.error); else setStatus(d); })
      .catch(e => setStatusErr(e.message));
  }, []);

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

  return (
    <div>
      {/* ═════ Header ═════ */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
          📈 Croissance audience
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          Pilotage followers Facebook + Instagram, génération automatique de concours, tactiques d'engagement.
        </div>
      </div>

      {/* ═════ KPIs followers ═════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 20 }}>
        <KPI label="Instagram followers" value={igFollowers} icon="📸" color="#e91e63" sub={igPosts !== null ? `${igPosts} posts publiés` : ""} />
        <KPI label="Facebook fans"       value={fbFollowers} icon="📘" color="#1877f2" sub={status?.page?.name || ""} />
        <KPI label="Token Meta"          value={status?.token?.isValid ? "Valide" : statusErr ? "Erreur" : "—"} icon="🔐" color={status?.token?.isValid ? "#10b981" : "#ef4444"} sub={status?.token?.expiresIn !== null && status?.token?.expiresIn !== undefined ? `Expire dans ${status.token.expiresIn} j` : "N'expire pas"} />
        <KPI label="Audience totale"     value={fbFollowers !== null && igFollowers !== null ? fbFollowers + igFollowers : null} icon="🌟" color="#f59e0b" sub="FB + IG cumulés" />
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
