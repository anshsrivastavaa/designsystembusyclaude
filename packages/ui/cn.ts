// shadcn's own helper, copied in and then taught about our utilities.
//
// It merges class strings and lets a later Tailwind class beat an earlier one that sets the
// same property, which is what makes a `className` prop actually override a component's own
// styling instead of fighting it.
//
// The extension below is not decoration. tailwind-merge groups classes by the property they
// set, and it works that out from the class NAME. Our hand-authored utilities are names it
// has never seen: it read `text-body` as a text colour, decided it conflicted with
// `text-primary-foreground`, and dropped it — so the Button rendered at the browser's
// default size instead of the density's. A component test caught it.
//
// AND THEN THE LIST WENT STALE, WHICH THE OLD COMMENT HERE CLAIMED WAS IMPOSSIBLE. It said
// every authored utility was listed; it listed one of the six sizes. `text-caps`,
// `text-heading` and `text-title` were each dropped the moment a colour followed them in the
// same cn() — silently, because the class IS typed in the source and DOES build, so every gate
// was satisfied while the size never reached the element. Found on 23-08 when a brand-new key
// cap rendered at sixteen pixels instead of eleven.
//
// Every utility authored in packages/tokens/utilities.css is listed below, and a gate now fails
// the build when one is not — a list that claims to be complete and has no check is a comment,
// not a rule.

import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': ['text-body', 'text-caps', 'text-sm', 'text-lg', 'text-heading', 'text-title'],
      h: ['h-control', 'h-control-sm', 'h-control-lg', 'h-row'],
      w: ['w-drawer'],
      size: [
        'size-control', 'size-control-sm', 'size-control-lg',
        'size-icon-xs', 'size-icon-sm', 'size-icon-md', 'size-icon-lg', 'size-icon-xl',
      ],
      'bg-color': ['bg-scrim'],
      shadow: ['shadow-raised', 'shadow-popover', 'shadow-dialog', 'shadow-drawer'],
      // A duration and an animation are different properties, so they are different groups: a
      // component may carry both `motion-rise` and `duration-swift` without either winning.
      duration: ['duration-swift', 'duration-glide', 'duration-enter', 'duration-leave'],
      animate: ['motion-rise', 'motion-drop'],
      // The four rings go in tailwind-merge's outline-offset group, which is the property that
      // actually differs between them, so a component that inherits one and sets another gets
      // the one it set rather than two rings fighting. A brand-new group id would have been the
      // tidier name and the library's types do not allow one without a cast, which would be a
      // cast written to make a name look nicer.
      'outline-offset': [
        'focus-ring', 'focus-ring-inset', 'focus-ring-within', 'focus-ring-within-inset',
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
