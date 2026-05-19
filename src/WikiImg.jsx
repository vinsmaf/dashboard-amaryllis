// WikiImg.jsx — <img> avec srcset automatique pour les images Wikimedia Commons
// Wikimedia supporte n'importe quelle largeur de thumbnail en changeant le préfixe NNNpx-

/**
 * Génère srcset + sizes à partir d'une URL Wikimedia 960px.
 * @param {string} url960 — URL Wikimedia se terminant par /960px-filename.jpg
 * @returns {{ src, srcSet, sizes }}
 */
export function wikiSrc(url960) {
  if (!url960) return { src: url960, srcSet: undefined, sizes: undefined };
  // Remplace le préfixe de taille (ex. /960px-) par d'autres largeurs
  const at = (w) => url960.replace(/\/\d+px-/, `/${w}px-`);
  return {
    src:    at(960),
    srcSet: `${at(480)} 480w, ${at(720)} 720w, ${at(960)} 960w`,
    sizes:  "(max-width: 520px) 480px, (max-width: 820px) 720px, 960px",
  };
}

/**
 * Composant image Wikimedia responsive.
 * Utilisation : <WikiImg src={url960} alt="..." />
 * Props supplémentaires : className, style, loading, fetchPriority, width, height
 */
export default function WikiImg({
  src,
  alt = "",
  className,
  style,
  loading = "lazy",
  fetchPriority,
  width,
  height,
}) {
  const { src: s, srcSet, sizes } = wikiSrc(src);
  return (
    <img
      src={s}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      fetchPriority={fetchPriority}
      width={width}
      height={height}
      decoding="async"
    />
  );
}
