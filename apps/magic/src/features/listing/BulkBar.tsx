// What you can do to the rows you have picked. It takes the AI button's slot in the summary
// bar the moment anything is selected: picking rows means acting on them, not reading about
// them, and one slot with contents decided by mode is how the row gutter already works.
//
// NOTHING HERE IS ENABLED AND SILENT. Print, Share, Download PDF, Send Reminder and Delete
// were all live with no handler, so a press did nothing and left the person deciding whether
// the product was broken or they were. Same rule as the shell's night-mode button: say why.
//
// THE REASONS ARE DERIVED, NOT DECLARED. The two generate actions said "Needs e-invoice status
// on the invoice", which was true when it was written and stopped being true the day the
// fields landed — and went on being shown. They now ask the selected invoices.
//
// IT IS THE TOTALS BAR while anything is picked. The two bottom strips became one, and the
// figures give way to the actions rather than being covered by them: mid-selection the page
// total is not what anybody is reading, and a bar floating over a total hides a number somebody
// might be about to act on. It takes the whole width because the table is given no figures at
// all while a selection is live.
//
// DARK, WHICH IS THE ONE PLACE ON THIS SCREEN THAT IS. It is a temporary surface over the page
// and has to be told apart from it instantly. Nothing in it reads by colour alone.

import * as React from 'react'

import { cn } from '@busy/ui/cn'
import { Button } from '@busy/ui/Button'
import { Icon, type IconName } from '@busy/ui/Icon'
import { Popover } from '@busy/ui/Popover'
import type { Invoice } from '../../data/schema/invoice'
import { cannotGenerate, type ComplianceId } from './filtering'
import { NotBuiltMark, NotBuiltNote } from '@busy/ui/NotBuilt'
import { MenuItem } from './MenuItem'
import { useListing } from './store'

/** Everything here needs something this front end does not have. Said once. */
const notBuilt = (what: string) => `${what} is not built yet`

const PRIMARY: { label: string; icon: IconName; reason: string }[] = [
  { label: 'Print', icon: 'printer', reason: notBuilt('Printing') },
  { label: 'Share', icon: 'share', reason: notBuilt('Sharing') },
  { label: 'Download PDF', icon: 'download', reason: notBuilt('The PDF template') },
  { label: 'Send Reminder', icon: 'bell', reason: notBuilt('Reminders') },
]

/** Setting one field on every picked invoice at once. Its own menu because these four are the
 * same kind of act, which a flat row of buttons cannot say. */
const UPDATES = [
  { label: 'Transporter', reason: 'Transport details are not on the invoice yet' },
  { label: 'Billing / Shipping Address', reason: 'An address is not on the invoice yet' },
  { label: 'Optional Fields', reason: 'Optional fields are not on the invoice yet' },
  { label: 'Change Template', reason: notBuilt('Print templates') },
]

const GENERATE: { label: string; which: ComplianceId }[] = [
  { label: 'Generate E-Invoice', which: 'eInvoice' },
  { label: 'Generate E-Way Bill', which: 'eWayBill' },
]

/** Read off the sentence rather than declared beside it, so the two can never disagree. */
const isNotBuilt = (reason?: string) => reason !== undefined && reason.endsWith('is not built yet')

