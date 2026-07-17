/**
 * PnlSejourTab — I-03 « P&L par séjour (pas CA par séjour) ».
 *
 * Le CA brut d'un séjour ment. Ici on décompose chaque réservation en coûts variables directs
 * (commission OTA réelle, frais Stripe, coût ménage) → marge de CONTRIBUTION. Deux séjours au même
 * prix ne rapportent pas pareil : un Booking à 17% + ménage nette bien moins qu'un direct.
 *
 * Séparation stricte FAIT (marge de contribution) vs ESTIMÉ (allocation charges fixes, curseur).
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { adminFetch } from "../lib/apiFetch.js";
import { getBien } from "../data/biens.js";
import { appliqueChargesFixes } from "../utils/pnlSejour.js";

const eur = (n) => `${Math.round(n).toLocaleString("fr-FR")} €`;
const nom = (id) => getBien(id)?.nom || id || "?";
const CANAL_LABEL = { airbnb: "Airbnb", booking: "Booking.com", direct: "Direct", autre: "Autre" };
const CANAL_COLOR = { airbnb: "#FF5A5F", booking: "#0ea5e9", direct: "#10b981", autre: "#94a3b8" };

export default function PnlSejourTab() {
  const [facts, setFacts] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(null);
  const [fixePerNuit, setFixePerNuit] = useState(0); // curseur charges fixes (ESTIMÉ, off par défaut)

  const load = useCallback(async (y) => {
    setLoading(true);
    try {
      const r = await adminFetch(`/api/pnl-sejour${y ? `?year=${y}` : ""}`);
      const d = await r.json();
      if (!d.version) throw new Error(d.error || `HTTP ${r.status}`);
      setFacts(d);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(year); }, [load, year]);

  const view = useMemo(() => (facts ? appliqueChargesFixes(facts, fixePerNuit) : null), [facts, fixePerNuit]);

  const MUTED = "var(--admin-muted)", CARD = "var(--admin-card)", BORDER = "var(--admin-border)", FG = "var(--admin-fg)";
  const AMBER = "#f59e0b", GREEN = "#10b981", INDIGO = "#6366f1";

  if (loading) return <div style={{ padding: 40, color: MUTED, textAlign: "center" }}>Chargement…</div>;
  if (error) return <div style={{ padding: 40, color: "#ef4444" }}>⚠️ {error}</div>;
  if (!view) return null;

  const { global, parCanal, parBien, stays, annees_disponibles, annee_reference, netGlobalEstime } = view;
  const canaux = Object.entries(parCanal).sort((a, b) => b[1].ca - a[1].ca);
  const biens = Object.entries(parBien).sort((a, b) => b[1].marge - a[1].marge);
  const top = stays.slice(0, 5);
  const bottom = stays.slice(-5).reverse().filter((s) => !top.includes(s));

  const Card = ({ children, accent }) => (
    <div style={{ background: CARD, border: `1px solid ${accent || BORDER}`, borderRadius: 12, padding: "18px 20px" }}>{children}</div>
  );
  const Big = ({ v, color = FG }) => <div style={{ fontSize: 26, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{v}</div>;
  const Lab = ({ children }) => <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, letterSpacing: "0.04em", marginBottom: 6 }}>{children}</div>;
  const th = { textAlign: "right", fontSize: 11, color: MUTED, fontWeight: 600, padding: "6px 10px" };
  const td = { textAlign: "right", fontSize: 13, color: FG, padding: "6px 10px", fontVariantNumeric: "tabular-nums" };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: MUTED }}>Finance · rentabilité réelle</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: FG }}>P&L par séjour (pas CA par séjour)</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
            Le CA brut ment. Marge de <strong>contribution {annee_reference}</strong> = CA − commission − Stripe − ménage. <span style={{ color: AMBER }}>Curseur = charges fixes estimées</span>.
          </div>
        </div>
        {annees_disponibles?.length > 1 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {annees_disponibles.map((y) => (
              <button key={y} onClick={() => setYear(y)}
                style={{
                  background: String(annee_reference) === String(y) ? INDIGO : "transparent",
                  border: `1px solid ${String(annee_reference) === String(y) ? INDIGO : BORDER}`,
                  color: String(annee_reference) === String(y) ? "#fff" : MUTED,
                  borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>{y}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── Totaux (FAIT) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, margin: "18px 0" }}>
        <Card><Lab>CA brut ({global.count} séjours)</Lab><Big v={eur(global.ca)} /></Card>
        <Card accent="rgba(239,68,68,0.35)"><Lab>Coûts variables</Lab><Big v={eur(global.commission + global.stripe + global.menage)} color="#ef4444" />
          <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>Commission {eur(global.commission)} · Ménage {eur(global.menage)} · Stripe {eur(global.stripe)}</div>
        </Card>
        <Card accent={INDIGO}><Lab>Marge de contribution</Lab><Big v={eur(global.marge)} color={INDIGO} />
          <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}><strong style={{ color: FG }}>{global.margePct}%</strong> du CA · {global.margeParNuit != null ? `${eur(global.margeParNuit)}/nuit` : "—"}</div>
        </Card>
      </div>

      {/* ── Le CA ment : par canal ── */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
        <Lab>💡 Le CA ment — marge réelle par canal</Lab>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead><tr>
              <th style={{ ...th, textAlign: "left" }}>Canal</th><th style={th}>Séjours</th><th style={th}>CA</th>
              <th style={th}>Commission</th><th style={th}>Ménage</th><th style={th}>Marge</th><th style={th}>Marge %</th>
            </tr></thead>
            <tbody>
              {canaux.map(([k, v]) => (
                <tr key={k} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ ...td, textAlign: "left", fontWeight: 600 }}><span style={{ color: CANAL_COLOR[k] || FG }}>●</span> {CANAL_LABEL[k] || k}</td>
                  <td style={td}>{v.count}</td><td style={td}>{eur(v.ca)}</td>
                  <td style={{ ...td, color: v.commission ? "#ef4444" : MUTED }}>{v.commission ? `−${eur(v.commission)}` : "—"}</td>
                  <td style={{ ...td, color: MUTED }}>−{eur(v.menage)}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{eur(v.marge)}</td>
                  <td style={{ ...td, fontWeight: 700, color: v.margePct >= global.margePct ? GREEN : AMBER }}>{v.margePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 8 }}>À CA égal, le direct nette plus : la colonne « Marge % » est le vrai classement de tes canaux.</div>
      </div>

      {/* ── Par bien ── */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
        <Lab>Marge de contribution par bien</Lab>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
            <thead><tr>
              <th style={{ ...th, textAlign: "left" }}>Bien</th><th style={th}>Séjours</th><th style={th}>Nuits</th>
              <th style={th}>CA</th><th style={th}>Marge</th><th style={th}>Marge %</th><th style={th}>€/nuit</th>
            </tr></thead>
            <tbody>
              {biens.map(([k, v]) => (
                <tr key={k} style={{ borderTop: `1px solid ${BORDER}` }}>
                  <td style={{ ...td, textAlign: "left", fontWeight: 600 }}>{nom(k)}</td>
                  <td style={td}>{v.count}</td><td style={td}>{v.nights}</td><td style={td}>{eur(v.ca)}</td>
                  <td style={{ ...td, fontWeight: 700 }}>{eur(v.marge)}</td>
                  <td style={{ ...td, color: v.margePct >= global.margePct ? GREEN : AMBER }}>{v.margePct}%</td>
                  <td style={td}>{v.margeParNuit != null ? eur(v.margeParNuit) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Charges fixes (ESTIMÉ) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start", marginBottom: 16 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
          <Lab>🎚️ Allocation de charges fixes (optionnel)</Lab>
          <div style={{ fontSize: 12, color: FG, marginBottom: 4 }}>Charge fixe estimée : <strong>{fixePerNuit} €/nuit</strong></div>
          <input type="range" min="0" max="80" step="5" value={fixePerNuit} onChange={(e) => setFixePerNuit(Number(e.target.value))} style={{ width: "100%" }} />
          <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>Assurance, énergie, prêt, taxe foncière… réparties par nuit. 0 = off (on reste sur la marge de contribution, un fait).</div>
        </div>
        <div style={{ background: fixePerNuit > 0 ? "rgba(245,158,11,0.06)" : CARD, border: `1px solid ${fixePerNuit > 0 ? AMBER : BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
          <Lab>📉 Net estimé après charges fixes</Lab>
          {fixePerNuit > 0 ? (
            <>
              <Big v={eur(netGlobalEstime)} color={AMBER} />
              <div style={{ fontSize: 11, color: MUTED, marginTop: 8, fontStyle: "italic" }}>⚠️ Projection : {fixePerNuit}€ × {global.nights} nuits déduits de la marge. Dépend de ton hypothèse.</div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>Active le curseur pour estimer le net après charges fixes.</div>
          )}
        </div>
      </div>

      {/* ── Top / flop séjours ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <StaysList title="🥇 Séjours les plus rentables" rows={top} fix={fixePerNuit} GREEN={GREEN} MUTED={MUTED} FG={FG} BORDER={BORDER} CARD={CARD} />
        <StaysList title="🩹 Séjours les moins rentables" rows={bottom} fix={fixePerNuit} GREEN="#ef4444" MUTED={MUTED} FG={FG} BORDER={BORDER} CARD={CARD} />
      </div>

      {facts.blind_spots?.length > 0 && (
        <details style={{ marginTop: 18 }}>
          <summary style={{ fontSize: 11, color: MUTED, cursor: "pointer" }}>⚠️ Ce que ce chiffre ne dit pas ({facts.blind_spots.length})</summary>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {facts.blind_spots.map((b, i) => <li key={i} style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>{b}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}

function StaysList({ title, rows, fix, GREEN, MUTED, FG, BORDER, CARD }) {
  const eur2 = (n) => `${Math.round(n).toLocaleString("fr-FR")} €`;
  const nom2 = (id) => getBien(id)?.nom || id || "?";
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 20px" }}>
      <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 10 }}>{title}</div>
      {rows.map((s) => (
        <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: FG, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nom2(s.bienId)} · {CANAL_LABEL[s.canal] || s.canal}</div>
            <div style={{ fontSize: 11, color: MUTED }}>{s.checkin} · {s.nights} nuit{s.nights > 1 ? "s" : ""} · CA {eur2(s.ca)}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: GREEN, fontVariantNumeric: "tabular-nums" }}>{eur2(fix > 0 && s.netEstime != null ? s.netEstime : s.marge)}</div>
            <div style={{ fontSize: 10, color: MUTED }}>{s.margePct}% marge</div>
          </div>
        </div>
      ))}
    </div>
  );
}
