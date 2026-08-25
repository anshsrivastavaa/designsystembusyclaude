// F2 walks the invoice: party → items → charges → save, and the last press SAVES rather than
// landing on the button. That condition is what keeps the F2 badge on Save honest.
//
// OUT OF CreateInvoice.tsx, which crossed the 250-line cap when the save tail arrived. The cap was
// right about which half had grown: the screen is an arrangement of regions, and this is a
// keyboard walk ACROSS them, which is its own thing and has its own reasons.

import { useEffect, type RefObject } from 'react'

import { actionFor } from '../../lib/shortcuts'
import { nextSection, sectionOf } from './nextSection'
import { useInvoice } from './store'

/**
 * IT LISTENS ON THE WHOLE DOCUMENT, in the capture phase, because F2 has to mean the same thing
 * wherever the keyboard is — including inside the item grid, which binds F2 for its own purposes,
 * and including on a control that is not in any section at all.
 *
 * NOT INSIDE A DRAWER. A drawer is a job you are in the middle of, and F2 creates the record
 * there — that binding is untouched, and this steps aside for it rather than fighting it.
 */
export function useSectionWalk(saveNow: RefObject<(() => void) | null>) {
  useEffect(() => {
    const jump = (event: KeyboardEvent) => {
      // Which key this is comes from the one table, like every other shortcut on the product.
      if (actionFor(event, 'global') !== 'next-section') return
      const active = document.activeElement
      if (active?.closest('[role="dialog"]') != null) return
      event.preventDefault()
      event.stopPropagation()

      const here = sectionOf(active)
      // Not in any section — the header, the top bar, nowhere. The invoice starts at the party,
      // so that is where "done with this" means to go.
      const going = here === null ? 'party' : nextSection(here)
      if (here === 'save' || going === 'save') {
        saveNow.current?.()
        return
      }
      // THE GRID IS ASKED THROUGH THE STORE, NOT THE DOM. A cell is a div until the cursor is
      // on it, so there is nothing to focus until the cursor has moved — placing the cursor is
      // what makes the field exist, and the cell then takes the keyboard itself.
      if (going === 'items') {
        useInvoice.getState().moveTo({ row: 0, column: 'item' })
        return
      }
      const landing = document.querySelector<HTMLElement>(
        going === 'party' ? '[aria-label="Party"] input' : '[aria-label="Bill sundry"] input',
      )
      landing?.focus()
    }
    document.addEventListener('keydown', jump, true)
    return () => document.removeEventListener('keydown', jump, true)
  }, [saveNow])
}
