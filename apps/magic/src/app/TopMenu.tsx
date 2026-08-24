// A named menu in the top strip: a word, a chevron, and a surface under it.
//
// One component for all of them rather than six near-identical buttons, because the previous
// build's 158 duplicate definitions arrived exactly this way — each menu written where it was
// needed, each a little different, and by the time anybody noticed there was no one place to
// change the hover colour. The menus differ in what they CONTAIN, so the container stays
// generic and each caller is the named thing.
//
// It is a word, not an icon. Every one of these is a category rather than an action — User,
// Favourites, Housekeeping, Help — and a category has no picture that means it. The one icon
// button left in the strip is night mode, which does have one.

import * as React from 'react'

import { NotBuiltNote } from '@busy/ui/NotBuilt'
import { Popover } from '@busy/ui/Popover'

export type TopMenuProps = {
  label: string
  children: React.ReactNode
  /** Where the surface lines up under the word. The menus on the right of the strip hang from
   * their right edge, or they run off the window. */
  align?: 'start' | 'end'
}

export function TopMenu({ label, children, align = 'start' }: TopMenuProps) {
  const button = React.useRef<HTMLButtonElement>(null)
  const [open, setOpen] = React.useState(false)

  return (
    <>
      {/* NO CHEVRON, AND SMALLER. v2's top menu sits a step below body size in a tight box, with
          no gap between the buttons and no mark after the word — measured off the running build,
          where `.tmenu button svg` matches nothing at all. Ours had a chevron on each of the four
          and sat at body size, which made a row of navigation read with the weight of content.
          The size is the smallest authored step; v2's is one pixel under it, and one pixel is
          not worth a raw value. */}
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((was) => !was)}
        className="flex items-center rounded-control px-2 py-1 text-sm text-ink-secondary hover:bg-surface-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus"
      >
        {label}
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={button} label={label} align={align}>
        {children}
      </Popover>
    </>
  )
}

/**
 * What a menu says when it has nothing in it yet.
 *
 * A MENU THAT OPENS ONTO BLANK SPACE IS A FAULT, not an empty state. v2 has two of these with
 * no contents at all, and the person who opens one cannot tell whether the product is broken,
 * their permissions are wrong, or the feature does not exist. One sentence removes the
 * question — and it is written here once so the two of them cannot drift into two different
 * apologies.
 */
export function NothingHereYet({ what }: { what: string }) {
  return (
    <div className="max-w-64">
      <NotBuiltNote what={`${what} is not built yet`} />
      <p className="border-t border-stroke px-3 py-2 text-body text-ink-secondary">
        Nothing is hidden from you — there is nothing here to show.
      </p>
    </div>
  )
}
