// I-10 — Contexte de séjour côté serveur : « qui me parle, où loge-t-il, et depuis quand ? »
//
// Partagé entre concierge.js et whatsapp.js (2 consommateurs → module justifié).
//
// Distinct de tv-context.js, qui est délibérément minimal (prénom + dates, garde Referer,
// destiné à un écran TV public). Ici on a besoin du contexte COMPLET côté serveur :
// bien, email, montant, canal — pour décider d'une action. C'est un module interne,
// jamais exposé publiquement.

import { findStayForPhone, todayForBien } from "../../src/utils/guestResolve.js";

/**
 * Résout le séjour d'un voyageur à partir de son téléphone (WhatsApp) ou de son email.
 * Retourne { booking, match, guest } — booking=null si non identifié (le concierge
 * doit alors rester prudent et escalader plutôt que de deviner).
 *
 * ⚠️ On ne lit QUE direct_bookings : les résas OTA n'exposent ni téléphone ni email réels
 * (Airbnb/Booking donnent des alias). Un voyageur OTA ne sera donc pas identifié — c'est
 * un angle mort assumé, pas un bug.
 */
export async function resolveGuestContext(db, { phone, email } = {}) {
  if (!db || (!phone && !email)) return { booking: null, match: null, guest: null };

  try {
    // Fenêtre volontairement large (séjours récents + à venir) : on veut aussi reconnaître
    // un voyageur qui écrit avant son arrivée ou juste après son départ.
    const { results } = await db.prepare(`
      SELECT payment_intent_id, bien_id, bien_nom, voyageur, prenom, email, phone,
             checkin, checkout, total, canal, nb_guests, status
      FROM direct_bookings
      WHERE (status IS NULL OR status != 'cancelled')
        AND checkout >= date('now', '-30 days')
        AND checkin  <= date('now', '+120 days')
      ORDER BY checkin DESC
      LIMIT 300
    `).all();

    const bookings = results || [];
    if (!bookings.length) return { booking: null, match: null, guest: null };

    if (phone) {
      // Le fuseau dépend du bien, mais on ne le connaît qu'APRÈS avoir trouvé la résa.
      // Martinique (UTC-4) est le cas majoritaire (6 biens sur 7) et l'écart avec Paris
      // ne change la date qu'en bordure de minuit — acceptable pour choisir « le séjour du jour ».
      const today = todayForBien(null);
      const r = findStayForPhone(bookings, phone, today);
      if (r.booking) return { ...r, guest: guestOf(r.booking) };
    }

    if (email) {
      const target = String(email).toLowerCase().trim();
      const mine = bookings.filter((b) => (b.email || "").toLowerCase().trim() === target);
      if (mine.length) {
        const today = todayForBien(mine[0].bien_id);
        const current = mine.find((b) => b.checkin <= today && b.checkout >= today);
        const booking = current || mine[0];
        return { booking, match: current ? "current" : "upcoming", guest: guestOf(booking) };
      }
    }

    return { booking: null, match: null, guest: null };
  } catch {
    // Fail-safe : un contexte indisponible ne doit pas faire tomber la conversation —
    // le concierge se comportera comme face à un inconnu (donc prudemment).
    return { booking: null, match: null, guest: null };
  }
}

function guestOf(b) {
  return {
    prenom: b.prenom || (b.voyageur || "").split(" ")[0] || "",
    nom: b.voyageur || "",
    email: b.email || "",
    phone: b.phone || "",
  };
}

/** Résumé compact du contexte, à injecter dans un prompt LLM. Aucune donnée inutile. */
export function contextSummary({ booking, match }) {
  if (!booking) return "Voyageur non identifié (numéro/email inconnu de nos réservations directes).";
  const when = match === "current" ? "séjour EN COURS" : match === "upcoming" ? "séjour À VENIR" : "séjour PASSÉ";
  return [
    `Voyageur : ${booking.voyageur || "?"}`,
    `Logement : ${booking.bien_nom || booking.bien_id} (${booking.bien_id})`,
    `${when} : du ${booking.checkin} au ${booking.checkout}`,
    booking.nb_guests ? `Voyageurs : ${booking.nb_guests}` : null,
    booking.canal ? `Canal : ${booking.canal}` : null,
  ].filter(Boolean).join("\n");
}
