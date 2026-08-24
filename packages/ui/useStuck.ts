// Whether a sticky element is currently STUCK, rather than merely sticky.
//
// CSS has no way to ask. `position: sticky` gives no state, no pseudo-class and no event, so a
// style that should apply only while an element is holding its position — the shadow under a
// stuck table heading — cannot be written in CSS alone.
//
// The trick is a sentinel of no height placed immediately before the sticky element. While the
// sentinel is in view the heading is in its normal place; the moment the sentinel scrolls out,
// the heading is stuck. An IntersectionObserver on the sentinel is therefore an exact answer,
// and it costs nothing per frame — unlike listening to scroll, which asks on every pixel.

import * as React from 'react'

export function useStuck(): [React.RefObject<HTMLDivElement | null>, boolean] {
  const sentinel = React.useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = React.useState(false)

  React.useEffect(() => {
    const mark = sentinel.current
    if (!mark) return

    // Against the nearest scrolling ancestor rather than the window: the screen scrolls inside
    // the shell, so the viewport is not what the heading is sticking to.
    const observer = new IntersectionObserver(([entry]) => setStuck(entry !== undefined && !entry.isIntersecting), {
      threshold: 1,
    })
    observer.observe(mark)
    return () => observer.disconnect()
  }, [])

  return [sentinel, stuck]
}
