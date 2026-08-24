// The column state a caller holds, and the arithmetic that folds it.
//
// SEPARATE FROM THE HOOK because they are two things and the file said so by crossing 250 lines.
// This half is pure: no React, no measuring, no DOM. It is what a store keeps and what a menu
// hands back, and it can be tested without a browser — which is why `reorder` had five tests on
// it before it ever moved here.

/** What a person dragged, in pixels, by column id. Absent means "never touched — measure it". */
export type ColumnWidths = Record<string, number>

/** Which columns are frozen, and to which edge. Order within each side is the order they stack
 * outward from that edge. */
export type ColumnPins = { start: string[]; end: string[] }

/** Move one id to a position, keeping everything else in the order it was.
 *
 * HERE RATHER THAN IN THE LISTING'S STORE, where it lived with five tests on it. Column ORDER is
 * the third thing both tables do and the one with real arithmetic in it — removing an item
 * before inserting it shifts every index after it, and that is exactly the kind of fiddly line
 * that gets written twice and rounded differently the second time. The item grid has drag
 * pending; under this it arrives already built and already tested. */
export function reorder(order: string[], id: string, toIndex: number): string[] {
  const without = order.filter((one) => one !== id)
  const at = Math.max(0, Math.min(toIndex, without.length))
  return [...without.slice(0, at), id, ...without.slice(at)]
}

/** PINNING IS A BOUNDARY, NOT A PER-COLUMN SWITCH, and the product document has said so since
 * before the engine was written: "pinning the fourth column from the left freezes columns one to
 * four together; a single column cannot be frozen while the ones left of it scroll."
 *
 * That is the only coherent rule. Freezing Party while Date scrolls out from under it leaves a
 * frozen column with a hole beside it, and there is no arrangement of that which looks
 * deliberate. It is also why Aj's example — S.No and Item Name pinned together — is one action
 * rather than two: pinning Item Name pins what is left of it, because that is what freezing the
 * row's identity means.
 *
 * Two boundaries, one from each edge, and the middle scrolls between them.
 *
 * Pinning the column that is ALREADY the boundary lets that edge go, which is what makes the
 * one control both pin and unpin without a second verb. */
export function pinThrough(order: readonly string[], id: string, side: 'start' | 'end'): ColumnPins {
  const at = order.indexOf(id)
  if (at === -1) return { start: [], end: [] }
  return side === 'start'
    ? { start: order.slice(0, at + 1), end: [] }
    : { start: [], end: order.slice(at) }
}

/** Whether this column is the one holding a boundary open — the one a second press releases. */
export function isBoundary(pins: ColumnPins, id: string): 'start' | 'end' | null {
  if (pins.start.length > 0 && pins.start[pins.start.length - 1] === id) return 'start'
  if (pins.end.length > 0 && pins.end[0] === id) return 'end'
  return null
}
