/**
 * MinNightsConfig — config nuits minimum par bien + périodes saisonnières.
 * Extrait de src/App.jsx (refactor 2026, batch B/4). Sync avec /api/site-config.
 */
import { useState, useEffect, useRef } from "react";
import { MIN_NIGHTS_DEFAULTS_ADMIN, BIEN_NAMES_ADMIN } from "../App.jsx";

export default function MinNightsConfig() {
  // ── Init depuis localStorage ──────────────────────────────────
  function buildFull(raw) {
    const full = {};
    for (const id of Object.keys(MIN_NIGHTS_DEFAULTS_ADMIN)) {
      full[id] = raw[id] ?? { default: MIN_NIGHTS_DEFAULTS_ADMIN[id], periods: [] };
      if (!Array.isArray(full[id].periods)) full[id].periods = [];
    }
    return full;
  }

  const [config, setConfig] = useState(() => {
    try { return buildFull(JSON.parse(localStorage.getItem("amaryllis_min_nights_v2") || "{}")); }
    catch { return buildFull({}); }
  });

  // "idle" | "local" | "syncing" | "synced" | "error"
  const [syncStatus, setSyncStatus] = useState("idle");
  const isFirstRender = useRef(true);
  const localTimer    = useRef(null);
  const serverTimer   = useRef(null);

  // Flag dédié pour ignorer les saves déclenchés par le chargement serveur
  // (distinct de isFirstRender pour éviter le conflit de flags)
  const skipNextSave = useRef(false);

  // ── Charger depuis le serveur au montage (useEffect, pas useState!) ──
  useEffect(() => {
    fetch("/api/site-config")
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.config && Object.keys(d.config).length) {
          const full = buildFull(d.config);
          skipNextSave.current = true;  // ce setConfig ne doit pas déclencher un re-save
          setConfig(full);
          localStorage.setItem("amaryllis_min_nights_v2", JSON.stringify(full));
          window.dispatchEvent(new Event("amaryllis_config_updated"));
          setSyncStatus("synced");
        }
      })
      .catch(() => {});
  }, []);

  // ── Auto-save : localStorage immédiat + serveur différé ────────
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (skipNextSave.current) { skipNextSave.current = false; return; }

    // 1. Enregistrement local immédiat (300 ms debounce anti-keystroke)
    clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => {
      localStorage.setItem("amaryllis_min_nights_v2", JSON.stringify(config));
      window.dispatchEvent(new Event("amaryllis_config_updated")); // même onglet
      setSyncStatus("local");

      // 2. Synchronisation serveur 2,5 s après le dernier changement
      clearTimeout(serverTimer.current);
      serverTimer.current = setTimeout(async () => {
        setSyncStatus("syncing");
        try {
          const r = await fetch("/api/site-config", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ action: "setConfig", config }),
          });
          const d = await r.json();
          setSyncStatus(d.ok ? "synced" : "error");
        } catch { setSyncStatus("error"); }
      }, 2500);
    }, 300);

    return () => { clearTimeout(localTimer.current); clearTimeout(serverTimer.current); };
  }, [config]);

  // ── Mutations ─────────────────────────────────────────────────
  function upDefault(id, v) {
    setConfig(p => ({ ...p, [id]: { ...p[id], default: parseInt(v) || 0 } }));
  }
  function addPeriod(id) {
    const y = new Date().getFullYear();
    setConfig(p => ({
      ...p,
      [id]: { ...p[id], periods: [...p[id].periods, { id: `${Date.now()}`, label: "Nouvelle période", from: `${y}-07-01`, to: `${y}-08-31`, min: 7 }] },
    }));
  }
  function upPeriod(bienId, pid, field, v) {
    setConfig(p => ({
      ...p,
      [bienId]: { ...p[bienId], periods: p[bienId].periods.map(pr => pr.id === pid ? { ...pr, [field]: field === "min" ? (parseInt(v) || 1) : v } : pr) },
    }));
  }
  function rmPeriod(bienId, pid) {
    setConfig(p => ({ ...p, [bienId]: { ...p[bienId], periods: p[bienId].periods.filter(pr => pr.id !== pid) } }));
  }

  // ── Recommandations saisonnières ─────────────────────────────
  // Martinique : haute saison = jul-août + déc 15-jan 5 → 7 nuits
  //              intermédiaire = fév-juin + sept-nov → 4 nuits
  //              Nogent : pas de saisonnalité forte → défaut 1 nuit
  const RECO_PERIODS = {
    amaryllis: [
      { label: "Été (jul–août)",    from: `${new Date().getFullYear()}-07-01`, to: `${new Date().getFullYear()}-08-31`,  min: 7 },
      { label: "Fêtes (déc–jan)",   from: `${new Date().getFullYear()}-12-15`, to: `${new Date().getFullYear() + 1}-01-05`, min: 7 },
      { label: "Saison interm.",    from: `${new Date().getFullYear()}-02-01`, to: `${new Date().getFullYear()}-06-30`,  min: 4 },
    ],
    geko:     [
      { label: "Été (jul–août)",    from: `${new Date().getFullYear()}-07-01`, to: `${new Date().getFullYear()}-08-31`,  min: 7 },
      { label: "Fêtes (déc–jan)",   from: `${new Date().getFullYear()}-12-15`, to: `${new Date().getFullYear() + 1}-01-05`, min: 7 },
      { label: "Saison interm.",    from: `${new Date().getFullYear()}-02-01`, to: `${new Date().getFullYear()}-06-30`,  min: 3 },
    ],
    zandoli:  [
      { label: "Été (jul–août)",    from: `${new Date().getFullYear()}-07-01`, to: `${new Date().getFullYear()}-08-31`,  min: 5 },
      { label: "Fêtes (déc–jan)",   from: `${new Date().getFullYear()}-12-15`, to: `${new Date().getFullYear() + 1}-01-05`, min: 5 },
    ],
    schoelcher: [
      { label: "Été (jul–août)",    from: `${new Date().getFullYear()}-07-01`, to: `${new Date().getFullYear()}-08-31`,  min: 5 },
      { label: "Fêtes (déc–jan)",   from: `${new Date().getFullYear()}-12-15`, to: `${new Date().getFullYear() + 1}-01-05`, min: 5 },
    ],
    mabouya: [
      { label: "Été (jul–août)",    from: `${new Date().getFullYear()}-07-01`, to: `${new Date().getFullYear()}-08-31`,  min: 4 },
      { label: "Fêtes (déc–jan)",   from: `${new Date().getFullYear()}-12-15`, to: `${new Date().getFullYear() + 1}-01-05`, min: 4 },
    ],
    nogent:   [], // Urbain : 1 nuit minimum uniforme, pas de saisonnalité
    iguana:   [],
  };

  const [showReco, setShowReco] = useState(false);

  function applyReco(bienId) {
    const recos = RECO_PERIODS[bienId] || [];
    if (!recos.length) return;
    const newPeriods = recos.map(r => ({ ...r, id: `reco-${Date.now()}-${Math.random().toString(36).slice(2)}` }));
    setConfig(p => ({
      ...p,
      [bienId]: { ...p[bienId], periods: newPeriods },
    }));
  }

  function applyAllReco() {
    setConfig(p => {
      const next = { ...p };
      for (const [bienId, recos] of Object.entries(RECO_PERIODS)) {
        if (!recos.length) continue;
        const newPeriods = recos.map(r => ({ ...r, id: `reco-${Date.now()}-${Math.random().toString(36).slice(2)}` }));
        next[bienId] = { ...next[bienId], periods: newPeriods };
      }
      return next;
    });
  }

  // ── Indicateur de synchronisation ───────────────────────────
  const statusBadge = {
    idle:    null,
    local:   <span style={{ fontSize: 11, color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>💾 Sauvegardé localement · sync serveur…</span>,
    syncing: <span style={{ fontSize: 11, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>⟳ Synchronisation…</span>,
    synced:  <span style={{ fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>✓ Synchronisé — visible sur tout le site</span>,
    error:   <span style={{ fontSize: 11, color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>⚠ Erreur serveur — actif localement seulement</span>,
  }[syncStatus];

  const inp = { padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.13)", background: "rgba(255,255,255,0.05)", color: "#e2e8f0", fontSize: 12 };

  return (
    <div>
      {/* Header + statut */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
          Les règles sont sauvegardées <strong style={{ color: "#94a3b8" }}>automatiquement</strong> à chaque modification
          et appliquées instantanément dans le widget de réservation.
        </div>
        {statusBadge && <div style={{ flexShrink: 0 }}>{statusBadge}</div>}
      </div>

      {/* ── Panneau recommandations saisonnières ── */}
      <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>💡 Recommandations saisonnières</div>
            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.55 }}>
              Haute saison <strong style={{ color: "#e2e8f0" }}>juil–août + déc 15–jan 5</strong> → 7 nuits min sur les grandes villas · saison intermédiaire → 4 nuits · basse saison → défaut.
              <br />Évite les "trous orphelins" non louables entre deux réservations. À appliquer également dans Beds24 pour la synchronisation.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
            <button
              onClick={() => setShowReco(r => !r)}
              style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.1)", color: "#fbbf24", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
            >{showReco ? "▲ Masquer" : "▼ Voir le détail"}</button>
            <button
              onClick={applyAllReco}
              style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.5)", background: "rgba(245,158,11,0.18)", color: "#f59e0b", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >⚡ Appliquer à tous</button>
          </div>
        </div>

        {showReco && (
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {Object.entries(RECO_PERIODS).map(([bienId, recos]) => (
              <div key={bienId} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>{BIEN_NAMES_ADMIN[bienId]}</span>
                  {recos.length > 0 && (
                    <button onClick={() => applyReco(bienId)}
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(245,158,11,0.4)", background: "none", color: "#fbbf24", cursor: "pointer", fontWeight: 600 }}>
                      Appliquer
                    </button>
                  )}
                </div>
                {recos.length === 0 ? (
                  <div style={{ fontSize: 10, color: "#475569", fontStyle: "italic" }}>Pas de saisonnalité — défaut 1 nuit</div>
                ) : (
                  recos.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", padding: "2px 0" }}>
                      <span>{r.label}</span>
                      <span style={{ fontWeight: 700, color: r.min >= 7 ? "#f59e0b" : r.min >= 4 ? "#38bdf8" : "#94a3b8" }}>{r.min} nuits</span>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {Object.keys(MIN_NIGHTS_DEFAULTS_ADMIN).map(bienId => {
        const cfg     = config[bienId] || { default: MIN_NIGHTS_DEFAULTS_ADMIN[bienId], periods: [] };
        const periods = cfg.periods || [];
        return (
          <div key={bienId} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
            {/* Header bien */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: periods.length ? 12 : 6, flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 13 }}>{BIEN_NAMES_ADMIN[bienId]}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>Défaut :</span>
                <input type="number" min="0" max="30" value={cfg.default} onChange={e => upDefault(bienId, e.target.value)}
                  style={{ ...inp, width: 52, textAlign: "center", fontWeight: 700, fontSize: 14 }} />
                <span style={{ fontSize: 11, color: "#64748b" }}>nuits min.</span>
              </div>
            </div>

            {/* En-têtes colonnes */}
            {periods.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 126px 126px 64px 30px", gap: 6, marginBottom: 5, paddingLeft: 2 }}>
                {["Libellé période", "Début", "Fin", "Min", ""].map(h => (
                  <div key={h} style={{ fontSize: 9, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</div>
                ))}
              </div>
            )}

            {/* Lignes périodes */}
            {periods.map(p => (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 126px 126px 64px 30px", gap: 6, marginBottom: 6, alignItems: "center" }}>
                <input value={p.label} onChange={e => upPeriod(bienId, p.id, "label", e.target.value)} style={inp} placeholder="ex : Été 2025" />
                <input type="date"    value={p.from}  onChange={e => upPeriod(bienId, p.id, "from",  e.target.value)} style={inp} />
                <input type="date"    value={p.to}    onChange={e => upPeriod(bienId, p.id, "to",    e.target.value)} style={inp} />
                <input type="number" min="1" max="30" value={p.min} onChange={e => upPeriod(bienId, p.id, "min", e.target.value)}
                  style={{ ...inp, textAlign: "center", fontWeight: 700 }} />
                <button onClick={() => rmPeriod(bienId, p.id)}
                  style={{ background: "rgba(239,68,68,0.13)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, color: "#ef4444", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "4px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ✕
                </button>
              </div>
            ))}

            <div style={{ display: "flex", gap: 6, marginTop: periods.length ? 4 : 0 }}>
              <button onClick={() => addPeriod(bienId)}
                style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.22)", borderRadius: 6, color: "#38bdf8", cursor: "pointer", fontSize: 11, padding: "5px 12px", fontWeight: 600 }}>
                + Ajouter une période
              </button>
              {(RECO_PERIODS[bienId]?.length > 0) && (
                <button onClick={() => applyReco(bienId)}
                  style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 6, color: "#f59e0b", cursor: "pointer", fontSize: 11, padding: "5px 12px", fontWeight: 600 }}>
                  ⚡ Reco. saison
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
