// Landing page — portail d'accès Amaryllis
if (typeof document !== "undefined" && !document.getElementById("__landing_fonts")) {
  const link = document.createElement("link");
  link.id = "__landing_fonts";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;700&family=Cormorant+Garamond:ital,wght@0,400;1,400;1,600&display=swap";
  document.head.appendChild(link);
  const s = document.createElement("style");
  s.textContent = `
    @keyframes landingFadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    @keyframes petalSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
    @keyframes organicFloat {
      0%,100% { transform:translateY(0) scale(1); }
      50% { transform:translateY(-16px) scale(1.04); }
    }
    body { margin:0; padding:0; }
    * { box-sizing:border-box; }
  `;
  document.head.appendChild(s);
}

const IVORY = "#faf5e9";
const NAVY  = "#0e3b3a";
const CORAL = "#c47254";
const GOLD  = "#c9a673";
const MUTED = "#7a6b5a";

function AmaryllisMark({ size = 72, color = CORAL }) {
  const petals = Array.from({ length: 6 }, (_, i) => i * 60);
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      {petals.map(angle => (
        <g key={angle} transform={`rotate(${angle})`}>
          <path d="M 0 0 L 0 -38 L 8 -20 Z" fill={color} opacity="0.85" />
        </g>
      ))}
      <circle cx="0" cy="0" r="5" fill={color} opacity="0.6" />
    </svg>
  );
}

function ShaderBlob({ x, y, r, color, delay = 0 }) {
  return (
    <div style={{
      position: "absolute", left: `${x}%`, top: `${y}%`,
      width: r, height: r,
      background: color,
      borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
      filter: "blur(80px)",
      opacity: 0.18,
      animation: `organicFloat ${6 + delay}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      pointerEvents: "none",
    }} />
  );
}

export default function Landing() {
  return (
    <div style={{
      minHeight: "100vh",
      background: NAVY,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Jost', sans-serif",
    }}>
      {/* Ambient blobs */}
      <ShaderBlob x={10}  y={15}  r={400} color={CORAL} delay={0} />
      <ShaderBlob x={65}  y={55}  r={500} color={GOLD}  delay={2} />
      <ShaderBlob x={35}  y={75}  r={350} color="#1a5c5a" delay={4} />
      <ShaderBlob x={80}  y={5}   r={300} color={CORAL} delay={1.5} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center",
        textAlign: "center", padding: "40px 24px",
        animation: "landingFadeUp 0.9s ease both",
      }}>
        {/* Brand mark */}
        <div style={{ marginBottom: 28, filter: "drop-shadow(0 8px 32px rgba(196,114,84,0.4))" }}>
          <AmaryllisMark size={88} color={CORAL} />
        </div>

        {/* Wordmark */}
        <div style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: "clamp(32px, 7vw, 64px)",
          fontWeight: 200,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: IVORY,
          lineHeight: 1,
          marginBottom: 10,
        }}>Amaryllis</div>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontSize: "clamp(14px, 2.5vw, 18px)",
          color: GOLD,
          letterSpacing: "0.08em",
          marginBottom: 64,
          opacity: 0.85,
        }}>Locations d'exception · Martinique &amp; Paris</div>

        {/* Access cards */}
        <div style={{
          display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center",
          marginBottom: 48,
        }}>
          {/* Public site */}
          <a href="/site" style={{ textDecoration: "none" }}>
            <div style={{
              width: 220,
              background: "rgba(250,245,233,0.06)",
              border: "1px solid rgba(250,245,233,0.14)",
              borderRadius: 20,
              padding: "32px 24px",
              cursor: "pointer",
              backdropFilter: "blur(20px)",
              transition: "all 0.25s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(196,114,84,0.18)";
                e.currentTarget.style.borderColor = "rgba(196,114,84,0.5)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(250,245,233,0.06)";
                e.currentTarget.style.borderColor = "rgba(250,245,233,0.14)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: 36 }}>🏡</div>
              <div style={{ color: IVORY, fontWeight: 700, fontSize: 15, letterSpacing: "0.05em" }}>Nos propriétés</div>
              <div style={{ color: GOLD, fontSize: 12, opacity: 0.8 }}>Réserver un séjour</div>
              <div style={{
                marginTop: 8,
                padding: "8px 20px", borderRadius: 30,
                background: CORAL, color: IVORY,
                fontSize: 12, fontWeight: 600, letterSpacing: "0.08em",
              }}>Découvrir →</div>
            </div>
          </a>

          {/* Admin */}
          <a href="/admin" style={{ textDecoration: "none" }}>
            <div style={{
              width: 220,
              background: "rgba(250,245,233,0.04)",
              border: "1px solid rgba(250,245,233,0.08)",
              borderRadius: 20,
              padding: "32px 24px",
              cursor: "pointer",
              backdropFilter: "blur(20px)",
              transition: "all 0.25s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(14,165,233,0.12)";
                e.currentTarget.style.borderColor = "rgba(14,165,233,0.3)";
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(250,245,233,0.04)";
                e.currentTarget.style.borderColor = "rgba(250,245,233,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ fontSize: 36 }}>📊</div>
              <div style={{ color: IVORY, fontWeight: 700, fontSize: 15, letterSpacing: "0.05em" }}>Administration</div>
              <div style={{ color: "rgba(250,245,233,0.4)", fontSize: 12 }}>Accès réservé</div>
              <div style={{
                marginTop: 8,
                padding: "8px 20px", borderRadius: 30,
                background: "rgba(14,165,233,0.15)",
                border: "1px solid rgba(14,165,233,0.3)",
                color: "#7dd3fc",
                fontSize: 12, fontWeight: 600, letterSpacing: "0.08em",
              }}>Accéder →</div>
            </div>
          </a>
        </div>

        {/* Footer */}
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 11,
          color: "rgba(250,245,233,0.2)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}>© Amaryllis 2026</div>
      </div>
    </div>
  );
}
