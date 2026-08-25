// The invoices put aside, and which one to bring back.
//
// A CHOOSER ONLY WHEN THERE IS A CHOICE. With one held invoice Ctrl+H brings it straight back —
// asking somebody to pick from a list of one is a step that answers itself. With several it opens,
// because "the most recent" is a guess about which one they meant.
//
// NO COUNT BESIDE THE HOLD CONTROL (Aj). A badge saying "3" turns a control you press when you
// need it into a number you have to keep an eye on, and the number is only ever interesting at the
// moment you want one back — which is the moment this list is on the screen anyway.
//
// A DRAWER AND NOT A DIALOG. `Drawer` already owns the scrim, Escape and handing the keyboard
// back, and this codebase does not have a Dialog on purpose.

import { Button } from '@busy/ui/Button'
import { Drawer } from '@busy/ui/Drawer'
import { RemoveFromList } from './RemoveFromList'
import type { HeldInvoice } from '../../data/schema/held'

/** The time it was put aside, read the way somebody would say it. The DATE is only worth showing
 * when it is not today — a list of four things all stamped with today's date is four copies of
 * one fact. */
function when(heldAt: string, today: string): string {
  const at = new Date(heldAt)
  const clock = at.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return heldAt.slice(0, 10) === today ? clock : `${heldAt.slice(8, 10)}-${heldAt.slice(5, 7)} · ${clock}`
}

export function HeldInvoices({
  open,
  onClose,
  held,
  today,
  onResume,
  onDiscard,
}: {
  open: boolean
  onClose: () => void
  held: readonly HeldInvoice[]
  today: string
  onResume: (id: string) => void
  onDiscard: (id: string) => void
}) {
  return (
    <Drawer open={open} onClose={onClose} title="Invoices you put aside">
      {held.length === 0 ? (
        // Said in words. An empty drawer reads as one that has not finished loading.
        <p className="text-body text-ink-secondary">Nothing is being held right now.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {held.map((one) => (
            <li key={one.id} className="flex items-center gap-3 rounded-control px-2 py-2 hover:bg-surface-hover">
              <div className="min-w-0 flex-1">
                {/* WHO IT IS FOR AND HOW BIG IT IS, because a row reading "held at 14:32" tells
                    nobody which invoice it is. */}
                <p className="truncate text-body text-ink">{one.partyName}</p>
                <p className="truncate text-sm text-ink-secondary">
                  {one.lines} {one.lines === 1 ? 'line' : 'lines'} · {when(one.heldAt, today)}
                </p>
              </div>
              {/* DISCARD IS THE QUIET ONE AND BRING BACK IS THE LOUD ONE. Somebody opening this
                  came to resume; throwing one away is the rarer thing and reads as such. */}
              <RemoveFromList
                label={`Discard the held invoice for ${one.partyName}`}
                onRemove={() => onDiscard(one.id)}
              />
              <Button size="sm" onClick={() => onResume(one.id)}>
                Bring back
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  )
}
