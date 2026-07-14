import { describe, it, expect } from "vitest";
import { parseAirbnbMail } from "../parseAirbnbMail.js";

// Exemple RÉEL fourni par Vincent (mail Airbnb « New booking confirmed », 2026-06-15).
const AIRBNB_ATHENAIS = `New booking confirmed! Athenais arrives Feb 1.
Send a message to confirm check-in details or welcome Athenais.

Athenais Huguenot
Identity verified

Send Athenais a MessageSend Athenais a Message
Mabouya | Jacuzzi privatif, Jardin fleuri, vue mer
Entire home/apt
Check-in
Mon, Feb 1, 2027
4:00 PM
Checkout
Tue, Mar 2, 2027
12:00 PM
Guests
1 adult
More details about who's coming
Confirmation code
HMSBFCS3FM
View itinerary
Guest paid
€41.74 x 29 nights
€1,210.50
Cleaning fee
€50.00
Guest service fee
€133.83
Occupancy taxes
€45.91
Total (EUR)
€1,440.24
Host payout
29 nights room fee
€2,690.00
Cleaning fee
€50.00
Monthly discount
-€1,479.50
Host service fee (3.0%)
-€37.82
You earn
€1,222.68`;

describe("parseAirbnbMail — exemple réel Athenais/Mabouya", () => {
  const r = parseAirbnbMail({ subject: "New booking confirmed! Athenais arrives Feb 1.", body: AIRBNB_ATHENAIS });

  it("identifie le bien (listing → bienId)", () => {
    expect(r.bienId).toBe("mabouya");
    expect(r.listingLabel).toMatch(/^Mabouya \|/);
  });

  it("extrait le nom complet du voyageur", () => {
    expect(r.guestName).toBe("Athenais Huguenot");
  });

  it("extrait les dates au format ISO", () => {
    expect(r.checkin).toBe("2027-02-01");
    expect(r.checkout).toBe("2027-03-02");
  });

  it("extrait le nombre de voyageurs", () => {
    expect(r.nbGuests).toBe(1);
  });

  it("extrait le code de confirmation", () => {
    expect(r.confirmationCode).toBe("HMSBFCS3FM");
  });

  it("extrait le payout net hôte (You earn) ET le total payé voyageur", () => {
    expect(r.montantPayout).toBe(1222.68);
    expect(r.montantTotal).toBe(1440.24);
  });

  it("marque le canal airbnb", () => {
    expect(r.canal).toBe("airbnb");
  });
});

// Corps « brut » réel tel que reçu via Outlook/Zapier (markdown collé, sans retours-ligne propres).
// Extrait condensé du vrai mail Athenais — le nom est un lien juste avant « Identity verified ».
const AIRBNB_BRUT = `New booking confirmed! Athenais arrives Feb 1.Send a message to confirm check-in details or welcome Athenais.[Athenais Huguenot](https://www.airbnb.com/hosting/reservations/details/HMSBFCS3FM?isPending=true)![](https://a0.muscache.com/im/pictures/0d520e2d.jpg)Identity verified![](https://a0.muscache.com/im/pictures/d109f44f.jpg)[Mabouya | Jacuzzi privatif, Jardin fleuri, vue mer](https://www.airbnb.com/rooms/1046596752160926069)Check-inMon, Feb 1, 20274:00 PMCheckoutTue, Mar 2, 202712:00 PMGuests1 adultConfirmation codeHMSBFCS3FM[View itinerary](https://www.airbnb.com/hosting/reservations/details/HMSBFCS3FM)Total (EUR)€1,440.24Host payoutYou earn€1,222.68`;

