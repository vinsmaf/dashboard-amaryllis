/* global React, Display, Editorial, Eyebrow, Button, RatingBadge, Chip */
const { useState: useStateCard, useEffect: useEffectCard } = React;

/* ─────────────────────────────────────────────────────────────────
   <PropertyCard> — the canonical bien card.
   Photo carousel, favorite, compare, "À partir de" price chip,
   hover lift, all in 320–400px width.
   ───────────────────────────────────────────────────────────────── */
function PropertyCard({ property, onClick, onFavorite, isFavorite }) {
  const [hover, setHover] = useStateCard(false);
  const [idx, setIdx] = useStateCard(0);
  const photos = property.photos || [];

  useEffectCard(() => {
    if (photos.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % photos.length), 5000);
    return () => clearInterval(t);
  }, [idx, photos.length]);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid var(--c-sand)",
        transition: "all 0.4s cubic-bezier(0.23,1,0.32,1)",
        transform: hover ? "translateY(-4px)" : "none",
        boxShadow: hover ? "var(--shadow-2)" : "var(--shadow-1)",
        display: "flex", flexDirection: "column",
        cursor: "pointer",
      }}
    >
      {/* Photo */}
      <div style={{ position: "relative", paddingBottom: "66.6%", overflow: "hidden", background: "#0e2020" }}>
        {photos[idx] && (
          <img
            src={photos[idx]}
            alt={property.name}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              transition: "opacity 0.4s",
            }}
          />
        )}
        {property.tag && (
          <div style={{ position: "absolute", top: 12, left: 12 }}>
            <Chip variant="onPhoto">{property.tag}</Chip>
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); onFavorite?.(); }}
          style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(255,255,255,0.92)", borderRadius: "50%",
            width: 34, height: 34, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: isFavorite ? "var(--c-coral)" : "#bbb",
          }}>
          {isFavorite ? "♥" : "♡"}
        </button>

        {/* Photo dots */}
        {photos.length > 1 && (
          <div style={{
            position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 5,
          }}>
            {photos.map((_, i) => (
              <span key={i} style={{
                width: 5, height: 5, borderRadius: "50%",
                background: i === idx ? "#fff" : "rgba(255,255,255,0.4)",
              }}/>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "14px 18px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: 15, color: "var(--c-navy)" }}>
            {property.name}
          </div>
          <RatingBadge rating={property.rating} count={property.reviews} style={{ background: "transparent", padding: 0 }} />
        </div>
        <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: "var(--c-muted)", marginTop: 4 }}>
          {property.location} · {property.guests} voyageurs · {property.bedrooms} ch.
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--c-muted)" }}>
            À partir de
          </span>
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 28, color: "var(--c-navy)", marginLeft: 6 }}>
            {property.price}€
          </span>
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 12, color: "var(--c-muted)" }}>
            /nuit
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   <BookingPanel> — sticky right-rail with real date picker + total
   ───────────────────────────────────────────────────────────────── */
function BookingPanel({ price, rating, reviews, onBook }) {
  const [range, setRange] = useStateCard({ from: null, to: null });

  const nights = range.from && range.to ? Math.round((new Date(range.to) - new Date(range.from)) / 86400000) : 0;
  const subtotal = nights * price;
  const discount = nights >= 28 ? 0.15 : nights >= 14 ? 0.10 : nights >= 7 ? 0.05 : 0;
  const cleaning = 180;
  const total = subtotal - Math.round(subtotal * discount) + (nights > 0 ? cleaning : 0);

  return (
    <div style={{
      background: "#fff",
      border: "1px solid var(--c-sand)",
      borderRadius: 16,
      padding: 22,
      boxShadow: "var(--shadow-1)",
      position: "sticky", top: 80,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 200, fontSize: 30, color: "var(--c-navy)", lineHeight: 1 }}>{price}€</span>
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 13, color: "var(--c-muted)" }}>/nuit</span>
      </div>
      <RatingBadge rating={rating} count={reviews} style={{ background: "transparent", padding: 0, marginBottom: 16 }} />

      {typeof DateRangePicker === "function" ? (
        <DateRangePicker value={range} onChange={setRange} minNights={4} />
      ) : (
        <div style={{ padding: 12, color: "var(--c-muted)", fontSize: 12, border: "1px solid var(--c-sand)", borderRadius: 10, marginBottom: 12 }}>
          (Loading calendar…)
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <Button variant="primary" size="lg" style={{ width: "100%", justifyContent: "center" }} onClick={onBook}>
          {nights > 0 ? `Réserver — ${total}€` : "Réserver"}
        </Button>
      </div>

      {nights > 0 && (
        <div style={{
          marginTop: 14,
          display: "flex", flexDirection: "column", gap: 6,
          fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: "var(--c-muted)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>{nights} nuits × {price}€</span><span>{subtotal}€</span></div>
          {discount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Remise {discount >= 0.15 ? "mensuelle" : discount >= 0.10 ? "2 semaines" : "semaine"}</span><span style={{ color: "var(--c-coral)" }}>−{Math.round(subtotal * discount)}€</span></div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Ménage</span><span>{cleaning}€</span></div>
          <hr style={{ border: "none", borderTop: "1px solid var(--c-sand)", margin: "4px 0" }}/>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--c-navy)", fontWeight: 600, fontSize: 13 }}>
            <span>Total</span><span>{total}€</span>
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, textAlign: "center", fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: 11, color: "var(--c-muted)" }}>
        🔒 Paiement sécurisé par Stripe
      </div>
    </div>
  );
}

function DateField({ label, value, borderLeft }) {
  return (
    <div style={{ padding: "10px 14px", borderLeft: borderLeft ? "1px solid var(--c-sand)" : "none" }}>
      <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--c-muted)", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 13, color: "var(--c-navy)" }}>
        {value}
      </div>
    </div>
  );
}

function GuestField({ label, value }) {
  return (
    <div style={{ padding: "10px 14px", borderTop: "1px solid var(--c-sand)" }}>
      <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--c-muted)", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: 13, color: "var(--c-navy)" }}>
        {value}
      </div>
    </div>
  );
}

Object.assign(window, { PropertyCard, BookingPanel });
