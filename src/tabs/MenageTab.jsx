/**
 * MenageTab — planning ménages 21 jours + assignation prestataires.
 * Inclut MenageCard (utilisé uniquement ici).
 * Extrait de src/App.jsx (refactor 2026, batch B/3).
 */
import { useState } from "react";
import { useAppData } from "../AppDataContext.jsx";

function MenageCard({ m, saveRes }) {
  const [assigne, setAssigne] = useState(m.resa.assigne || "");
  const windowColor = m.windowHours === null ? "#64748b" : m.windowHours < 4 ? "#ef4444" : m.windowHours < 8 ? "#f59e0b" : "#10b981";
  const fmt = d => d ? d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) : "—";
  const save = (field, val) => saveRes(m.resa.id, field, val);

  return (
    <div style={{ background: m.resa.menage_done ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${m.resa.menage_done ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: "14px 16px", marginBottom: 8, display: "flex", gap: 12, alignItems: "flex-start" }}>
      {/* Done toggle */}
      <button onClick={() => save("menage_done", !m.resa.menage_done)} style={{ width: 30, height: 30, borderRadius: "50%", border: `2px solid ${m.resa.menage_done ? "#10b981" : "#334155"}`, background: m.resa.menage_done ? "#10b981" : "transparent", color: "#fff", fontSize: 15, cursor: "pointer", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {m.resa.menage_done ? "✓" : ""}
      </button>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#e2e8f0" }}>{m.bienEmoji} {m.bienNom}</span>
          {m.resa.canal && <span style={{ fontSize: 9, background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "2px 6px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>{m.resa.canal}</span>}
          {m.resa.menage_done && <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700 }}>✓ FAIT</span>}
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
          <span>🚪 Sortie : <b style={{ color: "#e2e8f0" }}>{m.resa.voyageur || "—"}</b></span>
          {m.nextResa
            ? <span>🔑 Arrivée : <b style={{ color: "#e2e8f0" }}>{m.nextResa.voyageur || "—"}</b> · <b style={{ color: "#f59e0b" }}>{fmt(m.nextCheckin)}</b></span>
            : <span style={{ color: "#334155" }}>Pas d'arrivée suivante planifiée</span>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {m.windowHours !== null && (
            <span style={{ fontSize: 11, color: windowColor, fontWeight: 600, background: `${windowColor}18`, borderRadius: 6, padding: "3px 8px" }}>
              ⏱ {m.windowHours}h de fenêtre
            </span>
          )}
          <input
            type="text"
            placeholder="Prestataire / assigné…"
            value={assigne}
            onChange={e => { setAssigne(e.target.value); save("assigne", e.target.value); }}
            style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "5px 10px", color: "#e2e8f0", width: 200 }}
          />
        </div>
      </div>
    </div>
  );
}

export default function MenageTab() {
  const { biens, reservations, saveRes, mob } = useAppData();
  const today = new Date(); today.setHours(0,0,0,0);
  const in21  = new Date(today.getTime() + 21 * 86400000);
  const todayStr = today.toISOString().slice(0,10);
  const tomorStr = new Date(today.getTime() + 86400000).toISOString().slice(0,10);

  // Collecte toutes les sorties dans les 21 prochains jours
  const menages = [];
  biens.forEach(b => {
    const bienResas = reservations
      .filter(r => r.bienId === b.id && r.checkout)
      .sort((a, z) => a.checkout.localeCompare(z.checkout));

    bienResas.forEach((r, i) => {
      const coDate = new Date(r.checkout + "T12:00:00"); coDate.setHours(0,0,0,0);
      if (coDate < today || coDate > in21) return;
      const nextResa = bienResas.find((r2, j) => j > i && r2.checkin >= r.checkout);
      const nextCi = nextResa ? (() => { const d = new Date(nextResa.checkin + "T12:00:00"); d.setHours(0,0,0,0); return d; })() : null;
      const windowHours = nextCi ? Math.round((nextCi - coDate) / 3600000) : null;
      menages.push({ bienId: b.id, bienNom: b.nom, bienEmoji: b.emoji || "🏡", resa: r, checkout: coDate, nextResa, nextCheckin: nextCi, windowHours });
    });
  });
  menages.sort((a, z) => a.checkout - z.checkout);

  // Grouper par jour
  const byDay = {};
  menages.forEach(m => {
    const dk = m.checkout.toISOString().slice(0,10);
    if (!byDay[dk]) byDay[dk] = [];
    byDay[dk].push(m);
  });

  const fmt = d => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const done = menages.filter(m => m.resa.menage_done).length;

  // saveRes pour MenageCard : met à jour un champ d'une résa
  const saveMenageField = (id, field, val) => {
    saveRes(reservations.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total 21 jours",   value: menages.length, color: "#a855f7" },
          { label: "Faits",            value: done,           color: "#10b981" },
          { label: "À faire",          value: menages.length - done, color: menages.length - done > 0 ? "#ef4444" : "#475569" },
          { label: "Aujourd'hui",      value: (byDay[todayStr] || []).length, color: "#f59e0b" },
        ].map(k => (
          <div key={k.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: "var(--font-mono)" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {menages.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#475569" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
          Aucun ménage prévu dans les 21 prochains jours
        </div>
      ) : (
        Object.entries(byDay).map(([dk, list]) => {
          const isToday = dk === todayStr, isTomorrow = dk === tomorStr;
          const dateLabel = isToday ? "Aujourd'hui" : isTomorrow ? "Demain" : fmt(new Date(dk + "T12:00:00"));
          return (
            <div key={dk} style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? "#ef4444" : "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                {isToday && <span style={{ background: "#ef4444", borderRadius: 4, padding: "1px 6px", color: "#fff", fontSize: 9 }}>URGENT</span>}
                {dateLabel}
              </div>
              {list.map(m => <MenageCard key={m.resa.id} m={m} saveRes={saveMenageField} />)}
            </div>
          );
        })
      )}
    </div>
  );
}
