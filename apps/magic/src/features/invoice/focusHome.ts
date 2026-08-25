// One module owns where the keyboard is.
//
// The ring used to be drawn from the grid's own idea of the cursor, and focus was pushed to
// follow it. Those two can disagree, and every time they did it looked like a different bug:
// a ring on a cell the keyboard had left, two rings on screen at once, keys landing on the
// page body. This codebase bans a control that reports a state it is not in, and a ring drawn
// from a variable is exactly that.
//
// So the ring is no longer drawn from anything. It is `:focus-within`, painted by the browser
// from the element that actually holds the keyboard — see Cell.tsx. And this module makes the
// other half true: nothing on this screen ever drops the keyboard on the page body.
//
// MAGIC IS KEYBOARD FRIENDLY, NOT KEYBOARD ONLY. Aj's ruling, 25-08, and it is the standing test
// for anything of this kind: the bar is "can somebody working by keyboard do the job well", never
// "can a keyboard reach every pixel". Keeping a control out of the tab order is done ON THAT
// CONTROL, which is a different mechanism from anything in this file — and measured on the
// running build, the shell does not do it: its eleven controls are ordinary buttons, and this
// file's Tab wrap was the only thing that had ever kept the keyboard off them. See docs/owed.md.

import { useEffect } from 'react'

import { focusable } from '../../lib/focusable'

/**
 * Anything that drops the keyboard on the page body gets it put back.
 *
 * IT NO LONGER WRAPS TAB, AND THE WRAP WAS A KEYBOARD TRAP. At the last control it consumed the
 * key and moved focus to the first itself, and the reverse at the first — so focus could never
 * leave the page: not to the top menu, which was the intention, and not to the browser's own
 * address bar, tab strip or extensions either, which nobody decided. WCAG 2.1.2 is the one
 * accessibility rule that is a flat prohibition rather than a quality bar.
 *
 * EVERY RESCUE IS COUNTED, on `data-keyboard-rescues` on the invoice. A correct screen never
 * needs one: the grid hands the keyboard on itself. The count is what the fuzz journey
 * watches, because asserting only that something holds the keyboard proves this net works
 * rather than that the grid is right — the net was making the test pass.
 */
export function useKeyboardStaysInside(container: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const invoice = container.current
    if (!invoice) return

    let rescues = 0
    const rescued = () => {
      rescues += 1
      invoice.dataset['keyboardRescues'] = String(rescues)
    }

    const onFocusOut = (event: FocusEvent) => {
      const goingTo = event.relatedTarget
      if (goingTo instanceof Node && invoice.contains(goingTo)) return
      // Nothing inside took it. Give it back to whatever was holding it, on the next tick so
      // this does not fight the browser's own focus handling.
      const previous = event.target
      setTimeout(() => {
        if (document.activeElement !== document.body) return
        // AND ONLY IF THE PAGE STILL HAS THE KEYBOARD AT ALL. `document.activeElement` is the body
        // in two situations that look identical from here: focus was DROPPED, and focus LEFT — to
        // the address bar, the tab strip, another window. Without this guard the net cannot tell
        // them apart, so it hauls the keyboard back out of the browser's own chrome, which is the
        // same trap the Tab wrap was. The wrap was the obvious half; this is the half under it.
        if (!document.hasFocus()) return
        rescued()
        if (previous instanceof HTMLElement && invoice.contains(previous)) previous.focus()
        else focusable(invoice)[0]?.focus()
      }, 0)
    }

    // Removing an element while it holds the keyboard does not always fire focusout — the
    // keyboard simply lands on the page body with nothing announced. So the check also runs
    // after every key, which is when rows appear and disappear.
    const restoreIfLost = () => {
      if (document.activeElement !== document.body) return
      // Same guard, same reason — see the note in `onFocusOut`.
      if (!document.hasFocus()) return
      rescued()
      focusable(invoice)[0]?.focus()
    }

    invoice.dataset['keyboardRescues'] = '0'
    invoice.addEventListener('focusout', onFocusOut)
    invoice.addEventListener('keyup', restoreIfLost)
    document.addEventListener('keyup', restoreIfLost)
    return () => {
      invoice.removeEventListener('focusout', onFocusOut)
      invoice.removeEventListener('keyup', restoreIfLost)
      document.removeEventListener('keyup', restoreIfLost)
    }
  }, [container])
}
