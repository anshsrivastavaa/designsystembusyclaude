// The listing's search: the shared SearchBox, wired to this screen's store and this
// application's shortcut table.
//
// A NAMED WRAPPER, because a generic control is never dropped straight onto a screen. Under
// time pressure the wrapper is the step that gets skipped — the plain component is right there
// and it almost works — and what arrives is several slightly different search boxes, which is
// the previous build's duplicate definitions by another route.
//
// WHAT THE KEY MEANS IS DECIDED HERE, not in packages/ui. Escape means "put this away", and
// only when there is nothing left in it does it also mean "stop searching". The library cannot
// know that: it would have to read lib/shortcuts.ts, and the library may not reach into the
// application at all.

import { SearchBox } from '@busy/ui/SearchBox'
import { actionFor } from '../../lib/shortcuts'
import { useListing } from './store'

export function InvoiceSearch() {
  const search = useListing((state) => state.search)
  const open = useListing((state) => state.searchOpen)
  const setSearch = useListing((state) => state.setSearch)
  const openSearch = useListing((state) => state.openSearch)

  return (
    <SearchBox
      value={search}
      onValueChange={setSearch}
      open={open}
      onOpenChange={openSearch}
      label="Search invoices"
      placeholder="Invoice number or party"
      fieldLabel="Search invoices by number or party"
      shortcut="/"
      onKeyDown={(event) => {
        if (actionFor(event, 'global') !== 'clear') return
        event.stopPropagation()
        if (search === '') openSearch(false)
        else setSearch('')
      }}
    />
  )
}
