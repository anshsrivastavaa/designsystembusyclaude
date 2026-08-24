// A table of records you pick from. The invoice listing is its first use: rows you select,
// sort and act on, where a cell is something you read rather than something you type into.
//
// THIS IS NOT THE ITEM GRID, AND THE TWO MUST NEVER BE MERGED. ItemGrid is a spreadsheet:
// every cell is a field, the keyboard walks cell to cell, and a row exists because somebody
// is typing it. This is a list of records: the row is the unit, selection is the point, and
// nothing in it is edited. A component that is both is the component that does everything —
// it grows a mode flag, then a second, and after that no change to either screen is safe.
// If a behaviour is wanted in both, the shared thing is the ENGINE underneath, not this file.
//
// NO TANSTACK YET, DELIBERATELY. architecture.md puts TanStack Table under the item grid,
// where virtualisation and cell-level state earn it. This table is handed rows that are
// already sorted and filtered, and it renders them. TanStack goes in the day this needs
// virtualisation, column resizing or pinning — not before, and when it does, it goes in
// underneath this same file rather than beside it.

import * as React from 'react'

import { Checkbox } from './Checkbox'
import { Icon } from './Icon'
import { cn } from './cn'
import type { TableProps } from './TableColumn'
import { TableGroupHeading } from './TableGroupHeading'
import { TableHead } from './TableHead'
import { TableTotals } from './TableTotals'
import { TableRowActions } from './TableRowActions'
import { useStuck } from './useStuck'

const ALIGN = { start: 'text-left', end: 'text-right' } as const

