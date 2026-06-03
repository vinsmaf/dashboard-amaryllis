// src/utils/occupancy.js — occupation forward par bien (pur, testable).
// events: [{ bienId, checkin, checkout }] dates "YYYY-MM-DD" (checkout exclusif).
// ⚠️ Mirroré inline dans workers/ical-sync/index.js (runOccupancySnapshot) — garder synchro.

export function diffDays(a, b) { // nuits entre 2 dates "YYYY-MM-DD"
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}
export function addDays(d, n) {
  const t = new Date(d + "T00:00:00Z"); t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

// Nuits réservées d'un bien dans la fenêtre [fromStr, toStr) (chevauchements clampés).
export function nightsBookedInWindow(events, bienId, fromStr, toStr) {
  let n = 0;
  for (const e of (events || [])) {
    if (e.bienId !== bienId) continue;
    if (!e.checkin || !e.checkout) continue;
    const start = e.checkin > fromStr ? e.checkin : fromStr;
    const end   = e.checkout < toStr ? e.checkout : toStr;
    if (end > start) n += diffDays(start, end);
  }
  return n;
}

// Occupation forward sur `horizonDays` nuits à partir de todayStr.
export function occupancyForWindow(events, bienId, todayStr, horizonDays) {
  const toStr = addDays(todayStr, horizonDays);
  const nightsSold = nightsBookedInWindow(events, bienId, todayStr, toStr);
  const nightsAvailable = horizonDays;
  const rate = nightsAvailable > 0 ? Math.min(1, nightsSold / nightsAvailable) : 0;
  return { nightsSold, nightsAvailable, rate };
}
