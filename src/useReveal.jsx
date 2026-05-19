// useReveal.jsx — animations CSS pures au mount, sans observer
// Les éléments animent une fois à l'apparition de la page.
// Pas de état, pas d'IntersectionObserver, pas de flash invisible.
import { useRef } from "react";

/**
 * <Reveal delay={0.1} anim="fadeUp">...</Reveal>
 *
 * Props :
 *   as        — tag HTML (défaut "div")
 *   delay     — délai CSS en secondes (défaut 0)
 *   anim      — "fadeUp" | "fadeIn" | "fadeLeft" | "fadeRight" (défaut "fadeUp")
 *   duration  — durée CSS en secondes (défaut 0.6)
 *   className, style, ...rest transmis au tag
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  anim = "fadeUp",
  duration = 0.6,
  className,
  style,
  children,
  ...props
}) {
  return (
    <Tag
      className={className}
      style={{
        animation: `${anim} ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}

// Hook conservé pour usage avancé ultérieur
export function useReveal() {
  return [useRef(null), true];
}
