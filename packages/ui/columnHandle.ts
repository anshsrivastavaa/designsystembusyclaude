// The control you drag a column's edge with.
//
// ITS OWN FILE because it is its own thing: the rest of the engine COMPUTES — widths, offsets,
// which cells are frozen — and this one is an interaction, with pointer capture, a keyboard
// path and a live drag to hold. columns.ts crossed 250 lines when the pin arrived and the cap
// was right about which half had grown.
//
// IT IS A REAL CONTROL, not a bare pointer listener. A resize only a mouse can perform fails
// WCAG 2.1.1 and this product is keyboard-first: the handle is focusable, says what it is,
// carries its current width, and moves on the arrow keys.

import { useCallback } from 'react'

/** How far one arrow press moves an edge. Small enough to be a nudge, large enough that holding
 * the key gets somewhere. */
const NUDGE = 8


/** Props for the drag handle on a column's trailing edge, spread onto a plain element.
 *
 * IT IS A REAL CONTROL, not a bare pointer listener. A resize only a mouse can perform fails
 * WCAG 2.1.1, and this product is keyboard-first: the handle is focusable, says what it is, and
 * moves on the arrow keys. */
export type HandleProps = {
  role: 'separator'
  'aria-orientation': 'vertical'
  'aria-label': string
  'aria-valuenow': number | undefined
  tabIndex: 0
  onPointerDown: (event: React.PointerEvent) => void
  onKeyDown: (event: React.KeyboardEvent) => void
  onDoubleClick: () => void
}


export type HandleOptions = {
  /** What the column is this wide now, whoever decided it. */
  widthOf: (id: string) => number | undefined
  /** The floor for this column — below it a column stops being readable. */
  floorFor: (id: string) => number
  onResize: (id: string, width: number) => void
  onResizing: (resizing: boolean) => void
}

export function useHandle({ widthOf, floorFor, onResize, onResizing }: HandleOptions) {
  const applyWidth = useCallback(
    (id: string, width: number) => onResize(id, Math.max(floorFor(id), Math.round(width))),
    [floorFor, onResize],
  )

  return useCallback(
    (id: string): HandleProps => ({
      role: 'separator',
      'aria-orientation': 'vertical',
      'aria-label': `Resize column`,
      'aria-valuenow': widthOf(id),
      tabIndex: 0,
      onPointerDown: (event) => {
        event.preventDefault()
        const from = event.clientX
        const start = widthOf(id) ?? floorFor(id)
        onResizing(true)
        const move = (moved: PointerEvent) => applyWidth(id, start + (moved.clientX - from))
        const done = () => {
          onResizing(false)
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', done)
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', done)
      },
      onKeyDown: (event) => {
        const step = event.key === 'ArrowLeft' ? -NUDGE : event.key === 'ArrowRight' ? NUDGE : 0
        if (step === 0) return
        event.preventDefault()
        applyWidth(id, (widthOf(id) ?? floorFor(id)) + step)
      },
      // Double-clicking an edge gives the column back to whoever was deciding its width before
      // anybody dragged it — which is the declared class, not a computed best fit.
      onDoubleClick: () => onResize(id, 0),
    }),
    [applyWidth, floorFor, onResize, onResizing, widthOf],
  )
}

