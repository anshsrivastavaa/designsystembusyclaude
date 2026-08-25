// The column engine: resize by dragging an edge, pin to either side, and the widths both need.
//
// HEADLESS, BECAUSE THE TWO CONSUMERS CANNOT SHARE A COMPONENT. The listing renders a real
// <table>; the item grid renders divs wearing role="grid". A component would have to be written
// twice and would drift; a hook computes and the caller renders, so it is built once.
//
// THE CALLER OWNS THE STATE. `widths` and `pins` come in and changes go out, exactly as column
// ORDER already works. Both are things a person set and expects to still be there tomorrow, so
// they belong in a store beside columnOrder and hiddenColumns, not inside a component that
// unmounts when the screen changes.
//
// THE STORE HOLDS INTENT, NOT DERIVED STATE. `widths` carries only columns somebody deliberately
// dragged. Everything else is measured, because a sticky offset is a number of pixels and a
// column's declared width is a Tailwind class — `w-40` is a string, and converting every column
// on both screens buys nothing today.
//
// MEASURED BY COLUMN ID, NEVER BY WALKING THE HEADER ROW. v2's column-setup control is a hidden
// column overlaying the others, so the nth header cell is not the nth column and an offset built
// by walking children is wrong by one from the first pinned column onwards. Cells register
// themselves under their id through `measure`.
//
// MEASURED ONCE AND ON A ResizeObserver, NEVER PER RENDER. getBoundingClientRect on every header
// cell on every render is a forced layout in the hot path, which is the shape A spent a day
// chasing when a keystroke cost 1.3 seconds.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import { useHandle, type HandleProps } from './columnHandle'
import { edgeFor, isBoundary, type ColumnPins, type ColumnWidths } from './columnState'

export type { ColumnPins, ColumnWidths } from './columnState'

export type ColumnSpec = {
  id: string
  /** How the column's contents are aligned — and therefore WHICH EDGE it freezes against. Every
   * money and quantity column is `end`, and those are exactly the ones that should hold against
   * the right edge. Nobody is asked which side: the question has already been answered by what
   * kind of number the column holds. Left out, it freezes to the left. */
  align?: 'start' | 'end'
  /** Below this a column stops being readable. The clamp lives in the hook so both callers get
   * the same floor rather than each remembering to apply one. */
  minWidth?: number
  resizable?: boolean
  pinnable?: boolean
}

export type ColumnLayout = {
  /** The style for a column's own box. Null means "no opinion — use whatever you already had",
   * which is every column nobody has dragged. */
  sizeOf: (id: string) => CSSProperties | null
  /** The style for EVERY cell in a pinned column — header, body and totals alike. Empty for an
   * unpinned column. This is the whole of freezing: a sticky offset and a z-index. */
  pinOf: (id: string) => CSSProperties
  isPinned: (id: string) => 'start' | 'end' | null
  handleFor: (id: string) => HandleProps
  /** Props for the pin control on a heading. Null when the caller has not given a way to pin. */
  pinFor: (id: string) => PinProps | null
  /** Register a header cell so it can be measured. Returns a ref callback to put on the cell. */
  measure: (id: string) => (node: HTMLElement | null) => void
  /** True while a drag is in flight. Kill hover and text selection with it. */
  resizing: boolean
}

/** Props for the pin control on a heading, spread onto a plain button.
 *
 * SHOWN ON HOVER AND ON FOCUS, NEVER AT REST. That is a ruling this codebase already carries as
 * a test name, and the focus half is the whole of it: without it a keyboard
 * user can reach "Unpin all" in the column list but can never pin anything, which is an
 * asymmetry rather than a principle. One extra CSS state, not a menu item and not a shortcut. */
export type PinProps = {
  'aria-label': string
  'aria-pressed': boolean
  onClick: () => void
}

export type ColumnOptions = {
  columns: ColumnSpec[]
  widths: ColumnWidths
  onResize: (id: string, width: number) => void
  /** Which columns are frozen. The hook RENDERS pins; it does not set them — pinning is a menu
   * item on the caller's column setup, and `withPin` below is what that menu hands the store. A
   * setter here would be a prop the hook never calls. */
  pins: ColumnPins
  /** Freeze from an edge up to and including this column. Left out, no heading offers a pin —
   * which is a table that does not do freezing rather than one whose control is hidden. */
  onPin?: (id: string, side: 'start' | 'end') => void
}

/** Below this nothing is a column any more, it is a sliver. Callers may raise it per column. */
const FLOOR = 56

