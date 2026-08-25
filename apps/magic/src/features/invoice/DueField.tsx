// The Due field, which is not a field until it has a reason to be.
//
// OUT OF HeaderFields.tsx, which crossed the 250-line cap when the five states landed. The cap was
// right about which half had grown: that file lays out a row of four boxes, and this is one box
// with a rule behind it that nothing else on the row has.
//
// FIVE STATES, AND TWO OF THEM ARE NO FIELD AT ALL — see dueField.ts for which and why. Absent
// rather than disabled, because a greyed box is a promise that it works once you do something and
// there is nothing to do: the sale is settled where it stands.
//
// IT IS ALSO THE SPLIT'S READ-BACK. A split invoice has no single due date, so the field reads
// "Multiple" and opening it shows the schedule — v2's own wording, and v2's own distinction that
// it is a DOOR rather than a dead end.

import { useEffect } from 'react'

import { dayText, daysAfter } from '../../lib/day'
import { DateField } from './DateField'
import { dueFieldFor } from './dueFieldState'
import { FieldSettings } from './FieldSettings'
import { MetaField } from './MetaField'
import { useInvoice } from './store'

/** The document's terms, so the picker and the Default Due Date setting behind the label offer the
 * same words. */
const DUE_TERMS = [
  { id: 'none', label: 'No due date' },
  { id: 'onReceipt', label: 'On receipt' },
  { id: 'net15', label: '15 days' },
  { id: 'net30', label: '30 days' },
]

const DAYS: Record<string, number> = { onReceipt: 0, net15: 15, net30: 30 }

export function DueField({ onOpenSettings }: { onOpenSettings: () => void }) {
  const date = useInvoice((state) => state.date)
  const dueDate = useInvoice((state) => state.dueDate)
  const setDueDate = useInvoice((state) => state.setDueDate)
  const party = useInvoice((state) => state.party)
  const splitParts = useInvoice((state) => state.splitParts)
  const askForSplit = useInvoice((state) => state.askForSplit)

  // THE DOCUMENT'S SEVEN TERMS, and every one counts from the INVOICE date, never from today: a
  // back-dated invoice with Net 30 is due thirty days after it was raised.
  //
  // Party credit days is READ, never worked out. It is a term agreed with the customer and it
  // lives on the party master; a front end that guessed a house default would be inventing one.
  const creditDays = party?.creditDays ?? 0
  const duePicks = [
    ...(creditDays === 0 ? [] : [{ label: `Party credit days (${creditDays})`, day: daysAfter(date, creditDays) }]),
    { label: 'Invoice date', day: date },
    ...[15, 30, 60, 90].map((days) => ({ label: `Net ${days}`, day: daysAfter(date, days) })),
  ]

  // WHOSE ANSWER THE DATE IS. The party's own terms, else the company's default, else nobody's —
  // and for two of the five there is no field at all.
  const due = dueFieldFor({
    party,
    invoiceDate: date,
    // The company's default is not a setting the drawer offers yet, so there is none to read and
    // `null` is the honest answer rather than a number invented here. When the setting arrives it
    // is one line, and the fifth state stops being the common one.
    companyDefaultDays: null,
  })

  // THE FIELD FILLS ITSELF WHEN THE ANSWER CHANGES, and only when it has one. A party with terms
  // arrives with a date; picking a counter party takes the date away with the field, because a
  // due date left behind on an invoice that has no field to show it is a value nobody can see or
  // correct.
  useEffect(() => {
    if (!due.shown) {
      if (dueDate !== '') setDueDate('')
      return
    }
    if (due.value !== '' && dueDate === '') setDueDate(due.value)
  }, [due, dueDate, setDueDate])

  // A SPLIT INVOICE ALWAYS HAS THE FIELD, whatever the party rule says. Being split is a fact
  // about the INVOICE — it has several due dates — and the read-back is the only place on the
  // screen that says so. Measured: without this, splitting before picking a party took "Multiple"
  // off the screen and left no way back to the schedule except the door beside the total.
  const split = splitParts.length > 1

  // ABSENT AND NOT DISABLED, for two of the five states — no party, and a party who settles at
  // the counter. A greyed box is a promise that it works once you do something, and there is
  // nothing to do. See dueFieldState.ts for all five.
  if (!due.shown && !split) return null

  return (
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
    {/* THE FIELD IS THE SPLIT'S READ-BACK, NOT ITS DOOR. A split invoice has no single due
        date, so the field reads "Multiple" and opening it shows the schedule — v2's own
        wording. It is a DOOR and not a dead end, which is v2's distinction and the reason it
        stays a control rather than going flat: a cell reading Multiple that cannot be opened
        is a state you can see and not reach. */}
    {splitParts.length > 1 ? (
      <button
        type="button"
        aria-label={`Due date — split across ${splitParts.length} dates. Open the schedule.`}
        title={splitParts.map((part) => dayText(part.due)).join(' · ')}
        onClick={askForSplit}
        className="h-control w-full rounded-control border border-stroke bg-surface-sunken px-2 text-left text-body text-ink-secondary hover:border-stroke-strong focus-ring"
      >
        Multiple
      </button>
    ) : (
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
      )}
    </MetaField>
  )
}
