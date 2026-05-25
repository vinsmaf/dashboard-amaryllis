# Amaryllis — Site UI kit

Hi-fi recreation of the marketing/booking site at `villamaryllis.com`.

## Run

Open `index.html` directly in a browser. React 18 + Babel are loaded from unpkg; no build step required.

## What's here

| File | What it exports |
|---|---|
| `Primitives.jsx` | `<Eyebrow>`, `<Display>`, `<Editorial>`, `<Button>`, `<Chip>`, `<RatingBadge>` |
| `Header.jsx` | `<TopBar>` (sticky navy header), `<Hero>` (full-bleed photo), `<SectionHead>` |
| `PropertyCard.jsx` | `<PropertyCard>` (canonical bien card), `<BookingPanel>` (sticky right rail) |
| `Sections.jsx` | `<DescriptionBlock>`, `<AmenityCloud>`, `<ReviewBlock>`, `<FAQAccordion>`, `<Footer>` |
| `index.html` | Two-screen demo (home → property detail), clickable through |

## Two screens

1. **Home** — hero + 6 property cards + reviews
2. **Detail** — sticky topbar + photo gallery grid + editorial body + sticky booking panel + FAQ + footer

## Notes

- The real `src/PublicSite.jsx` in the codebase is 6500 lines, with several more screens (booking flow with Stripe payment, calendar, reservation-alert modal, etc). What's here is a UI-fidelity slice — copy this to scaffold a new page in the same style.
- All colors come from `colors_and_type.css` via CSS variables — no inline hex codes inside components.
- Photos in `assets/photos/` are a 13-image sample. The codebase ships 200+ images in `public/photos/`.
