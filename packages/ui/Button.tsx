// shadcn's Button, copied in as source we own and then edited. Three things changed, and
// each one is the reason this step existed.
//
// SIZES. shadcn ships eight fixed heights off Tailwind's scale — h-9, h-8, h-10 — and has no
// density axis at all. Ours are three, and each is a token that flips with density: 32/44,
// 26/36 and 38/50. A tablet gets the comfortable set and clears Apple's touch minimum on the
// default size without a second codebase.
//
// VARIANTS. shadcn's six are two here. `secondary` is gone: a grey-filled button in this
// product is a rectangle the user has to work out, because grey surfaces already mean input
// well and table header. `destructive` is gone: deleting a row is one of the most common
// things a wholesale user does on a two-thousand-row invoice, and colour here is for
// exceptions — a red control on a routine action spends the alarm colour on the least
// alarming thing in the product. `outline` arrived on 23-08 with the top strip. `link` arrives with the screen that needs
// them. Nothing is built before a screen asks.
//
// COLOURS. The class names below are shadcn's own, and they are defined once in
// shadcn-bridge.css reading from our tokens. The two exceptions are the hover highlight and
// its text: shadcn calls that `accent`, which in this system is the Busy blue, so those two
// type our names instead.

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from './cn'

const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 font-label whitespace-nowrap',
    'text-body outline-none',
    // The same ring every other control in the build wears. shadcn shipped this as a box-shadow
    // ring with an offset painted in the page colour, which is a different shape from the
    // outline everything else draws — and on a Button sitting on a sunken surface the offset
    // painted the wrong colour behind it. One ring, one utility.
    'focus-ring',
    // It gives way under the finger. See the utility for why three per cent and why it is one.
    'pressable',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-icon-md',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        // shadcn calls this hover colour `accent`. Ours is the brand blue, so this types our
        // name for it. See the note at the top of shadcn-bridge.css.
        ghost: 'text-foreground hover:bg-surface-hover',
        // The screen that needed it arrived: "Open POS counter" in the top strip. v2 draws it
        // with a hairline and dark ink, and strengthens only the border on hover — which on a
        // one-pixel line is very nearly invisible, and Aj read the strip as having no hover at
        // all. So the fill moves too.
        outline: 'border border-stroke bg-surface text-foreground hover:border-stroke-strong hover:bg-surface-hover',
      },
      size: {
        default: 'h-control px-4',
        sm: 'h-control-sm px-3',
        lg: 'h-control-lg px-6',
        // AN ICON-ONLY BUTTON CARRIES A BIGGER GLYPH than one with words in it. 16px is
        // --icon-md, and --icon-md exists to sit beside 14px body text — right inside the grid,
        // wrong in the chrome, where the icon IS the label and there is no text next to it to be
        // sized against. Measured on the running build: every chrome control drew at 16, because
        // the base rule below says so and nothing had ever overridden it.
        icon: 'size-control [&_svg]:size-icon-lg',
        'icon-sm': 'size-control-sm [&_svg]:size-icon-md',
        'icon-lg': 'size-control-lg [&_svg]:size-icon-xl',
      },
      // ROUND MEANS ICON-ONLY. It is the shape v2 gave every icon button in the chrome and the
      // one this build lost: a circle says "one action, no label", where the 6px corner every
      // other control wears says "this is a control with words in it". Two shapes, one meaning
      // each, and nothing has to be read to tell them apart.
      shape: {
        control: 'rounded-control',
        round: 'rounded-pill',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      shape: 'control',
    },
  },
)

function Button({
  className,
  variant,
  size,
  // EVERY VARIANT THIS COMPONENT DECLARES IS DESTRUCTURED AND HANDED TO cva. `shape` was
  // declared, typed, accepted at the call site — and not listed here, so it fell into `...props`
  // and was spread onto the <button> as an HTML attribute nobody reads. TypeScript was happy;
  // the screen still drew a 6px corner. Found by measuring the running page, not by the types.
  shape,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Component = asChild ? Slot : 'button'

  return (
    <Component
      data-slot="button"
      className={cn(buttonVariants({ variant, size, shape }), className)}
      {...props}
    />
  )
}

export { Button }
