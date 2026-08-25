// WHERE A PANEL GOES, as arithmetic with no DOM in it.
//
// SPLIT OUT OF Popover.tsx ON 25-08, when that file crossed 250 lines — which is the check saying
// it had become two things, and it had: measuring and placing a rectangle is not the same job as
// owning a surface's keyboard, its dismissal and its portal.
//
// THE WIN IS NOT TIDINESS. Every fault this placement has had was arithmetic — a stale width
// against a new window, a clamp collapsing to the edge, two alignments landing on the same left
// because the panel did not fit. All of those are answerable from four numbers, and none of them
// needed a browser to find. They needed somebody to be able to ASK.

/** The gap between a control and the surface it opens. */
const GAP = 4
/** How close to the window's own edge a panel may sit. */
const EDGE = 8

/** How tall a panel may get before it starts scrolling. `tall` is for a surface with sections
 *  rather than a list of rows — the settlement panel, which reads as a keyhole at the height a
 *  dropdown wants. Neither ever beats the window: see `roomFor`. */
const TALLEST = { default: 384, tall: 480 }

export type Box = { top: number; bottom: number; left: number; right: number; width: number; height: number }
export type Window = { width: number; height: number }

/** The tallest this panel may be, which is its own ceiling or the window, whichever is less. */
export function roomFor(height: 'default' | 'tall', window: Window): number {
  return Math.min(TALLEST[height], window.height - EDGE * 2)
}

/** Where to put the panel's top-left corner.
 *
 * BELOW UNLESS IT WILL NOT FIT AND THERE IS MORE ROOM ABOVE. Not "flip whenever it is past
 * halfway": a panel that fits below should stay below, because that is where the eye already is.
 *
 * CLAMPED ON BOTH AXES. On a short window neither side has room and flipping only helps when one
 * of them does — without the vertical clamp the panel simply hung off the bottom, which is the
 * same failure the flip was written to prevent. */
export function placeAt(
  anchor: Box,
  size: { width: number; height: number },
  window: Window,
  align: 'start' | 'end',
): { left: number; top: number } {
  const roomBelow = window.height - anchor.bottom - EDGE
  const above = size.height > roomBelow && anchor.top - EDGE > roomBelow
  const wantedTop = above ? anchor.top - size.height - GAP : anchor.bottom + GAP
  const lowest = window.height - size.height - EDGE
  const top = Math.min(Math.max(EDGE, wantedTop), Math.max(EDGE, lowest))

  const wantedLeft = align === 'end' ? anchor.right - size.width : anchor.left
  const furthest = window.width - size.width - EDGE
  const left = Math.min(Math.max(EDGE, wantedLeft), Math.max(EDGE, furthest))

  return { left, top }
}
