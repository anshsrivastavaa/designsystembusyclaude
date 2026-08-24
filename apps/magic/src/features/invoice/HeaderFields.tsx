// What the invoice says about itself, on one line to the right of the party: Inv No, Date,
// Due, and the lorry.
//
// v2's arrangement, copied rather than derived. Party first because it is the first keystroke
// of every invoice, then the fields that are CHECKED rather than typed — the number and the
// date are already right nearly every time, so they sit where the eye confirms them and moves
// on. The lorry is the one Delivery & Transport control in v2 and it is the one here.
//
// EVERY LABEL IS A DOOR. What is optional about each field lives behind its own label, and a
// line appears under the field only when something other than the usual is in effect. That is
// what keeps four fields to four fields instead of four fields and nine controls.

import { useEffect, useState } from 'react'

import { Icon } from '@busy/ui/Icon'
import { TextField } from '@busy/ui/TextField'
import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import { dayText, daysAfter, monthStart, today } from '../../lib/day'
import { DateField } from './DateField'
import { FieldBox } from './FieldBox'
import { FieldSettings } from './FieldSettings'
import { InEffect } from './InEffect'
import { useInvoice } from './store'

// NO SECOND LINE UNDER A NAME. Export and Retail each carried a grey sentence saying what
// they were for, and between them they set the width of the whole panel. A series is named
// after the run of numbers it is, and the name is the whole of it.
const SERIES = [
  { id: 'Main', label: 'Main' },
  { id: 'Export', label: 'Export' },
  { id: 'Retail', label: 'Retail' },
]

// WHAT THE DATE FIELD CAN BE. v2 keeps exactly one choice here — the rest of what used to sit
// on this label (back-dated, future-dated) are allow / warn / block rules and belong to warning
// configuration, not to a field's own popover.
const DATE_CARRY = [
  { id: 'today', label: 'Today' },
  { id: 'last', label: 'The last invoice date' },
]

const DUE_TERMS = [
  { id: 'none', label: 'No due date' },
  { id: 'onReceipt', label: 'On receipt' },
  { id: 'net15', label: '15 days' },
  { id: 'net30', label: '30 days' },
]

const DAYS: Record<string, number> = { onReceipt: 0, net15: 15, net30: 30 }

/** The box every header field sits in: one label, one line for the field, one for what is in
 * effect. Written once because four fields with three different gaps read as four accidents. */
function MetaField({ width, children }: { width: string; children: React.ReactNode }) {
  // RELATIVE, because the label is positioned ON the field's border rather than stacked above
  // it. See FieldSettings.
  return <div className={`relative flex shrink-0 flex-col ${width}`}>{children}</div>
}

