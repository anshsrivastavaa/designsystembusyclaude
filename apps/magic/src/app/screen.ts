// Which screen is open, and the address bar agreeing with it.
//
// THIS IS NOT A ROUTER AND IT IS NOT PRETENDING TO BE ONE. It is the small part of a router
// that this application was missing: the address changed only when somebody typed it, so the
// first click on New moved the screen and left the address on the listing. From there the back
// button did nothing at all — the browser had nowhere to go back to — and a refresh reopened
// whichever screen the stale address named. Both are the plainest kind of broken promise: the
// controls are right there at the top of the window and they lie.
//
// A router library for three screens is still more machinery than the problem, and the stack is
// fixed in architecture.md — adding one is a decision for Aj, not a thing to slip into a fix.
// WHEN IT STOPS PAYING: the day Modify needs the invoice id in the PATH rather than the query.
// `/invoice/:id` is a route carrying a parameter, and a path parameter is where hand-rolling
// turns into re-implementing a router badly — pattern matching, nested segments and the code
// splitting that comes with them. Today the id rides in `?screen=invoice&id=…`, which needs none
// of it.
//
// It does NOT make a refresh keep an unsaved invoice. That is a draft that lives in memory, and
// keeping it is a feature with its own decisions — where it is stored, when it is cleared, what
// happens when two tabs are open. This gets you back to the right SCREEN, which is the part
// that was silently wrong.

import { useCallback, useEffect, useState } from 'react'

export type Screen = 'listing' | 'create' | 'invoice'

/** Which screen an address asks for.
 *
 * The listing is the front door — it is where a working day starts — so a bare address is the
 * listing. `?rows=N` already meant "open the item grid with this many rows" before there was a
 * second screen, and it is how the grid is measured; it can only mean the create screen, so it
 * says so on its own rather than needing `screen=create` written beside it everywhere. An
 * explicit `screen` always wins, which is what lets the rail take you back to the listing from
 * an address that still carries `rows`. */
export function screenFor(search: string): Screen {
  const query = new URLSearchParams(search)
  const named = query.get('screen')
  if (named === 'create' || named === 'listing' || named === 'invoice') return named
  return query.has('rows') ? 'create' : 'listing'
}

/** Which invoice an address is opening, if it is opening one.
 *
 * An id with no screen named beside it is not enough to open anything: `?id=` on its own would
 * open the listing, and an invoice screen with no invoice is a blank screen with a spinner on
 * it forever. So this answers null unless the address actually asks for the invoice screen. */
export function invoiceIdFor(search: string): string | null {
  if (screenFor(search) !== 'invoice') return null
  const id = new URLSearchParams(search).get('id')
  return id === null || id === '' ? null : id
}

/** The same address with the screen named on it, and every other parameter left alone — the
 * test switches for tax mode, the owner's view and the readonly flag all ride in the query and
 * navigating must not throw them away. The invoice id is the exception: it belongs to the
 * invoice screen, so leaving that screen takes it off rather than leaving it lying about to be
 * picked up by the next thing that looks for one. */
export function addressFor(search: string, screen: Screen, id?: string): string {
  const query = new URLSearchParams(search)
  query.set('screen', screen)
  if (screen === 'invoice' && id !== undefined) query.set('id', id)
  else query.delete('id')
  return `?${query.toString()}`
}

export type Navigation = {
  screen: Screen
  /** The invoice being opened, or null on every other screen. */
  invoiceId: string | null
  go: (next: Screen, id?: string) => void
}

/** The open screen, and a way to change it that the back button can follow. */
export function useScreen(): Navigation {
  const [search, setSearch] = useState(() => window.location.search)

  // The browser walking through its own history — back, forward, or a bookmark in the same
  // document. Without this the address moves and the screen does not, which is the same fault
  // as before wearing the other coat.
  //
  // The whole query string is held rather than just the screen name, because the invoice id
  // rides in it and going back from one invoice to another has to bring its id along.
  useEffect(() => {
    const follow = () => setSearch(window.location.search)
    window.addEventListener('popstate', follow)
    return () => window.removeEventListener('popstate', follow)
  }, [])

  // STABLE ACROSS RENDERS, because the listing builds its columns from it and a new function
  // every render would rebuild them every render — which is the work the pipeline was just
  // memoised to stop doing. It closes over nothing: the address is read at the moment it is
  // called, not at the moment it is made.
  const go = useCallback((next: Screen, id?: string) => {
    const address = addressFor(window.location.search, next, id)
    if (address === window.location.search) return
    window.history.pushState(null, '', address)
    setSearch(address)
  }, [])

  return { screen: screenFor(search), invoiceId: invoiceIdFor(search), go }
}
