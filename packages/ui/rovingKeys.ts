// THE ARROWS WALKING A STRIP OF CONTROLS, which is what `role="toolbar"` promises.
//
// IT IS HERE AND NOT IN THE FEATURE THAT NEEDED IT. A screen writing its own `event.key ===
// 'ArrowRight'` is a key meaning decided in a second place, which is the whole reason this build
// keeps its shortcut table in one file — and the shape gate says so out loud. This is not a
// SHORTCUT though: it is a widget's own interaction, the same roving walk `Tabs` already has, and
// the answer to "who decides what ArrowRight means inside a toolbar" is the toolbar.
//
// EVERY CONTROL IS REACHABLE, INCLUDING THE ONES THAT ARE OFF. The ARIA pattern is explicit: a
// disabled item stays focusable so somebody can arrive at it and be told why. That only works if
// the items are `aria-disabled` rather than `disabled`, because a `disabled` element cannot take
// focus at all — six of the bulk bar's eight are switched off and every one of them exists to
// say why.
//
// THE ENDS STOP RATHER THAN WRAP. A strip you are reading is not a carousel, and the same ruling
// already holds for the table's rows.

/** Move focus along the controls inside `strip` when an arrow key arrives. Returns whether it
 *  handled the press, so a caller can decide what else it might have meant.
 *
 *  IT TAKES THE EVENT, NOT THE KEY. A caller reaching for `event.key` to hand it over has still
 *  named a key in a screen, and the gate that keeps key meanings in one table is right to say so —
 *  the point is not the string, it is where the decision lives. */
export function walkWithArrows(strip: HTMLElement | null, event: { key: string }): boolean {
  if (strip === null) return false
  const { key } = event
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return false

  const stops = [...strip.querySelectorAll<HTMLElement>('button, [role="button"]')]
  const at = stops.indexOf(document.activeElement as HTMLElement)
  if (at === -1) return false

  const next = Math.min(Math.max(at + (key === 'ArrowRight' ? 1 : -1), 0), stops.length - 1)
  stops[next]?.focus()
  return true
}
