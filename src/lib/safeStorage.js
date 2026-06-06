// safeStorage — accès sessionStorage/localStorage tolérant aux pannes.
// `sessionStorage`/`localStorage` lèvent un SecurityError quand le stockage est
// bloqué (navigation privée stricte, cookies tiers refusés, iframe sandbox).
// Un accès non gardé en plein render React fait alors planter la page entière
// (vu sur /merci, page de confirmation post-paiement). On dégrade en silence.

export function ssGet(key, fallback = null) {
  try { const v = sessionStorage.getItem(key); return v === null ? fallback : v; }
  catch { return fallback; }
}

export function ssSet(key, value) {
  try { sessionStorage.setItem(key, value); return true; }
  catch { return false; }
}

export function ssRemove(key) {
  try { sessionStorage.removeItem(key); } catch { /* ignore */ }
}
