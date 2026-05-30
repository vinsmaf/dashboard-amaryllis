// NotFound.jsx — Page 404 custom Amaryllis Locations

export default function NotFound() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@200;300;400;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        .nf-root {
          min-height: 100vh;
          background: #0e3b3a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .nf-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 60% 40%, rgba(196,114,84,0.12) 0%, transparent 65%),
                      radial-gradient(ellipse at 20% 80%, rgba(14,59,58,0.8) 0%, transparent 60%);
          pointer-events: none;
        }
        .nf-wave {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 180px;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 180'%3E%3Cpath fill='rgba(196,114,84,0.08)' d='M0,96L48,106.7C96,117,192,139,288,133.3C384,128,480,96,576,80C672,64,768,64,864,80C960,96,1056,128,1152,133.3C1248,139,1344,117,1392,106.7L1440,96L1440,180L0,180Z'/%3E%3C/svg%3E") no-repeat bottom;
          background-size: cover;
          pointer-events: none;
        }
        .nf-content {
          position: relative;
          z-index: 1;
          max-width: 540px;
        }
        .nf-eyebrow {
          font-family: 'Jost', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          color: #c47254;
          margin-bottom: 24px;
        }
        .nf-code {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 300;
          font-size: clamp(96px, 18vw, 160px);
          color: rgba(250,245,233,0.08);
          line-height: 1;
          letter-spacing: -0.02em;
          margin-bottom: -20px;
          user-select: none;
        }
        .nf-title {
          font-family: 'Jost', sans-serif;
          font-weight: 200;
          font-size: clamp(22px, 4vw, 32px);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #faf5e9;
          margin-bottom: 20px;
        }
        .nf-desc {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 18px;
          color: rgba(250,245,233,0.55);
          line-height: 1.7;
          margin-bottom: 48px;
        }
        .nf-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .nf-btn-primary {
          background: #c47254;
          color: #faf5e9;
          border: none;
          border-radius: 6px;
          padding: 14px 32px;
          font-family: 'Jost', sans-serif;
          font-weight: 400;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: opacity 0.2s;
        }
        .nf-btn-primary:hover { opacity: 0.85; }
        .nf-btn-secondary {
          background: transparent;
          color: rgba(250,245,233,0.6);
          border: 1px solid rgba(250,245,233,0.2);
          border-radius: 6px;
          padding: 14px 32px;
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: border-color 0.2s, color 0.2s;
        }
        .nf-btn-secondary:hover {
          border-color: rgba(250,245,233,0.5);
          color: rgba(250,245,233,0.9);
        }
        .nf-links {
          margin-top: 52px;
          display: flex;
          gap: 24px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .nf-link {
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          font-size: 12px;
          letter-spacing: 0.08em;
          color: rgba(250,245,233,0.35);
          text-decoration: none;
          transition: color 0.2s;
        }
        .nf-link:hover { color: rgba(250,245,233,0.7); }
        .nf-logo {
          position: absolute;
          top: 28px;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Jost', sans-serif;
          font-weight: 200;
          font-size: 13px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(250,245,233,0.5);
          text-decoration: none;
          white-space: nowrap;
        }
      `}</style>

      <div className="nf-root">
        <div className="nf-bg" />
        <div className="nf-wave" />

        <a href="/" className="nf-logo">Amaryllis Locations</a>

        <div className="nf-content">
          <div className="nf-eyebrow">Erreur · Page introuvable</div>
          <div className="nf-code">404</div>
          <h1 className="nf-title">Cette page n'existe pas</h1>
          <p className="nf-desc">
            La page que vous cherchez a peut-être été déplacée,<br />
            renommée ou n'a jamais existé.
          </p>
          <div className="nf-actions">
            <a href="/" className="nf-btn-primary">← Retour à l'accueil</a>
            <a href="mailto:contact@villamaryllis.com" className="nf-btn-secondary">Nous contacter</a>
          </div>
          <div className="nf-links">
            <a href="/amaryllis" className="nf-link">Villa Amaryllis</a>
            <a href="/zandoli" className="nf-link">Zandoli</a>
            <a href="/geko" className="nf-link">Géko</a>
            <a href="/guide-hub" className="nf-link">Guide Martinique</a>
            <a href="/explorer" className="nf-link">Explorer</a>
          </div>
        </div>
      </div>
    </>
  );
}
