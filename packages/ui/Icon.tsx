// Every icon in the product, and one name for each.
//
// PHOSPHOR, AT ONE WEIGHT. Until 20-08 these were thirty paths drawn by hand, on the argument
// that an icon package is a second design system arriving through the back door — its own
// stroke weight, its own optical sizing, its own idea of a grid, each fighting the tokens.
// That argument is answered rather than ignored: Phosphor has a weight axis, so the stroke is
// CHOSEN here to sit with our text rather than inherited from somebody else's taste, and the
// size still comes from the token layer through the class.
//
// ONE WEIGHT, AND IT IS `regular`. Our body text is 400 and the words icons sit beside are
// 510. Phosphor's regular stroke reads as those do at 16px; `bold` reads as a heading and
// makes a toolbar look shouted. Nothing in this product uses a second weight — a weight axis
// used twice is two icon sets.
//
// `filled` IS NOT A SECOND WEIGHT. It is a STATE, and it is the only exception: a star that has
// been added to favourites is the same star, filled in. The outline is the off state and the
// fill is the on state, which is how every product draws a favourite and how a person already
// reads one — and the alternative, a star that looks identical whether or not it is a
// favourite, is a control reporting a state it is not in. It may only be used where the outline
// form of the SAME icon is the off state; anywhere else it is the second icon set this file
// exists to prevent.
//
// A new icon is a line in the table below, never an SVG pasted into a screen. That is how the
// previous build ended up with four shopping baskets.
//
// TWO OF THEM ARE DRAWN HERE, AND ONLY TWO. The density pair — four bars against three, in the
// same height — says "the same rows, more of them fit", and Phosphor has no pair that says it:
// `Rows` is two outlined boxes and `ListDashes` is three dashed lines, neither of which is a
// count you can compare. They are drawn on Phosphor's own 256 grid with Phosphor's own regular
// stroke weight, sixteen units with a full round cap, so they sit in the same set rather than
// arriving as a second one. That is the argument at the top of this file honoured rather than
// waived: the objection to a hand-drawn icon is that it brings its own stroke, and this one
// does not bring its own anything.
//
// In packages/ui rather than beside the shell, because the shell and both screens draw them.
//
// Colour comes from `currentColor`, so an icon in a disabled control fades with its label
// rather than staying black on a grey button.

import {
  Bell,
  CaretDown,
  CaretLeft,
  CaretRight,
  Calendar,
  ChartBar,
  Copy,
  CurrencyInr,
  DotsThreeVertical,
  DownloadSimple,
  FunnelSimple,
  List,
  Lock,
  MagnifyingGlass,
  Moon,
  Package,
  PushPin,
  Paperclip,
  Plus,
  Printer,
  Question,
  Receipt,
  Rows,
  ShareNetwork,
  WhatsappLogo,
  Envelope,
  ShoppingCart,
  Sparkle,
  SquaresFour,
  Star,
  Trash,
  UsersThree,
  WarningCircle,
  X,
  type IconProps,
  GearSix,
  Check,
  Truck,
} from '@phosphor-icons/react'
import type * as React from 'react'

import { cn } from './cn'

/** Our name on the left, Phosphor's on the right. Ours are named for the JOB — `invoice`,
 * `party`, `report` — because a screen should not have to know what Phosphor calls a receipt
 * in order to draw one, and because the day this package is replaced, only this table moves. */
/** Bars filling the same height, however many there are. The outer extent is identical in both,
 * so the pair reads as a count changing rather than as a box changing size — which is the whole
 * claim: the same content, drawn looser or tighter. */
function Bars({ tops, className }: { tops: number[]; className?: string }) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" className={className} aria-hidden="true">
      {tops.map((top) => (
        <rect key={top} x="40" y={top} width="176" height="16" rx="8" />
      ))}
    </svg>
  )
}

/** Four bars in the height three occupy beside it. More rows on the screen.
 *
 * `filled` means nothing to these two — they are solid bars already, and there is no outline
 * form of them to be the off state. Passing it draws the same thing, which is only safe because
 * neither of them is ever a state anybody toggles. */
const DensityStandard = ({ className }: IconProps) => <Bars tops={[48, 96, 144, 192]} {...(className ? { className } : {})} />

/** Three bars in the same height. Fewer rows, each with more room. */
const DensityComfortable = ({ className }: IconProps) => <Bars tops={[48, 120, 192]} {...(className ? { className } : {})} />

const ICONS = {
  menu: List,
  search: MagnifyingGlass,
  calendar: Calendar,
  filter: FunnelSimple,
  rows: Rows,
  plus: Plus,
  chevronDown: CaretDown,
  chevronLeft: CaretLeft,
  chevronRight: CaretRight,
  close: X,
  star: Star,
  bell: Bell,
  printer: Printer,
  download: DownloadSimple,
  share: ShareNetwork,
  /** The three the save tail switches on: send it, print it, email it. */
  whatsapp: WhatsappLogo,
  email: Envelope,
  rupee: CurrencyInr,
  copy: Copy,
  trash: Trash,
  more: DotsThreeVertical,
  lock: Lock,
  help: Question,
  settings: GearSix,
  /** Files pinned to this invoice. */
  attach: Paperclip,
  /** Something came back yes — a GSTIN that checked out, a value that validated. */
  tick: Check,
  moon: Moon,
  sparkle: Sparkle,
  dashboard: SquaresFour,
  invoice: Receipt,
  purchase: ShoppingCart,
  item: Package,
  party: UsersThree,
  report: ChartBar,
  /** Something is wrong with a value. Its own name rather than `warning`, because it marks a
   * cell rather than announcing an alarm. */
  invalid: WarningCircle,
  /** Delivery and transport — bill-to, ship-to, and everything an E-Way Bill needs. v2 makes
   * the lorry the one control for all of it, on the invoice header. */
  /** Freezing a column against an edge. Phosphor's pin is a drawing pin rather than a map pin,
   * which is the one that means "hold this in place". */
  pin: PushPin,
  transport: Truck,
  /** The density pair. See the note at the top of this file for why these two are drawn here. */
  densityStandard: DensityStandard,
  densityComfortable: DensityComfortable,
} as const

export type IconName = keyof typeof ICONS

export function Icon({ name, filled = false, className, ...props }: { name: IconName; filled?: boolean } & IconProps) {
  const Drawn = ICONS[name]
  return (
    <Drawn
      weight={filled ? 'fill' : 'regular'}
      // The size is a token, and it arrives as a class so it can change with density without
      // this file knowing. Phosphor's own `size` prop is left alone: it writes width and
      // height attributes, and a class beats an attribute, so setting both would leave two
      // answers on the element and only one of them true.
      className={cn('size-icon-md shrink-0', className)}
      aria-hidden="true"
      {...(props as React.ComponentProps<typeof Drawn>)}
    />
  )
}
