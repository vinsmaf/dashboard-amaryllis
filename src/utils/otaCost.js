// I-04 — Le vrai coût des OTA : logique pure (testée par otaCost.test.js).
//
// Va au-delà de la commission affichée (que NetRevParTab chiffre déjà) : ajoute le coût de
// la RELATION CLIENT PERDUE. Un voyageur OTA sans email réel est « captif » du canal — on ne
// peut jamais l'inviter à réserver en direct, donc chacun de ses retours re-paie la commission.
//
// Séparation stricte FAIT vs HYPOTHÈSE (exigence Vincent — pas de chiffre inventé) :
//  · commissionOta()        = FAIT (CA par canal réel × taux réel).
//  · segmentation captifs   = FAIT (compté en base : email réel vs absent/alias).
//  · projectionReactivation = HYPOTHÈSE réglable (taux de réactivation = curseur, jamais figé).

// Alias OTA connus + absence d'email = non-réactivable. Airbnb/Booking masquent l'email réel
// derrière un relais (@guest.booking.com, @guest.airbnb.com, @reply.airbnb.com) OU ne le
// donnent pas du tout. Dans les deux cas : impossible de recontacter en direct.
const ALIAS_PATTERNS = ["@guest.", "@reply.airbnb", "@guest.airbnb", "@guest.booking"];

/** Un email permet-il de recontacter le voyageur en direct (hors OTA) ? */
export function isReactivableEmail(email) {
  if (!email || typeof email !== "string") return false;
  const e = email.toLowerCase().trim();
  if (!e || !e.includes("@")) return false;
  return !ALIAS_PATTERNS.some((p) => e.includes(p));
}

const OTA_CANALS = new Set(["airbnb", "booking"]);
const norm = (c) => String(c || "").toLowerCase().trim();

/**
 * Segmente une base clients en réactivables / captifs, par canal.
 * `clients` : [{ canal_principal, email, ltv_total, nb_sejours }]
 * Ne considère comme « captif OTA » qu'un client dont le canal principal est une OTA ET qui
 * n'a pas d'email réactivable. Les leads sans séjour (ltv 0) sont comptés à part (bruit).
 */
export function segmentClients(clients) {
  const seg = {
    reactivables: { count: 0, ltv: 0 },
    captifsOta:   { count: 0, ltv: 0, repeaters: 0, parCanal: {} },
    leadsSansSejour: { count: 0 }, // ex. contacts WhatsApp sans résa → hors coût OTA
  };
  for (const c of clients || []) {
    const ltv = Number(c?.ltv_total) || 0;
    const sejours = Number(c?.nb_sejours) || 0;
    const canal = norm(c?.canal_principal);
    const reactivable = isReactivableEmail(c?.email);

    if (reactivable) {
      seg.reactivables.count += 1;
      seg.reactivables.ltv += ltv;
      continue;
    }
    // Non réactivable :
    if (sejours === 0 && ltv === 0) {
      seg.leadsSansSejour.count += 1; // pas un vrai client perdu, juste un lead sans valeur mesurée
      continue;
    }
    if (OTA_CANALS.has(canal)) {
      seg.captifsOta.count += 1;
      seg.captifsOta.ltv += ltv;
      if (sejours >= 2) seg.captifsOta.repeaters += 1;
      const pc = (seg.captifsOta.parCanal[canal] ||= { count: 0, ltv: 0, repeaters: 0 });
      pc.count += 1; pc.ltv += ltv; if (sejours >= 2) pc.repeaters += 1;
    }
    // Non réactivable, canal direct/whatsapp mais AVEC séjour → capté ailleurs (pas un coût OTA).
  }
  return seg;
}

/**
 * Commission OTA réelle sur un CA ventilé par canal (FAIT).
 * `revenusCanal` : { bienId: { airbnb, booking, direct, ... } } en euros.
 * `rates` : { airbnbComm(bienId) → taux, bookingComm } — injecté depuis canauxCommissions.
 */
export function commissionOta(revenusCanal, { airbnbComm, bookingComm }) {
  let airbnb = 0, booking = 0, caAirbnb = 0, caBooking = 0, caDirect = 0;
  for (const [bien, r] of Object.entries(revenusCanal || {})) {
    const a = Number(r?.airbnb) || 0, b = Number(r?.booking) || 0, d = Number(r?.direct) || 0;
    caAirbnb += a; caBooking += b; caDirect += d;
    airbnb  += a * airbnbComm(bien);
    booking += b * bookingComm;
  }
  const total = airbnb + booking;
  const caOta = caAirbnb + caBooking;
  const caTotal = caOta + caDirect;
  return {
    airbnb: Math.round(airbnb),
    booking: Math.round(booking),
    total: Math.round(total),
    caAirbnb, caBooking, caDirect,
    partOtaPct: caTotal > 0 ? Math.round((caOta / caTotal) * 100) : 0,
    // Taux de commission OTA moyen pondéré — sert à valoriser une commission évitée.
    tauxMoyenOta: caOta > 0 ? total / caOta : 0,
  };
}

/**
 * Projection du manque à gagner annuel dû aux captifs OTA (HYPOTHÈSE réglable).
 * Idée : si on collectait l'email de ces clients fidèles et qu'on en réactivait une part en
 * direct, on économiserait la commission sur leurs futurs séjours.
 *
 *   économie/an ≈ repeatersCaptifs × tauxReactivation × valeurSejourMoyen × tauxCommissionOta
 *
 * @param repeatersCaptifs   nb de clients OTA fidèles sans email (FAIT, de la segmentation)
 * @param valeurSejourMoyen  € par séjour (réglable, pré-rempli depuis les données)
 * @param tauxReactivation   0..1 (CURSEUR — jamais une valeur figée présentée comme un fait)
 * @param tauxCommissionOta  commission évitée en passant en direct (ex. 0.17)
 */
export function projectionReactivation({ repeatersCaptifs, valeurSejourMoyen, tauxReactivation, tauxCommissionOta }) {
  const n = Math.max(0, Number(repeatersCaptifs) || 0);
  const val = Math.max(0, Number(valeurSejourMoyen) || 0);
  const r = Math.min(1, Math.max(0, Number(tauxReactivation) || 0));
  const c = Math.min(1, Math.max(0, Number(tauxCommissionOta) || 0));
  return Math.round(n * r * val * c);
}

/**
 * Assemble le tableau de bord I-04. `facts` vient du serveur (réel), `hyp` des curseurs (UI).
 * Retourne { commission, captifs, reactivables, economieProjetee, coutTotalEstime }.
 */
export function computeOtaCost(facts, hyp) {
  const { commission, segment } = facts;
  const economieProjetee = projectionReactivation({
    repeatersCaptifs: segment.captifsOta.repeaters,
    valeurSejourMoyen: hyp.valeurSejourMoyen,
    tauxReactivation: hyp.tauxReactivation,
    tauxCommissionOta: hyp.tauxCommissionOta ?? commission.tauxMoyenOta,
  });
  return {
    commission,                                   // FAIT
    captifs: segment.captifsOta,                  // FAIT
    reactivables: segment.reactivables,           // FAIT
    leadsSansSejour: segment.leadsSansSejour,     // contexte
    economieProjetee,                             // HYPOTHÈSE (dépend des curseurs)
    // Coût « total » = commission réelle + manque à gagner projeté. Le 2e terme est explicitement
    // conditionnel aux hypothèses — l'UI doit l'étiqueter comme tel, jamais le fondre dans le fait.
    coutTotalEstime: commission.total + economieProjetee,
  };
}
