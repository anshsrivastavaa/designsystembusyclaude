import { Z_CORNER } from './columns'
import { cn } from './cn'
import type { TableColumn } from './TableColumn'
import type { ReactNode } from 'react'

/** The strip across the foot of a table: figures under their own columns, and whatever belongs
 * to the whole table rather than to any one of them sitting to the left of them.
 *
 * Its own file because Table.tsx reached the 250-line cap, and the cap was right about what had
 * grown — the structure of a table, the rows in its body and the summary under them are three
 * things. Nothing here changed on the way out.
 *
 * NOT h-row. A data row is a line of text; this one holds controls — the pager and the
 * rows-per-page picker live here now that the two bottom strips became one — so it takes the
 * height a control needs and the cells pad themselves. Left at a row's height the buttons were
 * clipped by the bottom of the screen. */
const FOOT = 'sticky bottom-0 z-20 border-t border-stroke bg-surface-sunken px-3 py-1.5'
const BARE = 'sticky bottom-0 z-20 border-t border-stroke bg-surface-sunken py-1.5'

const ALIGN = { start: 'text-left', end: 'text-right' } as const

export type TableTotalsProps<Row> = {
  columns: TableColumn<Row>[]
  totals: Record<string, ReactNode>
  /** How many columns at the left have no figure of their own. That run is one cell.
   *
   * EXCEPT THE PINNED ONES. A cell that spans several columns cannot be frozen to any one of
   * them — there is no single offset that means "this cell". So a start-pinned column keeps its
   * own totals cell and the label spans what is left. With nothing pinned this is exactly the
   * old behaviour, which is why the pager still sits where it has always sat. */
  leadSpan: number
  totalsLabel?: ReactNode
  hasSelection: boolean
  hasRowActions: boolean
  /** The style a pinned column's cells wear, so the summary freezes with the rest of it. */
  pinOf?: (id: string) => React.CSSProperties
  isPinned?: (id: string) => 'start' | 'end' | null
}

export function TableTotals<Row>({
  columns, totals, leadSpan, totalsLabel, hasSelection, hasRowActions, pinOf, isPinned,
}: TableTotalsProps<Row>) {
  const pinnedLead = columns.slice(0, leadSpan).filter((column) => isPinned?.(column.id)).length

  return (
    <tfoot>
      <tr>
        {hasSelection ? <td className={BARE} /> : null}
        {/* The label spans every column before the first one that has a figure. It sat in the
            first cell alone, which is the narrowest column in the table with truncate on it —
            so the pager it now holds was cut off mid-control. Nothing sits under a column it
            does not belong to: those columns have nothing of their own to show. */}
        {columns.slice(0, leadSpan).filter((column) => isPinned?.(column.id)).map((column) => (
          <td
            key={column.id}
            style={{ ...pinOf?.(column.id), zIndex: Z_CORNER }}
            className={cn(FOOT, 'truncate', ALIGN[column.align ?? 'start'], 'text-ink-secondary')}
          />
        ))}

        {leadSpan - pinnedLead > 0 ? (
          <td colSpan={leadSpan - pinnedLead} className={cn(FOOT, 'text-left text-ink-secondary')}>
            {totalsLabel}
          </td>
        ) : null}

        {columns.slice(leadSpan).map((column) => (
          <td
            key={column.id}
            // The OTHER two-direction corner: this cell is sticky at the bottom from the
            // totals bar and sideways from the pin, so it out-ranks both, exactly as the
            // header's corner does.
            style={{ ...pinOf?.(column.id), ...(isPinned?.(column.id) ? { zIndex: Z_CORNER } : {}) }}
            className={cn(
              FOOT,
              'truncate',
              ALIGN[column.align ?? 'start'],
              totals[column.id] ? 'font-strong text-ink' : 'text-ink-secondary',
            )}
          >
            {totals[column.id] ?? null}
          </td>
        ))}

        {hasRowActions ? <td className={BARE} /> : null}
      </tr>
    </tfoot>
  )
}
