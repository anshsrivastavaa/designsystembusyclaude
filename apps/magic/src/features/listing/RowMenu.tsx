// The kebab on a row. Fifteen actions in the product document; each one either works or says
// why not, and nothing in between.
//
// NOT ONE OF THESE MAY BE ENABLED AND SILENT. Print, Download PDF, Share, Duplicate and Audit
// Trail sat here live with no handler behind them, so pressing Print did nothing at all and
// left the person deciding whether the product was broken or they were. The rule is already
// written in this codebase, on the shell's night-mode button: nothing is disabled without
// saying why, and nothing is enabled without doing something.
//
// THE REASONS ARE READ FROM THE INVOICE, NOT DECLARED. There was a second `needsCompliance`
// in this file returning the string "Needs e-invoice status on the invoice" — which was true
// when it was written, stopped being true the day the fields landed, and went on being shown.
// A reason that is a hard-coded sentence cannot go stale quietly; one derived from the record
// in front of it cannot go stale at all.
//
// TWO GENERATE ACTIONS, NOT THREE. The document lists Generate E-Invoice, Generate E-Way Bill,
// and a combined one. The third is the first two pressed in order, and a menu of fifteen that
// contains its own items twice is a menu nobody finishes reading.

import * as React from 'react'

import { Button } from '@busy/ui/Button'
import { Icon } from '@busy/ui/Icon'
import { Popover } from '@busy/ui/Popover'
import type { Invoice } from '../../data/schema/invoice'
import { cannotGenerate } from './filtering'
import { NotBuiltNote } from '@busy/ui/NotBuilt'
import { MenuItem } from './MenuItem'
import { balanceOf, isCancelled } from '../../lib/payment'

/** Null means it can be done on this invoice. A string is why it cannot. */
type Reason = (invoice: Invoice) => string | null

const cancelled: Reason = (invoice) => (isCancelled(invoice) ? 'This invoice is cancelled' : null)
const nothingOwed: Reason = (invoice) =>
  balanceOf(invoice) === 0 ? 'Nothing is outstanding on this invoice' : null

/** Everything here needs something this front end does not have — a print engine, a mail
 * server, a PDF renderer, a screen to open. Said once, so it cannot be said differently in
 * two places. */
const NOT_BUILT = (what: string): Reason => () => `${what} is not built yet`

/** A reason that came from NOT_BUILT rather than from the invoice. Read off the sentence rather
 * than declared beside it, so the two can never disagree — the same discipline the reasons
 * themselves already follow. */
const isNotBuilt = (reason: string | null) => reason !== null && reason.endsWith('is not built yet')

const ENTRIES: { label: string; reason: Reason }[] = [
  { label: 'Print', reason: NOT_BUILT('Printing') },
  { label: 'Download PDF', reason: NOT_BUILT('The PDF template') },
  { label: 'Share', reason: NOT_BUILT('Sharing') },
  { label: 'Duplicate', reason: NOT_BUILT('Creating an invoice from another one') },
  { label: 'Generate E-Invoice', reason: (invoice) => cannotGenerate(invoice, 'eInvoice') },
  { label: 'Generate E-Way Bill', reason: (invoice) => cannotGenerate(invoice, 'eWayBill') },
  { label: 'Receive Payment', reason: (invoice) => cancelled(invoice) ?? nothingOwed(invoice) ?? NOT_BUILT('Receiving a payment')(invoice) },
  { label: 'Send Payment Link', reason: (invoice) => cancelled(invoice) ?? nothingOwed(invoice) ?? NOT_BUILT('Payment links')(invoice) },
  { label: 'Send Reminder', reason: (invoice) => cancelled(invoice) ?? nothingOwed(invoice) ?? NOT_BUILT('Reminders')(invoice) },
  { label: 'Sale Return', reason: (invoice) => cancelled(invoice) ?? NOT_BUILT('Sale returns')(invoice) },
  { label: 'Credit Note', reason: (invoice) => cancelled(invoice) ?? NOT_BUILT('Credit notes')(invoice) },
  { label: 'Audit Trail', reason: NOT_BUILT('The audit trail') },
  { label: 'Cancel', reason: (invoice) => cancelled(invoice) ?? NOT_BUILT('Cancelling an invoice')(invoice) },
  { label: 'Delete', reason: (invoice) => cancelled(invoice) ?? NOT_BUILT('Deleting an invoice')(invoice) },
]

export function RowMenu({ invoice }: { invoice: Invoice }) {
  const button = React.useRef<HTMLButtonElement>(null)
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        ref={button}
        variant="ghost"
        size="icon-sm"
        aria-label={`More actions for ${invoice.number}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((was) => !was)}
      >
        <Icon name="more" />
      </Button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={button} label={`Actions for ${invoice.number}`} align="end">
        <div role="menu" aria-label={`Actions for ${invoice.number}`} className="w-72 py-1">
          {(() => {
            const reasons = ENTRIES.map((entry) => ({ entry, reason: entry.reason(invoice) }))
            // SAID ONCE WHEN IT IS TRUE OF EVERYTHING. Fourteen rows each carrying the same mark
            // is the shout this treatment exists to stop; one line at the top carries it for the
            // surface. Where SOME rows are live, the note does not appear at all and the mark on
            // the individual rows is the honest answer.
            const allUnbuilt = reasons.every(({ reason }) => isNotBuilt(reason))

            return (
              <>
                {allUnbuilt ? <NotBuiltNote /> : null}
                <div className={allUnbuilt ? 'border-t border-stroke pt-1' : undefined}>
                  {reasons.map(({ entry, reason }) => (
                    <MenuItem
                      key={entry.label}
                      kind="command"
                      disabled={reason !== null}
                      notBuilt={!allUnbuilt && isNotBuilt(reason)}
                      reason={reason ?? ''}
                    >
                      {entry.label}
                    </MenuItem>
                  ))}
                </div>
              </>
            )
          })()}
        </div>
      </Popover>
    </>
  )
}
