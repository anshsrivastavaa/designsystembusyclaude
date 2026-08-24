// What the keyboard can stop on, in the order Tab visits it.
//
// ONE DEFINITION. The invoice's own net had this inside it, and the shell then needed the same
// answer when a screen change left the keyboard on the page body. A second copy of "what counts
// as a control" is the sort of thing that stays right for a week and then quietly disagrees —
// one of them learns about disabled buttons and the other does not.

/** Everything inside `within` the keyboard can stop on, in the order Tab visits it. */
export function focusable(within: HTMLElement): HTMLElement[] {
  const candidates = within.querySelectorAll<HTMLElement>(
    'input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  return [...candidates].filter(
    (element) =>
      // A button carrying tabindex="-1" is deliberately not a stop, whatever kind of element
      // it is. Treating it as one sent Tab to a control nobody could see.
      element.getAttribute('tabindex') !== '-1' &&
      (element.offsetParent !== null || element === document.activeElement),
  )
}
