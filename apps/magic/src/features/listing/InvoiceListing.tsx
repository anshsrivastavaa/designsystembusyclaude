// The invoice listing. Title row, toolbar, chips, table, insight strip, summary bar — in that
// order down the page, and each region is its own file.
//
// THE PIPELINE RUNS ONCE, and it runs in pipeline.ts. Everything that narrows the list is
// applied in one place and in one order, so the tab counts, the chips, the table and the
// summary are all looking at the same answer. Working it out per region is how a screen ends
// up saying 22 invoices in one corner and showing 19.
//
// KEYBOARD IS NOT A SECOND PASS. Tab reaches the toolbar and then the rows in one press each,
// the arrows walk the rows, Enter opens, Space picks, and Escape clears. What each key MEANS
// is decided in lib/shortcuts.ts and nowhere else — this file asks that table and acts.

import * as React from 'react'

import { Table } from '@busy/ui/Table'
import type { Invoice } from '../../data/schema/invoice'
import { data } from '../../data/source'
import { Button } from '@busy/ui/Button'
import { isRefusal } from '../../data/schema/refusal'
import { actionFor } from '../../lib/shortcuts'
import { isTyping } from '../../lib/typing'
import { FilterChips } from './FilterChips'
import { ListingEmpty } from './ListingEmpty'
import { ColumnSetup } from './ColumnSetup'
import { ListingTitle } from './ListingTitle'
import { ListingToolbar } from './ListingToolbar'
import { RowMenu } from './RowMenu'
import { BulkBar } from './BulkBar'
import { MagicButton } from './MagicButton'
import { Pager } from './Pager'
import { isCancelled } from '../../lib/payment'
import { groupLabel, pageCount, type SortId } from './filtering'
import { usePipeline } from './pipeline'
import { useListing } from './store'

