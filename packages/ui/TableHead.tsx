// The heading row of a Table: the select-all tick, the column labels, the sort marks and the
// right-click that opens column setup.
//
// Its own file because Table.tsx crossed 250 lines again, and the check was right about what
// had grown: a heading row is its own thing. It decides nothing — every answer is handed to it —
// so it can be read on its own without knowing how a row is selected or a page is cut.

import * as React from 'react'

import { Checkbox } from './Checkbox'
import { Icon } from './Icon'
import { Z_CORNER, type ColumnLayout } from './columns'
import { TableHeading } from './TableHeading'
import type { TableColumn, TableSelection, TableSort } from './TableColumn'
import { TableSortMark } from './TableSortMark'
import { cn } from './cn'

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const

export type TableHeadProps<Row> = {
  columns: TableColumn<Row>[]
  /** True while the row is actually holding its position, which is the only time it wears a
   * shadow. See useStuck for why CSS cannot answer this on its own. */
  stuck: boolean
  all: boolean
  picked: number
  selection?: TableSelection
  sort?: TableSort
  onSort?: (columnId: string) => void
  onHeaderMenu?: (at: { x: number; y: number }) => void
  layout?: ColumnLayout
  onReorder?: (columnId: string, toIndex: number) => void
  hasRowActions: boolean
}

