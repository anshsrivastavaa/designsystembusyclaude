// Which lines are picked, and taking them out together.
//
// DELETE AND NOTHING ELSE, ruled by Aj on 21-08. Selecting rows inside an invoice is for
// removing them: no change tax, no change warehouse, no apply discount. Those are a different
// size of feature and each of them has a better home than a bulk bar.
//
// BY ID, NEVER BY INDEX. Deleting three rows moves every row under them up, so a set of
// indices means something different the instant the first one goes — and the delete itself is
// the commonest thing to happen to a selection. Ids survive it.
//
// KEYBOARD ONLY, WHICH REVERSES v2. There, hovering a row revealed its tick. Here the tick
// appears only for a row that IS selected, because a tick that follows the pointer is a
// control offering itself on every row you pass over on the way to somewhere else. The cost —
// no mouse user can select at all — is written up for stakeholders, and this whole slice comes
// out in one piece if they say no.

import type { InvoiceRow } from '../../data/schema/invoice'

export type Selection = {
  /** The ids of the picked rows. Order is not meaningful; it is a set written as a list so it
   * compares by identity like everything else in this store. */
  selectedRowIds: readonly string[]
  toggleSelected: (rowId: string) => void
  clearSelection: () => void
  /** Takes the picked rows out and forgets them. Returns nothing: what the cursor does next is
   * the grid's business, and it needs the rows gone before it can decide. */
  removeSelected: () => void
}

type State = { rows: InvoiceRow[]; selectedRowIds: readonly string[] }
type Apply = (change: Partial<State> | ((state: State) => Partial<State>)) => void

export function selection(set: Apply): Selection {
  return {
    selectedRowIds: [],
    toggleSelected: (rowId) =>
      set((state) => ({
        selectedRowIds: state.selectedRowIds.includes(rowId)
          ? state.selectedRowIds.filter((id) => id !== rowId)
          : [...state.selectedRowIds, rowId],
      })),
    clearSelection: () => set({ selectedRowIds: [] }),
    removeSelected: () =>
      set((state) => {
        const going = new Set(state.selectedRowIds)
        if (going.size === 0) return {}
        const left = state.rows.filter((row) => !going.has(row.id))
        // AN INVOICE ALWAYS HAS A ROW TO TYPE INTO. Selecting every line and pressing delete
        // otherwise leaves a grid with no rows at all, which is not an empty invoice — it is a
        // screen with nothing on it and no way to start.
        return { rows: left.length > 0 ? left : state.rows.slice(0, 1), selectedRowIds: [] }
      }),
  }
}
