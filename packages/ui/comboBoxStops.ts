// Where the arrow keys stop, and what is under the highlight when they get there.
//
// Its own file because it is its own thing: the ComboBox owns typing, focus and the keyboard,
// this owns the arithmetic of a list that has pinned rows above AND below it. Pure, so the
// off-by-one that a pinned row invites is caught by a test rather than by somebody arrowing
// past the end of a list on a demo.
//
// The order on the screen is the order of the stops, which is the whole rule:
//
//   0                     the leading pinned row, when there is one
//   lead … lead+n-1       the options
//   lead+n                the trailing pinned row, when there is one

export type Stops = {
  /** How many stops there are in total. Zero means an empty list with nothing pinned to it. */
  count: number
  /** True when the highlight is on the row pinned above the options. */
  onLeadRow: boolean
  /** True when the highlight is on the row pinned below them. */
  onStickyRow: boolean
  /** Which option is under the highlight, or -1 when a pinned row is. */
  optionIndex: number
}

/** No row is under the highlight. Not zero — zero is the first row. */
export const NOTHING = -1

export function stopsOf(
  optionCount: number,
  highlight: number,
  { hasLead = false, hasSticky = false }: { hasLead?: boolean; hasSticky?: boolean },
): Stops {
  const lead = hasLead ? 1 : 0
  const count = lead + optionCount + (hasSticky ? 1 : 0)

  if (highlight === NOTHING) return { count, onLeadRow: false, onStickyRow: false, optionIndex: NOTHING }

  const onLeadRow = hasLead && highlight === 0
  const onStickyRow = hasSticky && highlight === lead + optionCount

  if (onLeadRow || onStickyRow || optionCount === 0) return { count, onLeadRow, onStickyRow, optionIndex: NOTHING }

  // Clamped rather than trusted: the option list changes under the highlight as the user
  // types, and a highlight left pointing past the end reads as "nothing selected" when the
  // last row is plainly there.
  return { count, onLeadRow, onStickyRow, optionIndex: Math.min(Math.max(highlight - lead, 0), optionCount - 1) }
}

/** Where the next arrow press lands. Wraps both ways, and stays put when there is nowhere to
 * go — a list with no stops must not move the highlight to somewhere that does not exist.
 *
 * From NOTHING, down goes to the first stop and up goes to the last: the arrows are how you
 * enter a list that opened without being asked. */
export function nextStop(from: number, step: 1 | -1, count: number): number {
  if (count === 0) return NOTHING
  if (from === NOTHING) return step === 1 ? 0 : count - 1
  return (from + step + count) % count
}
