// src/utils/coherenceRules.js
// Moteur de cohérence des réservations — PUR, source-agnostique, testable.
// reservation : { id, bien, voyageur, total, depot, checkin, checkout }  (dates "YYYY-MM-DD")
const MAX_TOTAL = 50000; // borne saine € (au-delà = aberrant)

function norm(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}
function matchBien(bien, validBiens) {
  const b = norm(bien);
  return validBiens.some((t) => b.includes(t));
}
function validDates(r) {
  return /^\d{4}-\d{2}-\d{2}$/.test(r.checkin || "") &&
         /^\d{4}-\d{2}-\d{2}$/.test(r.checkout || "") &&
         r.checkin < r.checkout;
}
function overlaps(a, b) { // intervalle demi-ouvert [checkin, checkout)
  return a.checkin < b.checkout && b.checkin < a.checkout;
}

export function checkReservations(reservations, { validBiens = [] } = {}) {
  const findings = [];
  const list = Array.isArray(reservations) ? reservations : [];

  for (const r of list) {
    const who = r.voyageur || r.id || "?";
    if (!validDates(r)) {
      findings.push({ rule: "dates_invalides", severity: "haute", bien: r.bien || "—",
        message: `Dates invalides (${r.checkin || "?"} → ${r.checkout || "?"}) — ${who}`, key: `dates:${r.id}` });
    }
    const total = Number(r.total), depot = Number(r.depot);
    if (!(total > 0) || depot < 0 || total > MAX_TOTAL) {
      findings.push({ rule: "total_aberrant", severity: "haute", bien: r.bien || "—",
        message: `Montant aberrant : total=${r.total}€ dépôt=${r.depot}€ — ${who}`, key: `total:${r.id}` });
    }
    if (validBiens.length && !matchBien(r.bien, validBiens)) {
      findings.push({ rule: "bien_inconnu", severity: "moyenne", bien: r.bien || "—",
        message: `Bien non reconnu : "${r.bien}" — ${who}`, key: `bien:${r.id}` });
    }
  }

  const dated = list.filter(validDates);
  for (let i = 0; i < dated.length; i++) {
    for (let j = i + 1; j < dated.length; j++) {
      const a = dated[i], b = dated[j];
      if (norm(a.bien) === norm(b.bien) && norm(a.bien) !== "" && overlaps(a, b)) {
        findings.push({ rule: "double_booking", severity: "critique", bien: a.bien || "—",
          message: `Double réservation ${a.bien} : ${a.checkin}→${a.checkout} (${a.voyageur || a.id}) chevauche ${b.checkin}→${b.checkout} (${b.voyageur || b.id})`,
          key: `overlap:${[a.id, b.id].sort().join("~")}` });
      }
    }
  }
  return findings;
}
export const COHERENCE_MAX_TOTAL = MAX_TOTAL;
