// Putting an invoice aside and bringing one back.
//
// A HOOK RATHER THAN A SLICE, because none of this is invoice state: it is a conversation with the
// adapter about invoices that are NOT on the screen. Putting it in the invoice store would have
// made "what am I editing" and "what have I got in the drawer" one object, and `reset` would then
// have had an opinion about the second.
//
// CTRL+H IS THE WHOLE KEYBOARD PATH and it listens on the document, in the capture phase, for the
// same reason F2 does: it has to mean the same thing wherever the keyboard is, including inside
// the item grid. It steps aside inside a drawer, which is a job you are in the middle of.

import { useCallback, useEffect, useState } from 'react'

import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import type { HeldInvoice } from '../../data/schema/held'
import type { Party } from '../../data/schema/party'
import { actionFor } from '../../lib/shortcuts'
import { draftFromStore } from './invoiceDraft'
import { useInvoice } from './store'

export function useHolding(onMessage: (message: string) => void) {
  const restore = useInvoice((state) => state.restore)
  const [held, setHeld] = useState<HeldInvoice[]>([])
  const [choosing, setChoosing] = useState(false)

  const refresh = useCallback(async () => {
    const answer = await data.listHeld()
    if (!isRefusal(answer)) setHeld(answer)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  /** Put the invoice on the screen aside and start a fresh one. */
  const hold = useCallback(async () => {
    const built = draftFromStore()
    // NOTHING TO HOLD IS NOT AN ERROR, it is an empty invoice. Saying so beats a control that
    // appears to do nothing.
    if (built === null) {
      onMessage('There is nothing on this invoice to put aside yet.')
      return
    }
    const answer = await data.holdInvoice(built.draft)
    if (isRefusal(answer)) {
      onMessage(answer.message)
      return
    }
    useInvoice.getState().reset()
    onMessage(`Put aside for ${answer.partyName}.`)
    await refresh()
  }, [onMessage, refresh])

  const resume = useCallback(
    async (id: string, party: Party | null) => {
      const answer = await data.resumeHeld(id)
      if (isRefusal(answer)) {
        onMessage(answer.message)
        return
      }
      // The PARTY is not on the draft as an object, only as an id and a name — a draft carries
      // what gets sent, and the screen needs somebody to put in the field. What is known about
      // them beyond the name comes back from the party list; until then the name is enough to
      // show, which is what the draft carries.
      // IT SAYS SO WHEN IT ARRIVES. Without this the bar was still reading "Put aside for Sharma
      // Traders." while that very invoice was back on the screen — a line of text reporting a
      // state it is not in, which is the same fault as a control doing it.
      onMessage(`Brought back for ${answer.partyName}.`)
      restore(answer.draft, party ?? { id: answer.draft.partyId, name: answer.draft.partyName, mobile: '', gstin: '', city: '', outstandingPaise: 0, trustGrade: null, creditLimitPaise: 0, creditDays: 0, overduePaise: 0, paysAtCounter: false, gstinStatus: 'unchecked' })
      setChoosing(false)
      await refresh()
    },
    [onMessage, refresh, restore],
  )

  const discard = useCallback(
    async (id: string) => {
      await data.discardHeld(id)
      await refresh()
    },
    [refresh],
  )

  // WITH ONE HELD IT COMES STRAIGHT BACK; with several the chooser opens, because "the most
  // recent" is a guess about which one they meant.
  useEffect(() => {
    const bring = (event: KeyboardEvent) => {
      if (actionFor(event, 'global') !== 'resume-held') return
      if (document.activeElement?.closest('[role="dialog"]') != null) return
      event.preventDefault()
      if (held.length === 0) {
        onMessage('Nothing is being held right now.')
        return
      }
      if (held.length === 1 && held[0] !== undefined) {
        void resume(held[0].id, null)
        return
      }
      setChoosing(true)
    }
    document.addEventListener('keydown', bring, true)
    return () => document.removeEventListener('keydown', bring, true)
  }, [held, onMessage, resume])

  return { held, choosing, setChoosing, hold, resume, discard }
}