export function Table<Row>({
  columns,
  rows,
  getRowId,
  label,
  isMuted,
  groupOf,
  selection,
  sort,
  onSort,
  onHeaderMenu,
  onReorder,
  rowActions,
  totals,
  totalsLabel,
  empty,
  cursor,
  onCursorChange,
  onRowKeyDown,
  layout,
}: TableProps<Row>) {
  const body = React.useRef<HTMLTableSectionElement>(null)
  const [sentinel, stuck] = useStuck()
  // The mirror of the heading's sentinel, below the table. While it is in view the totals row is
  // sitting at its natural place — the foot of the card — and the bar in it may take the card's
  // corners. The moment it scrolls out the row is stuck mid-card, and a rounded dark bar there
  // reads as a pill floating over the rows rather than as the foot of anything.
  const [foot, floating] = useStuck()
  const walkable = cursor !== undefined
  const ids = rows.map(getRowId)
  const picked = ids.filter((id) => selection?.selected.has(id)).length
  const all = ids.length > 0 && picked === ids.length
  const span = columns.length + (selection ? 1 : 0) + (rowActions ? 1 : 0)
  // How many columns at the left have no figure of their own. That run is one cell, holding
  // whatever the caller put in `totalsLabel`.
  const firstTotalled = totals === undefined ? -1 : columns.findIndex((column) => totals[column.id] !== undefined)
  const leadSpan = firstTotalled === -1 ? columns.length : firstTotalled

  // The keyboard follows the cursor rather than the cursor following the keyboard. Moving it
  // is one act — arrow down IS "the keyboard is now on the next row" — so a row that becomes
  // the cursor takes focus, and nothing has to remember to do it twice.
  //
  // ASKED FOR BY NUMBER, NOT COUNTED OFF THE TABLE BODY. This was `body.children[cursor]`, and
  // group headings are rows in the same body: with grouping on, cursor 3 reached the fourth
  // CHILD, which after one heading is the third invoice, and after landing on a heading — which
  // has no tab stop — focus went nowhere at all and the keyboard was stranded in the table.
  React.useEffect(() => {
    if (!walkable || cursor === undefined || cursor < 0) return
    const row = body.current?.querySelector(`[data-row-index="${cursor}"]`)
    if (row instanceof HTMLElement && document.activeElement !== row) row.focus()
  }, [walkable, cursor])

  if (rows.length === 0) {
    return <div className="flex flex-1 items-center justify-center px-4 py-12 text-center">{empty}</div>
  }

  return (
    // Relative, because the corner control is pinned over the heading row rather than sitting
    // in it. See the button at the foot of this file.
    <div className="relative">
    {/* No height and no ink. While this is in view the heading is in its normal place; the
        moment it scrolls out, the heading is stuck. See useStuck. */}
    <div ref={sentinel} aria-hidden="true" />
    {/* table-fixed is what makes a header sit exactly over its cells: an auto-layout table is
        free to ignore the widths and quietly does. */}
    <table className="w-full table-fixed border-separate border-spacing-0 text-body" aria-label={label}>
      <colgroup>
        {selection ? <col className="w-10" /> : null}
        {columns.map((column) => (
          <col key={column.id} className={column.width} />
        ))}
        {rowActions ? <col className="w-10" /> : null}
      </colgroup>

      <TableHead
        columns={columns}
        {...(layout === undefined ? {} : { layout })}
        stuck={stuck}
        all={all}
        picked={picked}
        {...(selection ? { selection } : {})}
        {...(sort ? { sort } : {})}
        {...(onSort ? { onSort } : {})}
        {...(onHeaderMenu ? { onHeaderMenu } : {})}
        {...(onReorder ? { onReorder } : {})}
        hasRowActions={rowActions !== undefined}
      />

      <tbody ref={body}>
        {rows.map((row, index) => {
          const id = getRowId(row)
          const chosen = selection?.selected.has(id) ?? false
          const muted = isMuted?.(row) ?? false
          const group = groupOf?.(row) ?? null
          const opensGroup = group !== null && (index === 0 || groupOf?.(rows[index - 1]!) !== group)
          return (
            <React.Fragment key={id}>
            {opensGroup ? <TableGroupHeading label={group} span={span} /> : null}
            <tr
              // WHICH INVOICE THIS IS, counted in invoices. The keyboard effect above finds the
              // cursor's row by this number, because with group headings interleaved into the
              // same body the tenth child of the table is not the tenth invoice.
              data-row-index={index}
              // One tab stop for the whole table, on the row the keyboard is on — or on the
              // first row when it has not been in yet, so Tab can reach the rows at all.
              // Twenty-five rows each taking a Tab is twenty-five presses to get past a table.
              {...(walkable
                ? {
                    tabIndex: index === Math.max(cursor ?? -1, 0) ? 0 : -1,
                    onFocus: () => { if (index !== cursor) onCursorChange?.(index) },
                    onKeyDown: (event: React.KeyboardEvent) => onRowKeyDown?.(event, index),
                  }
                : {})}
              // Hover paints the background and the keyboard draws a ring, on purpose. They
              // are two different things and a row can be both at once, so they cannot share
              // one channel — that fault is already logged against the item grid.
              className={cn(
                // NOT pressable, and this is the one place on the list where it is wrong.
                // Three per cent is under a pixel on a 26px control and TWENTY-TWO on a
                // full-width row: measured at 900px wide, holding the mouse down moved the
                // row's first cell 14px sideways. A button giving way reads as a button
                // listening; a whole row sliding under the cursor reads as a mis-click. A row
                // already answers with a hover fill and a focus ring, and if it needs a press
                // state it is a third colour, not geometry.
                'group h-row',
                chosen ? 'bg-surface-selected' : 'bg-surface hover:bg-surface-hover',
                'focus-ring-within-inset',
              )}
            >
              {selection ? (
                <td className="border-b border-stroke px-3">
                  <Checkbox
                    checked={chosen}
                    onChange={(event) => selection.onToggle(id, event.target.checked)}
                    aria-label={`Select ${id}`}
                  />
                </td>
              ) : null}

              {columns.map((column) => (
                <td
                  key={column.id}
                  style={layout?.pinOf(column.id)}
                  className={cn(
                    'truncate border-b border-stroke px-3',
                    // A PINNED CELL NEEDS ITS OWN BACKGROUND. Unpinned cells inherit the row's,
                    // and a sticky cell with a transparent background has the scrolled content
                    // slide visibly underneath it.
                    layout?.isPinned(column.id) ? (chosen ? 'bg-surface-selected' : 'bg-surface') : null,
                    ALIGN[column.align ?? 'start'],
                    // Muted ink, and NOT struck through. A line through every cell makes the
                    // row hard to read at the moment somebody is checking what it said, and
                    // the Status column already carries the word.
                    muted ? 'text-ink-muted' : 'text-ink',
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}

              {rowActions ? <TableRowActions>{rowActions(row)}</TableRowActions> : null}
            </tr>
            </React.Fragment>
          )
        })}
      </tbody>

      {totals ? (
        <TableTotals
          columns={columns}
          totals={totals}
          leadSpan={leadSpan}
          hasSelection={selection !== undefined}
          hasRowActions={rowActions !== undefined}
          {...(layout === undefined ? {} : { pinOf: layout.pinOf, isPinned: layout.isPinned })}
          {...(totalsLabel === undefined ? {} : { totalsLabel: typeof totalsLabel === 'function' ? totalsLabel({ atFoot: !floating }) : totalsLabel })}
        />
      ) : null}

      <caption className="sr-only">{`${rows.length} rows, ${span} columns`}</caption>
    </table>
    {/* Below the table, so it leaves view exactly when the totals row stops being at rest. */}
    <div ref={foot} aria-hidden="true" />

    {/* Over the totals bar, not in it: a control belonging to the whole table cannot sit in a
        cell without pushing a figure out of line with its own column. */}
    {/* THE CORNER CONTROL, AND IT IS NOT A COLUMN. v2 pins it over the header's right end and
        leaves everything below it transparent, so the rows run the table's full width and
        nothing is ever displaced to make room for it. A real column would cost every row forty
        pixels to hold one button that is only ever pressed from the heading.
        It opens the same thing right-clicking a heading opens — the fast way in and the
        visible way in, not two different lists. */}
    {onHeaderMenu === undefined ? null : (
      <button
        type="button"
        aria-label="Choose columns"
        title="Choose columns — or right-click any heading"
        onClick={(event) => onHeaderMenu({ x: event.clientX, y: event.clientY })}
        className={cn(
          // z-40, ABOVE the corner tier. This button overlays the heading row, and a column pinned
          // to the RIGHT puts its own two-direction corner cell at z-30 in exactly this spot —
          // at the same z the later element wins, which would be whichever way the markup
          // happened to be ordered. This is v2's hidden overlay column, and it is the reason
          // column widths are measured by id rather than by walking the header row.
          'absolute top-1 right-1 z-40 grid size-control-sm place-items-center rounded-control',
          'text-ink-muted hover:bg-surface-hover hover:text-ink',
          'focus-ring',
        )}
      >
        <Icon name="rows" className="size-icon-sm" />
      </button>
    )}
    </div>
  )
}
