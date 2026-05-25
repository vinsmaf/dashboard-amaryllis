# Amaryllis — Admin UI kit

Hi-fi recreation of the owner-operator dashboard at `villamaryllis.com/admin`.

## Run

Open `index.html` directly in a browser. React 18 + Babel are loaded from unpkg; no build step.

## What's here

| File | Exports |
|---|---|
| `AdminPrimitives.jsx` | `<Panel>`, `<KpiCard>`, `<Gauge>`, `<Spark>`, `<PBar>`, `<StatusDot>`, `<ChannelChip>`, `<Tabs>` |
| `Cockpit.jsx` | `<TodayBanner>`, `<BienCard>`, `<AlertCard>`, `<ReservationRow>` |
| `Charts.jsx` | `<StackedBarChart>`, `<ChannelDonut>`, `<Heatmap>` (pure SVG; real app uses Recharts) |
| `Planning.jsx` | `<GanttRow>`, `<DayBanner>` |
| `index.html` | Interactive demo — switchable across the 7 dashboard tabs |

## Three demo views

- **Cockpit** (default) — TodayBanner · KPI strip · alerts · stacked bar chart · 6 BienCards
- **Planning** — DayBanner with today's check-ins/outs · Gantt month view · reservations table
- **Other tabs** — show the channel donut + saisonnalité heatmap as a sample of what real-app sections look like

## Notes

- The dashboard's design philosophy is `reference/canvas-philosophy.md` — *"Cartographie de Flux"*: dark canvas, each property is a territory, color is identity, numbers are mono, nothing is decorative.
- Charts here are hand-built SVG mocks; the real codebase uses **Recharts** (`<ComposedChart>`, `<PieChart>`, etc) — see `src/App.jsx`.
- Per-bien identity colors (`BIEN_COLORS`) and channel colors (`CHANNEL_COLORS`) are **canonical** — lift from `AdminPrimitives.jsx` rather than redefining.
- Real numerical data here is sampled from `SEED_BIENS` / `HIST_SEED` / `REVENUS_CANAL_2025` in the codebase (2025 → projected 2026). It is realistic, not synthetic.