export function InvoiceListing({
  onCreate,
  onOpen,
}: {
  onCreate?: () => void
  /** Opening a saved invoice. Absent means there is nowhere for a number to go, and the numbers
   * then render as plain text rather than as links that do nothing. */
  onOpen?: (id: string) => void
}) {
  const state = useListing()
  const load = useListing((one) => one.load)
  const screen = React.useRef<HTMLElement>(null)
  const table = React.useRef<HTMLDivElement>(null)
  // Right-clicking a column heading opens column setup where the pointer is, which is what v2
  // does on both its tables. Table view -> Column setup opens the same popover for anybody who
  // has never thought to try it.
  const [columnsAt, setColumnsAt] = React.useState<{ x: number; y: number } | null>(null)

  // A REFUSAL IS AN ANSWER, AND IT USED TO BE DROPPED. This read `if (isRefusal(answer)) return`,
  // so the one case that most needed saying left the screen on "Loading invoices…" for ever —
  // and since nothing in the application caught a rejected promise either, an unreachable backend
  // did the same. The seam converts rejections to refusals now, so there is exactly one shape to
  // handle here and it is handled.
  React.useEffect(() => {
    if (!state.loading) return
    let live = true
    void data.listInvoices({ search: '' }).then((answer) => {
      if (!live) return
      if (isRefusal(answer)) state.loadFailed(answer.message)
      else load(answer)
    })
    return () => {
      live = false
    }
  }, [load, state.loading])

  // What the table is showing, worked out once and only when it could have changed.
  const { narrowed, shown, rows, columns, totals, layout } = usePipeline(state, onOpen)

  function onRowKey(event: React.KeyboardEvent, index: number) {
    const action = actionFor(event, 'list')
    if (action === null) return
    event.preventDefault()

    if (action === 'move-down') state.moveCursor(Math.min(index + 1, rows.length - 1))
    if (action === 'move-up') state.moveCursor(Math.max(index - 1, 0))
    if (action === 'first-row') state.moveCursor(0)
    if (action === 'last-row') state.moveCursor(rows.length - 1)
    if (action === 'select-record') {
      const id = rows[index]?.id
      if (id !== undefined) state.toggleRow(id, !state.selected.includes(id))
    }
    // Enter opens the invoice the cursor is on, by the same route the number does. It did
    // nothing at all for four rounds, which meant the one shortcut the help menu promises for a
    // listing was the one that silently failed.
    if (action === 'open-record') {
      const id = rows[index]?.id
      if (id !== undefined) onOpen?.(id)
    }
  }

  // Escape and the two global keys. On the screen rather than on a row, because they mean the
  // same thing wherever the keyboard happens to be — and they must not fire while somebody is
  // typing into a field, which is the one thing the shortcut table cannot know.
  function onScreenKey(event: React.KeyboardEvent) {
    const typing = isTyping(event.target)
    const action = actionFor(event, 'global')
    if (action === null) return
    if (action === 'clear') {
      state.clearEverything()
      return
    }
    if (typing) return
    event.preventDefault()
    if (action === 'find') state.openSearch(true)
    if (action === 'new-document') onCreate?.()
  }

  return (
    // THE TITLE ROW, THE TOOLBAR AND THE ROWS SCROLL. The only things that stay put are the
    // top strip, the rail, the table's own heading row, its totals row and the pager bar. The
    // scroll is here rather than in the shell because the create screen is not a page that
    // scrolls and the shell serves both.
    //
    // THE PAGER BAR IS OUTSIDE THE SCROLL, which is what lets the totals row hold the foot of
    // it: two things both sticking to bottom-0 of one scroller would sit on top of each other,
    // and there is no token for "however tall the pager happens to be". Out here the totals
    // land directly above the bar with nothing to work out.
    <main id="main" ref={screen} onKeyDown={onScreenKey} className="flex min-h-0 flex-1 flex-col">
      {/* THE SCROLLER CARRIES NO PADDING and the content inside it does. With p-4 out here,
          `sticky top-0` on the heading resolved against the PADDING box — so the heading pinned
          sixteen pixels down and rows scrolled through the gap above it, which reads as the
          table leaking. Padding on the inner box scrolls away with everything else. */}
      <div className="min-h-0 flex-1 overflow-auto">
      <div className="flex flex-col gap-3 p-4">
      <ListingTitle {...(onCreate ? { onCreate } : {})} />
      <ListingToolbar narrowed={narrowed} />
      <FilterChips />

      {/* The card is exactly as tall as its rows. It grew to fill the window for a round,
          which was right while the totals were elsewhere and wrong the moment they moved into
          the table's own footer: the totals row ended up floating in the middle of a stretched
          card with nothing under it. A short list is a short card. */}
      <div ref={table} className="rounded-card border border-stroke bg-surface">
        {state.failed !== null ? (
          // WHAT WENT WRONG, AND THE ONE THING TO DO ABOUT IT. A failure with no way forward is a
          // dead end somebody reloads the whole page to escape — and reloading is what the button
          // does, without losing the filters and the sort they had set.
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <p className="max-w-prose text-body text-ink">{state.failed}</p>
            <Button variant="outline" size="sm" onClick={() => state.retry()}>
              Try again
            </Button>
          </div>
        ) : state.loading ? (
          <p className="px-4 py-12 text-center text-body text-ink-secondary">Loading invoices…</p>
        ) : (
          <Table
            columns={columns}
            rows={rows}
            getRowId={(invoice) => invoice.id}
            label="Invoices"
            isMuted={(invoice) => isCancelled(invoice)}
            sort={{ columnId: state.sort.by, direction: state.sort.direction }}
            onSort={(columnId) => state.sortBy(columnId as SortId)}
            onHeaderMenu={setColumnsAt}
            onReorder={(columnId, toIndex) => state.moveColumn(columnId, toIndex)}
            layout={layout}
            selection={{
              selected: new Set(state.selected),
              label: 'Select every invoice on this page',
              onToggle: state.toggleRow,
              onToggleAll: (on) => state.setAllRows(rows.map((invoice) => invoice.id), on),
            }}
            rowActions={(invoice) => <RowMenu invoice={invoice} />}
            cursor={state.cursor}
            onCursorChange={state.moveCursor}
            onRowKeyDown={onRowKey}
            {...(state.groupBy === 'none'
              ? {}
              : { groupOf: (invoice: Invoice) => groupLabel(invoice, state.groupBy) })}
            // ONE BAR, AND WHAT IS IN IT DEPENDS ON THE MODE. With nothing picked it is the
            // pager, the totals under their own columns, and the AI button. The moment a row is
            // picked the figures give way to the actions and the bar is the bulk bar — mid
            // selection the page total is not what anybody is reading, and an action bar that
            // floats over a total covers a number somebody might act on.
            totals={
              state.selected.length > 0 ? {} : totals
            }
            // A FUNCTION, because the bulk bar has to know whether the totals row is sitting at
            // the foot of the card or stuck part way up it — that is the difference between a
            // bar that may wear the card's bottom corners and one that must not.
            totalsLabel={({ atFoot }) =>
              state.selected.length > 0 ? (
                <BulkBar atFoot={atFoot} />
              ) : (
                <span className="flex items-center justify-between gap-3">
                  <Pager rows={shown.length} />
                  <MagicButton narrowed={narrowed} />
                </span>
              )
            }
            empty={<ListingEmpty anyInvoices={state.invoices.length > 0} />}
          />
        )}
      </div>

      </div>
      </div>

      <ColumnSetup
        open={columnsAt !== null}
        onClose={() => setColumnsAt(null)}
        anchorRef={table}
        {...(columnsAt ? { at: columnsAt } : {})}
      />

      <span className="sr-only" role="status">
        {`${shown.length} invoices, page ${state.pageNumber} of ${pageCount(shown.length, state.pageSize)}`}
      </span>
    </main>
  )
}
