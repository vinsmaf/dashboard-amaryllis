/* global React, Button, Chip, RatingBadge, Eyebrow, Display, Editorial */
const { useState: useStateTopBar } = React;

/* ─────────────────────────────────────────────────────────────────
   <TopBar> — sticky, navy, 56px tall. Responsive: hides the
   discount pill and switches to short price label on narrow screens.
   ───────────────────────────────────────────────────────────────── */
function TopBar({ propertyName, price, onBack, onShare, onBook }) {
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      height: 56, background: "var(--c-navy)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: isMobile ? "0 12px" : "0 20px", gap: isMobile ? 8 : 12,
    }}>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "none", border: "none", color: "rgba(250,245,233,0.7)",
        cursor: "pointer", flexShrink: 0,
        fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: isMobile ? 11 : 13,
        letterSpacing: isMobile ? "0.06em" : "0.1em", padding: 0,
      }}>← {isMobile ? "" : "Accueil"}</button>

      <div style={{
        fontFamily: "'Jost', sans-serif", fontWeight: 200,
        fontSize: isMobile ? 11 : 13,
        letterSpacing: isMobile ? "0.18em" : "0.45em",
        color: "var(--c-ivory)",
        textTransform: "uppercase",
        flex: 1, textAlign: "center", minWidth: 0,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {propertyName}
      </div>

      {!isMobile && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: 6, padding: "3px 10px", flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700, letterSpacing: "0.08em" }}>
            ✓ -15% DIRECT
          </span>
        </div>
      )}

      <Button variant="primary" size={isMobile ? "sm" : "md"} onClick={onBook} style={{ flexShrink: 0 }}>
        {isMobile ? `${price}€/n` : `À partir de ${price}€/nuit`}
      </Button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <Hero> — full-bleed photo with overlaid title + chips
   ───────────────────────────────────────────────────────────────── */
function Hero({ photo, eyebrow, title, sub, chips = [], height = 480, children }) {
  return (
    <div style={{
      position: "relative",
      width: "100%",
      height,
      background: `#0e2020 url('${photo}') center/cover no-repeat`,
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(14,59,58,0) 30%, rgba(14,59,58,0.6) 100%)",
        pointerEvents: "none",
      }} />

      {chips.length > 0 && (
        <div style={{ position: "absolute", top: 28, left: 30, display: "flex", gap: 10 }}>
          {chips.map((c, i) => <Chip key={i} variant="onPhoto">{c}</Chip>)}
        </div>
      )}

      <div style={{
        position: "absolute", bottom: 36, left: 30, right: 30,
        color: "var(--c-ivory)",
      }}>
        {eyebrow && <Eyebrow color="coral" tracking="0.55em" style={{ marginBottom: 14 }}>{eyebrow}</Eyebrow>}
        <Display size="xl" color="var(--c-ivory)" style={{ marginBottom: 10 }}>{title}</Display>
        {sub && <Editorial color="rgba(250,245,233,0.85)" style={{ maxWidth: 580 }}>{sub}</Editorial>}
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <SectionHead> — Eyebrow + display title pair, centered or left
   ───────────────────────────────────────────────────────────────── */
function SectionHead({ eyebrow, title, lede, align = "left", style }) {
  return (
    <div style={{ textAlign: align, ...style }}>
      {eyebrow && <Eyebrow tracking="0.55em" style={{ marginBottom: 14 }}>{eyebrow}</Eyebrow>}
      <Display size="lg" style={{ marginBottom: lede ? 16 : 0 }}>{title}</Display>
      {lede && <Editorial size="md" color="var(--c-muted)" style={{ maxWidth: 620, margin: align === "center" ? "0 auto" : 0 }}>{lede}</Editorial>}
    </div>
  );
}

Object.assign(window, { TopBar, Hero, SectionHead });
