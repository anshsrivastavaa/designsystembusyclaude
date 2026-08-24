// One mark, and one sentence, for everything the product will do and we have not built.
//
// WHY THIS EXISTS AT ALL. Roughly two-thirds of what is on screen is switched off with a reason
// — eight of nine rail items, every line in every top menu, four of five listings, night mode,
// fourteen row-menu actions, eight bulk-bar buttons. Every one of those decisions is right on
// its own, and none of them is reversed here: a live-looking control that does nothing is still
// worse than a dead one that says why. But added up, twenty individually reasoned treatments
// read as one thing to somebody who did not build it — "it does not do much yet" — and the only
// way to tell the finished product from the sketch is to hover one control at a time.
//
// THE DOT IS THE WHOLE OF THE DIFFERENCE, and it separates two states that look identical today
// and lead to opposite next actions:
//
//   · NOT BUILT YET — a gap in the product. Nobody can act on it. It gets the dot.
//   · NOT ALLOWED HERE — a fact about this record: the invoice is cancelled, nothing is
//     outstanding. Often fixable, and about YOUR data rather than ours. No dot.
//
// SAME INK FOR BOTH. An earlier sketch had 65% for one and 50% for the other as well as the
// dot. That is two signals for one distinction, and two greys fifteen percent apart are not a
// difference anybody can rely on — so neither signal ends up carrying the meaning. The ink says
// "unavailable" and the dot says "unavailable because we have not built it". One job each.
//
// IT IS A MARK, NOT A CHIP. Chips are already the language of DATA states in the status column,
// and a chip reading "not built yet" would put "this invoice is cancelled" and "we have not
// built this" into the same visual vocabulary — which is the exact conflation the dot exists to
// prevent.

import { cn } from './cn'

/** The mark. A hollow ring rather than a filled dot: filled reads as a status light, and this is
 * a footnote about the product rather than a state of the thing beside it. */
export function NotBuiltMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-block size-icon-xs shrink-0 rounded-pill border border-current opacity-70',
        className,
      )}
    />
  )
}

/** Said once at the top of a surface where NOTHING is available, instead of on all fourteen
 * rows beneath it.
 *
 * A HEADING, NOT A CHIP, and not a row you can land on: it describes the surface rather than
 * offering anything. Where a menu has some items live and some not, this does not appear at all
 * — the mark on the individual rows is the honest answer there. */
export function NotBuiltNote({ what = 'Not built yet' }: { what?: string }) {
  return (
    <p className="flex items-center gap-2 px-3 py-2 text-sm font-label text-ink-muted">
      <NotBuiltMark />
      {what}
    </p>
  )
}
