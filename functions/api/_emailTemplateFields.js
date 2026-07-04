// Manifeste des paragraphes ÉDITABLES (texte simple, pas de HTML) des 4
// templates email automatiques. Partagé par email-templates-admin.js (lecture/
// écriture des surcharges) et send-guest-email.js (résolution à l'envoi).
//
// Chaque champ peut contenir des {{vars}} de réservation (bien_nom, checkin…)
// — elles sont résolues au moment de l'envoi via les vars du destinataire.
// Le texte est stocké/édité en clair (retours à la ligne \n) ; converti en
// <br> uniquement au rendu HTML final (plainToHtml).

export const TEMPLATE_FIELDS = {
  confirmation: [
    {
      key: "intro_text", label: "Message principal",
      default: "Nous vous remercions d'avoir choisi de réserver {{bien_nom}}. Nous avons vraiment hâte de vous accueillir le {{checkin}} lors de votre séjour en Martinique.\n\nNous vous enverrons toutes les informations nécessaires la veille de votre arrivée, y compris les indications pour trouver le logement et les détails sur le wifi.\n\nEn attendant, si vous avez des questions ou si vous avez besoin de conseils, n'hésitez pas à nous demander.",
    },
  ],
  "verif-arrivee": [
    {
      key: "intro_text", label: "Message principal",
      default: "Nous espérons que vous avez bien dormi la nuit dernière et que vous vous êtes bien installés à {{bien_nom}}. Nous vérifions simplement que tout est à la hauteur de vos attentes jusqu'à présent.",
    },
    {
      key: "whatsapp_text", label: "Texte avant le bouton WhatsApp",
      default: "Si vous avez besoin de quoi que ce soit, ou si nous pouvons rendre votre séjour plus agréable, n'hésitez pas à nous le faire savoir :",
    },
  ],
  "j1-acces": [
    {
      key: "intro_text", label: "Message principal",
      default: "Votre séjour à {{bien_nom}} commence demain.\nVoici tout ce qu'il vous faut pour entrer sans attendre — accès, codes et guide du logement.",
    },
  ],
  "pre-depart": [
    {
      key: "intro_text", label: "Message principal",
      default: "Nous espérons que votre séjour à {{bien_nom}} vous a apporté détente et de merveilleux souvenirs en Martinique. Ce fut un réel plaisir de vous accueillir et de contribuer à la réussite de votre passage sur notre île.",
    },
    {
      key: "late_checkout_text", label: "Texte Late Check-Out",
      default: "Sur demande et selon nos disponibilités, nous vous proposons un Late Check-Out jusqu'à 19h pour un supplément de 80€ (espèces ou virement instantané). Faites-le nous savoir si cela vous intéresse.",
    },
    {
      key: "loyalty_text", label: "Texte remise fidélité",
      default: "Parce que votre satisfaction est notre plus belle récompense, nous serions ravis de vous accueillir à nouveau. En réservant directement auprès de nous lors de votre prochain séjour, vous bénéficierez d'une remise exclusive de 10% sur le tarif du logement — il vous suffira de mentionner ce message lors de votre réservation.",
    },
    {
      key: "review_text", label: "Texte demande d'avis",
      default: "Si vous avez apprécié votre séjour, nous serions très reconnaissants que vous partagiez votre expérience en laissant un avis sur Google.",
    },
    {
      key: "closing_text", label: "Message de clôture",
      default: "Nous vous souhaitons un excellent retour, en espérant que vous garderez de beaux souvenirs de votre passage à {{bien_nom}}. Au plaisir de vous revoir lors d'une prochaine escapade en Martinique !",
    },
  ],
};

export function plainToHtml(text) {
  return String(text).replace(/\n/g, "<br>");
}

export async function ensureFieldOverridesTable(db) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS email_field_overrides (template_id TEXT NOT NULL, field_key TEXT NOT NULL, value TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY (template_id, field_key))"
  ).run();
}
