// The order the columns sit in once somebody has dragged one, and how that survives a column
// being switched on afterwards.
//
// PURE, SO IT CAN BE TESTED WITHOUT A SCREEN. It is the one piece of the column engine with
// real arithmetic in it that `columnState.reorder` does not already own: reorder moves an id
// inside a list it is already in, and this answers the harder question underneath — what the
// order MEANS once the list it was recorded against is no longer the list on the screen.
//
// THE ORDER IS RECORDED, THE VISIBLE SET IS NOT. A person turns MRP on a week after dragging
// Price to the front. The recorded order has never heard of MRP, so a naive "sort by recorded
// index" drops it to the end, where it reads as a column that arrived broken. Every column the
// recorded order does not know about goes back where the TAX MODE would have put it — beside
// the column it naturally follows — and only the ones actually dragged are honoured.

/** Fold what a person dragged over what this tax mode shows.
 *
 * `natural` is `columnsFor()`: the order the screen would be in if nobody had touched it.
 * `order` is what was recorded at the last drag, which may name columns that are now off and
 * may be missing columns that are now on. Empty means nobody has dragged anything. */
export function orderedColumns<Id extends string>(
  natural: readonly Id[],
  order: readonly string[],
): readonly Id[] {
  if (order.length === 0) return natural

  const placed = order.filter((id): id is Id => natural.includes(id as Id))
  const missing = natural.filter((id) => !placed.includes(id))
  if (missing.length === 0) return placed

  // Each column the recorded order never saw goes back beside its natural left-hand neighbour —
  // the nearest column before it that IS placed. Nothing before it means it belongs at the
  // front, which is what a newly-shown Item Alias does when Item Name has been dragged away.
  const settled = placed.slice()
  for (const id of missing) {
    const naturalAt = natural.indexOf(id)
    let after = -1
    for (let look = naturalAt - 1; look >= 0; look -= 1) {
      const neighbour = natural[look]
      if (neighbour !== undefined && settled.includes(neighbour)) {
        after = settled.indexOf(neighbour)
        break
      }
    }
    settled.splice(after + 1, 0, id)
  }
  return settled
}
