/* global React */
const { useState: useCalState, useMemo: useCalMemo } = React;

/* ─────────────────────────────────────────────────────────────────
   <DateRangePicker> — two-month grid, click to set check-in then
   check-out. Coral endpoints + cream range fill + sand booked stripes.
   No external deps.

   Props:
     value:    { from?: "YYYY-MM-DD", to?: "YYYY-MM-DD" }
     onChange: (next) => void
     booked:   array of YYYY-MM-DD strings (cells styled as unavailable)
     minNights: integer (default 1)
   ───────────────────────────────────────────────────────────────── */
function DateRangePicker({ value = {}, onChange, booked = [], minNights = 1, initialMonth }) {
  const [cursor, setCursor] = useCalState(() => {
    if (initialMonth) return initialMonth;
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [hovered, setHovered] = useCalState(null);

  const bookedSet = useCalMemo(() => new Set(booked), [booked]);

  function shift(delta) {
    setCursor(c => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }

  function onCellClick(ds, isBooked) {
    if (isBooked) return;
    if (!value.from || (value.from && value.to)) {
      onChange({ from: ds, to: null });
    } else if (ds < value.from) {
      onChange({ from: ds, to: null });
    } else {
      const nights = dateDiff(value.from, ds);
      if (nights < minNights) {
        // Bump the to-date to satisfy minimum
        const minDate = addDays(value.from, minNights);
        onChange({ from: value.from, to: minDate });
      } else {
        onChange({ from: value.from, to: ds });
      }
    }
  }

  function isInRange(ds) {
    if (value.from && value.to) return ds > value.from && ds < value.to;
    if (value.from && hovered && hovered > value.from) return ds > value.from && ds < hovered;
    return false;
  }

  const monthA = cursor;
  const monthB = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);

  const totalNights = value.from && value.to ? dateDiff(value.from, value.to) : 0;

  return (
    <div style={{
      background: "#fff",
      border: "1px solid var(--c-sand, #e0d4bc)",
      borderRadius: 14,
      padding: 18,
      fontFamily: "'Jost', sans-serif",
    }}>
      {/* Header — nav + month titles */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <NavBtn onClick={() => shift(-1)} dir="left"/>
        <div style={{ display: "flex", gap: 56, flex: 1, justifyContent: "center", textAlign: "center" }}>
          <MonthTitle date={monthA}/>
          <MonthTitle date={monthB}/>
        </div>
        <NavBtn onClick={() => shift(1)} dir="right"/>
      </div>

      {/* Two months side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        <MonthGrid
          date={monthA} value={value} hovered={hovered}
          bookedSet={bookedSet} onCellClick={onCellClick}
          onCellHover={setHovered} isInRange={isInRange}
          minNights={minNights}
        />
        <MonthGrid
          date={monthB} value={value} hovered={hovered}
          bookedSet={bookedSet} onCellClick={onCellClick}
          onCellHover={setHovered} isInRange={isInRange}
          minNights={minNights}
        />
      </div>

      {/* Footer — clear + summary */}
      <div style={{
        marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--c-sand)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 12, color: "var(--c-muted, #7a6b5a)",
      }}>
        <button
          onClick={() => onChange({ from: null, to: null })}
          disabled={!value.from}
          style={{
            background: "none", border: "none", padding: 0,
            color: value.from ? "var(--c-coral, #c47254)" : "#c9bfa9",
            cursor: value.from ? "pointer" : "default",
            fontFamily: "inherit", fontSize: 11,
            textDecoration: "underline", textDecorationColor: "var(--c-sand)",
          }}
        >Effacer</button>
        <div style={{ fontWeight: 500, color: "var(--c-navy, #0e3b3a)" }}>
          {totalNights > 0
            ? <>{totalNights} nuit{totalNights > 1 ? "s" : ""} · {formatDateShort(value.from)} → {formatDateShort(value.to)}</>
            : value.from
              ? <>Arrivée le {formatDateShort(value.from)} · sélectionnez le départ</>
              : <>Sélectionnez vos dates · minimum {minNights} nuit{minNights > 1 ? "s" : ""}</>
          }
        </div>
      </div>
    </div>
  );
}

function NavBtn({ onClick, dir }) {
  return (
    <button onClick={onClick} style={{
      background: "var(--c-cream)", border: "1px solid var(--c-sand)",
      borderRadius: 8, width: 32, height: 32, display: "flex",
      alignItems: "center", justifyContent: "center",
      color: "var(--c-navy)", cursor: "pointer", fontSize: 14,
    }}>
      {dir === "left" ? "←" : "→"}
    </button>
  );
}

function MonthTitle({ date }) {
  const months = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  return (
    <div style={{
      flex: 1,
      fontFamily: "'Jost', sans-serif", fontWeight: 200,
      fontSize: 14, letterSpacing: "0.18em",
      textTransform: "uppercase", color: "var(--c-navy, #0e3b3a)",
    }}>
      {months[date.getMonth()]} {date.getFullYear()}
    </div>
  );
}

function MonthGrid({ date, value, hovered, bookedSet, onCellClick, onCellHover, isInRange, minNights }) {
  const DOW = ["L", "M", "M", "J", "V", "S", "D"];
  const cells = useCalMemo(() => buildCells(date), [date.toISOString()]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {DOW.map((d, i) => (
          <div key={i} style={{
            fontSize: 9, fontWeight: 600, letterSpacing: "0.18em",
            textTransform: "uppercase", color: "var(--c-muted, #7a6b5a)",
            textAlign: "center", padding: 4,
          }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {cells.map((c, i) => {
          if (!c) return <div key={i} style={{ height: 32 }}/>;
          const isBooked = bookedSet.has(c.ds);
          const isStart  = value.from === c.ds;
          const isEnd    = value.to === c.ds;
          const inRange  = isInRange(c.ds);
          const isPast   = c.ds < today();

          let bg = "transparent", color = "var(--c-navy, #0e3b3a)", border = "1px solid transparent";
          let cursor = "pointer";

          if (isPast || isBooked) {
            color = "#c9bfa9";
            cursor = "not-allowed";
            if (isBooked) {
              bg = "repeating-linear-gradient(135deg, #f4ecdc, #f4ecdc 3px, #e8dcc1 3px, #e8dcc1 6px)";
              color = "#a89878";
            }
          } else if (isStart || isEnd) {
            bg = "var(--c-coral, #c47254)";
            color = "#fff";
          } else if (inRange) {
            bg = "var(--c-cream, #f4ecdc)";
          }

          return (
            <button
              key={i}
              onClick={() => onCellClick(c.ds, isBooked || isPast)}
              onMouseEnter={() => onCellHover(c.ds)}
              onMouseLeave={() => onCellHover(null)}
              disabled={isPast || isBooked}
              style={{
                height: 32, borderRadius: 6, border,
                background: bg, color,
                fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 400,
                cursor,
                transition: "background 0.15s, color 0.15s",
              }}
            >{c.day}</button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Date utilities (local, no external lib) ── */
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(ds, n) {
  const d = new Date(ds + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function dateDiff(a, b) {
  return Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
}
function formatDateShort(ds) {
  if (!ds) return "";
  const [y, m, d] = ds.split("-").map(Number);
  return new Date(y, m-1, d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function buildCells(date) {
  const y = date.getFullYear(), m = date.getMonth();
  const first = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  // ISO-style: Monday = 0
  const startDow = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    cells.push({ ds, day: d });
  }
  return cells;
}

Object.assign(window, { DateRangePicker });
