/**
 * Beds24Admin — extrait de src/App.jsx (refactor 2026, batch B/5).
 */
import { useState, useEffect } from "react";
import { CHANNEL_COLORS, STATUS_OPTIONS } from "../App.jsx";
import { useAppData } from "../AppDataContext.jsx";
import { applyServerPriceOverrides } from "../seedPrices.js";

export default function Beds24Admin() {
  const { scriptUrl, reservations = [], saveRes, addToast = () => {} } = useAppData();
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [testStatus,  setTestStatus]  = useState(null); // null | "ok" | "error"
  const [syncStatus,  setSyncStatus]  = useState(null); // null | "syncing" | "ok" | "error"
  const [filters,     setFilters]     = useState({
    arrivalFrom:   "",
    arrivalTo:     "",
    departureFrom: "",
    departureTo:   "",
    modifiedFrom:  "",
    status:        "",
  });
  const [fetchInfo, setFetchInfo]  = useState(null); // { total, fetchedAt, pages }
  const [expanded,  setExpanded]   = useState(null); // bookingId en cours

  // ── Fetch bookings ──────────────────────────────────────────────
  async function fetchBookings() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/beds24-bookings?${params}`, {
        headers: { Authorization: "Bearer " + (sessionStorage.getItem("ldb_tok") || "") },
      });
      let data;
      try { data = await res.json(); }
      catch { throw new Error(res.ok ? "Réponse non-JSON du serveur" : `Fonction /api/beds24-bookings introuvable (HTTP ${res.status}) — utilise npm run dev:cf`); }
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setBookings(data.bookings || []);
      setFetchInfo({ total: data.total, fetchedAt: data.fetchedAt, pages: data.pages });
    } catch (e) {
      setError(e.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  // ── Test connexion ──────────────────────────────────────────────
  async function testConnection() {
    setTestStatus(null);
    try {
      const res = await fetch("/api/beds24-bookings?test=1", {
        headers: { Authorization: "Bearer " + (sessionStorage.getItem("ldb_tok") || "") },
      });
      let data;
      try { data = await res.json(); } catch { setTestStatus("error"); return; }
      setTestStatus(data.ok ? "ok" : "error");
      if (!data.ok && data.error) setError(data.error);
    } catch { setTestStatus("error"); }
  }

  // ── Sync vers Google Sheets ──────────────────────────────────────
  async function syncToSheets() {
    if (!scriptUrl) { addToast("Configure d'abord l'URL Apps Script (bouton ⚙)", "error"); return; }
    if (bookings.length === 0) { addToast("Charge d'abord les réservations", "error"); return; }
    setSyncStatus("syncing");
    try {
      // Beds24 (Nogent) → format unifié "Toutes les Réservations".
      // id "beds24-<bookingId>" identique au sync principal → upsert sans doublon.
      const reservations = bookings.map(b => ({
        id:         "beds24-" + b.bookingId,
        bienId:     "nogent",
        voyageur:   b.guestName,
        canal:      b.channelLabel || b.channel || "Beds24",
        checkin:    b.arrival,
        checkout:   b.departure,
        nights:     b.nights,
        montant:    b.price,
        nb_guests:  b.numGuests,
        notes:      b.notes || "",
        source:     "Beds24",
        status:     b.statusLabel || "Confirmé",
        modifiedOn: b.modifiedOn || b.arrival || "",
      }));
      const res  = await fetch("/api/sheets-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Script-Url": scriptUrl },
        body: JSON.stringify({ action: "importAllReservations", reservations }),
      });
      const data = await res.json();
      if (data.ok) {
        setSyncStatus("ok");
        addToast(`📊 Sheets — ${data.added || 0} ajoutée(s), ${data.updated || 0} mise(s) à jour`, "success");
      } else {
        setSyncStatus("error");
        addToast(`Sheets — ${data.error || "Erreur Apps Script"}`, "error");
      }
    } catch (e) {
      setSyncStatus("error");
      addToast(`Sheets — ${e.message}`, "error");
    }
  }

  // ── Sync vers Planning (calendrier principal) ────────────────────
  const [planningStatus, setPlanningStatus] = useState(null); // null | "ok" | "error"

  function syncToPlanning() {
    if (!bookings.length) return;
    const beds24Converted = bookings
      .filter(b => b.status !== 2 && b.statusLabel !== "Annulé") // exclure annulés
      .map(b => ({
        id:               "beds24-" + b.bookingId,
        bienId:           "nogent",
        voyageur:         b.guestName || "—",
        canal:            b.channelLabel || b.channel || "Beds24",
        checkin:          b.arrival,
        checkout:         b.departure,
        checkin_time:     "",
        checkout_time:    "",
        nb_guests:        b.numGuests || 1,
        montant:          b.price || 0,
        notes:            b.notes || "",
        phone:            b.phone || "",
        reservation_code: String(b.bookingId),
        fromBeds24:       true,
        fromIcal:         false,
        menage_done:      false,
        assigne:          "",
      }));
    // Remplacer toutes les réservations beds24 existantes, garder les autres
    const autres = reservations.filter(r => !String(r.id).startsWith("beds24-"));
    saveRes([...autres, ...beds24Converted]);
    setPlanningStatus("ok");
    addToast(`📅 ${beds24Converted.length} réservation(s) Beds24 injectée(s) dans le planning`, "success");
    setTimeout(() => setPlanningStatus(null), 3000);
  }

  // ── Sync tarifs depuis Beds24 inventory ─────────────────────────────────
  const [pricesSyncStatus, setPricesSyncStatus] = useState(null); // null | "loading" | "ok" | "error"

  async function syncPricesFromBeds24() {
    setPricesSyncStatus("loading");
    try {
      const res = await fetch("/api/beds24-prices");
      let data;
      try { data = await res.json(); }
      catch { throw new Error(`HTTP ${res.status} — réponse non-JSON`); }
      if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (!data.nogent || Object.keys(data.nogent).length === 0) {
        throw new Error("Aucun tarif reçu de Beds24");
      }
      // Fusionner dans le localStorage local (overrides Beds24 > seed)
      applyServerPriceOverrides({ nogent: data.nogent });
      setPricesSyncStatus("ok");
      const sourceLabel = data.source === "bookings" ? "depuis réservations confirmées" : "depuis inventaire Beds24";
      addToast(`💰 ${Object.keys(data.nogent).length} nuits synced (${data.bookingCount || 0} rés. · ${sourceLabel})`, "success");
      setTimeout(() => { setPricesSyncStatus(null); }, 5000);
    } catch (e) {
      setPricesSyncStatus("error");
      addToast(`Tarifs Beds24 — ${e.message}`, "error");
    }
  }

  // Chargement initial
  useEffect(() => { fetchBookings(); }, []);

  const fmtDate = (d) => d ? new Date(d + "T12:00:00Z").toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtMoney = (n) => n ? `${Number(n).toLocaleString("fr-FR")} €` : "—";

  return (
    <div style={{ maxWidth: 1200 }}>

      {/* ── En-tête ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#e2e8f0" }}>
            🏙️ Beds24 — T2 Nogent-sur-Marne
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            Propriété 158192 · {fetchInfo ? `${fetchInfo.total} réservation(s) · ${new Date(fetchInfo.fetchedAt).toLocaleString("fr-FR")}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Test connexion */}
          <button
            onClick={testConnection}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #334155", background: "transparent", color: testStatus === "ok" ? "#10b981" : testStatus === "error" ? "#ef4444" : "#94a3b8", fontSize: 11, cursor: "pointer" }}
          >
            {testStatus === "ok" ? "✓ Connecté" : testStatus === "error" ? "✗ Échec" : "🔌 Tester"}
          </button>
          <button
            onClick={fetchBookings}
            disabled={loading}
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #0ea5e9", background: "rgba(14,165,233,0.12)", color: "#0ea5e9", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            {loading ? "⟳ Chargement…" : "⟳ Actualiser"}
          </button>
          <button
            onClick={syncToPlanning}
            disabled={bookings.length === 0}
            title="Injecter les réservations Beds24 dans le calendrier principal"
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #a78bfa", background: "rgba(167,139,250,0.1)", color: planningStatus === "ok" ? "#10b981" : "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            {planningStatus === "ok" ? "✓ Ajouté au planning" : "📅 → Planning"}
          </button>
          <button
            onClick={syncPricesFromBeds24}
            disabled={pricesSyncStatus === "loading"}
            title="Lire les tarifs journaliers Beds24 et les synchroniser dans le calendrier des prix"
            style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${pricesSyncStatus === "ok" ? "#10b981" : pricesSyncStatus === "error" ? "#ef4444" : "#f59e0b"}`, background: `rgba(${pricesSyncStatus === "ok" ? "16,185,129" : pricesSyncStatus === "error" ? "239,68,68" : "245,158,11"},0.1)`, color: pricesSyncStatus === "ok" ? "#10b981" : pricesSyncStatus === "error" ? "#ef4444" : "#f59e0b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            {pricesSyncStatus === "loading" ? "⟳ Sync tarifs…" : pricesSyncStatus === "ok" ? "✓ Tarifs synced" : pricesSyncStatus === "error" ? "✗ Échec tarifs" : "💰 Sync tarifs"}
          </button>
          <button
            onClick={syncToSheets}
            disabled={syncStatus === "syncing" || bookings.length === 0}
            title="Exporter toutes les réservations visibles vers Google Sheets"
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #10b981", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            {syncStatus === "syncing" ? "⟳ Export…" : "📊 → Sheets"}
          </button>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 18px", marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        {[
          { key: "arrivalFrom",   label: "Arrivée from" },
          { key: "arrivalTo",     label: "Arrivée to" },
          { key: "departureFrom", label: "Départ from" },
          { key: "departureTo",   label: "Départ to" },
          { key: "modifiedFrom",  label: "Modifié from" },
        ].map(({ key, label }) => (
          <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
            <input
              type="date"
              value={filters[key]}
              onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
              style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0", padding: "5px 9px", fontSize: 12 }}
            />
          </label>
        ))}
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Statut</span>
          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0", padding: "5px 9px", fontSize: 12, minWidth: 160 }}
          >
            {STATUS_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </label>
        <button
          onClick={fetchBookings}
          style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "#0ea5e9", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", alignSelf: "flex-end" }}
        >Filtrer</button>
        <button
          onClick={() => {
            setFilters({ arrivalFrom: "", arrivalTo: "", departureFrom: "", departureTo: "", modifiedFrom: "", status: "" });
            setTimeout(fetchBookings, 0);
          }}
          style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #334155", background: "transparent", color: "#64748b", fontSize: 11, cursor: "pointer", alignSelf: "flex-end" }}
        >Réinitialiser</button>
      </div>

      {/* ── Mix de canaux ── */}
      {bookings.length > 0 && (() => {
        const normalize = (c) => {
          if (!c) return "autre";
          const l = String(c).toLowerCase();
          if (l.includes("booking")) return "booking";
          if (l.includes("airbnb"))  return "airbnb";
          if (l.includes("direct"))  return "direct";
          return "autre";
        };
        const canalStats = {};
        bookings.forEach(b => {
          const key = normalize(b.channelLabel || b.channel || "");
          if (!canalStats[key]) canalStats[key] = { count: 0, montant: 0 };
          canalStats[key].count++;
          canalStats[key].montant += b.price || 0;
        });
        const total = bookings.length;
        const canalConf = {
          booking: { label: "Booking.com", color: "#0ea5e9", comm: 15 },
          airbnb:  { label: "Airbnb",      color: "#FF5A5F", comm: 3  },
          direct:  { label: "Direct",      color: "#10b981", comm: 0  },
          autre:   { label: "Autre",       color: "#64748b", comm: 0  },
        };
        const rows = Object.entries(canalStats)
          .map(([k, s]) => ({ key: k, ...canalConf[k], pct: Math.round(s.count / total * 100), ...s }))
          .sort((a, b) => b.count - a.count);
        const bookingPct = canalStats.booking ? Math.round(canalStats.booking.count / total * 100) : 0;
        return (
          <div style={{ background: "#0f172a", border: `1px solid ${bookingPct > 70 ? "rgba(239,68,68,0.3)" : "#1e293b"}`, borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: bookingPct > 70 ? "#ef4444" : "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
              📊 Mix de canaux {bookingPct > 70 ? "⚠ Concentration excessive" : ""}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {rows.map(r => (
                <div key={r.key} style={{ background: `${r.color}15`, border: `1px solid ${r.color}40`, borderRadius: 8, padding: "8px 14px", minWidth: 110 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#e2e8f0", fontFamily: "var(--font-mono)", marginTop: 2 }}>{r.pct}%</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{r.count} rés. · comm. {r.comm}%</div>
                </div>
              ))}
            </div>
            {bookingPct > 70 && (
              <div style={{ fontSize: 10, color: "#f87171", marginTop: 10 }}>
                ⚠ Dépendance Booking.com trop élevée ({bookingPct}%). Objectif cible : &lt; 50% — activer Airbnb et réservations directes.
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Erreur ── */}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 14, color: "#fca5a5", fontSize: 12 }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Tableau des réservations ── */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}>
        {loading ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e293b" }}>
                  {["ID", "Client", "Arrivée", "Départ", "Nuits", "Canal", "Statut", "Montant", ""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[60, 80, 45, 70, 55, 90, 40].map((w, i) => (
                  <tr key={i} className="skeleton-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 40, height: 12 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: `${w}px`, height: 12 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 68, height: 12 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 68, height: 12 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 20, height: 12 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 50, height: 18, borderRadius: 20 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 50, height: 18, borderRadius: 20 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 48, height: 12 }} /></td>
                    <td style={{ padding: "12px 14px" }}><span style={{ width: 10, height: 12 }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 13 }}>Aucune réservation trouvée</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e293b" }}>
                  {["ID", "Client", "Arrivée", "Départ", "Nuits", "Canal", "Statut", "Montant", ""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, idx) => (
                  <>
                    <tr
                      key={b.bookingId}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", background: expanded === b.bookingId ? "rgba(14,165,233,0.05)" : idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
                      onClick={() => setExpanded(expanded === b.bookingId ? null : b.bookingId)}
                    >
                      <td style={{ padding: "10px 14px", fontSize: 11, color: "#64748b", fontFamily: "var(--font-mono)" }}>#{b.bookingId}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>{b.guestName}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#cbd5e1", whiteSpace: "nowrap" }}>{fmtDate(b.arrival)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#cbd5e1", whiteSpace: "nowrap" }}>{fmtDate(b.departure)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#94a3b8", textAlign: "center" }}>{b.nights}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                          background: `${CHANNEL_COLORS[b.channelLabel] || "#475569"}22`,
                          color: CHANNEL_COLORS[b.channelLabel] || "#94a3b8",
                          border: `1px solid ${CHANNEL_COLORS[b.channelLabel] || "#475569"}44`,
                          whiteSpace: "nowrap",
                        }}>{b.channelLabel || b.channel || "—"}</span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                          background: b.status === "1" || b.status === 1 ? "rgba(16,185,129,0.15)" : b.status === "2" || b.status === 2 ? "rgba(239,68,68,0.12)" : "rgba(148,163,184,0.1)",
                          color:      b.status === "1" || b.status === 1 ? "#10b981" : b.status === "2" || b.status === 2 ? "#f87171" : "#94a3b8",
                          border:     `1px solid ${b.status === "1" || b.status === 1 ? "rgba(16,185,129,0.3)" : b.status === "2" || b.status === 2 ? "rgba(239,68,68,0.25)" : "rgba(148,163,184,0.15)"}`,
                          whiteSpace: "nowrap",
                        }}>{b.statusLabel}</span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#a3e635", fontWeight: 600, whiteSpace: "nowrap" }}>{fmtMoney(b.price)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#475569" }}>{expanded === b.bookingId ? "▲" : "▼"}</td>
                    </tr>
                    {/* Ligne détail dépliable */}
                    {expanded === b.bookingId && (
                      <tr key={`${b.bookingId}-detail`} style={{ background: "rgba(14,165,233,0.04)", borderBottom: "1px solid rgba(14,165,233,0.1)" }}>
                        <td colSpan={9} style={{ padding: "14px 20px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                            {[
                              { l: "Email",         v: b.email     || "—" },
                              { l: "Téléphone",     v: b.phone     || "—" },
                              { l: "Voyageurs",     v: b.numGuests },
                              { l: "Chambre",       v: b.roomId    || "—" },
                              { l: "Unité",         v: b.unitId    || "—" },
                              { l: "Créé le",       v: fmtDate(b.createdOn) },
                              { l: "Modifié le",    v: fmtDate(b.modifiedOn) },
                              { l: "Canal brut",    v: b.channel   || "—" },
                            ].map(({ l, v }) => (
                              <div key={l}>
                                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{l}</div>
                                <div style={{ fontSize: 12, color: "#cbd5e1" }}>{v}</div>
                              </div>
                            ))}
                            {b.notes && (
                              <div style={{ gridColumn: "1 / -1" }}>
                                <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Notes voyageur</div>
                                <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>{b.notes}</div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Résumé bas ── */}
      {bookings.length > 0 && (
        <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
          {[
            { l: "Total réservations", v: bookings.length },
            { l: "CA total",           v: fmtMoney(bookings.reduce((s, b) => s + (b.price || 0), 0)) },
            { l: "Confirmées",         v: bookings.filter(b => String(b.status) === "1").length },
            { l: "Annulées",           v: bookings.filter(b => String(b.status) === "2").length },
            { l: "Nuits totales",      v: bookings.filter(b => String(b.status) !== "2").reduce((s, b) => s + (b.nights || 0), 0) },
          ].map(({ l, v }) => (
            <div key={l} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 18px", minWidth: 130 }}>
              <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
