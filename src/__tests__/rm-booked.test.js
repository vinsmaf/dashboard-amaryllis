import { describe, it, expect } from "vitest";
import { calcDateReco } from "../../functions/api/rm-recommendations/[[path]].js";

// property minimal : pas de profil → basePrice = base_price_mid, minStay = min_stay_default.
const property = { id: "geko", price_min: 5000, price_max: 30000, base_price_low: 12000, base_price_mid: 15000, base_price_high: 18000, min_stay_default: 2 };
const common = { property, profiles: [], rules: [], overridesMap: {}, holidayMap: {}, eventsForDate: [], signalMap: {}, today: "2026-07-01" };

describe("calcDateReco — dates réservées", () => {
  it("date réservée → flag already_booked + vacancy_risk 0, pas d'ajustement occupation", () => {
    const booked = new Set(["2026-07-05"]);
    const r = calcDateReco({ ...common, dateStr: "2026-07-05", ownOccupancy: { rate30: 0, rate90: 0 }, bookedDates: booked });
    const flags = JSON.parse(r.alert_flags);
    expect(flags).toContain("already_booked");
    expect(r.vacancy_risk_score).toBe(0);
    expect(flags).not.toContain("last_minute_unbooked");
    expect(flags.some((f) => String(f).startsWith("own_occ"))).toBe(false);
  });

  it("date libre (occ 0%) → pas de already_booked, ajustement occupation appliqué", () => {
    const booked = new Set(["2026-07-05"]);
    const r = calcDateReco({ ...common, dateStr: "2026-07-20", ownOccupancy: { rate30: 0, rate90: 0 }, bookedDates: booked });
    const flags = JSON.parse(r.alert_flags);
    expect(flags).not.toContain("already_booked");
    expect(flags).toContain("own_occ_very_low");
  });

  it("sans bookedDates → comportement inchangé", () => {
    const r = calcDateReco({ ...common, dateStr: "2026-07-20", ownOccupancy: null, bookedDates: null });
    expect(JSON.parse(r.alert_flags)).not.toContain("already_booked");
  });
});
