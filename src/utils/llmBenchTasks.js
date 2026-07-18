// Bench cost/qualité LLM — 5 tâches représentatives de l'usage réel de la fleet d'agents
// (extraction, résumé, réseaux sociaux, tri leads, calcul pricing). Logique pure testée
// (llmBenchTasks.test.js) : chaque tâche a un vérificateur déterministe (pas de LLM-juge,
// pour rester rapide/gratuit/sans circularité). Consommé par functions/api/llm-bench.js.

function countSentences(text) {
  return (text.match(/[.!?]/g) || []).length;
}
function hasEmoji(text) {
  return /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(text);
}

export const BENCH_TASKS = [
  {
    key: "extraction_json",
    label: "Extraction JSON",
    prompt: "Extrais au format JSON strict {\"ville\":string,\"budget\":number} du message suivant, sans texte autour : \"Bonjour, je cherche une villa à Sainte-Luce pour un budget de 250 euros la nuit.\"",
    check(text) {
      const match = String(text || "").match(/\{[\s\S]*\}/);
      if (!match) return false;
      try {
        const obj = JSON.parse(match[0]);
        return typeof obj.ville === "string" && obj.ville.toLowerCase().includes("sainte-luce") && Number(obj.budget) === 250;
      } catch { return false; }
    },
  },
  {
    key: "resume_court",
    label: "Résumé court",
    prompt: "Résume cet avis voyageur en UNE phrase de moins de 20 mots, rien d'autre : \"Séjour incroyable, la villa était magnifique, la piscine parfaite, mais le wifi était un peu lent le soir.\"",
    check(text) {
      const t = String(text || "").trim();
      if (!t) return false;
      const words = t.split(/\s+/).filter(Boolean).length;
      return words > 0 && words <= 20;
    },
  },
  {
    key: "redaction_instagram",
    label: "Rédaction Instagram",
    prompt: "Écris une légende Instagram de 2 phrases maximum pour une photo de la piscine à débordement de la Villa Amaryllis, ton chaleureux, en français, avec au moins un emoji.",
    check(text) {
      const t = String(text || "").trim();
      if (!t) return false;
      return hasEmoji(t) && countSentences(t) <= 3 && countSentences(t) >= 1;
    },
  },
  {
    key: "classification_lead",
    label: "Classification lead",
    prompt: "Ce message est-il une demande de réservation (lead) ou autre ? Réponds UNIQUEMENT par le mot LEAD ou le mot AUTRE, rien d'autre. Message : \"Avez-vous une disponibilité pour 4 personnes du 10 au 15 août ?\"",
    check(text) {
      return /^\s*lead\s*\.?\s*$/i.test(String(text || ""));
    },
  },
  {
    key: "calcul_pricing",
    label: "Calcul pricing",
    prompt: "Un séjour de 7 nuits à 110€/nuit avec une réduction directe de 15% sur le total. Quel est le prix total en euros ? Réponds UNIQUEMENT par le nombre (pas de texte, pas de symbole €).",
    check(text) {
      const nums = String(text || "").match(/\d+([.,]\d+)?/g) || [];
      return nums.some((n) => {
        const v = parseFloat(n.replace(",", "."));
        return Math.abs(v - 654.5) < 2; // tolère l'arrondi (654, 654.5, 655)
      });
    },
  },
];