export function TableHead<Row>({
  columns, stuck, all, picked, selection, sort, onSort, onHeaderMenu, onReorder, hasRowActions, layout,
}: TableHeadProps<Row>) {
  // WHICH COLUMN IS BEING CARRIED, and which one the pointer is over. Held here rather than in
  // the drag event because the HTML drag API will only carry strings and only lets you read
  // them on drop — so a heading cannot know, while the pointer is over it, what is coming.
  const [carrying, setCarrying] = React.useState<string | null>(null)
  const [over, setOver] = React.useState<string | null>(null)

  const drag = (columnId: string, index: number) =>
    onReorder === undefined
      ? {}
      : {
          draggable: true,
          onDragStart: (event: React.DragEvent) => {
            setCarrying(columnId)
            // Firefox refuses to start a drag at all unless something is set.
            event.dataTransfer.setData('text/plain', columnId)
            event.dataTransfer.effectAllowed = 'move'
          },
          onDragOver: (event: React.DragEvent) => {
            if (carrying === null || carrying === columnId) return
            // Without this the browser refuses the drop and shows the "no" cursor over every
            // heading, which reads as the feature being broken rather than as a rule.
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
            setOver(columnId)
          },
          onDragLeave: () => setOver((was) => (was === columnId ? null : was)),
          onDrop: (event: React.DragEvent) => {
            event.preventDefault()
            if (carrying !== null && carrying !== columnId) onReorder(carrying, index)
            setCarrying(null)
            setOver(null)
          },
          onDragEnd: () => {
            setCarrying(null)
            setOver(null)
          },
        }
  return (
    <thead>
    <tr className="h-row">
      {selection ? (
    <th scope="col" className="sticky top-0 z-20 border-b border-stroke bg-surface-sunken px-3">
      <Checkbox
        checked={all}
        mixed={picked > 0 && !all}
        onChange={() => selection.onToggleAll(!all)}
        aria-label={selection.label}
      />
    </th>
      ) : null}

      {columns.map((column, index) => {
    const sorted = sort?.columnId === column.id ? sort.direction : undefined
    return (
      <TableHeading
        key={column.id}
        ref={layout?.measure(column.id)}
        // THE CORNER CASE, and it is the whole of Aj's TanStack ruling. A pinned column's
        // header cell is sticky in TWO directions at once — top from the heading row, and left
        // or right from the pin — and it has to out-rank both the heading row it sits in and
        // the pinned cells below it. That is one z-index, not a bookkeeping problem.
        style={{
          ...layout?.sizeOf(column.id),
          ...layout?.pinOf(column.id),
          ...(layout?.isPinned(column.id) ? { zIndex: Z_CORNER } : {}),
        }}
        aria-sort={sorted ? ARIA_SORT[sorted] : undefined}
        // Right-click anywhere on the heading row. The browser menu is refused only
        // where we put something better in its place.
        {...drag(column.id, index)}
        {...(onHeaderMenu === undefined
      ? {}
      : {
          onContextMenu: (event: React.MouseEvent) => {
        event.preventDefault()
        onHeaderMenu({ x: event.clientX, y: event.clientY })
          },
        })}
        sorted={sorted !== undefined}
        align={column.align ?? 'start'}
        stuck={stuck}
        className={cn(
          'group/heading',
          // Where a dragged column would land. A line on the heading it is coming to rest
          // against, not a fill over it: the question is "between which two", and a filled box
          // answers a different one. The carried column fades so the two are told apart.
          over === column.id && 'ring-2 ring-inset ring-stroke-focus',
          carrying === column.id && 'opacity-40',
          // The corner control floats over this end of the row. With an actions column present
          // it sits over that column's empty heading and covers nothing; without one it would
          // sit on the last heading's words, so that heading keeps clear of it.
          !hasRowActions && index === columns.length - 1 && 'pr-10',
        )}
      >
        {/* THE PIN, ON HOVER AND ON FOCUS, NEVER AT REST. A control visible on every heading at
            all times is nine controls nobody asked for across a row people read; a control that
            appears only under the pointer is one a keyboard can never reach. Both states, which
            is one extra CSS condition — and the ruling is already written as a test name in
            the test that proves it, word for word.
            PINNING IS A BOUNDARY. Pressing this freezes everything from the edge up to and
            including this column, because a frozen column with the ones left of it scrolling out
            from under it leaves a hole beside it. Pressing the column that holds the boundary
            lets that edge go. */}
        {layout?.pinFor(column.id) ? (
          <button
            type="button"
            {...layout.pinFor(column.id)!}
            className={cn(
              'absolute top-1/2 right-6 z-10 grid size-icon-lg -translate-y-1/2 place-items-center rounded-control',
              'text-ink-muted hover:bg-surface-hover hover:text-ink',
              'opacity-0 group-hover/heading:opacity-100 group-focus-within/heading:opacity-100 focus-visible:opacity-100',
              'duration-swift transition-opacity ease-settle',
              layout.isPinned(column.id) && 'opacity-100 text-ink',
            )}
          >
            <Icon name="pin" className="size-icon-sm" />
          </button>
        ) : null}

        {/* THE EDGE YOU DRAG, and it is a real control rather than a bare pointer listener. A
            resize only a mouse can perform fails WCAG 2.1.1 and this product is keyboard-first,
            so the handle is focusable and moves on the arrow keys. It is invisible until it is
            hovered or has the keyboard: a table with a line down every heading reads as a grid
            of boxes, and the edge is discoverable by going to it, which is what a cursor
            change is for. Double-click gives the column back to whatever was deciding its
            width before anybody dragged it. */}
        {layout && column.resizable !== false ? (
          <span
            {...layout.handleFor(column.id)}
            className={cn(
              'absolute top-0 right-0 z-10 h-full w-2 cursor-col-resize',
              'after:absolute after:inset-y-1 after:right-1 after:w-px after:bg-stroke-strong',
              'after:opacity-0 hover:after:opacity-100 focus-visible:after:opacity-100',
              'after:duration-swift after:transition-opacity after:ease-settle',
              'outline-none',
            )}
          />
        ) : null}

        {column.sortable && onSort ? (
      // The whole header width is the hit target, but the mark sits beside the
      // words rather than at the far edge of the cell — on a wide Party Name
      // column it flew right and read as belonging to the column after it.
      //
      // On a right-aligned column the mark LEADS, so it is the label's right
      // edge that lines up with the figures underneath, not the mark's.
      <button
        type="button"
        onClick={() => onSort(column.id)}
        className={cn(
          'group/sort flex w-full items-center gap-1 outline-none',
          'focus-visible:underline hover:text-ink',
          column.align === 'end' && 'flex-row-reverse',
        )}
      >
        {column.header}
        <TableSortMark direction={sorted} />
      </button>
        ) : (
      column.header
        )}
      </TableHeading>
    )
      })}

      {hasRowActions ? <th scope="col" className="sticky top-0 z-20 border-b border-stroke bg-surface-sunken" /> : null}
    </tr>
    </thead>
  )
}
