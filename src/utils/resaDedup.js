// src/utils/resaDedup.js
// Clé de dédoublonnage stable d'une réservation, par CONTENU (indépendante de l'id).
// Une nuitée ne peut pas être légitimement double-bookée → même clé = même séjour.
// ⚠️ Cette logique est MIRROIRÉE à l'identique dans appscript/SCRIPT_SHEETS.js et
//    appscript/REVENUS_AUTO_2026.gs (GAS ne peut pas importer Node) — garder synchronisé.

// Normalise une date en "YYYY-MM-DD" (accepte string ISO, "YYYY-MM-DD...", ou Date).
export function normDate(v) {
  if (v == null) return "";
  if (v instanceof Date && !isNaN(v)) {
    return v.getUTCFullYear() + "-" +
      String(v.getUTCMonth() + 1).padStart(2, "0") + "-" +
      String(v.getUTCDate()).padStart(2, "0");
  }
  return String(v).slice(0, 10);
}

export function dedupKey({ bienId, checkin, checkout }) {
  return String(bienId || "").toLowerCase().trim() + "|" + normDate(checkin) + "|" + normDate(checkout);
}

// Garde une seule réservation par clé-contenu (la dernière l'emporte). Préserve l'ordre.
export function dedupeReservations(list) {
  const seen = new Map();
  for (const r of (Array.isArray(list) ? list : [])) {
    seen.set(dedupKey(r), r);
  }
  return [...seen.values()];
}
