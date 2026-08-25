// WHAT A PERSON SEES AS "THE FIELD", which is not the input.
//
// An input is usually painted transparent inside a box that draws the border, the radius and the
// focus ring — so the thing somebody points at, and the thing a list should line up with, is that
// box and not the element the caret is in.
//
// THIS COST THREE ROUNDS AND WAS INVISIBLE EVERY TIME. The party list was reported off its field,
// fixed by making the panel take the anchor's width as a minimum, and reported off its field
// again. Measured on the deployed build at 1470 wide: the frame is at 108 and 536 across, and the
// panel was at 109 and 490 — a perfect match to the INPUT, and 46px narrower than the box around
// it. Every measurement anybody took agreed, because everybody measured the anchor that had been
// passed in, and an anchor always agrees with itself.
//
// IT ASKS THE RENDERING RATHER THAN TAKING A PROP. A caller could pass the frame, and callers in
// two features would each have to remember to — and the one that forgot would look exactly like
// this bug again. The border is the definition: the box that draws it IS the field.

/** The nearest ancestor that actually draws a border, or the element itself if none does.
 *
 *  Bounded, because an unbounded walk would eventually find the page's own card and line a list
 *  up with the whole screen. Three levels covers an input inside a wrapper inside a frame, which
 *  is the deepest this build goes. */
export function fieldFrameOf(from: HTMLElement | null, levels = 3): HTMLElement | null {
  if (from === null) return null

  let at: HTMLElement | null = from.parentElement
  for (let step = 0; step < levels && at !== null; step += 1) {
    if (Number.parseFloat(getComputedStyle(at).borderTopWidth) > 0) return at
    at = at.parentElement
  }
  return from
}
