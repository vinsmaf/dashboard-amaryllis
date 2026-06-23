// Reveal.jsx — wrapper d'animation au scroll (fade + slide up).
// Réutilisable, SSR-safe et accessible :
//  - le contenu est rendu VISIBLE par défaut (prerender / no-JS / SEO intacts) ;
//  - au mount client, seuls les éléments SOUS le fold passent en pré-animation
//    (jamais de flash de disparition pour ce qui est déjà à l'écran) ;
//  - respecte prefers-reduced-motion (aucune animation alors).
// Usage : <Reveal><MaSection/></Reveal>  ·  <Reveal as="section" delay={120} y={28}>…</Reveal>
import { useEffect, useRef } from "react";

export default function Reveal({
  children,
  as: Tag = "div",
  delay = 0,      // ms avant le démarrage de la transition
  y = 24,         // amplitude du slide-up en px
  duration = 700, // ms
  style = {},
  className,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") return;

    // Déjà (presque) visible → on ne touche à rien pour éviter tout flash.
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (rect.top < vh * 0.92) return;

    // Pré-état (l'élément est hors écran : aucun flash perçu).
    el.style.opacity = "0";
    el.style.transform = `translateY(${y}px)`;
    el.style.transition = `opacity ${duration}ms cubic-bezier(.16,.84,.44,1) ${delay}ms, transform ${duration}ms cubic-bezier(.16,.84,.44,1) ${delay}ms`;
    el.style.willChange = "opacity, transform";

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.opacity = "1";
            el.style.transform = "none";
            obs.unobserve(el);
            // libère willChange après la transition
            window.setTimeout(() => { el.style.willChange = "auto"; }, duration + delay + 50);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay, y, duration]);

  return (
    <Tag ref={ref} className={className} style={style} {...rest}>
      {children}
    </Tag>
  );
}
