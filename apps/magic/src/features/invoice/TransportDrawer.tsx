// Delivery and transport: where the goods are going, and everything an E-Way Bill needs.
//
// ONE DOOR, THE LORRY. v2 retired the labelled button beside it and left the icon as the only
// way in, because this is filled on a minority of invoices and a labelled control for it sat
// in the header of every invoice that did not need it.
//
// BILL-TO AND SHIP-TO ARE THE SAME UNTIL THEY ARE NOT. The ship-to fields start as the party's
// own address and a switch parts them, rather than two address blocks side by side on the day
// nobody needs the second — which is what makes this a drawer and not a header row.
//
// THE E-WAY FIELDS ARE HERE AND NOT SOMEWHERE OF THEIR OWN. Turning E-Way on opens this drawer
// for whatever is missing, so there is one place the answers live and one place the person is
// sent back to. Which fields are mandatory is `E_WAY_NEEDS` in transport.ts, named once — and it
// is a guess until somebody rules on it, which is filed for stakeholders.

import { Button } from '@busy/ui/Button'
import { Drawer } from '@busy/ui/Drawer'
import { DrawerField, DrawerGrid, DrawerMore } from './DrawerField'
import { useInvoice } from './store'
import { ComplianceSwitches } from './ComplianceSwitches'
import { MODES, type TransportDetails } from './transport'

export function TransportDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const party = useInvoice((state) => state.party)
  // THE DRAFT LIVES IN THE STORE NOW. It was local, so nothing outside this drawer could ask
  // whether transport was filled in — and "turning E-Way on opens the drawer for whatever is
  // missing" is a question the ACTION BAR asks, which is nowhere near here.
  const draft = useInvoice((state) => state.transport)
  const setTransport = useInvoice((state) => state.setTransport)
  const setShipSeparately = useInvoice((state) => state.setShipSeparately)
  const separate = draft.shipSeparately

  const put = (key: keyof TransportDetails) => (value: string) => setTransport(key, value)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Delivery & Transport"
      footer={
        // THE TWO SWITCHES SIT IN THE BOTTOM LEFT CORNER (Aj, 25-08). They were mid-panel, in the
        // run of transport fields, where they read as two more things to fill in — and they are
        // not: they are a decision about the invoice, taken once the fields above them are filled.
        // The foot is where decisions live in every drawer this product has.
        //
        // THE HINT KEEPS ITS PLACE BESIDE Done rather than being moved out of the way. "Alt+V"
        // is wrong on a Mac, where that key is Option, and this feature deliberately does NOT
        // branch on the platform to fix it — a screen that works out what keyboard you are on is
        // a second place that answer is decided. Asked for on `Shortcut` in docs/owed.md.
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ComplianceSwitches />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink-secondary">Alt+V opens this</span>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      }
    >
      {/* THE SHIP-TO SAYS WHOSE IT IS BEFORE IT OFFERS TO CHANGE IT. "Same as the party" with
          the party's own name under it answers the question most people open this to ask, and
          the switch is for the minority who came to change it. */}
      <div className="mb-4 flex items-center justify-between gap-4 rounded-card border border-stroke bg-surface-sunken px-3 py-2">
        <div className="min-w-0">
          <p className="text-body text-ink">Shipping to the party's own address</p>
          <p className="truncate text-sm text-ink-secondary">{party?.name ?? 'No party chosen yet'}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShipSeparately(!separate)}>
          {separate ? 'Use the party address' : 'Ship somewhere else'}
        </Button>
      </div>

      {separate ? (
        <DrawerGrid>
          <DrawerField label="Ship to" value={draft.shipName} onChange={put('shipName')} />
          <DrawerField label="GSTIN" value={draft.shipGstin} onChange={put('shipGstin')} />
          <DrawerField label="Address" wide value={draft.shipAddress} onChange={put('shipAddress')} />
          <DrawerField label="Pin code" value={draft.shipPin} onChange={put('shipPin')} />
          <DrawerField label="Dispatch from" value={draft.dispatchFrom} onChange={put('dispatchFrom')} />
        </DrawerGrid>
      ) : null}

      <DrawerGrid>
        <DrawerField label="Transporter" value={draft.transporter} onChange={put('transporter')} />
        <DrawerField label="Vehicle number" value={draft.vehicle} onChange={put('vehicle')} placeholder="MP09 AB 1234" />
        <DrawerField label="Mode" value={draft.mode} onChange={put('mode')} options={MODES} />
        <DrawerField label="Distance (km)" value={draft.distance} onChange={put('distance')} align="end" />
      </DrawerGrid>

      <DrawerMore label="More for the E-Way Bill">
        <DrawerGrid>
          <DrawerField label="Transporter ID" value={draft.transporterId} onChange={put('transporterId')} />
          <DrawerField label="Lorry receipt no." value={draft.lorryReceipt} onChange={put('lorryReceipt')} />
        </DrawerGrid>
      </DrawerMore>

    </Drawer>
  )
}
