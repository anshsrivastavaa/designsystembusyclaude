// F2 IS "DONE WITH THIS SECTION", and it walks the invoice: party → items → charges → save.
//
// v2 does this already and it is the one shortcut a fast operator uses all day. The sections
// are the four things an invoice is made of, in the order it is filled in.
//
// THE LAST JUMP SAVES. Ruled by Aj on 23-08, and it is the condition on the F2 badge staying on
// the Save button: if F2 only put the keyboard ON Save, the badge would be saying "F2 saves"
// while F2 did not, and a control that reports a state it is not in comes off. The reasoning
// runs the other way too — if F2 means "done with this section", then done with the last
// section IS saving, so F2 is genuinely Save's key.
//
// THIS MODULE ONLY SAYS WHERE NEXT. What each section does with the keyboard is the screen's
// business, and the two are separated so the ORDER can be tested without a browser.

export const SECTIONS = ['party', 'items', 'sundry', 'save'] as const
export type Section = (typeof SECTIONS)[number]

/** Where F2 goes from here. The last section has nowhere further, and that is what makes it
 * save rather than move. */
export function nextSection(from: Section): Section {
  const at = SECTIONS.indexOf(from)
  return SECTIONS[Math.min(at + 1, SECTIONS.length - 1)]!
}

/** Which section the keyboard is in, from the element holding it.
 *
 * ASKED OF THE DOM RATHER THAN HELD IN STATE, because the keyboard can be moved by a click, a
 * drawer closing or the containment net, and a variable saying where it "should" be is the
 * thing this codebase keeps finding out of step with where it is. */
export function sectionOf(active: Element | null): Section | null {
  if (active === null) return null
  if (active.closest('[aria-label="Party"]') !== null) return 'party'
  if (active.closest('[aria-label="Invoice items"]') !== null) return 'items'
  if (active.closest('[aria-label="Bill sundry"]') !== null) return 'sundry'
  if (active.closest('[aria-label="Invoice actions"]') !== null) return 'save'
  return null
}
