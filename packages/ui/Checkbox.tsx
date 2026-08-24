// The tick that selects a row, and the tick in the header that selects the page. Its first
// use is the invoice listing, where a selection turns into a bulk action.
//
// IT IS A REAL <input type="checkbox">, not a div painted to look like one. A styled div has
// to reimplement the space bar, the label click target, the form value and the way a screen
// reader announces "checked" — four things the browser already does correctly and for free.
// What is styled here is the box's colour and its size; everything that makes it a checkbox
// is the browser's.
//
// MIXED IS A REAL STATE, NOT A THIRD LOOK. A header tick over a page where some rows are
// picked is neither on nor off, and saying "off" would be a control reporting a state it is
// not in. The DOM carries that as `indeterminate`, which cannot be set from markup — only
// from JavaScript on the element — so it is set through the ref below, and the accessible
// name is told the same thing through aria-checked="mixed".

import * as React from 'react'

import { cn } from './cn'

export type CheckboxProps = Omit<React.ComponentProps<'input'>, 'type' | 'checked'> & {
  checked?: boolean
  /** Some but not all of the things below this one are picked. Overrides `checked` in the
   * DOM, because a mixed box is neither on nor off. */
  mixed?: boolean
}

export function Checkbox({ className, checked = false, mixed = false, ref, ...props }: CheckboxProps) {
  const box = React.useRef<HTMLInputElement>(null)

  // `indeterminate` is a property of the element and has no attribute, so it has to be
  // written to the node by hand on every render. React will not do it: it is not part of the
  // element's markup.
  //
  // LAYOUT EFFECT, NOT EFFECT. A plain effect runs after the browser has painted, so the
  // first frame of a mixed box was drawn as an empty one — the test caught it deterministically
  // with "expected false to be true" on `box.indeterminate` straight after mount. The dash has
  // to be on the node in the same frame as the rest of the row, and that is what this hook is.
  React.useLayoutEffect(() => {
    if (box.current) box.current.indeterminate = mixed
  })

  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      ref={(node) => {
        box.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      checked={checked}
      aria-checked={mixed ? 'mixed' : checked}
      className={cn(
        // size-4 is Tailwind's own spacing scale rather than a density token on purpose: a
        // tick does not grow with density. The row it sits in does, and a 24px tick in a
        // 48px row reads as a button by mistake. The touch target is the whole cell, which
        // the listing gives it, not the box.
        'size-4 shrink-0 cursor-pointer accent-accent',
        'focus-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
