// The quick filters: the ones people reach for often, behind the Filters button.
//
// THREE LAYERS, AND NOTHING APPEARS IN TWO OF THEM. On screen is the status tabs and the two
// compliance chips, always visible. Quick is this popover. Advanced is the drawer behind it.
// A filter that is on screen does not also appear here — the compliance ticks were in both,
// which is two controls for one thing and a person wondering which is the real one. Written
// down because it is the rule a new filter places itself by.
//
// THIS POPOVER NEVER SCROLLS. Whatever does not fit at the smallest height we support belongs
// in Advanced. A menu that scrolls hides half of itself behind a gesture, and the half you
// cannot see is the half you forget you set.
//
// SIZED FOR THE SCREEN, NOT FOR ITS CONTENTS. Full-height fields and generous padding gave a
// popover the weight of a dialog for four filters — next to a table at 34px rows it read as a
// different product. Small controls, tighter rows, and a fixed width so it does not grow to
// whatever the longest label happens to be.
//
// MIN AND MAX, NOT AN OPERATOR. v2 asks for two plain fields. "= < >" is a widget you have to
// work out before you can type a number into it, and it cannot say "between" at all.

import * as React from 'react'

import { Button } from '@busy/ui/Button'
import { Icon } from '@busy/ui/Icon'
import { Popover } from '@busy/ui/Popover'
import { TextField } from '@busy/ui/TextField'
import { toPaise } from '../../lib/money'
import { AdvancedFilters } from './AdvancedFilters'
import type { AmountTest } from './filtering'
import { MenuFooterAction, MenuHeading } from './MenuItem'
import { useListing } from './store'

/** A money range. Two of these are the whole of the quick amount filtering, and they are one
 * control used twice rather than two that drift apart. */
function Range({
  label, test, onChange,
}: {
  label: string
  test: AmountTest | null
  onChange: (next: AmountTest | null) => void
}) {
  const set = (which: 'min' | 'max') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const typed = event.target.value.trim()
    const next: AmountTest = {
      min: test?.min ?? null,
      max: test?.max ?? null,
      [which]: typed === '' ? null : toPaise(typed),
    }
    // Both ends empty is not a filter. Left as an object it would print an empty chip and
    // count as something narrowing the list while narrowing nothing.
    onChange(next.min === null && next.max === null ? null : next)
  }

  const shown = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value / 100))

  return (
    <div className="px-3 py-1.5">
      <span className="mb-1 block text-sm text-ink-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-control-sm flex-1 rounded-control border border-stroke">
          <TextField
            inputMode="decimal"
            align="end"
            aria-label={`${label} minimum`}
            placeholder="Min"
            value={shown(test?.min)}
            onChange={set('min')}
          />
        </div>
        <span className="text-sm text-ink-muted">to</span>
        <div className="h-control-sm flex-1 rounded-control border border-stroke">
          <TextField
            inputMode="decimal"
            align="end"
            aria-label={`${label} maximum`}
            placeholder="Max"
            value={shown(test?.max)}
            onChange={set('max')}
          />
        </div>
      </div>
    </div>
  )
}

export function FilterMenu() {
  const state = useListing()
  const button = React.useRef<HTMLButtonElement>(null)
  const [open, setOpen] = React.useState(false)
  const [advanced, setAdvanced] = React.useState(false)

  return (
    <>
      {/* No count on the button. What is set shows as chips on the page, where each one names
          its filter and clears itself — seeing six rows of sixty-five and not knowing why is
          the failure that matters, and a number here makes finding out a click. */}
      <Button ref={button} variant="ghost" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((was) => !was)}>
        <Icon name="filter" />
        Filters
      </Button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={button} label="Filters">
        <div className="w-72 py-1">
          <MenuHeading>Amount</MenuHeading>
          <Range label="Invoice amount" test={state.total} onChange={state.setTotal} />
          <Range label="Receivable" test={state.pending} onChange={state.setPending} />

          <MenuHeading>Party</MenuHeading>
          <div className="px-3 pb-2">
            <div className="h-control-sm rounded-control border border-stroke">
              <TextField
                aria-label="Party name"
                placeholder="Any party"
                value={state.party ?? ''}
                onChange={(event) => state.setParty(event.target.value || null)}
              />
            </div>
          </div>
        </div>

        <MenuFooterAction
          onClick={() => {
            setOpen(false)
            setAdvanced(true)
          }}
        >
          Advanced filters
        </MenuFooterAction>
      </Popover>

      <AdvancedFilters open={advanced} onClose={() => setAdvanced(false)} />
    </>
  )
}
