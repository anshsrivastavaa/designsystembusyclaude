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
 * THE COLUMN'S ALIGNMENT CHOOSES THE EDGE, AND NOBODY IS ASKED. A left-aligned column freezes to
 * the left: everything from the left edge through it. A RIGHT-aligned column — which is every
 * money and every quantity column — freezes to the right: it and everything to its right. The
 * question "which side?" has already been answered by what kind of number the column holds, so
 * putting it to a person is asking them to repeat themselves.
 *
 * BOTH EDGES AT ONCE, which is the half this did not have. It took a `side` argument and cleared
 * the opposite edge every time, so a right pin threw away a left one. The shape Aj ruled is v2's
 * and needs both standing together: Sr. and Item Name held on the left, Amount held on the right,
 * and the middle scrolling between them. `DECISIONS.md` records "nothing can be frozen against
 * the right edge" as what was given up when this engine was built — this is the entry that closes.
 *
 * PINNING THE COLUMN THAT IS ALREADY A BOUNDARY RELEASES THAT EDGE, and only that edge, which is
 * what makes one control both pin and unpin without a second verb.
 *
 * THE TWO BLOCKS MAY NOT OVERLAP. Pinning right through a column that the left block already
 * holds would freeze the same column to both edges, which is not a thing a column can do — so the
 * older block gives way to the one just asked for. */
/** `pins` is LAST AND OPTIONAL on purpose, so the three-argument form the other session's grid
 *  still uses keeps compiling and keeps its old behaviour — a pin with nothing to carry forward
 *  clears the opposite edge, which is exactly what the old signature did. Two sessions cannot
 *  land one signature change in the same instant, and a red main between them helps nobody. */
export function pinThrough(
  order: readonly string[],
  id: string,
  align: 'start' | 'end',
  pins: ColumnPins = { start: [], end: [] },
): ColumnPins {
  const at = order.indexOf(id)
  if (at === -1) return pins

  // A second press on the boundary itself lets that edge go. The other edge is untouched.
  if (isBoundary(pins, id) === align) {
    return align === 'start' ? { start: [], end: pins.end } : { start: pins.start, end: [] }
  }

  const index = (one: string) => order.indexOf(one)
  return align === 'start'
    ? { start: order.slice(0, at + 1), end: pins.end.filter((one) => index(one) > at) }
    : { start: pins.start.filter((one) => index(one) < at), end: order.slice(at) }
}

/** Which edge a column freezes against, given how it is aligned. The whole of the rule, written
 *  once, so no caller decides it a second time and differently. */
export function edgeFor(align: 'start' | 'end' | undefined): 'start' | 'end' {
  return align === 'end' ? 'end' : 'start'
}

/** Whether this column is the one holding a boundary open — the one a second press releases. */
export function isBoundary(pins: ColumnPins, id: string): 'start' | 'end' | null {
  if (pins.start.length > 0 && pins.start[pins.start.length - 1] === id) return 'start'
  if (pins.end.length > 0 && pins.end[0] === id) return 'end'
  return null
}
