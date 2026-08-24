// The period the listing is showing, and what that period actually covers.
//
// EVERY OPTION PRINTS ITS OWN DATES. "This quarter" means two different things to two people
// in the same room, and "Current FY" means nothing at all to somebody who has just switched
// books. One quiet line under the name removes the question rather than answering it later.
//
// The custom range sits at the foot, because it is the answer for the one time in twenty that
// none of the eight fit — putting it first would make everybody read past it.

import * as React from 'react'

import { Button } from '@busy/ui/Button'
import { Icon } from '@busy/ui/Icon'
import { Popover } from '@busy/ui/Popover'
import { TextField } from '@busy/ui/TextField'
import { RANGE_IDS, RANGE_LABEL, rangeDates } from './dateRanges'
import { MenuRow } from '@busy/ui/MenuRow'
import { useListing } from './store'

export function DateMenu() {
  const rangeId = useListing((state) => state.rangeId)
  const custom = useListing((state) => state.custom)
  const today = useListing((state) => state.today)
  const setRange = useListing((state) => state.setRange)
  const setCustom = useListing((state) => state.setCustom)
  const button = React.useRef<HTMLButtonElement>(null)
  const [open, setOpen] = React.useState(false)

  const label = rangeId === 'custom' ? `${custom.from ?? '…'} → ${custom.to ?? '…'}` : RANGE_LABEL[rangeId]

  return (
    <>
      <Button
        ref={button}
        variant="ghost"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((was) => !was)}
      >
        <Icon name="calendar" />
        {label}
        <Icon name="chevronDown" />
      </Button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={button} label="Period">
        <div role="menu" aria-label="Period" className="w-72 py-1">
          {RANGE_IDS.map((id) => (
            <MenuRow
              key={id}
              chosen={id === rangeId}
              detail={rangeDates(id, today)}
              onClick={() => {
                setRange(id)
                setOpen(false)
              }}
            >
              {RANGE_LABEL[id]}
            </MenuRow>
          ))}
        </div>

        <div className="shrink-0 border-t border-stroke p-2">
          <h3 className="mb-2 text-sm font-label text-ink-muted">Custom range</h3>
          <div className="flex items-center gap-2">
            <div className="h-control-sm flex-1 rounded-control border border-stroke">
              <TextField
                type="date"
                aria-label="From"
                value={custom.from ?? ''}
                onChange={(event) => setCustom(event.target.value || null, custom.to)}
              />
            </div>
            <span className="text-sm text-ink-muted">to</span>
            <div className="h-control-sm flex-1 rounded-control border border-stroke">
              <TextField
                type="date"
                aria-label="To"
                value={custom.to ?? ''}
                onChange={(event) => setCustom(custom.from, event.target.value || null)}
              />
            </div>
          </div>
        </div>
      </Popover>
    </>
  )
}
