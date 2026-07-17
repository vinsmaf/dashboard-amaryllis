/**
 * CoutOtaTab — I-04 « Le vrai coût des OTA ».
 *
 * Distinct de NetRevParTab (qui chiffre le CA net après commission) : ici on ajoute le coût
 * de la RELATION CLIENT PERDUE. Les FAITS viennent de /api/ota-cost (commission réelle 2025 +
 * segmentation clients réactivables/captifs) ; les HYPOTHÈSES (taux de réactivation, valeur
 * séjour) sont des curseurs — le manque à gagner est recalculé côté client en temps réel.
 * Séparation visuelle stricte FAIT (bleu/neutre) vs ESTIMÉ (ambre) — jamais de chiffre inventé
 * présenté comme réel.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { adminFetch } from "../lib/apiFetch.js";
import { computeOtaCost } from "../utils/otaCost.js";

const eur = (n) => `${Math.round(n).toLocaleString("fr-FR")} €`;

export default function CoutOtaTab() {
  const [facts, setFacts] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(null); // null = laisse le serveur choisir la dernière année

  // Hypothèses réglables (curseurs). Pré-remplies depuis les données réelles une fois chargées.
  const [tauxReactivation, setTauxReactivation] = useState(0.15);
  const [valeurSejourMoyen, setValeurSejourMoyen] = useState(600);
  const [tauxCommissionOta, setTauxCommissionOta] = useState(0.17);

  const load = useCallback(async (y) => {
    try {
      const r = await adminFetch(`/api/ota-cost${y ? `?year=${y}` : ""}`);
      const d = await r.json();
      if (!d.version) throw new Error(d.error || `HTTP ${r.status}`);
      setFacts(d);
      if (d.hint?.valeurSejourMoyen) setValeurSejourMoyen(d.hint.valeurSejourMoyen);
      if (d.hint?.tauxCommissionOta) setTauxCommissionOta(d.hint.tauxCommissionOta);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(year); }, [load, year]);

  const result = useMemo(() => {
    if (!facts) return null;
    return computeOtaCost(facts, { tauxReactivation, valeurSejourMoyen, tauxCommissionOta });
  }, [facts, tauxReactivation, valeurSejourMoyen, tauxCommissionOta]);

  const MUTED = "var(--admin-muted)", CARD = "var(--admin-card)", BORDER = "var(--admin-border)", FG = "var(--admin-fg)";
  const AMBER = "#f59e0b", GREEN = "#10b981", INDIGO = "#6366f1";

  if (loading) return <div style={{ padding: 40, color: MUTED, textAlign: "center" }}>Chargement…</div>;
  if (error) return <div style={{ padding: 40, color: "#ef4444" }}>⚠️ {error}</div>;
  if (!result) return null;

  const { commission, captifs, reactivables, leadsSansSejour, economieProjetee } = result;

  const Card = ({ children, accent }) => (
    <div style={{ background: CARD, border: `1px solid ${accent || BORDER}`, borderRadius: 12, padding: "18px 20px" }}>{children}</div>
  );
  const Big = ({ v, color = FG }) => <div style={{ fontSize: 28, fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{v}</div>;
  const Lab = ({ children }) => <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, letterSpacing: "0.04em", marginBottom: 6 }}>{children}</div>;

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: MUTED }}>Finance · désintermédiation</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: FG }}>Le vrai coût des OTA</div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
            Commission calculée sur tes <strong>réservations réelles {facts.annee_reference}</strong>. Bleu = fait réel · <span style={{ color: AMBER }}>ambre = estimé, dépend des curseurs</span>.
          </div>
        </div>
        {facts.annees_disponibles?.length > 1 && (
          <div style={{ display: "flex", gap: 6 }}>
            {facts.annees_disponibles.map((y) => (
              <button key={y} onClick={() => setYear(y)}
                style={{
                  background: String(facts.annee_reference) === String(y) ? INDIGO : "transparent",
                  border: `1px solid ${String(facts.annee_reference) === String(y) ? INDIGO : BORDER}`,
                  color: String(facts.annee_reference) === String(y) ? "#fff" : MUTED,
                  borderRadius: 8, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>{y}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── FAITS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, margin: "18px 0" }}>
        <Card accent={INDIGO}>
          <Lab>💸 Commission OTA payée ({facts.annee_reference})</Lab>
          <Big v={eur(commission.total)} color={INDIGO} />
          <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
            Booking {eur(commission.booking)} · Airbnb {eur(commission.airbnb)}<br/>
            {commission.partOtaPct}% de ton CA passe par les OTA
          </div>
        </Card>

        <Card accent="rgba(239,68,68,0.4)">
          <Lab>🔒 Clients OTA captifs (sans email)</Lab>
          <Big v={captifs.count} color="#ef4444" />
          <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
            dont <strong style={{ color: FG }}>{captifs.repeaters} fidèles</strong> (2+ séjours)<br/>
            {eur(captifs.ltv)} de valeur déjà générée — <strong>jamais réactivable en direct</strong>
          </div>
        </Card>

        <Card accent="rgba(16,185,129,0.4)">
          <Lab>✅ Clients réactivables (email réel)</Lab>
          <Big v={reactivables.count} color={GREEN} />
          <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>
            {eur(reactivables.ltv)} de LTV — ton actif de désintermédiation<br/>
            {leadsSansSejour.count > 0 && <span>({leadsSansSejour.count} leads sans séjour exclus du calcul)</span>}
          </div>
        </Card>
      </div>

      {/* ── Le message central ── */}
      <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "16px 20px", marginBottom: 18 }}>
        <div style={{ fontSize: 14, color: FG, lineHeight: 1.6 }}>
          Tu paies <strong style={{ color: INDIGO }}>{eur(commission.total)}</strong> de commission OTA par an. Mais le vrai coût est plus profond :
          <strong style={{ color: "#ef4444" }}> {captifs.repeaters} de tes clients fidèles</strong> sont captifs d'un canal à {Math.round(tauxCommissionOta * 100)}% — tu n'as pas leur email, donc chacun de leurs retours te re-coûte la commission, sans que tu puisses jamais les inviter en direct.
          <strong> Le levier n'est pas de baisser un prix, c'est de collecter leur email.</strong>
        </div>
      </div>

      {/* ── HYPOTHÈSES (curseurs) → ESTIMÉ ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
          <Lab>🎚️ Tes hypothèses (à ajuster)</Lab>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: FG, marginBottom: 4 }}>Taux de réactivation espéré : <strong>{Math.round(tauxReactivation * 100)}%</strong></div>
            <input type="range" min="0" max="0.5" step="0.01" value={tauxReactivation} onChange={(e) => setTauxReactivation(Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ fontSize: 10, color: MUTED }}>Part des captifs fidèles que tu ramènerais en direct si tu avais leur email.</div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: FG, marginBottom: 4 }}>Valeur d'un séjour : <strong>{eur(valeurSejourMoyen)}</strong></div>
            <input type="range" min="200" max="2000" step="50" value={valeurSejourMoyen} onChange={(e) => setValeurSejourMoyen(Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ fontSize: 10, color: MUTED }}>Pré-rempli depuis tes données OTA réelles.</div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: FG, marginBottom: 4 }}>Commission évitée en direct : <strong>{Math.round(tauxCommissionOta * 100)}%</strong></div>
            <input type="range" min="0.03" max="0.20" step="0.01" value={tauxCommissionOta} onChange={(e) => setTauxCommissionOta(Number(e.target.value))} style={{ width: "100%" }} />
          </div>
        </div>

        <div style={{ background: "rgba(245,158,11,0.06)", border: `1px solid ${AMBER}`, borderRadius: 12, padding: "18px 20px" }}>
          <Lab>📈 Économie annuelle si tu réactives (estimé)</Lab>
          <Big v={eur(economieProjetee)} color={AMBER} />
          <div style={{ fontSize: 12, color: MUTED, marginTop: 8, lineHeight: 1.5 }}>
            {captifs.repeaters} fidèles captifs × {Math.round(tauxReactivation * 100)}% réactivés × {eur(valeurSejourMoyen)} × {Math.round(tauxCommissionOta * 100)}% de commission évitée, chaque année.
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 10, fontStyle: "italic" }}>
            ⚠️ Projection, pas un fait : elle dépend entièrement des curseurs ci-contre.
          </div>
        </div>
      </div>

      {/* ── Angles morts ── */}
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
