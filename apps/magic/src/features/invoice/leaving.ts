// What happens when somebody tries to leave an invoice that has something on it.
//
// OUT OF CreateInvoice.tsx, which crossed the 250-line cap. The cap was right about which half had
// grown: the screen is an arrangement of regions, and this is a conversation about all of them at
// once — is there anything here, and what should become of it.
//
// THREE ANSWERS, NOT TWO. "I am not finished and do not want to lose this" is the commonest reason
// somebody backs out of an invoice, and a Save/Discard pair has no answer to it — so people pick
// Save, and the books fill with half-finished invoices nobody meant to raise.
//
// IT ONLY ASKS WHEN THERE IS SOMETHING TO LOSE. A blank invoice leaves without a word; a prompt on
// the way out of an empty screen is a control that has never once been useful.

import { useCallback, useState, type RefObject } from 'react'

import { draftFromStore } from './invoiceDraft'
import { useInvoice } from './store'

export type Leaving = {
  asking: boolean
  /** The back control's handler. Leaves straight away when there is nothing on the invoice. */
  tryToLeave: () => void
  stay: () => void
  saveAndGo: () => void
  holdAndGo: () => void
  discardAndGo: () => void
}

export function useLeaving(
  saveNow: RefObject<(() => void) | null>,
  holdNow: RefObject<(() => void) | null>,
  onBack: (() => void) | undefined,
): Leaving {
  const [asking, setAsking] = useState(false)
  const go = useCallback(() => onBack?.(), [onBack])

  return {
    asking,
    tryToLeave: useCallback(() => {
      // WHAT COUNTS AS "SOMETHING ON IT" IS THE SAME QUESTION SAVE ASKS, asked in the same place:
      // a party and at least one line. Two answers to "is this an invoice yet" is two places to
      // disagree about it.
      if (draftFromStore() === null) {
        go()
        return
      }
      setAsking(true)
    }, [go]),
    stay: useCallback(() => setAsking(false), []),
    // SAVE DOES NOT LEAVE HERE. Where a save lands is the save configuration's answer, and it may
    // be "a new invoice" — so this hands over to Save and lets it do what it was told to do.
    saveAndGo: useCallback(() => { setAsking(false); saveNow.current?.() }, [saveNow]),
    holdAndGo: useCallback(() => { setAsking(false); holdNow.current?.(); go() }, [holdNow, go]),
    discardAndGo: useCallback(() => { setAsking(false); useInvoice.getState().reset(); go() }, [go]),
  }
}
