// Standard / Large. It writes `data-density` onto the root element, which is the switch the
// whole token layer hangs off — every control height, row height and body size moves with it.
//
// IT IS THE Tabs PRIMITIVE, NOT A SECOND RADIO GROUP. It was hand-rolled here with a roving
// tabindex and NO arrow keys, which is the worst of both: only the chosen option is a tab stop,
// and nothing moves between them — so the option you were not on could not be reached from the
// keyboard at all. Tabs already solves exactly this and is tested for it. A control Aj demos
// should not be the one place the pattern is copied wrong.
//
// LARGE IS DENSITY, NOT ZOOM. The product document describes Large as the browser at 125%.
// It is not: zoom scales hairlines to fractional pixels and blurs them, and it scales the
// chrome as well as the content. Comfortable density measures 44px controls, 48px rows and
// 16px body text, which is also what makes the tablet build this build rather than a third
// codebase. The product document says otherwise and is being corrected, not followed.

import * as React from 'react'

import { Icon } from '@busy/ui/Icon'
import { Tabs } from '@busy/ui/Tabs'

type Density = 'standard' | 'comfortable'

// ICONS, NOT WORDS, and the words stay as the accessible name and the tooltip.
//
// FOUR BARS AGAINST THREE, IN THE SAME HEIGHT. The pair has to say "the same content, drawn
// looser or tighter" — not bigger text, not zoom, not a different view. Three candidates were
// drawn and Aj ruled this one: a gap that changes by two or three pixels is not legible at
// sixteen, and one bar more or fewer is. The outer extent of both drawings is identical, so
// what changes is the COUNT rather than the box, which is the difference between "more rows
// fit" and "a different view".
//
// The case AGAINST icons here, recorded rather than argued away:
// density is met once rather than constantly, it has no conventional icon, and the person who
// needs Large is usually the one who finds a dense grid hard to read and is therefore least
// likely to go hunting. The moment it gets revisited is named there — the first time we watch
// somebody use this screen who did not build it.
const OPTIONS = [
  { value: 'standard' as const, label: 'Standard', icon: <Icon name="densityStandard" /> },
  { value: 'comfortable' as const, label: 'Large', icon: <Icon name="densityComfortable" /> },
]

export function DensitySwitch() {
  const [density, setDensity] = React.useState<Density>('standard')

  // Written to the document rather than held on a wrapper, because the things that read it
  // include surfaces drawn through a portal — a popover, a drawer — which are not inside any
  // wrapper this component could put around the page.
  React.useEffect(() => {
    document.documentElement.setAttribute('data-density', density)
  }, [density])

  return <Tabs options={OPTIONS} value={density} onChange={setDensity} label="Display density" />
}
