/**
 * FunnelTab — Dashboard funnel de conversion GA4
 * Affiche : view_item → availability_ready → date_selected → begin_checkout → add_payment_info → purchase
 * Les nouvelles étapes (availability_ready, date_selected, add_payment_info) se remplissent ~24h après le déploiement du 2026-06-21.
 */
import { useState, useEffect } from "react";

const FUNNEL_STEPS = [
  { key: "view_item",           label: "Fiche vue",           icon: "👁", color: "#6366f1", desc: "Visiteurs ayant ouvert une fiche villa" },
  { key: "availability_ready",  label: "Calendrier prêt",     icon: "📅", color: "#0ea5e9", desc: "Disponibilités chargées (calendrier affiché)" },
  { key: "date_selected",       label: "Dates choisies",      icon: "✅", color: "#8b5cf6", desc: "Arrivée + départ sélectionnés" },
  { key: "begin_checkout",      label: "Checkout ouvert",     icon: "🛒", color: "#f59e0b", desc: "Tunnel de paiement démarré" },
  { key: "add_payment_info",    label: "CB saisie",           icon: "💳", color: "#f97316", desc: "Coordonnées bancaires entrées" },
  { key: "purchase",            label: "Réservation",         icon: "🎉", color: "#10b981", desc: "Paiement confirmé" },
];

const BIENS_ORDER = ["amaryllis", "zandoli", "geko", "mabouya", "schoelcher", "nogent", "iguana"];
const BIEN_LABELS = { amaryllis: "Amaryllis", zandoli: "Zandoli", geko: "Géko", mabouya: "Mabouya", schoelcher: "Schœlcher", nogent: "Nogent", iguana: "Iguana" };

const card  = { background: "#1e293b", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 12 };
const muted = "#64748b";
const text  = "#e2e8f0";

function pct(a, b) {
  if (!b || b === 0) return null;
  return Math.round((a / b) * 100);
}

function Arrow({ rate, isNew }) {
  const color = rate === null ? "#334155" : rate >= 50 ? "#10b981" : rate >= 20 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 48 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: rate === null ? "#334155" : color }}>
        {rate === null ? (isNew ? "⏳" : "—") : `${rate}%`}
      </div>
      <div style={{ width: 1, height: 20, background: "#334155" }} />
      <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `6px solid ${rate === null ? "#334155" : color}` }} />
    </div>
  );
}