export function HeaderFields({ onOpenTransport, onOpenSettings }: { onOpenTransport: () => void; onOpenSettings: () => void }) {
  const series = useInvoice((state) => state.series)
  const number = useInvoice((state) => state.number)
  const numberAuto = useInvoice((state) => state.numberAuto)
  const date = useInvoice((state) => state.date)
  const dueDate = useInvoice((state) => state.dueDate)
  const setSeries = useInvoice((state) => state.setSeries)
  const offerNumber = useInvoice((state) => state.offerNumber)
  const setNumber = useInvoice((state) => state.setNumber)
  const setDate = useInvoice((state) => state.setDate)
  const setDueDate = useInvoice((state) => state.setDueDate)
  const party = useInvoice((state) => state.party)

  // READ, NEVER WORKED OUT. Credit days are a term agreed with the customer and they live on the
  // party master; with nobody picked yet there are no terms to offer, which is not the same as
  // terms of zero.
  const creditDays = party?.creditDays ?? 0

  // THE LAST INVOICE'S DATE IS THE BACKEND'S ANSWER TOO. It is offered only when there is one:
  // the first invoice in a fresh book has no last date, and a chip that lands on today while
  // claiming to be the last invoice date would be a control saying something untrue.
  const [lastInvoiceDate, setLastInvoiceDate] = useState<string | null>(null)
  useEffect(() => {
    void data.lastInvoiceDate().then((answer) => {
      if (!isRefusal(answer)) setLastInvoiceDate(answer)
    })
  }, [])

  // THE NUMBER COMES FROM THE SERIES, and asking again is what changing the series MEANS. It
  // never lands on a number somebody has typed — the slice guards that, not this.
  useEffect(() => {
    void data.nextInvoiceNumber(series).then((answer) => {
      if (!isRefusal(answer)) offerNumber(answer)
    })
  }, [series, offerNumber])

  // The date field holds text while it is being typed and only becomes a date when it is a
  // date. Writing every keystroke back would turn "2" into the year 2 on the way to 21-08.

  // THE PICKS ARE MADE HERE, because they are made of facts the panel has no business knowing.
  //
  // "Last Invoice Date" is offered ONLY when there is one — the document asks for it to carry
  // the date itself rather than sit as a bare label, so a person can see what they are choosing
  // before they choose it.
  const datePicks = [
    { label: 'Today', day: today() },
    { label: 'Yesterday', day: daysAfter(today(), -1) },
    // Backdating to the 1st is a common bookkeeping habit, which is why v2 offers it.
    { label: 'Month start', day: monthStart(today()) },
    ...(lastInvoiceDate === null
      ? []
      : [{ label: `Last Invoice Date: ${dayText(lastInvoiceDate)}`, day: lastInvoiceDate }]),
  ]

  // THE DOCUMENT'S SEVEN TERMS, so the picker and the Default Due Date setting behind the label
  // offer the same words. Every one of them counts from the INVOICE date, never from today: a
  // back-dated invoice with Net 30 is due thirty days after it was raised.
  //
  // Party credit days is READ, never worked out. It is a term agreed with the customer and it
  // lives on the party master; a front end that guessed a house default would be inventing one.
  const duePicks = [
    ...(creditDays === 0
      ? []
      : [{ label: `Party credit days (${creditDays})`, day: daysAfter(date, creditDays) }]),
    { label: 'Invoice date', day: date },
    ...[15, 30, 60, 90].map((days) => ({ label: `Net ${days}`, day: daysAfter(date, days) })),
  ]

  return (
    <div className="flex items-end gap-3">
      <MetaField width="w-52">
        <FieldSettings
          choices={SERIES}
          chosen={series}
          onChoose={setSeries}
          onOpenSettings={onOpenSettings}
        >
          Inv No
        </FieldSettings>
        <FieldBox>
          <TextField
            aria-label="Invoice number"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
          />
        </FieldBox>
        {/* Auto is what the number IS, so it is said under it rather than drawn as a badge
            beside it. Typing over the number is what turns it off, and then the line says the
            number is set by hand — which is the fact somebody needs at save. */}
        <InEffect>{numberAuto ? null : 'Set by hand'}</InEffect>
      </MetaField>

      <MetaField width="w-36">
        <FieldSettings
          choices={DATE_CARRY}
          chosen="today"
          onChoose={() => setDate(today())}
          onOpenSettings={onOpenSettings}
        >
          Date
        </FieldSettings>
        <DateField
          label="Invoice date"
          value={date}
          opensOn={today()}
          onPick={setDate}
          picks={datePicks}
        />
        {/* NO LINE UNDER THIS FIELD. "Not today" used to sit here and it is in no document and
            not in v2 — a date that is not today is not a problem, and announcing it is the
            subtext this screen does not have anywhere. The date itself says what the date is. */}
      </MetaField>

      <MetaField width="w-36">
        <FieldSettings
          choices={DUE_TERMS}
          chosen={dueDate === '' ? 'none' : 'onReceipt'}
          onChoose={(id) => {
            if (id === 'none') {
              setDueDate('')
              return
            }
            const at = new Date(`${date}T00:00:00Z`)
            at.setUTCDate(at.getUTCDate() + (DAYS[id] ?? 0))
            setDueDate(at.toISOString().slice(0, 10))
          }}
          onOpenSettings={onOpenSettings}
        >
          Due
        </FieldSettings>
        <DateField
          label="Due date"
          value={dueDate}
          // An empty due date opens on the INVOICE's month, which is where the terms start from.
          opensOn={date}
          onPick={setDueDate}
          picks={duePicks}
          earliest={date}
          earliestMessage={`A due date cannot be before the invoice date, ${dayText(date)}.`}
          // A dash, not today's date. An invoice with no term is not due today.
          placeholder="—"
        />
      </MetaField>

      {/* THE LORRY IS THE ONE TRANSPORT CONTROL. v2 retired the labelled button for it, and
          everything an E-Way Bill needs is behind this one icon. */}
      <button
        type="button"
        onClick={onOpenTransport}
        aria-label="Delivery and transport"
        title="Delivery & Transport — bill-to / ship-to and everything an E-Way Bill needs"
        className="mb-1 grid size-control shrink-0 place-items-center rounded-control border border-stroke text-ink-muted pressable hover:text-ink focus-ring"
      >
        <Icon name="transport" className="size-icon-lg" />
      </button>
    </div>
  )
}
