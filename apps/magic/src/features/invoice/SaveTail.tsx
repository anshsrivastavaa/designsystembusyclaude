// Save, as a split button: a face that always saves, and a caret that opens what happens around it.
//
// PLACEMENT, NOT A REVERSAL (Aj, 25-08). Everything the tail DOES is unchanged and
// `DECISIONS.md`'s 25-08 entry still stands: switches rather than a menu of rows, the ordered
// chain, a failure that leaves the invoice saved and never re-sends it. What changed is where the
// controls live. They were loose in the footer beside Save; they are the button's own second half
// now.
//
// THE FACE ALWAYS SAVES AND NEVER RENAMES ITSELF. That is the whole reason it can be a split
// button at all: a primary action that reads differently depending on what was last chosen is the
// menu-of-rows fault wearing a caret. It says "Save", it saves, and what is switched on behind the
// caret decides what happens ALONGSIDE that — which copies go out, and where you land.
//
// WHERE YOU LAND MOVED IN HERE WITH THEM. It was a second button reading "Save & go to the
// listing", which made two primary actions on one bar; it is a choice in the configuration now,
// and the face is the only thing anybody presses.

import { useRef, useState } from 'react'

import { Button } from '@busy/ui/Button'
import { Icon } from '@busy/ui/Icon'
import { Popover } from '@busy/ui/Popover'
import { Shortcut } from '@busy/ui/Shortcut'
import { Tabs } from '@busy/ui/Tabs'
import { Toggle } from '@busy/ui/Toggle'
import type { IconName } from '@busy/ui/Icon'

import type { Landing, SenderSwitches } from './afterSave'

/** The three the operator chooses. E-invoice and e-way are not here: they are compliance rather
 * than a copy of the document, they have their own switches on the bar, and they run first. */
const SENDERS: { key: keyof SenderSwitches; icon: IconName; name: string; label: string }[] = [
  // The NAME is what sits under the glyph; the LABEL is what a screen reader says, and it carries
  // the name inside it — a spoken name that does not contain the visible word is the failure
  // WCAG 2.5.3 is about, and it breaks anybody driving the screen by voice.
  { key: 'print', icon: 'printer', name: 'Print', label: 'Print after saving' },
  { key: 'email', icon: 'email', name: 'Email', label: 'Email after saving' },
  { key: 'whatsapp', icon: 'whatsapp', name: 'WhatsApp', label: 'WhatsApp after saving' },
]

const LANDINGS = [
  { value: 'new' as const, label: 'A new invoice' },
  { value: 'listing' as const, label: 'The listing' },
]

export function SaveTail({
  switches,
  onSwitch,
  landing,
  onLanding,
  onSave,
  saving,
}: {
  switches: SenderSwitches
  onSwitch: (key: keyof SenderSwitches, on: boolean) => void
  landing: Landing
  onLanding: (landing: Landing) => void
  onSave: () => void
  saving: boolean
}) {
  const caret = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ONE CONTROL IN TWO HALVES, and the seam is a hairline of the bar showing between them
          rather than a border. A border on an accent fill has to be a colour nobody chose. */}
      <div className="flex items-stretch">
        <Button size="lg" aria-busy={saving} onClick={onSave} className="rounded-r-none">
          {saving ? 'Saving…' : 'Save'}
          {/* F2 RUNS THE FACE, which is what makes the badge honest — see sectionWalk.ts. It sits
              ON the filled button rather than on the page, which is what `strong` is for. */}
          <Shortcut keyName="F2" tone="strong" className="ml-1" />
        </Button>
        <Button
          ref={caret}
          size="lg"
          aria-label="What happens when you save"
          aria-expanded={open}
          onClick={() => setOpen((was) => !was)}
          className="ml-px rounded-l-none px-3"
        >
          <Icon name="chevronDown" className={`size-icon-sm ${open ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={caret} align="end" label="What happens when you save">
        <div className="flex w-72 flex-col gap-4 p-4">
          <section>
            <h3 className="mb-2 text-caps font-strong tracking-wide text-ink-secondary uppercase">Send a copy</h3>
            <div className="flex items-start gap-2">
              {SENDERS.map(({ key, icon, name, label }) => (
                <Toggle
                  key={key}
                  look="icon"
                  icon={icon}
                  checked={switches[key]}
                  onCheckedChange={(on) => onSwitch(key, on)}
                  aria-label={label}
                  // A step wider than the primitive's own, because "WhatsApp" does not fit in it
                  // and came out as "Whats…". A truncated name on a switch is a switch that does
                  // not say what it does, and the word is the product's.
                  className="w-20"
                >
                  {name}
                </Toggle>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-caps font-strong tracking-wide text-ink-secondary uppercase">Then go to</h3>
            {/* BOTH ARE REAL CHOICES somebody makes every day — a counter operator lands on a new
                invoice, an office one goes back to the listing — so this is a choice and not a
                default with an escape hatch. */}
            <Tabs look="tray" label="Where to go after saving" value={landing} onChange={onLanding} options={LANDINGS} />
          </section>
        </div>
      </Popover>
    </>
  )
}
