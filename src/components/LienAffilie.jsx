// Composant centralisé pour tous les liens affiliés.
// Swap partenaire en 1 ligne dans src/data/partenaires.js.
// rel="sponsored" obligatoire (signal Google pour les liens affiliés rémunérés).

import { PARTENAIRES } from "../data/partenaires.js";

export default function LienAffilie({
  partenaire = "discoverCars",
  utmContent = "unknown",
  children,
  style = {},
  className = "",
  showDisclosure = true,
}) {
  const p = PARTENAIRES[partenaire];
  if (!p || !p.actif) return null;

  const utm = `utm_source=villamaryllis&utm_medium=affiliate&utm_campaign=locations&utm_content=${utmContent}`;
  const separator = p.url.includes("?") ? "&" : "?";
  const href = `${p.url}${separator}${utm}`;

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 2, ...style }} className={className}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        style={{ color: "#c47254", fontWeight: 500, textDecoration: "underline", textDecorationColor: "rgba(196,114,84,0.4)" }}
      >
        {children || p.label}
      </a>
      {showDisclosure && (
        <span style={{ fontSize: 10, color: "#9a8878", lineHeight: 1.3 }}>
          Lien partenaire · sans surcoût pour vous
        </span>
      )}
    </span>
  );
}
