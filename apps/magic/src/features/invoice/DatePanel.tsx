// The calendar behind both date fields. ONE PANEL WITH A PRESET, never two.
//
// v2 built this once as a standalone component serving the invoice date and the due date, and
// the arrangement is kept: a month head across the top, the quick picks in a column on the LEFT
// beside the grid rather than under it, and the month on the right. Aj asked for them beside.
//
// IT HOLDS NO BUSINESS RULES. The picks are handed in, because what "Party credit days" comes to
// is a fact about the customer and what "Net 30" counts from is a fact about the invoice —
// neither is this component's to know, and a panel that worked either out would be the front end
// deciding a term of trade. It draws days and reports the one that was chosen.
//
// THE ERROR LINE IS NOT THERE AT REST. A permanent note saying a due date cannot precede the
// invoice date is subtext on a screen that has none anywhere, and it teaches nothing until the
// moment it is broken — which is the moment it appears.

import * as React from 'react'

import { Popover } from '@busy/ui/Popover'
import { actionFor } from '../../lib/shortcuts'
import { dayText, daysAfter, monthGrid, monthShifted, monthTitle, today } from '../../lib/day'

/** A quick pick, and the day it lands on. The caller works the day out.
 *
 * ONE LINE, ALWAYS. The last-invoice pick used to carry its date on a second line and came out
 * twice the height of every other chip, which is what made the column look uneven. Whatever the
 * caller wants said goes in the label. */
export type DatePick = { label: string; day: string }

// SENTENCE CASE, which is v2's. Uppercase letterspaced caps is this product's COLUMN HEADING
// face — it says "this is a table of data". A calendar's weekday row is a legend, and setting it
// like a heading made the panel read as a spreadsheet with a month in it.
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function DatePanel({
  open,
  onClose,
  anchorRef,
  label,
  value,
  opensOn,
  onPick,
  picks,
  earliest = null,
  earliestMessage = '',
  children,
}: {
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
  label: string
  /** The day the field holds, which is where the panel opens. May be empty — a new invoice has
   * no due date until somebody gives it one. */
  value: string
  /** WHERE TO OPEN WHEN THE FIELD HOLDS NOTHING. An empty due date is the ordinary state of a
   * new invoice, and a month grid cannot be drawn from an empty string — it threw outright,
   * taking the whole screen with it. The caller says where the person would expect to land: the
   * invoice's own date, for a due date, rather than a month picked by whatever today happens to
   * be. */
  opensOn: string
  onPick: (day: string) => void
  picks: readonly DatePick[]
  /** The earliest day this field will take, or null when it will take any. */
  earliest?: string | null
  earliestMessage?: string
  /** Anything extra the preset wants under the picks — the Net days box, on Due. */
  children?: React.ReactNode
}) {
  const [showing, setShowing] = React.useState(value === '' ? opensOn : value)
  const [refused, setRefused] = React.useState<string | null>(null)

  // Opening goes to the date the field is holding, every time — not to wherever it was left the
  // last time it was opened, which is a panel remembering something the person has moved on from.
  React.useEffect(() => {
    if (open) {
      setShowing(value === '' ? opensOn : value)
      setRefused(null)
    }
  }, [open, value, opensOn])

  function choose(day: string) {
    if (earliest !== null && day < earliest) {
      setRefused(earliestMessage)
      setShowing(day)
      return
    }
    setRefused(null)
    onPick(day)
    onClose()
  }

  // The arrows walk the month, and which key that is comes from the one shortcuts table like
  // every other key in the product. Left and right are a day; up and down are a week, because
  // that is the row a month grid is made of.
  function walk(event: React.KeyboardEvent<HTMLDivElement>) {
    const action = actionFor(event, 'grid')
    const step =
      action === 'move-left' ? -1 : action === 'move-right' ? 1 : action === 'move-up' ? -7 : action === 'move-down' ? 7 : 0
    if (step === 0) return
    event.preventDefault()
    setShowing((was) => daysAfter(was, step))
  }

  // ALIGNED TO THE FIELD'S RIGHT EDGE, so it opens leftwards. Both date fields sit at the far
  // right of the header, and hung from their left edge the panel runs into the window — Popover
  // then keeps it on screen, which is right, but the room has to come from somewhere. "align:
  // end" is the shape that exists for a control at the right of a row.
  return (
    <Popover open={open} onClose={onClose} anchorRef={anchorRef} label={label} align="end">
      <div className="w-max p-3" onKeyDown={walk}>
        <div className="mb-2 flex items-center justify-between gap-1">
          <Step label="Previous year" onStep={() => setShowing(monthShifted(showing, -12))} glyph="«" />
          <Step label="Previous month" onStep={() => setShowing(monthShifted(showing, -1))} glyph="‹" />
          <span aria-live="polite" className="flex-1 text-center text-body font-strong text-ink">
            {monthTitle(showing)}
          </span>
          <Step label="Next month" onStep={() => setShowing(monthShifted(showing, 1))} glyph="›" />
          <Step label="Next year" onStep={() => setShowing(monthShifted(showing, 12))} glyph="»" />
        </div>

        <div className="flex gap-3">
          {/* THE DIVIDER IS STRUCTURE, NOT DECORATION. A gap alone left two loose groups; the
              rule says the picks and the month are two ways of answering one question. v2 has it. */}
          <div
            role="group"
            aria-label="Quick picks"
            className="flex shrink-0 flex-col items-stretch gap-2 border-r border-stroke pr-3"
          >
            {picks.map((pick) => (
              <button
                key={pick.label}
                type="button"
                onClick={() => choose(pick.day)}
                // A PILL WITH A BORDER, which is what v2 draws. Bare text in a column reads as a
                // list of words rather than a row of things you can press, and nothing about it
                // says where one stops and the next starts.
                className="h-control-sm rounded-pill border border-stroke bg-surface px-3 text-sm text-ink hover:border-stroke-strong hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-stroke-focus"
              >
                {pick.label}
              </button>
            ))}
            {children}
          </div>

          <div role="grid" aria-label={monthTitle(showing)}>
            <div role="row" className="flex">
              {WEEKDAYS.map((short, at) => (
                <span
                  key={short}
                  role="columnheader"
                  aria-label={FULL_DAYS[at]}
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
                      onChoose={choose}
                    />
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* ONLY WHEN THE RULE IS BROKEN. Nothing is drawn here at rest. */}
        {refused === null ? null : (
          // A TINTED CONTAINER, which is what a validation error is in this product — red text
          // on the page's own white is the alarm colour used as ink.
          <p role="alert" className="mt-3 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
            {refused}
          </p>
        )}
      </div>
    </Popover>
  )
}

function Step({ label, onStep, glyph }: { label: string; onStep: () => void; glyph: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onStep}
      // A SINGLE GLYPH AT A READABLE SIZE, which is v2's. Two chevron icons shoved together made
      // the year steps read as four stray arrows at two heights, and shrinking them to fit made
      // them unreadable. « and » are one character each and say "further" without any of that.
      className="grid size-control-sm place-items-center rounded-control text-body text-ink-muted hover:bg-surface-hover hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-stroke-focus"
    >
      {glyph}
    </button>
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
