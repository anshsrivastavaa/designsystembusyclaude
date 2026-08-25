// One credit on the settlement panel: a tick, what kind it is, its reference, what is available
// and what to adjust now.
//
// ITS OWN FILE because the panel is three sections and a foot, and a row is a different thing
// from a panel — and because this row is the one part of the surface the listing and the party
// master will both want when they grow their own view of a party's credits.
//
// THE AMOUNT FIELD IS ONLY THERE WHEN THE ROW IS TICKED. An amount box beside an unticked row is
// a control that does nothing until you find the tick, and a person who types into it has said
// what they want twice.

import { Checkbox } from '@busy/ui/Checkbox'
import { formatPaise } from '../../lib/money'
import type { Credit } from '../../data/schema/credit'

export function SettlementRow({
  credit,
  label,
  adjustedPaise,
  onToggle,
  onAmount,
}: {
  credit: Credit
  label: string
  /** Undefined means not ticked. One representation, so the tick and the amount cannot
   * disagree — see settlementSums.ts. */
  adjustedPaise: number | undefined
  onToggle: (on: boolean) => void
  onAmount: (typed: string) => void
}) {
  const on = adjustedPaise !== undefined

  return (
    <li className="flex items-center gap-2 text-sm">
      <Checkbox checked={on} onChange={(event) => onToggle(event.target.checked)} aria-label={`Use this ${label}`} />
      <span className="w-24 shrink-0 truncate text-ink">{label}</span>
      {/* ON ACCOUNT HAS NO DOCUMENT NAMING WHAT IT WAS FOR — that is the whole of what "on
          account" means. A dash reads as an answer; a blank reads as a field nobody filled in. */}
      <span className="min-w-0 flex-1 truncate text-ink-secondary">
        {credit.reference === '' ? '—' : credit.reference}
      </span>
      <span className="w-24 shrink-0 text-right text-ink-secondary">{formatPaise(credit.availablePaise)}</span>
      {on ? (
        <input
          inputMode="decimal"
          aria-label={`Adjust from this ${label}`}
          value={formatPaise(adjustedPaise)}
          onChange={(event) => onAmount(event.target.value)}
          className="h-control-sm w-24 shrink-0 rounded-control border border-stroke bg-surface px-2 text-right focus-ring"
        />
      ) : (
        // The column keeps its width whether the row is ticked or not, or every figure in the
        // column above steps sideways the first time anything is picked.
        <span className="w-24 shrink-0" />
      )}
    </li>
  )
}
