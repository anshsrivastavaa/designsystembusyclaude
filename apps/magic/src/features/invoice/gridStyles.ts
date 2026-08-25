// How the item grid's columns are laid out: what each one measures, what a drag does to it, what
// is frozen, and the style that puts on every cell in it.
//
// OUT OF ItemGrid.tsx, which crossed the 250-line cap. The cap was right about which half had
// grown: the rest of that file draws a grid and wires a keyboard to it, and this is the column
// engine's whole conversation with the store.

import { useCallback, useMemo, type RefObject } from 'react'
import type * as React from 'react'

import { useColumns, type ColumnLayout } from '@busy/ui/columns'
import type { ColumnId } from '../../lib/keyboard'
import { freezeSideOf, MIN_WIDTHS } from './gridColumns'
import { snapshotWidths, useGridLayout } from './gridLayout'

export type GridStyles = {
  layout: ColumnLayout
  /** Width and freeze for each column, worked out once and handed down. */
  styleOf: Record<string, React.CSSProperties>
  /** The one column in each block that draws the edge line: the LAST of a left block and the
   * FIRST of a right one. Only that one, or the block reads as a row of narrow tables. */
  edges: { start: ColumnId | null; end: ColumnId | null }
  /** Every column inside either frozen block. */
  frozen: readonly string[]
}

export function useGridStyles(
  columns: readonly ColumnId[],
  headings: RefObject<HTMLElement | null>,
): GridStyles {
  const widths = useGridLayout((state) => state.widths)
  const pins = useGridLayout((state) => state.pins)
  const resizeColumn = useGridLayout((state) => state.resizeColumn)
  const pinColumn = useGridLayout((state) => state.pinColumn)

  // THE ALIGNMENT GOES TO THE ENGINE, AND THE ENGINE DECIDES THE EDGE. `freezeSideOf` is the
  // column's own answer to "which end does this belong to"; `useColumns` turns that into the side
  // its pin control freezes against, so this screen no longer overrides the control's `onClick`
  // to correct it. Session B landed that on 25-08.
  const specs = useMemo(
    () =>
      columns.map((id) => ({
        id,
        align: freezeSideOf(id),
        ...(MIN_WIDTHS[id] === undefined ? {} : { minWidth: MIN_WIDTHS[id] }),
      })),
    [columns],
  )
  const onResize = useCallback(
    (id: string, width: number) => resizeColumn(id, width, snapshotWidths(headings.current)),
    [resizeColumn],
  )
  const onPin = useCallback((id: string, side: 'start' | 'end') => pinColumn(id, side, columns), [pinColumn, columns])
  const layout = useColumns({ columns: specs, widths, onResize, pins, onPin })
  const { sizeOf, pinOf } = layout

  // ONE STYLE PER COLUMN, WORKED OUT ONCE AND HANDED DOWN, because `useColumns` returns a fresh
  // object every render and two thousand memoised rows holding it would all re-render on every
  // keystroke — the exact fault the column list above was memoised to fix, arriving by another
  // route. The functions inside it are stable, so this record only changes when a width or a
  // freeze actually does.
  //
  // `flex: 0 0 auto` RIDES WITH EVERY FIXED WIDTH, and without it the drag does nothing you can
  // see: these columns carry `basis-40 grow-40` classes, and flex-basis beats an inline width on
  // a flex item. The class comes off in fitted mode for the same reason.
  const styleOf = useMemo(() => {
    const found: Record<string, React.CSSProperties> = {}
    for (const id of columns) {
      const size = sizeOf(id)
      found[id] = { ...(size === null ? {} : { ...size, flex: '0 0 auto' }), ...pinOf(id) }
    }
    return found
  }, [columns, sizeOf, pinOf])

  // A FREEZE IS A BLOCK OF COLUMNS, NOT ONE — the row number and the item name on the left, the
  // amount on the right — and each block draws ONE edge, on the side it is held against: a left
  // block's line sits on the right of its last column, a right block's on the left of its first.
  // A line on every frozen column reads as a table of narrow tables; a line on none of them leaves
  // the block with no visible edge to be frozen against. Read out of v2's source, where it cost a
  // round to learn.
  const edges = {
    start: (pins.start.at(-1) as ColumnId | undefined) ?? null,
    end: (pins.end[0] as ColumnId | undefined) ?? null,
  }
  const frozen = useMemo(() => [...pins.start, ...pins.end], [pins])

  return { layout, styleOf, edges, frozen }
}
