// Diff pur entre le snapshot du jour et le snapshot précédent d'une zone (veille-005).
// Un listing "nouveau" = présent aujourd'hui, absent du snapshot précédent.
// Si aucun snapshot précédent n'existe (1er scan de la zone), aucun "nouveau" n'est
// signalé — sinon TOUT le corpus initial ressortirait comme "nouveau", ce qui serait
// un faux signal (pas une vraie apparition de concurrent).
export function diffNewListings(todayListings, prevListingIds) {
  if (!Array.isArray(todayListings)) return [];
  if (!prevListingIds) return []; // pas de snapshot précédent → baseline, rien à signaler
  const prevSet = prevListingIds instanceof Set ? prevListingIds : new Set(prevListingIds);
  return todayListings.filter(l => l && l.listing_id && !prevSet.has(l.listing_id));
}
