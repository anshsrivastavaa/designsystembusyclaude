// Whose books these are. The centre of the strip, and the anchor of the window.
//
// IT IS ITS OWN CONTROL, SEPARATE FROM THE YEAR. They were merged into one button on the
// argument that you never change the book without knowing which year you are in — which is
// true of READING them and wrong about USING them. The year is switched constantly, to look
// something up in last year's books and come straight back; the company, for most people, never
// changes at all. One control makes the frequent action pay for the rare one.
//
// Aj's ruling, 21-08, chosen rather than ruled — he overturns it when he sees it on a screen.

import { Icon } from '@busy/ui/Icon'
import { NotBuiltNote } from '@busy/ui/NotBuilt'
import { Popover } from '@busy/ui/Popover'
import * as React from 'react'

import { MenuLine } from './MenuLine'

/** Until a company screen exists, the book is the one the mock world describes. */
const COMPANY = 'Busy Foods & Beverages Pvt. Ltd.'

export function CompanyMenu() {
  const button = React.useRef<HTMLButtonElement>(null)
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((was) => !was)}
        className="flex h-control-sm min-w-0 items-center gap-2 rounded-control px-2 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus"
      >
        <span className="truncate text-body font-label text-ink">{COMPANY}</span>
        <Icon name="chevronDown" className="size-icon-sm shrink-0 text-ink-muted" />
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={button} label="Company">
        <div className="w-64 py-1">
          {/* Every line here is unavailable, so it is said once rather than on each. */}
          <NotBuiltNote />
          <div className="border-t border-stroke pt-1">
          <MenuLine>Edit company</MenuLine>
          <MenuLine>Switch company</MenuLine>
          <MenuLine separated>Log out</MenuLine>
          </div>
        </div>
      </Popover>
    </>
  )
}
