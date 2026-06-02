/**
 * CalendrierTarifs — calendrier interactif tarifs jour-par-jour + saisons.
 * Inclut DEFAULT_SAISONS + loadSaisons/saveSaisons + loadSaisonPrix/saveSaisonPrix
 * (utilisés uniquement ici).
 * Extrait de src/App.jsx (refactor 2026, batch B/4).
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { DEFAULT_PRIX, BIEN_LABELS, BIEN_IDS, PRIX_LIMITS, MOIS_CAL, CAL_BIEN_IDS, N } from "../App.jsx";
import { loadDailyPrices, saveDailyPrices, applyServerPriceOverrides, loadPriceOverrides, SEED_DAILY_PRICES } from "../seedPrices.js";

// ── Helpers locaux saisons ──────────────────────────────────────────────────
const DEFAULT_SAISONS = [
  { id: "pic",    label: "Pic",          color: "#ef4444", months: [12, 1]  }, // Déc–Jan
  { id: "haute",  label: "Haute saison", color: "#f59e0b", months: [2, 4]   }, // Fév–Avr
  { id: "mi",     label: "Mi-saison",    color: "#0ea5e9", months: [5, 6]   }, // Mai–Jun
  { id: "basse",  label: "Basse saison", color: "#10b981", months: [7, 11]  }, // Jul–Nov
];

function loadSaisons() {
  try { return JSON.parse(localStorage.getItem("saisons_config") || "null") || DEFAULT_SAISONS; } catch { return DEFAULT_SAISONS; }
}
function saveSaisons(s) { try { localStorage.setItem("saisons_config", JSON.stringify(s)); } catch {} }

function loadSaisonPrix() {
  try { return JSON.parse(localStorage.getItem("saison_prix") || "null") || {}; } catch { return {}; }
}
function saveSaisonPrix(p) { try { localStorage.setItem("saison_prix", JSON.stringify(p)); } catch {} }

// ── CalendrierTarifs ──
export default function CalendrierTarifs({ reservations = [] }) {
  const [bienId, setBienId] = useState("amaryllis");
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [daily, setDaily] = useState(loadDailyPrices);
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [bulkPrice, setBulkPrice] = useState("");
  const [syncStatus, setSyncStatus] = useState("idle"); // idle|local|syncing|synced|error
  const [syncDetail, setSyncDetail] = useState(""); // message d'erreur serveur détaillé
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState("add"); // "add" | "remove"
  const [tooltip, setTooltip] = useState(null); // { x, y, text }
  const [showSaisons, setShowSaisons] = useState(false);
  const [showCopie, setShowCopie] = useState(false);
  const [copieSource, setCopieSource] = useState("");
  const [copieFactor, setCopieFactor] = useState("100");
  const [saisons, setSaisons] = useState(loadSaisons);
  const [saisonPrix, setSaisonPrix] = useState(() => {
    const stored = loadSaisonPrix();
    // init prix par défaut basés sur DEFAULT_PRIX si pas encore défini
    const result = {};
    DEFAULT_SAISONS.forEach(s => {
      result[s.id] = stored[s.id] || {};
    });
    return result;
  });
  const [history, setHistory] = useState([]); // stack of previous daily states (max 10)
  const serverTimer = useRef(null);
  const pendingSync = useRef(false); // y a-t-il une synchro non encore poussée ?

  // Au démontage : FLUSH la synchro en attente (sinon les dernières modifs sont
  // perdues si on quitte l'onglet avant la fin du debounce → invisibles sur les
  // autres appareils). keepalive = la requête survit au changement d'onglet/page.
  useEffect(() => {
    return () => {
      clearTimeout(serverTimer.current);
      if (!pendingSync.current) return;
      try {
        const overrides = JSON.parse(localStorage.getItem("amaryllis_daily_prices_v2") || "{}");
        fetch("/api/site-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "prices", config: overrides }),
          keepalive: true,
        });
      } catch {}
    };
  }, []);

  useEffect(() => {
    const stop = () => setIsDragging(false);
    window.addEventListener("mouseup", stop);
    return () => window.removeEventListener("mouseup", stop);
  }, []);

  // Undo : pousse l'état actuel dans l'historique, applique le nouvel état
  function commitChange(next) {
    setHistory(h => [...h.slice(-9), daily]);
    setDaily(next); saveDailyPrices(next); scheduleServerSync();
  }

  // Ctrl+Z + Échap
  useEffect(() => {
    const onKey = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && history.length > 0) {
        e.preventDefault();
        const prev = history[history.length - 1];
        setHistory(h => h.slice(0, -1));
        setDaily(prev); saveDailyPrices(prev); scheduleServerSync();
      }
      if (e.key === "Escape") {
        setSelectedDates(new Set());
        setBulkPrice("");
        setIsDragging(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history]);

  // Charger les overrides depuis le serveur au montage
  useEffect(() => {
    fetch("/api/site-config?type=prices")
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.config && Object.keys(d.config).length) {
          applyServerPriceOverrides(d.config);
          setDaily(loadDailyPrices());
          setSyncStatus("synced");
        }
      }).catch(() => {});
  }, []);

  // Rafraîchir si un autre onglet admin modifie les prix
  useEffect(() => {
    const refresh = () => setDaily(loadDailyPrices());
    window.addEventListener("storage", refresh);
    window.addEventListener("amaryllis_prices_updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("amaryllis_prices_updated", refresh);
    };
  }, []);
  const getPrice = (date) => daily[bienId]?.[date] ?? null;
  const basePrice = DEFAULT_PRIX[bienId];

  // Prix N-1 : même jour de l'année précédente
  const getPriceN1 = (date) => {
    const prevDate = date.replace(/^\d{4}/, String(calYear - 1));
    return daily[bienId]?.[prevDate] ?? null;
  };

  const bookedDates = useMemo(() => {
    const set = new Set();
    reservations.filter(r => r.bienId === bienId).forEach(r => {
      if (!r.checkin || !r.checkout) return;
      const cur = new Date(r.checkin + "T12:00:00Z");
      const end = new Date(r.checkout + "T12:00:00Z");
      while (cur < end) {
        set.add(cur.toISOString().slice(0, 10));
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    });
    return set;
  }, [reservations, bienId]);

  // POST immédiat des prix journaliers au serveur (source partagée multi-appareils).
  async function doServerSync() {
    setSyncStatus("syncing");
    try {
      const overrides = loadPriceOverrides();
      // ⚠️ PAS de keepalive ici : keepalive plafonne le corps à 64 Ko et
      //    rejette les gros catalogues de prix (beaucoup de dates éditées).
      //    keepalive reste uniquement pour le flush au démontage (best-effort).
      const r = await fetch("/api/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "prices", config: overrides }),
      });
      const d = await r.json().catch(() => ({ ok: false, error: "réponse non-JSON" }));
      pendingSync.current = false;
      if (!d.ok) { setSyncStatus("error"); setSyncDetail(d.error || `HTTP ${r.status}`); return false; }
      setSyncStatus("synced"); setSyncDetail("");
      return true;
    } catch (e) { setSyncStatus("error"); setSyncDetail(String(e && e.message || e)); return false; }
  }

  // Sync serveur déboncée 2.5s après chaque modif locale.
  function scheduleServerSync() {
    setSyncStatus("local");
    pendingSync.current = true;
    clearTimeout(serverTimer.current);
    serverTimer.current = setTimeout(doServerSync, 2500);
  }

  // Force la synchro MAINTENANT (bouton « Forcer la synchro »).
  function flushServerSync() {
    clearTimeout(serverTimer.current);
    pendingSync.current = true;
    return doServerSync();
  }

  function setDayPrice(date, price) {
    const next = { ...daily, [bienId]: { ...(daily[bienId] || {}), [date]: price } };
    setDaily(next); saveDailyPrices(next); scheduleServerSync();
  }
  function clearDayPrice(date) {
    const bienPrices = { ...(daily[bienId] || {}) };
    delete bienPrices[date];
    const next = { ...daily, [bienId]: bienPrices };
    setDaily(next); saveDailyPrices(next); scheduleServerSync();
  }

  // Applique toutes les règles saisonnières sur l'année courante pour le bien actif
  function applySaisons() {
    const bienPrices = { ...(daily[bienId] || {}) };
    const [pMin, pMax] = PRIX_LIMITS[bienId] || [25, 900];
    for (let m = 1; m <= 12; m++) {
      // Trouver la saison applicable
      const saison = saisons.find(s => {
        const [a, b] = s.months;
        return a <= b ? m >= a && m <= b : m >= a || m <= b; // gère Déc–Jan (wrap)
      });
      if (!saison) continue;
      const prix = saisonPrix[saison.id]?.[bienId];
      if (!prix || prix < pMin || prix > pMax) continue;
      const daysInM = new Date(calYear, m, 0).getDate();
      for (let d = 1; d <= daysInM; d++) {
        const date = `${calYear}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        bienPrices[date] = prix;
      }
    }
    commitChange({ ...daily, [bienId]: bienPrices });
  }
  function applyCopie() {
    if (!copieSource || copieSource === bienId) return;
    const factor = parseFloat(copieFactor) / 100;
    if (!factor || factor <= 0) return;
    const sourcePrices = daily[copieSource] || {};
    const lim = PRIX_LIMITS[bienId] || [25, 900];
    const bienPrices = { ...(daily[bienId] || {}) };
    Object.entries(sourcePrices).forEach(([date, price]) => {
      // Ne copier que les dates de l'année affichée
      if (!date.startsWith(String(calYear))) return;
      const adjusted = Math.round(price * factor);
      const clamped = Math.min(Math.max(adjusted, lim[0]), lim[1]);
      bienPrices[date] = clamped;
    });
    commitChange({ ...daily, [bienId]: bienPrices });
    setShowCopie(false);
  }

  function applyBulk() {
    const price = parseInt(bulkPrice);
    const [pMin, pMax] = PRIX_LIMITS[bienId] || [25, 900];
    if (!price || price < pMin || price > pMax || selectedDates.size === 0) return;
    const bienPrices = { ...(daily[bienId] || {}) };
    for (const d of selectedDates) bienPrices[d] = price;
    commitChange({ ...daily, [bienId]: bienPrices });
    setSelectedDates(new Set()); setBulkPrice("");
  }
  function clearBulk() {
    if (selectedDates.size === 0) return;
    const bienPrices = { ...(daily[bienId] || {}) };
    for (const d of selectedDates) delete bienPrices[d];
    commitChange({ ...daily, [bienId]: bienPrices });
    setSelectedDates(new Set()); setBulkPrice("");
  }
  function toggleDate(date) {
    setSelectedDates(prev => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  }
  function handleDateMouseDown(e, date) {
    e.preventDefault();
    const adding = !selectedDates.has(date);
    setDragMode(adding ? "add" : "remove");
    setIsDragging(true);
    setSelectedDates(prev => {
      const next = new Set(prev);
      adding ? next.add(date) : next.delete(date);
      return next;
    });
  }
  function handleDateMouseEnter(date) {
    if (!isDragging) return;
    setSelectedDates(prev => {
      const next = new Set(prev);
      dragMode === "add" ? next.add(date) : next.delete(date);
      return next;
    });
  }

  function priceColor(price) {
    if (price === null) return "rgba(255,255,255,0.04)";
    const ratio = price / basePrice;
    if (ratio < 0.85) return "rgba(16,185,129,0.25)";
    if (ratio > 1.25) return "rgba(239,68,68,0.25)";
    if (ratio > 1.05) return "rgba(245,158,11,0.2)";
    return "rgba(14,165,233,0.15)";
  }
  function priceTextColor(price) {
    if (price === null) return "#334155";
    const ratio = price / basePrice;
    if (ratio < 0.85) return "#10b981";
    if (ratio > 1.25) return "#ef4444";
    if (ratio > 1.05) return "#f59e0b";
    return "#0ea5e9";
  }

  const syncBadge = { idle: null, local: "💾 local", syncing: "⟳ sync...", synced: "✓ serveur", error: "⚠ erreur serveur" }[syncStatus];
  const syncColor = { idle: null, local: "#94a3b8", syncing: "#f59e0b", synced: "#10b981", error: "#ef4444" }[syncStatus];

  // ── Alertes prix sous seuil ───────────────────────────────────────────────
  const belowMinDates = useMemo(() => {
    const [pMin] = PRIX_LIMITS[bienId] || [25, 900];
    const prices = daily[bienId] || {};
    return Object.entries(prices)
      .filter(([date, p]) => date.startsWith(String(calYear)) && typeof p === "number" && p < pMin)
      .map(([date, p]) => ({ date, price: p }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [daily, bienId, calYear]);

  const ntfyAlertSentRef = useRef(false);
  useEffect(() => {
    ntfyAlertSentRef.current = false; // reset quand le bien ou l'année change
  }, [bienId, calYear]);

  useEffect(() => {
    if (ntfyAlertSentRef.current || belowMinDates.length === 0) return;
    ntfyAlertSentRef.current = true;
    const [pMin] = PRIX_LIMITS[bienId] || [25, 900];
    // Appel serveur : email Resend + push ntfy (via NTFY_TOPIC secret)
    fetch("/api/send-prix-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bienId, dates: belowMinDates, minPrice: pMin, year: calYear }),
    }).catch(() => {});
    // Push direct depuis le navigateur si topic configuré localement
    const topic = localStorage.getItem("ntfy_topic");
    if (topic) {
      const sample = belowMinDates.slice(0, 5)
        .map(({ date, price }) => { const [, m, d] = date.split("-"); return `${d}/${m}(${price}€)`; })
        .join(", ");
      const body = `${belowMinDates.length} date${belowMinDates.length > 1 ? "s" : ""} sous ${pMin}€ · ${sample}${belowMinDates.length > 5 ? " …" : ""}`;
      fetch(`https://ntfy.sh/${topic}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Title": `⚠️ Prix sous seuil — ${BIEN_LABELS[bienId]}`,
          "Priority": "high",
          "Tags": "warning,moneybag",
        },
        body,
      }).catch(() => {});
    }
  }, [belowMinDates, bienId, calYear]);

  return (
    <div>
      {/* Tooltip custom */}
      {tooltip && (
        <div style={{
          position: "fixed", left: tooltip.x + 12, top: tooltip.y - 32,
          background: "#1e293b", border: "1px solid rgba(255,255,255,0.12)",
          color: "#e2e8f0", fontSize: 11, padding: "4px 8px", borderRadius: 6,
          pointerEvents: "none", zIndex: 9999, whiteSpace: "nowrap",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
        }}>
          {tooltip.text}
        </div>
      )}
      {/* Bien tabs + navigation année */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CAL_BIEN_IDS.map(id => (
            <button key={id} onClick={() => { setBienId(id); setSelectedDates(new Set()); setBulkPrice(""); }} style={{
              padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: bienId === id ? 700 : 400,
              background: bienId === id ? "#0ea5e9" : "rgba(255,255,255,0.06)",
              color: bienId === id ? "#fff" : "#64748b",
            }}>{BIEN_LABELS[id]}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {syncBadge && <span style={{ fontSize: 11, color: syncColor, fontWeight: 600 }}>{syncBadge}</span>}
          <button
            onClick={flushServerSync}
            disabled={syncStatus === "syncing"}
            title="Pousser immédiatement les prix du calendrier sur le serveur (visibles partout : site public + autres appareils)"
            style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", cursor: syncStatus === "syncing" ? "default" : "pointer", opacity: syncStatus === "syncing" ? 0.6 : 1 }}>
            🌐 Forcer la synchro
          </button>
          {syncStatus === "error" && syncDetail && (
            <span style={{ fontSize: 10, color: "#dc2626" }} title={syncDetail}>⚠ {syncDetail.slice(0, 60)}</span>
          )}
          {history.length > 0 && (
            <button
              onClick={() => {
                const prev = history[history.length - 1];
                setHistory(h => h.slice(0, -1));
                setDaily(prev); saveDailyPrices(prev); scheduleServerSync();
              }}
              title="Annuler la dernière modification (Ctrl+Z)"
              style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#94a3b8", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              ↩ Annuler{history.length > 1 ? ` (${history.length})` : ""}
            </button>
          )}
          {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
            <button key={y} onClick={() => { setCalYear(y); setSelectedDates(new Set()); setBulkPrice(""); }} style={{
              padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: calYear === y ? 700 : 400,
              background: calYear === y ? "#6366f1" : "rgba(255,255,255,0.06)",
              color: calYear === y ? "#fff" : "#64748b",
            }}>{y}</button>
          ))}
        </div>
      </div>

      {/* ── Bannière alerte prix sous seuil ── */}
      {belowMinDates.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <span style={{ fontSize: 15 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f87171", marginBottom: 4 }}>
              {belowMinDates.length} date{belowMinDates.length > 1 ? "s" : ""} en dessous du minimum ({(PRIX_LIMITS[bienId] || [25])[0]}€) — {BIEN_LABELS[bienId]}
            </div>
            <div style={{ fontSize: 11, color: "#fca5a5", lineHeight: 1.8, display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
              {belowMinDates.slice(0, 14).map(({ date, price }) => {
                const [, m, d] = date.split("-");
                return <span key={date} style={{ whiteSpace: "nowrap" }}>{d}/{m} <strong>{price}€</strong></span>;
              })}
              {belowMinDates.length > 14 && <span style={{ color: "#f87171" }}>+{belowMinDates.length - 14} autres</span>}
            </div>
          </div>
        </div>
      )}

      {/* Multi-select panel */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px", flexWrap: "wrap", minHeight: 44 }}>
        {selectedDates.size === 0 ? (
          <span style={{ fontSize: 11, color: "#64748b" }}>Cliquez sur des dates pour les sélectionner — modifiez-les toutes en même temps</span>
        ) : (
          <>
            <span style={{ fontSize: 11, color: "#0ea5e9", fontWeight: 600 }}>{selectedDates.size} date{selectedDates.size > 1 ? "s" : ""} sélectionnée{selectedDates.size > 1 ? "s" : ""}</span>
            {(() => {
              const [pMin, pMax] = PRIX_LIMITS[bienId] || [25, 900];
              const pv = parseInt(bulkPrice);
              const outOfRange = bulkPrice !== "" && (!pv || pv < pMin || pv > pMax);
              const valid = bulkPrice !== "" && pv >= pMin && pv <= pMax;
              return (<>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <input
                    autoFocus type="number" placeholder={`Prix € (${pMin}–${pMax})`} value={bulkPrice}
                    onChange={e => setBulkPrice(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && applyBulk()}
                    style={{ width: 110, padding: "5px 8px", borderRadius: 7, border: `1px solid ${outOfRange ? "#ef4444" : valid ? "#0ea5e9" : "#334155"}`, background: outOfRange ? "rgba(239,68,68,0.08)" : "#0f172a", color: outOfRange ? "#ef4444" : "#e2e8f0", fontSize: 12, outline: "none" }}
                  />
                  {outOfRange && (
                    <span style={{ fontSize: 9, color: "#ef4444", paddingLeft: 2 }}>
                      {pv < pMin ? `Min ${pMin}€` : `Max ${pMax}€`} pour {BIEN_LABELS[bienId]}
                    </span>
                  )}
                </div>
                <button onClick={applyBulk} disabled={!valid}
                  style={{ padding: "5px 14px", borderRadius: 7, border: "none", background: valid ? "#0ea5e9" : "#334155", color: "#fff", fontSize: 11, fontWeight: 600, cursor: valid ? "pointer" : "not-allowed", alignSelf: "flex-start" }}>
                  Appliquer
                </button>
              </>);
            })()}
            <button onClick={clearBulk}
              style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>
              Effacer prix
            </button>
            <button onClick={() => { setSelectedDates(new Set()); setBulkPrice(""); }}
              style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#64748b", fontSize: 11, cursor: "pointer" }}>
              Désélectionner
            </button>
          </>
        )}
      </div>

      {/* ── Règles saisonnières ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: showSaisons ? 12 : 0 }}>
          <button onClick={() => setShowSaisons(s => !s)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: showSaisons ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)", color: showSaisons ? "#a5b4fc" : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            🗓 Règles saisonnières {showSaisons ? "▲" : "▼"}
          </button>
          {!showSaisons && saisons.some(s => saisonPrix[s.id]?.[bienId]) && (
            <button onClick={applySaisons} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              ⚡ Appliquer les saisons
            </button>
          )}
        </div>
        {showSaisons && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>
              Définissez un prix par saison pour <strong style={{ color: "#94a3b8" }}>{BIEN_LABELS[bienId]}</strong>, puis cliquez "Appliquer" pour remplir tout le calendrier.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 14 }}>
              {saisons.map(s => {
                const [pMin, pMax] = PRIX_LIMITS[bienId] || [25, 900];
                const val = saisonPrix[s.id]?.[bienId] || "";
                const pv = parseInt(val);
                const outOfRange = val !== "" && (!pv || pv < pMin || pv > pMax);
                const [ma, mb] = s.months;
                const mLabel = ma <= mb
                  ? `${MOIS_CAL[ma-1]}–${MOIS_CAL[mb-1]}`
                  : `${MOIS_CAL[ma-1]}–Déc / Jan–${MOIS_CAL[mb-1]}`;
                return (
                  <div key={s.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px", border: `1px solid ${s.color}22` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, display: "inline-block", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{s.label}</span>
                      <span style={{ fontSize: 10, color: "#475569", marginLeft: "auto" }}>{mLabel}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <input
                        type="number"
                        placeholder={`${pMin}–${pMax} €`}
                        value={val}
                        onChange={e => {
                          const next = { ...saisonPrix, [s.id]: { ...(saisonPrix[s.id] || {}), [bienId]: e.target.value } };
                          setSaisonPrix(next); saveSaisonPrix(next);
                        }}
                        style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: `1px solid ${outOfRange ? "#ef4444" : "rgba(255,255,255,0.1)"}`, background: outOfRange ? "rgba(239,68,68,0.08)" : "#0f172a", color: outOfRange ? "#ef4444" : "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box" }}
                      />
                      {outOfRange && <span style={{ fontSize: 9, color: "#ef4444" }}>{pv < pMin ? `Min ${pMin}€` : `Max ${pMax}€`}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={applySaisons}
              disabled={!saisons.some(s => { const v = parseInt(saisonPrix[s.id]?.[bienId]); const lim = PRIX_LIMITS[bienId]||[25,900]; return v >= lim[0] && v <= lim[1]; })}
              style={{ padding: "7px 20px", borderRadius: 8, border: "none", background: "#6366f1", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              ⚡ Appliquer sur {calYear}
            </button>
            <span style={{ fontSize: 10, color: "#475569", marginLeft: 10 }}>Les jours déjà personnalisés seront écrasés</span>
          </div>
        )}
      </div>

      {/* ── Copie entre biens ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShowCopie(s => !s)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: showCopie ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.03)", color: showCopie ? "#67e8f9" : "#64748b", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
            📋 Copier depuis un autre bien {showCopie ? "▲" : "▼"}
          </button>
        </div>
        {showCopie && (
          <div style={{ marginTop: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 5 }}>Source</div>
              <select
                value={copieSource}
                onChange={e => setCopieSource(e.target.value)}
                style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none", cursor: "pointer" }}
              >
                <option value="">— Choisir —</option>
                {CAL_BIEN_IDS.filter(id => id !== bienId).map(id => (
                  <option key={id} value={id}>{BIEN_LABELS[id]}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 5 }}>Ajustement %</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number" value={copieFactor} min="1" max="300"
                  onChange={e => setCopieFactor(e.target.value)}
                  style={{ width: 70, padding: "6px 8px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "#e2e8f0", fontSize: 12, outline: "none" }}
                />
                <span style={{ fontSize: 11, color: "#64748b" }}>%</span>
                {parseFloat(copieFactor) !== 100 && (
                  <span style={{ fontSize: 10, color: parseFloat(copieFactor) > 100 ? "#f59e0b" : "#10b981" }}>
                    {parseFloat(copieFactor) > 100 ? `+${Math.round(parseFloat(copieFactor)-100)}%` : `−${Math.round(100-parseFloat(copieFactor))}%`}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {copieSource && (
                <div style={{ fontSize: 10, color: "#475569" }}>
                  Copie les prix {calYear} de <strong style={{ color: "#94a3b8" }}>{BIEN_LABELS[copieSource]}</strong> → <strong style={{ color: "#94a3b8" }}>{BIEN_LABELS[bienId]}</strong>
                  {parseFloat(copieFactor) !== 100 ? ` × ${parseFloat(copieFactor)/100}` : ""}
                  , clampé sur [{(PRIX_LIMITS[bienId]||[25,900])[0]}€–{(PRIX_LIMITS[bienId]||[25,900])[1]}€]
                </div>
              )}
              <button
                onClick={applyCopie}
                disabled={!copieSource || copieSource === bienId}
                style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: copieSource ? "#06b6d4" : "#334155", color: "#fff", fontSize: 12, fontWeight: 700, cursor: copieSource ? "pointer" : "not-allowed", alignSelf: "flex-start" }}>
                📋 Copier
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grille des mois */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {Array.from({ length: 12 }, (_, m) => {
          const daysInM = new Date(calYear, m + 1, 0).getDate();
          const firstDow = (new Date(calYear, m, 1).getDay() + 6) % 7; // Mon=0
          const cells = [];
          for (let i = 0; i < firstDow; i++) cells.push(null);
          for (let d = 1; d <= daysInM; d++) cells.push(d);
          const monthDates = Array.from({ length: daysInM }, (_, i) =>
            `${calYear}-${String(m + 1).padStart(2,"0")}-${String(i + 1).padStart(2,"0")}`
          );
          const allSelected = monthDates.every(d => selectedDates.has(d));
          function toggleMonth() {
            setSelectedDates(prev => {
              const next = new Set(prev);
              if (allSelected) monthDates.forEach(d => next.delete(d));
              else monthDates.forEach(d => next.add(d));
              return next;
            });
          }
          return (
            <div key={m} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 10px" }}>
              <div
                onClick={toggleMonth}
                title={allSelected ? "Désélectionner tout le mois" : "Sélectionner tout le mois"}
                style={{ fontSize: 12, fontWeight: 600, color: allSelected ? "#0ea5e9" : "#94a3b8", marginBottom: 8, textAlign: "center", cursor: "pointer", userSelect: "none",
                  borderRadius: 5, padding: "2px 4px", background: allSelected ? "rgba(14,165,233,0.1)" : "transparent",
                  transition: "background 0.15s" }}
              >{MOIS_CAL[m]} {calYear}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, userSelect: "none" }}>
                {["L","M","M","J","V","S","D"].map((d, i) => (
                  <div key={i} style={{ fontSize: 8, color: "#334155", textAlign: "center", paddingBottom: 3 }}>{d}</div>
                ))}
                {cells.map((d, i) => {
                  if (!d) return <div key={i} />;
                  const date = `${calYear}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                  const price = getPrice(date);
                  const priceN1 = getPriceN1(date);
                  const isSelected = selectedDates.has(date);
                  const isBooked = bookedDates.has(date);
                  const effectivePrice = price ?? basePrice;
                  const effectiveN1 = priceN1 ?? basePrice;
                  const n1Diff = priceN1 !== null ? Math.round((effectivePrice - effectiveN1) / effectiveN1 * 100) : null;
                  const n1Arrow = n1Diff === null ? "" : n1Diff > 0 ? "↑" : n1Diff < 0 ? "↓" : "";
                  const n1Color = n1Diff > 0 ? "#10b981" : "#ef4444";
                  const n1Label = n1Diff !== null ? ` · ${calYear - 1}: ${effectiveN1}€ ${n1Arrow}${Math.abs(n1Diff)}%` : "";
                  const tooltipText = `${isBooked ? "🟣 Réservé · " : ""}${price !== null ? `${price}€` : `${basePrice}€ (défaut)`}${n1Label}`;
                  return (
                    <div
                      key={i}
                      onMouseDown={e => handleDateMouseDown(e, date)}
                      onMouseEnter={e => { handleDateMouseEnter(date); setTooltip({ x: e.clientX, y: e.clientY, text: tooltipText }); }}
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        position: "relative", borderRadius: 3, padding: "3px 1px",
                        background: isSelected ? "rgba(14,165,233,0.3)" : priceColor(price),
                        cursor: "pointer", textAlign: "center", minHeight: 28,
                        border: isSelected ? "1px solid #0ea5e9" : isBooked ? "1px solid rgba(167,139,250,0.4)" : "1px solid transparent",
                        outline: isSelected ? "1px solid #0ea5e940" : "none",
                      }}
                    >
                      <div style={{ fontSize: 9, color: isSelected ? "#0ea5e9" : "#94a3b8", fontWeight: isSelected ? 700 : 500 }}>{d}</div>
                      {price !== null
                        ? <div style={{ fontSize: 8, color: priceTextColor(price), fontWeight: 600 }}>{price}</div>
                        : <div style={{ fontSize: 7, color: "#1e293b" }}>{basePrice}</div>
                      }
                      {/* Indicateur N-1 */}
                      {n1Arrow && (
                        <div style={{ position: "absolute", top: 1, left: 2, fontSize: 6, color: n1Color, fontWeight: 700, lineHeight: 1 }}>{n1Arrow}</div>
                      )}
                      {isBooked && (
                        <div style={{ position: "absolute", bottom: 1, right: 1, width: 4, height: 4, borderRadius: "50%", background: "#a78bfa" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>


      {/* Legend */}
      <div style={{ display: "flex", gap: 14, marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { color: "rgba(16,185,129,0.25)", label: "Promo (−15%+)" },
          { color: "rgba(14,165,233,0.15)", label: "Standard" },
          { color: "rgba(245,158,11,0.2)", label: "Haute saison (+5%+)" },
          { color: "rgba(239,68,68,0.25)", label: "Pic (+25%+)" },
          { color: "rgba(255,255,255,0.04)", label: "Défaut" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: color, border: "1px solid rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: 10, color: "#475569" }}>{label}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 3, background: "transparent", border: "1px solid rgba(167,139,250,0.4)", position: "relative" }}>
            <span style={{ position: "absolute", bottom: 1, right: 1, width: 3, height: 3, borderRadius: "50%", background: "#a78bfa", display: "block" }} />
          </span>
          <span style={{ fontSize: 10, color: "#475569" }}>Réservé</span>
        </div>
      </div>

      {/* ── Résumé tarifaire : min / moy / max par mois ── */}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 10 }}>
          Résumé tarifaire — {BIEN_LABELS[bienId]} {calYear}
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Mois","Min €","Moy €","Max €"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", color: "#475569", fontWeight: 600, textAlign: h === "Mois" ? "left" : "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 12 }, (_, m) => {
                const daysInM = new Date(calYear, m + 1, 0).getDate();
                const prices2 = [];
                for (let d = 1; d <= daysInM; d++) {
                  const date = `${calYear}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                  prices2.push(getPrice(date) ?? (SEED_DAILY_PRICES[bienId]?.[date] ?? basePrice));
                }
                const mn = Math.min(...prices2), mx = Math.max(...prices2);
                const avg = Math.round(prices2.reduce((s, p) => s + p, 0) / prices2.length);
                return (
                  <tr key={m} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "5px 10px", color: "#94a3b8" }}>{MOIS_CAL[m]}</td>
                    <td style={{ padding: "5px 10px", color: "#10b981", textAlign: "right", fontWeight: 600 }}>{mn}</td>
                    <td style={{ padding: "5px 10px", color: "#0ea5e9", textAlign: "right", fontWeight: 600 }}>{avg}</td>
                    <td style={{ padding: "5px 10px", color: "#f59e0b", textAlign: "right", fontWeight: 600 }}>{mx}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
