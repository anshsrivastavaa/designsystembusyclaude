// A date field and the calendar behind it. The field OWNS the picks, because the picks are made
// of facts the panel has no business knowing — what the invoice is dated, and how many days this
// party has been given to pay.
//
// NO CALENDAR ICON. The field itself opens the panel, which is v2's ruling on 05-08 and the
// document's: an icon beside a date field is a second thing to hit for the thing the field
// already does, and it takes width off a field that is already narrow.
//
// TYPING IS READ WHEN THE FIELD IS LEFT, not on every key. A half-typed date is not a date, and
// writing one back put the invoice in the year 2 on the way to 2026. The short forms — 27, 2707,
// 270726 — are read against the date the field is ALREADY holding, so correcting the day of a
// back-dated invoice does not drag it into this month.

import * as React from 'react'

import { TextField } from '@busy/ui/TextField'
import { dayFromText, dayText } from '../../lib/day'
import { actionFor } from '../../lib/shortcuts'
import { DatePanel, type DatePick } from './DatePanel'

// THE SAME BOX THE OTHER HEADER FIELDS WEAR. Written out here rather than guessed at: a date
// field that is a hair taller than the number beside it is the sort of thing nobody reports and
// everybody sees.
const BOX =
  'flex h-control items-center rounded-control border border-stroke bg-surface focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-stroke-focus'

export function DateField({
  label,
  value,
  opensOn,
  onPick,
  picks,
  earliest = null,
  earliestMessage = '',
  placeholder,
  instalments = false,
  onOpenSchedule,
  children,
}: {
  label: string
  value: string
  /** Where the calendar opens when the field is empty — see DatePanel. */
  opensOn: string
  onPick: (day: string) => void
  picks: readonly DatePick[]
  earliest?: string | null
  earliestMessage?: string
  placeholder?: string
  /** REGION FOUR, AND IT IS A PROP RATHER THAN A REWRITE LATER. Once an invoice is split into
   * instalments there is no single due date, so the field reads "Multiple" and stops taking a
   * date — selecting it opens the schedule instead, which is where the several dates live. */
  instalments?: boolean
  onOpenSchedule?: () => void
  children?: React.ReactNode
}) {
  const box = React.useRef<HTMLDivElement>(null)
  const [open, setOpen] = React.useState(false)

  // IT OPENS ON A DELIBERATE ACT, NEVER ON BARE FOCUS.
  //
  // Opening on focus reads well and behaves badly, because focus is exactly what two panels pass
  // between them. Closing handed the keyboard back to the field, which re-opened it, so a pick
  // could never take — and once both fields existed, clicking from one to the other left the
  // second one open to a click that should have shut it. A guard was tried for the first and did
  // not survive the second.
  //
  // A click opens it, and so does Down, which is what opens every other list on this screen. The
  // keyboard is not lost: typing the date is the fast path and needs no panel at all.
  // THE FIELD HOLDS THE TEXT, AND THE BLUR ALWAYS REWRITES IT.
  //
  // This was a `defaultValue` keyed on the stored day, which reformats only when that day
  // CHANGES — so typing a date the field already held left the raw keystrokes sitting there:
  // "270726" stayed "270726" because it parsed to the day already stored and nothing remounted.
  // Rubbish stayed on screen for the same reason.
  const [text, setText] = React.useState(value === '' ? '' : dayText(value))
  const shown = value === '' ? '' : dayText(value)
  const wasValue = React.useRef(value)
  React.useEffect(() => {
    if (wasValue.current !== value) {
      wasValue.current = value
      setText(shown)
    }
  }, [value, shown])

  function readWhatWasTyped() {
    if (text.trim() === '') return
    const read = dayFromText(text, value === '' ? undefined : value)
    // A DATE THAT IS NOT ONE GOES BACK TO WHAT WAS THERE. Leaving half a date in the field says
    // the invoice carries it, and it does not.
    if (read === null) {
      setText(shown)
      return
    }
    setText(dayText(read))
    onPick(read)
  }

  if (instalments) {
    return (
      <div ref={box} className={BOX}>
        <TextField aria-label={label} value="Multiple" readOnly onFocus={onOpenSchedule} onClick={onOpenSchedule} />
      </div>
    )
  }

  return (
    <>
      <div ref={box} className={BOX}>
        <TextField
          aria-label={label}
          // The field IS the control that opens the calendar, so arriving at it by any route
          // opens it — clicking, or the keyboard walking here.
          onClick={() => setOpen(true)}
          onKeyDown={(event) => {
            if (actionFor(event, 'grid') !== 'move-down') return
            event.preventDefault()
            setOpen(true)
          }}
          {...(placeholder === undefined ? {} : { placeholder })}
          value={text}
          onChange={(event) => setText(event.target.value)}
          // ON LEAVING, NOT ON EVERY KEY. A half-typed date is not a date, and writing one back
          // put the invoice in the year 2 on the way to 2026.
          onBlur={readWhatWasTyped}
        />
      </div>

      <DatePanel
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={box}
        label={label}
        value={value}
        opensOn={opensOn}
        onPick={onPick}
        picks={picks}
        earliest={earliest}
        earliestMessage={earliestMessage}
      >
        {children}
      </DatePanel>
    </>
  )
}
