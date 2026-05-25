// src/VideoHero.jsx
// design-006 — Composant VideoHero avec fallback image
//
// Usage:
//   <VideoHero
//     videoSrc="/videos/amaryllis-pool.mp4"
//     posterSrc="/images/amaryllis-hero.jpg"
//     height="70vh"
//     overlay={0.45}
//   >
//     <h1>Villa Amaryllis</h1>
//     <p>Sainte-Luce, Martinique</p>
//   </VideoHero>

import { useRef, useState, useEffect } from "react";

const NAVY = "#0e3b3a";

/**
 * VideoHero
 * @param {string}  videoSrc   — URL mp4 (optionnel, fallback sur posterSrc si absent/erreur)
 * @param {string}  posterSrc  — URL image de couverture (requis si pas de video)
 * @param {string}  height     — hauteur CSS du hero (défaut: "70vh")
 * @param {number}  overlay    — opacité du calque sombre 0–1 (défaut: 0.4)
 * @param {string}  overlayColor — couleur du calque (défaut: navy)
 * @param {boolean} muted      — mute la vidéo (défaut: true)
 * @param {boolean} controls   — afficher les contrôles (défaut: false)
 * @param {ReactNode} children — contenu overlay (titre, CTA…)
 * @param {object}  style      — styles additionnels sur le wrapper
 * @param {string}  className  — className sur le wrapper
 */
export default function VideoHero({
  videoSrc,
  posterSrc,
  height       = "70vh",
  overlay      = 0.4,
  overlayColor = NAVY,
  muted        = true,
  controls     = false,
  children,
  style        = {},
  className    = "",
}) {
  const videoRef    = useRef(null);
  const [videoFailed, setVideoFailed] = useState(!videoSrc);
  const [isLoaded,    setIsLoaded]    = useState(false);

  // Autoplay avec gestion des politiques navigateur
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || videoFailed) return;
    vid.play().catch(() => setVideoFailed(true));
  }, [videoFailed]);

  const wrapperStyle = {
    position:        "relative",
    width:           "100%",
    height,
    overflow:        "hidden",
    background:      overlayColor,
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    ...style,
  };

  const mediaStyle = {
    position:   "absolute",
    inset:      0,
    width:      "100%",
    height:     "100%",
    objectFit:  "cover",
    opacity:    isLoaded ? 1 : 0,
    transition: "opacity 0.6s ease",
  };

  const overlayStyle = {
    position:        "absolute",
    inset:           0,
    background:      overlayColor,
    opacity:         overlay,
    pointerEvents:   "none",
  };

  const contentStyle = {
    position:        "relative",
    zIndex:          2,
    textAlign:       "center",
    color:           "#faf5e9",
    padding:         "0 24px",
    width:           "100%",
    maxWidth:        "760px",
    margin:          "0 auto",
  };

  return (
    <div style={wrapperStyle} className={className} aria-label="Hero section">
      {/* Media — vidéo ou image fallback */}
      {!videoFailed && videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          muted={muted}
          loop
          playsInline
          controls={controls}
          style={mediaStyle}
          onCanPlay={() => setIsLoaded(true)}
          onError={() => setVideoFailed(true)}
          aria-hidden="true"
        />
      ) : posterSrc ? (
        <img
          src={posterSrc}
          alt=""
          style={mediaStyle}
          onLoad={() => setIsLoaded(true)}
          aria-hidden="true"
        />
      ) : (
        // Placeholder gradient si ni vidéo ni image
        <div
          style={{
            ...mediaStyle,
            opacity:    1,
            background: `linear-gradient(135deg, ${NAVY} 0%, #1a5c5a 100%)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Calque sombre */}
      <div style={overlayStyle} aria-hidden="true" />

      {/* Contenu */}
      {children && (
        <div style={contentStyle}>
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * VideoHeroSkeleton — placeholder pendant le chargement
 */
export function VideoHeroSkeleton({ height = "70vh" }) {
  return (
    <div
      style={{
        height,
        background: `linear-gradient(135deg, ${NAVY} 0%, #1a5c5a 100%)`,
        display:    "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label="Chargement…"
    >
      <div style={{
        width:        "40px",
        height:       "40px",
        border:       "3px solid rgba(250,245,233,0.2)",
        borderTop:    "3px solid #faf5e9",
        borderRadius: "50%",
        animation:    "spin 1s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
