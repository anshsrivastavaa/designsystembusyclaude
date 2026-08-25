// Opening a saved invoice, which `?rows=N` stands in for until the modify screen exists.
//
// OUT OF CreateInvoice.tsx, which crossed the 250-line cap. The cap was right about which half had
// grown: the screen file arranges regions, and this is a conversation with the adapter about an
// invoice that already exists.
//
// IT IS ALSO THE ONLY PLACE THAT GOES AND ASKS WHAT THE ITEM STRIP NEEDS, and that is the reason
// it is worth its own file rather than three lines somewhere. Stock, the HSN, the rate and what a
// customer paid last time are facts about the ITEM MASTER, not about the line — so a row that
// arrives from the backend carries none of them, and the strip stayed blank on every line of every
// invoice anybody opened. Typing an item in filled it, which is why it looked right to everyone
// building it.

import { useEffect } from 'react'

import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import { useInvoice } from './store'

/** How many rows to open with. `?rows=2000` opens a saved invoice of that size, cold. */
export function requestedRows(): number | null {
  const asked = new URLSearchParams(window.location.search).get('rows')
  if (asked === null) return null
  const count = Number.parseInt(asked, 10)
  return Number.isFinite(count) && count > 0 ? count : null
}

export function useOpenRequested(
  onDone: (loading: boolean) => void,
  onRefused: (message: string) => void,
) {
  useEffect(() => {
    const count = requestedRows()
    if (count === null) return
    void data.getInvoice(String(count)).then((answer) => {
      onDone(false)
      if (isRefusal(answer)) {
        onRefused(answer.message)
        return
      }
      useInvoice.getState().load(answer.rows, answer.paidPaise)

      // ONE CALL FOR THE WHOLE INVOICE, not one per line. A fifty-line invoice must not be fifty
      // requests, and a search that happens to match is not an answer to "give me exactly these".
      const ids = [...new Set(answer.rows.map((row) => row.itemId).filter((id): id is string => id !== null))]
      if (ids.length === 0) return
      void data.itemsByIds(ids).then((items) => {
        if (!isRefusal(items)) useInvoice.getState().fillItemFacts(items)
      })
    })
    // ONCE, ON MOUNT, and the handlers are deliberately not listed. They are the screen's own
    // setState functions, which React keeps stable — and naming them would be a promise that this
    // re-runs when they change, which is a saved invoice being re-read while somebody types into
    // it. The store is reached through `getState` for the same reason.
  }, [onDone, onRefused])
}
