// The note on the invoice. Closed until somebody wants it.
//
// v2's shape, kept: a chevron and the word, the chevron turning over when it opens, and a
// plain text area reading "Add a note for this invoice…". It is not a card — it is a line you
// can open, sitting under the charges, and it carries no border of its own.
//
// WHAT IS NEW IS THE PRINTED/INTERNAL CHOICE, and it lives INSIDE the opened state. A note
// that goes on the customer's copy and a note for the office are different things and always
// were; v2 had no way to say which. It is muted and carries no weight, because it is a
// property of a note most people will never change.

import { useState } from 'react'

import { Icon } from '@busy/ui/Icon'
import { Tabs } from '@busy/ui/Tabs'
import { useInvoice } from './store'

/** Printed goes on the customer's copy; Internal stays in the office. Declared out here so the
 * two are one list rather than two branches of a ternary that can disagree. */
const NOTE_SEEN_BY = [
  { value: 'printed' as const, label: 'Printed' },
  { value: 'internal' as const, label: 'Internal' },
]

export function Narration() {
  const narration = useInvoice((state) => state.narration)
  const printed = useInvoice((state) => state.narrationPrinted)
  const setNarration = useInvoice((state) => state.setNarration)
  const setPrinted = useInvoice((state) => state.setNarrationPrinted)
  const [open, setOpen] = useState(false)

  return (
    <section aria-label="Narration" className="min-w-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
        className="flex w-full items-center gap-2 rounded-control px-3 py-1 text-sm font-strong text-ink-secondary hover:bg-surface-hover focus-ring"
      >
        <Icon name="chevronDown" className={`size-icon-sm ${open ? 'rotate-180' : ''}`} />
        Narration
        {/* Closed, the first words stand in for the note, so an invoice that HAS one does not
            look like an invoice that has not. */}
        {!open && narration.trim() !== '' ? (
          <span className="truncate font-body text-ink-muted">— {narration}</span>
        ) : null}
      </button>

      {open ? (
        <div className="px-3 pb-3">
          <textarea
            aria-label="Narration"
            value={narration}
            onChange={(event) => setNarration(event.target.value)}
            placeholder="Add a note for this invoice…"
            rows={2}
            className="w-full resize-none rounded-control border border-stroke bg-surface px-2 py-1 text-body leading-body text-ink outline-none placeholder:text-ink-muted focus-ring"
          />

          {/* Two words and a switch, in the smallest size, in muted ink. Whether the customer
              sees this note is worth being able to say and is not worth a heading.
              `bare` is Tabs with the well taken off — the look this was hand-drawn as, and the
              arrow keys it never had. Written by hand it was two `aria-pressed` buttons, which
              says "two things you can push in" rather than "one choice out of two", and put both
              of them in the tab order on the way past a note most people never open. */}
          <div className="mt-1">
            <Tabs
              look="bare"
              label="Who sees this note"
              value={printed ? 'printed' : 'internal'}
              onChange={(which) => setPrinted(which === 'printed')}
              options={NOTE_SEEN_BY}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