describe("parseAirbnbMail — corps brut Outlook/Zapier (markdown collé)", () => {
  const r = parseAirbnbMail({ subject: "Reservation confirmed - Athenais Huguenot arrives Feb 1", body: AIRBNB_BRUT });

  it("récupère le NOM COMPLET malgré le format collé (pas juste le prénom)", () => {
    expect(r.guestName).toBe("Athenais Huguenot");
  });
  it("identifie bien + dates + payout sur le format brut", () => {
    expect(r.bienId).toBe("mabouya");
    expect(r.checkin).toBe("2027-02-01");
    expect(r.checkout).toBe("2027-03-02");
    expect(r.montantPayout).toBe(1222.68);
  });
});

// Exemple RÉEL reçu en prod le 2026-07-14 (Gwenaelle Decloux/Géko) — nouveau format Airbnb SANS
// année sur Check-in/Checkout, transféré via Hotmail (en-tête « Envoyé : »). A révélé que
// parseEnDate exigeait toujours une année → checkin/checkout ressortaient null (dry-run confirmé
// en prod : "skip": "parse incomplet").
const AIRBNB_GEKO_SANS_ANNEE = `
________________________________
De : Airbnb <automated@airbnb.com>
Envoyé : mardi 14 juillet 2026 13:36:06 (UTC+01:00) Brussels, Copenhagen, Madrid, Paris
À : vinsmaf@hotmail.com <vinsmaf@hotmail.com>
Sujet : Reservation confirmed - Gwenaelle Decloux arrives Oct 31

New booking confirmed! Gwenaelle arrives Oct 31.
Send a message to confirm check-in details or welcome Gwenaelle.

Gwenaelle Decloux
Identity verified · 14 reviews

Géko, détente, zen,  piscine & jardin tropical
Entire home/apt
Check-in
Sat, Oct 31
5:00 PM
Checkout
Fri, Nov 13
12:00 PM
Guests
2 adults, 1 infant
Confirmation code
HM29D5Q9ZH
Guest paid
€109.62 x 13 nights
€1,425.00
Total (EUR)
€1,753.74
Host payout
You earn
€1,440.45`;

describe("parseAirbnbMail — nouveau format Airbnb sans année (forward Hotmail)", () => {
  const r = parseAirbnbMail({ subject: "TR : Reservation confirmed - Gwenaelle Decloux arrives Oct 31", body: AIRBNB_GEKO_SANS_ANNEE });

  it("déduit l'année depuis l'en-tête « Envoyé : » du forward", () => {
    expect(r.checkin).toBe("2026-10-31");
    expect(r.checkout).toBe("2026-11-13");
  });

  it("gère le rollover d'année (mois cible avant le mois d'envoi → année+1)", () => {
    const janvier = AIRBNB_GEKO_SANS_ANNEE
      .replace("Sat, Oct 31", "Sat, Jan 3")
      .replace("Fri, Nov 13", "Fri, Jan 10");
    const r2 = parseAirbnbMail({ subject: "x", body: janvier });
    expect(r2.checkin).toBe("2027-01-03");
    expect(r2.checkout).toBe("2027-01-10");
  });

  it("reste correct sur le reste des champs", () => {
    expect(r.bienId).toBe("geko");
    expect(r.guestName).toBe("Gwenaelle Decloux");
    expect(r.montantTotal).toBe(1753.74);
    expect(r.montantPayout).toBe(1440.45);
    expect(r.confirmationCode).toBe("HM29D5Q9ZH");
  });
});

describe("parseAirbnbMail — robustesse", () => {
  it("renvoie null sur les champs absents (jamais de valeur devinée)", () => {
    const r = parseAirbnbMail({ subject: "Bonjour", body: "rien d'utile ici" });
    expect(r.guestName).toBeNull();
    expect(r.checkin).toBeNull();
    expect(r.montantPayout).toBeNull();
    expect(r.bienId).toBeNull();
  });

  it("gère le fallback prénom si pas d'« Identity verified »", () => {
    const r = parseAirbnbMail({ subject: "", body: "Zandoli | Vue mer\nSarah arrives soon" });
    expect(r.guestName).toBe("Sarah");
    expect(r.bienId).toBe("zandoli");
  });
});
