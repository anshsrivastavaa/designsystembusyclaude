// The bar across the bottom, and it does ONE job: actions.
//
// v2's arrangement, and it is the single biggest structural difference between the two
// screens: v2 has a fixed bar, ours had Save floating in the page header where it read as a
// page title's neighbour rather than as the end of a task.
//
// LEFT IS STATE, RIGHT IS ACTION. Unpaid or Paid, the derived part-paid chip, and the two
// compliance switches on the left; Hold and Save on the right. Everything at one control
// height — that rhythm is the whole point of a bar rather than a stack.
//
// PARTLY PAID IS A CHIP, NEVER A THIRD TAB. Unpaid and Paid are things you set; part-paid is
// what the arithmetic says, and a tab you cannot choose is a tab that lies about being one.
//
// IT IS THE ONE PINNED THING ON THIS SCREEN. The header, the party row, the grid and the
// footer all scroll past together; this stays, because an action you cannot reach is an action
// you scroll to find.

import { Button } from '@busy/ui/Button'
import { Shortcut } from '@busy/ui/Shortcut'
import { Toggle } from '@busy/ui/Toggle'
import { formatPaise } from '../../lib/money'

export type ActionBarProps = {
  paid: boolean
  onPaid: (paid: boolean) => void
  /** What is left to collect. Zero means nothing is outstanding. */
  balancePaise: number
  eWayBill: boolean
  onEWayBill: (on: boolean) => void
  eInvoice: boolean
  onEInvoice: (on: boolean) => void
  onHold: () => void
  onSave: () => void
  saving: boolean
  /** What just happened, or what went wrong. Sits with the button that caused it. */
  message?: string | null
  refused?: boolean
}

export function ActionBar({
  paid,
  onPaid,
  balancePaise,
  eWayBill,
  onEWayBill,
  eInvoice,
  onEInvoice,
  onHold,
  onSave,
  saving,
  message,
  refused = false,
}: ActionBarProps) {
  const partly = !paid && balancePaise > 0

  return (
    <div
      aria-label="Invoice actions"
      className="sticky bottom-0 z-20 flex shrink-0 flex-wrap items-center gap-3 rounded-card border border-stroke bg-surface px-3 py-2"
    >
      <div role="group" aria-label="Payment state" className="flex h-control items-center rounded-control bg-surface-sunken p-0.5">
        {(['Unpaid', 'Paid'] as const).map((which) => {
          const chosen = (which === 'Paid') === paid
          return (
            <button
              key={which}
              type="button"
              aria-pressed={chosen}
              onClick={() => onPaid(which === 'Paid')}
              className={`h-full rounded-control px-3 text-body focus-visible:outline focus-visible:outline-2 focus-visible:outline-stroke-focus ${
                chosen ? 'bg-surface font-label text-ink shadow-raised' : 'text-ink-secondary'
              }`}
            >
              {which}
            </button>
          )
        })}
      </div>

      {partly ? (
        // DERIVED, and it says so by being a chip rather than a control. Nobody sets this.
        <span className="flex h-control items-center rounded-pill border border-stroke px-3 text-sm text-ink-secondary">
          Partly paid · balance {formatPaise(balancePaise)}
        </span>
      ) : null}

      <span className="flex h-control items-center rounded-control border border-stroke px-3 text-sm text-ink-secondary">
        <Toggle checked={eWayBill} onCheckedChange={onEWayBill}>
          E-Way Bill
        </Toggle>
      </span>
      <span className="flex h-control items-center rounded-control border border-stroke px-3 text-sm text-ink-secondary">
        <Toggle checked={eInvoice} onCheckedChange={onEInvoice}>
          E-Invoice
        </Toggle>
      </span>

      <span className="flex-1" />

      {message == null ? null : (
        <span role={refused ? 'alert' : 'status'} className={`max-w-xs text-sm ${refused ? 'text-danger' : 'text-success'}`}>
          {message}
        </span>
      )}

      <Button variant="ghost" onClick={onHold}>
        Hold
      </Button>
      {/* Save keeps its emphasis, the way the party field does in the header: it is the end of
          the task and the only thing on this bar anybody presses twice. */}
      <Button size="lg" aria-busy={saving} onClick={onSave}>
        {saving ? 'Saving…' : 'Save'}
        {/* strong, because this one sits ON the filled Save button rather than on the page. */}
        <Shortcut keyName="F2" tone="strong" className="ml-1" />
      </Button>
    </div>
  )
}
