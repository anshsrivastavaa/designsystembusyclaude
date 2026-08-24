// When a dropped list opens, and when it goes away.
//
// Its own file because it is its own set of rules, and because those rules have collided with
// the rest of this codebase three separate times. The ComboBox owns typing, the keyboard and
// what is highlighted; this owns nothing but open, closed, and why.
//
// THE THREE COLLISIONS, all recorded because each looked like a different bug:
//
//   · Closing on SCROLL was safe until the screen became one scrolling column — after which
//     clicking a field low on the page scrolled it into view and closed the list a frame after
//     it opened. It follows the field now; that lives in anchoredTo.ts.
//   · Closing on BLUR alone left the list open over half the screen, because clicking a card or
//     a heading never blurs anything. A pointer landing outside closes it.
//   · Reopening on FOCUS undid that immediately: a click on something unfocusable drops the
//     keyboard on the page body, the containment net puts it straight back in the field, and
//     the list reopened. So a dismissal is REMEMBERED until the user asks again, or until they
//     genuinely leave the field — which the net's rescue is not, because it has no related
//     target.

import * as React from 'react'

export type ListOpening = {
  open: boolean
  /** Ask for it: typing, Alt+Down, or a pointer on a field that opens on arrival. */
  ask: () => void
  /** Put it away, and remember that it was put away. */
  dismiss: () => void
  /** Focus arrived. Opens only if this field opens on arrival and nobody has dismissed it. */
  arrived: () => void
  /** Focus left. A genuine departure — one with somewhere to go — forgets the dismissal. */
  left: (toSomewhere: boolean) => void
}

export function useListOpening(
  opensOnArrival: boolean,
  field: React.RefObject<HTMLElement | null>,
  panel: React.RefObject<HTMLElement | null>,
): ListOpening {
  const [open, setOpen] = React.useState(false)
  const dismissed = React.useRef(false)

  React.useEffect(() => {
    if (!open) return
    const away = (event: PointerEvent) => {
      const at = event.target
      if (!(at instanceof Node)) return
      if (field.current?.parentElement?.contains(at) === true) return
      if (panel.current?.contains(at) === true) return
      dismissed.current = true
      setOpen(false)
    }
    document.addEventListener('pointerdown', away, true)
    return () => document.removeEventListener('pointerdown', away, true)
  }, [open, field, panel])

  // A field that stops opening on arrival closes again: a cell that mounts empty and is filled
  // a moment later would otherwise keep the list it opened while it was still empty.
  React.useEffect(() => {
    if (!opensOnArrival) setOpen(false)
  }, [opensOnArrival])

  return {
    open,
    ask: () => {
      dismissed.current = false
      setOpen(true)
    },
    dismiss: () => {
      dismissed.current = true
      setOpen(false)
    },
    arrived: () => {
      if (!opensOnArrival || dismissed.current) return
      setOpen(true)
    },
    left: (toSomewhere: boolean) => {
      if (toSomewhere) dismissed.current = false
      setOpen(false)
    },
  }
}
