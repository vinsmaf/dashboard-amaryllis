import { describe, it, expect } from "vitest";
import { parseBookingRow, parseBookingDetailText, parseFrDate, parseEuro, cleanGuestName } from "../parseBookingReservation.js";

// Texte RÉEL de la fiche détail extranet (NINA GRUBO / Zandoli, extrait 2026-06-14).
const DETAIL_NINA = `Accéder au contenu principal
Zandoli piscine, vue mer, paisible, jardin9438450
Accueil
 Revenir à la synthèse des réservations
Détails de la réservation
Date d'arrivée
lun. 10 août 2026
Date de départ
sam. 15 août 2026
Durée de séjour :
5 nuits
Nombre de personnes :
3 adultes et 2 enfants (3 et 12 ans)
Nombre d'hébergements
1
Montant total
€ 830,68
Nom du client :
NINA GRUBO
 mq
ngrubo.974870@guest.booking.com
Canal :
Booking.com
Numéro de réservation :
6191917019
Montant soumis à commission :
€ 820,78
Reçue
ven. 15 mai 2026
Commission et frais :
€ 134,20 `;

describe("parseBookingDetailText — fiche détail réelle NINA GRUBO", () => {
  const r = parseBookingDetailText(DETAIL_NINA, { title: "Zandoli piscine, vue mer, paisible, jardin · Détails de la réservation", hotelId: "9438450" });
  it("bien + nom + dates", () => {
    expect(r.bienId).toBe("zandoli");
    expect(r.voyageur).toBe("NINA GRUBO");
    expect(r.checkin).toBe("2026-08-10");
    expect(r.checkout).toBe("2026-08-15");
  });
  it("net = total − commission, + email + resId", () => {
    expect(r.montant).toBe(696.48);
    expect(r.montantTotal).toBe(830.68);
    expect(r.commission).toBe(134.20);
    expect(r.resId).toBe("6191917019");
    expect(r.email).toBe("ngrubo.974870@guest.booking.com");
  });
});

// Données RÉELLES extraites de l'extranet Booking (2026-06-14).
describe("parseBookingRow — résa réelle NINA GRUBO / Zandoli", () => {
  const r = parseBookingRow({
    hotelId: "9438450",
    establishment: "Zandoli piscine, vue mer, paisible, jardin",
    client: "NINA GRUBO 3 adultes et 2 enfants",
    arrival: "10 août 2026",
    departure: "15 août 2026",
    total: "€ 830,68",
    commission: "€ 134,20",
    resId: "6191917019",
  });
  it("mappe le bien (hotel_id)", () => expect(r.bienId).toBe("zandoli"));
  it("nettoie le nom du voyageur", () => expect(r.voyageur).toBe("NINA GRUBO"));
  it("convertit les dates FR → ISO", () => {
    expect(r.checkin).toBe("2026-08-10");
    expect(r.checkout).toBe("2026-08-15");
  });
  it("calcule le NET = total − commission", () => {
    expect(r.montant).toBe(696.48);       // 830,68 − 134,20
    expect(r.montantTotal).toBe(830.68);
    expect(r.commission).toBe(134.20);
  });
  it("garde le canal et le n° de résa", () => {
    expect(r.canal).toBe("booking");
    expect(r.resId).toBe("6191917019");
  });
});

describe("parseBookingRow — résa réelle Ferry Vergeer / Nogent (mapping par adresse)", () => {
  const r = parseBookingRow({
    hotelId: "8741457",
    establishment: "Appartement de Standing Aux Portes de Paris",
    address: "21 Grande Rue Charles de Gaulle, Nogent-sur-Marne",
    client: "Ferry Vergeer 2 adultes",
    arrival: "15 juin 2026",
    departure: "19 juin 2026",
    total: "€ 578,40",
    commission: "€ 106,43",
    resId: "5060931650",
  });
  it("mappe Nogent même sans le mot 'nogent' dans le nom (hotel_id puis adresse)", () => expect(r.bienId).toBe("nogent"));
  it("net + nom + dates", () => {
    expect(r.voyageur).toBe("Ferry Vergeer");
    expect(r.checkin).toBe("2026-06-15");
    expect(r.montant).toBe(471.97);       // 578,40 − 106,43
  });
});

describe("parseBookingRow — mapping bien par mot-clé (sans hotel_id connu)", () => {
  const cas = [
    ["Mabouya | Studio jacuzzi", "mabouya"],
    ["Géko cocon nature", "geko"],
    ["Villa Iguana", "iguana"],
    ["Bellevue Schœlcher standing", "schoelcher"],
    ["Villa Amaryllis vue mer piscine", "amaryllis"],
  ];
  cas.forEach(([estab, bien]) => {
    it(`${estab} → ${bien}`, () => {
      expect(parseBookingRow({ establishment: estab, client: "X 2 adultes", arrival: "1 mai 2026", departure: "3 mai 2026", total: "€ 200,00", commission: "€ 30,00" }).bienId).toBe(bien);
    });
  });
});

describe("parseFrDate / parseEuro / cleanGuestName", () => {
  it("dates FR variées (abréviations, août)", () => {
    expect(parseFrDate("9 avr. 2026")).toBe("2026-04-09");
    expect(parseFrDate("1 août 2026")).toBe("2026-08-01");
    expect(parseFrDate("31 déc. 2026")).toBe("2026-12-31");
    expect(parseFrDate("15 juin 2026")).toBe("2026-06-15");
    expect(parseFrDate("3 juillet 2026")).toBe("2026-07-03");
    expect(parseFrDate("")).toBeNull();
  });
  it("euros (virgule, milliers, point)", () => {
    expect(parseEuro("€ 578,40")).toBe(578.40);
    expect(parseEuro("€ 1 234,56")).toBe(1234.56);
    expect(parseEuro("70.00")).toBe(70);
    expect(parseEuro("")).toBeNull();
  });
  it("nom : retire le décompte de voyageurs", () => {
    expect(cleanGuestName("NINA GRUBO 3 adultes et 2 enfants")).toBe("NINA GRUBO");
    expect(cleanGuestName("Jean-Paul Belmondo 1 adulte")).toBe("Jean-Paul Belmondo");
  });
});

describe("parseBookingRow — robustesse (jamais de valeur devinée)", () => {
  it("bien inconnu → null (pas d'enrichissement)", () => {
    expect(parseBookingRow({ establishment: "Hôtel inconnu XYZ", client: "A 1 adulte", arrival: "1 mai 2026", departure: "2 mai 2026", total: "€ 100,00", commission: "€ 15,00" }).bienId).toBeNull();
  });
  it("montant absent → montant null", () => {
    expect(parseBookingRow({ hotelId: "9438450", client: "A", arrival: "1 mai 2026", departure: "2 mai 2026" }).montant).toBeNull();
  });
});