export default function FunnelTab() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showBien, setShowBien] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/analytics")
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 28 }}>🔄</div>
      <div style={{ color: muted, fontSize: 13 }}>Chargement du funnel…</div>
    </div>
  );

  if (error) return (
    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, color: "#f87171", marginBottom: 6 }}>⚠ Analytics non disponible</div>
      <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "var(--font-mono)" }}>{error}</div>
    </div>
  );

  // Construire la map eventName → count depuis data.funnel
  const funnelMap = {};
  (data?.funnel || []).forEach(r => { funnelMap[r.eventName] = parseInt(r.eventCount || 0, 10); });

  // Nouvelles étapes déployées le 2026-06-21 — peuvent être à 0 si données pas encore propagées
  const NEW_EVENTS = new Set(["availability_ready", "date_selected", "add_payment_info"]);
  const hasNewData = (data?.funnel || []).some(r => NEW_EVENTS.has(r.eventName) && parseInt(r.eventCount || 0, 10) > 0);

  // Construire le tableau funnel par bien (eventName × bien_id)
  const bienFunnelMap = {}; // { bienId: { eventName: count } }
  (data?.funnelByBien || []).forEach(r => {
    const bienId = r["customEvent:bien_id"] || r.bien_id || r["customEvent_bien_id"];
    if (!bienId || bienId === "(not set)") return;
    if (!bienFunnelMap[bienId]) bienFunnelMap[bienId] = {};
    bienFunnelMap[bienId][r.eventName] = parseInt(r.eventCount || 0, 10);
  });

  const biens = BIENS_ORDER.filter(id => bienFunnelMap[id]?.view_item > 0);

  const topStep = funnelMap["view_item"] || 0;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, color: "#f1f5f9" }}>🔭 Funnel de conversion</h2>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: muted }}>30 derniers jours · GA4 live</p>
        </div>
        {!hasNewData && (
          <div style={{ fontSize: 11, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "6px 12px" }}>
            ⏳ Nouvelles étapes déployées le 21/06 — données dans ~24h
          </div>
        )}
      </div>

      {/* KPIs rapides */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Fiches vues",        val: topStep,                            color: "#6366f1" },
          { label: "Checkout ouverts",   val: funnelMap["begin_checkout"] || 0,   color: "#f59e0b" },
          { label: "Réservations",       val: funnelMap["purchase"] || 0,          color: "#10b981" },
        ].map(k => (
          <div key={k.label} style={{ ...card, marginBottom: 0, padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.val.toLocaleString("fr-FR")}</div>
            <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>{k.label}</div>
            {k.val > 0 && topStep > 0 && (
              <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>
                {pct(k.val, topStep)}% des fiches
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Funnel visuel */}
      <div style={{ ...card, padding: "20px 24px" }}>
        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 16 }}>ÉTAPES DU FUNNEL (30j)</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          {FUNNEL_STEPS.map((step, i) => {
            const count  = funnelMap[step.key] || 0;
            const prev   = i > 0 ? (funnelMap[FUNNEL_STEPS[i - 1].key] || 0) : null;
            const rate   = i > 0 ? pct(count, prev) : null;
            const fromTop = pct(count, topStep);
            const isNew  = NEW_EVENTS.has(step.key);
            const noData = isNew && !hasNewData;
            const barW   = topStep > 0 ? Math.max(4, Math.round((count / topStep) * 100)) : 4;

            return (
              <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                {i > 0 && <Arrow rate={noData ? null : rate} isNew={isNew} />}
                <div style={{
                  width: "100%",
                  background: noData ? "rgba(255,255,255,0.03)" : `${step.color}18`,
                  border: `1px solid ${noData ? "rgba(255,255,255,0.06)" : step.color + "40"}`,
                  borderRadius: 10,
                  padding: "12px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}>
                  <span style={{ fontSize: 20 }}>{step.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: noData ? "#475569" : text }}>{step.label}</span>
                      {isNew && <span style={{ fontSize: 9, color: "#f59e0b", background: "rgba(245,158,11,0.15)", borderRadius: 4, padding: "1px 5px" }}>NOUVEAU</span>}
                    </div>
                    <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>{step.desc}</div>
                    {/* Barre de proportion */}
                    {!noData && count > 0 && (
                      <div style={{ marginTop: 8, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${barW}%`, height: "100%", background: step.color, borderRadius: 2, transition: "width 0.5s" }} />
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", minWidth: 80 }}>
                    {noData ? (
                      <div style={{ fontSize: 13, color: "#334155" }}>⏳ —</div>
                    ) : (
                      <>
                        <div style={{ fontSize: 20, fontWeight: 700, color: count > 0 ? step.color : "#334155" }}>
                          {count > 0 ? count.toLocaleString("fr-FR") : "0"}
                        </div>
                        {fromTop !== null && count > 0 && (
                          <div style={{ fontSize: 10, color: muted }}>{fromTop}% du haut</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Taux de conversion global */}
      {funnelMap["purchase"] > 0 && funnelMap["view_item"] > 0 && (
        <div style={{ ...card, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 28 }}>🎯</div>
          <div>
            <div style={{ fontSize: 13, color: text, fontWeight: 600 }}>
              Taux global fiche→achat : <span style={{ color: "#10b981", fontSize: 16 }}>{pct(funnelMap["purchase"], funnelMap["view_item"])}%</span>
            </div>
            <div style={{ fontSize: 11, color: muted, marginTop: 3 }}>
              {funnelMap["purchase"]} résa{funnelMap["purchase"] > 1 ? "s" : ""} sur {funnelMap["view_item"]} fiches vues · Objectif : 2 % (actuel : {pct(funnelMap["purchase"], funnelMap["view_item"])}%)
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 11, color: muted }}>Leads générés</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#a78bfa" }}>{(funnelMap["generate_lead"] || 0).toLocaleString("fr-FR")}</div>
          </div>
        </div>
      )}

      {/* Tableau par bien */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, marginTop: 8 }}>
        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>PAR LOGEMENT</div>
        <button
          onClick={() => setShowBien(v => !v)}
          style={{ fontSize: 11, color: "#94a3b8", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}
        >
          {showBien ? "Masquer" : "Afficher"}
        </button>
      </div>

      {showBien && (
        <div style={card}>
          {biens.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: muted, fontSize: 12 }}>
              {hasNewData ? "Aucune donnée par logement encore disponible" : "Les données par logement apparaîtront dans ~24h"}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, color: muted, fontWeight: 600 }}>Logement</th>
                    {FUNNEL_STEPS.map(s => (
                      <th key={s.key} style={{ padding: "10px 10px", textAlign: "center", fontSize: 10, color: NEW_EVENTS.has(s.key) ? "#f59e0b" : muted, fontWeight: 600 }}>
                        {s.icon} {s.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {biens.map(bienId => {
                    const bf = bienFunnelMap[bienId] || {};
                    const top = bf["view_item"] || 0;
                    return (
                      <tr key={bienId} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: text, fontWeight: 600 }}>{BIEN_LABELS[bienId] || bienId}</td>
                        {FUNNEL_STEPS.map((step, si) => {
                          const count = bf[step.key] || 0;
                          const isNew = NEW_EVENTS.has(step.key);
                          const noData = isNew && !hasNewData;
                          const fromTop = top > 0 && count > 0 ? pct(count, top) : null;
                          return (
                            <td key={step.key} style={{ padding: "10px 10px", textAlign: "center" }}>
                              {noData ? (
                                <span style={{ color: "#334155", fontSize: 12 }}>⏳</span>
                              ) : count === 0 ? (
                                <span style={{ color: "#334155", fontSize: 12 }}>—</span>
                              ) : (
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: step.color }}>{count}</div>
                                  {si > 0 && fromTop !== null && (
                                    <div style={{ fontSize: 9, color: muted }}>{fromTop}%</div>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Fuites identifiées */}
      <div style={{ ...card, padding: "14px 18px", marginTop: 8 }}>
        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginBottom: 10 }}>🔍 FUITES IDENTIFIÉES</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            {
              cond: funnelMap["view_item"] > 0 && funnelMap["date_selected"] !== undefined,
              label: "Fiche → Dates choisies",
              value: pct(funnelMap["date_selected"] || 0, funnelMap["view_item"] || 1),
              threshold: 20,
              action: "Accélérer le chargement calendrier · Badge scarcité",
            },
            {
              cond: funnelMap["date_selected"] > 0 && funnelMap["begin_checkout"] !== undefined,
              label: "Dates → Checkout",
              value: pct(funnelMap["begin_checkout"] || 0, funnelMap["date_selected"] || 1),
              threshold: 50,
              action: "CTA plus visible · Récap prix direct",
            },
            {
              cond: funnelMap["begin_checkout"] > 0,
              label: "Checkout → CB saisie",
              value: pct(funnelMap["add_payment_info"] || 0, funnelMap["begin_checkout"] || 1),
              threshold: 60,
              action: "Apple Pay / Google Pay · Rassurer sur la sécurité",
            },
            {
              cond: funnelMap["add_payment_info"] > 0,
              label: "CB saisie → Achat",
              value: pct(funnelMap["purchase"] || 0, funnelMap["add_payment_info"] || 1),
              threshold: 70,
              action: "Réduire le temps de traitement Stripe · Feedback loading",
            },
          ].filter(f => f.cond).map(f => {
            const noData = f.value === null || (NEW_EVENTS.has("date_selected") && !hasNewData && f.label.includes("Dates"));
            const ok = !noData && f.value >= f.threshold;
            return (
              <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 14 }}>{noData ? "⏳" : ok ? "✅" : "🔴"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: text, fontWeight: 600 }}>{f.label}</div>
                  <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>{f.action}</div>
                </div>
                <div style={{ textAlign: "right", minWidth: 60 }}>
                  {noData ? (
                    <span style={{ fontSize: 12, color: "#334155" }}>—</span>
                  ) : (
                    <span style={{ fontSize: 16, fontWeight: 700, color: ok ? "#10b981" : "#ef4444" }}>{f.value}%</span>
                  )}
                  <div style={{ fontSize: 9, color: muted }}>objectif ≥{f.threshold}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ fontSize: 10, color: "#1e293b", textAlign: "center", marginTop: 8 }}>
        Données GA4 · Cache 5 min · Nouvelles étapes actives depuis le 2026-06-21
      </div>
    </div>
  );
}
