// Villa Rental Martinique — English landing page — /villa-rental-martinique

import SEOMeta from "./SEOMeta.jsx";
import NewsletterForm from "./NewsletterForm.jsx";

const NAVY  = "#0e3b3a";
const IVORY = "#faf5e9";
const CORAL = "#c47254";
const TEXT  = "#2c2c2c";
const CREAM = "#f5efe0";
const SAND  = "#e8dcc8";
const MUTED = "#7a6b5a";
const BASE  = "https://villamaryllis.com";

const propertiesMartinique = [
  { id: "amaryllis", name: "Villa Amaryllis", location: "Sainte-Luce", price: 280, guests: 8, highlight: "Salt water infinity pool · 180° ocean view · 3 bedrooms" },
  { id: "zandoli",   name: "Zandoli",         location: "Sainte-Luce", price: 220, guests: 5, highlight: "Private cascade pool · Sea view · Mezzanine · Tropical garden" },
  { id: "iguana",    name: "Villa Iguana",    location: "Sainte-Luce", price: 180, guests: 6, highlight: "Salt water pool (non-chlorinated) · Diamond Rock view" },
  { id: "geko",      name: "Géko",            location: "Sainte-Luce", price: 150, guests: 4, highlight: "Private cascade pool · Tropical garden · BBQ" },
  { id: "mabouya",   name: "Mabouya",  location: "Sainte-Luce", price: 110, guests: 2, highlight: "Private jacuzzi · Sea view · Romantic" },
  { id: "schoelcher",name: "Bellevue",        location: "Schœlcher",   price: 100, guests: 2, highlight: "Panoramic Fort-de-France Bay view" },
];

const propertiesIDF = [
  { id: "nogent", name: "Apt. Paris Gates", location: "Nogent-sur-Marne", price: 85, guests: 4, highlight: "15 min from Paris · RER A · Quiet" },
];

// Combined for schema.org
const properties = [...propertiesMartinique, ...propertiesIDF];

const faqs = [
  { q: "How do I book a villa in Martinique without Airbnb?", a: "Book directly on villamaryllis.com using our secure payment system (Stripe). You save up to 14% in Airbnb service fees and get direct contact with the host." },
  { q: "What is the best area to rent a villa in Martinique?", a: "Sainte-Luce in the south is ideal — 20 min from the beaches of Sainte-Anne and Les Salines, 15 min from Le Diamant, 35 min from the airport. A perfect base to explore the entire island." },
  { q: "Do your villas have a private pool?", a: "Yes — most of our properties have a private pool. Villa Amaryllis features a 4×7 m salt water infinity pool with 180° ocean views. Zandoli and Géko each have their own private cascade pool. Villa Iguana offers the resort's only non-chlorinated salt water pool. Mabouya has a private jacuzzi (no pool)." },
  { q: "Are pets allowed?", a: "Yes, pets are welcome in several properties (Villa Amaryllis, Villa Iguana). A supplement of €50 per stay applies. Please mention it when booking." },
  { q: "What is the best time to visit Martinique?", a: "The dry season (December–April) offers the best weather — sunny days, calm sea, constant trade winds. July–August is also popular despite occasional showers. Book 3–6 months in advance for high season." },
  { q: "Is there WiFi in your villas?", a: "Yes, all properties include Starlink high-speed WiFi at no extra charge." },
];

// ── VillaCompare — tableau comparatif côte à côte ────────────────────────────
const COMPARE_COLS = [
  { id: "amaryllis", label: "Villa Amaryllis",  photo: "/photos/amaryllis/01.webp",  price: "€280",  guests: 8, pool: "∞ Salt water 4×7m", jacuzzi: false, view: "Ocean 180°", wifi: "Starlink", pets: true,  badge: "⭐ Premium" },
  { id: "zandoli",   label: "Zandoli",          photo: "/photos/zandoli/01.webp",    price: "€220",  guests: 5, pool: "Cascade private",  jacuzzi: false, view: "Sea + garden", wifi: "Starlink", pets: true,  badge: null },
  { id: "iguana",    label: "Villa Iguana",     photo: "/photos/iguana/01.webp",     price: "€180",  guests: 6, pool: "Salt water",       jacuzzi: false, view: "Diamond Rock", wifi: "Starlink", pets: true,  badge: null },
  { id: "geko",      label: "Géko",             photo: "/photos/geko/01.webp",       price: "€150",  guests: 4, pool: "Cascade private",  jacuzzi: false, view: "Garden",     wifi: "Starlink", pets: true,  badge: null },
  { id: "mabouya",   label: "Mabouya",   photo: "/photos/mabouya/01.webp",    price: "€110",  guests: 2, pool: null,               jacuzzi: true,  view: "Sea",        wifi: "Starlink", pets: false, badge: "💑 Romantic" },
  { id: "nogent",    label: "Apt. Paris Gates", photo: "/photos/nogent/01.webp",     price: "€85",   guests: 4, pool: null,          jacuzzi: false, view: "Courtyard",  wifi: "Fiber",    pets: true,  badge: "🗼 Near Paris" },
];

