/**
 * Planning — onglet calendrier réservations (gantt + to-do + iCal sync + Beds24).
 *
 * Extrait de src/App.jsx (refactor 2026, étape B/2).
 * Composant le plus complexe du dashboard : ~750 lignes, 10 props, 4 vues internes
 * (todo / gantt / trous / list / beds24 / minnights), sync iCal Airbnb+Booking
 * + sync Beds24 horaire, formulaire CRUD réservations.
 *
 * Dépendances internes incluses :
 *   - parseICS (parser iCal — uniquement utilisé ici)
 *   - EMPTY_FORM (constante formulaire)
 *
 * Comportement préservé strictement (refactor pur). Voir docs/REFACTOR_2026.md.
 */
import { useState, useEffect, useCallback, useRef } from "react";

// Helpers partagés exportés depuis App.jsx
import {
  MOIS_FULL, CC, CB, N, TT,
  fmt, fmtK,
  computeRevenusFromResas, MinNightsConfig,
} from "../App.jsx";
import { sumN, avgN, addDays, diffDays, todayStr } from "../utils/calculations.js";
import { loadDailyPrices } from "../seedPrices.js";

// ── parseICS — parser iCal (uniquement utilisé dans Planning) ────────────────
function parseICS(text, bienId, canal = "airbnb") {
  return text.split("BEGIN:VEVENT").slice(1).map(block => {
    const get = (key) => {
      const m = block.match(new RegExp(key + "[^:]*:([^\\r\\n]+)"));
      return m ? m[1].trim() : "";
    };
    const cleanDate = (s) => {
      const d = s.replace(/T.*/, "");
      return d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d;
    };
    const extractTime = (raw) => {
      // Try time from DTSTART/DTEND field itself: T160000 or T160000Z
      const tMatch = raw.match(/T(\d{2})(\d{2})/);
      if (tMatch) return `${tMatch[1]}:${tMatch[2]}`;
      return "";
    };

    const rawDtStart = get("DTSTART");
    const rawDtEnd   = get("DTEND");
    const ci = cleanDate(rawDtStart);
    const co = cleanDate(rawDtEnd);
    const sum = get("SUMMARY");
    if (!ci || !co) return null;
    // Filter Airbnb auto-block events ("not available", "Blocked")
    if (/not available|blocked/i.test(sum) && canal !== "booking") return null;
    // Filter Booking.com calendar closures by duration:
    // Booking.com uses identical format (CLOSED - Not available) for real reservations AND manual blocks.
    // Real vacation reservations are ≤ 30 nights. Longer = calendar closure, not a guest.
    if (canal === "booking") {
      const nights = Math.round((new Date(co + "T12:00:00Z") - new Date(ci + "T12:00:00Z")) / 86400000);
      if (nights > 30) return null;
    }

    // Parse DESCRIPTION — Airbnb uses \n literal in iCal
    const desc = get("DESCRIPTION").replace(/\\n/g, "\n");
    const descGet = (patterns) => {
      for (const p of patterns) {
        const m = desc.match(new RegExp(p + "\\s*[:\\-]\\s*([^\\n\\r]+)", "i"));
        if (m) return m[1].trim();
      }
      return "";
    };

    // Extract time from DTSTART/DTEND first, then fallback to DESCRIPTION
    let checkin_time  = extractTime(rawDtStart) || descGet(["Heure d'arrivée","Heure d.arriv[ée]+e","Arrival Time","Check.?in Time","Arrival"]);
    let checkout_time = extractTime(rawDtEnd)   || descGet(["Heure de départ","Heure de depart","Departure Time","Check.?out Time","Departure"]);

    // Normalize "4:00 PM" → "16:00"
    const to24 = (t) => {
      if (!t) return "";
      const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!m) return t;
      let h = parseInt(m[1]), mn = m[2], ap = (m[3] || "").toUpperCase();
      if (ap === "PM" && h < 12) h += 12;
      if (ap === "AM" && h === 12) h = 0;
      return `${String(h).padStart(2, "0")}:${mn}`;
    };
    checkin_time  = to24(checkin_time);
    checkout_time = to24(checkout_time);

    const adultStr  = descGet(["Nombre d'adultes","Adults?","Adultes?"]);
    const childStr  = descGet(["Nombre d'enfants","Children?","Enfants?"]);
    const adults    = parseInt(adultStr) || 0;
    const children  = parseInt(childStr) || 0;
    const nb_guests = adults + children || parseInt(descGet(["Guests?","Voyageurs?","Personnes?"])) || 0;

    const phone = descGet(["Téléphone","Telephone","Phone"]);

    const montantRaw = descGet(["Montant total","Montant","Prix total","Total payé","Total","Amount","Payout"]);
    const montant = montantRaw ? parseFloat(montantRaw.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0 : 0;

    const uid = get("UID");
    const defaultName = canal === "booking" ? "Voyageur Booking" : "Voyageur Airbnb";
    // Booking.com uses SUMMARY:CLOSED — extract booking ID from UID (e.g. "BDC123456@booking.com")
    let voyageur = sum.replace(/^(Réservé|Reserved|Booking|CLOSED)\s*[-–]?\s*/i, "").replace(/\(.*\)/g, "").trim();
    if (!voyageur && canal === "booking" && uid) {
      voyageur = uid.split("@")[0].replace(/^booking[_-]?/i, "").trim();
    }
    voyageur = voyageur || defaultName;

    // Extract booking code from description or UID for Booking.com
    const reservation_code = descGet(["Code de la réservation","Code de reservation","Reservation Code","Confirmation Code","Booking Number","Numéro de réservation"])
      || (canal === "booking" && uid ? uid.split("@")[0] : "");

    return {
      id: uid || `${bienId}-${ci}-${canal}`,
      bienId, voyageur, canal,
      checkin: ci, checkout: co,
      checkin_time, checkout_time, nb_guests,
      reservation_code, phone,
      montant, notes: sum, menage: "",
      menage_done: false, checkin_done: false,
      fromIcal: true,
    };
  }).filter(Boolean);
}

