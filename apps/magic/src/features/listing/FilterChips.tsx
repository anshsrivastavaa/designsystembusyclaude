// What is narrowing the list, when the control that set it is out of sight.
//
// THE RULE, WRITTEN DOWN BECAUSE IT IS WHAT KEEPS THIS ROW MEANING ONE THING: a narrowing gets
// a chip only when its own control is hidden behind a menu or a drawer. The status tabs, the
// compliance ticks and the period button are all on the screen saying their own state, so a
// chip for them would repeat what is already visible. What lives in here is everything you
// would otherwise have to go hunting through a popover to find and undo.
//
// NOT A COUNT ON THE FILTERS BUTTON. "(2)" tells you that something is on and nothing about
// what — so the failure that matters, seeing six rows of sixty-five and not knowing why,
// becomes a click and then a hunt through a popover. A chip that names its filter and clears
// itself makes that failure impossible to have. The people using this are a mix of young and
// older operators; a badge you have to decode is the wrong end of that range to design for.
//
// The row exists only when something is set, so it costs nothing when nothing is.

import { Button } from '@busy/ui/Button'
import { Chip } from '@busy/ui/Chip'
import { Icon } from '@busy/ui/Icon'
import { formatPaise } from '../../lib/money'
import type { AmountTest } from './filtering'
import { GROUP_LABEL, useListing } from './store'

/** THE Chip, with a clear button inside it — not a second chip.
 *
 * This declared its own `Chip` while packages/ui/Chip.tsx is the primitive and the Status
 * column already imports it. Two components with one name is the first duplicate in a build
 * whose stated worst failure was 158 duplicate definitions, and it arrived exactly the way
 * that one did: the primitive did not have the one extra thing this use wanted, so a local
 * copy grew instead. It did not need a copy — a chip that can be cleared is the chip with a
 * button in it. */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Chip className="h-control-sm pr-1 pl-3">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="grid size-control-sm place-items-center rounded-control text-ink-muted hover:bg-surface-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus"
      >
        <Icon name="close" className="size-icon-sm" />
      </button>
    </Chip>
  )
}

/** Read back the way it was set: both ends, one end, or the other. "Invoice amount over
 * 10,000" is a sentence; "Invoice amount > 10000" is a query. */
function amountLabel(name: string, test: AmountTest): string {
  if (test.min !== null && test.max !== null) return `${name} ${formatPaise(test.min)} – ${formatPaise(test.max)}`
  if (test.min !== null) return `${name} over ${formatPaise(test.min)}`
  return `${name} under ${formatPaise(test.max ?? 0)}`
}

export function FilterChips() {
  const state = useListing()

  const chips: { label: string; onRemove: () => void }[] = []
  if (state.search !== '') chips.push({ label: `Search: ${state.search}`, onRemove: () => state.setSearch('') })
  if (state.party !== null) chips.push({ label: `Party: ${state.party}`, onRemove: () => state.setParty(null) })
  if (state.total !== null) chips.push({ label: amountLabel('Invoice amount', state.total), onRemove: () => state.setTotal(null) })
  if (state.pending !== null) chips.push({ label: amountLabel('Receivable', state.pending), onRemove: () => state.setPending(null) })
  if (state.groupBy !== 'none') chips.push({ label: `Grouped by ${GROUP_LABEL[state.groupBy]}`, onRemove: () => state.setGroupBy('none') })
  if (state.lineItems) chips.push({ label: 'Line items shown', onRemove: () => state.setLineItems(false) })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <FilterChip key={chip.label} label={chip.label} onRemove={chip.onRemove} />
      ))}
      {chips.length > 1 ? (
        <Button variant="ghost" size="sm" onClick={state.clearEverything}>
          Clear all
        </Button>
      ) : null}
    </div>
  )
}
