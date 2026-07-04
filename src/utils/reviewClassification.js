// Boucle de délégation "réponses aux avis" (Projet Délégation · Vague 3).
// Logique pure : seuil de classification + construction du prompt de génération.
// L'appel LLM lui-même et la persistance D1 restent dans functions/api/voyageur-feedback.js.
//
// ⚠️ ÉTAT ACTUEL (2026-07-04) : dry-run uniquement. Aucune API d'écriture Google/Airbnb
// n'est branchée (Google Business Profile Reviews Reply nécessite une demande d'accès
// Google validée manuellement ; Airbnb n'expose pas de reply public en tiers). La
// classification prépare le terrain pour une auto-publication future ; en attendant,
// TOUT brouillon (auto ET escalade) est copié-collé manuellement par Vincent.

// ≥4★ = éligible à l'auto-publication future. ≤3★ (ou note absente/invalide) = toujours
// escaladé à Vincent — un avis négatif engage trop pour un pilote automatique, quel que
// soit l'état futur de l'accès API.
export function classifyReview(rating) {
  const r = Number(rating);
  if (!Number.isFinite(r) || r <= 0) return "escalade";
  return r >= 4 ? "auto" : "escalade";
}

// Construit les messages LLM (system + user) pour générer un brouillon de réponse,
// dans le style de l'agent responsable-service-client (empathie d'abord, action
// concrète, jamais de formule corporate, vouvoiement, signature Vincent).
export function buildReviewReplyPrompt({ bienNom, rating, reviewText, classification }) {
  const system = [
    "Tu es Vincent, hôte d'Amaryllis Locations (conciergerie de logements en Martinique).",
    "Tu rédiges une réponse publique à un avis voyageur. Règles strictes :",
    "- Vouvoiement systématique, ton chaleureux et sincère, jamais corporate.",
    "- Interdits : \"C'est noté\", \"Nous prenons en compte\", \"Nous comprenons votre frustration\", toute formule creuse sans action concrète.",
    "- Ne jamais argumenter ou se justifier de façon défensive.",
    "- Reprendre un détail SPÉCIFIQUE de l'avis (preuve qu'on l'a lu), pas une réponse générique copier-coller.",
    classification === "auto"
      ? "- Avis positif (4-5★) : remercier chaleureusement, mentionner le détail précis apprécié, inviter à revenir."
      : "- Avis ≤3★ : reconnaître sincèrement le problème précis (sans excuse vague ni argument défensif), indiquer une action corrective concrète déjà en cours ou prévue, proposer un contact direct si pertinent.",
    "- Signer \"Vincent — Amaryllis Locations\".",
    "- Réponse courte (3-6 phrases), prête à publier telle quelle.",
  ].join("\n");

  const user = [
    `Bien : ${bienNom || "logement Amaryllis"}`,
    `Note : ${rating ?? "non renseignée"}★`,
    `Avis du voyageur : "${(reviewText || "").slice(0, 1000)}"`,
    "Rédige la réponse publique.",
  ].join("\n");

  return {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
}
