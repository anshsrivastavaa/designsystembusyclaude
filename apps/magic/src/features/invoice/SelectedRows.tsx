// What to do with the lines that are picked, which is one thing: take them out.
//
// DELETE AND NOTHING ELSE, ruled by Aj on 21-08. The listing's bulk bar is a different screen
// and a different question — there, acting on many invoices at once is the job. Inside an
// invoice, selecting lines is how you remove several without pressing delete five times, and
// change tax, change warehouse and apply discount are each a different size of feature with a
// better home than a bar that appears when you tick something.
//
// IT APPEARS ONLY WHEN SOMETHING IS PICKED, and it says the count in words rather than showing
// a bar with a disabled button on it. A control that is on the screen doing nothing is the
// thing this codebase keeps taking off screens.
//
// IT DOES NOT PIN. The action bar at the foot of the screen is the only pinned thing, and a
// second floating bar competing with it was how the previous build ended up with two rows of
// buttons in the same corner. This sits with the grid, where the rows it is about are.

import { Button } from '@busy/ui/Button'
import { Icon } from '@busy/ui/Icon'
import { useInvoice } from './store'

export function SelectedRows() {
  const selectedRowIds = useInvoice((state) => state.selectedRowIds)
  const clearSelection = useInvoice((state) => state.clearSelection)
  const removeSelected = useInvoice((state) => state.removeSelected)

  if (selectedRowIds.length === 0) return null

  const many = selectedRowIds.length > 1

  return (
    <div
      role="status"
      aria-label="Selected lines"
      className="flex shrink-0 items-center gap-3 rounded-card border border-stroke bg-surface-sunken px-3 py-2"
    >
      <span className="text-body text-ink">
        {selectedRowIds.length} {many ? 'lines' : 'line'} selected
      </span>
      <span className="flex-1" />
      <Button variant="ghost" size="sm" onClick={clearSelection}>
        Clear
      </Button>
      {/* THE ONE ACTION. Red, because taking lines off an invoice is the destructive one and it
          is genuinely exceptional — this is not a bar of five buttons where one happens to be
          dangerous. */}
      <Button size="sm" className="bg-danger-fill text-on-accent" onClick={removeSelected}>
        <Icon name="trash" className="size-icon-sm" />
        Delete {many ? `${selectedRowIds.length} lines` : 'line'}
      </Button>
    </div>
  )
}