const ROWS = [
  { label: "Price / night",  render: v => <span style={{ fontWeight: 600, color: CORAL, fontSize: 17 }}>{v.price}</span> },
  { label: "Guests",         render: v => `Up to ${v.guests}` },
  { label: "Pool",           render: v => v.pool ? <span style={{ color: "#16a34a" }}>✓ {v.pool}</span> : <span style={{ color: "#9ca3af" }}>—</span> },
  { label: "Jacuzzi",        render: v => v.jacuzzi ? <span style={{ color: "#16a34a" }}>✓</span> : <span style={{ color: "#9ca3af" }}>—</span> },
  { label: "View",           render: v => v.view },
  { label: "WiFi",           render: v => v.wifi },
  { label: "Pets",           render: v => v.pets ? <span style={{ color: "#16a34a" }}>✓</span> : <span style={{ color: "#9ca3af" }}>—</span> },
];

function VillaCompare() {
  const colW = 148;
  return (
    <div style={{ marginBottom: 64 }}>
      <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 8, textAlign: "center" }}>
        Compare villas
      </h2>
      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, color: TEXT, opacity: 0.7, textAlign: "center", marginBottom: 28, fontStyle: "italic" }}>
        Find the property that fits your group
      </p>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: 14, border: `1px solid ${SAND}`, background: "#fff" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 640 }}>
          <thead>
            <tr>
              {/* row label column */}
              <th style={{ width: 130, background: CREAM, padding: "0 0 0 20px", borderBottom: `1px solid ${SAND}`, borderRight: `1px solid ${SAND}`, verticalAlign: "bottom", paddingBottom: 16 }} />
              {COMPARE_COLS.map((col, i) => (
                <th key={col.id} style={{ width: colW, padding: "0 8px 0", borderBottom: `1px solid ${SAND}`, borderRight: i < COMPARE_COLS.length - 1 ? `1px solid ${SAND}` : "none", verticalAlign: "top", background: "#fff" }}>
                  <a href={`/${col.id}`} style={{ textDecoration: "none", display: "block" }}>
                    <img src={col.photo} alt={col.label} loading="lazy"
                      style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                    <div style={{ padding: "10px 8px 12px" }}>
                      {col.badge && (
                        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: CORAL, marginBottom: 4 }}>{col.badge}</div>
                      )}
                      <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 13, color: NAVY, lineHeight: 1.2 }}>{col.label}</div>
                    </div>
                  </a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => (
              <tr key={row.label} style={{ background: ri % 2 === 0 ? "#fff" : CREAM }}>
                <td style={{ padding: "12px 16px 12px 20px", fontFamily: "'Jost', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED, borderRight: `1px solid ${SAND}`, whiteSpace: "nowrap" }}>
                  {row.label}
                </td>
                {COMPARE_COLS.map((col, i) => (
                  <td key={col.id} style={{ padding: "12px 12px", textAlign: "center", fontFamily: "'Jost', sans-serif", fontSize: 13, color: TEXT, borderRight: i < COMPARE_COLS.length - 1 ? `1px solid ${SAND}` : "none" }}>
                    {row.render(col)}
                  </td>
                ))}
              </tr>
            ))}
            {/* CTA row */}
            <tr style={{ background: CREAM }}>
              <td style={{ padding: "16px 16px 16px 20px", borderRight: `1px solid ${SAND}` }} />
              {COMPARE_COLS.map((col, i) => (
                <td key={col.id} style={{ padding: "16px 12px", textAlign: "center", borderRight: i < COMPARE_COLS.length - 1 ? `1px solid ${SAND}` : "none" }}>
                  <a href={`/${col.id}`} style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "8px 16px", borderRadius: 6, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    Book
                  </a>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function GuideEn() {
  return (
    <>
      <SEOMeta title="Villa Rental Martinique — Direct booking | Amaryllis" description="Book our Martinique villas directly in Sainte-Luce. Salt water infinity pool, 180° ocean view, private cascade pools, jacuzzi. From €110/night. No Airbnb fees." canonical="/villa-rental-martinique" image="https://villamaryllis.com/photos/amaryllis/01.webp" type="website" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "ItemList",
            "name": "Villa Rental Martinique — Direct Booking",
            "url": `${BASE}/villa-rental-martinique`,
            "numberOfItems": 7,
            "itemListElement": properties.map((p, i) => ({
              "@type": "ListItem", "position": i + 1,
              "url": `${BASE}/${p.id}`,
              "name": `${p.name} — ${p.location}, Martinique`,
            })),
          },
          {
            "@type": "FAQPage",
            "mainEntity": faqs.map(f => ({
              "@type": "Question",
              "name": f.q,
              "acceptedAnswer": { "@type": "Answer", "text": f.a },
            })),
          },
          {
            "@type": "Article",
            "headline": "Villa Rental Martinique — Book Direct, No Airbnb Fees",
            "description": "Rent a luxury villa in Martinique with private pool and ocean view. Direct booking, no service fees. Sainte-Luce, Schœlcher. From €85/night.",
            "url": `${BASE}/villa-rental-martinique`,
            "image": `${BASE}/photos/amaryllis/02.webp`,
            "inLanguage": "en",
            "author": { "@id": `${BASE}/#organization` },
            "publisher": { "@id": `${BASE}/#organization` },
          },
        ],
      })}} />

      <div style={{ minHeight: "100vh", background: IVORY, color: TEXT, fontFamily: "'Jost', system-ui, sans-serif" }}>
        <header style={{ background: NAVY, padding: "0 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontWeight: 300, fontSize: 18, letterSpacing: "0.15em", textTransform: "uppercase" }}>Amaryllis</a>
            <a href="/" style={{ color: IVORY, textDecoration: "none", fontSize: 13, letterSpacing: "0.08em", opacity: 0.7 }}>← View all villas</a>
          </div>
        </header>

        {/* Hero */}
        <div style={{ background: NAVY, padding: "72px 24px 56px", textAlign: "center" }}>
          <p style={{ color: CORAL, fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 16 }}>Direct booking · No fees</p>
          <h1 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: "clamp(28px, 5vw, 54px)", letterSpacing: "0.05em", color: IVORY, textTransform: "uppercase", margin: "0 0 20px", lineHeight: 1.1 }}>
            Villa Rental<br />Martinique
          </h1>
          <p style={{ color: "rgba(250,245,233,0.75)", fontSize: 18, maxWidth: 620, margin: "0 auto 32px", lineHeight: 1.7, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Luxury villas and apartments in Martinique with private pools, ocean views and private jacuzzis. Book directly — save up to 14% vs. Airbnb.
          </p>
          <a href="#properties" style={{ display: "inline-block", background: CORAL, color: "#fff", textDecoration: "none", padding: "16px 40px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            See availability
          </a>
          {/* Social proof */}
          <div style={{ marginTop: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            <span style={{ color: "rgba(250,245,233,0.6)", fontSize: 13, fontFamily: "'Jost', sans-serif" }}>⭐ 4.94 · 200+ stays</span>
            <span style={{ color: "rgba(250,245,233,0.3)", fontSize: 13 }}>·</span>
            <span style={{ color: "rgba(250,245,233,0.6)", fontSize: 13, fontFamily: "'Jost', sans-serif" }}>Verified on Airbnb & Booking.com</span>
            <span style={{ color: "rgba(250,245,233,0.3)", fontSize: 13 }}>·</span>
            <span style={{ color: "rgba(250,245,233,0.6)", fontSize: 13, fontFamily: "'Jost', sans-serif" }}>Response &lt; 1h</span>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "64px 24px 80px" }}>

          {/* Why book direct */}
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 40 }}>
              Why book direct?
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
              {[
                ["💸", "No service fees", "Save up to 14% compared to Airbnb or Booking.com on the exact same property."],
                ["💬", "Direct contact", "WhatsApp or email with the owner. Flexible check-in, personalized welcome, real answers."],
                ["🔒", "Secure payment", "Stripe-encrypted card payment. Same security as any major platform."],
                ["🌴", "Local expertise", "We know Martinique — restaurants, beaches, activities. Our welcome guide is included."],
              ].map(([icon, title, text]) => (
                <div key={title} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 12, padding: "28px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 14, color: NAVY, marginBottom: 8, letterSpacing: "0.04em" }}>{title}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, lineHeight: 1.7, color: TEXT }}>{text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Properties */}
          <h2 id="properties" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 32, textAlign: "center", scrollMarginTop: 24 }}>
            Our properties
          </h2>
          {/* Martinique villas */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
            {propertiesMartinique.map(p => (
              <a key={p.id} href={`/${p.id}`} style={{ textDecoration: "none", background: "#fff", border: `1px solid ${SAND}`, borderRadius: 12, overflow: "hidden", display: "flex", alignItems: "stretch", gap: 0 }}>
                {/* Photo vignette */}
                <div style={{ width: 120, flexShrink: 0, background: SAND }}>
                  <img
                    src={`/photos/${p.id}/01.webp`}
                    alt={p.name}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
                {/* Infos */}
                <div style={{ flex: 1, padding: "20px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 16, color: NAVY, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 15, color: TEXT, opacity: 0.8 }}>{p.location}, Martinique</div>
                    <div style={{ fontFamily: "'Jost', sans-serif", fontSize: 11, color: CORAL, marginTop: 4, letterSpacing: "0.02em" }}>{p.highlight}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {p.price != null
                      ? <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 18, color: CORAL }}>€{p.price}<span style={{ fontSize: 13, fontWeight: 300 }}>/night</span></div>
                      : <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 13, color: CORAL, letterSpacing: "0.04em" }}>Long-term rental</div>
                    }
                    <div style={{ fontSize: 12, color: TEXT, opacity: 0.6 }}>up to {p.guests} guests</div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Paris / Île-de-France — separate section */}
          <div style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 14, padding: "28px 32px", marginBottom: 64 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: CORAL, margin: "0 0 12px" }}>Also available</p>
            <h3 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 20, color: NAVY, margin: "0 0 20px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Apartment near Paris</h3>
            {propertiesIDF.map(p => (
              <a key={p.id} href={`/${p.id}`} style={{ textDecoration: "none", background: "#fff", border: `1px solid ${SAND}`, borderRadius: 10, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 15, color: NAVY, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 14, color: TEXT, opacity: 0.8 }}>{p.location} · {p.highlight}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 17, color: CORAL }}>€{p.price}<span style={{ fontSize: 13, fontWeight: 300 }}>/night</span></div>
                  <div style={{ fontSize: 12, color: TEXT, opacity: 0.6 }}>up to {p.guests} guests</div>
                </div>
              </a>
            ))}
          </div>

          {/* ── VillaCompare ── */}
          <VillaCompare />

          {/* Martinique intro */}
          <div style={{ marginBottom: 64 }}>
            <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 28 }}>
              🌺 About Martinique
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                ["Getting there", "Martinique (Aimé Césaire International Airport) is served by direct flights from Paris CDG (8h), London Gatwick (9h), Miami (4h) and several Caribbean hubs. Air France, French Bee and Corsair fly direct from Paris."],
                ["Where to stay", "Sainte-Luce, in the south, is the ideal base: 20 min from the famous Les Salines beach, 15 min from Le Diamant, 35 min from the airport. Quiet village atmosphere, Caribbean sea, excellent restaurants."],
                ["Best time to visit", "December to April (dry season) is the best time — sunny days, calm sea, temperatures around 28°C. July–August is busy but beautiful. September–October is the quietest period with the lowest rates."],
                ["Getting around", "Rent a car at the airport — it's essential to explore the island. Budget €40–70/day. Traffic can be heavy around Fort-de-France; plan morning outings to the most popular spots."],
              ].map(([title, text]) => (
                <div key={title} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 10, padding: "24px 28px" }}>
                  <h3 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 15, color: NAVY, margin: "0 0 10px" }}>{title}</h3>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, lineHeight: 1.75, color: TEXT, margin: 0 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <h2 style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, letterSpacing: "0.08em", textTransform: "uppercase", color: NAVY, marginBottom: 28 }}>
            ❓ Frequently asked questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 64 }}>
            {faqs.map((faq, i) => (
              <details key={i} style={{ background: CREAM, border: `1px solid ${SAND}`, borderRadius: 10 }}>
                <summary style={{ padding: "20px 24px", cursor: "pointer", fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 15, color: NAVY, letterSpacing: "0.03em", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {faq.q}<span style={{ color: CORAL, flexShrink: 0, marginLeft: 12 }}>+</span>
                </summary>
                <p style={{ margin: 0, padding: "0 24px 20px", fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, lineHeight: 1.75, color: TEXT }}>{faq.a}</p>
              </details>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, color: TEXT, opacity: 0.7, marginBottom: 24, fontStyle: "italic" }}>
              Ready to book your dream villa in Martinique?
            </p>
            <a href="/amaryllis" style={{ display: "inline-block", background: NAVY, color: IVORY, textDecoration: "none", padding: "16px 40px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase", marginRight: 12 }}>
              Villa Amaryllis →
            </a>
            <a href="#properties" style={{ display: "inline-block", background: "transparent", color: NAVY, textDecoration: "none", padding: "16px 32px", borderRadius: 8, fontSize: 13, fontWeight: 400, letterSpacing: "0.15em", textTransform: "uppercase", border: `1px solid ${SAND}` }}>
              All villas
            </a>
          </div>
        </div>

        <div style={{ padding: "48px 24px", background: "#f6f1e7" }}>
          <NewsletterForm source="villa-rental-martinique" />
        </div>

        <div style={{ background: NAVY, padding: "24px", textAlign: "center" }}>
          <p style={{ color: "rgba(250,245,233,0.4)", fontSize: 13, margin: 0 }}>
            © {new Date().getFullYear()} Amaryllis Locations · <a href="/" style={{ color: "rgba(250,245,233,0.4)", textDecoration: "none" }}>villamaryllis.com</a>
          </p>
        </div>
      </div>
    </>
  );
}
