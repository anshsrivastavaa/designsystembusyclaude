// The title row: which listing this is, whether it is a favourite, and the four controls that
// change what the table shows.
//
// SEARCH IS AT THE LEFT END OF THE GROUP, so opening it pushes the period and the two menus
// rightwards into space that is there, rather than shoving them under the New button.
//
// "+ NEW", NOT "+ CREATE", and it carries its key. A shortcut nobody can see is a shortcut
// only the person who wrote it uses; printing N on the button is how the second and third
// person find out it exists.

import * as React from 'react'

import { Button } from '@busy/ui/Button'
import { Icon } from '@busy/ui/Icon'
import { Popover } from '@busy/ui/Popover'
import { DateMenu } from './DateMenu'
import { FilterMenu } from './FilterMenu'
import { MenuItem } from './MenuItem'
import { InvoiceSearch } from './InvoiceSearch'
import { TableViewMenu } from './TableViewMenu'

/** The other listings this switcher would reach. Only invoices is built; the rest say so
 * rather than being absent, because the switcher's whole job is to show what else there is. */
const LISTINGS = ['Invoices', 'Quotations', 'Sales Orders', 'Delivery Challans', 'Credit Notes']

export function ListingTitle({ onCreate }: { onCreate?: () => void }) {
  const switcher = React.useRef<HTMLButtonElement>(null)
  const [switching, setSwitching] = React.useState(false)
  const [favourite, setFavourite] = React.useState(false)

  return (
    // ONE LINE, ONE DIVIDER. The research asks for a 14px semibold title; ours is 22 by Aj's
    // ruling and that stands. What is taken from it is the shape: the name and the controls
    // that change what is under it share a line, and a single full-width rule closes it.
    <div className="flex flex-wrap items-center gap-2 border-b border-stroke pb-3">
      <button
        ref={switcher}
        type="button"
        aria-expanded={switching}
        aria-haspopup="dialog"
        onClick={() => setSwitching((was) => !was)}
        className="flex items-center gap-1 rounded-control px-1 py-1 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus"
      >
        <h1 className="text-heading font-strong tracking-tight text-ink">Invoices</h1>
        <Icon name="chevronDown" className="text-ink-muted" />
      </button>

      <Popover open={switching} onClose={() => setSwitching(false)} anchorRef={switcher} label="Switch listing">
        <div role="menu" aria-label="Switch listing" className="min-h-0 overflow-auto py-1">
          {LISTINGS.map((listing) => (
            <MenuItem
              key={listing}
              chosen={listing === 'Invoices'}
              disabled={listing !== 'Invoices'}
              reason={`${listing} is not built yet`}
              detail={listing === 'Invoices' ? undefined : 'Not yet'}
              onClick={() => setSwitching(false)}
            >
              {listing}
            </MenuItem>
          ))}
        </div>
      </Popover>

      <Button
        variant="ghost"
        size="icon-sm"
        aria-pressed={favourite}
        aria-label={favourite ? 'Remove from favourites' : 'Add to favourites'}
        onClick={() => setFavourite((was) => !was)}
      >
        <Icon name="star" className={favourite ? 'text-ink-accent' : ''} />
      </Button>

      <span className="flex-1" />

      <InvoiceSearch />
      <DateMenu />
      <FilterMenu />
      <TableViewMenu />

      <span className="mx-1 h-6 w-px bg-stroke" />

      <Button onClick={onCreate} title="New invoice  ( N )">
        <Icon name="plus" />
        New
        <kbd className="rounded-control bg-on-accent/20 px-1.5 text-sm font-label">N</kbd>
      </Button>
    </div>
  )
}
