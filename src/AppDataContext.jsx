/**
 * AppDataContext — contexte React unique pour partager les données et callbacks
 * du dashboard admin entre App.jsx et les onglets/composants enfants.
 *
 * MOTIVATION
 * ----------
 * Avant ce refactor, App.jsx (10k lignes) passait 14 props identiques (biens,
 * reservations, hist, n, mob, scriptUrl, icalUrls, icalUrlsBooking, saveRes,
 * saveUrls, saveUrlsBooking, addToast, onUpdateRevenu, onApplyRevenusFromResas,
 * pushReservationsToScript) à chaque onglet enfant. Du prop-drilling pénible
 * et illisible.
 *
 * Note : ce context est délibérément simple (1 seul `value`, pas de slices).
 * Les onglets sont rendus 1-par-1 (`tab === "x" && <Tab />`), donc les
 * re-renders inutiles que Context déclenche d'habitude ne se manifestent pas
 * ici. On verra plus tard si Zustand devient nécessaire (cf. ROADMAP_REFACTOR.md).
 *
 * USAGE
 * -----
 *   // Dans App.jsx :
 *   //   <AppDataProvider value={{ biens, reservations, ... }}>
 *   //     <Cockpit />          // plus de props !
 *   //     <Planning />
 *   //   </AppDataProvider>
 *
 *   // Dans Cockpit.jsx / Planning.jsx / etc :
 *   //   const { biens, reservations, n, mob } = useAppData();
 */
import { createContext, useContext } from "react";

const AppDataContext = createContext(null);

export function AppDataProvider({ value, children }) {
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

/**
 * Hook d'accès aux données. Lève une erreur claire si appelé hors Provider —
 * facilite le debugging quand un composant est rendu en dehors du dashboard.
 */
export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error(
      "useAppData() doit être appelé à l'intérieur de <AppDataProvider>. " +
      "Vérifie que ce composant est rendu dans App.jsx (ou enveloppé dans un Provider de test)."
    );
  }
  return ctx;
}

export default AppDataContext;