function DarkButton({ children, onClick, reason, buttonRef, expanded }: {
  children: React.ReactNode
  onClick?: () => void
  reason?: string
  buttonRef?: React.Ref<HTMLButtonElement>
  expanded?: boolean
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={reason !== undefined}
      title={reason}
      {...(expanded === undefined ? {} : { 'aria-expanded': expanded, 'aria-haspopup': 'dialog' as const })}
      className="flex h-control-sm items-center gap-2 rounded-control px-3 text-body whitespace-nowrap text-surface hover:bg-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

/** Why a generate action cannot run over the whole selection: it needs at least one invoice it
 * would actually do something to. Asking the invoices rather than declaring a sentence is what
 * stops this going stale the way its predecessor did. */
function generateReason(picked: Invoice[], which: ComplianceId): string {
  const can = picked.filter((invoice) => cannotGenerate(invoice, which) === null)
  if (can.length > 0) return notBuilt('Generating from the listing')
  return which === 'eInvoice'
    ? 'None of the picked invoices is waiting on an e-invoice'
    : 'None of the picked invoices is waiting on an e-way bill'
}

export function BulkBar({ atFoot = false }: { atFoot?: boolean }) {
  const selected = useListing((state) => state.selected)
  const invoices = useListing((state) => state.invoices)
  const clearSelection = useListing((state) => state.clearSelection)
  const update = React.useRef<HTMLButtonElement>(null)
  const more = React.useRef<HTMLButtonElement>(null)
  const [updating, setUpdating] = React.useState(false)
  const [overflowing, setOverflowing] = React.useState(false)

  if (selected.length === 0) return null
  const picked = invoices.filter((invoice) => selected.includes(invoice.id))

  return (
    <div
      role="toolbar"
      aria-label={`Actions for ${selected.length} selected invoices`}
      // THE CARD'S OWN BOTTOM CORNERS, BUT ONLY WHEN IT IS AT THE CARD'S BOTTOM. The bar is a
      // dark strip bled out to the edges of the totals cell, and when the list is short it IS
      // the foot of the card — with square corners its ink filled in the card's rounded ones and
      // the card read as a rectangle the moment anything was selected.
      //
      // Rounding it unconditionally is wrong in the commoner case. On a full page the totals row
      // is stuck part way up the card, and a rounded dark bar there reads as a pill floating
      // over the rows rather than as the foot of anything. Measured on a 1280x800 window: at
      // rest the card's bottom is 1px below the bar; stuck, it is 303px below.
      className={cn(
        '-my-1.5 -mx-3 flex items-center gap-1 bg-ink px-3 py-1.5',
        atFoot && 'rounded-b-card',
      )}
    >
      {/* The count and the way out are pinned; only the actions between them scroll. They were
          inside the scrolling strip at first, and at 1280 the Clear button scrolled off the
          end — a selection you cannot let go of. */}
      <span className="shrink-0 px-2 text-body font-label whitespace-nowrap text-surface">
        {selected.length} selected
      </span>
      <span className="mx-1 h-6 w-px shrink-0 bg-ink-muted" />

      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {/* MARKS, NOT A NOTE, and the difference is a rule rather than a preference. The note
            is for a surface where NOTHING is available; this bar has three live doors in it —
            Update, More and Clear — so a line saying "not built yet" across the top of it would
            be false about the bar it sits on. The mark rides on `currentColor`, so it reads on
            this bar's ink without a second colour decision. */}
        {PRIMARY.map((action) => (
          <DarkButton key={action.label} reason={action.reason}>
            {isNotBuilt(action.reason) ? <NotBuiltMark /> : <Icon name={action.icon} />}
            {action.label}
          </DarkButton>
        ))}

        <DarkButton buttonRef={update} expanded={updating} onClick={() => setUpdating((was) => !was)}>
          <Icon name="copy" />
          Update
          <Icon name="chevronDown" />
        </DarkButton>

        <DarkButton reason={notBuilt('Deleting invoices')}>
          <NotBuiltMark />
          Delete
        </DarkButton>

        <DarkButton buttonRef={more} expanded={overflowing} onClick={() => setOverflowing((was) => !was)}>
          <Icon name="more" />
          <span className="sr-only">More actions</span>
        </DarkButton>
      </div>

      <span className="mx-1 h-6 w-px shrink-0 bg-ink-muted" />

      <Button variant="ghost" size="sm" onClick={clearSelection} className="shrink-0 text-surface hover:bg-ink-secondary">
        <Icon name="close" />
        Clear
      </Button>

      <Popover open={updating} onClose={() => setUpdating(false)} anchorRef={update} label="Update the selected invoices">
        <div role="menu" aria-label="Update" className="w-72 py-1">
          {/* Every line here is unavailable, so it is said once at the top rather than four
              times down the list. Two of the four are product gaps and two are fields the
              invoice does not carry yet — which is the same sentence from the reader's side:
              nothing here is about the invoices they picked. */}
          <NotBuiltNote />
          <div className="border-t border-stroke pt-1">
            {UPDATES.map((entry) => (
              <MenuItem key={entry.label} kind="command" disabled reason={entry.reason}>
                {entry.label}
              </MenuItem>
            ))}
          </div>
        </div>
      </Popover>

      <Popover open={overflowing} onClose={() => setOverflowing(false)} anchorRef={more} label="More actions">
        <div role="menu" aria-label="More actions" className="w-72 py-1">
          {GENERATE.map((entry) => (
            <MenuItem key={entry.label} kind="command" disabled reason={generateReason(picked, entry.which)}>
              {entry.label}
            </MenuItem>
          ))}
        </div>
      </Popover>
    </div>
  )
}
