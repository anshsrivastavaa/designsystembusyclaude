// One line in a top-strip menu.
//
// It exists so the four menus in the strip cannot each grow their own idea of what a menu line
// looks like — which is how the previous build ended up with 158 definitions of things that
// should have been one.
//
// EVERY LINE HERE IS SWITCHED OFF, AND SAYS SO. Editing a company, switching one, logging out
// and changing the financial year all need a backend that is not there. A menu of live-looking
// lines that do nothing when pressed is the fault this codebase is named after — the person who
// presses one cannot tell whether the product is broken or they are. So the line is disabled,
// and it carries the reason where a screen reader will read it out.
//
// The `title` is on a wrapping span rather than on the button, because a disabled control takes
// no pointer events and the browser never shows its tooltip.

import { NotBuiltMark } from '@busy/ui/NotBuilt'
import { cn } from '@busy/ui/cn'
import type { ReactNode } from 'react'

export type MenuLineProps = {
  children: ReactNode
  /** Off unless this line is the only unavailable one on its surface. Where EVERY line is,
   * the surface says it once at the top and the lines stop repeating it. */
  mark?: boolean
  /** A rule above it, for the line that means something different from the ones before it. */
  separated?: boolean
}

const NOT_BUILT = 'Not built yet — it needs a backend, which arrives with the dev team.'

export function MenuLine({ children, separated = false, mark = false }: MenuLineProps) {
  return (
    <span title={NOT_BUILT} className={cn('block', separated ? 'mt-1 border-t border-stroke pt-1' : null)}>
      <button
        type="button"
        disabled
        aria-label={`${String(children)} — ${NOT_BUILT}`}
        className="flex w-full cursor-not-allowed items-center gap-2 px-3 py-1.5 text-left text-body text-ink opacity-50"
      >
        {mark ? <NotBuiltMark /> : null}
        {children}
      </button>
    </span>
  )
}
