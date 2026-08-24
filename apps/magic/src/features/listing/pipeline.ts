// What the listing is showing, worked out once.
//
// THE PIPELINE RUNS ONCE, AND IN ONE ORDER. Narrow by everything except the tab, count the
// tabs off that, apply the tab, sort, group, cut the page. Working it out per region is how a
// screen ends up saying 22 invoices in one corner and showing 19.
//
// AND IT ONLY RUNS WHEN ITS OWN ANSWER COULD HAVE CHANGED. Written plainly in the render body,
// every stage re-ran on every render — and the listing re-renders on every arrow key, because
// moving the cursor is a change to the store. At the sixty-five invoices the mock world holds
// nobody would ever notice. At two thousand, which is a year's trading in a small book, holding
// the down arrow re-narrowed, re-sorted and re-grouped two thousand rows for each repeat.
// Measured at 1.3ms a pass, so it was never going to be the thing that broke the tenth-of-a-
// second requirement on its own — but it is work done for no reason at all, on the one
// interaction a person repeats fastest.
//
// The cursor appears in none of the dependency lists below. That is the whole point.
//
// This is a separate file from InvoiceListing.tsx because that file crossed 250 lines and the
// cap was right about what had grown: what the table is showing and how the screen is laid out
// are two things.

import { useMemo } from 'react'

import { useColumns, type ColumnLayout } from '@busy/ui/columns'
import type { TableColumn } from '@busy/ui/TableColumn'
import type { Invoice } from '../../data/schema/invoice'
import { formatPaise } from '../../lib/money'
import { listingColumns } from './columns'
import { grouped, narrow, onTab, page, sorted } from './filtering'
import { balanceOf, isCancelled } from '../../lib/payment'
import { rangeOf, type ListingState } from './store'

/** Cancelled invoices are counted but their money is not added up: they keep their total for
 * the record and nobody is going to collect it. */
const stillLive = (invoice: Invoice) => !isCancelled(invoice)

/** The columns in the order this person dragged them into, with anything they have never
 * touched left where it was declared. Ids in the saved order that no longer exist are simply
 * skipped — a column removed from the product must not take a saved order down with it. */
function inColumnOrder(columns: TableColumn<Invoice>[], order: string[]): TableColumn<Invoice>[] {
  if (order.length === 0) return columns
  const known = new Map(columns.map((column) => [column.id, column]))
  const moved = order.flatMap((id) => (known.has(id) ? [known.get(id)!] : []))
  const untouched = columns.filter((column) => !order.includes(column.id))
  return [...moved, ...untouched]
}

export type Shown = {
  /** Everything the filters left, before the tab is applied — what the tab counts are taken
   * off, and what the insight strip reads. */
  narrowed: Invoice[]
  /** After the tab, sorted and grouped: the whole list this screen is showing, every page. */
  shown: Invoice[]
  /** The page of it that is actually on the screen. */
  rows: Invoice[]
  columns: TableColumn<Invoice>[]
  totals: { total: string; pending: string }
  /** Widths, freezing and the drag handles, from the shared column engine. */
  layout: ColumnLayout
}

export function usePipeline(state: ListingState, onOpen?: (id: string) => void): Shown {

  const narrowed = useMemo(
    () =>
      narrow(state.invoices, {
        range: rangeOf(state),
        search: state.search,
        party: state.party,
        total: state.total,
        pending: state.pending,
        compliance: state.compliance,
      }),
    // `rangeOf` is handed the whole state but reads exactly three things off it — the chosen
    // period, the custom dates, and today — so those three are what it depends on.
    [
      state.invoices, state.rangeId, state.custom, state.today,
      state.search, state.party, state.total, state.pending, state.compliance,
    ],
  )

  const shown = useMemo(
    () => grouped(sorted(onTab(narrowed, state.tab, state.today), state.sort, state.today), state.groupBy),
    [narrowed, state.tab, state.today, state.sort, state.groupBy],
  )

  const rows = useMemo(
    () => page(shown, state.pageNumber, state.pageSize),
    [shown, state.pageNumber, state.pageSize],
  )

  const columns = useMemo(
    () =>
      inColumnOrder(
        listingColumns(state.today, onOpen).filter((column) => !state.hiddenColumns.includes(column.id)),
        state.columnOrder,
      ),
    [state.today, state.hiddenColumns, state.columnOrder, onOpen],
  )

  // Two passes over the shown list were really four, because each figure filtered the cancelled
  // ones out for itself. One pass, and both figures read off it.
  const totals = useMemo(() => {
    const live = shown.filter(stillLive)
    return {
      total: formatPaise(live.reduce((sum, one) => sum + one.totalPaise, 0)),
      pending: formatPaise(live.reduce((sum, one) => sum + balanceOf(one), 0)),
    }
  }, [shown])

  // The column engine, fed the state the person set and handing back what every cell wears. It
  // is given the columns actually on the table, so a hidden one cannot hold a pin offset open.
  const specs = useMemo(() => columns.map((column) => ({ id: column.id })), [columns])
  // The order the pin boundary is measured against is the order ON SCREEN, not the declared
  // one: a hidden or reordered column must not hold an offset open behind the scenes.
  const onScreen = useMemo(() => columns.map((column) => column.id), [columns])
  const layout = useColumns({
    columns: specs,
    widths: state.columnWidths,
    onResize: state.resizeColumn,
    pins: state.columnPins,
    onPin: (id, side) => state.pinColumn(id, side, onScreen),
  })

  return { narrowed, shown, rows, columns, totals, layout }
}
