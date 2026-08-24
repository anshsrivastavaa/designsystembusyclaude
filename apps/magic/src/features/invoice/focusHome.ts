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
// other half true: the keyboard never leaves the invoice, so there is always exactly one.

import { useEffect } from 'react'

import { focusable } from '../../lib/focusable'
import { actionFor } from '../../lib/shortcuts'

/**
 * Tab walks the invoice and wraps at the ends rather than handing the page to the browser, and
 * anything that drops the keyboard on the page body gets it put back.
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

    const onKeyDown = (event: KeyboardEvent) => {
      // Which key this is comes from the one table, like every other shortcut.
      const action = actionFor(event)
      if (action !== 'next-field' && action !== 'previous-field') return

      const stops = focusable(invoice)
      if (stops.length === 0) return

      const first = stops[0]!
      const last = stops[stops.length - 1]!
      const active = document.activeElement

      // Only the ends are handled. Everywhere else the browser's own order is right and this
      // has no business overriding it.
      if (action === 'next-field' && active === last) {
        event.preventDefault()
        first.focus()
      } else if (action === 'previous-field' && active === first) {
        event.preventDefault()
        last.focus()
      }
    }

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
      rescued()
      focusable(invoice)[0]?.focus()
    }

    invoice.dataset['keyboardRescues'] = '0'
    invoice.addEventListener('keydown', onKeyDown, true)
    invoice.addEventListener('focusout', onFocusOut)
    invoice.addEventListener('keyup', restoreIfLost)
    document.addEventListener('keyup', restoreIfLost)
    return () => {
      invoice.removeEventListener('keydown', onKeyDown, true)
      invoice.removeEventListener('focusout', onFocusOut)
      invoice.removeEventListener('keyup', restoreIfLost)
      document.removeEventListener('keyup', restoreIfLost)
    }
  }, [container])
}
