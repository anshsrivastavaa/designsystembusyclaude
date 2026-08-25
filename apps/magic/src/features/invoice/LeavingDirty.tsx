// Leaving an invoice with something on it: Save, Hold or Discard.
//
// THREE ANSWERS, NOT TWO, and the third is the one that makes it worth building. "I am not
// finished and do not want to lose this" is the commonest reason somebody backs out of an
// invoice, and a Save/Discard pair has no answer to it — so people pick Save, and the books fill
// up with half-finished invoices nobody meant to raise.
//
// A DRAWER AND NOT A DIALOG. `Drawer` already owns the scrim, Escape and handing the keyboard
// back, and this codebase deliberately has no Dialog. Escape means "I did not mean to leave",
// which is the safe answer and is what closing does.
//
// IT ONLY APPEARS WHEN THERE IS SOMETHING TO LOSE. A blank invoice leaves without a word — a
// prompt on the way out of an empty screen is a control that has never once been useful.

import { Button } from '@busy/ui/Button'
import { Drawer } from '@busy/ui/Drawer'

export function LeavingDirty({
  open,
  onStay,
  onSave,
  onHold,
  onDiscard,
}: {
  open: boolean
  onStay: () => void
  onSave: () => void
  onHold: () => void
  onDiscard: () => void
}) {
  return (
    <Drawer
      open={open}
      onClose={onStay}
      title="This invoice has something on it"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* DISCARD IS A GHOST AND IT IS NOT RED. There is no `destructive` variant in this
              product on purpose: colour is for exceptions, and a red control on one of three
              ordinary answers spends the alarm colour on the least alarming thing on the screen.
              It reads as destructive because of what it says. */}
          <Button variant="ghost" onClick={onDiscard}>
            Discard it
          </Button>
          <Button variant="ghost" onClick={onStay}>
            Stay here
          </Button>
          <Button variant="outline" onClick={onHold}>
            Put it aside
          </Button>
          <Button onClick={onSave}>Save it</Button>
        </div>
      }
    >
      <p className="text-body text-ink">
        Choose what happens to it before you go. Putting it aside keeps it exactly as it is, and
        Ctrl+H brings it back.
      </p>
    </Drawer>
  )
}
