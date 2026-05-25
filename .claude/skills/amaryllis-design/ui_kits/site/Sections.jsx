/* global React, Eyebrow, Display, Editorial, Button, Chip */
const { useState: useStateSections } = React;

/* ─────────────────────────────────────────────────────────────────
   <DescriptionBlock> — eyebrow + paragraph stack, used in property page
   ───────────────────────────────────────────────────────────────── */
function DescriptionBlock({ eyebrow, text, color }) {
  return (
    <div style={{ marginBottom: 36 }}>
      {eyebrow && (
        <div style={{
          fontFamily: "'Jost', sans-serif", fontSize: 9,
          letterSpacing: "0.42em", textTransform: "uppercase",
          color: color || "var(--c-coral)",
          fontWeight: 600, marginBottom: 12,
        }}>{eyebrow}</div>
      )}
      <Editorial size="md">{text}</Editorial>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <AmenityCloud> — chip cloud, plus optional "voir tout" ghost button
   ───────────────────────────────────────────────────────────────── */
function AmenityCloud({ amenities = [], onMore }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      {amenities.map(a => <Chip key={a}>{a}</Chip>)}
      {onMore && (
        <Button variant="ghost" size="sm" onClick={onMore}>Voir tous les équipements →</Button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <ReviewBlock> — testimonial in 3-col grid
   ───────────────────────────────────────────────────────────────── */
function ReviewBlock({ author, country, date, rating = 5, text }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid var(--c-sand)",
      borderRadius: 14, padding: 22,
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "var(--c-navy)", color: "var(--c-ivory)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 14,
        }}>{author.charAt(0)}</div>
        <div>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, color: "var(--c-navy)" }}>
            {author} {country}
          </div>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: "var(--c-muted)" }}>
            <span style={{ color: "var(--c-gold)" }}>{"★".repeat(rating)}</span> · {date}
          </div>
        </div>
      </div>
      <Editorial size="sm" style={{ fontSize: 15, lineHeight: 1.7 }}>"{text}"</Editorial>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <FAQAccordion> — single FAQ item; expand on click
   ───────────────────────────────────────────────────────────────── */
function FAQAccordion({ q, a, defaultOpen = false }) {
  const [open, setOpen] = useStateSections(defaultOpen);
  return (
    <div style={{
      borderBottom: "1px solid var(--c-sand)",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", textAlign: "left",
          background: "none", border: "none", cursor: "pointer",
          padding: "20px 0",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
        }}
      >
        <span style={{
          fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 15,
          color: "var(--c-navy)", letterSpacing: "0.02em",
        }}>{q}</span>
        <span style={{
          color: "var(--c-coral)", fontSize: 18,
          transition: "transform 0.3s var(--ease-out)",
          transform: open ? "rotate(45deg)" : "rotate(0)",
        }}>+</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 22 }}>
          <Editorial size="md">{a}</Editorial>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <Footer> — dark navy band with contact + amaryllis mark
   ───────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{
      background: "var(--c-navy)", color: "var(--c-ivory)",
      padding: "60px 30px 32px",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 40 }}>
        <div>
          <Eyebrow color="coral" tracking="0.5em">Contact</Eyebrow>
          <div style={{ marginTop: 14, fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 26, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--c-ivory)", lineHeight: 1.1 }}>
            Une question?
          </div>
          <Editorial color="rgba(250,245,233,0.55)" style={{ marginTop: 12, maxWidth: 280 }}>
            Notre équipe vous répond en moins d'une heure, en français ou en anglais.
          </Editorial>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
          {[
            { title: "+33 6 10 88 07 72", sub: "WhatsApp · 9h–22h" },
            { title: "contact@villamaryllis.com", sub: "Réponse < 24h" },
            { title: "Sainte-Luce, Martinique", sub: "Notre base aux Antilles" },
            { title: "Nogent-sur-Marne, IDF", sub: "Aux portes de Paris" },
          ].map((c, i) => (
            <div key={i}>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 13, color: "var(--c-ivory)" }}>{c.title}</div>
              <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: "var(--c-coral)", marginTop: 4 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "right" }}>
          <img src="../../assets/logo.svg" alt="Amaryllis" style={{ width: 64, height: 64, borderRadius: "50%" }}/>
          <div style={{ marginTop: 12, fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 18, letterSpacing: "0.28em", textTransform: "uppercase" }}>Amaryllis</div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: 13, color: "var(--c-gold)", marginTop: 4 }}>Locations d'exception</div>
        </div>
      </div>
      <hr style={{ border: "none", borderTop: "1px solid rgba(250,245,233,0.1)", margin: "32px 0 16px" }}/>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: "rgba(250,245,233,0.35)", letterSpacing: "0.05em" }}>
        <span>© 2026 Amaryllis Locations — SIRET 89000000000000</span>
        <span>Mentions légales · CGV · Cookies</span>
      </div>
    </footer>
  );
}

Object.assign(window, { DescriptionBlock, AmenityCloud, ReviewBlock, FAQAccordion, Footer });
