// The screen's own header, and it is ONE WHITE PLANE running down from the top bar.
//
// v2's arrangement, copied rather than derived — Aj has asked for it three times and each
// attempt at deriving it produced three stacked strips instead of one object. The plane is the
// point: the chrome above the grid is a single surface, so the top bar, the title row and the
// party row read as one piece of furniture with the grid sitting under it.
//
// LEFT TO RIGHT: the back control on a filled block, the title with its voucher chevron, then
// the star. v2 puts the star BEFORE the title; ours goes after, which is a deliberate
// difference decided before v3 started. Then the spacer, then attachments and invoice
// settings.
//
// INVOICE SETTINGS LIVES HERE, not in the shell. Settings that belong to an invoice belong on
// the invoice: a gear in the frame says "the application", and this one governs one screen.

// EVERY PRESSABLE THING IN THIS HEADER GIVES WAY UNDER THE FINGER, and the class is `pressable`.
//
// IT WAS FOUR CLASSES WRITTEN OUT AT SIX PLACES FOR HALF A DAY, while the utility that owns this
// was Session B's to write and had not landed. It has now, so they collapse onto it — and it is
// not the same thing spelled differently: the hand-written run set Tailwind's `scale` PROPERTY,
// which `transition-property: transform` does not cover, so the eased press was easing nothing
// the transition knew about. `pressable` sets `transform` and owns the whole transition, because
// an element gets one `transition-property` and `transition-colors` beside it wins the fight.
//
// The star, the paperclip and the gear need nothing here: `Button` wears it now.
import { Button } from '@busy/ui/Button'
import { Icon } from '@busy/ui/Icon'
import { Attachments } from './Attachments'
import { VoucherSwitch } from './VoucherSwitch'
import type { VoucherType } from './voucherTypes'

export type InvoiceHeaderProps = {
  /** What this document IS. The title is not decoration — it is the switcher's own label, and
   * changing it is how the document changes kind. */
  type: VoucherType
  onSwitch: (next: VoucherType) => void
  favourite: boolean
  onFavourite: () => void
  onBack: () => void
  onSettings: () => void
}

export function InvoiceHeader({ type, onSwitch, favourite, onFavourite, onBack, onSettings }: InvoiceHeaderProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 pr-2">
      {/* Filled, and rounded on its right side only — it runs off the left edge of the plane,
          which is what makes it read as cut into the surface rather than sitting on it. */}
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="grid size-control-sm shrink-0 place-items-center rounded-r-card bg-surface-sunken text-ink-muted pressable hover:text-ink focus-ring"
      >
        <Icon name="chevronLeft" className="size-icon-lg" />
      </button>

      <VoucherSwitch type={type} onSwitch={onSwitch} />

      {/* AFTER the title, which is where this build differs from v2 on purpose.
          IT SAYS WHICH STATE IT IS IN, IN THREE WAYS. A star that only changes ink between two
          greys says nothing to somebody who has never seen the other state — and nothing at all
          to somebody who cannot tell the two greys apart. So the ink changes, the fill changes,
          and the NAME changes: "Added to favourites" against "Add to favourites" is what a
          screen reader reads out and what the tooltip says. `aria-pressed` alone is a state
          only assistive software could ever report.
          THE FOURTH WAY IS THE FILL, and it arrived with Icon's filled state. It is a STATE and
          not a second weight — the same star, filled for on and outline for off — which is the
          one thing the fill is used for in this product. A favourite that looks the same either
          way is a lie, and until this landed the two greys were doing that work alone. */}
      <Button
        size="icon-sm"
        variant="ghost"
        aria-pressed={favourite}
        aria-label={favourite ? 'Added to favourites' : 'Add to favourites'}
        title={favourite ? 'Added to favourites' : 'Add to favourites'}
        onClick={onFavourite}
        className={favourite ? 'text-ink-accent' : 'text-ink-muted'}
      >
        <Icon name="star" filled={favourite} />
      </Button>

      <span className="flex-1" />

      {/* THE PAPERCLIP BRINGS ITS OWN PANEL. It was a bare button here with an `onAttach` the
          screen filled in with `() => undefined` — a control that looks live, announces nothing
          and does nothing, which is the one thing this codebase bans outright. What is behind
          it is the invoice's business rather than the header's, so the header holds the named
          wrapper and knows nothing about files. */}
      <Attachments />
      <Button size="icon-sm" variant="ghost" aria-label="Invoice settings" onClick={onSettings} className="text-ink-muted">
        <Icon name="settings" />
      </Button>
    </div>
  )
}
