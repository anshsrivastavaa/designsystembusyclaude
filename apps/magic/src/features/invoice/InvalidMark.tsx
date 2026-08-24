// The mark on a cell that is wrong.
//
// The pink wash alone was never enough. It is a two per cent tint: under achromatopsia it
// flattens into the hovered-row tint, and under deuteranopia it reads as a faint cream that
// says nothing at all. This repository's rule is that colour is never the only signal, and a
// wash is only colour.
//
// A shape, in ink, so it survives with the colour removed entirely.

import { Icon } from '@busy/ui/Icon'

export function InvalidMark() {
  return (
    <Icon
      name="invalid"
      // Ink, not danger red. The wash behind the cell is already the colour signal; this is
      // the signal that survives greyscale, a projector, and the one man in twelve who cannot
      // separate those two reds. A second red here would be the same signal twice.
      className="ml-1 size-icon-sm shrink-0 text-ink"
      aria-hidden={undefined}
      role="img"
      aria-label="This value is wrong"
    />
  )
}
