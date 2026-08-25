// How wide the item grid's columns are, which of them are frozen, and what order they sit in.
//
// ITS OWN STORE, NOT THE INVOICE'S. `store.ts` is the invoice being edited, and `reset()`
// throws all of it away when somebody starts a new one. A column somebody dragged wider is not
// part of the invoice: it is how this person likes the screen, and it must still be there on
// the next invoice and tomorrow morning. Putting it in the invoice store would have meant
// remembering to exempt it from every reset, which is the kind of thing that gets forgotten
// once and then looks like the width control being broken.
//
// WHICH COLUMNS ARE SHOWN IS NOT HERE. That lives in the shell's settings, arrives as a prop
// and goes back through `onSetColumn`. Two places that can disagree about one thing is the
// fault this codebase keeps catching; the shell already owns the answer, so this store must
// not hold a second copy of it.

import { create } from 'zustand'

import { pinThrough, reorder, type ColumnPins, type ColumnWidths } from '@busy/ui/columnState'

/** THE TWO WIDTH MODES, WHICH ARE v2's AND ARE THE HALF THAT WAS MISSING HERE.
 *
 * SHARE — the default. Every column carries a grow weight equal to its own width, so the grid
 * fills its box at any window size and the ratios hold. Nothing scrolls sideways because
 * nothing can be wider than the box.
 *
 * FIT — the moment somebody drags an edge. Every column's width is snapshotted in pixels and
 * the grid stops sharing: it is as wide as its columns add up to, and the box scrolls to it.
 *
 * THE SNAPSHOT IS OF EVERY COLUMN, NOT THE DRAGGED ONE, and that is the whole trick. Fix one
 * column and leave the rest flexing, and the space the drag took has to come from somewhere:
 * it comes out of the one column that still grows, so dragging Price wider visibly narrows
 * Item Name and the number under the cursor is not the number that moved. v2 pins its table to
 * the column sum for the same reason and says so in its own words — "that ballooned Item and
 * collapsed the rest".
 *
 * WHICH MODE IS ON IS NOT STORED. It is `widths` being empty or not, because a stored mode is a
 * second thing that can disagree with the widths it describes. */
export function isFitted(widths: ColumnWidths): boolean {
  return Object.keys(widths).length > 0
}

/** Read every heading's real width off the screen, so the first drag has something to fix the
 * other columns at.
 *
 * REFUSES TO ANSWER BEFORE THE GRID IS LAID OUT. A heading measuring zero means the grid is not
 * on the screen yet, and writing those zeroes down would fix every column at nothing and leave
 * a person no way back — v2 hit exactly this and guards it in the same place.
 *
 * IT READS `data-column-id`, WHICH `useColumns.measure` ALREADY STAMPS. Not a second measuring
 * system: the same attribute the engine puts there, read at the one moment a snapshot is owed. */
export function snapshotWidths(row: HTMLElement | null): ColumnWidths | null {
  if (row === null) return null
  const cells = [...row.querySelectorAll<HTMLElement>('[data-column-id]')]
  if (cells.length === 0) return null
  const taken: ColumnWidths = {}
  for (const cell of cells) {
    const id = cell.getAttribute('data-column-id')
    const width = Math.round(cell.getBoundingClientRect().width)
    if (id === null || width <= 0) return null
    taken[id] = width
  }
  return taken
}

type GridLayoutState = {
  widths: ColumnWidths
  pins: ColumnPins
  /** What was recorded at the last drag. Empty means the tax mode decides the order. */
  order: string[]
  /** A drag on an edge. `from` is every column's width read off the screen at the moment the
   * drag began, and it is written down whole the first time — see the two modes above. */
  resizeColumn: (id: string, width: number, from: ColumnWidths | null) => void
  pinColumn: (id: string, side: 'start' | 'end', showing: readonly string[]) => void
  unpinAll: () => void
  /** Move a column so it sits at `toIndex` among the columns on the screen now. */
  moveColumn: (id: string, toIndex: number, showing: readonly string[]) => void
  /** Everything back to how the screen opens: shared widths, nothing frozen, the tax mode's
   * own order. One action, because a person who wants their layout back wants all of it. */
  resetColumns: () => void
}

export const useGridLayout = create<GridLayoutState>((set) => ({
  widths: {},
  pins: { start: [], end: [] },
  order: [],

  resizeColumn: (id, width, from) =>
    set((state) => {
      // Double-clicking an edge asks for that column back at its declared width, which the
      // engine sends as a zero. In FIT mode that means taking its entry out and letting its
      // own basis decide again; there is no free space to grow into, so it lands where the
      // table of widths always said it should.
      if (width === 0) {
        const rest = { ...state.widths }
        delete rest[id]
        return { widths: rest }
      }
      if (isFitted(state.widths)) return { widths: { ...state.widths, [id]: width } }
      // The first drag. Nothing to fix the others at means nothing to drag against, so the
      // press does nothing at all rather than fixing this one column and squeezing the rest.
      if (from === null) return {}
      return { widths: { ...from, [id]: width } }
    }),

  // FROZEN AGAINST THE ORDER ON THE SCREEN, WHICH IS NOT ALWAYS THE ORDER IN THIS STORE.
  // `order` is empty until somebody drags, and freezing "up to Item Name" has to mean the
  // columns actually left of it — so the caller hands in what the screen is showing, the same
  // way `moveColumn` does. Reading `order` here would have frozen nothing at all until a
  // column had been dragged first.
  pinColumn: (id, side, showing) =>
    set((state) => {
      // Pinning the column that already holds the boundary lets that edge go, which is what
      // makes one control both freeze and unfreeze. The engine's `pinFor` sends the side.
      // THE WHOLE ANSWER COMES FROM `pinThrough` NOW. It used to return a `ColumnPins` with the
      // side you did not ask about emptied, so freezing Amount on the right threw away the left
      // block — and this carried the other side over by hand. Session B fixed the engine on 25-08:
      // the existing pins go IN and both boundaries come back, with the two blocks kept from
      // overlapping. Carrying it over here as well would be a second answer to one question.
      return { pins: pinThrough(showing, id, side, state.pins) }
    }),

  unpinAll: () => set({ pins: { start: [], end: [] } }),

  moveColumn: (id, toIndex, showing) =>
    set((state) => ({ order: reorder(state.order.length > 0 ? [...state.order] : [...showing], id, toIndex) })),

  resetColumns: () => set({ widths: {}, pins: { start: [], end: [] }, order: [] }),
}))
