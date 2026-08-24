// Everything the grid reads from the store, read ONCE.
//
// Its own file because it is the answer to a measurement rather than a tidy-up. Cells used to
// subscribe to the store eleven times each; at two thousand rows and ten columns that is over a
// hundred thousand live subscriptions, and Zustand runs every one of their selectors on every
// `set()`. One arrow key cost 1.6 seconds of pure script — with 1.5ms of layout in it, which is
// why every guess aimed at layout was aimed at the wrong thing.
//
// Gathered here, handed down as props. All of it is stable, so memo() on a row finally holds.

import { useMemo } from 'react'

import { useInvoice } from './store'

export function useGridHands() {
  const moveTo = useInvoice((state) => state.moveTo)
  const gridEngaged = useInvoice((state) => state.gridEngaged)
  const cursorClaim = useInvoice((state) => state.cursorClaim)
  const itemFacts = useInvoice((state) => state.itemFacts)
  const readOnlyColumns = useInvoice((state) => state.readOnlyColumns)
  const setCell = useInvoice((state) => state.setCell)
  const applyItem = useInvoice((state) => state.applyItem)
  const setItemText = useInvoice((state) => state.setItemText)
  const askFor = useInvoice((state) => state.askFor)

  // ONE OBJECT, MADE ONCE. Every one of these is stable in Zustand, so the memo holds and a
  // row's props stop changing — which is what makes memo() worth having at all.
  const hands = useMemo(
    () => ({
      moveTo, setCell,
      applyItem, setItemText, askFor, readOnlyColumns,
    }),
    [moveTo, setCell, applyItem, setItemText, askFor, readOnlyColumns],
  )


  return { hands, gridEngaged, cursorClaim, itemFacts }
}
