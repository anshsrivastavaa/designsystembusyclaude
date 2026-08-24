// The month a date panel draws, and the days in it.
//
// Its own file because DatePanel is the SURFACE — a head, a column of picks, a place for an
// error — and this is the month inside it. Together they crossed the 250-line cap, which was the
// cap saying what it always says.

import { dayText, monthGrid, monthTitle, today } from '../../lib/day'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function MonthGrid({
  showing,
  value,
  onChoose,
}: {
  showing: string
  value: string
  onChoose: (day: string) => void
}) {
  return (
    <div role="grid" aria-label={monthTitle(showing)}>
      <div role="row" className="flex">
        {WEEKDAYS.map((short, at) => (
          <span
            key={short}
            role="columnheader"
            aria-label={FULL_DAYS[at]}
            // SENTENCE CASE, which is v2's. Uppercase letterspaced caps is this product's COLUMN
            // HEADING face — it says "this is a table of data". A calendar's weekday row is a
            // legend, and setting it like a heading made the panel read as a spreadsheet.
            className="grid size-control shrink-0 place-items-center text-sm font-label text-ink-muted"
          >
            {short}
          </span>
        ))}
      </div>
      {[0, 1, 2, 3, 4, 5].map((week) => (
        <div key={week} role="row" className="flex">
          {monthGrid(showing)
            .slice(week * 7, week * 7 + 7)
            .map((cell) => (
              <Day
                key={cell.day}
                day={cell.day}
                inMonth={cell.inMonth}
                chosen={cell.day === value}
                isToday={cell.day === today()}
                onChoose={onChoose}
              />
            ))}
        </div>
      ))}
    </div>
  )
}

function Day({
  day,
  inMonth,
  chosen,
  isToday,
  onChoose,
}: {
  day: string
  inMonth: boolean
  chosen: boolean
  isToday: boolean
  onChoose: (day: string) => void
}) {
  return (
    <button
      type="button"
      role="gridcell"
      // The whole day, not the number: "14" read out of a grid says nothing about which month
      // the cursor has paged to.
      aria-label={dayText(day)}
      aria-selected={chosen}
      onClick={() => onChoose(day)}
      // TODAY IS RINGED, THE SELECTION IS FILLED, and they are different things — "the day it is"
      // and "the day this invoice carries" are two facts that are usually not the same day, and
      // on a back-dated invoice they never are. Filling only the selection left no way to find
      // today at all once you had paged away from it.
      //
      // TABULAR FIGURES, so the columns of a month line up. Proportional digits put the 1s half a
      // stroke left of the 8s and the grid stops reading as a grid.
      className={`relative grid size-control shrink-0 place-items-center rounded-pill border text-body tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-stroke-focus ${
        chosen
          ? 'border-transparent bg-accent text-on-accent'
          : `${isToday ? 'border-stroke-strong' : 'border-transparent'} ${
              inMonth ? 'text-ink' : 'text-ink-muted'
            } hover:bg-surface-hover`
      }`}
    >
      {Number(day.slice(8, 10))}
      {/* The dot under today, which is what carries it once the selection lands on top. */}
      {isToday && !chosen ? (
        <span aria-hidden className="absolute bottom-1 size-1 rounded-pill bg-current" />
      ) : null}
    </button>
  )
}