/** THE THREE Z TIERS, and they are the whole of the corner problem.
 *
 * The heading row is already sticky at the top and the totals row at the bottom, both above the
 * body. A pinned column crosses both, so its cells must sit ABOVE unpinned body cells and BELOW
 * the heading — while the two corner cells, sticky in two directions at once, must out-rank
 * everything. Measured on 22-08 with elementFromPoint at a scroller scrolled both ways: the
 * header corner painted over the header row, the pinned column over the scrolled body, and the
 * footer corner over the totals row. Three tiers, no bookkeeping.
 *
 * THE `border-separate` REQUIREMENT IS A <table> CONCERN AND NOTHING ELSE. Under
 * `border-collapse: collapse` the borders on sticky cells drop out entirely, so Table.tsx must
 * stay separate. It says nothing about a grid built from divs, which has no collapsing model to
 * fall into — this comment read as a rule for every consumer of these tiers and it is not one.
 * Scoped on 25-08 after the other session established the distinction.
 *
 * TWO THINGS v2 PAID A ROUND TO LEARN, kept here because the next person to freeze a column will
 * need both:
 *
 *   · THE LEFT FREEZE IS A BLOCK OF COLUMNS, NOT ONE. Every column up to the boundary is pinned,
 *     and only the LAST of them draws the edge line — a line on each pinned column reads as a
 *     table of narrow tables, and a line on none of them leaves the frozen block with no visible
 *     edge to be frozen against.
 *
 *   · A FROZEN BODY CELL HAS TO BE FORCED BACK TO `position: sticky`. Rules that a cell's own
 *     children carry — a relative wrapper, an absolutely-placed control — land later in the
 *     cascade and win, and the cell stops pinning and starts sliding sideways with the scroll.
 *     It looks like the sticky offset being wrong and it is the position itself being replaced. */
const Z_PINNED_CELL = 10
/** A cell sticky in two directions at once: a pinned column's header, and its totals cell. */
const Z_CORNER = 30

export function useColumns({ columns, widths, onResize, pins, onPin }: ColumnOptions): ColumnLayout {
  const cells = useRef(new Map<string, HTMLElement>())
  const [measured, setMeasured] = useState<Record<string, number>>({})
  const [resizing, setResizing] = useState(false)

  const floorFor = useCallback(
    (id: string) => columns.find((column) => column.id === id)?.minWidth ?? FLOOR,
    [columns],
  )

  // One observer for every registered cell, set up once. It fires when a cell's box changes for
  // ANY reason — density switching, the window resizing, a column being dragged — which is the
  // only way to keep the numbers true without asking for them on every render.
  useEffect(() => {
    const watcher = new ResizeObserver((entries) => {
      setMeasured((was) => {
        let next = was
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-column-id')
          if (id === null) continue
          const width = Math.round(entry.contentRect.width)
          if (was[id] === width) continue
          if (next === was) next = { ...was }
          next[id] = width
        }
        return next
      })
    })
    for (const node of cells.current.values()) watcher.observe(node)
    return () => watcher.disconnect()
  }, [columns])

  const measure = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      if (node === null) {
        cells.current.delete(id)
        return
      }
      node.setAttribute('data-column-id', id)
      cells.current.set(id, node)
    },
    [],
  )

  /** What a column is actually this wide, whoever decided it: what a person dragged, else what
   * was measured, else nothing known yet. */
  const widthOf = useCallback(
    (id: string): number | undefined => widths[id] ?? measured[id],
    [widths, measured],
  )

  // How far from its edge each pinned column sits — the sum of the pinned columns before it. Read
  // off the ids in `pins`, never off the order of the header row, because a hidden overlay column
  // makes the nth header cell not the nth column.
  const offsets = useMemo(() => {
    const found: Record<string, { side: 'start' | 'end'; offset: number }> = {}
    for (const side of ['start', 'end'] as const) {
      let running = 0
      for (const id of pins[side]) {
        found[id] = { side, offset: running }
        running += widthOf(id) ?? 0
      }
    }
    return found
  }, [pins, widthOf])

  const isPinned = useCallback((id: string) => offsets[id]?.side ?? null, [offsets])

  const sizeOf = useCallback(
    (id: string): CSSProperties | null => {
      const width = widths[id]
      return width === undefined ? null : { width: `${width}px` }
    },
    [widths],
  )

  const pinOf = useCallback(
    (id: string): CSSProperties => {
      const pin = offsets[id]
      if (pin === undefined) return {}
      return {
        position: 'sticky',
        [pin.side === 'start' ? 'left' : 'right']: `${pin.offset}px`,
        zIndex: Z_PINNED_CELL,
      }
    },
    [offsets],
  )

  const handleFor = useHandle({ widthOf, floorFor, onResize, onResizing: setResizing })

  const pinFor = useCallback(
    (id: string): PinProps | null => {
      if (onPin === undefined) return null
      const holding = isBoundary(pins, id)
      // THE ALIGNMENT CHOOSES THE EDGE. This read `holding ?? 'start'`, so every first press
      // froze to the LEFT and nothing could ever be held against the right — which is the entry
      // DECISIONS.md records as what was given up when this engine was built.
      const side = holding ?? edgeFor(columns.find((one) => one.id === id)?.align)
      return {
        // The verb changes with the state rather than a tick beside one that no longer applies.
        'aria-label': holding === null ? 'Freeze up to this column' : 'Unfreeze',
        'aria-pressed': holding !== null,
        onClick: () => onPin(id, side),
      }
    },
    [onPin, pins, columns],
  )

  return { sizeOf, pinOf, isPinned, handleFor, pinFor, measure, resizing }
}

export { Z_CORNER }
export type { HandleProps } from './columnHandle'
