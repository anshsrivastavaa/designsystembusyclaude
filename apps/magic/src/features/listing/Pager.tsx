// How the page is cut: rows per page, and the way between pages.
//
// IT LIVES IN THE TOTALS BAR, not in a strip under it. There were two bars stacked — a totals
// row and a rows-and-pager row — which is one idea drawn twice: both are "what you are looking
// at, summed up". Two strips also cost two borders and two paddings at the foot of every
// screen, which is the densest part of it.
//
// So this is handed to the Table as the label for its totals row and sits in the first cell,
// under the columns that have nothing to total. The figures sit under theirs. One bar.

import { Button } from '@busy/ui/Button'
import { Icon } from '@busy/ui/Icon'
import { pageCount } from './filtering'
import { useListing } from './store'

const SIZES = [10, 25, 50, 100]

export function Pager({ rows }: { rows: number }) {
  const pageNumber = useListing((state) => state.pageNumber)
  const pageSize = useListing((state) => state.pageSize)
  const setPage = useListing((state) => state.setPage)
  const setPageSize = useListing((state) => state.setPageSize)

  const pages = pageCount(rows, pageSize)

  return (
    <span className="flex items-center gap-2 whitespace-nowrap">
      <span className="text-ink-secondary">
        {rows} {rows === 1 ? 'invoice' : 'invoices'}
      </span>

      <select
        value={pageSize}
        onChange={(event) => setPageSize(Number(event.target.value))}
        aria-label="Rows per page"
        className="h-control-sm rounded-control border border-stroke bg-surface px-1 text-body text-ink focus-ring"
      >
        {SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>

      <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={pageNumber <= 1} onClick={() => setPage(pageNumber - 1)}>
        <Icon name="chevronLeft" />
      </Button>
      <span className="text-ink-secondary">
        {pageNumber} / {pages}
      </span>
      <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={pageNumber >= pages} onClick={() => setPage(pageNumber + 1)}>
        <Icon name="chevronRight" />
      </Button>
    </span>
  )
}
