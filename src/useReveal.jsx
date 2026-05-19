// useReveal.js — IntersectionObserver hook + Reveal wrapper component
import { useEffect, useRef, useState } from "react";

/**
 * Retourne [ref, visible].
 * visible passe à true une seule fois quand l'élément entre dans le viewport.
 */
export function useReveal({ threshold = 0.12, rootMargin = "0px" } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin]);

  return [ref, visible];
}

/**
 * Composant wrapper animé.
 * <Reveal delay={0.1} className="...">...</Reveal>
 *
 * Props :
 *   as        — tag HTML (défaut "div")
 *   delay     — délai CSS en secondes (défaut 0)
 *   anim      — "fadeUp" | "fadeIn" | "fadeLeft" | "fadeRight" (défaut "fadeUp")
 *   duration  — durée CSS en secondes (défaut 0.6)
 *   threshold — fraction visible avant déclenchement (défaut 0.12)
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  anim = "fadeUp",
  duration = 0.6,
  threshold,
  className,
  style,
  children,
  ...props
}) {
  const [ref, visible] = useReveal({ threshold });
  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible ? undefined : 0,
        animation: visible
          ? `${anim} ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`
          : "none",
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}
