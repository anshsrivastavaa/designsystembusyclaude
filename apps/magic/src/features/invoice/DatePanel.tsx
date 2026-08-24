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
import { daysAfter, monthShifted, monthTitle } from '../../lib/day'
import { MonthGrid } from './MonthGrid'

/** A quick pick, and the day it lands on. The caller works the day out.
 *
 * ONE LINE, ALWAYS. The last-invoice pick used to carry its date on a second line and came out
 * twice the height of every other chip, which is what made the column look uneven. Whatever the
 * caller wants said goes in the label. */
export type DatePick = { label: string; day: string }


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
            // EACH PILL IS THE WIDTH OF ITS OWN WORD. Stretched, every one took the width of the
            // longest — so "Today" was drawn as a pill wider than the month grid's first four
            // columns, which is what "huge pills for today" was looking at. v2 stretches because
            // v2's labels are all short; ours carries a date.
            className="flex shrink-0 flex-col items-start gap-2 border-r border-stroke pr-3"
          >
            {picks.map((pick) => (
              <button
                key={pick.label}
                type="button"
                onClick={() => choose(pick.day)}
                // A PILL WITH A BORDER, which is what v2 draws. Bare text in a column reads as a
                // list of words rather than a row of things you can press, and nothing about it
                // says where one stops and the next starts.
                className="h-control-sm rounded-pill border border-stroke bg-surface px-3 text-sm text-ink pressable hover:border-stroke-strong hover:bg-surface-hover focus-ring"
              >
                {pick.label}
              </button>
            ))}
            {children}
          </div>

          <MonthGrid showing={showing} value={value} onChoose={choose} />
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
      className="grid size-control-sm place-items-center rounded-control text-body text-ink-muted pressable hover:bg-surface-hover hover:text-ink focus-ring"
    >
      {glyph}
    </button>
  )
}
