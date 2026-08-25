// The application: the shell, and whichever screen is open inside it.
//
// There is no router yet and this is not one. It holds which screen is showing, because the
// two screens have to be able to reach each other — a listing whose New button opens nothing
// is a listing nobody can believe. When routing arrives it replaces this and nothing inside
// either screen moves. Which screen, and keeping the address bar honest about it, is decided
// in screen.ts.
//
// THE WAY BACK IS THE RAIL, NOT A BUTTON ON THE CREATE SCREEN. Create Invoice takes no props
// and belongs to the other session, so this cannot reach into it for a Cancel — and it should
// not: getting back to a listing is navigation, and navigation is the shell's job. Pressing
// Sales in the rail returns to the listing from anywhere.

import { useCallback, useEffect, useRef, useState } from 'react'

import { focusable } from '../lib/focusable'
import { CreateInvoice } from '../features/invoice/CreateInvoice'
import { InvoiceListing } from '../features/listing/InvoiceListing'
import { AppShell } from './AppShell'
import { InvoiceNotBuilt } from './InvoiceNotBuilt'
import { Settings } from './Settings'
import { useScreen } from './screen'
import { useSettings } from './settingsStore'
import { invoiceSettingsFrom } from '../lib/invoiceSettingsFrom'

/** The company's own state code, until a company screen sets it. */
const COMPANY_STATE = '23'

export function App() {
  const { screen, invoiceId, go } = useScreen()
  // Held steady, because the listing builds its columns from `onOpen` — a fresh arrow on every
  // render would rebuild every column on every render.
  const openListing = useCallback(() => go('listing'), [go])
  const openCreate = useCallback(() => go('create'), [go])
  const openInvoice = useCallback((id: string) => go('invoice', id), [go])
  // THE DRAWER IS HELD HERE AND THE DOOR IS ON THE INVOICE. It opened from a gear in the top
  // bar, which made every screen advertise a drawer only one of them can act on — v2 puts it on
  // the invoice's own header and Aj has ruled the same. The drawer stays in app/ because the
  // shell is what reads its answers and hands them to the screen; only the way in moved.
  const [settingsOpen, setSettingsOpen] = useState(false)
  // The shell reads the drawer's answers and hands the screen what it needs, rather than the
  // screen reaching into a store the chrome owns.
  const settings = invoiceSettingsFrom(useSettings((state) => state.values), COMPANY_STATE)

  // A SCREEN CHANGE HANDS THE KEYBOARD ON. Pressing Back takes the invoice away while it is
  // holding the keyboard, and the keyboard falls on the page body — every key after that goes
  // nowhere, on a screen that looks perfectly normal. The invoice's own net cannot catch this
  // one: the net is bound to the invoice, and the invoice is the thing that just left.
  //
  // ONLY WHEN IT IS GENUINELY LOST. The invoice puts the cursor in the party field itself, and
  // a screen that places its own keyboard must not be overruled by the shell — which is why
  // this waits for the arriving screen's own effects rather than running before them.
  // AND NOT ON THE FIRST LOAD. Arriving at the page is not the keyboard being lost — it is the
  // keyboard exactly where the browser put it, at the top of the document, which is where the
  // skip link is. Running this on mount moved it past eleven controls into the screen and made
  // the skip link unreachable: Tab from there goes forwards, never back. A screen CHANGE is the
  // case this was written for, and it still catches that.
  const arrivedOnce = useRef(false)
  useEffect(() => {
    if (!arrivedOnce.current) {
      arrivedOnce.current = true
      return
    }
    if (document.activeElement !== null && document.activeElement !== document.body) return
    const arrived = document.querySelector('main')
    if (arrived instanceof HTMLElement) focusable(arrived)[0]?.focus()
  }, [screen])

  return (
    <AppShell onOpenSales={openListing}>
      {screen === 'listing' ? (
        <InvoiceListing onCreate={openCreate} onOpen={openInvoice} />
      ) : screen === 'invoice' ? (
        // The way in is built and the screen behind it is not. It says so, names the invoice it
        // was asked for, and offers the way back — rather than a link that does nothing, which
        // is what a stakeholder pressing a number on the listing met before this.
        <InvoiceNotBuilt invoiceId={invoiceId} onBackToListing={openListing} />
      ) : (
        <CreateInvoice
          settings={settings}
          onOpenSettings={() => setSettingsOpen(true)}
          // The grid's column setup writes here. The shell owns the store; the screen owns the
          // control that changes it, and neither owns a second copy.
          onSetColumn={(id, on) => useSettings.getState().set(id, on)}
          onBack={() => go('listing')}
        />
      )}
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </AppShell>
  )
}
