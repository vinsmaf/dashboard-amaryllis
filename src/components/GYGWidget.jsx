import { useEffect } from "react";

const PARTNER_ID = "DNI7ML3";
const WIDGET_SCRIPT = "https://widget.getyourguide.com/v2/widget.js";
const ANALYTICS_SCRIPT = "https://widget.getyourguide.com/dist/pa.umd.production.min.js";

// Charge les scripts GYG une seule fois (idempotent)
function loadGYGScripts() {
  if (!document.querySelector(`script[src="${WIDGET_SCRIPT}"]`)) {
    const s = document.createElement("script");
    s.src = WIDGET_SCRIPT;
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }
  if (!document.querySelector(`script[src="${ANALYTICS_SCRIPT}"]`)) {
    const s = document.createElement("script");
    s.src = ANALYTICS_SCRIPT;
    s.async = true;
    s.defer = true;
    s.setAttribute("data-gyg-partner-id", PARTNER_ID);
    document.head.appendChild(s);
  }
}

/**
 * Widget GetYourGuide — affiche des activités pour une destination.
 * locationId : ID GYG de la destination (Martinique = 169136)
 * numberOfItems : nombre d'activités affichées (max 4 recommandé)
 */
export default function GYGWidget({ locationId = "169136", numberOfItems = 3, className = "" }) {
  useEffect(() => {
    loadGYGScripts();
    // Réinitialise le widget si le script était déjà chargé
    if (window.GYG?.reinit) window.GYG.reinit();
  }, [locationId]);

  return (
    <div className={className}>
      <div
        data-gyg-widget="activities"
        data-gyg-partner-id={PARTNER_ID}
        data-gyg-location-id={locationId}
        data-gyg-number-of-items={numberOfItems}
      />
    </div>
  );
}
