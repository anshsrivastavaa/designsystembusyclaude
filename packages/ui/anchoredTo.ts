// Where a floating panel sits, and keeping it there.
//
// Its own file because it is its own job. The ComboBox owns typing, the keyboard and what is
// highlighted; this owns one question — where on the window does the panel go, and what
// happens when the thing it points at moves.
//
// A previous attempt to lift this out silently dropped the effect and broke five journeys, so
// it moves WHOLE this time: the measuring, the listeners and their removal all travel together
// and nothing is left behind for a caller to remember.

import * as React from 'react'

export type Anchor = { left: number; top: number; width: number }

/** Never narrower than this, whatever the field is. An item cell is 90 pixels wide and a list
 * of item names in 90 pixels is a column of ellipses. */
const NARROWEST = 280

export function useAnchoredTo(
  field: React.RefObject<HTMLElement | null>,
  panel: React.RefObject<HTMLElement | null>,
  open: boolean,
) {
  const [anchor, setAnchor] = React.useState<Anchor | null>(null)

  const place = React.useCallback(() => {
    const box = field.current?.getBoundingClientRect()
    if (!box) return
    setAnchor({ left: box.left, top: box.bottom, width: Math.max(box.width, NARROWEST) })
  }, [field])

  React.useEffect(() => {
    if (!open) return
    place()

    // The panel FOLLOWS its field when the field moves. It used to close instead, which was
    // only safe while the screen could not scroll — after which clicking a field low on the
    // page scrolled it into view and closed the panel a frame after it opened, so the keypress
    // that opened it looked swallowed. Scrolling INSIDE the panel is not the field moving.
    const follow = (event: Event) => {
      const target = event.target
      if (target instanceof Node && panel.current?.contains(target)) return
      place()
    }
    window.addEventListener('scroll', follow, true)
    window.addEventListener('resize', follow)
    return () => {
      window.removeEventListener('scroll', follow, true)
      window.removeEventListener('resize', follow)
    }
  }, [open, place, panel])

  return { anchor, place }
}