// ── Planning — composant principal ──────────────────────────────────────────
const EMPTY_FORM = { bienId: "amaryllis", voyageur: "", canal: "booking", checkin: "", checkout: "", checkin_time: "", checkout_time: "", nb_guests: "", montant: "", notes: "", menage: "", reservation_code: "", phone: "", assigne: "" };

export default function Planning({ biens, mob, reservations, saveRes, icalUrls, saveUrls, icalUrlsBooking, saveUrlsBooking, scriptUrl, onApplyRevenusFromResas, pushReservationsToScript }) {
  const reservationsRef = useRef(reservations);
  useEffect(() => { reservationsRef.current = reservations; }, [reservations]);

  const [showUrls, setShowUrls] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [icalStatus, setIcalStatus] = useState({});
  const [lastIcalSync, setLastIcalSync] = useState(null);
  const [view, setView] = useState("todo");
  const [ganttBienFilter, setGanttBienFilter] = useState(null); // null = all
  const [searchQuery, setSearchQuery] = useState("");
  const [dailyPrices, setDailyPrices] = useState(loadDailyPrices);

  useEffect(() => {
    const handler = () => setDailyPrices(loadDailyPrices());
    window.addEventListener("amaryllis_prices_updated", handler);
    return () => window.removeEventListener("amaryllis_prices_updated", handler);
  }, []);

  // ── Toast system global ──────────────────────────────────────────────────
  // type: "info" | "success" | "error"  (défaut: "info")
  const [resaToasts, setResaToasts] = useState([]);
  const addToast = useCallback((msg, type = "info") => {
    const id = Date.now() + Math.random();
    setResaToasts(t => [...t, { id, msg, type }]);
    const delay = type === "error" ? 10000 : 6000;
    setTimeout(() => setResaToasts(t => t.filter(x => x.id !== id)), delay);
  }, []);

  const importIcal = useCallback(async (bienId, canal, url, currentResas) => {
    if (!url) return currentResas;
    const statusKey = `${bienId}_${canal}`;
    setIcalStatus(s => ({ ...s, [statusKey]: "loading" }));
    const tryFetch = async (fetchUrl) => {
      const r = await fetch(fetchUrl, { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    };
    try {
      let text = "";
      const proxies = [
        () => tryFetch(`/api/fetch-ical?url=${encodeURIComponent(url)}`),
        () => tryFetch(url),
        scriptUrl ? () => tryFetch(`${scriptUrl}?action=fetchIcal&url=${encodeURIComponent(url)}`) : null,
        () => tryFetch(`https://corsproxy.io/?${encodeURIComponent(url)}`),
        () => tryFetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`),
      ].filter(Boolean);
      for (const fn of proxies) {
        try { text = await fn(); if (text.includes("VCALENDAR")) break; } catch {}
      }
      if (!text.includes("VCALENDAR")) throw new Error("Format invalide");
      const newEvents = parseICS(text, bienId, canal);

      // ── Détection nouvelles réservations (comparaison UIDs) ──
      const prevIds = new Set(
        currentResas.filter(r => r.fromIcal && r.bienId === bienId && r.canal === canal).map(r => r.id)
      );
      const trueNew = newEvents.filter(e => !prevIds.has(e.id));
      if (trueNew.length > 0) {
        const bienNom = trueNew[0].bienId.charAt(0).toUpperCase() + trueNew[0].bienId.slice(1);
        addToast(`🔔 ${trueNew.length} nouvelle${trueNew.length > 1 ? "s" : ""} réservation${trueNew.length > 1 ? "s" : ""} — ${bienNom} (${canal})`);
      }

      const merged = [...currentResas.filter(r => !(r.bienId === bienId && r.fromIcal && r.canal === canal)), ...newEvents];
      saveRes(merged);
      setIcalStatus(s => ({ ...s, [statusKey]: `✓ ${newEvents.length}` }));
      setLastIcalSync(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
      return merged;
    } catch (e) {
      setIcalStatus(s => ({ ...s, [statusKey]: `⚠ ${e.message}` }));
      return currentResas;
    }
  }, [saveRes, scriptUrl, addToast]);

  // Refs qui suivent les valeurs courantes des URLs iCal — permet à l'effet avec
  // deps [] de toujours lire les URLs à jour, même si elles arrivent après le montage
  // (ex: chargées depuis /api/get-config quelques ms plus tard).
  const icalUrlsRef        = useRef(icalUrls);
  const icalUrlsBookingRef = useRef(icalUrlsBooking);
  const importIcalRef      = useRef(importIcal);
  useEffect(() => { icalUrlsRef.current = icalUrls; },               [icalUrls]);
  useEffect(() => { icalUrlsBookingRef.current = icalUrlsBooking; }, [icalUrlsBooking]);
  useEffect(() => { importIcalRef.current = importIcal; },           [importIcal]);

  // ── Auto-sync au chargement + toutes les heures ──────────────────────────
  useEffect(() => {
    const getSources = () => {
      const srcs = [];
      Object.keys(icalUrlsRef.current).forEach(k => { if (icalUrlsRef.current[k]?.length > 10) srcs.push({ bienId: k, canal: "airbnb", url: icalUrlsRef.current[k] }); });
      Object.keys(icalUrlsBookingRef.current).forEach(k => { if (icalUrlsBookingRef.current[k]?.length > 10) srcs.push({ bienId: k, canal: "booking", url: icalUrlsBookingRef.current[k] }); });
      return srcs;
    };
    const sources = getSources();
    if (sources.length === 0) return;

    // Verrou pour éviter les syncs concurrentes (ex: sync horaire qui démarre
    // pendant que la précédente tourne encore → race condition sur reservationsRef)
    let syncing = false;
    const doSync = async () => {
      if (syncing) return;
      syncing = true;
      try {
        // Relit les sources à chaque tick pour capturer les URLs chargées après le montage
        const currentSources = getSources();
        let current = reservationsRef.current;
        for (const s of currentSources) {
          current = await importIcalRef.current(s.bienId, s.canal, s.url, current) || current;
        }
        if (onApplyRevenusFromResas) onApplyRevenusFromResas(computeRevenusFromResas(current));
        pushReservationsToScript(current);
      } finally {
        syncing = false;
      }
    };

    doSync(); // sync immédiate au chargement
    const interval = setInterval(doSync, 60 * 60 * 1000); // puis toutes les heures
    return () => clearInterval(interval);
  }, []);

  // ── Auto-sync Beds24 (Nogent) dans le Planning ─────────────────────
  const [beds24SyncStatus, setBeds24SyncStatus] = useState("idle"); // idle | loading | ok | error

  const syncBeds24InPlanning = useCallback(async (currentResas) => {
    setBeds24SyncStatus("loading");
    try {
      const res = await fetch("/api/beds24-bookings", {
        headers: { Authorization: "Bearer " + (sessionStorage.getItem("ldb_tok") || "") },
      });
      if (!res.ok) { setBeds24SyncStatus("error"); return currentResas; }
      const data = await res.json();
      if (data.error || !data.bookings) { setBeds24SyncStatus("error"); return currentResas; }
      const beds24 = data.bookings
        .filter(b => b.statusLabel !== "Annulé")
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
      const merged = [...(currentResas || reservations).filter(r => !String(r.id).startsWith("beds24-")), ...beds24];
      saveRes(merged);
      setBeds24SyncStatus("ok");
      return merged;
    } catch (_) {
      setBeds24SyncStatus("error");
      return currentResas || reservations;
    }
  }, [saveRes, reservations]);

  useEffect(() => {
    syncBeds24InPlanning(reservationsRef.current);
    const interval = setInterval(() => syncBeds24InPlanning(reservationsRef.current), 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const openEdit = (r) => {
    setForm({ bienId: r.bienId, voyageur: r.voyageur, canal: r.canal, checkin: r.checkin, checkout: r.checkout, checkin_time: r.checkin_time || "", checkout_time: r.checkout_time || "", nb_guests: r.nb_guests || "", montant: r.montant || "", notes: r.notes || "", menage: r.menage || "", reservation_code: r.reservation_code || "", phone: r.phone || "", assigne: r.assigne || "" });
    setEditId(r.id);
    setShowForm(true);
  };

  const saveForm = () => {
    if (!form.checkin || !form.checkout || !form.voyageur) return;
    const data = { ...form, montant: parseFloat(form.montant) || 0 };
    if (editId !== null) {
      const updated = reservations.map(r => r.id === editId ? { ...r, ...data } : r);
      saveRes(updated);
      if (scriptUrl) {
        const p = new URLSearchParams({ action: "addReservation", id: String(editId), bienId: data.bienId, voyageur: data.voyageur, canal: data.canal, checkin: data.checkin, checkout: data.checkout, montant: String(data.montant), notes: data.notes || "" });
        fetch(`${scriptUrl}?${p}`, { redirect: "follow" }).catch(() => {});
      }
    } else {
      const newR = { id: Date.now(), ...data, menage_done: false, checkin_done: false };
      saveRes([...reservations, newR]);
      if (scriptUrl) {
        const p = new URLSearchParams({ action: "addReservation", id: String(newR.id), bienId: newR.bienId, voyageur: newR.voyageur, canal: newR.canal, checkin: newR.checkin, checkout: newR.checkout, montant: String(newR.montant), notes: newR.notes || "" });
        fetch(`${scriptUrl}?${p}`, { redirect: "follow" }).catch(() => {});
      }
    }
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
  };
  const delRes = (id) => {
    saveRes(reservations.filter(r => r.id !== id));
    if (scriptUrl) {
      fetch(`${scriptUrl}?action=deleteReservation&id=${id}`, { redirect: "follow" }).catch(() => {});
    }
  };
  const togRes = (id, field) => saveRes(reservations.map(r => r.id === id ? { ...r, [field]: !r[field] } : r));

  const syncAll = () => {
    const sources = [];
    Object.keys(icalUrls).forEach(k => { if (icalUrls[k]) sources.push({ bienId: k, canal: "airbnb", url: icalUrls[k] }); });
    Object.keys(icalUrlsBooking).forEach(k => { if (icalUrlsBooking[k]) sources.push({ bienId: k, canal: "booking", url: icalUrlsBooking[k] }); });
    let current = reservations;
    (async () => {
      for (const s of sources) {
        current = await importIcal(s.bienId, s.canal, s.url, current) || current;
      }
      if (onApplyRevenusFromResas) onApplyRevenusFromResas(computeRevenusFromResas(current));
      pushReservationsToScript(current);
    })();
  };

  const td = todayStr();
  const tm = addDays(td, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthStart = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-01`;
  const monthEnd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  // Filtre global par bien (partagé entre toutes les vues)
  const filteredReservations = ganttBienFilter ? reservations.filter(r => r.bienId === ganttBienFilter) : reservations;
  const rMonth = filteredReservations.filter(r => r.checkin <= monthEnd && r.checkout >= monthStart);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const isToday = (d) => `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` === td;
  const getCell = (bienId, day) => {
    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const r = rMonth.find(r => r.bienId === bienId && r.checkin <= ds && r.checkout > ds);
    if (!r) return null;
    return { r, isCI: r.checkin === ds, color: CC[r.canal] || "#64748b", bg: CB[r.canal] || "rgba(100,116,139,0.15)" };
  };

  const todos = [];
  filteredReservations.forEach(r => {
    const b = biens.find(x => x.id === r.bienId);
    if (!b) return;
    const ciSub = [r.voyageur, r.checkin_time ? `🕐 ${r.checkin_time}` : "", r.nb_guests ? `👥 ${r.nb_guests}` : ""].filter(Boolean).join(" · ");
    const coSub = [r.voyageur, r.checkout_time ? `🕐 ${r.checkout_time}` : ""].filter(Boolean).join(" · ");
    if (r.checkin === td) todos.push({ id: `ci-${r.id}`, icon: "🔑", label: `Check-in — ${b.nom}`, sub: ciSub, c: "#10b981", done: r.checkin_done, onT: () => togRes(r.id, "checkin_done"), urgent: true });
    if (r.checkout === td) todos.push({ id: `co-${r.id}`, icon: "🚪", label: `Check-out — ${b.nom}`, sub: coSub, c: "#ef4444", done: false, urgent: true });
    // Ménage : apparaît dès le checkout jusqu'au prochain check-in (ou pendant 7j max)
    const menageWindow = r.checkout <= td && r.checkout >= addDays(td, -7);
    const preCheckin = r.checkin === tm || r.checkin === td;
    if (!r.menage_done && (menageWindow || preCheckin)) {
      const daysBeforeCI = diffDays(td, r.checkin);
      const menUrgent = daysBeforeCI <= 1;
      todos.push({ id: `mn-${r.id}`, icon: "🧹", label: `Ménage — ${b.nom}`, sub: r.assigne ? `👤 ${r.assigne}` : (r.menage || "Prestataire à contacter"), c: "#a855f7", done: r.menage_done, onT: () => togRes(r.id, "menage_done"), urgent: menUrgent });
    }
    if (r.checkin === tm) todos.push({ id: `ci2-${r.id}`, icon: "⏰", label: `Arrivée demain — ${b.nom}`, sub: [r.voyageur, r.checkin_time ? `🕐 ${r.checkin_time}` : "", r.nb_guests ? `👥 ${r.nb_guests}` : ""].filter(Boolean).join(" · "), c: "#f59e0b", done: false, urgent: false });
  });

  return (
    <div>
      {/* ── Toast stack global (bas à droite) ── */}
      {resaToasts.length > 0 && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column-reverse", gap: 8, maxWidth: 360 }}>
          {resaToasts.map(t => {
            const colors = {
              success: { border: "#22c55e", icon: "✓", accent: "#22c55e" },
              error:   { border: "#ef4444", icon: "✕", accent: "#f87171" },
              info:    { border: "#0ea5e9", icon: "🔔", accent: "#38bdf8" },
            }[t.type] || { border: "#0ea5e9", icon: "🔔", accent: "#38bdf8" };
            return (
              <div key={t.id} style={{
                background: "#0f172a", border: `1px solid ${colors.border}44`,
                borderLeft: `3px solid ${colors.border}`,
                borderRadius: 10, padding: "11px 14px",
                color: "#e2e8f0", fontSize: 12.5, fontWeight: 500,
                boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                animation: "fadeIn 0.25s ease",
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <span style={{ fontSize: 14, color: colors.accent, flexShrink: 0, marginTop: 1 }}>{colors.icon}</span>
                <span style={{ flex: 1, lineHeight: 1.5 }}>{t.msg}</span>
                <button onClick={() => setResaToasts(x => x.filter(r => r.id !== t.id))}
                  style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        {[{ id: "todo", l: "✅ To-do" }, { id: "gantt", l: "📅 Calendrier" }, { id: "trous", l: "🕳 Trous" }, { id: "list", l: "📋 Réservations" }, { id: "beds24", l: "🏙️ Beds24 Nogent" }, { id: "minnights", l: "🗓 Nuits min." }].map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            style={{
              padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: view === v.id ? "#0ea5e9" : "rgba(255,255,255,0.06)",
              color: view === v.id ? "#fff" : "#94a3b8",
            }}
          >{v.l}</button>
        ))}
        <button
          onClick={() => setShowForm(true)}
          style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: 20, border: "1px dashed #334155", background: "none", color: "#0ea5e9", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
        >+ Ajouter</button>
      </div>

      {/* Filtre par bien — global à toutes les vues */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#475569", marginRight: 2 }}>Bien :</span>
        <button onClick={() => setGanttBienFilter(null)} style={{ padding: "3px 10px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 10, fontWeight: ganttBienFilter === null ? 700 : 400, background: ganttBienFilter === null ? "#6366f1" : "rgba(255,255,255,0.06)", color: ganttBienFilter === null ? "#fff" : "#64748b" }}>Tous</button>
        {biens.map(b => (
          <button key={b.id} onClick={() => setGanttBienFilter(ganttBienFilter === b.id ? null : b.id)} style={{ padding: "3px 10px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 10, fontWeight: ganttBienFilter === b.id ? 700 : 400, background: ganttBienFilter === b.id ? "#6366f1" : "rgba(255,255,255,0.06)", color: ganttBienFilter === b.id ? "#fff" : "#64748b" }}>{b.emoji} {b.nom.replace("Villa ", "").replace("T2 ", "")}</button>
        ))}
      </div>

      {view === "todo" && (
        <div>
          <div style={{ background: "rgba(255,90,95,0.07)", border: "1px solid rgba(255,90,95,0.2)", borderRadius: 11, padding: "11px 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
                iCal sync
                {Object.values(icalStatus).some(v => v === "loading") && <span style={{ fontSize: 10, color: "#0ea5e9", marginLeft: 6 }}>⟳ Synchro…</span>}
                {!Object.values(icalStatus).some(v => v === "loading") && Object.keys(icalStatus).length > 0 && <span style={{ fontSize: 10, color: "#10b981", marginLeft: 6 }}>✓ Synchronisé</span>}
                {lastIcalSync && <span style={{ fontSize: 9, color: "#475569", marginLeft: 4 }}>sync {lastIcalSync}</span>}
              </span>
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                <span style={{ fontSize: 10, color: beds24SyncStatus === "loading" ? "#0ea5e9" : beds24SyncStatus === "ok" ? "#10b981" : beds24SyncStatus === "error" ? "#ef4444" : "#64748b" }}>
                  {beds24SyncStatus === "loading" ? "⟳ Beds24…" : beds24SyncStatus === "ok" ? "🏙️ Nogent ✓" : beds24SyncStatus === "error" ? "⚠ Beds24" : "🏙️ Nogent"}
                </span>
                <button onClick={() => syncBeds24InPlanning(reservations)} style={{ padding: "5px 9px", borderRadius: 6, border: "1px solid #334155", background: "none", color: "#a78bfa", cursor: "pointer", fontSize: 10 }}>
                  ⟳
                </button>
                <button onClick={() => setShowUrls(!showUrls)} style={{ padding: "5px 9px", borderRadius: 6, border: "1px solid #334155", background: "none", color: "#64748b", cursor: "pointer", fontSize: 10 }}>
                  {showUrls ? "▲" : "▼"} URLs
                </button>
                <button onClick={syncAll} style={{ padding: "5px 11px", borderRadius: 6, border: "none", background: "#FF5A5F", color: "#fff", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                  ⟳ Sync
                </button>
              </div>
            </div>
            {showUrls && (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 10, color: "#FF5A5F", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Airbnb</div>
                {biens.filter(b => b.type !== "long").map(b => {
                  const sk = `${b.id}_airbnb`;
                  return (
                    <div key={b.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 5, alignItems: "center" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{b.emoji} {b.nom.replace("Villa ", "").replace("T2 ", "")}</div>
                      <input
                        value={icalUrls[b.id] || ""}
                        onChange={(e) => saveUrls({ ...icalUrls, [b.id]: e.target.value })}
                        placeholder="URL iCal Airbnb…"
                        style={{ padding: "5px 7px", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0", fontSize: 10, width: "100%", boxSizing: "border-box" }}
                      />
                      <div style={{ fontSize: 10, color: icalStatus[sk]?.startsWith("✓") ? "#10b981" : "#f59e0b", whiteSpace: "nowrap" }}>
                        {icalStatus[sk] || ""}
                      </div>
                    </div>
                  );
                })}
                <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>Booking.com</div>
                {biens.filter(b => b.type !== "long").map(b => {
                  const sk = `${b.id}_booking`;
                  return (
                    <div key={b.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 5, alignItems: "center" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{b.emoji} {b.nom.replace("Villa ", "").replace("T2 ", "")}</div>
                      <input
                        value={icalUrlsBooking[b.id] || ""}
                        onChange={(e) => saveUrlsBooking({ ...icalUrlsBooking, [b.id]: e.target.value })}
                        placeholder="URL iCal Booking.com…"
                        style={{ padding: "5px 7px", background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 6, color: "#e2e8f0", fontSize: 10, width: "100%", boxSizing: "border-box" }}
                      />
                      <div style={{ fontSize: 10, color: icalStatus[sk]?.startsWith("✓") ? "#10b981" : "#f59e0b", whiteSpace: "nowrap" }}>
                        {icalStatus[sk] || ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 10 }}>
            Aujourd'hui & demain — {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </div>

          {todos.length === 0 ? (
            <div style={{ padding: 18, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 11, textAlign: "center", fontSize: 13, color: "#10b981" }}>
              ✓ Aucune action urgente
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {todos.map(a => (
                <div key={a.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                  background: a.done ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${a.c}${a.done ? "22" : "44"}`,
                  borderLeft: `3px solid ${a.done ? a.c + "55" : a.c}`,
                  borderRadius: 9, opacity: a.done ? 0.5 : 1
                }}>
                  <span style={{ fontSize: 16 }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: a.done ? "#475569" : "#e2e8f0", fontSize: 12, textDecoration: a.done ? "line-through" : "none" }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{a.sub}</div>
                  </div>
                  {a.urgent && <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: "rgba(239,68,68,0.15)", color: "#ef4444", fontWeight: 600 }}>URGENT</span>}
                  {a.onT && (
                    <button onClick={a.onT} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: a.done ? "rgba(255,255,255,0.05)" : "rgba(16,185,129,0.15)", color: a.done ? "#475569" : "#10b981", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                      {a.done ? "Annuler" : "✓ Fait"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {filteredReservations.filter(r => r.checkin > td && r.checkin <= addDays(td, 7)).length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", margin: "16px 0 8px" }}>7 prochains jours</div>
              {filteredReservations
                .filter(r => r.checkin > td && r.checkin <= addDays(td, 7))
                .sort((a, b) => a.checkin.localeCompare(b.checkin))
                .map(r => {
                  const b = biens.find(x => x.id === r.bienId);
                  return (
                    <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 13px", background: "rgba(255,255,255,0.02)", borderRadius: 9, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 5 }}>
                      <span style={{ fontSize: 14 }}>{b?.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>{b?.nom} — {r.voyageur}</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>{r.checkin} → {r.checkout} · {diffDays(r.checkin, r.checkout)}j</div>
                      </div>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, background: CB[r.canal], color: CC[r.canal], fontWeight: 600 }}>{r.canal}</span>
                    </div>
                  );
                })}
            </>
          )}
        </div>
      )}

      {view === "gantt" && (
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 14, overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{MOIS_FULL[viewMonth]} {viewYear}</span>
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }} style={{ padding: "3px 9px", borderRadius: 6, border: "1px solid #334155", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>‹</button>
              <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }} style={{ padding: "3px 9px", borderRadius: 6, border: "1px solid #334155", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12 }}>›</button>
            </div>
          </div>
          <div style={{ minWidth: 480 }}>
            <div style={{ display: "grid", gridTemplateColumns: `72px repeat(${daysInMonth},1fr)`, gap: 1, marginBottom: 2 }}>
              <div />
              {days.map(d => (
                <div key={d} style={{ fontSize: 9, color: isToday(d) ? "#0ea5e9" : "#475569", textAlign: "center", fontWeight: isToday(d) ? 700 : 400 }}>{d}</div>
              ))}
            </div>
            {(ganttBienFilter ? biens.filter(b => b.id === ganttBienFilter) : biens).map(b => {
              const baseP = DEFAULT_PRIX[b.id] || 0;
              return (
              <div key={b.id}>
                <div style={{ display: "grid", gridTemplateColumns: `72px repeat(${daysInMonth},1fr)`, gap: 1, marginBottom: 1 }}>
                  <div style={{ fontSize: 9, color: "#94a3b8", display: "flex", alignItems: "center", gap: 2, paddingRight: 3 }}>
                    <span>{b.emoji}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.nom.replace("Villa ", "").replace("T2 ", "")}</span>
                  </div>
                  {days.map(d => {
                    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    const menR = reservations.find(r => r.bienId === b.id && r.checkout === ds && !r.menage_done);
                    const c = getCell(b.id, d);
                    if (menR && !c) {
                      return <div key={d} onClick={() => togRes(menR.id, "menage_done")} title="🧹 Ménage" style={{ height: 20, background: "rgba(168,85,247,0.2)", borderRadius: 1, cursor: "pointer", border: "1px dashed #a855f733" }} />;
                    }
                    if (!c) {
                      return <div key={d} style={{ height: 20, background: isToday(d) ? "rgba(14,165,233,0.05)" : "rgba(255,255,255,0.02)", borderRadius: 1 }} />;
                    }
                    return (
                      <div
                        key={d}
                        title={`${c.r.voyageur} · ${c.r.checkin}→${c.r.checkout}`}
                        style={{ height: 20, background: c.bg, borderRadius: c.isCI ? 2 : 0, borderLeft: c.isCI ? `2px solid ${c.color}` : "none", borderTop: `1px solid ${c.color}33`, borderBottom: `1px solid ${c.color}33`, overflow: "hidden", position: "relative" }}
                      >
                        {c.isCI && <span style={{ position: "absolute", left: 2, top: 1, fontSize: 7, color: c.color, fontWeight: 700, whiteSpace: "nowrap" }}>{c.r.voyageur.split(" ")[0]}</span>}
                      </div>
                    );
                  })}
                </div>
                {/* Price row */}
                <div style={{ display: "grid", gridTemplateColumns: `72px repeat(${daysInMonth},1fr)`, gap: 1, marginBottom: 3 }}>
                  <div style={{ fontSize: 7, color: "#1e3a4a", display: "flex", alignItems: "center", paddingLeft: 2 }}>€</div>
                  {days.map(d => {
                    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                    const p = dailyPrices[b.id]?.[ds] ?? null;
                    return (
                      <div key={d} style={{ height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 6, color: p !== null ? (p > baseP * 1.1 ? "#f59e0b" : p < baseP * 0.9 ? "#10b981" : "#0ea5e9") : "#1e3a4a", fontWeight: p !== null ? 700 : 400 }}>
                          {p !== null ? p : baseP}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            {Object.entries(CC).map(([k, c]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: c }} />
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "trous" && (() => {
        const td = todayStr();
        const horizon = 60; // jours à scanner
        const trousByBien = biens.filter(b => b.type !== "long").map(b => {
          const bResas = reservations.filter(r => r.bienId === b.id).sort((a, b) => a.checkin.localeCompare(b.checkin));
          const trous = [];
          let cursor = td;
          const endHorizon = addDays(td, horizon);
          for (const r of bResas) {
            if (r.checkout <= td) continue;
            if (r.checkin > endHorizon) break;
            if (r.checkin > cursor) {
              const days = diffDays(cursor, r.checkin);
              if (days >= 3) {
                trous.push({ start: cursor, end: r.checkin, days });
              }
            }
            if (r.checkout > cursor) cursor = r.checkout;
          }
          if (cursor < endHorizon) {
            const days = diffDays(cursor, endHorizon);
            if (days >= 3) trous.push({ start: cursor, end: endHorizon, days, open: true });
          }
          return { bien: b, trous };
        });
        const totalDaysVides = trousByBien.reduce((s, x) => s + x.trous.reduce((ss, t) => ss + t.days, 0), 0);
        const totalTrous = trousByBien.reduce((s, x) => s + x.trous.length, 0);
        const adrMoyen = biens.filter(b => b.type !== "long").reduce((s, b) => s + avgN(b.adr), 0) / Math.max(biens.filter(b => b.type !== "long").length, 1);
        const revenuPotentielPerdu = Math.round(totalDaysVides * adrMoyen * 0.5);

        const urgenceLabel = (start) => {
          const d = diffDays(td, start);
          if (d <= 7) return { l: "🔴 Imminent", c: "#ef4444", bg: "rgba(239,68,68,0.08)" };
          if (d <= 21) return { l: "🟠 Bientôt", c: "#f59e0b", bg: "rgba(245,158,11,0.07)" };
          return { l: "🔵 Lointain", c: "#0ea5e9", bg: "rgba(14,165,233,0.06)" };
        };

        return (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 140, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 11, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Jours libres / 60</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#ef4444", fontFamily: "var(--font-mono)" }}>{totalDaysVides}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Sur les 60 prochains jours</div>
              </div>
              <div style={{ flex: 1, minWidth: 140, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 11, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Trous détectés</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#f59e0b", fontFamily: "var(--font-mono)" }}>{totalTrous}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Périodes vides &gt; 3 jours</div>
              </div>
              <div style={{ flex: 1, minWidth: 140, background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.25)", borderRadius: 11, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Revenu potentiel</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#0ea5e9", fontFamily: "var(--font-mono)" }}>{fmtK(revenuPotentielPerdu)}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Si 50% remplis à l'ADR moyen</div>
              </div>
            </div>

            {totalTrous === 0 ? (
              <div style={{ padding: 24, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, textAlign: "center", fontSize: 14, color: "#10b981" }}>
                ✓ Aucun trou de plus de 3 jours détecté sur les {horizon} prochains jours
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {trousByBien.filter(x => x.trous.length > 0).map(({ bien, trous }) => (
                  <div key={bien.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 11, padding: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 17 }}>{bien.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{bien.nom}</span>
                      <span style={{ fontSize: 10, color: "#64748b", marginLeft: "auto" }}>{trous.length} trou{trous.length > 1 ? "s" : ""} · {trous.reduce((s, t) => s + t.days, 0)} jours</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {trous.map((t, i) => {
                        const u = urgenceLabel(t.start);
                        const revPot = Math.round(t.days * avgN(bien.adr) * 0.5);
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: u.bg, border: `1px solid ${u.c}33`, borderLeft: `3px solid ${u.c}`, borderRadius: 8 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>
                                {t.start} → {t.end} {t.open && <span style={{ color: "#64748b", fontSize: 10 }}>(reste de la fenêtre)</span>}
                              </div>
                              <div style={{ fontSize: 10, color: "#64748b" }}>
                                {t.days} jours vides · Revenu potentiel ~{fmtK(revPot)}
                              </div>
                            </div>
                            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 8, background: u.c + "22", color: u.c, fontWeight: 600 }}>{u.l}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(14,165,233,0.05)", border: "1px solid rgba(14,165,233,0.15)", borderRadius: 9, fontSize: 11, color: "#cbd5e1" }}>
              💡 <strong>Pistes :</strong> baisser le prix de la période, créer une offre "last minute", proposer un séjour à la nuit, contacter d'anciens voyageurs avec promo
            </div>
          </div>
        );
      })()}

      {view === "list" && (
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, overflow: "hidden" }}>
          <div style={{ padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>
              Réservations ({filteredReservations.length}{ganttBienFilter ? ` · ${biens.find(b=>b.id===ganttBienFilter)?.nom || ganttBienFilter}` : ""})
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="text"
                placeholder="🔍 Voyageur, bien, canal…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "#0f172a", color: "#e2e8f0", fontSize: 11, width: 180, outline: "none" }}
              />
              {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}>✕</button>}
              <span style={{ fontSize: 10, color: "#10b981" }}>
                {filteredReservations.filter(r => r.fromIcal).length} Airbnb · {filteredReservations.filter(r => !r.fromIcal).length} manuelles
              </span>
            </div>
          </div>
          {(() => {
            const q = searchQuery.toLowerCase().trim();
            const listResas = q
              ? filteredReservations.filter(r => {
                  const bien = biens.find(x => x.id === r.bienId);
                  return (r.voyageur || "").toLowerCase().includes(q)
                    || (r.canal || "").toLowerCase().includes(q)
                    || (bien?.nom || "").toLowerCase().includes(q)
                    || (r.checkin || "").includes(q)
                    || (r.checkout || "").includes(q)
                    || (r.notes || "").toLowerCase().includes(q)
                    || (r.reservation_code || "").toLowerCase().includes(q);
                })
              : filteredReservations;
            if (listResas.length === 0) return (
              <div style={{ padding: 20, textAlign: "center", color: "#475569", fontSize: 12 }}>
                {q ? `Aucun résultat pour "${q}"` : `Aucune réservation${ganttBienFilter ? " pour ce bien" : ""}`}
              </div>
            );
            return (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 660 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["Bien", "Voyageur", "Canal", "Arrivée", "Heure CI", "Départ", "Heure CO", "👥", "Nuits", "✅", "🧹", ""].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...listResas].sort((a, b) => a.checkin.localeCompare(b.checkin)).map(r => {
                    const b = biens.find(x => x.id === r.bienId);
                    const isPast = r.checkout < td;
                    const isCurr = r.checkin <= td && r.checkout > td;
                    return (
                      <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", opacity: isPast ? 0.4 : 1, background: isCurr ? "rgba(16,185,129,0.05)" : "transparent" }}>
                        <td style={{ padding: "8px 10px", fontSize: 11 }}>{b?.emoji} {b?.nom}</td>
                        <td style={{ padding: "8px 10px", color: "#e2e8f0", fontSize: 11, fontWeight: 500 }}>
                          {r.voyageur}
                          {r.fromIcal && <span style={{ fontSize: 8, color: "#FF5A5F", marginLeft: 3, padding: "1px 4px", borderRadius: 4, background: "rgba(255,90,95,0.1)" }}>Airbnb</span>}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: CB[r.canal], color: CC[r.canal], fontWeight: 600 }}>{r.canal}</span>
                        </td>
                        <td style={{ padding: "8px 10px", color: "#94a3b8", fontSize: 10, fontFamily: "var(--font-mono)" }}>{r.checkin}</td>
                        <td style={{ padding: "8px 10px", color: "#0ea5e9", fontSize: 10, fontFamily: "var(--font-mono)" }}>{r.checkin_time || "—"}</td>
                        <td style={{ padding: "8px 10px", color: "#94a3b8", fontSize: 10, fontFamily: "var(--font-mono)" }}>{r.checkout}</td>
                        <td style={{ padding: "8px 10px", color: "#f59e0b", fontSize: 10, fontFamily: "var(--font-mono)" }}>{r.checkout_time || "—"}</td>
                        <td style={{ padding: "8px 10px", color: "#64748b", fontSize: 10, textAlign: "center" }}>{r.nb_guests || "—"}</td>
                        <td style={{ padding: "8px 10px", color: "#64748b", fontSize: 11 }}>{diffDays(r.checkin, r.checkout)}j</td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <button onClick={() => togRes(r.id, "checkin_done")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: r.checkin_done ? 1 : 0.2 }}>✅</button>
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "center" }}>
                          <button onClick={() => togRes(r.id, "menage_done")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: r.menage_done ? 1 : 0.2 }}>🧹</button>
                        </td>
                        <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                          <button onClick={() => openEdit(r)} style={{ background: "none", border: "none", cursor: "pointer", color: "#0ea5e9", fontSize: 11, marginRight: 4 }}>✎</button>
                          <button onClick={() => delRes(r.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: 11 }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            );
          })()}
        </div>
      )}

      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}>
          <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 22, width: "100%", maxWidth: 340, maxHeight: "calc(90vh - env(safe-area-inset-bottom))", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 14 }}>{editId !== null ? "✎ Modifier réservation" : "Nouvelle réservation"}</div>
            {[
              { l: "Bien", k: "bienId", t: "select", opts: biens.map(b => ({ v: b.id, l: `${b.emoji} ${b.nom}` })) },
              { l: "Voyageur", k: "voyageur", t: "text", ph: "Nom" },
              { l: "Nbre voyageurs", k: "nb_guests", t: "number", ph: "2" },
              { l: "Canal", k: "canal", t: "select", opts: [{ v: "airbnb", l: "Airbnb" }, { v: "booking", l: "Booking" }, { v: "direct", l: "Direct" }, { v: "autre", l: "Autre" }] },
              { l: "Check-in", k: "checkin", t: "date" },
              { l: "Heure arrivée", k: "checkin_time", t: "time" },
              { l: "Check-out", k: "checkout", t: "date" },
              { l: "Heure départ", k: "checkout_time", t: "time" },
              { l: "Montant €", k: "montant", t: "number", ph: "0" },
              { l: "Ménage — prestataire", k: "menage", t: "text", ph: "Nom / contact" },
              { l: "Assigné à", k: "assigne", t: "text", ph: "Assigné à (ménage/conciergerie)…" },
              { l: "Code réservation", k: "reservation_code", t: "text", ph: "HM…" },
              { l: "Téléphone", k: "phone", t: "text", ph: "+596…" },
              { l: "Notes", k: "notes", t: "text", ph: "" },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: 9 }}>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2, textTransform: "uppercase" }}>{f.l}</div>
                {f.t === "select" ? (
                  <select value={form[f.k]} onChange={(e) => setForm(x => ({ ...x, [f.k]: e.target.value }))} style={{ width: "100%", padding: "7px 9px", background: "#0f172a", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 12 }}>
                    {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ) : (
                  <input type={f.t} placeholder={f.ph || ""} value={form[f.k]} onChange={(e) => setForm(x => ({ ...x, [f.k]: e.target.value }))} style={{ width: "100%", padding: "7px 9px", background: "#0f172a", border: "1px solid #334155", borderRadius: 7, color: "#e2e8f0", fontSize: 12, boxSizing: "border-box" }} />
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
              <button onClick={saveForm} style={{ flex: 1, padding: "9px", borderRadius: 8, border: "none", background: "#0ea5e9", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{editId !== null ? "Enregistrer" : "Ajouter"}</button>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #334155", background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {view === "beds24" && (
        <Beds24Admin scriptUrl={scriptUrl} reservations={reservations} saveRes={saveRes} addToast={addToast} />
      )}
      {view === "minnights" && <MinNightsConfig />}
    </div>
  );
}
